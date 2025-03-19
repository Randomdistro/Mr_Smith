"""
Python Service Container

A framework for creating ZeroMQ-based Python microservices that can be called from Node.js
"""

import zmq
import json
import signal
import threading
import time
import traceback
import logging
from typing import Dict, Callable, Any, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)

class PyServiceContainer:
    """Container for Python microservices with ZeroMQ communication"""
    
    def __init__(self, service_name: str, port: int, log_level: str = "INFO"):
        """
        Initialize a new Python service container
        
        Args:
            service_name: Name of the service
            port: Port to listen on
            log_level: Logging level (DEBUG, INFO, WARNING, ERROR)
        """
        self.service_name = service_name
        self.port = port
        
        # Configure logger
        self.logger = logging.getLogger(f"py-service-{service_name}")
        self.logger.setLevel(getattr(logging, log_level))
        
        # Initialize ZeroMQ context and sockets
        self.context = zmq.Context()
        self.socket = self.context.socket(zmq.REP)
        self.heartbeat_socket = self.context.socket(zmq.PUB)
        
        # Internal state
        self.methods: Dict[str, Callable] = {}
        self.running = False
        self.start_time = time.time()
        self.request_count = 0
        self.error_count = 0
        
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
            "methods": list(self.methods.keys())
        }
    
    def _ping(self) -> Dict[str, Any]:
        """Simple ping method for testing connectivity"""
        return {
            "service": self.service_name,
            "timestamp": datetime.now().isoformat(),
            "status": "ok"
        }
    
    def _format_uptime(self, seconds: float) -> str:
        """Format uptime in human-readable form"""
        days, remainder = divmod(seconds, 86400)
        hours, remainder = divmod(remainder, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{int(days)}d {int(hours)}h {int(minutes)}m {int(seconds)}s"
    
    def start(self) -> None:
        """Start the service container"""
        try:
            # Bind sockets
            self.socket.bind(f"tcp://*:{self.port}")
            self.heartbeat_socket.bind(f"tcp://*:{self.port+1}")
            
            self.running = True
            self.logger.info(f"Service {self.service_name} starting on port {self.port}")
            
            # Start heartbeat thread
            self.heartbeat_thread = threading.Thread(target=self._send_heartbeats, daemon=True)
            self.heartbeat_thread.start()
            
            # Start request processing
            self._process_requests()
        except Exception as e:
            self.logger.error(f"Failed to start service: {e}")
            self._shutdown()
    
    def _process_requests(self) -> None:
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
                
                # Check if method exists
                if method_name not in self.methods:
                    self._send_error_response(
                        f"Method '{method_name}' not found", 
                        "method_not_found",
                        request_id
                    )
                    continue
                
                # Call method
                try:
                    method = self.methods[method_name]
                    if isinstance(params, dict):
                        result = method(**params)
                    else:
                        result = method()
                    
                    # Send response
                    self._send_success_response(result, request_id)
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
                    'uptime': time.time() - self.start_time
                }
                self.heartbeat_socket.send_string(json.dumps(heartbeat))
                time.sleep(5)  # Send heartbeat every 5 seconds
            except Exception as e:
                self.logger.error(f"Error sending heartbeat: {e}")
                time.sleep(5)  # Wait before retrying
    
    def _shutdown_handler(self, signum: int, frame) -> None:
        """Handle shutdown signals"""
        self.logger.info(f"Received shutdown signal {signum}")
        self._shutdown()
    
    def _shutdown(self) -> None:
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
    
    def __enter__(self):
        """Support for context manager"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Ensure cleanup when used as context manager"""
        self._shutdown() 