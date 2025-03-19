/**
 * MrSmithClone - Tier 4 agent for distributed orchestration
 * Allows the system to distribute workloads across multiple instances
 */

const Agent = require('../../core/Agent');
const EventBus = require('../../core/EventBus');

class MrSmithClone extends Agent {
    constructor(mrSmith, config = {}) {
        super(mrSmith, {
            tier: 'orchestrator',
            temporary: false, // Clones are long-lived
            ...config
        });
        
        // Clone-specific properties
        this.parentId = config.parentId || 'primary';
        this.workloadAllocation = config.workloadAllocation || 0.2; // Default 20% of parent's workload
        this.specialization = config.specialization || null; // Optional domain specialization
        
        // Local event bus for this clone
        this.localEventBus = new EventBus();
        
        // Track assigned workflows
        this.assignedWorkflows = new Map();
    }
    
    async initializeTools() {
        try {
            // Load core orchestration tools
            const WorkflowManagerTool = require('../../tools/workflow/WorkflowManagerTool');
            this.tools.set('workflow-manager', new WorkflowManagerTool({
                mrSmith: this.mrSmith,
                agent: this
            }));
            
            const AgentManagerTool = require('../../tools/workflow/AgentManagerTool');
            this.tools.set('agent-manager', new AgentManagerTool({
                mrSmith: this.mrSmith,
                agent: this
            }));
            
            const ResourceMonitorTool = require('../../tools/workflow/ResourceMonitorTool');
            this.tools.set('resource-monitor', new ResourceMonitorTool({
                mrSmith: this.mrSmith,
                agent: this
            }));
            
            // If this clone has a specialization, load domain-specific tools
            if (this.specialization) {
                await this._loadSpecializedTools();
            }
            
            this.logger.info(`MrSmithClone initialized with ${this.tools.size} tools, specialization: ${this.specialization || 'none'}`);
        } catch (error) {
            this.logger.error('Error initializing MrSmithClone tools:', error);
            throw error;
        }
    }
    
    async _loadSpecializedTools() {
        // Load domain-specific tools based on specialization
        switch (this.specialization) {
            case 'manufacturing':
                const ManufacturingTool = require('../../tools/domain/ManufacturingTool');
                this.tools.set('manufacturing', new ManufacturingTool({
                    mrSmith: this.mrSmith,
                    agent: this
                }));
                break;
                
            case 'robotics':
                const RoboticsTool = require('../../tools/domain/RoboticsTool');
                this.tools.set('robotics', new RoboticsTool({
                    mrSmith: this.mrSmith,
                    agent: this
                }));
                break;
                
            case 'data-processing':
                const AnalyticsTool = require('../../tools/data-processing/AnalyticsTool');
                this.tools.set('analytics', new AnalyticsTool({
                    mrSmith: this.mrSmith,
                    agent: this
                }));
                break;
        }
    }
    
    _registerEventListeners() {
        // Call parent method first
        super._registerEventListeners();
        
        // Register for workflow-related events
        this.eventBus.on('workflow:delegate', this.handleWorkflowDelegation.bind(this));
        
        // Set up local event forwarding
        this.localEventBus.on('workflow:complete', (data) => {
            // Forward to main event bus with clone info
            this.eventBus.emit('workflow:complete', {
                ...data,
                processedBy: this.id,
                cloneId: this.id
            });
        });
        
        // Status reporting
        setInterval(() => {
            this._reportStatus();
        }, 60000); // Report status every minute
    }
    
    async handleWorkflowDelegation(workflowData) {
        try {
            // Check if this delegation is for this clone
            if (workflowData.targetClone !== this.id) {
                return;
            }
            
            this.logger.info(`Received delegated workflow: ${workflowData.type} (${workflowData.id})`);
            
            // Track this workflow
            this.assignedWorkflows.set(workflowData.id, {
                ...workflowData,
                status: 'received',
                receivedAt: new Date()
            });
            
            // Process the workflow
            await this.processTask({
                type: 'workflow:process',
                workflowId: workflowData.id,
                workflowData
            });
            
        } catch (error) {
            this.logger.error(`Error handling delegated workflow:`, error);
            throw error;
        }
    }
    
