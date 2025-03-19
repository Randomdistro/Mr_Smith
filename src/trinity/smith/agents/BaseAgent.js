/**
 * BaseAgent.js - Foundational agent template
 * 
 * Base class for all agents created by The Smith
 * Provides core functionality and interfaces for specialized agents
 */

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;

class BaseAgent extends EventEmitter {
    constructor(config = {}) {
        super();
        this.id = config.id || `agent_${Date.now()}`;
        this.parameters = config.parameters || {};
        this.smith = config.smith || null;
        this.type = this.constructor.name;
        
        this.tools = new Map();
        this.interfaces = new Map();
        this.dataStore = new Map();
        
        this.state = {
            isInitialized: false,
            isActive: false,
            isBusy: false,
            mode: 'standby',
            lastActivity: null,
            currentTask: null
        };
        
        // Performance and monitoring metrics
        this.metrics = {
            tasksCompleted: 0,
            totalUptime: 0,
            startTime: null,
            errors: 0
        };
    }
    
    /**
     * Initialize the agent
     */
    async initialize() {
        try {
            // Load agent configuration
            await this._loadConfiguration();
            
            // Initialize tools
            await this._initializeTools();
            
            // Initialize interfaces
            await this._initializeInterfaces();
            
            // Set up event listeners
            this._setupEventListeners();
            
            // Update state
            this.state.isInitialized = true;
            this.state.isActive = true;
            this.state.mode = 'ready';
            this.state.lastActivity = new Date();
            this.metrics.startTime = new Date();
            
            this.emit('agent:initialized', {
                id: this.id,
                type: this.type,
                timestamp: this.state.lastActivity
            });
            
            return true;
        } catch (error) {
            console.error(`Failed to initialize agent ${this.id}:`, error);
            this.emit('agent:error', { error, context: 'initialization' });
            throw error;
        }
    }
    
    /**
     * Perform a task
     * @param {Object} task - Task data
     */
    async performTask(task) {
        if (!this.state.isInitialized) {
            throw new Error('Agent not initialized');
        }
        
        if (this.state.isBusy) {
            throw new Error('Agent is busy');
        }
        
        try {
            // Update state
            this.state.isBusy = true;
            this.state.mode = 'working';
            this.state.currentTask = task;
            this.state.lastActivity = new Date();
            
            this.emit('agent:task_start', {
                id: this.id,
                taskId: task.id,
                taskType: task.type,
                timestamp: this.state.lastActivity
            });
            
            // Process the task - to be implemented by subclasses
            const result = await this._processTask(task);
            
            // Update state
            this.state.isBusy = false;
            this.state.mode = 'ready';
            this.state.currentTask = null;
            this.state.lastActivity = new Date();
            this.metrics.tasksCompleted++;
            
            this.emit('agent:task_complete', {
                id: this.id,
                taskId: task.id,
                taskType: task.type,
                result,
                timestamp: this.state.lastActivity
            });
            
            return result;
        } catch (error) {
            // Update state
            this.state.isBusy = false;
            this.state.mode = 'error';
            this.state.lastActivity = new Date();
            this.metrics.errors++;
            
            this.emit('agent:error', {
                id: this.id,
                taskId: task?.id,
                error,
                context: 'task_execution'
            });
            
            throw error;
        }
    }
    
    /**
     * Get current agent state
     */
    getState() {
        // Calculate uptime
        if (this.metrics.startTime) {
            const uptime = new Date() - this.metrics.startTime;
            this.metrics.totalUptime = uptime;
        }
        
        return {
            id: this.id,
            type: this.type,
            state: { ...this.state },
            metrics: { ...this.metrics },
            parameters: { ...this.parameters }
        };
    }
    
    /**
     * Add a tool to the agent
     * @param {string} toolName - Name of the tool
     * @param {Object} tool - Tool instance
     */
    addTool(toolName, tool) {
        this.tools.set(toolName, tool);
        this.emit('agent:tool_added', { id: this.id, toolName });
        return this;
    }
    
    /**
     * Get a tool by name
     * @param {string} toolName - Name of the tool
     */
    getTool(toolName) {
        return this.tools.get(toolName) || null;
    }
    
