/**
 * PrintSliceAgent - Specialized agent for 3D print preparation
 * Responsible for slicing 3D models into printable layers with appropriate settings
 */

const Agent = require('../core/Agent');
const uuid = require('uuid');

class PrintSliceAgent extends Agent {
    constructor(mrSmith, config = {}) {
        super(mrSmith, config);
        this.printJobs = new Map();
        this.sliceProfiles = new Map();
        this.materialProfiles = new Map();
    }

    async initializeTools() {
        // Load printing tools
        const SlicerTool = require('../tools/printing/SlicerTool');
        const PrintOptimizerTool = require('../tools/printing/PrintOptimizerTool');
        const SupportGeneratorTool = require('../tools/printing/SupportGeneratorTool');
        
        this.tools.set('slicer', new SlicerTool({
            mrSmith: this.mrSmith,
            agent: this
        }));
        
        this.tools.set('print-optimizer', new PrintOptimizerTool({
            mrSmith: this.mrSmith,
            agent: this
        }));
        
        this.tools.set('support-generator', new SupportGeneratorTool({
            mrSmith: this.mrSmith,
            agent: this
        }));
        
        // Initialize default slice profiles and material settings
        this._initializeProfiles();
    }

    async processTask(taskData) {
        const { type, parameters } = taskData;
        
        switch(type) {
            case 'slice-model':
                return await this.sliceModel(parameters);
            case 'optimize-print':
                return await this.optimizePrint(parameters);
            case 'generate-supports':
                return await this.generateSupports(parameters);
            case 'create-print-job':
                return await this.createPrintJob(parameters);
            default:
                throw new Error(`Unknown task type: ${type}`);
        }
    }

