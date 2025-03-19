/**
 * WorkflowManager - Coordinates workflows across agents and teams
 * Handles the lifecycle of workflows from creation to completion
 */

class WorkflowManager {
    constructor(mrSmith) {
        this.mrSmith = mrSmith;
        this.logger = mrSmith.logger;
        this.eventBus = mrSmith.eventBus;
        this.workflows = new Map();
        this.workflowTemplates = new Map();
        
        // Register default workflow templates
        this.registerDefaultWorkflows();
    }
    
    registerDefaultWorkflows() {
        // Manufacturing workflow
        this.workflowTemplates.set('manufacturing', {
            name: 'Manufacturing Workflow',
            description: 'End-to-end manufacturing design and production workflow',
            steps: [
                { name: 'requirements', agent: 'ResearcherAgent', task: 'gatherRequirements' },
                { name: 'design', agent: 'DesignAgent', task: 'createDesign' },
                { name: 'engineering', agent: 'EngineerAgent', task: 'engineerProduct' },
                { name: 'modeling', agent: 'CADAgent', task: 'createModel' },
                { name: 'production', team: 'ManufacturingTeam', task: 'prepareForProduction' }
            ]
        });
        
        // Robotailoring workflow
        this.workflowTemplates.set('robotailoring', {
            name: 'Robotailoring Workflow',
            description: 'Design and creation of task-specific robots',
            steps: [
                { name: 'requirements', agent: 'ResearcherAgent', task: 'gatherRequirements' },
                { name: 'design', agent: 'DesignAgent', task: 'createDesign' },
                { name: 'engineering', agent: 'EngineerAgent', task: 'engineerProduct' },
                { name: 'mechanics', agent: 'MechanicAgent', task: 'designMechanics' },
                { name: 'modeling', agent: 'CADAgent', task: 'createModel' },
                { name: 'production', team: 'RobotailoringTeam', task: 'assembleRobot' }
            ]
        });
    }
    
    async startWorkflow(workflowData) {
        try {
            const { type, data } = workflowData;
            
            if (!this.workflowTemplates.has(type)) {
                throw new Error(`Workflow template not found: ${type}`);
            }
            
            const template = this.workflowTemplates.get(type);
            const workflowId = `${type}-${Date.now()}`;
            
            // Create workflow instance
            const workflow = {
                id: workflowId,
                type,
                template,
                data,
                status: 'started',
                currentStep: 0,
                steps: [...template.steps],
                results: {},
                startedAt: new Date(),
                completedAt: null
            };
            
            // Store workflow
            this.workflows.set(workflowId, workflow);
            
            // Log workflow start
            this.logger.info(`Started workflow ${workflowId} of type ${type}`);
            
            // Process first step
            await this.processNextStep(workflowId);
            
            return {
                status: 'started',
                workflowId
            };
        } catch (error) {
            this.logger.error('Failed to start workflow:', error);
            throw error;
        }
    }
    
    async processNextStep(workflowId) {
        try {
            const workflow = this.workflows.get(workflowId);
            
            if (!workflow) {
                throw new Error(`Workflow not found: ${workflowId}`);
            }
            
            if (workflow.currentStep >= workflow.steps.length) {
                // Workflow complete
                return this.completeWorkflow({ id: workflowId });
            }
            
            const step = workflow.steps[workflow.currentStep];
            
            // Assign task to agent or team
            if (step.agent) {
                const agent = this.mrSmith.agents.get(step.agent);
                
                if (!agent) {
                    throw new Error(`Agent not found: ${step.agent}`);
                }
                
                // Emit event for agent to handle task
                this.eventBus.emit('agent:task:assign', {
                    agent: step.agent,
                    task: step.task,
                    workflowId,
                    data: workflow.data,
                    stepName: step.name
                });
                
                this.logger.info(`Assigned task ${step.task} to agent ${step.agent} for workflow ${workflowId}`);
            } else if (step.team) {
                const team = this.mrSmith.teams.get(step.team);
                
                if (!team) {
                    throw new Error(`Team not found: ${step.team}`);
                }
                
                // Emit event for team to handle task
                this.eventBus.emit('team:task:assign', {
                    team: step.team,
                    task: step.task,
                    workflowId,
                    data: workflow.data,
                    stepName: step.name
                });
                
                this.logger.info(`Assigned task ${step.task} to team ${step.team} for workflow ${workflowId}`);
            }
            
            // Update workflow status
            workflow.status = 'in-progress';
            workflow.steps[workflow.currentStep].startedAt = new Date();
            
            return {
                status: 'step-started',
                workflowId,
                step: workflow.currentStep,
                stepName: step.name
            };
        } catch (error) {
            this.logger.error('Failed to process next workflow step:', error);
            throw error;
        }
    }
    
    async stepComplete(stepData) {
        try {
            const { workflowId, results } = stepData;
            const workflow = this.workflows.get(workflowId);
            
            if (!workflow) {
                throw new Error(`Workflow not found: ${workflowId}`);
            }
            
            // Store step results
            const currentStep = workflow.steps[workflow.currentStep];
            workflow.results[currentStep.name] = results;
            
            // Mark step as complete
            workflow.steps[workflow.currentStep].completedAt = new Date();
            workflow.steps[workflow.currentStep].status = 'complete';
            
            // Move to next step
            workflow.currentStep++;
            
            // Process next step
            return this.processNextStep(workflowId);
        } catch (error) {
            this.logger.error('Failed to complete workflow step:', error);
            throw error;
        }
    }
    
    async completeWorkflow(workflowData) {
        try {
            const { id } = workflowData;
            const workflow = this.workflows.get(id);
            
            if (!workflow) {
                throw new Error(`Workflow not found: ${id}`);
            }
            
            // Update workflow status
            workflow.status = 'complete';
            workflow.completedAt = new Date();
            
            // Log workflow completion
            this.logger.info(`Completed workflow ${id} of type ${workflow.type}`);
            
            // Emit workflow completion event
            this.eventBus.emit('workflow:complete', {
                id,
                type: workflow.type,
                results: workflow.results,
                data: workflow.data
            });
            
            return {
                status: 'complete',
                workflowId: id,
                results: workflow.results
            };
        } catch (error) {
            this.logger.error('Failed to complete workflow:', error);
            throw error;
        }
    }
    
    getWorkflowStatus(workflowId) {
        const workflow = this.workflows.get(workflowId);
        
        if (!workflow) {
            return {
                status: 'error',
                message: 'Workflow not found'
            };
        }
        
        return {
            id: workflow.id,
            type: workflow.type,
            status: workflow.status,
            currentStep: workflow.currentStep,
            totalSteps: workflow.steps.length,
            startedAt: workflow.startedAt,
            completedAt: workflow.completedAt
        };
    }
    
    listActiveWorkflows() {
        const activeWorkflows = [];
        
        for (const [id, workflow] of this.workflows.entries()) {
            if (workflow.status !== 'complete') {
                activeWorkflows.push({
                    id,
                    type: workflow.type,
                    status: workflow.status,
                    currentStep: workflow.currentStep,
                    totalSteps: workflow.steps.length,
                    startedAt: workflow.startedAt
                });
            }
        }
        
        return activeWorkflows;
    }
}

module.exports = WorkflowManager; 