/**
 * SmithAPI.js - API Interface for Mr. Smith Agent Customization Framework
 * 
 * Provides a lightweight, injectable API for agent creation, customization,
 * and management, enabling integration with external systems.
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Smith = require('../Smith');
const AttributeManager = require('../tools/AttributeManager');
const { defaultErrorHandler, APIError } = require('../utils/ErrorHandler');

/**
 * SmithAPI - RESTful API for the Smith framework
 */
class SmithAPI {
    /**
     * Create a new SmithAPI instance
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.config = {
            port: config.port || 3000,
            host: config.host || 'localhost',
            apiPrefix: config.apiPrefix || '/api/smith',
            enableCors: config.enableCors !== undefined ? config.enableCors : true,
            enableLogging: config.enableLogging !== undefined ? config.enableLogging : true,
            includeErrorDetails: config.includeErrorDetails !== undefined ? config.includeErrorDetails : false,
            smithConfig: config.smithConfig || {},
            attributeManagerConfig: config.attributeManagerConfig || {},
            ...config
        };
        
        // Initialize components
        this.smith = null;
        this.attributeManager = null;
        this.app = express();
        this.server = null;
        this.isInitialized = false;
        
        // Use default error handler or custom one if provided
        this.errorHandler = config.errorHandler || defaultErrorHandler;
    }
    
    /**
     * Initialize the API server and core components
     * @returns {Promise<boolean>} - True if initialization successful
     */
    async initialize() {
        try {
            // Initialize Smith component
            this.smith = new Smith(this.config.smithConfig);
            await this.smith.initialize();
            
            // Initialize AttributeManager
            this.attributeManager = new AttributeManager(this.config.attributeManagerConfig);
            await this.attributeManager.initialize();
            
            // Configure Express and set up routes
            this._configureExpress();
            this._setupRoutes();
            
            // Start the server
            this.server = await this._startServer();
            
            this.isInitialized = true;
            return true;
        } catch (error) {
            this.errorHandler.handleError(
                this.errorHandler.createConfigurationError(
                    'Failed to initialize Smith API',
                    { originalError: error.message }
                )
            );
            throw error;
        }
    }
    
    /**
     * Shut down the API server and core components
     * @returns {Promise<void>}
     */
    async shutdown() {
        if (!this.isInitialized) {
            return;
        }
        
        try {
            // Stop the HTTP server
            if (this.server) {
                await new Promise((resolve) => {
                    this.server.close(resolve);
                });
            }
            
            // Shut down Smith component
            if (this.smith) {
                await this.smith.shutdown();
            }
            
            this.isInitialized = false;
            console.log('Smith API server shut down');
        } catch (error) {
            this.errorHandler.handleError(
                this.errorHandler.createConfigurationError(
                    'Error during API shutdown',
                    { originalError: error.message }
                )
            );
        }
    }
    
    /**
     * Get API status information
     * @returns {Object} - Status information
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            smithInitialized: this.smith?.isInitialized || false,
            attributeManagerInitialized: this.attributeManager?.isInitialized || false,
            apiVersion: '1.0.0',
            uptime: this.isInitialized ? process.uptime() : 0
        };
    }
    
    /**
     * Configure Express server
     * @private
     */
    _configureExpress() {
        // Parse JSON request bodies
        this.app.use(bodyParser.json());
        
        // Enable CORS if configured
        if (this.config.enableCors) {
            this.app.use(cors());
        }
        
        // Add request logging middleware
        if (this.config.enableLogging) {
            this.app.use(this._createRequestLogger());
        }
    }
    
    /**
     * Create request logging middleware
     * @returns {Function} - Express middleware
     * @private
     */
    _createRequestLogger() {
        return (req, res, next) => {
            const startTime = Date.now();
            
            // Log request information
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            
            // Add response finished listener to log completion
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
            });
            
