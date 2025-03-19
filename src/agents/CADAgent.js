/**
 * CADAgent - Specialized agent for Computer-Aided Design
 * Responsible for creating and managing 2D and 3D models for engineering and manufacturing
 */

const Agent = require('../core/Agent');
const uuid = require('uuid');

class CADAgent extends Agent {
    constructor(mrSmith, config = {}) {
        super(mrSmith, config);
        this.cadModels = new Map();
        this.cadLibraries = new Map();
        this.projects = new Map();
    }

    async initializeTools() {
        // Load CAD tools
        const CAD2DTool = require('../tools/cad/CAD2DTool');
        const CAD3DTool = require('../tools/cad/CAD3DTool');
        const CADConversionTool = require('../tools/cad/CADConversionTool');
        
        this.tools.set('cad-2d', new CAD2DTool({
            mrSmith: this.mrSmith,
            agent: this
        }));
        
        this.tools.set('cad-3d', new CAD3DTool({
            mrSmith: this.mrSmith,
            agent: this
        }));
        
        this.tools.set('cad-conversion', new CADConversionTool({
            mrSmith: this.mrSmith,
            agent: this
        }));
        
        // Initialize standard component libraries
        this._initializeComponentLibraries();
    }

    async processTask(taskData) {
        const { type, parameters } = taskData;
        
        switch(type) {
            case '2d-drawing-creation':
                return await this.create2DDrawing(parameters);
            case '3d-model-creation':
                return await this.create3DModel(parameters);
            case 'model-conversion':
                return await this.convertModel(parameters);
            case 'technical-drawing-generation':
                return await this.generateTechnicalDrawing(parameters);
            default:
                throw new Error(`Unknown task type: ${type}`);
        }
    }

