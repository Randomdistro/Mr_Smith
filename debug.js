#!/usr/bin/env node

/**
 * debug.js - Debugging helper script for NeoGPT Mr. Smith
 * 
 * This script provides easy access to various debugging configurations
 * and utilities to simplify the debugging process.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

// Load debug environment variables
dotenv.config({ path: '.env.debug' });

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const options = args.slice(1);

// Get debug config
let debugConfig = {};
try {
  const configPath = path.join(__dirname, 'debug-config.json');
  const configContent = fs.readFileSync(configPath, 'utf8');
  debugConfig = JSON.parse(configContent);
} catch (error) {
  console.error('Error loading debug configuration:', error.message);
  process.exit(1);
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
NeoGPT Mr. Smith Debugging Helper

Usage:
  node debug.js <command> [options]

Available Commands:
  api              Start the Smith API server in debug mode
  web-scraper      Run the WebScraperAgent example
  business         Run the Business Agent example
  api-client       Run the API client example
  refactored       Run the refactored usage example
  test             Run unit tests with debugger attached
  profile          Run CPU profiling
  heap             Generate heap snapshot
  clean            Clean debug artifacts
  help             Show this help message

Examples:
  node debug.js api                   # Start API server
  node debug.js web-scraper blender   # Run web scraper for Blender
  node debug.js profile api 30        # Profile API for 30 seconds
  `);
}

/**
 * Start a process with debugging enabled
 * @param {string} script - Script to run
 * @param {string[]} scriptArgs - Script arguments
 * @param {Object} env - Environment variables
 */
function startDebugProcess(script, scriptArgs = [], env = {}) {
  const nodeArgs = ['--inspect=127.0.0.1:9229'];
  
  // Check if profiling is enabled
  if (env.SMITH_ENABLE_PROFILING === 'true') {
    nodeArgs.push('--prof');
  }
  
  const fullScriptPath = path.resolve(__dirname, script);
  
  console.log(`Starting debug process: ${script}`);
  console.log(`Debug URL: chrome://inspect`);
  
  const mergedEnv = { ...process.env, ...env };
  
  const child = spawn('node', [...nodeArgs, fullScriptPath, ...scriptArgs], {
    env: mergedEnv,
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (error) => {
    console.error(`Error starting process: ${error.message}`);
  });
  
  child.on('close', (code) => {
    console.log(`Process exited with code ${code}`);
  });
  
  // Handle Ctrl+C to cleanly terminate the child process
  process.on('SIGINT', () => {
    console.log('\nTerminating debug process...');
    child.kill('SIGINT');
  });
}

/**
 * Find launch configuration by name
 * @param {string} name - Configuration name
 * @returns {Object|null} - Launch configuration or null
 */
function findLaunchConfig(name) {
  const configs = debugConfig.launchConfigurations || [];
  return configs.find(config => config.name.toLowerCase().includes(name.toLowerCase())) || null;
}

/**
 * Run CPU profiling
 * @param {string} target - Target script
 * @param {number} duration - Duration in seconds
 */
function runProfiling(target, duration = 30) {
  const config = findLaunchConfig(target) || findLaunchConfig('api');
  
  if (!config) {
    console.error(`Unknown target: ${target}`);
    process.exit(1);
  }
  
  console.log(`Running CPU profiling for ${duration} seconds on ${config.script}`);
  
  const env = {
    ...process.env,
    NODE_ENV: 'development',
    SMITH_ENABLE_PROFILING: 'true'
  };
  
  const child = spawn('node', ['--prof', path.resolve(__dirname, config.script), ...(config.args || [])], {
    env,
    stdio: 'inherit',
    shell: true
  });
  
  console.log(`Profiling started. Will run for ${duration} seconds...`);
  
  // Kill the process after duration
  setTimeout(() => {
    console.log('Profiling complete. Processing results...');
    child.kill('SIGINT');
    
    // Find the latest isolate file
    setTimeout(() => {
      const isolateFiles = fs.readdirSync(__dirname)
        .filter(file => file.startsWith('isolate-'))
        .sort()
        .reverse();
      
      if (isolateFiles.length > 0) {
        const latestIsolate = isolateFiles[0];
        const outputFile = `${target}-profile-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
        
        console.log(`Processing profile data from ${latestIsolate}`);
        
        const processChild = spawn('node', 
          ['--prof-process', latestIsolate, '--', '>', outputFile],
          { shell: true, stdio: 'inherit' }
        );
        
        processChild.on('close', () => {
          console.log(`Profile data saved to ${outputFile}`);
        });
      } else {
        console.error('No profiling data found');
      }
    }, 1000);
  }, duration * 1000);
}

/**
 * Generate heap snapshot
 * @param {string} target - Target script
 */
function generateHeapSnapshot(target) {
  const config = findLaunchConfig(target) || findLaunchConfig('api');
  
  if (!config) {
    console.error(`Unknown target: ${target}`);
    process.exit(1);
  }
  
  console.log(`Starting ${config.script} with heap profiling enabled`);
  console.log('Connect to chrome://inspect to capture heap snapshots');
  
  const env = {
    ...process.env,
    NODE_ENV: 'development'
  };
  
  startDebugProcess(config.script, config.args || [], env);
}

/**
 * Clean debug artifacts
 */
function cleanDebugArtifacts() {
  const patterns = [
    'isolate-*',
    'v8.log',
    '*.cpuprofile',
    '*.heapsnapshot'
  ];
  
  let count = 0;
  
  patterns.forEach(pattern => {
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    fs.readdirSync(__dirname).forEach(file => {
      if (regex.test(file)) {
        fs.unlinkSync(path.join(__dirname, file));
        console.log(`Deleted: ${file}`);
        count++;
      }
    });
  });
  
  console.log(`Cleaned up ${count} debug artifact files`);
}

// Main command handler
switch (command) {
  case 'api':
    startDebugProcess('src/index.js', ['--api'], {
      NODE_ENV: 'development',
      SMITH_LOG_LEVEL: 'debug'
    });
    break;
    
  case 'web-scraper':
    const target = options[0] || 'blender';
    startDebugProcess('src/trinity/smith/examples/web_scraper_example.js', [`--target=${target}`], {
      NODE_ENV: 'development',
      DEBUG: 'webScraper:*'
    });
    break;
    
  case 'business':
    startDebugProcess('src/trinity/smith/examples/create_business_agent.js', [], {
      NODE_ENV: 'development'
    });
    break;
    
  case 'api-client':
    startDebugProcess('src/trinity/smith/examples/api_client.js', [], {
      NODE_ENV: 'development'
    });
    break;
    
  case 'refactored':
    startDebugProcess('src/trinity/smith/examples/refactored_usage.js', [], {
      NODE_ENV: 'development',
      SMITH_LOG_LEVEL: 'debug'
    });
    break;
    
  case 'test':
    const testPath = options[0] || '';
    startDebugProcess('node_modules/jest/bin/jest.js', ['--runInBand', testPath], {
      NODE_ENV: 'test'
    });
    break;
    
  case 'profile':
    const profileTarget = options[0] || 'api';
    const duration = parseInt(options[1] || '30', 10);
    runProfiling(profileTarget, duration);
    break;
    
  case 'heap':
    const heapTarget = options[0] || 'api';
    generateHeapSnapshot(heapTarget);
    break;
    
  case 'clean':
    cleanDebugArtifacts();
    break;
    
  case 'help':
  default:
    showHelp();
    break;
} 