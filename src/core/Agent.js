/**
 * Agent - Base Class for All Specialized Agents
 * Provides core functionality and interface for agent operations
 */

const EventEmitter = require('events');

class Agent extends EventEmitter {
    constructor(mrSmith, config = {}) {
        super();
        this.mrSmith = mrSmith;
        this.config = config;
        this.tools = new Map();
        this.state = {
            isInitialized: false,
            isBusy: false,
            lastActivity: null
        };
    }

    async initialize() {
        try {
            // Load agent-specific configuration
            await this.loadConfiguration();
            
            // Initialize tools
            await this.initializeTools();
            
            // Set up event listeners
            this.setupEventListeners();
            
            this.state.isInitialized = true;
            this.state.lastActivity = new Date();
            
            return true;
        } catch (error) {
            console.error(`Failed to initialize ${this.constructor.name}:`, error);
            throw error;
        }
    }

    async loadConfiguration() {
        // Load agent-specific configuration from the system
        const config = await this.mrSmith.database.getAgentConfig(this.constructor.name);
        this.config = { ...this.config, ...config };
    }

    async initializeTools() {
        // Initialize tools specific to this agent
        // To be implemented by specialized agents
    }

    setupEventListeners() {
        // Set up agent-specific event listeners
        this.on('task:start', this.handleTaskStart.bind(this));
        this.on('task:complete', this.handleTaskComplete.bind(this));
        this.on('error', this.handleError.bind(this));
    }

    async handleTaskStart(taskData) {
        try {
            this.state.isBusy = true;
            this.state.lastActivity = new Date();
            await this.processTask(taskData);
        } catch (error) {
            this.handleError(error);
        }
    }

    async handleTaskComplete(taskData) {
        try {
            this.state.isBusy = false;
            this.state.lastActivity = new Date();
            await this.emit('task:complete', taskData);
        } catch (error) {
            this.handleError(error);
        }
    }

    handleError(error) {
        console.error(`Error in ${this.constructor.name}:`, error);
        this.emit('error', error);
    }

    async processTask(taskData) {
        // To be implemented by specialized agents
        throw new Error('processTask must be implemented by specialized agents');
    }

    async shutdown() {
        try {
            // Clean up resources
            this.removeAllListeners();
            this.state.isInitialized = false;
            return true;
        } catch (error) {
            console.error(`Failed to shutdown ${this.constructor.name}:`, error);
            throw error;
        }
    }

    getState() {
        return { ...this.state };
    }

    isAvailable() {
        return this.state.isInitialized && !this.state.isBusy;
    }
}

module.exports = Agent; 