    async create2DDrawing({ projectName, specifications, libraryComponents = [] }) {
        try {
            if (!projectName || !specifications) {
                throw new Error('Project name and specifications are required');
            }
            
            // Generate model ID
            const modelId = uuid.v4();
            
            // Use 2D CAD tool
            const cad2DTool = this.tools.get('cad-2d');
            const drawingResult = await cad2DTool.execute({
                action: 'create-drawing',
                projectName,
                specifications,
                libraryComponents: this._resolveLibraryComponents(libraryComponents)
            });
            
            // Create model object
            const model = {
                id: modelId,
                name: projectName,
                type: '2d',
                specifications,
                libraryComponents,
                files: drawingResult.files,
                layers: drawingResult.layers,
                dimensions: drawingResult.dimensions,
                annotations: drawingResult.annotations,
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Store the model
            this.cadModels.set(modelId, model);
            
            // Check if project exists, or create a new one
            if (!this.projects.has(projectName)) {
                const projectId = uuid.v4();
                this.projects.set(projectId, {
                    id: projectId,
                    name: projectName,
                    models: [modelId],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            } else {
                const project = this.projects.get(projectName);
                project.models.push(modelId);
                project.updatedAt = new Date().toISOString();
                this.projects.set(projectName, project);
            }
            
            return {
                status: 'success',
                modelId,
                model
            };
        } catch (error) {
            console.error('Error creating 2D drawing:', error);
            throw error;
        }
    }

    async create3DModel({ projectName, specifications, libraryComponents = [], complexity = 'medium' }) {
        try {
            if (!projectName || !specifications) {
                throw new Error('Project name and specifications are required');
            }
            
            // Generate model ID
            const modelId = uuid.v4();
            
            // Use 3D CAD tool
            const cad3DTool = this.tools.get('cad-3d');
            const modelResult = await cad3DTool.execute({
                action: 'create-model',
                projectName,
                specifications,
                libraryComponents: this._resolveLibraryComponents(libraryComponents),
                complexity
            });
            
            // Create model object
            const model = {
                id: modelId,
                name: projectName,
                type: '3d',
                specifications,
                libraryComponents,
                complexity,
                files: modelResult.files,
                assembly: modelResult.assembly,
                materials: modelResult.materials,
                dimensions: modelResult.dimensions,
                properties: modelResult.properties,
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Store the model
            this.cadModels.set(modelId, model);
            
            // Check if project exists, or create a new one
            if (!this.projects.has(projectName)) {
                const projectId = uuid.v4();
                this.projects.set(projectId, {
                    id: projectId,
                    name: projectName,
                    models: [modelId],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            } else {
                const project = this.projects.get(projectName);
                project.models.push(modelId);
                project.updatedAt = new Date().toISOString();
                this.projects.set(projectName, project);
            }
            
            return {
                status: 'success',
                modelId,
                model
            };
        } catch (error) {
            console.error('Error creating 3D model:', error);
            throw error;
        }
    }

    async convertModel({ modelId, targetFormat, options = {} }) {
        try {
            if (!modelId || !targetFormat) {
                throw new Error('Model ID and target format are required');
            }
            
            // Get the model
            const model = this.cadModels.get(modelId);
            if (!model) {
                return {
                    status: 'error',
                    message: 'Model not found'
                };
            }
            
            // Use CAD conversion tool
            const cadConversionTool = this.tools.get('cad-conversion');
            const conversionResult = await cadConversionTool.execute({
                model,
                targetFormat,
                options
            });
            
            // Update model with new format
            model.convertedFormats = model.convertedFormats || {};
            model.convertedFormats[targetFormat] = {
                files: conversionResult.files,
                conversionDate: new Date().toISOString(),
                fileSize: conversionResult.fileSize
            };
            
            model.updatedAt = new Date().toISOString();
            this.cadModels.set(modelId, model);
            
            return {
                status: 'success',
                modelId,
                targetFormat,
                conversionResult
            };
        } catch (error) {
            console.error('Error converting model:', error);
            throw error;
        }
    }

    async generateTechnicalDrawing({ modelId, viewType = 'orthographic', annotations = true }) {
        try {
            if (!modelId) {
                throw new Error('Model ID is required');
            }
            
            // Get the model
            const model = this.cadModels.get(modelId);
            if (!model) {
                return {
                    status: 'error',
                    message: 'Model not found'
                };
            }
            
            // Can only generate technical drawings from 3D models
            if (model.type !== '3d') {
                return {
                    status: 'error',
                    message: 'Technical drawings can only be generated from 3D models'
                };
            }
            
            // Use 2D CAD tool for the projection
            const cad2DTool = this.tools.get('cad-2d');
            const drawingResult = await cad2DTool.execute({
                action: 'generate-technical-drawing',
                model,
                viewType,
                annotations
            });
            
            // Generate drawing ID
            const drawingId = uuid.v4();
            
            // Create drawing model
            const drawing = {
                id: drawingId,
                baseModelId: modelId,
                name: `${model.name} - Technical Drawing`,
                type: '2d-technical',
                viewType,
                annotations,
                files: drawingResult.files,
                dimensions: drawingResult.dimensions,
                views: drawingResult.views,
                createdAt: new Date().toISOString()
            };
            
            // Store the drawing
            this.cadModels.set(drawingId, drawing);
            
            // Update original model with reference to technical drawing
            model.technicalDrawings = model.technicalDrawings || [];
            model.technicalDrawings.push(drawingId);
            model.updatedAt = new Date().toISOString();
            this.cadModels.set(modelId, model);
            
            return {
                status: 'success',
                drawingId,
                drawing
            };
        } catch (error) {
            console.error('Error generating technical drawing:', error);
            throw error;
        }
    }

    _initializeComponentLibraries() {
        // Standard mechanical components library
        const mechanicalLibrary = {
            id: 'mechanical',
            name: 'Standard Mechanical Components',
            components: {
                'fasteners': {
                    screws: { /* details */ },
                    bolts: { /* details */ },
                    nuts: { /* details */ }
                },
                'bearings': {
                    ball: { /* details */ },
                    roller: { /* details */ }
                },
                'gears': {
                    spur: { /* details */ },
                    bevel: { /* details */ },
                    worm: { /* details */ }
                }
            },
            createdAt: new Date().toISOString()
        };
        
        // Electronic components library
        const electronicLibrary = {
            id: 'electronic',
            name: 'Electronic Components',
            components: {
                'connectors': { /* details */ },
                'switches': { /* details */ },
                'resistors': { /* details */ }
            },
            createdAt: new Date().toISOString()
        };
        
        // Store libraries
        this.cadLibraries.set('mechanical', mechanicalLibrary);
        this.cadLibraries.set('electronic', electronicLibrary);
    }

    _resolveLibraryComponents(componentRefs) {
        if (!componentRefs || componentRefs.length === 0) {
            return [];
        }
        
        const resolvedComponents = [];
        
        for (const ref of componentRefs) {
            // Parse reference: libraryId/categoryId/componentId
            const [libraryId, categoryId, componentId] = ref.split('/');
            
            if (!libraryId || !this.cadLibraries.has(libraryId)) {
                continue;
            }
            
            const library = this.cadLibraries.get(libraryId);
            
            if (!categoryId || !library.components[categoryId]) {
                continue;
            }
            
            const category = library.components[categoryId];
            
            if (!componentId || !category[componentId]) {
                continue;
            }
            
            resolvedComponents.push({
                reference: ref,
                component: category[componentId]
            });
        }
        
        return resolvedComponents;
    }

    getCADModelById(modelId) {
        return this.cadModels.get(modelId);
    }

    getCADLibraryById(libraryId) {
        return this.cadLibraries.get(libraryId);
    }

    getAllCADLibraries() {
        return Array.from(this.cadLibraries.values());
    }

    getProjectByName(projectName) {
        return Array.from(this.projects.values()).find(p => p.name === projectName);
    }
}

module.exports = CADAgent; 