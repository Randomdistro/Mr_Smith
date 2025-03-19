# Python Microservices for Mr. Smith

This directory contains Python microservices that can be used by the Mr. Smith agent system. These services provide computational capabilities that benefit from Python's scientific and numerical libraries, especially for engineering and simulation tasks.

## Architecture

The microservices architecture uses two main approaches for communication with the Node.js agent system:

1. **ZeroMQ-based services** - Simple, direct communication with low latency
2. **Ray-based distributed services** - For compute-intensive tasks that benefit from parallelization

## Prerequisites

Install the required Python packages:

```bash
pip install pyzmq numpy ray scipy
```

## Service Containers

There are two service container frameworks included:

### 1. Standard ZeroMQ Container (`service_container.py`)

A basic service container that exposes Python functions via ZeroMQ.

```python
from service_container import PyServiceContainer

# Create a service
service = PyServiceContainer("my-service", 5555)

# Register methods
def add(a, b):
    return a + b

service.register_method("add", add)

# Start the service
service.start()
```

### 2. Ray-based Container (`ray_service_container.py`)

A more advanced container that leverages Ray for distributed computing.

```python
from ray_service_container import RayServiceContainer
import asyncio

async def main():
    # Create a service with 4 Ray workers
    service = RayServiceContainer("my-service", 5555, num_workers=4)
    
    # Register methods
    def intensive_task(size):
        import numpy as np
        matrix = np.random.rand(size, size)
        return np.linalg.svd(matrix)[0].sum()
    
    service.register_method("intensive_task", intensive_task)
    
    # Start the service
    await service.start()

if __name__ == "__main__":
    asyncio.run(main())
```

## Included Services

1. **Structural Simulation Service** (`structural_sim_service.py`)
   - Provides finite element analysis capabilities
   - Uses Ray for parallelized computation
   - Run with: `python structural_sim_service.py`

## Creating New Services

To create a new Python service:

1. Choose the appropriate container based on your needs:
   - `PyServiceContainer` for simple services
   - `RayServiceContainer` for compute-intensive services

2. Implement your service logic in a new class

3. Register methods with the container

4. Start the service

## Integration with Node.js

These services can be called from Node.js using:

1. The `PythonBridgeTool` for ZeroMQ-based services
2. The `KafkaBridgeTool` if using Kafka-based communication

Example from JavaScript:

```javascript
const pythonTool = agent.tools.get('python-bridge');

const result = await pythonTool.execute({
    action: 'call-service',
    service: 'structural_sim',
    method: 'run_finite_element_analysis',
    params: {
        model: { /* model data */ },
        mesh_data: { /* mesh data */ },
        wind_speed: 120,
        boundary_conditions: { /* boundary conditions */ }
    }
});
```

## Monitoring

All services provide built-in monitoring endpoints:

- `_ping` - Basic connectivity check
- `_get_stats` - Get service statistics
- `_get_methods` - List available methods

You can call these from Node.js like any other method. 