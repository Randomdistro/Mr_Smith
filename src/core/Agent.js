/**
 * Agent - Base agent class
 * All agents in the system inherit from this class
 */

class Agent {
    /**
     * Create an agent instance
     * @param {Object} mrSmith - Reference to the main MrSmith orchestrator
     * @param {Object} config - Configuration options
     */
    constructor(mrSmith, config = {}) {
        this.mrSmith = mrSmith;
        this.config = {
            tier: 'core', // Default tier if not specified
            temporary: false, // Whether this is a temporary agent
            maxTools: 4, // Maximum number of tools this agent can use
            ...config
        };
        
        this.id = `${this.constructor.name}-${Date.now()}`;
        this.tools = new Map();
        this.state = {
            status: 'initializing',
            lastActivity: new Date(),
            tasks: []
        };
        
        this.logger = mrSmith.logger || console;
        this.eventBus = mrSmith.eventBus;
        
        // Set tool capacity based on tier
        this._setToolCapacityByTier();
        
        // Register event listeners
        this._registerEventListeners();
    }
    
    /**
     * Set tool capacity based on agent tier
     */
    _setToolCapacityByTier() {
        const tierConfig = {
            lightweight: 2,    // Tier 1: Max 2 tools
            core: 4,           // Tier 2: Max 4 tools
            specialist: 8,     // Tier 3: Max 8 tools 
            orchestrator: 16   // Tier 4: Max 16 tools (for orchestration)
        };
        
        this.config.maxTools = tierConfig[this.config.tier] || this.config.maxTools;
    }
    
    /**
     * Register event listeners for this agent
     */
    _registerEventListeners() {
        // Listen for tasks assigned to this agent
        const agentId = this.id;
        const agentType = this.constructor.name;
        
        this.eventBus.on('agent:task:assign', async (taskData) => {
            if (taskData.agent === agentType) {
                await this.handleTask(taskData);
            }
        });
        
        this.eventBus.on('system:shutdown', () => {
            this.cleanup();
        });
    }
    
    /**
     * Initialize the agent
     * Load tools and prepare for operation
     */
    async initialize() {
        try {
            this.logger.info(`Initializing ${this.constructor.name}...`);
            
            // Initialize tools
            await this.initializeTools();
            
            // Check if we're exceeding the tool capacity
            if (this.tools.size > this.config.maxTools) {
                this.logger.warn(`${this.constructor.name} has ${this.tools.size} tools, exceeding the limit of ${this.config.maxTools} for tier ${this.config.tier}`);
            }
            
            // Update state
            this.state.status = 'ready';
            this.state.lastActivity = new Date();
            
            return true;
        } catch (error) {
            this.logger.error(`Failed to initialize ${this.constructor.name}:`, error);
            this.state.status = 'error';
            this.state.error = error.message;
            throw error;
        }
    }
    
    /**
     * Initialize agent tools - to be overridden by derived classes
     */
    async initializeTools() {
        // Default implementation - override in derived classes
        this.logger.info(`${this.constructor.name} has no tools to initialize`);
    }
    
    /**
     * Process a task assigned to this agent
     * @param {Object} taskData - Data for the task
     */
    async handleTask(taskData) {
        try {
            // Update state
            this.state.status = 'working';
            this.state.lastActivity = new Date();
            this.state.tasks.push({
                id: taskData.id || `task-${Date.now()}`,
                type: taskData.task,
                status: 'processing',
                startedAt: new Date()
            });
            
            // Process the task
            const taskIndex = this.state.tasks.length - 1;
            const result = await this.processTask(taskData);
            
            // Update task status
            this.state.tasks[taskIndex].status = 'completed';
            this.state.tasks[taskIndex].completedAt = new Date();
            this.state.status = 'ready';
            
            // Emit task completion event
            this.eventBus.emit('agent:task:complete', {
                agent: this.constructor.name,
                agentId: this.id,
                task: taskData.task,
                taskId: taskData.id,
                workflowId: taskData.workflowId,
                result
            });
            
            return result;
        } catch (error) {
            this.logger.error(`Error processing task ${taskData.task}:`, error);
            
            // Update task status
            const taskIndex = this.state.tasks.length - 1;
            if (taskIndex >= 0) {
                this.state.tasks[taskIndex].status = 'failed';
                this.state.tasks[taskIndex].error = error.message;
            }
            
            this.state.status = 'error';
            
            // Emit task error event
            this.eventBus.emit('agent:task:error', {
                agent: this.constructor.name,
                agentId: this.id,
                task: taskData.task,
                taskId: taskData.id,
                workflowId: taskData.workflowId,
                error: error.message
            });
            
            throw error;
        }
    }
    
    /**
     * Process a specific task - to be overridden by derived classes
     * @param {Object} taskData - Data for the task
     */
    async processTask(taskData) {
        throw new Error(`Agent ${this.constructor.name} does not implement processTask method`);
    }
    
    /**
     * Get the current state of the agent
     * @returns {Object} - The agent's state
     */
    getState() {
        return {
            id: this.id,
            type: this.constructor.name,
            tier: this.config.tier,
            status: this.state.status,
            tasks: this.state.tasks.length,
            tools: Array.from(this.tools.keys()),
            lastActivity: this.state.lastActivity
        };
    }
    
    /**
     * Get performance metrics for this agent
     * @returns {Object} - Performance metrics
     */
    getPerformanceMetrics() {
        const completedTasks = this.state.tasks.filter(task => task.status === 'completed');
        const failedTasks = this.state.tasks.filter(task => task.status === 'failed');
        
        const metrics = {
            totalTasks: this.state.tasks.length,
            completedTasks: completedTasks.length,
            failedTasks: failedTasks.length,
            successRate: this.state.tasks.length > 0 ? 
                (completedTasks.length / this.state.tasks.length) * 100 : 0
        };
        
        if (completedTasks.length > 0) {
            // Calculate average task completion time
            const totalTime = completedTasks.reduce((sum, task) => {
                const startTime = new Date(task.startedAt).getTime();
                const endTime = new Date(task.completedAt).getTime();
                return sum + (endTime - startTime);
            }, 0);
            
            metrics.averageTaskTime = totalTime / completedTasks.length;
        }
        
        return metrics;
    }
    
    /**
     * Clean up resources before agent is destroyed
     * For temporary agents, this is crucial to prevent memory leaks
     */
    cleanup() {
        this.logger.info(`Cleaning up ${this.constructor.name}...`);
        
        // Release tool resources
        for (const [name, tool] of this.tools.entries()) {
            if (typeof tool.cleanup === 'function') {
                tool.cleanup();
            }
        }
        
        // Clear event listeners to prevent memory leaks
        this.eventBus.removeAllListeners('agent:task:assign');
        
        // Update state
        this.state.status = 'inactive';
        this.state.lastActivity = new Date();
        
        // If this is a temporary agent, it should be garbage collected after this
        if (this.config.temporary) {
            this.logger.info(`Temporary agent ${this.constructor.name} released`);
            
            // Clear references to help garbage collection
            this.tools.clear();
            this.mrSmith = null;
            this.eventBus = null;
        }
    }
}

module.exports = Agent; 