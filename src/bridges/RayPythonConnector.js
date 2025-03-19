/**
 * RayPythonConnector - Bridge between Node.js and Ray-powered Python services
 * Provides a ZeroMQ-based communication layer with reconnection and request tracking
 */

const zmq = require('zeromq');
const { EventEmitter } = require('events');

class RayPythonConnector extends EventEmitter {
    /**
     * Create a new Ray Python connector
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        super();
        
        this.config = {
            rayClusterAddress: 'localhost:10001',
            requestTimeout: 30000, // 30 seconds for longer computations
            reconnectInterval: 5000, // Attempt to reconnect every 5 seconds
            maxRetries: 3, // Maximum number of retries for a request
            ...config
        };
        
        this.connected = false;
        this.pendingRequests = new Map();
        this.requestCounter = 0;
        this.socket = null;
        
        // Bind methods to ensure correct 'this' context
        this.callRayService = this.callRayService.bind(this);
        this._connect = this._connect.bind(this);
        this._handleResponse = this._handleResponse.bind(this);
        this._reconnect = this._reconnect.bind(this);
    }
    
    /**
     * Initialize the connector
     * @returns {Promise<RayPythonConnector>} This instance
     */
    async initialize() {
        try {
            await this._connect();
            return this;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    
    /**
     * Connect to the Ray service
     * @private
     */
    async _connect() {
        try {
            this.socket = new zmq.Request();
            await this.socket.connect(`tcp://${this.config.rayClusterAddress}`);
            
            // Start the response handler
            this._startResponseHandler();
            
            this.connected = true;
            this.emit('connected');
            
            return true;
        } catch (error) {
            this.connected = false;
            this.emit('error', error);
            
            // Schedule reconnection
            setTimeout(this._reconnect, this.config.reconnectInterval);
            
            throw error;
        }
    }
    
    /**
     * Start handling responses from Ray
     * @private
     */
    async _startResponseHandler() {
        // Process messages in a loop
        while (this.connected) {
            try {
                const [msg] = await this.socket.receive();
                const response = JSON.parse(msg.toString());
                
                this._handleResponse(response);
            } catch (error) {
                if (this.connected) {
                    this.emit('error', new Error(`Response handler error: ${error.message}`));
                }
            }
        }
    }
    
    /**
     * Handle a response from Ray
     * @param {Object} response - The response object
     * @private
     */
    _handleResponse(response) {
        const { requestId, result, error } = response;
        
        if (!this.pendingRequests.has(requestId)) {
            this.emit('warning', `Received response for unknown request: ${requestId}`);
            return;
        }
        
        const { resolve, reject, timer } = this.pendingRequests.get(requestId);
        
        // Clear the timeout
        if (timer) {
            clearTimeout(timer);
        }
        
        // Remove from pending requests
        this.pendingRequests.delete(requestId);
        
        // Handle the response
        if (error) {
            reject(new Error(`Ray service error: ${error}`));
        } else {
            resolve(result);
        }
    }
    
    /**
     * Attempt to reconnect to the Ray service
     * @private
     */
    async _reconnect() {
        if (this.connected) return;
        
        try {
            await this._connect();
            this.emit('reconnected');
            
            // Retry all pending requests
            for (const [requestId, { request, resolve, reject, retries }] of this.pendingRequests.entries()) {
                if (retries < this.config.maxRetries) {
                    this._sendRequest(request, { 
                        requestId, 
                        resolve, 
                        reject, 
                        retries: retries + 1 
                    });
                } else {
                    reject(new Error(`Request failed after ${retries} retries`));
                    this.pendingRequests.delete(requestId);
                }
            }
        } catch (error) {
            setTimeout(this._reconnect, this.config.reconnectInterval);
        }
    }
    
    /**
     * Call a Ray service method
     * @param {string} serviceName - The name of the service
     * @param {string} method - The method to call
     * @param {Object} params - The parameters to pass
     * @returns {Promise<any>} The result of the method call
     */
    async callRayService(serviceName, method, params = {}) {
        if (!this.connected) {
            throw new Error('Not connected to Ray service');
        }
        
        const requestId = `ray-req-${++this.requestCounter}`;
        
        const request = {
            requestId,
            serviceName,
            method,
            params,
            timestamp: Date.now()
        };
        
        return new Promise((resolve, reject) => {
            this._sendRequest(request, { requestId, resolve, reject, retries: 0 });
        });
    }
    
    /**
     * Send a request to the Ray service
     * @param {Object} request - The request object
     * @param {Object} options - Options for the request
     * @private
     */
    async _sendRequest(request, { requestId, resolve, reject, retries }) {
        try {
            // Set up timeout
            const timer = setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error(`Request timed out after ${this.config.requestTimeout}ms`));
                }
            }, this.config.requestTimeout);
            
            // Store in pending requests
            this.pendingRequests.set(requestId, { request, resolve, reject, timer, retries });
            
            // Send the request
            await this.socket.send(JSON.stringify(request));
        } catch (error) {
            this.pendingRequests.delete(requestId);
            reject(new Error(`Failed to send request: ${error.message}`));
            
            // If send fails, try to reconnect
            if (this.connected) {
                this.connected = false;
                setTimeout(this._reconnect, this.config.reconnectInterval);
            }
        }
    }
    
    /**
     * Get statistics about the connector
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            connected: this.connected,
            pendingRequests: this.pendingRequests.size,
            totalRequests: this.requestCounter
        };
    }
    
    /**
     * Close the connector
     * @returns {Promise<void>}
     */
    async close() {
        this.connected = false;
        
        // Reject all pending requests
        for (const [requestId, { reject, timer }] of this.pendingRequests.entries()) {
            clearTimeout(timer);
            reject(new Error('Connector closed'));
        }
        
        this.pendingRequests.clear();
        
        // Close the socket
        if (this.socket) {
            await this.socket.close();
        }
        
        this.emit('closed');
    }
}

module.exports = RayPythonConnector;