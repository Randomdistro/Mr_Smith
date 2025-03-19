/**
 * System Initialization Script
 * Starts the MrSmith system and its components
 */

require('dotenv').config();
const MrSmith = require('./src/core/MrSmith');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Create MrSmith instance
const mrSmith = new MrSmith({
    logger,
    config: {
        database: {
            connectionString: process.env.MONGODB_URI,
            databaseName: process.env.DB_NAME
        },
        behavioralMatrix: {
            matrixPath: process.env.BEHAVIORAL_MATRIX_PATH
        }
    }
});

// Handle system events
mrSmith.on('error', (error) => {
    logger.error('System error:', error);
});

mrSmith.on('initialized', () => {
    logger.info('MrSmith system initialized successfully');
});

mrSmith.on('shutdown', () => {
    logger.info('MrSmith system shutdown completed');
});

// Handle process termination
process.on('SIGINT', async () => {
    logger.info('Received SIGINT. Shutting down...');
    try {
        await mrSmith.shutdown();
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM. Shutting down...');
    try {
        await mrSmith.shutdown();
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
});

// Initialize the system
async function initialize() {
    try {
        logger.info('Starting MrSmith system initialization...');
        await mrSmith.initialize();
        logger.info('MrSmith system initialization completed');
    } catch (error) {
        logger.error('Failed to initialize MrSmith system:', error);
        process.exit(1);
    }
}

// Start the system
initialize(); 