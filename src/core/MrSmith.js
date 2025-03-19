/**
 * MrSmith - Main System Controller Class
 * Orchestrates the entire system of specialized agents and tools
 */

const EventBus = require('./EventBus');
const Agent = require('./Agent');
const EnterpriseDatabase = require('./EnterpriseDatabase');
const BehavioralMatrix = require('./BehavioralMatrix');

// Import base agents
const ResearcherAgent = require('../agents/ResearcherAgent');
const DataProcessorAgent = require('../agents/DataProcessorAgent');
const ContactManagerAgent = require('../agents/ContactManagerAgent');
const CommunicationsAgent = require('../agents/CommunicationsAgent');
const OpportunityAnalyzerAgent = require('../agents/OpportunityAnalyzerAgent');

// Import specialized agents
const EngineerAgent = require('../agents/EngineerAgent');
const MechanicAgent = require('../agents/MechanicAgent');
const DesignAgent = require('../agents/DesignAgent');
const CADAgent = require('../agents/CADAgent');
const PrintSliceAgent = require('../agents/PrintSliceAgent');

// Import teams
const ManufacturingTeam = require('../teams/manufacturing/ManufacturingTeam');
const RobotailoringTeam = require('../teams/robotailoring/RobotailoringTeam');

class MrSmith {
    constructor(config = {}) {
        this.eventBus = new EventBus();
        this.database = new EnterpriseDatabase();
        this.behavioralMatrix = new BehavioralMatrix();
        this.agents = new Map();
        this.teams = new Map();
        this.workflowManager = null;
        this.systemStartTime = new Date();
        
        this.config = {
            maxAgents: 15,
            dataRetentionPolicy: 'compliance',
            operationalMode: 'autonomous',
            ethicalConstraints: 'oracle-approved',
            learningRate: 0.85,
            interAgentCommunication: true,
            adaptivePersonalization: true,
            performanceMetrics: {
                responseTime: true,
                conversionRate: true,
                relationshipDepth: true,
                dataAccuracy: true,
                opportunityDiscovery: true
            },
            ...config
        };
        
        this.logger = config.logger || console;
    }

    async initialize() {
        try {
            // Initialize core systems
            this.logger.info('Initializing MrSmith core systems...');
            await this.database.connect();
            await this.behavioralMatrix.load();
            
            // Initialize workflow manager
            this.logger.info('Initializing workflow manager...');
            this.workflowManager = new (require('../workflow/WorkflowManager'))(this);
            
            // Initialize base agents
            this.logger.info('Initializing base agents...');
            await this.initializeBaseAgents();
            
            // Initialize specialized agents
            this.logger.info('Initializing specialized agents...');
            await this.initializeSpecializedAgents();
            
            // Initialize teams
            this.logger.info('Initializing teams...');
            await this.initializeTeams();
            
            // Set up event listeners
            this.logger.info('Setting up event listeners...');
            this.setupEventListeners();
            
            this.logger.info('MrSmith system initialization complete');
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize MrSmith:', error);
            throw error;
        }
    }

    async initializeBaseAgents() {
        try {
            // Initialize the base agents
            const baseAgents = [
                { name: 'ResearcherAgent', AgentClass: ResearcherAgent },
                { name: 'DataProcessorAgent', AgentClass: DataProcessorAgent },
                { name: 'ContactManagerAgent', AgentClass: ContactManagerAgent },
                { name: 'CommunicationsAgent', AgentClass: CommunicationsAgent },
                { name: 'OpportunityAnalyzerAgent', AgentClass: OpportunityAnalyzerAgent }
            ];
            
            for (const { name, AgentClass } of baseAgents) {
                this.logger.info(`Initializing ${name}...`);
                const agent = new AgentClass(this);
                await agent.initialize();
                this.agents.set(name, agent);
            }
            
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize base agents:', error);
            throw error;
        }
    }

    async initializeSpecializedAgents() {
        try {
            // Initialize specialized agents
            const specializedAgents = [
                { name: 'EngineerAgent', AgentClass: EngineerAgent },
                { name: 'MechanicAgent', AgentClass: MechanicAgent },
                { name: 'DesignAgent', AgentClass: DesignAgent },
                { name: 'CADAgent', AgentClass: CADAgent },
                { name: 'PrintSliceAgent', AgentClass: PrintSliceAgent }
            ];
            
            for (const { name, AgentClass } of specializedAgents) {
                this.logger.info(`Initializing ${name}...`);
                const agent = new AgentClass(this);
                await agent.initialize();
                this.agents.set(name, agent);
            }
            
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize specialized agents:', error);
            throw error;
        }
    }

