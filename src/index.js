/**
 * Mr. Smith Agent Manager
 * Main entry point
 */

//require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Logger = require('./utils/logger');

console.log('System PATH:', process.env.PATH);

// Import core system
const MrSmith = require('./core/MrSmith');

// Initialize logger
const logger = new Logger({
    level: process.env.LOG_LEVEL || 'info',
    filename: path.join(__dirname, '../logs/app.log')
});

// Create data and logs directories if they don't exist
const dataDir = path.join(__dirname, '../data');
const logsDir = path.join(__dirname, '../logs');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    logger.info(`Created data directory: ${dataDir}`);
}

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    logger.info(`Created logs directory: ${logsDir}`);
}

/**
 * Display welcome message and available commands
 */
function displayWelcome() {
    const packageInfo = require('../package.json');
    
    console.log('\n========================================================');
    console.log(`  Mr. Smith Agentic Toolkit v${packageInfo.version}`);
    console.log('========================================================\n');
    console.log('A powerful suite of tools to enhance your agent process');
    console.log('\nAvailable commands:');
    console.log('  npm run enrich         - Run company enrichment tool');
    console.log('  npm run enrich:mock    - Run with mock data (no API keys needed)');
    console.log('  npm run enrich:real    - Run with real API data');
    console.log('  npm run enrich:single  - Look up individual companies');
    console.log('  npm run response       - Analyze client responses');
    console.log('  npm run response:template - Generate follow-up templates');
    console.log('  npm run opportunity    - Calculate opportunity scores');
    console.log('  npm run opportunity:create - Create sample prospect data');
    console.log('  npm run meeting        - Generate meeting briefs');
    console.log('  npm run meeting:create - Create sample client data');
    console.log('  npm run meeting:brief  - Generate a meeting brief');
    console.log('  npm run meeting:talking-points - Generate meeting talking points\n');
    
    console.log('All tools now implemented!\n');
    console.log('========================================================\n');
}

/**
 * Initialize the toolkit
 */
async function initialize() {
    logger.info('Starting Mr. Smith Agentic Toolkit');
    
    try {
        // Check for required environment variables
        const apiKeys = {
            //clearbit: process.env.CLEARBIT_API_KEY ? 'Configured' : 'Not configured',
            //crunchbase: process.env.CRUNCHBASE_API_KEY ? 'Configured' : 'Not configured',
            claude: process.env.CLAUDE_API_KEY ? 'Configured' : 'Not configured',
        };
        
        logger.info('API Keys status:', apiKeys);
        
        // Initialize MrSmith system
        const mrSmith = new MrSmith({
            logger,
            maxAgents: 5,
            operationalMode: 'autonomous'
        });
        
        await mrSmith.initialize();
        logger.info('Mr. Smith system initialized successfully');
        
        // Export all agents and utilities
        return {
            mrSmith,
            agents: {
                researcherAgent: mrSmith.agents.get('ResearcherAgent'),
                dataProcessorAgent: mrSmith.agents.get('DataProcessorAgent'),
                contactManagerAgent: mrSmith.agents.get('ContactManagerAgent'),
                communicationsAgent: mrSmith.agents.get('CommunicationsAgent'),
                opportunityAnalyzerAgent: mrSmith.agents.get('OpportunityAnalyzerAgent')
            },
            logger
        };
        
    } catch (error) {
        logger.error('Initialization error:', error);
        throw error;
    }
}

// If this script is run directly (not imported)
if (require.main === module) {
    displayWelcome();
    
    // Initialize the system
    initialize()
        .then(system => {
            logger.info('System ready');
            
            // Start handling events 
            // This is just a placeholder for actual event handling
            console.log('Mr. Smith is now handling events...');
            
            // Set up graceful shutdown
            process.on('SIGINT', async () => {
                console.log('\nShutting down Mr. Smith...');
                await system.mrSmith.shutdown();
                console.log('Shutdown complete');
                process.exit(0);
            });
        })
        .catch(error => {
            logger.error('System initialization failed:', error);
            console.error('Failed to start Mr. Smith:', error);
            process.exit(1);
        });
}

// Export the initialized toolkit
module.exports = initialize();