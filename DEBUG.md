# NeoGPT Mr. Smith - Debugging Guide

This document provides detailed information on debugging the Mr. Smith agent framework within the NeoGPT project.

## Setup

The project includes comprehensive debugging configurations to assist development:

1. **debug-config.json** - Main debugging configuration file
2. **VSCode launch configurations** - For integrated IDE debugging

## Quick Start

### VSCode Debugging

1. Open the project in VSCode
2. Press `F5` or select the debug icon in the activity bar
3. Choose one of the predefined launch configurations:
   - **Debug Smith API Server** - Starts the main API server
   - **Debug Web Scraper Agent** - Runs the web scraper agent example
   - **Debug Business Agent Example** - Runs the business agent creation example
   - **Debug API Client Example** - Runs the API client example 
   - **Debug Refactored Usage Example** - Runs the refactored framework example
   - **Run Unit Tests** - Executes all tests with debugger attached
   - **Attach to Running Process** - Attaches to an already running node process

### Using the Compound Launch Configuration

To debug both the server and a client simultaneously:
1. Select the **Server + Client** compound configuration
2. Press `F5` to start debugging

## Environment Settings

The debugging configuration supports multiple environments:

- **dev** - Development environment with verbose logging and debugging features
- **test** - Testing environment with moderate logging
- **prod** - Production environment with minimal logging

To change environments:

```javascript
// When launching from code
const config = {
  environment: 'dev', // Change to 'test' or 'prod'
  // other config options...
}
```

Or via environment variable:

```bash
# Windows
set NODE_ENV=development

# Linux/Mac
export NODE_ENV=development
```

## Debug Features

### Breakpoints

The configuration includes predefined breakpoints in key locations:

- Smith.js - Agent creation
- SmithAPI.js - API endpoints
- ErrorHandler.js - Error processing

To add custom breakpoints:
1. In VSCode, click in the gutter next to the line number
2. Add conditions by right-clicking the breakpoint
3. Or update the `breakpoints` section in `debug-config.json`

### Log Points

Log points allow you to print information without modifying code:

1. Right-click the gutter next to a line number
2. Select "Add Logpoint..."
3. Enter a message like "Agent state: {agent.state}"

### Watch Expressions

The following watch expressions are preconfigured:
- `smith.agents.size` - Number of active agents
- `agent.state.mode` - Current agent mode
- `errorHandler.errorCounts` - Error statistics
- `configManager.config.smith` - Smith configuration

## Component Debugging

### Smith Core

```javascript
// Enable detailed logging
smith.config.enableDetailedLogging = true;

// Key events to monitor
smith.on('smith:agent_created', (data) => {
  console.log('Agent created:', data);
});
```

### Attribute Manager

```javascript
// Log all attribute changes
attributeManager.config.logAttributeChanges = true;
```

### Web Scraper Agent

```javascript
// Configure debugging options
const webScraperAgent = new WebScraperAgent({
  logExtractionDetails: true,
  saveRawHtml: true,
  maxTutorialsPerSource: 5,
  requestDelay: 3000 // Slower for debugging
});
```

## Performance Profiling

### CPU Profiling

```bash
# Record CPU profile for 30 seconds
node --prof src/index.js
```

### Memory Analysis

```bash
# Generate heap snapshot
node --inspect src/index.js
```

Then connect with Chrome DevTools (chrome://inspect) to capture heap snapshots.

## Common Issues and Solutions

### Agent Creation Fails

**Symptoms:**
- Error "Agent template not found"
- No agent instance created

**Debugging Steps:**
1. Check the agent type is registered in templates.json
2. Verify the template path is correct
3. Use breakpoint in Smith.js:122 to inspect the specs object

### API Requests Timing Out

**Symptoms:**
- API requests hang or timeout
- No response from server

**Debugging Steps:**
1. Check server is running with `ps aux | grep node`
2. Verify correct port in configuration
3. Enable request logging with `logAllRequests: true`
4. Check for rate limiting issues

### Memory Leaks

**Symptoms:**
- Increasing memory usage
- Performance degradation over time

**Debugging Steps:**
1. Generate heap snapshots at intervals
2. Look for growing object counts
3. Check agent cleanup in destroyAgent method

## Advanced Debugging Techniques

### Remote Debugging

```bash
# Start with inspector
node --inspect=0.0.0.0:9229 src/index.js
```

### Conditional Breakpoints with Expressions

For complex conditions:
```
agent.type === 'WebScraperAgent' && agent.metrics.errors > 0
```

### Debugging Asynchronous Code

Enable `showAsyncStacks: true` in debug configuration to trace through async calls.

## Additional Resources

- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [VSCode Debugging Documentation](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools Memory Analysis](https://developers.google.com/web/tools/chrome-devtools/memory-problems) 