/**
 * Smith.js - Agent Creation and Management Component
 * 
 * Part of the Trinity Node within the NeoGPT framework
 * Responsible for creating, managing and deploying specialized agents based on 
 * specifications from The Architect and approval from The Oracle
 */

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;
const { defaultErrorHandler, AgentError } = require('./utils/ErrorHandler');
const { defaultConfigManager } = require('./utils/ConfigManager');

/**
 * Smith - Core agent creation and management system
 * 
 * Responsible for agent lifecycle management, template handling,
 * and integration with the Trinity Node architecture.
 */
class Smith extends EventEmitter {
    /**
     * Create a new Smith instance
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        super();
        
        // Use provided error handler or default
        this.errorHandler = config.errorHandler || defaultErrorHandler;
        
        // Use provided config manager or default
        this.configManager = config.configManager || defaultConfigManager;
        
        // Store raw config for later when configManager is loaded
        this._rawConfig = config;
        
        // Core state management
        this.agents = new Map(); // Currently active agents
        this.templates = new Map(); // Available agent templates
        this.taskQueue = []; // Queue of pending agent creation tasks
        this.isInitialized = false;
        this.architect = null; // Reference to Architect component
        this.oracle = null; // Reference to Oracle component
        
        // Tracking metrics
        this.metrics = {
            totalAgentsCreated: 0,
            totalAgentsDestroyed: 0,
            totalTasksCompleted: 0,
            lastActivity: null
        };
    }
    
    /**
     * Initialize the Smith component
     * @returns {Promise<boolean>} - True if initialization successful
     */
    async initialize() {
        try {
            // Load configuration if not already loaded
            if (!this.configManager.isLoaded) {
                await this.configManager.load();
            }
            
            // Set up configuration with defaults and overrides
            this.config = {
                agentTemplatesPath: this._rawConfig.agentTemplatesPath || 
                    this.configManager.get('smith.templatesPath') || 
                    path.join(__dirname, 'templates'),
                agentStoragePath: this._rawConfig.agentStoragePath || 
                    this.configManager.get('smith.storagePath') || 
                    path.join(__dirname, 'storage'),
                maxAgents: this._rawConfig.maxAgents || 
                    this.configManager.get('agents.maxPerUser') || 
                    100,
                ...this._rawConfig
            };
            
            // Create necessary directories if they don't exist
            await this._ensureDirectories();
            
            // Load agent templates
            await this._loadAgentTemplates();
            
            // Set up event listeners
            this._setupEventListeners();
            
            this.isInitialized = true;
            this.metrics.lastActivity = new Date();
            this.emit('smith:initialized', { timestamp: this.metrics.lastActivity });
            
            return true;
        } catch (error) {
            const smithError = this.errorHandler.createConfigurationError(
                `Failed to initialize Smith: ${error.message}`,
                { originalError: error.message }
            );
            this.errorHandler.handleError(smithError);
            this.emit('smith:error', { error: smithError, context: 'initialization' });
            throw smithError;
        }
    }
    
    /**
     * Shutdown the Smith component
     * @returns {Promise<void>}
     */
    async shutdown() {
        if (!this.isInitialized) {
            return;
        }
        
        try {
            // Shut down all active agents
            const shutdownPromises = Array.from(this.agents.values())
                .map(agent => agent.shutdown());
            
            await Promise.all(shutdownPromises);
            
            this.agents.clear();
            this.isInitialized = false;
            
            this.emit('smith:shutdown', { timestamp: new Date() });
        } catch (error) {
            const smithError = this.errorHandler.createConfigurationError(
                `Error during Smith shutdown: ${error.message}`,
                { originalError: error.message }
            );
            this.errorHandler.handleError(smithError);
            throw smithError;
        }
    }
    
