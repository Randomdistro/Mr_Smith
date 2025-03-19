/**
 * ManufacturingTeam - Coordinates specialized agents for manufacturing design
 * Responsible for end-to-end manufacturing design, from concept to production
 */

const uuid = require('uuid');

class ManufacturingTeam {
    constructor(mrSmith) {
        this.mrSmith = mrSmith;
        this.projects = new Map();
        this.workflows = new Map();
        
        // Connect to required agents
        this.engineerAgent = mrSmith.agents.get('EngineerAgent');
        this.mechanicAgent = mrSmith.agents.get('MechanicAgent');
        this.designAgent = mrSmith.agents.get('DesignAgent');
        this.cadAgent = mrSmith.agents.get('CADAgent');
        this.printSliceAgent = mrSmith.agents.get('PrintSliceAgent');
        
        // Verify that all required agents are available
        this._verifyAgents();
        
        // Subscribe to events
        this._subscribeToEvents();
    }
    
    _verifyAgents() {
        const requiredAgents = [
            { name: 'EngineerAgent', agent: this.engineerAgent },
            { name: 'MechanicAgent', agent: this.mechanicAgent },
            { name: 'DesignAgent', agent: this.designAgent },
            { name: 'CADAgent', agent: this.cadAgent },
            { name: 'PrintSliceAgent', agent: this.printSliceAgent }
        ];
        
        const missingAgents = requiredAgents
            .filter(item => !item.agent)
            .map(item => item.name);
            
        if (missingAgents.length > 0) {
            throw new Error(`Manufacturing Team requires the following agents: ${missingAgents.join(', ')}`);
        }
    }
    
    _subscribeToEvents() {
        this.mrSmith.eventBus.on('project:manufacturing:create', this.handleCreateProject.bind(this));
        this.mrSmith.eventBus.on('workflow:manufacturing:progress', this.handleWorkflowProgress.bind(this));
        this.mrSmith.eventBus.on('project:manufacturing:finalize', this.handleFinalizeProject.bind(this));
    }
    
