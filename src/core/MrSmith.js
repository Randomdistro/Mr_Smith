/**
 * MrSmith - Main System Controller
 * Orchestrates the entire agent ecosystem using the new tier-based architecture
 */

const EventBus = require('./EventBus');
const AgentFactory = require('./AgentFactory');
const EnterpriseDatabase = require('./EnterpriseDatabase');
const WorkflowManager = require('../workflow/WorkflowManager');
const BehavioralMatrix = require('./BehavioralMatrix');

class MrSmith {
    constructor(config = {}) {
        this.eventBus = new EventBus();
        this.database = new EnterpriseDatabase();
        this.behavioralMatrix = new BehavioralMatrix();
        this.workflowManager = null;
        this.systemStartTime = new Date();
        
        this.config = {
            // Default configuration
            operationalMode: 'autonomous', // 'autonomous' or 'supervised'
            dataRetentionPolicy: 'compliance',
            ethicalConstraints: 'oracle-approved',
            maxConcurrentWorkflows: 5,
            maxAgentsPerTier: {
                lightweight: 50, // Tier 1: Many ephemeral agents allowed
                core: 10,        // Tier 2: Core flexible agents
                specialist: 5,   // Tier 3: Resource-intensive specialists
                orchestrator: 3  // Tier 4: Clones of Mr. Smith for distributed processing
            },
            ...config
        };
        
        this.logger = config.logger || console;
        
        // Initialize agent factory
        this.agentFactory = new AgentFactory(this);
    }

    async initialize() {
        try {
            // Initialize core systems
            this.logger.info('Initializing MrSmith core systems...');
            await this.database.connect();
            await this.behavioralMatrix.load();
            
            // Initialize workflow manager
            this.logger.info('Initializing workflow manager...');
            this.workflowManager = new WorkflowManager(this);
            
            // Set up event listeners
            this.logger.info('Setting up event listeners...');
            this.setupEventListeners();
            
            // Initialize core agents 
            // These are always-on agents needed for basic functionality
            this.logger.info('Initializing core agents...');
            await this.initializeCoreAgents();
            
            this.logger.info('MrSmith system initialization complete');
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize MrSmith:', error);
            throw error;
        }
    }

    async initializeCoreAgents() {
        try {
            // Get core-tier agents only
            const coreAgentTypes = this.agentFactory.getAgentTypesByTier('core');
            
            for (const agentType of coreAgentTypes) {
                try {
                    // Skip optional core agents during development
                    const isRequired = ['ResearcherAgent', 'DataProcessorAgent'].includes(agentType);
                    
                    if (isRequired) {
                        await this.agentFactory.getAgent(agentType);
                        this.logger.info(`Initialized core agent: ${agentType}`);
                    }
                } catch (error) {
                    if (isRequired) {
                        throw error; // Re-throw for required agents
                    } else {
                        // Just log for optional agents
                        this.logger.warn(`Failed to initialize optional core agent ${agentType}: ${error.message}`);
                    }
                }
            }
            
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize core agents:', error);
            throw error;
        }
    }

    setupEventListeners() {
        this.eventBus.on('workflow:start', this.handleWorkflowStart.bind(this));
        this.eventBus.on('workflow:complete', this.handleWorkflowComplete.bind(this));
        this.eventBus.on('agent:task:complete', this.handleAgentTaskComplete.bind(this));
        this.eventBus.on('error', this.handleError.bind(this));
        
        // Add tier-specific event handlers
        this.eventBus.on('agent:created', this.handleAgentCreated.bind(this));
        this.eventBus.on('agent:released', this.handleAgentReleased.bind(this));
    }

    async handleWorkflowStart(workflowData) {
        try {
            this.logger.info(`Starting workflow: ${workflowData.type}`);
            await this.workflowManager.startWorkflow(workflowData);
        } catch (error) {
            this.handleError(error);
        }
    }

    async handleWorkflowComplete(workflowData) {
        try {
            this.logger.info(`Completing workflow: ${workflowData.id}`);
            await this.workflowManager.completeWorkflow(workflowData);
        } catch (error) {
            this.handleError(error);
        }
    }

    async handleAgentTaskComplete(taskData) {
        try {
            this.logger.info(`Agent task completed: ${taskData.agent} - ${taskData.task}`);
            // Process completed task
            this.eventBus.emit('task:complete', taskData);
        } catch (error) {
            this.handleError(error);
        }
    }
    
    async handleAgentCreated(agentData) {
        try {
            const { agentType, tier } = agentData;
            this.logger.debug(`Agent created: ${agentType} (${tier})`);
            
            // Check if we're exceeding limits for this tier
            const activeAgents = this.agentFactory.getActiveAgents();
            const agentsInTier = Array.from(activeAgents.values())
                .filter(agent => agent.config.tier === tier);
                
            const tierLimit = this.config.maxAgentsPerTier[tier];
            
            if (agentsInTier.length > tierLimit) {
                this.logger.warn(`Tier ${tier} has ${agentsInTier.length} agents, exceeding the limit of ${tierLimit}`);
            }
        } catch (error) {
            this.handleError(error);
        }
    }
    