    /**
     * Connect to Architect and Oracle components
     * @param {Object} architect - Architect component
     * @param {Object} oracle - Oracle component
     */
    connectToTrinity(architect, oracle) {
        this.architect = architect;
        this.oracle = oracle;
        
        // Subscribe to relevant events
        if (this.architect) {
            this.architect.on('architect:agent_specification', this.handleAgentSpecification.bind(this));
        }
        
        if (this.oracle) {
            this.oracle.on('oracle:approval', this.handleOracleApproval.bind(this));
            this.oracle.on('oracle:rejection', this.handleOracleRejection.bind(this));
        }
        
        this.emit('smith:connected', { 
            hasArchitect: !!this.architect,
            hasOracle: !!this.oracle,
            timestamp: new Date()
        });
    }
    
    /**
     * Create a new agent based on specifications
     * @param {Object} specs - Agent specifications
     * @param {string} specs.type - Agent type/template
     * @param {string} specs.id - Unique identifier for the agent
     * @param {Object} specs.parameters - Configuration parameters for the agent
     * @param {boolean} specs.approved - Whether the agent creation is pre-approved
     * @returns {Promise<Object>} - Creation result
     */
    async createAgent(specs) {
        if (!this.isInitialized) {
            const error = this.errorHandler.createAgentError(
                'Cannot create agent: Smith not initialized',
                { specs }
            );
            this.errorHandler.handleError(error);
            throw error;
        }
        
        // Check if the agent creation requires Oracle approval
        if (!specs.approved && this.oracle) {
            // Queue the agent creation task and request approval
            this.taskQueue.push({ 
                type: 'agent_creation', 
                specs, 
                timestamp: new Date() 
            });
            
            this.oracle.requestApproval({
                type: 'agent_creation',
                specs,
                requestId: specs.id
            });
            
            return { 
                status: 'pending_approval', 
                agentId: specs.id 
            };
        }
        
        try {
            // Validate the agent specifications
            this._validateAgentSpecs(specs);
            
            // Check if we have the required template
            if (!this.templates.has(specs.type)) {
                throw new AgentError(`Agent template "${specs.type}" not found`, {
                    specs,
                    availableTemplates: Array.from(this.templates.keys())
                });
            }
            
            // Check if we're at capacity
            if (this.agents.size >= this.config.maxAgents) {
                throw new AgentError(`Cannot create agent: Maximum number of agents (${this.config.maxAgents}) reached`, {
                    specs,
                    currentAgentCount: this.agents.size
                });
            }
            
            // Get the template
            const template = this.templates.get(specs.type);
            
            // Create the agent instance
            const AgentClass = require(path.join(this.config.agentTemplatesPath, template.path));
            const agent = new AgentClass({
                id: specs.id || this._generateAgentId(specs.type),
                parameters: specs.parameters || {},
                smith: this,
                errorHandler: this.errorHandler
            });
            
            // Initialize the agent
            await agent.initialize();
            
            // Store the agent reference
            this.agents.set(agent.id, agent);
            
            // Update metrics
            this.metrics.totalAgentsCreated++;
            this.metrics.lastActivity = new Date();
            
            // Emit event
            this.emit('smith:agent_created', {
                agentId: agent.id,
                type: specs.type,
                timestamp: this.metrics.lastActivity
            });
            
            return {
                status: 'success',
                agentId: agent.id,
                agent
            };
        } catch (error) {
            // Wrap errors if needed
            const agentError = error instanceof AgentError 
                ? error 
                : this.errorHandler.createAgentError(
                    `Failed to create agent: ${error.message}`,
                    { specs, originalError: error.message }
                );
            
            this.errorHandler.handleError(agentError);
            this.emit('smith:error', { 
                error: agentError, 
                context: 'agent_creation', 
                specs 
            });
            
            return {
                status: 'error',
                message: agentError.message,
                details: this.config.includeErrorDetails ? agentError.details : undefined
            };
        }
    }
    
