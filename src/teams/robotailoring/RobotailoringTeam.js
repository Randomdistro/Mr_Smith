/**
 * RobotailoringTeam - Coordinates specialized agents for bespoke robotics
 * Responsible for creating task-specific domestic and light commercial robots
 */

const uuid = require('uuid');

class RobotailoringTeam {
    constructor(mrSmith) {
        this.mrSmith = mrSmith;
        this.projects = new Map();
        this.workflows = new Map();
        this.robotDesigns = new Map();
        this.clients = new Map();
        
        // Connect to required agents
        this.engineerAgent = mrSmith.agents.get('EngineerAgent');
        this.designAgent = mrSmith.agents.get('DesignAgent');
        this.cadAgent = mrSmith.agents.get('CADAgent');
        this.mechanicAgent = mrSmith.agents.get('MechanicAgent');
        
        // Verify that all required agents are available
        this._verifyAgents();
        
        // Subscribe to events
        this._subscribeToEvents();
        
        // Initialize robot component libraries
        this._initializeComponentLibraries();
    }
    
    _verifyAgents() {
        const requiredAgents = [
            { name: 'EngineerAgent', agent: this.engineerAgent },
            { name: 'DesignAgent', agent: this.designAgent },
            { name: 'CADAgent', agent: this.cadAgent },
            { name: 'MechanicAgent', agent: this.mechanicAgent }
        ];
        
        const missingAgents = requiredAgents
            .filter(item => !item.agent)
            .map(item => item.name);
            
        if (missingAgents.length > 0) {
            throw new Error(`Robotailoring Team requires the following agents: ${missingAgents.join(', ')}`);
        }
    }
    
    _subscribeToEvents() {
        this.mrSmith.eventBus.on('project:robotailoring:create', this.handleCreateProject.bind(this));
        this.mrSmith.eventBus.on('workflow:robotailoring:progress', this.handleWorkflowProgress.bind(this));
        this.mrSmith.eventBus.on('client:robotailoring:register', this.handleRegisterClient.bind(this));
    }
    
    _initializeComponentLibraries() {
        this.componentLibraries = {
            actuators: {
                servos: {
                    micro: { specs: { torque: '1.8kg-cm', speed: '0.1sec/60°', weight: '9g' } },
                    standard: { specs: { torque: '10kg-cm', speed: '0.17sec/60°', weight: '55g' } },
                    high_torque: { specs: { torque: '25kg-cm', speed: '0.14sec/60°', weight: '60g' } }
                },
                motors: {
                    dc: { specs: { voltage: '6-12V', current: '0.2-5A' } },
                    stepper: { specs: { steps: '200/revolution', holding_torque: '40Ncm' } },
                    brushless: { specs: { kv: '920', max_power: '400W' } }
                }
            },
            sensors: {
                distance: {
                    ultrasonic: { specs: { range: '2-400cm', accuracy: '±3mm' } },
                    infrared: { specs: { range: '10-80cm', response_time: '25ms' } },
                    lidar: { specs: { range: '0.1-40m', scan_rate: '5-15Hz' } }
                },
                environmental: {
                    temperature: { specs: { range: '-40 to 125°C', accuracy: '±0.5°C' } },
                    humidity: { specs: { range: '0-100%', accuracy: '±2%' } },
                    pressure: { specs: { range: '300-1100hPa', accuracy: '±1hPa' } }
                }
            },
            controllers: {
                microcontrollers: {
                    basic: { specs: { processor: 'ARM Cortex-M0', speed: '48MHz', memory: '256KB flash' } },
                    advanced: { specs: { processor: 'ARM Cortex-M4', speed: '120MHz', memory: '1MB flash' } }
                },
                single_board_computers: {
                    mini: { specs: { processor: 'ARM Cortex-A53', cores: '4', speed: '1.2GHz', memory: '1GB RAM' } },
                    standard: { specs: { processor: 'ARM Cortex-A72', cores: '4', speed: '1.5GHz', memory: '4GB RAM' } }
                }
            },
            power: {
                batteries: {
                    lipo: { specs: { voltage: '11.1V', capacity: '2200mAh', discharge: '20C' } },
                    nimh: { specs: { voltage: '9.6V', capacity: '2000mAh' } }
                },
                regulators: {
                    linear: { specs: { input: '7-35V', output: '5V', current: '1A' } },
                    switching: { specs: { input: '7-40V', output: '5V/3.3V', current: '3A' } }
                }
            },
            structures: {
                frames: {
                    plastic: { specs: { material: 'ABS', weight: 'Light' } },
                    aluminum: { specs: { material: 'Aluminum', weight: 'Medium' } }
                },
                joints: {
                    fixed: { specs: { dof: '0', load: 'High' } },
                    revolute: { specs: { dof: '1', load: 'Medium' } },
                    universal: { specs: { dof: '2', load: 'Low' } }
                }
            }
        };
    }
    