    async handleAgentReleased(agentData) {
        try {
            const { agentType, tier } = agentData;
            this.logger.debug(`Agent released: ${agentType} (${tier})`);
        } catch (error) {
            this.handleError(error);
        }
    }

    handleError(error) {
        this.logger.error('System error:', error);
        // Implement error handling logic
        this.eventBus.emit('system:error', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Creates a specialized agent of the specified type when needed
     * Implements the "on-demand" instantiation approach
     * @param {string} agentType - Type of agent to create
     * @param {Object} config - Agent configuration
     * @returns {Promise<Agent>} - The instantiated agent
     */
    async createAgent(agentType, config = {}) {
        try {
            const agent = await this.agentFactory.getAgent(agentType, config);
            return agent;
        } catch (error) {
            this.logger.error(`Failed to create agent ${agentType}:`, error);
            throw error;
        }
    }
    
    /**
     * Creates a temporary "fire and forget" agent that will be released after completing its task
     * @param {string} agentType - Type of lightweight agent to create
     * @param {Object} taskData - The task for the agent to perform
     * @returns {Promise<any>} - The result of the agent's task
     */
    async createTemporaryAgent(agentType, taskData) {
        try {
            // Create a temporary agent (will be garbage collected after task completion)
            const agent = await this.agentFactory.getAgent(agentType, { temporary: true });
            
            // Have it process the task directly
            const result = await agent.handleTask(taskData);
            
            // Result is returned and agent will be cleaned up automatically
            return result;
        } catch (error) {
            this.logger.error(`Error with temporary agent ${agentType}:`, error);
            throw error;
        }
    }
    
    /**
     * Releases a specialist agent when it's no longer needed
     * @param {string} agentType - The type of agent to release
     */
    releaseAgent(agentType) {
        this.agentFactory.releaseAgent(agentType);
    }
    
    /**
     * Create a distributed clone of Mr. Smith for load balancing
     * @param {Object} config - Clone configuration
     * @returns {Promise<Agent>} - The Mr. Smith clone
     */
    async cloneInstance(config = {}) {
        return await this.createAgent('MrSmithClone', {
            ...config,
            tier: 'orchestrator',
            parentId: this.id || 'primary'
        });
    }

    getAgentStatus(agentId) {
        const activeAgents = this.agentFactory.getActiveAgents();
        
        for (const agent of activeAgents.values()) {
            if (agent.id === agentId) {
                return agent.getState();
            }
        }
        
        return {
            status: 'error',
            message: 'Agent not found'
        };
    }

    getAgentPerformance(agentId) {
        const activeAgents = this.agentFactory.getActiveAgents();
        
        for (const agent of activeAgents.values()) {
            if (agent.id === agentId) {
                return agent.getPerformanceMetrics ? agent.getPerformanceMetrics() : { status: 'not-implemented' };
            }
        }
        
        return {
            status: 'error',
            message: 'Agent not found'
        };
    }
    
    /**
     * Get information about all active agents by tier
     * @returns {Object} - Information about active agents by tier
     */
    getActiveAgents() {
        const activeAgents = this.agentFactory.getActiveAgents();
        const result = {
            total: activeAgents.size,
            byTier: {
                lightweight: 0,
                core: 0,
                specialist: 0,
                orchestrator: 0
            },
            agents: []
        };
        
        for (const agent of activeAgents.values()) {
            const tier = agent.config.tier;
            result.byTier[tier] = (result.byTier[tier] || 0) + 1;
            
            result.agents.push({
                id: agent.id,
                type: agent.constructor.name,
                tier: tier,
                status: agent.state.status
            });
        }
        
        return result;
    }

    calculateUptime() {
        const now = new Date();
        const uptimeMs = now - this.systemStartTime;

        return {
            milliseconds: uptimeMs,
            seconds: Math.floor(uptimeMs / 1000),
            minutes: Math.floor(uptimeMs / (1000 * 60)),
            hours: Math.floor(uptimeMs / (1000 * 60 * 60)),
            days: Math.floor(uptimeMs / (1000 * 60 * 60 * 24))
        };
    }
    
    /**
     * Shutdown the system and release all resources
     */
    async shutdown() {
        this.logger.info('Starting system shutdown...');
        
        // Signal shutdown to all agents
        this.eventBus.emit('system:shutdown');
        
        // Shutdown the agent factory
        await this.agentFactory.shutdown();
        
        // Disconnect from database
        await this.database.disconnect();
        
        this.logger.info('System shutdown complete');
    }
}

module.exports = MrSmith; 