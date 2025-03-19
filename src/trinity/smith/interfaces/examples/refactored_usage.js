/**
 * refactored_usage.js - Example of using the refactored Smith framework
 * 
 * This example demonstrates how to use the refactored Smith framework,
 * including the new error handling and configuration management systems.
 */

const path = require('path');
const Smith = require('../Smith');
const { SmithAPI } = require('../api/SmithAPI');
const { ConfigManager } = require('../utils/ConfigManager');
const { ErrorHandler } = require('../utils/ErrorHandler');
const { AnalyticsAgent } = require('./custom_agent_type');

/**
 * Run a demonstration of the refactored Smith framework
 */
async function runRefactoredDemo() {
    console.log('=== Refactored Smith Framework Demo ===\n');
    
    try {
        // Step 1: Create custom configuration and error handler
        console.log('Setting up custom configuration and error handling...');
        
        // Custom error handler with development-friendly settings
        const errorHandler = new ErrorHandler({
            enableConsoleLogging: true,
            logLevel: 'debug',
            includeErrorDetails: true
        });
        
        // Custom configuration with development settings
        const configManager = new ConfigManager({
            environment: 'development',
            errorHandler
        });
        
        // Load configuration
        await configManager.load();
        
        // Add custom configuration for this demo
        configManager.config.smith = {
            ...configManager.config.smith,
            templatesPath: path.join(__dirname, '../templates'),
            storagePath: path.join(__dirname, '../storage/demo')
        };
        
        configManager.config.agents = {
            ...configManager.config.agents,
            maxPerUser: 5, // Lower limit for demonstration purposes
            idPrefix: 'demo_'
        };
        
        // Step 2: Initialize the Smith component
        console.log('\nInitializing Smith component...');
        const smith = new Smith({
            errorHandler,
            configManager,
            includeErrorDetails: true
        });
        
        await smith.initialize();
        console.log('Smith initialized successfully!');
        console.log('Available templates:', Array.from(smith.templates.keys()));
        
        // Step 3: Create an agent
        console.log('\nCreating a business agent...');
        const businessAgentResult = await smith.createAgent({
            type: 'BusinessAgent',
            parameters: {
                industry: 'Technology Consulting',
                seniorityLevel: 8,
                specializations: ['Digital Transformation', 'Cloud Migration']
            },
            approved: true
        });
        
        if (businessAgentResult.status === 'success') {
            console.log(`Business agent created with ID: ${businessAgentResult.agentId}`);
            
            // Use the agent
            const businessAgent = businessAgentResult.agent;
            console.log('Business agent state:', businessAgent.getState());
        } else {
            console.error('Failed to create business agent:', businessAgentResult.message);
        }
        
        // Step 4: Create a custom analytics agent
        console.log('\nCreating a custom analytics agent...');
        
        // Register the analytics agent with Smith
        smith.templates.set('AnalyticsAgent', {
            path: '../examples/custom_agent_type.js',
            description: 'A specialized agent for data analytics tasks',
            parameters: {
                specializations: 'string[]',
                dataAccess: 'Object'
            },
            className: 'AnalyticsAgent'
        });
        
        // Create the analytics agent
        const analyticsAgentResult = await smith.createAgent({
            type: 'AnalyticsAgent',
            parameters: {
                specializations: ['timeSeriesAnalysis', 'predictiveModeling']
            },
            approved: true
        });
        
        if (analyticsAgentResult.status === 'success') {
            console.log(`Analytics agent created with ID: ${analyticsAgentResult.agentId}`);
            
            // Use the agent
            const analyticsAgent = analyticsAgentResult.agent;
            console.log('Analytics agent capabilities:', analyticsAgent.capabilities);
        } else {
            console.error('Failed to create analytics agent:', analyticsAgentResult.message);
        }
        
        // Step 5: Test error handling by attempting to exceed agent limit
        console.log('\nTesting error handling by exceeding agent limit...');
        
        // Create agents until we reach the limit
        const agentLimit = configManager.get('agents.maxPerUser');
        const currentCount = smith.agents.size;
        const remainingSlots = agentLimit - currentCount;
        
        console.log(`Current agent count: ${currentCount}, limit: ${agentLimit}`);
        console.log(`Creating ${remainingSlots + 1} more agents to exceed the limit...`);
        
        for (let i = 0; i < remainingSlots + 1; i++) {
            const result = await smith.createAgent({
                type: 'GenericAgent',
                parameters: { name: `Test Agent ${i + 1}` },
                approved: true
            });
            
            console.log(`Agent creation attempt ${i + 1}: ${result.status}`);
            if (result.status === 'error') {
                console.log(`Error message: ${result.message}`);
            }
        }
        
        // Step 6: Initialize Smith API
        console.log('\nInitializing Smith API...');
        const api = new SmithAPI({
            port: 3030, // Use different port for demo
            smithConfig: {
                errorHandler,
                configManager
            },
            attributeManagerConfig: {
                errorHandler
            },
            errorHandler,
            enableLogging: true,
            includeErrorDetails: true
        });
        
        await api.initialize();
        console.log('Smith API initialized successfully!');
        console.log('API Status:', api.getStatus());
        
        // Step 7: Shutdown components
        console.log('\nShutting down components...');
        await api.shutdown();
        await smith.shutdown();
        console.log('Components shut down successfully!');
        
        console.log('\n=== Demo Complete ===');
    } catch (error) {
        console.error('Error in demo:', error);
    }
}

// Run the demo when this script is executed directly
if (require.main === module) {
    runRefactoredDemo().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = {
    runRefactoredDemo
}; 