    /**
     * Destroy an existing agent
     * @param {string} agentId - ID of the agent to destroy
     * @returns {Promise<Object>} - Destruction result
     */
    async destroyAgent(agentId) {
        if (!this.agents.has(agentId)) {
            const error = this.errorHandler.createAgentError(
                `Agent "${agentId}" not found`,
                { agentId, availableAgents: Array.from(this.agents.keys()) }
            );
            this.errorHandler.handleError(error);
            
            return {
                status: 'error',
                message: error.message,
                details: this.config.includeErrorDetails ? error.details : undefined
            };
        }
        
        try {
            // Get the agent
            const agent = this.agents.get(agentId);
            
            // Shutdown the agent
            await agent.shutdown();
            
            // Remove from active agents
            this.agents.delete(agentId);
            
            // Update metrics
            this.metrics.totalAgentsDestroyed++;
            this.metrics.lastActivity = new Date();
            
            // Emit event
            this.emit('smith:agent_destroyed', {
                agentId,
                timestamp: this.metrics.lastActivity
            });
            
            return { status: 'success', agentId };
        } catch (error) {
            const agentError = this.errorHandler.createAgentError(
                `Failed to destroy agent: ${error.message}`,
                { agentId, originalError: error.message }
            );
            
            this.errorHandler.handleError(agentError);
            this.emit('smith:error', { 
                error: agentError, 
                context: 'agent_destruction', 
                agentId 
            });
            
            return {
                status: 'error',
                message: agentError.message,
                details: this.config.includeErrorDetails ? agentError.details : undefined
            };
        }
    }
    
    /**
     * Get an agent by ID
     * @param {string} agentId - ID of the agent to retrieve
     * @returns {Object|null} - Agent instance or null if not found
     */
    getAgent(agentId) {
        if (!this.agents.has(agentId)) {
            return null;
        }
        
        return this.agents.get(agentId);
    }
    
    /**
     * Get all active agents
     * @returns {Array} - Array of agent instances
     */
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    
    /**
     * Get current Smith metrics
     * @returns {Object} - Metrics object
     */
    getMetrics() {
        return { 
            ...this.metrics,
            activeAgentCount: this.agents.size,
            pendingTaskCount: this.taskQueue.length
        };
    }
    
    /**
     * Handle agent specification from Architect
     * @param {Object} data - Specification data
     */
    async handleAgentSpecification(data) {
        try {
            const { specs } = data;
            
            // Verify the specs
            if (!specs || !specs.id || !specs.type) {
                const error = this.errorHandler.createAgentError(
                    'Invalid agent specification from Architect',
                    { data }
                );
                this.errorHandler.handleError(error);
                return;
            }
            
            // Create the agent (this will handle Oracle approval if needed)
            const result = await this.createAgent(specs);
            
            // Report back to Architect
            if (this.architect) {
                this.architect.reportAgentCreation(result);
            }
        } catch (error) {
            const agentError = this.errorHandler.createAgentError(
                `Failed to process Architect specification: ${error.message}`,
                { data, originalError: error.message }
            );
            
            this.errorHandler.handleError(agentError);
            this.emit('smith:error', { 
                error: agentError, 
                context: 'architect_specification', 
                data 
            });
        }
    }
    
    /**
     * Handle approval from Oracle
     * @param {Object} data - Approval data
     */
    async handleOracleApproval(data) {
        try {
            const { requestId, type } = data;
            
            if (type !== 'agent_creation') {
                return; // Not our concern
            }
            
            // Find the pending task
            const taskIndex = this.taskQueue.findIndex(task => 
                task.type === 'agent_creation' && task.specs.id === requestId
            );
            
            if (taskIndex === -1) {
                console.warn(`No pending agent creation task found for request ID: ${requestId}`);
                return;
            }
            
            // Get the task and remove it from queue
            const task = this.taskQueue.splice(taskIndex, 1)[0];
            
            // Set approved flag
            task.specs.approved = true;
            
            // Create the agent
            const result = await this.createAgent(task.specs);
            
            // Report back to Architect if present
            if (this.architect) {
                this.architect.reportAgentCreation(result);
            }
        } catch (error) {
            const agentError = this.errorHandler.createAgentError(
                `Failed to process Oracle approval: ${error.message}`,
                { data, originalError: error.message }
            );
            
            this.errorHandler.handleError(agentError);
            this.emit('smith:error', { 
                error: agentError, 
                context: 'oracle_approval', 
                data 
            });
        }
    }
    