    async handleCreateProject(eventData) {
        const { clientId, projectName, robotType, taskRequirements, environmentConstraints } = eventData;
        
        try {
            // Check if client exists, or create a placeholder
            let client = this.clients.get(clientId);
            if (!client) {
                client = {
                    id: clientId,
                    projects: [],
                    createdAt: new Date().toISOString()
                };
                this.clients.set(clientId, client);
            }
            
            // Generate project ID
            const projectId = uuid.v4();
            
            // Create project structure
            const project = {
                id: projectId,
                clientId,
                name: projectName,
                robotType,
                taskRequirements,
                environmentConstraints,
                phases: {
                    requirements: { status: 'pending' },
                    design: { status: 'pending' },
                    engineering: { status: 'pending' },
                    modeling: { status: 'pending' },
                    assembly: { status: 'pending' },
                    programming: { status: 'pending' },
                    testing: { status: 'pending' }
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
            
            // Add project to client's project list
            client.projects.push(projectId);
            this.clients.set(clientId, client);
            
            // Create a workflow for this project
            await this.createWorkflow(projectId);
            
            // Notify about project creation
            this.mrSmith.eventBus.emit('project:robotailoring:created', {
                projectId,
                clientId,
                projectName,
                status: 'created'
            });
            
            return {
                status: 'success',
                projectId,
                message: `Robotailoring project ${projectName} created successfully`
            };
        } catch (error) {
            console.error('Error creating robotailoring project:', error);
            
            // Notify about project creation failure
            this.mrSmith.eventBus.emit('project:robotailoring:created', {
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
        
        // Determine component selection based on robot type and requirements
        const componentSelection = this._selectRobotComponents(project.robotType, project.taskRequirements, project.environmentConstraints);
        
        // Define workflow steps
        const workflow = {
            id: workflowId,
            projectId,
            name: `Robotailoring Workflow: ${project.name}`,
            steps: [
                {
                    id: 'requirements_analysis',
                    name: 'Requirements Analysis',
                    agent: 'EngineerAgent',
                    task: 'system-design',
                    parameters: {
                        projectName: project.name,
                        requirements: project.taskRequirements,
                        constraints: project.environmentConstraints
                    },
                    status: 'pending',
                    dependsOn: []
                },
                {
                    id: 'robot_design',
                    name: 'Robot Design',
                    agent: 'DesignAgent',
                    task: 'product-design',
                    parameters: {
                        productName: project.name,
                        category: project.robotType,
                        requirements: {
                            ...project.taskRequirements,
                            componentSelection
                        }
                    },
                    status: 'pending',
                    dependsOn: ['requirements_analysis']
                },
                {
                    id: 'technical_specifications',
                    name: 'Technical Specifications',
                    agent: 'EngineerAgent',
                    task: 'technical-specifications',
                    parameters: {},
                    status: 'pending',
                    dependsOn: ['robot_design']
                },
                {
                    id: 'mechanical_design',
                    name: 'Mechanical Design',
                    agent: 'CADAgent',
                    task: '3d-model-creation',
                    parameters: {
                        projectName: project.name,
                        complexity: 'high',
                        libraryComponents: this._formatComponentsForCAD(componentSelection)
                    },
                    status: 'pending',
                    dependsOn: ['technical_specifications']
                },
                {
                    id: 'assembly_instructions',
                    name: 'Assembly Instructions',
                    agent: 'MechanicAgent',
                    task: 'assembly-instructions',
                    parameters: {
                        difficultyLevel: 'expert'
                    },
                    status: 'pending',
                    dependsOn: ['mechanical_design']
                },
                {
                    id: 'control_system_design',
                    name: 'Control System Design',
                    agent: 'EngineerAgent',
                    task: 'system-design',
                    parameters: {
                        projectName: `${project.name} Control System`,
                        requirements: {
                            type: 'control_system',
                            components: componentSelection.controllers,
                            sensors: componentSelection.sensors
                        }
                    },
                    status: 'pending',
                    dependsOn: ['technical_specifications']
                }
            ],
            currentStep: 'requirements_analysis',
            status: 'initialized',
            components: componentSelection,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Store the workflow
        this.workflows.set(workflowId, workflow);
        
        // Update project with workflow reference
        project.workflowId = workflowId;
        project.componentSelection = componentSelection;
        project.updatedAt = new Date().toISOString();
        this.projects.set(projectId, project);
        
        // Store initial robot design
        const robotDesignId = uuid.v4();
        this.robotDesigns.set(robotDesignId, {
            id: robotDesignId,
            projectId,
            type: project.robotType,
            components: componentSelection,
            status: 'draft',
            createdAt: new Date().toISOString()
        });
        
        // Update project with robot design reference
        project.robotDesignId = robotDesignId;
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
            const nextSteps = workflow.steps.filter(s => 
                s.status === 'pending' && 
                s.dependsOn.includes(step.id)
            );
            
            if (nextSteps.length > 0) {
                // Move to the next step
                workflow.currentStep = nextSteps[0].id;
                
                // Execute next steps in parallel if possible
                for (const nextStep of nextSteps) {
                    // Check if all dependencies are completed
                    const canExecute = nextStep.dependsOn.every(dependencyId => {
                        const dependencyStep = workflow.steps.find(s => s.id === dependencyId);
                        return dependencyStep && dependencyStep.status === 'completed';
                    });
                    
                    if (canExecute) {
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
                    
                    // Update robot design status
                    const robotDesign = this.robotDesigns.get(project.robotDesignId);
                    if (robotDesign) {
                        robotDesign.status = 'completed';
                        robotDesign.completedAt = new Date().toISOString();
                        this.robotDesigns.set(project.robotDesignId, robotDesign);
                    }
                    
                    // Emit completion event
                    this.mrSmith.eventBus.emit('workflow:robotailoring:completed', {
                        workflowId: workflow.id,
                        projectId: workflow.projectId,
                        robotDesignId: project.robotDesignId
                    });
                }
            }
            
            // Store updated workflow
            this.workflows.set(workflow.id, workflow);
            
            // Emit progress event
            this.mrSmith.eventBus.emit('workflow:robotailoring:progress', {
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
            this.mrSmith.eventBus.emit('workflow:robotailoring:error', {
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
        
        console.log(`Robotailoring workflow progress: Project ${projectId}, completed step: ${completedStep}, next step: ${nextStep}, status: ${status}`);
        
        if (status === 'completed') {
            console.log(`Robotailoring workflow ${workflowId} completed successfully!`);
        }
    }
    
    handleRegisterClient(eventData) {
        const { clientId, clientName, contactInfo } = eventData;
        
        try {
            // Check if client already exists
            const existingClient = this.clients.get(clientId);
            
            if (existingClient) {
                // Update existing client
                this.clients.set(clientId, {
                    ...existingClient,
                    name: clientName,
                    contactInfo,
                    updatedAt: new Date().toISOString()
                });
                
                return {
                    status: 'success',
                    clientId,
                    message: `Client ${clientName} updated successfully`
                };
            } else {
                // Create new client
                this.clients.set(clientId, {
                    id: clientId,
                    name: clientName,
                    contactInfo,
                    projects: [],
                    createdAt: new Date().toISOString()
                });
                
                return {
                    status: 'success',
                    clientId,
                    message: `Client ${clientName} registered successfully`
                };
            }
        } catch (error) {
            console.error('Error registering client:', error);
            throw error;
        }
    }
    
    _selectRobotComponents(robotType, taskRequirements, environmentConstraints) {
        // This would be a sophisticated selection process in a real system
        // Here we're just implementing a basic selection based on robot type
        
        const components = {
            actuators: [],
            sensors: [],
            controllers: [],
            power: [],
            structures: []
        };
        
        // Select components based on robot type
        switch (robotType) {
            case 'domestic_assistant':
                components.actuators.push(
                    { type: 'servos', model: 'standard', quantity: 8 },
                    { type: 'motors', model: 'dc', quantity: 2 }
                );
                components.sensors.push(
                    { type: 'distance', model: 'ultrasonic', quantity: 3 },
                    { type: 'environmental', model: 'temperature', quantity: 1 }
                );
                components.controllers.push(
                    { type: 'microcontrollers', model: 'advanced', quantity: 1 }
                );
                components.power.push(
                    { type: 'batteries', model: 'lipo', quantity: 1 },
                    { type: 'regulators', model: 'switching', quantity: 1 }
                );
                components.structures.push(
                    { type: 'frames', model: 'plastic', quantity: 1 },
                    { type: 'joints', model: 'revolute', quantity: 8 }
                );
                break;
                
            case 'light_industrial':
                components.actuators.push(
                    { type: 'servos', model: 'high_torque', quantity: 6 },
                    { type: 'motors', model: 'stepper', quantity: 2 }
                );
                components.sensors.push(
                    { type: 'distance', model: 'lidar', quantity: 1 },
                    { type: 'environmental', model: 'pressure', quantity: 2 }
                );
                components.controllers.push(
                    { type: 'single_board_computers', model: 'standard', quantity: 1 }
                );
                components.power.push(
                    { type: 'batteries', model: 'lipo', quantity: 2 },
                    { type: 'regulators', model: 'switching', quantity: 2 }
                );
                components.structures.push(
                    { type: 'frames', model: 'aluminum', quantity: 1 },
                    { type: 'joints', model: 'universal', quantity: 4 }
                );
                break;
                
            default: // Custom type
                // For custom types, we'd have a more sophisticated selection algorithm
                // For now, we'll use a mix of components
                components.actuators.push(
                    { type: 'servos', model: 'standard', quantity: 4 },
                    { type: 'motors', model: 'brushless', quantity: 2 }
                );
                components.sensors.push(
                    { type: 'distance', model: 'infrared', quantity: 2 }
                );
                components.controllers.push(
                    { type: 'microcontrollers', model: 'advanced', quantity: 1 }
                );
                components.power.push(
                    { type: 'batteries', model: 'lipo', quantity: 1 }
                );
                components.structures.push(
                    { type: 'frames', model: 'plastic', quantity: 1 },
                    { type: 'joints', model: 'revolute', quantity: 4 }
                );
        }
        
        // Further refine based on task requirements and environment constraints
        // This would be a more sophisticated process in a real system
        
        return components;
    }
    
    _formatComponentsForCAD(componentSelection) {
        // Convert component selection to CAD library references
        const cadComponents = [];
        
        // Flatten the component structure for CAD
        Object.entries(componentSelection).forEach(([category, items]) => {
            items.forEach(item => {
                cadComponents.push(`${category}/${item.type}/${item.model}`);
            });
        });
        
        return cadComponents;
    }
    
    _getPhaseFromStepId(stepId) {
        const phaseMap = {
            'requirements_analysis': 'requirements',
            'robot_design': 'design',
            'technical_specifications': 'engineering',
            'mechanical_design': 'modeling',
            'assembly_instructions': 'assembly',
            'control_system_design': 'engineering',
            'software_development': 'programming',
            'testing_validation': 'testing'
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
    
    getRobotDesignById(designId) {
        return this.robotDesigns.get(designId);
    }
    
    getClientById(clientId) {
        return this.clients.get(clientId);
    }
    
    getAllClients() {
        return Array.from(this.clients.values());
    }
    
    getComponentSpecifications(category, type, model) {
        try {
            return this.componentLibraries[category][type][model].specs;
        } catch (error) {
            return null;
        }
    }
}

module.exports = RobotailoringTeam; 