    async handleCreateProject(eventData) {
        const { projectName, productType, requirements } = eventData;
        
        try {
            // Generate project ID
            const projectId = uuid.v4();
            
            // Create project structure
            const project = {
                id: projectId,
                name: projectName,
                type: productType,
                requirements,
                phases: {
                    design: { status: 'pending' },
                    engineering: { status: 'pending' },
                    modeling: { status: 'pending' },
                    prototyping: { status: 'pending' },
                    production: { status: 'pending' }
                },
                assets: {},
                team: {
                    designer: 'DesignAgent',
                    engineer: 'EngineerAgent',
                    mechanic: 'MechanicAgent',
                    modeler: 'CADAgent'
                },
                status: 'created',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Store the project
            this.projects.set(projectId, project);
            
            // Create a workflow for this project
            await this.createWorkflow(projectId);
            
            // Notify about project creation
            this.mrSmith.eventBus.emit('project:manufacturing:created', {
                projectId,
                projectName,
                status: 'created'
            });
            
            return {
                status: 'success',
                projectId,
                message: `Manufacturing project ${projectName} created successfully`
            };
        } catch (error) {
            console.error('Error creating manufacturing project:', error);
            
            // Notify about project creation failure
            this.mrSmith.eventBus.emit('project:manufacturing:created', {
                projectName,
                status: 'error',
                error: error.message
            });
            
            throw error;
        }
    }
    
    async createWorkflow(projectId) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`Project not found: ${projectId}`);
        }
        
        // Create workflow ID
        const workflowId = uuid.v4();
        
        // Define workflow steps
        const workflow = {
            id: workflowId,
            projectId,
            name: `Manufacturing Workflow: ${project.name}`,
            steps: [
                {
                    id: 'design_concept',
                    name: 'Design Concept Creation',
                    agent: 'DesignAgent',
                    task: 'product-design',
                    parameters: {
                        productName: project.name,
                        category: project.type,
                        requirements: project.requirements
                    },
                    status: 'pending',
                    dependsOn: []
                },
                {
                    id: 'engineering_specs',
                    name: 'Engineering Specifications',
                    agent: 'EngineerAgent',
                    task: 'technical-specifications',
                    parameters: {
                        projectName: project.name,
                        requirements: project.requirements
                    },
                    status: 'pending',
                    dependsOn: ['design_concept']
                },
                {
                    id: 'cad_modeling',
                    name: 'CAD Modeling',
                    agent: 'CADAgent',
                    task: '3d-model-creation',
                    parameters: {
                        projectName: project.name,
                        complexity: 'medium'
                    },
                    status: 'pending',
                    dependsOn: ['engineering_specs']
                },
                {
                    id: 'assembly_instructions',
                    name: 'Assembly Instructions',
                    agent: 'MechanicAgent',
                    task: 'assembly-instructions',
                    parameters: {
                        difficultyLevel: 'standard'
                    },
                    status: 'pending',
                    dependsOn: ['cad_modeling']
                },
                {
                    id: 'prototype_preparation',
                    name: 'Prototype Preparation',
                    agent: 'PrintSliceAgent',
                    task: 'create-print-job',
                    parameters: {
                        material: 'pla',
                        quality: 'high',
                        parameters: {
                            optimize: true,
                            generateSupports: true
                        }
                    },
                    status: 'pending',
                    dependsOn: ['cad_modeling']
                }
            ],
            currentStep: 'design_concept',
            status: 'initialized',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Store the workflow
        this.workflows.set(workflowId, workflow);
        
        // Update project with workflow reference
        project.workflowId = workflowId;
        project.updatedAt = new Date().toISOString();
        this.projects.set(projectId, project);
        
        // Start the workflow
        await this.startWorkflow(workflowId);
        
        return {
            status: 'success',
            workflowId,
            workflow
        };
    }
    
    async startWorkflow(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        
        // Set workflow status to active
        workflow.status = 'active';
        workflow.startedAt = new Date().toISOString();
        workflow.updatedAt = new Date().toISOString();
        
        // Find the first step
        const firstStep = workflow.steps.find(step => step.id === workflow.currentStep);
        if (!firstStep) {
            throw new Error(`First workflow step not found: ${workflow.currentStep}`);
        }
        
        // Execute the first step
        await this.executeWorkflowStep(workflow, firstStep);
        
        // Store updated workflow
        this.workflows.set(workflowId, workflow);
        
        return {
            status: 'success',
            workflowId,
            message: `Workflow started: ${workflow.name}`
        };
    }
    
    async executeWorkflowStep(workflow, step) {
        try {
            // Update step status
            step.status = 'in-progress';
            step.startedAt = new Date().toISOString();
            
            // Get the agent responsible for this step
            const agent = this.mrSmith.agents.get(step.agent);
            if (!agent) {
                throw new Error(`Agent not found: ${step.agent}`);
            }
            
            // Get project data
            const project = this.projects.get(workflow.projectId);
            
            // Prepare task parameters
            const parameters = { ...step.parameters };
            
            // Add previous step results if needed
            if (step.dependsOn && step.dependsOn.length > 0) {
                for (const dependencyId of step.dependsOn) {
                    const dependencyStep = workflow.steps.find(s => s.id === dependencyId);
                    if (dependencyStep && dependencyStep.result) {
                        parameters[`${dependencyId}_result`] = dependencyStep.result;
                    }
                }
            }
            
            // Execute the task on the agent
            const result = await agent.processTask({
                type: step.task,
                parameters
            });
            
            // Store the result
            step.result = result;
            step.status = 'completed';
            step.completedAt = new Date().toISOString();
            
            // Update project with step result (store in assets)
            project.assets[step.id] = result;
            project.phases[this._getPhaseFromStepId(step.id)].status = 'completed';
            project.updatedAt = new Date().toISOString();
            this.projects.set(workflow.projectId, project);
            
            // Find next steps that depend on this one
            const nextSteps = this._findNextSteps(workflow, step.id);
            
            if (nextSteps.length > 0) {
                // Move to the next step
                workflow.currentStep = nextSteps[0].id;
                
                // Execute next steps in parallel if possible
                for (const nextStep of nextSteps) {
                    if (this._canExecuteStep(workflow, nextStep)) {
                        await this.executeWorkflowStep(workflow, nextStep);
                    }
                }
            } else {
                // Check if all steps are completed
                const allCompleted = workflow.steps.every(s => s.status === 'completed');
                
                if (allCompleted) {
                    workflow.status = 'completed';
                    workflow.completedAt = new Date().toISOString();
                    
                    // Finalize the project
                    project.status = 'completed';
                    project.completedAt = new Date().toISOString();
                    this.projects.set(workflow.projectId, project);
                    
                    // Emit completion event
                    this.mrSmith.eventBus.emit('workflow:manufacturing:completed', {
                        workflowId: workflow.id,
                        projectId: workflow.projectId
                    });
                }
            }
            
            // Store updated workflow
            this.workflows.set(workflow.id, workflow);
            
            // Emit progress event
            this.mrSmith.eventBus.emit('workflow:manufacturing:progress', {
                workflowId: workflow.id,
                projectId: workflow.projectId,
                completedStep: step.id,
                nextStep: workflow.currentStep,
                status: workflow.status
            });
            
            return {
                status: 'success',
                stepId: step.id,
                result
            };
        } catch (error) {
            console.error(`Error executing workflow step ${step.id}:`, error);
            
            // Update step status to failed
            step.status = 'failed';
            step.error = error.message;
            step.failedAt = new Date().toISOString();
            
            // Update workflow
            workflow.status = 'failed';
            workflow.updatedAt = new Date().toISOString();
            
            // Store updated workflow
            this.workflows.set(workflow.id, workflow);
            
            // Emit error event
            this.mrSmith.eventBus.emit('workflow:manufacturing:error', {
                workflowId: workflow.id,
                projectId: workflow.projectId,
                stepId: step.id,
                error: error.message
            });
            
            throw error;
        }
    }
    
    handleWorkflowProgress(eventData) {
        const { workflowId, projectId, completedStep, nextStep, status } = eventData;
        
        console.log(`Workflow progress: Project ${projectId}, completed step: ${completedStep}, next step: ${nextStep}, status: ${status}`);
        
        if (status === 'completed') {
            console.log(`Workflow ${workflowId} completed successfully!`);
        }
    }
    
    handleFinalizeProject(eventData) {
        const { projectId } = eventData;
        
        const project = this.projects.get(projectId);
        if (!project) {
            console.error(`Project not found: ${projectId}`);
            return;
        }
        
        // In a real system, this would handle finalization tasks like
        // generating final documentation, sending to production, etc.
        console.log(`Finalizing manufacturing project: ${project.name}`);
        
        project.status = 'finalized';
        project.finalizedAt = new Date().toISOString();
        
        this.projects.set(projectId, project);
        
        // Emit finalized event
        this.mrSmith.eventBus.emit('project:manufacturing:finalized', {
            projectId,
            projectName: project.name
        });
    }
    
    _findNextSteps(workflow, completedStepId) {
        return workflow.steps.filter(step => 
            step.status === 'pending' && 
            step.dependsOn.includes(completedStepId)
        );
    }
    
    _canExecuteStep(workflow, step) {
        // Check if all dependencies are completed
        return step.dependsOn.every(dependencyId => {
            const dependencyStep = workflow.steps.find(s => s.id === dependencyId);
            return dependencyStep && dependencyStep.status === 'completed';
        });
    }
    
    _getPhaseFromStepId(stepId) {
        const phaseMap = {
            'design_concept': 'design',
            'engineering_specs': 'engineering',
            'cad_modeling': 'modeling',
            'assembly_instructions': 'prototyping',
            'prototype_preparation': 'prototyping',
            'production_planning': 'production'
        };
        
        return phaseMap[stepId] || 'design';
    }
    
    getProjectById(projectId) {
        return this.projects.get(projectId);
    }
    
    getAllProjects() {
        return Array.from(this.projects.values());
    }
    
    getWorkflowById(workflowId) {
        return this.workflows.get(workflowId);
    }
}

module.exports = ManufacturingTeam; 