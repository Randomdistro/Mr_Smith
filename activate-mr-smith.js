/**
 * Mr. Smith Activation Script
 * This script initializes and activates the Mr. Smith system with all agents and teams.
 */

require('dotenv').config();
const MrSmith = require('./src/core/MrSmith');
const Logger = require('./src/utils/logger');
const path = require('path');
const fs = require('fs');

// Create logger
const logger = new Logger({
    level: process.env.LOG_LEVEL || 'info',
    filename: path.join(__dirname, 'logs/mr-smith.log')
});

// Ensure necessary directories exist
const dirs = ['logs', 'data', 'data/projects', 'data/models', 'data/clients'];
dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info(`Created directory: ${dir}`);
    }
});

// Banner
function displayBanner() {
    console.log('\n');
    console.log('===============================================================');
    console.log('   __  __         _____           _ _   _     ');
    console.log('  |  \\/  |       / ____|         (_) | | |    ');
    console.log('  | \\  / |_ __  | (___  _ __ ___  _| |_| |__  ');
    console.log('  | |\\/| | \'__|  \\___ \\| \'_ ` _ \\| | __| \'_ \\ ');
    console.log('  | |  | | |     ____) | | | | | | | |_| | | |');
    console.log('  |_|  |_|_|    |_____/|_| |_| |_|_|\\__|_| |_|');
    console.log('                                               ');
    console.log('  Multi-Agent System - Version 3.7.0                          ');
    console.log('===============================================================');
    console.log('\n');
}

// Initialize and activate Mr. Smith
async function activateMrSmith() {
    displayBanner();
    
    logger.info('Starting Mr. Smith activation sequence...');
    
    try {
        // Create Mr. Smith instance with configuration
        const mrSmith = new MrSmith({
            logger,
            maxAgents: process.env.MAX_AGENTS || 15,
            operationalMode: process.env.OPERATIONAL_MODE || 'autonomous',
            dataRetentionPolicy: process.env.DATA_RETENTION_POLICY || 'compliance'
        });
        
        // Initialize Mr. Smith system
        logger.info('Initializing Mr. Smith system...');
        await mrSmith.initialize();
        
        // Display system status
        const uptime = mrSmith.calculateUptime();
        logger.info(`System initialized. Uptime: ${uptime.seconds}s`);
        logger.info(`Loaded ${mrSmith.agents.size} agents and ${mrSmith.teams.size} teams`);
        
        // List all available agents and teams
        console.log('\nAvailable Agents:');
        for (const agentName of mrSmith.agents.keys()) {
            console.log(`- ${agentName}`);
        }
        
        console.log('\nAvailable Teams:');
        for (const teamName of mrSmith.teams.keys()) {
            console.log(`- ${teamName}`);
        }

        // Example workflow start (uncomment to use)
        /*
        mrSmith.eventBus.emit('project:manufacturing:create', {
            projectName: 'Sample Manufacturing Project',
            productType: 'consumer-electronics',
            requirements: {
                description: 'Smart home device with temperature monitoring',
                constraints: {
                    size: 'compact',
                    powerRequirements: 'low-voltage'
                }
            }
        });
        */
        
        console.log('\nMr. Smith is now active and awaiting instructions.');
        console.log('Use the API or event system to interact with Mr. Smith.');
        console.log('\nPress Ctrl+C to shutdown.');
        
        // Handle shutdown
        process.on('SIGINT', async () => {
            console.log('\nShutdown signal received. Deactivating Mr. Smith...');
            await mrSmith.shutdown();
            console.log('Mr. Smith has been deactivated.');
            process.exit(0);
        });
        
        return mrSmith;
    } catch (error) {
        logger.error('Failed to activate Mr. Smith:', error);
        console.error('ERROR: Mr. Smith activation failed:', error.message);
        process.exit(1);
    }
}

// Run activation if script is executed directly
if (require.main === module) {
    activateMrSmith();
}

module.exports = activateMrSmith; 