    /**
     * Add an interface to the agent
     * @param {string} interfaceName - Name of the interface
     * @param {Object} interface - Interface instance
     */
    addInterface(interfaceName, interface) {
        this.interfaces.set(interfaceName, interface);
        this.emit('agent:interface_added', { id: this.id, interfaceName });
        return this;
    }
    
    /**
     * Get an interface by name
     * @param {string} interfaceName - Name of the interface
     */
    getInterface(interfaceName) {
        return this.interfaces.get(interfaceName) || null;
    }
    
    /**
     * Store data in the agent's data store
     * @param {string} key - Data key
     * @param {*} value - Data value
     */
    storeData(key, value) {
        this.dataStore.set(key, value);
        return this;
    }
    
    /**
     * Retrieve data from the agent's data store
     * @param {string} key - Data key
     */
    retrieveData(key) {
        return this.dataStore.get(key) || null;
    }
    
    /**
     * Update agent parameters
     * @param {Object} newParameters - New parameters to update
     */
    updateParameters(newParameters) {
        this.parameters = {
            ...this.parameters,
            ...newParameters
        };
        
        this.emit('agent:parameters_updated', {
            id: this.id,
            parameters: this.parameters
        });
        
        return this;
    }
    
    /**
     * Send message to Smith
     * @param {string} type - Message type
     * @param {Object} data - Message data
     */
    sendToSmith(type, data) {
        if (!this.smith) {
            throw new Error('Smith reference not available');
        }
        
        this.smith.emit(`agent:${type}`, {
            agentId: this.id,
            agentType: this.type,
            ...data
        });
    }
    
    /**
     * Pause the agent
     */
    pause() {
        if (this.state.mode === 'paused') {
            return;
        }
        
        this.state.mode = 'paused';
        this.emit('agent:paused', { id: this.id, timestamp: new Date() });
    }
    
    /**
     * Resume the agent
     */
    resume() {
        if (this.state.mode !== 'paused') {
            return;
        }
        
        this.state.mode = this.state.isBusy ? 'working' : 'ready';
        this.emit('agent:resumed', { id: this.id, timestamp: new Date() });
    }
    
    /**
     * Shut down the agent
     */
    async shutdown() {
        try {
            // Shutdown tools
            for (const [toolName, tool] of this.tools.entries()) {
                if (tool.shutdown && typeof tool.shutdown === 'function') {
                    await tool.shutdown();
                }
            }
            
            // Shutdown interfaces
            for (const [interfaceName, interface] of this.interfaces.entries()) {
                if (interface.shutdown && typeof interface.shutdown === 'function') {
                    await interface.shutdown();
                }
            }
            
            // Update state
            this.state.isInitialized = false;
            this.state.isActive = false;
            this.state.mode = 'shutdown';
            this.state.lastActivity = new Date();
            
            // Calculate final uptime
            if (this.metrics.startTime) {
                const uptime = new Date() - this.metrics.startTime;
                this.metrics.totalUptime = uptime;
            }
            
            this.emit('agent:shutdown', {
                id: this.id,
                metrics: this.metrics,
                timestamp: this.state.lastActivity
            });
            
            return true;
        } catch (error) {
            console.error(`Failed to shutdown agent ${this.id}:`, error);
            this.emit('agent:error', { error, context: 'shutdown' });
            throw error;
        }
    }
    
    // Methods to be implemented by subclasses
    
    /**
     * Process a task - to be implemented by subclasses
     * @param {Object} task - Task data
     */
    async _processTask(task) {
        throw new Error('_processTask must be implemented by subclasses');
    }
    
    // Private methods
    
    /**
     * Load agent configuration
     */
    async _loadConfiguration() {
        // Can be overridden by subclasses
    }
    
    /**
     * Initialize agent tools
     */
    async _initializeTools() {
        // Can be overridden by subclasses
    }
    
    /**
     * Initialize agent interfaces
     */
    async _initializeInterfaces() {
        // Can be overridden by subclasses
    }
    
    /**
     * Set up event listeners
     */
    _setupEventListeners() {
        // Can be overridden by subclasses
    }
}

module.exports = BaseAgent; 