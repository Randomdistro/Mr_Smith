/**
 * AgentFactory - Manages agent creation and lifecycle
 * Responsible for instantiating agents based on the 4-tier structure:
 * 1. Lightweight "Fire and Forget" Agents
 * 2. Flexible Core Agents (3-4 tools)
 * 3. High-Compute Specialists
 * 4. Orchestration (handled by Mr. Smith)
 */

const path = require('path');
const fs = require('fs-extra');

class AgentFactory {
    constructor(mrSmith) {
        this.mrSmith = mrSmith;
        this.logger = mrSmith.logger || console;
        this.agentRegistry = new Map();
        this.activeAgents = new Map();
        this.agentTiers = {
            lightweight: [], // Tier 1: Fire and forget
            core: [],        // Tier 2: Core flexible agents
            specialist: [],  // Tier 3: High-compute specialists
            orchestrator: [] // Tier 4: Orchestration (Mr. Smith and clones)
        };
        
        // Initialize registry with available agent classes
        this._initializeRegistry();
    }
    
    /**
     * Initialize the agent registry with all available agent classes
     */
    _initializeRegistry() {
        try {
            // Register Tier 1: Lightweight agents
            this._registerAgentType('QueryAgent', require('../agents/lightweight/QueryAgent'), 'lightweight');
            this._registerAgentType('NotificationAgent', require('../agents/lightweight/NotificationAgent'), 'lightweight');
            
            // Register Tier 2: Core agents
            this._registerAgentType('ResearcherAgent', require('../agents/core/ResearcherAgent'), 'core');
            this._registerAgentType('DataProcessorAgent', require('../agents/core/DataProcessorAgent'), 'core');
            this._registerAgentType('CommunicationsAgent', require('../agents/core/CommunicationsAgent'), 'core');
            this._registerAgentType('ContactManagerAgent', require('../agents/core/ContactManagerAgent'), 'core');
            
            // Register Tier 3: Specialist agents
            this._registerAgentType('CADAgent', require('../agents/specialists/CADAgent'), 'specialist');
            this._registerAgentType('EngineerAgent', require('../agents/specialists/EngineerAgent'), 'specialist');
            this._registerAgentType('DesignAgent', require('../agents/specialists/DesignAgent'), 'specialist');
            
            // Register Tier 4: Orchestration
            this._registerAgentType('MrSmithClone', require('../agents/orchestration/MrSmithClone'), 'orchestrator');
            
        } catch (error) {
            this.logger.error('Error initializing agent registry:', error);
            // Gracefully handle missing agent types during development
            this.logger.info('Some agent types could not be registered. This is normal during development.');
        }
    }
    
    /**
     * Register an agent type in the registry
     * @param {string} name - The name of the agent type
     * @param {Class} AgentClass - The agent class constructor
     * @param {string} tier - The tier this agent belongs to
     */
    _registerAgentType(name, AgentClass, tier) {
        if (!AgentClass) {
            this.logger.warn(`Agent class not found: ${name}`);
            return;
        }
        
        this.agentRegistry.set(name, { 
            AgentClass,
            tier 
        });
        
        // Add to tier list
        if (this.agentTiers[tier]) {
            this.agentTiers[tier].push(name);
        }
        
        this.logger.debug(`Registered agent type: ${name} (${tier})`);
    }
    
    /**
     * Get or create an agent instance
     * @param {string} agentType - The type of agent to create
     * @param {Object} config - Configuration options
     * @returns {Promise<Agent>} - The agent instance
     */
    async getAgent(agentType, config = {}) {
        const temporary = config.temporary === true;
        
        // If it's not temporary and already active, return the existing instance
        if (!temporary && this.activeAgents.has(agentType)) {
            return this.activeAgents.get(agentType);
        }
        
        // Create a new agent instance
        const agent = await this._createAgent(agentType, config);
        
        // If it's not temporary, store it in active agents
        if (!temporary) {
            this.activeAgents.set(agentType, agent);
        }
        
        return agent;
    }
    
    /**
     * Create a new agent instance
     * @param {string} agentType - The type of agent to create
     * @param {Object} config - Configuration options
     * @returns {Promise<Agent>} - The newly created agent
     */
    async _createAgent(agentType, config = {}) {
        const agentInfo = this.agentRegistry.get(agentType);
        
        if (!agentInfo) {
            throw new Error(`Unknown agent type: ${agentType}`);
        }
        
        const { AgentClass, tier } = agentInfo;
        
        // Create the agent instance
        const agent = new AgentClass(this.mrSmith, {
            ...config,
            tier
        });
        
        // Initialize the agent
        await agent.initialize();
        
        this.logger.info(`Created agent: ${agentType} (${tier})`);
        this.mrSmith.eventBus.emit('agent:created', { agentType, tier });
        
        return agent;
    }
    
    /**
     * Release an agent and clean up its resources
     * @param {string} agentType - The type of agent to release
     */
    releaseAgent(agentType) {
        if (!this.activeAgents.has(agentType)) {
            return;
        }
        
        const agent = this.activeAgents.get(agentType);
        const tier = this.agentRegistry.get(agentType)?.tier;
        
        // Clean up resources
        agent.cleanup();
        this.activeAgents.delete(agentType);
        
        this.logger.info(`Released agent: ${agentType} (${tier})`);
        this.mrSmith.eventBus.emit('agent:released', { agentType, tier });
    }
    
    /**
     * Get all active agents
     * @returns {Map<string, Agent>} - Map of active agents
     */
    getActiveAgents() {
        return this.activeAgents;
    }
    
    /**
     * Get all available agent types
     * @returns {Array<string>} - Array of agent type names
     */
    getAvailableAgentTypes() {
        return Array.from(this.agentRegistry.keys());
    }
    
    /**
     * Get agent types by tier
     * @param {string} tier - The tier to get agent types for
     * @returns {Array<string>} - Array of agent type names in the tier
     */
    getAgentTypesByTier(tier) {
        return this.agentTiers[tier] || [];
    }
    
    /**
     * Clean up all agents and resources
     */
    async shutdown() {
        // Release all agents
        for (const agentType of this.activeAgents.keys()) {
            this.releaseAgent(agentType);
        }
        
        this.logger.info('Agent factory shutdown complete');
    }
}

module.exports = AgentFactory; 