    /**
     * Handle rejection from Oracle
     * @param {Object} data - Rejection data
     */
    handleOracleRejection(data) {
        try {
            const { requestId, type, reason } = data;
            
            if (type !== 'agent_creation') {
                return; // Not our concern
            }
            
            // Find the pending task
            const taskIndex = this.taskQueue.findIndex(task => 
                task.type === 'agent_creation' && task.specs.id === requestId
            );
            
            if (taskIndex === -1) {
                console.warn(`No pending agent creation task found for request ID: ${requestId}`);
                return;
            }
            
            // Remove the task from queue
            const task = this.taskQueue.splice(taskIndex, 1)[0];
            
            // Emit event
            this.emit('smith:agent_rejected', {
                agentId: task.specs.id,
                reason,
                timestamp: new Date()
            });
            
            // Report back to Architect if present
            if (this.architect) {
                this.architect.reportAgentRejection({
                    status: 'rejected',
                    agentId: task.specs.id,
                    reason
                });
            }
        } catch (error) {
            const agentError = this.errorHandler.createAgentError(
                `Failed to process Oracle rejection: ${error.message}`,
                { data, originalError: error.message }
            );
            
            this.errorHandler.handleError(agentError);
            this.emit('smith:error', { 
                error: agentError, 
                context: 'oracle_rejection', 
                data 
            });
        }
    }
    
    /**
     * Ensure required directories exist
     * @private
     */
    async _ensureDirectories() {
        const directories = [
            this.config.agentTemplatesPath,
            this.config.agentStoragePath
        ];
        
        const createDirPromises = directories.map(async dir => {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                throw new Error(`Failed to create directory ${dir}: ${error.message}`);
            }
        });
        
        await Promise.all(createDirPromises);
    }
    
    /**
     * Load agent templates from templates directory
     * @private
     */
    async _loadAgentTemplates() {
        try {
            // Look for templates.json file
            const templatesPath = path.join(this.config.agentTemplatesPath, 'templates.json');
            const templatesData = await fs.readFile(templatesPath, 'utf8');
            const templates = JSON.parse(templatesData);
            
            // Store templates
            for (const [key, template] of Object.entries(templates)) {
                this.templates.set(key, template);
            }
            
            this.emit('smith:templates_loaded', {
                count: this.templates.size,
                templates: Array.from(this.templates.keys())
            });
        } catch (error) {
            throw new Error(`Failed to load agent templates: ${error.message}`);
        }
    }
    
    /**
     * Validate agent specifications
     * @param {Object} specs - Agent specifications
     * @throws {Error} If specs are invalid
     * @private
     */
    _validateAgentSpecs(specs) {
        if (!specs) {
            throw new AgentError('Agent specifications are required');
        }
        
        if (!specs.type) {
            throw new AgentError('Agent type is required', { specs });
        }
        
        // Additional validation can be implemented here
    }
    
    /**
     * Generate a unique agent ID
     * @param {string} type - Agent type
     * @returns {string} - Generated agent ID
     * @private
     */
    _generateAgentId(type) {
        const prefix = this.configManager.get('agents.idPrefix', 'agent_');
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}${type.toLowerCase()}_${timestamp}_${randomSuffix}`;
    }
    
    /**
     * Set up event listeners
     * @private
     */
    _setupEventListeners() {
        // Log errors in development mode
        if (process.env.NODE_ENV === 'development') {
            this.on('smith:error', ({ error, context }) => {
                console.error(`Smith error in context '${context}':`, error);
            });
        }
    }
}

module.exports = Smith; 