    async processTask(taskData) {
        try {
            const { type } = taskData;
            
            switch (type) {
                case 'workflow:process':
                    return await this._processWorkflow(taskData);
                    
                case 'agents:manage':
                    return await this._manageAgents(taskData);
                    
                case 'resources:monitor':
                    return await this._monitorResources(taskData);
                    
                case 'clone:status':
                    return this._getStatus();
                    
                default:
                    throw new Error(`Unknown task type for MrSmithClone: ${type}`);
            }
        } catch (error) {
            this.logger.error(`Error processing task ${taskData.type}:`, error);
            throw error;
        }
    }
    
    async _processWorkflow(taskData) {
        const { workflowId, workflowData } = taskData;
        
        // Update workflow status
        const workflow = this.assignedWorkflows.get(workflowId);
        if (workflow) {
            workflow.status = 'processing';
            workflow.startedAt = new Date();
        }
        
        // Use workflow manager tool
        const workflowManagerTool = this.tools.get('workflow-manager');
        
        const result = await workflowManagerTool.execute({
            action: 'process-workflow',
            workflow: workflowData,
            eventBus: this.localEventBus // Use local event bus for this workflow
        });
        
        // Update workflow status
        if (workflow) {
            workflow.status = 'completed';
            workflow.completedAt = new Date();
        }
        
        return result;
    }
    
    async _manageAgents(taskData) {
        const { action, agentType, config } = taskData;
        
        // Use agent manager tool
        const agentManagerTool = this.tools.get('agent-manager');
        
        return await agentManagerTool.execute({
            action,
            agentType,
            config
        });
    }
    
    async _monitorResources(taskData) {
        // Use resource monitor tool
        const resourceMonitorTool = this.tools.get('resource-monitor');
        
        return await resourceMonitorTool.execute({
            action: 'get-metrics',
            detail: taskData.detail || 'summary'
        });
    }
    
    _getStatus() {
        // Calculate workload metrics
        const totalWorkflows = this.assignedWorkflows.size;
        const activeWorkflows = Array.from(this.assignedWorkflows.values())
            .filter(w => w.status === 'processing')
            .length;
            
        const completedWorkflows = Array.from(this.assignedWorkflows.values())
            .filter(w => w.status === 'completed')
            .length;
        
        return {
            id: this.id,
            parentId: this.parentId,
            specialization: this.specialization,
            uptime: this._calculateUptime(),
            workloads: {
                total: totalWorkflows,
                active: activeWorkflows,
                completed: completedWorkflows,
                capacity: Math.max(0, 1 - (activeWorkflows / (this.config.maxWorkflows || 10)))
            },
            status: this.state.status
        };
    }
    
    _calculateUptime() {
        const now = new Date();
        const started = new Date(this.state.startedAt || this.systemStartTime);
        const uptimeMs = now - started;
        
        return {
            milliseconds: uptimeMs,
            seconds: Math.floor(uptimeMs / 1000),
            minutes: Math.floor(uptimeMs / 60000),
            hours: Math.floor(uptimeMs / 3600000)
        };
    }
    
    _reportStatus() {
        const status = this._getStatus();
        
        // Report status to parent
        this.eventBus.emit('clone:status:report', {
            ...status,
            reportedAt: new Date()
        });
    }
    
    async delegateWorkflow(workflowData, targetCloneId) {
        // Delegate a workflow to another clone
        this.logger.info(`Delegating workflow ${workflowData.id} to clone ${targetCloneId}`);
        
        this.eventBus.emit('workflow:delegate', {
            ...workflowData,
            delegatedBy: this.id,
            targetClone: targetCloneId,
            delegatedAt: new Date()
        });
        
        return {
            status: 'delegated',
            workflowId: workflowData.id,
            targetClone: targetCloneId
        };
    }
    
    cleanup() {
        // Report final status before shutdown
        this._reportStatus();
        
        // Clean up event forwarding
        this.localEventBus.removeAllListeners();
        
        // Call parent cleanup
        super.cleanup();
    }
}

module.exports = MrSmithClone; 