/**
 * DesignAgent - Specialized agent for visual and product design
 * Responsible for creating visual assets, product designs, and user interfaces
 */

const Agent = require('../core/Agent');
const uuid = require('uuid');

class DesignAgent extends Agent {
    constructor(mrSmith, config = {}) {
        super(mrSmith, config);
        this.designProjects = new Map();
        this.designAssets = new Map();
        this.designStyles = new Map();
    }

    async initializeTools() {
        // Load design tools
        const VisualDesignTool = require('../tools/design/VisualDesignTool');
        const UIDesignTool = require('../tools/design/UIDesignTool');
        const ProductDesignTool = require('../tools/design/ProductDesignTool');
        
        this.tools.set('visual-design', new VisualDesignTool({
            mrSmith: this.mrSmith,
            agent: this
        }));
        
        this.tools.set('ui-design', new UIDesignTool({
            mrSmith: this.mrSmith,
            agent: this
        }));
        
        this.tools.set('product-design', new ProductDesignTool({
            mrSmith: this.mrSmith,
            agent: this
        }));
        
        // Initialize default design styles
        this._initializeDefaultStyles();
    }

    async processTask(taskData) {
        const { type, parameters } = taskData;
        
        switch(type) {
            case 'visual-asset-creation':
                return await this.createVisualAsset(parameters);
            case 'ui-design':
                return await this.createUIDesign(parameters);
            case 'product-design':
                return await this.createProductDesign(parameters);
            case 'style-guide-creation':
                return await this.createStyleGuide(parameters);
            default:
                throw new Error(`Unknown task type: ${type}`);
        }
    }

