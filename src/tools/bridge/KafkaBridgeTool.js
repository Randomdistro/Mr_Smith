/**
 * KafkaBridgeTool - Tool for communicating with Python services via Kafka
 * Provides a standardized interface for agent-service communication
 */

const BaseTool = require('../BaseTool');
const KafkaBridge = require('../../bridges/KafkaBridge');

class KafkaBridgeTool extends BaseTool {
    /**
     * Create a new Kafka Bridge Tool
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        super({
            name: 'KafkaBridgeTool',
            description: 'Tool for communicating with Python services via Kafka',
            ...config
        });
        
        // Initialize the Kafka bridge
        this.bridge = new KafkaBridge(config.kafkaConfig);
        
        // Track pending requests for cleanup
        this.pendingRequests = new Set();
        
        // Set up notification handling
        this.bridge.on('notification', this._handleNotification.bind(this));
        
        // Initialize the bridge
        this._initializeBridge();
    }
    
    /**
     * Initialize the Kafka bridge
     * @private
     */
    async _initializeBridge() {
        try {
            await this.bridge.initialize();
            
            if (this.logger) {
                this.logger.info('KafkaBridgeTool: Successfully connected to Kafka');
            }
        } catch (error) {
            if (this.logger) {
                this.logger.error(`KafkaBridgeTool: Failed to connect to Kafka: ${error.message}`);
            }
            
            // Throw error only if configured to fail on init error
            if (this.config.failOnInitError) {
                throw error;
            }
        }
    }
    
    /**
     * Execute a method on a Python service
     * @param {Object} params - Parameters for the execution
     * @param {string} params.service - The service to call
     * @param {string} params.method - The method to call
     * @param {Object} params.parameters - The parameters to pass to the method
     * @returns {Promise<any>} The result of the method call
     */
    async execute(params) {
        // Validate required parameters
        if (!params.service) {
            throw new Error('KafkaBridgeTool: service parameter is required');
        }
        
        if (!params.method) {
            throw new Error('KafkaBridgeTool: method parameter is required');
        }
        
        const { service, method, parameters = {} } = params;
        
        try {
            // Create a request tracker
            const requestTracker = { 
                service, 
                method, 
                startTime: Date.now(),
                completed: false
            };
            
            // Add to pending requests
            this.pendingRequests.add(requestTracker);
            
            // Send the request
            const result = await this.bridge.sendRequest(service, method, parameters);
            
            // Mark as completed and remove from tracking
            requestTracker.completed = true;
            this.pendingRequests.delete(requestTracker);
            
            return result;
        } catch (error) {
            // Report the specific error
            const errorMessage = error.message || 'Unknown error';
            const detailedError = `KafkaBridgeTool execution failed: ${errorMessage} (Service: ${service}, Method: ${method})`;
            
            // Log the error
            if (this.logger) {
                this.logger.error(detailedError);
            }
            
            throw new Error(detailedError);
        }
    }
    
    /**
     * Handle a notification from the Kafka bridge
     * @param {Object} notification - The notification
     * @private
     */
    _handleNotification(notification) {
        // Forward the notification as an event
        this.emit('notification', notification);
        
        // Log the notification if a logger is available
        if (this.logger) {
            this.logger.debug(`KafkaBridgeTool notification: ${notification.type}`, notification);
        }
    }
    
    /**
     * Publish an event to a Kafka topic
     * @param {Object} params - Parameters for publishing
     * @param {string} params.topic - The topic to publish to
     * @param {Object} params.data - The data to publish
     * @returns {Promise<void>}
     */
    async publishEvent(params) {
        const { topic, data } = params;
        
        if (!topic) {
            throw new Error('KafkaBridgeTool: topic parameter is required for publishing');
        }
        
        try {
            await this.bridge.publishEvent(topic, data || {});
            return { success: true, topic };
        } catch (error) {
            if (this.logger) {
                this.logger.error(`Failed to publish to ${topic}: ${error.message}`);
            }
            throw error;
        }
    }
    
    /**
     * Get statistics about the tool
     * @returns {Object} Statistics about the tool
     */
    getStats() {
        return {
            pendingRequests: this.pendingRequests.size,
            bridge: this.bridge.getStats?.() || {}
        };
    }
    
    /**
     * Clean up resources
     * @returns {Promise<void>}
     */
    async cleanup() {
        try {
            // Report any pending requests
            if (this.pendingRequests.size > 0 && this.logger) {
                this.logger.warn(`KafkaBridgeTool: ${this.pendingRequests.size} requests still pending during cleanup`);
            }
            
            // Shut down the bridge
            await this.bridge.shutdown();
            
            // Clear pending requests
            this.pendingRequests.clear();
            
            return true;
        } catch (error) {
            if (this.logger) {
                this.logger.error(`KafkaBridgeTool cleanup failed: ${error.message}`);
            }
            
            throw error;
        }
    }
}

module.exports = KafkaBridgeTool;