    async sliceModel({ modelId, printer, material, quality, infill = 20, layerHeight = 0.2 }) {
        try {
            if (!modelId || !printer || !material || !quality) {
                throw new Error('Model ID, printer, material, and quality are required');
            }
            
            // If modelId is not provided directly but via an agent, use the CAD agent to get it
            let model = null;
            
            if (typeof modelId === 'string') {
                // Try to get model from CAD agent
                const cadAgent = this.mrSmith.agents.get('CADAgent');
                if (cadAgent) {
                    model = await cadAgent.getCADModelById(modelId);
                }
                
                if (!model) {
                    return {
                        status: 'error',
                        message: 'Model not found'
                    };
                }
            } else {
                // Model was provided directly
                model = modelId;
                modelId = model.id;
            }
            
            // Get material profile
            const materialProfile = this.materialProfiles.get(material);
            if (!materialProfile) {
                return {
                    status: 'error',
                    message: `Material profile not found: ${material}`
                };
            }
            
            // Get quality preset
            const qualityPreset = this._getQualityPreset(quality, printer);
            if (!qualityPreset) {
                return {
                    status: 'error',
                    message: `Quality preset not found: ${quality}`
                };
            }
            
            // Use slicer tool
            const slicerTool = this.tools.get('slicer');
            const sliceResult = await slicerTool.execute({
                model,
                printer,
                materialProfile,
                qualityPreset,
                sliceParameters: {
                    infill,
                    layerHeight: layerHeight || qualityPreset.defaultLayerHeight
                }
            });
            
            // Generate job ID
            const jobId = uuid.v4();
            
            // Create print job
            const printJob = {
                id: jobId,
                modelId,
                printer,
                material,
                quality,
                parameters: {
                    infill,
                    layerHeight: layerHeight || qualityPreset.defaultLayerHeight,
                    supportDensity: sliceResult.supportDensity,
                    wallThickness: sliceResult.wallThickness,
                    bedAdhesion: sliceResult.bedAdhesion
                },
                sliceResult: {
                    gcodePath: sliceResult.gcodePath,
                    layerCount: sliceResult.layerCount,
                    estimatedPrintTime: sliceResult.estimatedPrintTime,
                    materialUsage: sliceResult.materialUsage
                },
                status: 'sliced',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Store the print job
            this.printJobs.set(jobId, printJob);
            
            return {
                status: 'success',
                jobId,
                printJob
            };
        } catch (error) {
            console.error('Error slicing model:', error);
            throw error;
        }
    }

    async optimizePrint({ jobId, optimizationGoal = 'balanced' }) {
        try {
            if (!jobId) {
                throw new Error('Job ID is required');
            }
            
            // Get the print job
            const printJob = this.printJobs.get(jobId);
            if (!printJob) {
                return {
                    status: 'error',
                    message: 'Print job not found'
                };
            }
            
            // Use print optimizer tool
            const printOptimizerTool = this.tools.get('print-optimizer');
            const optimizationResult = await printOptimizerTool.execute({
                printJob,
                optimizationGoal
            });
            
            // Update the print job with optimized parameters
            printJob.parameters = {
                ...printJob.parameters,
                ...optimizationResult.optimizedParameters
            };
            
            printJob.sliceResult = {
                ...printJob.sliceResult,
                gcodePath: optimizationResult.gcodePath,
                estimatedPrintTime: optimizationResult.estimatedPrintTime,
                materialUsage: optimizationResult.materialUsage
            };
            
            printJob.optimizations = optimizationResult.appliedOptimizations;
            printJob.status = 'optimized';
            printJob.updatedAt = new Date().toISOString();
            
            // Store updated print job
            this.printJobs.set(jobId, printJob);
            
            return {
                status: 'success',
                jobId,
                printJob,
                optimizationResult
            };
        } catch (error) {
            console.error('Error optimizing print:', error);
            throw error;
        }
    }

    async generateSupports({ jobId, density = 'medium', pattern = 'grid', manualSupportPoints = [] }) {
        try {
            if (!jobId) {
                throw new Error('Job ID is required');
            }
            
            // Get the print job
            const printJob = this.printJobs.get(jobId);
            if (!printJob) {
                return {
                    status: 'error',
                    message: 'Print job not found'
                };
            }
            
            // Use support generator tool
            const supportGeneratorTool = this.tools.get('support-generator');
            const supportResult = await supportGeneratorTool.execute({
                printJob,
                density,
                pattern,
                manualSupportPoints
            });
            
            // Update the print job with support information
            printJob.parameters.supportDensity = density;
            printJob.parameters.supportPattern = pattern;
            printJob.parameters.manualSupportPoints = manualSupportPoints;
            
            printJob.sliceResult = {
                ...printJob.sliceResult,
                gcodePath: supportResult.gcodePath,
                supportStructures: supportResult.supportStructures,
                materialUsage: {
                    ...printJob.sliceResult.materialUsage,
                    supports: supportResult.materialUsage.supports
                }
            };
            
            printJob.updatedAt = new Date().toISOString();
            
            // Store updated print job
            this.printJobs.set(jobId, printJob);
            
            return {
                status: 'success',
                jobId,
                printJob,
                supportResult
            };
        } catch (error) {
            console.error('Error generating supports:', error);
            throw error;
        }
    }

    async createPrintJob({ modelId, printer, material, quality, parameters = {} }) {
        try {
            // First slice the model
            const sliceResult = await this.sliceModel({
                modelId,
                printer,
                material,
                quality,
                infill: parameters.infill,
                layerHeight: parameters.layerHeight
            });
            
            if (sliceResult.status !== 'success') {
                return sliceResult;
            }
            
            const jobId = sliceResult.jobId;
            
            // Then optimize if requested
            if (parameters.optimize) {
                await this.optimizePrint({
                    jobId,
                    optimizationGoal: parameters.optimizationGoal || 'balanced'
                });
            }
            
            // Finally generate supports if needed
            if (parameters.generateSupports !== false) {
                await this.generateSupports({
                    jobId,
                    density: parameters.supportDensity || 'medium',
                    pattern: parameters.supportPattern || 'grid',
                    manualSupportPoints: parameters.manualSupportPoints || []
                });
            }
            
            // Get the final print job
            const printJob = this.printJobs.get(jobId);
            printJob.status = 'ready';
            printJob.updatedAt = new Date().toISOString();
            
            // Store updated print job
            this.printJobs.set(jobId, printJob);
            
            return {
                status: 'success',
                jobId,
                printJob
            };
        } catch (error) {
            console.error('Error creating print job:', error);
            throw error;
        }
    }

    _initializeProfiles() {
        // Initialize material profiles
        this.materialProfiles.set('pla', {
            id: 'pla',
            name: 'PLA',
            printTemperature: 200,
            bedTemperature: 60,
            fanSpeed: 100,
            density: 1.24,
            flowRate: 100,
            retraction: {
                distance: 6.5,
                speed: 25
            }
        });
        
        this.materialProfiles.set('abs', {
            id: 'abs',
            name: 'ABS',
            printTemperature: 230,
            bedTemperature: 110,
            fanSpeed: 0,
            density: 1.04,
            flowRate: 100,
            retraction: {
                distance: 4.5,
                speed: 30
            }
        });
        
        this.materialProfiles.set('petg', {
            id: 'petg',
            name: 'PETG',
            printTemperature: 240,
            bedTemperature: 80,
            fanSpeed: 50,
            density: 1.27,
            flowRate: 95,
            retraction: {
                distance: 5,
                speed: 25
            }
        });
        
        // Initialize quality presets
        this.sliceProfiles.set('draft', {
            id: 'draft',
            name: 'Draft',
            defaultLayerHeight: 0.3,
            wallThickness: 0.8,
            topLayers: 3,
            bottomLayers: 3,
            infillPattern: 'grid',
            speedMultiplier: 1.2
        });
        
        this.sliceProfiles.set('standard', {
            id: 'standard',
            name: 'Standard',
            defaultLayerHeight: 0.2,
            wallThickness: 1.2,
            topLayers: 4,
            bottomLayers: 4,
            infillPattern: 'triangles',
            speedMultiplier: 1.0
        });
        
        this.sliceProfiles.set('high', {
            id: 'high',
            name: 'High Quality',
            defaultLayerHeight: 0.1,
            wallThickness: 1.2,
            topLayers: 6,
            bottomLayers: 6,
            infillPattern: 'cubic',
            speedMultiplier: 0.8
        });
    }

    _getQualityPreset(quality, printer) {
        const baseProfile = this.sliceProfiles.get(quality);
        if (!baseProfile) {
            return null;
        }
        
        // In a real system, we would adjust the profile for the specific printer
        return {
            ...baseProfile,
            printer
        };
    }

    getPrintJobById(jobId) {
        return this.printJobs.get(jobId);
    }

    getAllPrintJobs() {
        return Array.from(this.printJobs.values());
    }

    getMaterialProfile(materialId) {
        return this.materialProfiles.get(materialId);
    }

    getAllMaterialProfiles() {
        return Array.from(this.materialProfiles.values());
    }

    getSliceProfile(profileId) {
        return this.sliceProfiles.get(profileId);
    }

    getAllSliceProfiles() {
        return Array.from(this.sliceProfiles.values());
    }
}

module.exports = PrintSliceAgent; 