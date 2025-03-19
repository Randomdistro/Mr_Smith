/**
 * KafkaBridge - Event-based communication bridge between Node.js and Python
 * Uses Apache Kafka for reliable, scalable messaging
 */

const { Kafka } = require('kafkajs');
const { EventEmitter } = require('events');

class KafkaBridge extends EventEmitter {
    /**
     * Create a new Kafka bridge
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        super();
        
        this.config = {
            clientId: 'mr-smith',
            brokers: ['localhost:9092'],
            responseTimeout: 30000, // 30 seconds default timeout
            consumerGroup: 'mr-smith-agents',
            responseTopics: ['python-responses', 'agent-notifications'],
            ...config
        };
        
        this.kafka = new Kafka({
            clientId: this.config.clientId,
            brokers: this.config.brokers,
            retry: {
                initialRetryTime: 300,
                retries: 10
            }
        });
        
        this.producer = this.kafka.producer();
        this.consumer = this.kafka.consumer({ 
            groupId: this.config.consumerGroup 
        });
        
        this.responseHandlers = new Map();
        this.connected = false;
        this.messageCount = 0;
        
        // Bind methods
        this._initialize = this._initialize.bind(this);
        this.sendRequest = this.sendRequest.bind(this);
        this._handleNotification = this._handleNotification.bind(this);
        this.shutdown = this.shutdown.bind(this);
    }
    
    /**
     * Initialize the Kafka bridge
     * @returns {Promise<KafkaBridge>} This instance
     */
    async initialize() {
        try {
            await this._initialize();
            return this;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    
    /**
     * Initialize Kafka connections
     * @private
     */
    async _initialize() {
        try {
            // Connect producer
            await this.producer.connect();
            
            // Connect consumer
            await this.consumer.connect();
            
            // Subscribe to response topics
            for (const topic of this.config.responseTopics) {
                await this.consumer.subscribe({ 
                    topic,
                    fromBeginning: false
                });
            }
            
            // Set up message handler
            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        const data = JSON.parse(message.value.toString());
                        this.messageCount++;
                        
                        if (topic === 'python-responses') {
                            await this._handleResponse(data);
                        } else if (topic === 'agent-notifications') {
                            await this._handleNotification(data);
                        }
                    } catch (error) {
                        this.emit('error', new Error(`Failed to process message: ${error.message}`));
                    }
                },
            });
            
            this.connected = true;
            this.emit('connected');
            
            return true;
        } catch (error) {
            this.connected = false;
            this.emit('error', new Error(`Failed to initialize Kafka bridge: ${error.message}`));
            throw error;
        }
    }
    
    /**
     * Handle a response message
     * @param {Object} data - The response data
     * @private
     */
    async _handleResponse(data) {
        const { requestId, result, error } = data;
        
        if (!requestId || !this.responseHandlers.has(requestId)) {
            this.emit('warning', `Received response for unknown request: ${requestId}`);
            return;
        }
        
        const { resolve, reject, timer } = this.responseHandlers.get(requestId);
        
        // Clear the timeout
        if (timer) {
            clearTimeout(timer);
        }
        
        // Remove the handler
        this.responseHandlers.delete(requestId);
        
        // Handle the response
        if (error) {
            reject(new Error(error));
        } else {
            resolve(result);
        }
    }
    
    /**
     * Handle a notification message
     * @param {Object} notification - The notification data
     * @private
     */
    async _handleNotification(notification) {
        // Emit the notification for listeners
        this.emit('notification', notification);
        
        // Emit a specific event for the notification type
        if (notification.type) {
            this.emit(`notification:${notification.type}`, notification);
        }
    }
    
    /**
     * Send a request to a Python service
     * @param {string} service - The name of the service
     * @param {string} method - The method to call
     * @param {Object} params - The parameters to pass
     * @returns {Promise<any>} The result of the request
     */
    async sendRequest(service, method, params = {}) {
        if (!this.connected) {
            throw new Error('Kafka bridge not connected');
        }
        
        const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Create a promise that will be resolved when the response is received
        const responsePromise = new Promise((resolve, reject) => {
            // Set up timeout
            const timer = setTimeout(() => {
                if (this.responseHandlers.has(requestId)) {
                    this.responseHandlers.delete(requestId);
                    reject(new Error(`Request timed out after ${this.config.responseTimeout}ms`));
                }
            }, this.config.responseTimeout);
            
            // Store the handler
            this.responseHandlers.set(requestId, { resolve, reject, timer });
        });
        
        // Send the request
        await this.producer.send({
            topic: `${service}-requests`,
            messages: [
                { 
                    key: method, 
                    value: JSON.stringify({
                        requestId,
                        method,
                        params,
                        timestamp: Date.now()
                    }) 
                },
            ],
        });
        
        return responsePromise;
    }
    
    /**
     * Publish an event to Kafka
     * @param {string} topic - The topic to publish to
     * @param {Object} data - The data to publish
     * @returns {Promise<void>}
     */
    async publishEvent(topic, data) {
        if (!this.connected) {
            throw new Error('Kafka bridge not connected');
        }
        
        await this.producer.send({
            topic,
            messages: [
                { 
                    value: JSON.stringify({
                        ...data,
                        timestamp: Date.now()
                    }) 
                },
            ],
        });
    }
    
    /**
     * Get statistics about the bridge
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            connected: this.connected,
            pendingRequests: this.responseHandlers.size,
            messagesProcessed: this.messageCount
        };
    }
    
    /**
     * Shut down the Kafka bridge
     * @returns {Promise<void>}
     */
    async shutdown() {
        try {
            this.connected = false;
            
            // Reject all pending requests
            for (const [requestId, { reject, timer }] of this.responseHandlers.entries()) {
                clearTimeout(timer);
                reject(new Error('Kafka bridge shutting down'));
            }
            
            this.responseHandlers.clear();
            
            // Disconnect consumer and producer
            await this.consumer.disconnect();
            await this.producer.disconnect();
            
            this.emit('closed');
        } catch (error) {
            this.emit('error', new Error(`Failed to shut down Kafka bridge: ${error.message}`));
            throw error;
        }
    }
}

module.exports = KafkaBridge;