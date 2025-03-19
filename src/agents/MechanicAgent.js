/**
 * MechanicAgent - Specialized agent for mechanical systems and repairs
 * Responsible for mechanical assembly, maintenance, and troubleshooting
 */

const Agent = require('../core/Agent');
const uuid = require('uuid');

class MechanicAgent extends Agent {
    constructor(mrSmith, config = {}) {
        super(mrSmith, config);
        this.repairTickets = new Map();
        this.maintenanceSchedules = new Map();
        this.mechanicalSystems = new Map();
    }

    async initializeTools() {
        // Load mechanical tools
        const AssemblyToolkit = require('../tools/mechanical/AssemblyToolkit');
        const DiagnosticsTool = require('../tools/mechanical/DiagnosticsTool');
        const MaintenancePlanner = require('../tools/mechanical/MaintenancePlanner');
        
        this.tools.set('assembly-toolkit', new AssemblyToolkit({
            mrSmith: this.mrSmith,
            agent: this
        }));
        
        this.tools.set('diagnostics', new DiagnosticsTool({
            mrSmith: this.mrSmith,
            agent: this
        }));
        
        this.tools.set('maintenance-planner', new MaintenancePlanner({
            mrSmith: this.mrSmith,
            agent: this
        }));
    }

    async processTask(taskData) {
        const { type, parameters } = taskData;
        
        switch(type) {
            case 'repair-diagnostics':
                return await this.performDiagnostics(parameters);
            case 'maintenance-scheduling':
                return await this.scheduleMaintenance(parameters);
            case 'assembly-instructions':
                return await this.createAssemblyInstructions(parameters);
            case 'system-troubleshooting':
                return await this.troubleshootSystem(parameters);
            default:
                throw new Error(`Unknown task type: ${type}`);
        }
    }

    async performDiagnostics({ systemId, symptoms = [], previousRepairs = [] }) {
        try {
            // Create a ticket ID
            const ticketId = uuid.v4();
            
            // Get system details
            const system = this.mechanicalSystems.get(systemId);
            if (!system && !symptoms.length) {
                return {
                    status: 'error',
                    message: 'System not found and no symptoms provided'
                };
            }
            
            // Use diagnostics tool
            const diagnosticsTool = this.tools.get('diagnostics');
            const diagnosticsResult = await diagnosticsTool.execute({
                system,
                symptoms,
                previousRepairs
            });
            
            // Create repair ticket
            const repairTicket = {
                id: ticketId,
                systemId,
                symptoms,
                diagnostics: diagnosticsResult.findings,
                potentialIssues: diagnosticsResult.potentialIssues,
                recommendedActions: diagnosticsResult.recommendedActions,
                estimatedComplexity: diagnosticsResult.estimatedComplexity,
                status: 'diagnosed',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Store the repair ticket
            this.repairTickets.set(ticketId, repairTicket);
            
            return {
                status: 'success',
                ticketId,
                repairTicket
            };
        } catch (error) {
            console.error('Error performing diagnostics:', error);
            throw error;
        }
    }

    async scheduleMaintenance({ systemId, frequency, tasks = [] }) {
        try {
            if (!systemId) {
                throw new Error('System ID is required');
            }
            
            // Get system details
            const system = this.mechanicalSystems.get(systemId);
            
            // Generate maintenance ID
            const maintenanceId = uuid.v4();
            
            // Use maintenance planner
            const maintenancePlanner = this.tools.get('maintenance-planner');
            const maintenanceResult = await maintenancePlanner.execute({
                action: 'create-schedule',
                system,
                frequency,
                tasks
            });
            
            // Create maintenance schedule
            const maintenanceSchedule = {
                id: maintenanceId,
                systemId,
                frequency: frequency || 'quarterly',
                tasks: tasks.length > 0 ? tasks : maintenanceResult.recommendedTasks,
                schedule: maintenanceResult.schedule,
                notifications: maintenanceResult.notifications,
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Store the maintenance schedule
            this.maintenanceSchedules.set(maintenanceId, maintenanceSchedule);
            
            return {
                status: 'success',
                maintenanceId,
                maintenanceSchedule
            };
        } catch (error) {
            console.error('Error scheduling maintenance:', error);
            throw error;
        }
    }

    async createAssemblyInstructions({ systemId, components = [], difficultyLevel = 'standard' }) {
        try {
            // Get system details if available
            const system = systemId ? this.mechanicalSystems.get(systemId) : null;
            
            // Use assembly toolkit
            const assemblyToolkit = this.tools.get('assembly-toolkit');
            const assemblyResult = await assemblyToolkit.execute({
                action: 'create-instructions',
                system,
                components,
                difficultyLevel
            });
            
            return {
                status: 'success',
                instructions: assemblyResult.instructions,
                diagrams: assemblyResult.diagrams,
                toolsRequired: assemblyResult.toolsRequired,
                estimatedTime: assemblyResult.estimatedTime
            };
        } catch (error) {
            console.error('Error creating assembly instructions:', error);
            throw error;
        }
    }

    async troubleshootSystem({ systemId, issueDescription, attemptedSolutions = [] }) {
        try {
            if (!systemId || !issueDescription) {
                throw new Error('System ID and issue description are required');
            }
            
            // Get system details
            const system = this.mechanicalSystems.get(systemId);
            if (!system) {
                return {
                    status: 'error',
                    message: 'System not found'
                };
            }
            
            // Use diagnostics tool
            const diagnosticsTool = this.tools.get('diagnostics');
            const troubleshootingResult = await diagnosticsTool.execute({
                action: 'troubleshoot',
                system,
                issueDescription,
                attemptedSolutions
            });
            
            return {
                status: 'success',
                potentialCauses: troubleshootingResult.potentialCauses,
                solutionSteps: troubleshootingResult.solutionSteps,
                preventionTips: troubleshootingResult.preventionTips
            };
        } catch (error) {
            console.error('Error troubleshooting system:', error);
            throw error;
        }
    }

    addMechanicalSystem(system) {
        const systemId = system.id || uuid.v4();
        
        const newSystem = {
            ...system,
            id: systemId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.mechanicalSystems.set(systemId, newSystem);
        
        return {
            status: 'success',
            systemId,
            system: newSystem
        };
    }

    getRepairTicketById(ticketId) {
        return this.repairTickets.get(ticketId);
    }

    getMaintenanceScheduleById(scheduleId) {
        return this.maintenanceSchedules.get(scheduleId);
    }

    getMechanicalSystemById(systemId) {
        return this.mechanicalSystems.get(systemId);
    }
}

module.exports = MechanicAgent; 