    async createVisualAsset({ assetType, specifications, styleId = 'default' }) {
        try {
            if (!assetType || !specifications) {
                throw new Error('Asset type and specifications are required');
            }
            
            // Get style if specified
            const style = this.designStyles.get(styleId) || this.designStyles.get('default');
            
            // Generate asset ID
            const assetId = uuid.v4();
            
            // Use visual design tool
            const visualDesignTool = this.tools.get('visual-design');
            const designResult = await visualDesignTool.execute({
                assetType,
                specifications,
                style
            });
            
            // Create asset object
            const asset = {
                id: assetId,
                type: assetType,
                specifications,
                styleId,
                files: designResult.files,
                previewUrl: designResult.previewUrl,
                dimensions: designResult.dimensions,
                fileFormats: designResult.fileFormats,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Store the asset
            this.designAssets.set(assetId, asset);
            
            return {
                status: 'success',
                assetId,
                asset
            };
        } catch (error) {
            console.error('Error creating visual asset:', error);
            throw error;
        }
    }

    async createUIDesign({ projectName, platform, requirements, styleId = 'default' }) {
        try {
            if (!projectName || !platform || !requirements) {
                throw new Error('Project name, platform, and requirements are required');
            }
            
            // Get style if specified
            const style = this.designStyles.get(styleId) || this.designStyles.get('default');
            
            // Generate project ID
            const projectId = uuid.v4();
            
            // Use UI design tool
            const uiDesignTool = this.tools.get('ui-design');
            const designResult = await uiDesignTool.execute({
                projectName,
                platform,
                requirements,
                style
            });
            
            // Create project object
            const project = {
                id: projectId,
                name: projectName,
                type: 'ui-design',
                platform,
                requirements,
                styleId,
                screens: designResult.screens,
                components: designResult.components,
                flowDiagrams: designResult.flowDiagrams,
                interactivePrototype: designResult.interactivePrototype,
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Store the project
            this.designProjects.set(projectId, project);
            
            return {
                status: 'success',
                projectId,
                project
            };
        } catch (error) {
            console.error('Error creating UI design:', error);
            throw error;
        }
    }

    async createProductDesign({ productName, category, requirements, styleId = 'default' }) {
        try {
            if (!productName || !category || !requirements) {
                throw new Error('Product name, category, and requirements are required');
            }
            
            // Get style if specified
            const style = this.designStyles.get(styleId) || this.designStyles.get('default');
            
            // Generate project ID
            const projectId = uuid.v4();
            
            // Use product design tool
            const productDesignTool = this.tools.get('product-design');
            const designResult = await productDesignTool.execute({
                productName,
                category,
                requirements,
                style
            });
            
            // Create project object
            const project = {
                id: projectId,
                name: productName,
                type: 'product-design',
                category,
                requirements,
                styleId,
                conceptDrawings: designResult.conceptDrawings,
                renderings: designResult.renderings,
                specifications: designResult.specifications,
                materials: designResult.materials,
                manufacturabilityNotes: designResult.manufacturabilityNotes,
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Store the project
            this.designProjects.set(projectId, project);
            
            return {
                status: 'success',
                projectId,
                project
            };
        } catch (error) {
            console.error('Error creating product design:', error);
            throw error;
        }
    }

    async createStyleGuide({ name, primaryColor, secondaryColors = [], typography = {}, components = [] }) {
        try {
            if (!name || !primaryColor) {
                throw new Error('Style name and primary color are required');
            }
            
            // Generate style ID
            const styleId = uuid.v4();
            
            // Create style object
            const style = {
                id: styleId,
                name,
                colors: {
                    primary: primaryColor,
                    secondary: secondaryColors,
                    generated: this._generateColorPalette(primaryColor)
                },
                typography: typography || {
                    headingFont: 'Arial',
                    bodyFont: 'Arial',
                    scale: 'default'
                },
                spacing: this._generateSpacingSystem(),
                components: components || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Store the style
            this.designStyles.set(styleId, style);
            
            return {
                status: 'success',
                styleId,
                style
            };
        } catch (error) {
            console.error('Error creating style guide:', error);
            throw error;
        }
    }

    _initializeDefaultStyles() {
        // Create default style
        const defaultStyle = {
            id: 'default',
            name: 'Default Style',
            colors: {
                primary: '#4A90E2',
                secondary: ['#50E3C2', '#F5A623', '#D0021B'],
                generated: this._generateColorPalette('#4A90E2')
            },
            typography: {
                headingFont: 'Arial',
                bodyFont: 'Arial',
                scale: 'default'
            },
            spacing: this._generateSpacingSystem(),
            components: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Create modern style
        const modernStyle = {
            id: 'modern',
            name: 'Modern Style',
            colors: {
                primary: '#2D9CDB',
                secondary: ['#27AE60', '#F2994A', '#EB5757'],
                generated: this._generateColorPalette('#2D9CDB')
            },
            typography: {
                headingFont: 'Montserrat',
                bodyFont: 'Open Sans',
                scale: 'modern'
            },
            spacing: this._generateSpacingSystem('compact'),
            components: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Store default styles
        this.designStyles.set('default', defaultStyle);
        this.designStyles.set('modern', modernStyle);
    }

    _generateColorPalette(primaryColor) {
        // Mock implementation - in a real system this would use color theory algorithms
        return {
            lightest: this._adjustColorBrightness(primaryColor, 0.8),
            light: this._adjustColorBrightness(primaryColor, 0.4),
            base: primaryColor,
            dark: this._adjustColorBrightness(primaryColor, -0.3),
            darkest: this._adjustColorBrightness(primaryColor, -0.6)
        };
    }

    _adjustColorBrightness(hex, adjustment) {
        // Mock implementation - in a real system this would properly adjust color brightness
        return hex; // Just returning the same color for mock implementation
    }

    _generateSpacingSystem(type = 'standard') {
        // Mock implementation
        if (type === 'compact') {
            return {
                xs: '4px',
                sm: '8px',
                md: '16px',
                lg: '24px',
                xl: '32px'
            };
        }
        
        return {
            xs: '8px',
            sm: '16px',
            md: '24px',
            lg: '32px',
            xl: '48px'
        };
    }

    getDesignAssetById(assetId) {
        return this.designAssets.get(assetId);
    }

    getDesignProjectById(projectId) {
        return this.designProjects.get(projectId);
    }

    getDesignStyleById(styleId) {
        return this.designStyles.get(styleId);
    }

    getAllDesignStyles() {
        return Array.from(this.designStyles.values());
    }
}

module.exports = DesignAgent; 