/**
 * BaseTool - Base class for all agent tools
 * Provides standard interface and functionality for tools
 */

class BaseTool {
    constructor(config = {}) {
        this.id = config.id || this.constructor.name;
        this.name = config.name || this.constructor.name;
        this.description = config.description || '';
        this.agent = config.agent || null;
        this.mrSmith = config.mrSmith || (this.agent ? this.agent.mrSmith : null);
        this.parameters = config.parameters || {};
        this.capabilities = config.capabilities || [];
        
        this.status = 'initializing';
        this.usageStats = {
            totalUsage: 0,
            successCount: 0,
            failureCount: 0,
            averageExecutionTime: 0,
            lastUsed: null
        };
        
        this.initialize();
    }
    
    /**
     * Initialize the tool
     */
    initialize() {
        try {
            // Perform tool-specific initialization
            this._initializeInternal();
            this.status = 'ready';
            return true;
        } catch (error) {
            console.error(`Failed to initialize ${this.name}:`, error);
            this.status = 'error';
            return false;
        }
    }
    
    /**
     * Execute the tool with provided parameters
     * @param {Object} params - Parameters for tool execution
     * @returns {Promise<Object>} - Execution result
     */
    async execute(params = {}) {
        try {
            if (this.status !== 'ready') {
                throw new Error(`Tool ${this.name} is not ready (status: ${this.status})`);
            }
            
            // Start execution timer
            const startTime = Date.now();
            this.status = 'executing';
            
            // Update usage stats
            this.usageStats.totalUsage += 1;
            this.usageStats.lastUsed = new Date().toISOString();
            
            // Execute the tool's core functionality
            const result = await this._executeInternal(params);
            
            // Calculate execution time
            const executionTime = Date.now() - startTime;
            
            // Update execution time average
            const previousTotal = this.usageStats.averageExecutionTime * 
                                 (this.usageStats.totalUsage - 1);
            this.usageStats.averageExecutionTime = 
                (previousTotal + executionTime) / this.usageStats.totalUsage;
            
            // Update success count
            this.usageStats.successCount += 1;
            
            // Reset status
            this.status = 'ready';
            
            return result;
        } catch (error) {
            // Update failure count
            this.usageStats.failureCount += 1;
            
            // Reset status
            this.status = 'ready';
            
            console.error(`Error executing ${this.name}:`, error);
            throw error;
        }
    }
    
    /**
     * Tool-specific initialization logic
     * To be overridden by subclasses
     * @protected
     */
    _initializeInternal() {
        // Default implementation does nothing
        // Subclasses should override this method
    }
    
    /**
     * Tool-specific execution logic
     * To be overridden by subclasses
     * @param {Object} params - Parameters for tool execution 
     * @returns {Promise<Object>} - Execution result
     * @protected
     */
    async _executeInternal(params) {
        throw new Error('_executeInternal must be implemented by subclasses');
    }
    
    /**
     * Get tool status information
     * @returns {Object} - Tool status information
     */
    getStatus() {
        return {
            id: this.id,
            name: this.name,
            status: this.status,
            usageStats: this.usageStats
        };
    }
    
    /**
     * Check if the tool has a specific capability
     * @param {string} capability - The capability to check for
     * @returns {boolean} - Whether the tool has the capability
     */
    hasCapability(capability) {
        return this.capabilities.includes(capability);
    }
    
    /**
     * Get all capabilities of the tool
     * @returns {string[]} - Array of capabilities
     */
    getCapabilities() {
        return [...this.capabilities];
    }
    
    /**
     * Check if the tool is ready to use
     * @returns {boolean} - Whether the tool is ready
     */
    isReady() {
        return this.status === 'ready';
    }
}

module.exports = BaseTool; 