/**
 * PythonBridgeTool - Tool for interacting with Python microservices
 * Supports both ZeroMQ and Ray-based Python services
 */

const BaseTool = require('../BaseTool');
const RayPythonConnector = require('../../bridges/RayPythonConnector');

class PythonBridgeTool extends BaseTool {
    /**
     * Create a new Python Bridge Tool
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        super({
            name: 'PythonBridgeTool',
            description: 'Tool for interacting with Python microservices',
            ...config
        });
        
        this.connector = config.connector;
        
        // If connector not provided, create one
        if (!this.connector) {
            this.connector = new RayPythonConnector(config.connectorConfig || {});
            this.ownedConnector = true;
        } else {
            this.ownedConnector = false;
        }
        
        // Track active service calls
        this.activeCalls = new Map();
        
        // Initialize the connector
        this._initializeConnector();
    }
    
    /**
     * Initialize the connector
     * @private
     */
    async _initializeConnector() {
        if (this.ownedConnector) {
            try {
                await this.connector.initialize();
                
                if (this.logger) {
                    this.logger.info('PythonBridgeTool: Successfully connected to Python services');
                }
            } catch (error) {
                if (this.logger) {
                    this.logger.error(`PythonBridgeTool: Failed to connect: ${error.message}`);
                }
                
                // Throw error only if configured to fail on init error
                if (this.config.failOnInitError) {
                    throw error;
                }
            }
        }
    }
    
    /**
     * Execute a command on the Python service
     * @param {Object} params - Command parameters
     * @returns {Promise<any>} - Command result
     */
    async execute(params) {
        const { action } = params;
        
        switch (action) {
            case 'call-service':
                return await this.callService(params);
                
            case 'list-services':
                return this.listServices();
                
            case 'list-methods':
                return this.listMethods(params.service);
                
            default:
                throw new Error(`PythonBridgeTool: Unknown action: ${action}`);
        }
    }
    
    /**
     * Call a method on a Python service
     * @param {Object} params - Call parameters
     * @param {string} params.service - The service to call
     * @param {string} params.method - The method to call
     * @param {Object} params.params - The parameters to pass
     * @returns {Promise<any>} - The call result
     */
    async callService(params) {
        const { service, method, params: methodParams = {} } = params;
        
        if (!service) {
            throw new Error('PythonBridgeTool: service parameter is required');
        }
        
        if (!method) {
            throw new Error('PythonBridgeTool: method parameter is required');
        }
        
        // Create call ID for tracking
        const callId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
        
        // Create call tracker
        const callTracker = {
            id: callId,
            service,
            method,
            startTime: Date.now(),
            status: 'running'
        };
        
        // Add to active calls
        this.activeCalls.set(callId, callTracker);
        
        try {
            if (this.logger) {
                this.logger.debug(`PythonBridgeTool: Calling ${service}.${method}`);
            }
            
            // Call the service
            const result = await this.connector.callRayService(service, method, methodParams);
            
            // Update tracker
            callTracker.status = 'completed';
            callTracker.completedAt = Date.now();
            callTracker.duration = callTracker.completedAt - callTracker.startTime;
            
            return result;
        } catch (error) {
            // Update tracker
            callTracker.status = 'failed';
            callTracker.error = error.message;
            callTracker.completedAt = Date.now();
            callTracker.duration = callTracker.completedAt - callTracker.startTime;
            
            if (this.logger) {
                this.logger.error(`PythonBridgeTool: Error calling ${service}.${method}: ${error.message}`);
            }
            
            throw new Error(`Error calling Python service ${service}.${method}: ${error.message}`);
        } finally {
            // Clean up tracker after a while
            setTimeout(() => {
                this.activeCalls.delete(callId);
            }, 10000); // Keep for 10 seconds for potential diagnostics
        }
    }
    
    /**
     * List available services
     * @returns {Object} - List of available services
     */
    listServices() {
        // This would need to be implemented with an actual service registry
        // For now, return a placeholder
        return {
            status: 'success',
            services: []
        };
    }
    
    /**
     * List methods available on a service
     * @param {string} serviceName - The service to query
     * @returns {Object} - List of available methods
     */
    async listMethods(serviceName) {
        if (!serviceName) {
            throw new Error('PythonBridgeTool: serviceName parameter is required');
        }
        
        try {
            // Call the _get_methods method on the service if it exists
            const methods = await this.connector.callRayService(
                serviceName, 
                '_get_methods', 
                {}
            );
            
            return {
                service: serviceName,
                methods: methods || []
            };
        } catch (error) {
            if (this.logger) {
                this.logger.warn(`PythonBridgeTool: Could not list methods for ${serviceName}: ${error.message}`);
            }
            
            return {
                service: serviceName,
                methods: [],
                error: `Could not list methods: ${error.message}`
            };
        }
    }
    
    /**
     * Get statistics about active calls
     * @returns {Object} - Statistics about the tool
     */
    getStats() {
        const activeCallsStats = Array.from(this.activeCalls.values()).map(call => ({
            id: call.id,
            service: call.service,
            method: call.method,
            status: call.status,
            duration: call.completedAt ? 
                call.duration : 
                Date.now() - call.startTime
        }));
        
        return {
            activeCalls: this.activeCalls.size,
            calls: activeCallsStats,
            connector: this.connector.getStats?.()
        };
    }
    
    /**
     * Clean up resources
     * @returns {Promise<boolean>} - Success indicator
     */
    async cleanup() {
        try {
            // Report on any active calls
            if (this.activeCalls.size > 0 && this.logger) {
                this.logger.warn(`PythonBridgeTool: ${this.activeCalls.size} calls still active during cleanup`);
            }
            
            // Close the connector if we own it
            if (this.ownedConnector && this.connector) {
                await this.connector.close();
            }
            
            // Clear active calls
            this.activeCalls.clear();
            
            return true;
        } catch (error) {
            if (this.logger) {
                this.logger.error(`PythonBridgeTool cleanup failed: ${error.message}`);
            }
            throw error;
        }
    }
}

module.exports = PythonBridgeTool; 