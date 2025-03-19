/**
 * Mr. Smith Activation Script
 * This script initializes and activates the Mr. Smith system with the new tier-based architecture
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
    console.log('  Multi-Agent System - Version 4.0.0                          ');
    console.log('  [Tier-Based Architecture]                                   ');
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
            operationalMode: process.env.OPERATIONAL_MODE || 'autonomous',
            dataRetentionPolicy: process.env.DATA_RETENTION_POLICY || 'compliance',
            maxConcurrentWorkflows: parseInt(process.env.MAX_CONCURRENT_WORKFLOWS || '5', 10),
            maxAgentsPerTier: {
                lightweight: parseInt(process.env.MAX_LIGHTWEIGHT_AGENTS || '50', 10),
                core: parseInt(process.env.MAX_CORE_AGENTS || '10', 10),
                specialist: parseInt(process.env.MAX_SPECIALIST_AGENTS || '5', 10),
                orchestrator: parseInt(process.env.MAX_ORCHESTRATOR_AGENTS || '3', 10)
            }
        });
        
        // Initialize Mr. Smith system
        logger.info('Initializing Mr. Smith system...');
        await mrSmith.initialize();
        
        // Display system status
        const uptime = mrSmith.calculateUptime();
        logger.info(`System initialized. Uptime: ${uptime.seconds}s`);
        
        // Display active agents
        const agentStatus = mrSmith.getActiveAgents();
        logger.info(`Activated ${agentStatus.total} agents across tiers`);
        
        console.log('\nActive Agents by Tier:');
        for (const [tier, count] of Object.entries(agentStatus.byTier)) {
            if (count > 0) {
                console.log(`- ${tier}: ${count}`);
            }
        }
        
        if (agentStatus.agents.length > 0) {
            console.log('\nActive Agents:');
            for (const agent of agentStatus.agents) {
                console.log(`- ${agent.type} (${agent.tier}): ${agent.status}`);
            }
        }

        // Example workflow (uncomment to use)
        /*
        mrSmith.eventBus.emit('workflow:start', {
            type: 'query',
            data: {
                query: 'latest advancements in 3D printing',
                type: 'web-search',
                options: {
                    depth: 2,
                    extractImages: true
                }
            }
        });
        */
        
        console.log('\nMr. Smith is now active and ready for instructions.');
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