    async initializeTeams() {
        try {
            // Initialize teams
            
            // Manufacturing Design Team
            this.logger.info('Initializing Manufacturing Team...');
            const manufacturingTeam = new ManufacturingTeam(this);
            this.teams.set('ManufacturingTeam', manufacturingTeam);
            
            // Robotailoring Design Team
            this.logger.info('Initializing Robotailoring Team...');
            const robotailoringTeam = new RobotailoringTeam(this);
            this.teams.set('RobotailoringTeam', robotailoringTeam);
            
            // TODO: Add other teams as they are implemented
            
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize teams:', error);
            throw error;
        }
    }

    setupEventListeners() {
        this.eventBus.on('workflow:start', this.handleWorkflowStart.bind(this));
        this.eventBus.on('workflow:complete', this.handleWorkflowComplete.bind(this));
        this.eventBus.on('agent:task:complete', this.handleAgentTaskComplete.bind(this));
        this.eventBus.on('error', this.handleError.bind(this));
        
        // Add more event listeners as needed
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

    handleError(error) {
        this.logger.error('System error:', error);
        // Implement error handling logic
        this.eventBus.emit('system:error', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }

    getAgentStatus(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return {
                status: 'error',
                message: 'Agent not found'
            };
        }

        return agent.getState();
    }

    getAgentPerformance(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return {
                status: 'error',
                message: 'Agent not found'
            };
        }
        
        return agent.getPerformanceMetrics ? agent.getPerformanceMetrics() : { status: 'not-implemented' };
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

    getDataFlowMetrics() {
        const metrics = {
            totalDataPoints: 0,
            dataPointsByType: {},
            dataFlowRates: {},
            bottlenecks: [],
            optimizationOpportunities: []
        };

        // Collect metrics from each agent
        for (const [agentId, agent] of this.agents.entries()) {
            if (agent.getDataFlowMetrics) {
                const agentMetrics = agent.getDataFlowMetrics();
                
                // Aggregate total data points
                metrics.totalDataPoints += agentMetrics.processedDataPoints || 0;
                
                // Aggregate by data type
                if (agentMetrics.dataPointsByType) {
                    Object.entries(agentMetrics.dataPointsByType).forEach(([type, count]) => {
                        metrics.dataPointsByType[type] = (metrics.dataPointsByType[type] || 0) + count;
                    });
                }
                
                // Track flow rates
                if (agentMetrics.processingRate) {
                    metrics.dataFlowRates[agentId] = agentMetrics.processingRate;
                }
                
                // Identify bottlenecks
                if (agentMetrics.processingRate && agentMetrics.incomingRate) {
                    if (agentMetrics.processingRate < agentMetrics.incomingRate * 0.8) {
                        metrics.bottlenecks.push({
                            agentId,
                            severity: 'high',
                            incomingRate: agentMetrics.incomingRate,
                            processingRate: agentMetrics.processingRate,
                            backlogSize: agentMetrics.backlogSize || 0
                        });
                    } else if (agentMetrics.processingRate < agentMetrics.incomingRate) {
                        metrics.bottlenecks.push({
                            agentId,
                            severity: 'medium',
                            incomingRate: agentMetrics.incomingRate,
                            processingRate: agentMetrics.processingRate,
                            backlogSize: agentMetrics.backlogSize || 0
                        });
                    }
                }
                
                // Identify optimization opportunities
                if (agentMetrics.idleTimePercentage && agentMetrics.idleTimePercentage > 20) {
                    metrics.optimizationOpportunities.push({
                        agentId,
                        type: 'underutilization',
                        idleTimePercentage: agentMetrics.idleTimePercentage,
                        recommendedAction: 'add-tasks-or-increase-workload'
                    });
                }
                
                if (agentMetrics.errorRate && agentMetrics.errorRate > 0.05) {
                    metrics.optimizationOpportunities.push({
                        agentId,
                        type: 'error-rate',
                        errorRate: agentMetrics.errorRate,
                        recommendedAction: 'improve-error-handling'
                    });
                }
            }
        }

        return metrics;
    }

    getSystemLoad() {
        // In a real system, this would collect actual metrics
        // Here we're providing simulated values
        return {
            cpuUtilization: Math.random() * 0.5 + 0.3, // Between 30-80%
            memoryUtilization: Math.random() * 0.4 + 0.4, // Between 40-80%
            diskUtilization: Math.random() * 0.3 + 0.2, // Between 20-50%
            networkUtilization: Math.random() * 0.6 + 0.2, // Between 20-80%
            threadCount: this.agents.size * 3 + 5, // Base + 3 threads per agent
            activeConnections: Math.floor(Math.random() * 50) + 10 // Between 10-60
        };
    }

    async shutdown() {
        try {
            this.logger.info('Shutting down MrSmith system...');
            
            // Shutdown all agents
            for (const agent of this.agents.values()) {
                await agent.shutdown();
            }

            // Shutdown core systems
            await this.database.disconnect();
            await this.behavioralMatrix.save();
            
            this.logger.info('MrSmith system shutdown complete');

            return true;
        } catch (error) {
            this.logger.error('Failed to shutdown MrSmith:', error);
            throw error;
        }
    }
}

module.exports = MrSmith; 