            next();
        };
    }
    
    /**
     * Start the HTTP server
     * @returns {Promise<http.Server>} - Running server instance
     * @private
     */
    async _startServer() {
        return new Promise((resolve, reject) => {
            try {
                const server = this.app.listen(this.config.port, this.config.host, () => {
                    console.log(`Smith API server running at http://${this.config.host}:${this.config.port}`);
                    resolve(server);
                });
                
                server.on('error', (error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Set up API routes
     * @private
     */
    _setupRoutes() {
        const router = express.Router();
        const prefix = this.config.apiPrefix;
        
        // Register route groups
        this._registerHealthRoutes(router);
        this._registerAgentRoutes(router);
        this._registerAttributeRoutes(router);
        this._registerRoleRoutes(router);
        this._registerAnalysisRoutes(router);
        
        // Apply routes with prefix
        this.app.use(prefix, router);
        
        // Add error handling middleware
        this.app.use(this.errorHandler.createAPIErrorHandler());
    }
    
    /**
     * Register health and status routes
     * @param {express.Router} router - Express router
     * @private
     */
    _registerHealthRoutes(router) {
        router.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                ...this.getStatus()
            });
        });
    }
    
    /**
     * Register agent management routes
     * @param {express.Router} router - Express router
     * @private
     */
    _registerAgentRoutes(router) {
        // Create an agent
        router.post('/agent', this._asyncHandler(async (req, res) => {
            const { type, parameters, attributes, approved = false } = req.body;
            
            if (!type) {
                throw new APIError('Agent type is required', {}, 400);
            }
            
            // First create the base agent
            const agentResult = await this.smith.createAgent({
                id: req.body.id || `agent_${Date.now()}`,
                type,
                parameters,
                approved
            });
            
            // If creation was successful and attributes were provided, apply them
            if (agentResult.status === 'success' && attributes) {
                await this.attributeManager.applyAttributes(agentResult.agent, attributes);
            }
            
            res.json(agentResult);
        }));
        
        // Create an agent optimized for a specific role
        router.post('/agent/role', this._asyncHandler(async (req, res) => {
            const { type, parameters, role, attributeOverrides = {}, approved = false } = req.body;
            
            if (!type || !role) {
                throw new APIError('Agent type and role are required', {}, 400);
            }
            
            // Get optimized attributes for the role
            const optimizedAttributes = await this.attributeManager.getOptimizedAttributes(role);
            
            // Apply any overrides
            for (const path in attributeOverrides) {
                const [category, attribute] = path.split('.');
                if (optimizedAttributes[category] && attribute) {
                    optimizedAttributes[category][attribute] = attributeOverrides[path];
                }
            }
            
            // Create the agent
            const agentResult = await this.smith.createAgent({
                id: req.body.id || `agent_${Date.now()}`,
                type,
                parameters,
                approved
            });
            
            // If creation was successful, apply the optimized attributes
            if (agentResult.status === 'success') {
                await this.attributeManager.applyAttributes(agentResult.agent, optimizedAttributes);
            }
            
            res.json(agentResult);
        }));
        
        // Get an agent by ID
        router.get('/agent/:id', this._asyncHandler(async (req, res) => {
            const agent = this.smith.getAgent(req.params.id);
            
            if (!agent) {
                throw new APIError(`Agent ${req.params.id} not found`, {}, 404);
            }
            
            // Get agent state
            const state = agent.getState();
            
            // Get agent attributes if available
            const attributes = await this.attributeManager.loadAttributeProfile(req.params.id);
            
            res.json({
                status: 'success',
                agent: {
                    ...state,
                    attributes: attributes ? attributes.attributes : null
                }
            });
        }));
        
        // Get all agents
        router.get('/agents', this._asyncHandler(async (req, res) => {
            const agents = this.smith.getAllAgents();
            
            res.json({
                status: 'success',
                count: agents.length,
                agents: agents.map(agent => ({
                    id: agent.id,
                    type: agent.type,
                    state: agent.state
                }))
            });
        }));
        
        // Update agent attributes
        router.put('/agent/:id/attributes', this._asyncHandler(async (req, res) => {
            const agent = this.smith.getAgent(req.params.id);
            
            if (!agent) {
                throw new APIError(`Agent ${req.params.id} not found`, {}, 404);
            }
            
            const result = await this.attributeManager.applyAttributes(agent, req.body);
            
            res.json({
                status: 'success',
                agentId: req.params.id,
                ...result
            });
        }));
        
        // Destroy an agent
        router.delete('/agent/:id', this._asyncHandler(async (req, res) => {
            const result = await this.smith.destroyAgent(req.params.id);
            res.json(result);
        }));
    }
    
    /**
     * Register attribute management routes
     * @param {express.Router} router - Express router
     * @private
     */
    _registerAttributeRoutes(router) {
        // Get all attribute definitions
        router.get('/attributes', this._asyncHandler(async (req, res) => {
            const attributes = this.attributeManager.getAttributes();
            
            res.json({
                status: 'success',
                attributes
            });
        }));
        
        // Get attribute templates
        router.get('/templates', this._asyncHandler(async (req, res) => {
            const templates = this.attributeManager.getAttributeTemplates();
            
            res.json({
                status: 'success',
                templates
            });
        }));
        
        // Get specific attribute template
        router.get('/template/:name', this._asyncHandler(async (req, res) => {
            const template = this.attributeManager.getAttributeTemplate(req.params.name);
            
            if (!template) {
                throw new APIError(`Template ${req.params.name} not found`, {}, 404);
            }
            
            res.json({
                status: 'success',
                template
            });
        }));
        
        // Create attribute template
        router.post('/template', this._asyncHandler(async (req, res) => {
            const { name, description, attributes } = req.body;
            
            if (!name || !attributes) {
                throw new APIError('Template name and attributes are required', {}, 400);
            }
            
            const template = await this.attributeManager.createAttributeTemplate(
                name,
                description || `Template for ${name}`,
                attributes
            );
            
            res.json({
                status: 'success',
                template
            });
        }));
    }
    
    /**
     * Register role management routes
     * @param {express.Router} router - Express router
     * @private
     */
    _registerRoleRoutes(router) {
        // Get all role definitions
        router.get('/roles', this._asyncHandler(async (req, res) => {
            const roles = this.attributeManager.getRoleDefinitions();
            
            res.json({
                status: 'success',
                roles
            });
        }));
        
        // Get specific role definition
        router.get('/role/:name', this._asyncHandler(async (req, res) => {
            const role = this.attributeManager.getRoleDefinition(req.params.name);
            
            if (!role) {
                throw new APIError(`Role ${req.params.name} not found`, {}, 404);
            }
            
            res.json({
                status: 'success',
                role
            });
        }));
        
        // Create role definition
        router.post('/role', this._asyncHandler(async (req, res) => {
            const { name, description, attributeImportance } = req.body;
            
            if (!name || !attributeImportance) {
                throw new APIError('Role name and attributeImportance are required', {}, 400);
            }
            
            const role = await this.attributeManager.createRoleDefinition(
                name,
                description || `Role definition for ${name}`,
                attributeImportance
            );
            
            res.json({
                status: 'success',
                role
            });
        }));
        
        // Get optimized attributes for a role
        router.get('/role/:name/attributes', this._asyncHandler(async (req, res) => {
            const roleName = req.params.name;
            const role = this.attributeManager.getRoleDefinition(roleName);
            
            if (!role) {
                throw new APIError(`Role ${roleName} not found`, {}, 404);
            }
            
            const optimizedAttributes = await this.attributeManager.getOptimizedAttributes(roleName);
            
            res.json({
                status: 'success',
                role: roleName,
                attributes: optimizedAttributes
            });
        }));
    }
    
    /**
     * Register analysis routes
     * @param {express.Router} router - Express router
     * @private
     */
    _registerAnalysisRoutes(router) {
        // Analyze role requirements
        router.post('/analyze', this._asyncHandler(async (req, res) => {
            const { roleRequirements } = req.body;
            
            if (!roleRequirements) {
                throw new APIError('Role requirements are required', {}, 400);
            }
            
            // This is a placeholder for more sophisticated analysis
            // In a real implementation, this might involve ML models to suggest attribute profiles
            
            // Find the closest matching predefined role
            const roles = this.attributeManager.getRoleDefinitions();
            let bestMatch = { role: null, score: 0 };
            
            for (const role of roles) {
                // Simple matching algorithm based on keyword overlap
                const roleKeywords = [role.name, role.description].join(' ').toLowerCase().split(/\W+/);
                const reqKeywords = JSON.stringify(roleRequirements).toLowerCase().split(/\W+/);
                
                const matches = roleKeywords.filter(word => reqKeywords.includes(word));
                const score = matches.length / Math.max(roleKeywords.length, reqKeywords.length);
                
                if (score > bestMatch.score) {
                    bestMatch = { role, score };
                }
            }
            
            if (bestMatch.role) {
                const optimizedAttributes = await this.attributeManager.getOptimizedAttributes(bestMatch.role.name);
                
                res.json({
                    status: 'success',
                    matchedRole: bestMatch.role.name,
                    confidence: bestMatch.score,
                    suggestedAttributes: optimizedAttributes
                });
            } else {
                res.json({
                    status: 'warning',
                    message: 'No matching role found',
                    suggestedAttributes: this.attributeManager._createBalancedAttributes()
                });
            }
        }));
    }
    
    /**
     * Creates a middleware for handling async route handlers
     * @param {Function} fn - Async route handler
     * @returns {Function} - Express middleware
     * @private
     */
    _asyncHandler(fn) {
        return async (req, res, next) => {
            try {
                await fn(req, res, next);
            } catch (error) {
                next(error);
            }
        };
    }
}

module.exports = SmithAPI; 