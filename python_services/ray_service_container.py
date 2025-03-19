"""
Ray Service Container

A framework for creating Ray-powered Python microservices that can be called from Node.js
"""

import ray
import zmq
import json
import signal
import threading
import time
import traceback
import logging
from typing import Dict, Callable, Any, Optional, List, Union
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)

# Initialize Ray (connect to existing cluster or start locally)
try:
    ray.init(address='auto', ignore_reinit_error=True)
except:
    ray.init(ignore_reinit_error=True)
    logging.info("Started a new local Ray cluster")


@ray.remote
class RayWorker:
    """A Ray Actor that executes methods remotely"""
    
    def __init__(self, service_name: str, worker_id: int):
        """Initialize a new Ray worker
        
        Args:
            service_name: Name of the parent service
            worker_id: Unique ID for this worker
        """
        self.service_name = service_name
        self.worker_id = worker_id
        self.methods = {}
        self.executed_tasks = 0
        self.start_time = time.time()
        
        # Configure logger
        self.logger = logging.getLogger(f"ray-worker-{service_name}-{worker_id}")
    
    def register_methods(self, methods_dict: Dict[str, Callable]) -> bool:
        """Register methods to be available for execution
        
        Args:
            methods_dict: Dictionary mapping method names to callables
            
        Returns:
            bool: True if successful
        """
        self.methods = methods_dict.copy()
        return True
    
    async def execute(self, method_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a method
        
        Args:
            method_name: Name of the method to execute
            params: Parameters to pass to the method
            
        Returns:
            Dict containing the result or error
        """
        if method_name not in self.methods:
            return {
                "error": f"Method '{method_name}' not found on worker {self.worker_id}",
                "code": "method_not_found"
            }
        
        try:
            start_time = time.time()
            method = self.methods[method_name]
            
            # Execute method
            if isinstance(params, dict):
                result = method(**params)
            else:
                result = method()
                
            end_time = time.time()
            execution_time = end_time - start_time
            
            self.executed_tasks += 1
            
            return {
                "result": result,
                "execution_time": execution_time,
                "worker_id": self.worker_id
            }
        except Exception as e:
            error_info = traceback.format_exc()
            self.logger.error(f"Error executing {method_name}: {error_info}")
            
            return {
                "error": str(e),
                "code": "execution_error",
                "traceback": error_info,
                "worker_id": self.worker_id
            }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get worker statistics
        
        Returns:
            Dict containing worker statistics
        """
        uptime = time.time() - self.start_time
        return {
            "worker_id": self.worker_id,
            "executed_tasks": self.executed_tasks,
            "uptime_seconds": uptime,
            "service_name": self.service_name,
            "methods": list(self.methods.keys())
        }


class RayServiceContainer:
    """Container for Ray-powered Python microservices with ZeroMQ communication"""
    
    def __init__(self, service_name: str, port: int, num_workers: int = 2, log_level: str = "INFO"):
        """
        Initialize a new Ray service container
        
        Args:
            service_name: Name of the service
            port: Port to listen on for ZeroMQ communication
            num_workers: Number of Ray workers to spawn
            log_level: Logging level (DEBUG, INFO, WARNING, ERROR)
        """
        self.service_name = service_name
        self.port = port
        self.num_workers = num_workers
        
        # Configure logger
        self.logger = logging.getLogger(f"ray-service-{service_name}")
        self.logger.setLevel(getattr(logging, log_level))
        
        # Initialize ZeroMQ context and sockets
        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.REP)
        self.heartbeat_socket = self.context.socket(zmq.PUB)
        
        # Internal state
        self.methods: Dict[str, Callable] = {}
        self.workers: List[ray.ObjectRef] = []
        self.worker_index = 0  # For round-robin scheduling
        self.running = False
        self.start_time = time.time()
        
        # Initialize stats tracking
        self.stats = {
            "requests": 0,
            "errors": 0,
            "avg_response_time": 0.0,
            "total_response_time": 0.0
        }
        
        # Add built-in methods
        self._register_builtin_methods()
        
        # Register signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._shutdown_handler)
        signal.signal(signal.SIGTERM, self._shutdown_handler)
    
    def register_method(self, name: str, method: Callable) -> None:
        """
        Register a method to be exposed via the service
        
        Args:
            name: Name of the method
            method: Function to call when the method is invoked
        """
        if name.startswith('_'):
            self.logger.warning(f"Method names starting with '_' are reserved: {name}")
            return
            
        self.methods[name] = method
        self.logger.debug(f"Registered method: {name}")
    
    def _register_builtin_methods(self) -> None:
        """Register built-in methods"""
        self.methods["_get_methods"] = self._get_methods
        self.methods["_get_stats"] = self._get_stats
        self.methods["_ping"] = self._ping
        self.methods["_get_worker_stats"] = self._get_worker_stats
    
    def _get_methods(self) -> Dict[str, Any]:
        """Return information about available methods"""
        methods = {}
        for name, func in self.methods.items():
            if not name.startswith('_'):  # Don't expose internal methods
                methods[name] = {
                    "name": name,
                    "doc": func.__doc__ or "No documentation available"
                }
        return methods
    
    def _get_stats(self) -> Dict[str, Any]:
        """Return service statistics"""
        uptime = time.time() - self.start_time
        return {
            "service": self.service_name,
            "uptime": uptime,
            "uptime_formatted": self._format_uptime(uptime),
            "requests": self.stats["requests"],
            "errors": self.stats["errors"],
            "avg_response_time": self.stats["avg_response_time"],
            "methods": list(self.methods.keys()),
            "num_workers": len(self.workers),
            "ray_cluster": ray.cluster_resources()
        }
    
    async def _get_worker_stats(self) -> List[Dict[str, Any]]:
        """Return statistics for all workers"""
        stats_refs = [worker.get_stats.remote() for worker in self.workers]
        return await ray.get(stats_refs)
    
    def _ping(self) -> Dict[str, Any]:
        """Simple ping method for testing connectivity"""
        return {
            "service": self.service_name,
            "timestamp": datetime.now().isoformat(),
            "status": "ok",
            "ray_cluster": True,
            "workers": len(self.workers)
        }
    
    def _format_uptime(self, seconds: float) -> str:
        """Format uptime in human-readable form"""
        days, remainder = divmod(seconds, 86400)
        hours, remainder = divmod(remainder, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{int(days)}d {int(hours)}h {int(minutes)}m {int(seconds)}s"
    
    def _round_robin_worker(self) -> ray.ObjectRef:
        """Get the next worker in round-robin fashion"""
        worker = self.workers[self.worker_index]
        self.worker_index = (self.worker_index + 1) % len(self.workers)
        return worker
    
    async def _initialize_workers(self) -> None:
        """Initialize Ray workers"""
        self.logger.info(f"Initializing {self.num_workers} Ray workers...")
        
        # Create workers
        self.workers = [RayWorker.remote(self.service_name, i) for i in range(self.num_workers)]
        
        # Register methods with each worker
        registration_refs = [
            worker.register_methods.remote(
                {name: method for name, method in self.methods.items() if not name.startswith('_')}
            ) 
            for worker in self.workers
        ]
        
        # Wait for registration to complete
        results = await ray.get(registration_refs)
        if all(results):
            self.logger.info(f"All {self.num_workers} workers initialized successfully")
        else:
            self.logger.error("Some workers failed to initialize")
    
    async def start(self) -> None:
        """Start the service container"""
        try:
            # Bind sockets
            self.socket.bind(f"tcp://*:{self.port}")
            self.heartbeat_socket.bind(f"tcp://*:{self.port+1}")
            
            # Initialize Ray workers
            await self._initialize_workers()
            
            self.running = True
            self.logger.info(f"Service {self.service_name} starting on port {self.port}")
            
            # Start heartbeat thread
            self.heartbeat_thread = threading.Thread(target=self._send_heartbeats, daemon=True)
            self.heartbeat_thread.start()
            
            # Start request processing
            await self._process_requests()
        except Exception as e:
            self.logger.error(f"Failed to start service: {e}")
            await self._shutdown()
    
    async def _process_requests(self) -> None:
        """Main request processing loop"""
        while self.running:
            try:
                # Wait for request
                message = self.socket.recv_string()
                request_start = time.time()
                
                # Parse request
                try:
                    request = json.loads(message)
                except json.JSONDecodeError:
                    self._send_error_response("Invalid JSON", "parse_error", None)
                    continue
                
                method_name = request.get('method')
                params = request.get('params', {})
                request_id = request.get('id', 'unknown')
                
                self.logger.debug(f"Received request: {method_name} (ID: {request_id})")
                
                # Increment request counter
                self.stats["requests"] += 1
                
                # Handle built-in methods directly
                if method_name.startswith('_') and method_name in self.methods:
                    try:
                        method = self.methods[method_name]
                        if asyncio.iscoroutinefunction(method):
                            result = await method()
                        else:
                            result = method()
                        self._send_success_response(result, request_id)
                    except Exception as e:
                        self.stats["errors"] += 1
                        error_info = traceback.format_exc()
                        self.logger.error(f"Error in built-in method: {error_info}")
                        self._send_error_response(str(e), "execution_error", request_id)
                    continue
                
                # Check if method exists
                if method_name not in self.methods:
                    self._send_error_response(
                        f"Method '{method_name}' not found", 
                        "method_not_found",
                        request_id
                    )
                    continue
                
                # Delegate to Ray worker
                try:
                    worker = self._round_robin_worker()
                    result_ref = worker.execute.remote(method_name, params)
                    result_dict = await ray.get(result_ref)
                    
                    if 'error' in result_dict:
                        self.stats["errors"] += 1
                        self._send_error_response(
                            result_dict['error'],
                            result_dict.get('code', 'execution_error'),
                            request_id
                        )
                    else:
                        # Send response
                        self._send_success_response(result_dict['result'], request_id)
                except Exception as e:
                    self.stats["errors"] += 1
                    error_info = traceback.format_exc()
                    self.logger.error(f"Error processing request: {error_info}")
                    self._send_error_response(str(e), "execution_error", request_id)
                
                # Update timing stats
                request_duration = time.time() - request_start
                self.stats["total_response_time"] += request_duration
                self.stats["avg_response_time"] = (
                    self.stats["total_response_time"] / self.stats["requests"]
                )
                
            except Exception as e:
                self.logger.error(f"Error in request processing loop: {e}")
                if self.running:
                    # Sleep briefly to avoid tight loop in case of persistent errors
                    time.sleep(0.1)
    
    def _send_success_response(self, result: Any, request_id: str) -> None:
        """Send a success response"""
        response = {
            'result': result,
            'id': request_id
        }
        self.socket.send_string(json.dumps(response))
    
    def _send_error_response(self, error_message: str, error_code: str, request_id: Optional[str]) -> None:
        """Send an error response"""
        response = {
            'error': {
                'message': error_message,
                'code': error_code
            },
            'id': request_id
        }
        self.socket.send_string(json.dumps(response))
    
    def _send_heartbeats(self) -> None:
        """Send periodic heartbeats with service metadata"""
        while self.running:
            try:
                heartbeat = {
                    'service': self.service_name,
                    'status': 'alive',
                    'timestamp': time.time(),
                    'methods': [m for m in self.methods.keys() if not m.startswith('_')],
                    'port': self.port,
                    'requests': self.stats["requests"],
                    'uptime': time.time() - self.start_time,
                    'ray': True,
                    'workers': len(self.workers)
                }
                self.heartbeat_socket.send_string(json.dumps(heartbeat))
                time.sleep(5)  # Send heartbeat every 5 seconds
            except Exception as e:
                self.logger.error(f"Error sending heartbeat: {e}")
                time.sleep(5)  # Wait before retrying
    
    def _shutdown_handler(self, signum: int, frame) -> None:
        """Handle shutdown signals"""
        self.logger.info(f"Received shutdown signal {signum}")
        asyncio.create_task(self._shutdown())
    
    async def _shutdown(self) -> None:
        """Gracefully shutdown the service"""
        if not self.running:
            return
            
        self.logger.info(f"Shutting down service {self.service_name}...")
        self.running = False
        
        try:
            # Close sockets
            self.socket.close(linger=1000)
            self.heartbeat_socket.close(linger=1000)
            
            # Close ZeroMQ context
            self.context.term()
            
            self.logger.info(f"Service {self.service_name} shut down successfully")
        except Exception as e:
            self.logger.error(f"Error during shutdown: {e}")


# Add asyncio support
import asyncio

if __name__ == "__main__":
    # Example usage
    async def main():
        service = RayServiceContainer("example-service", 5555, num_workers=2)
        
        # Register some example methods
        def add(a, b):
            return a + b
            
        def multiply(a, b):
            return a * b
            
        def heavy_computation(size=1000):
            import numpy as np
            # Do some CPU-intensive work
            matrix = np.random.rand(size, size)
            result = np.linalg.svd(matrix)
            return {
                "shape": matrix.shape,
                "result_shape": result[0].shape,
                "sum": float(np.sum(result[0]))
            }
        
        service.register_method("add", add)
        service.register_method("multiply", multiply)
        service.register_method("heavy_computation", heavy_computation)
        
        # Start the service
        await service.start()
    
    asyncio.run(main()) 