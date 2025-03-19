/**
 * ConfigManager.js - Configuration management for Smith framework
 * 
 * Provides centralized configuration handling, including default values,
 * validation, and environment-specific settings.
 */

const fs = require('fs').promises;
const path = require('path');
const { defaultErrorHandler, ConfigurationError } = require('./ErrorHandler');

/**
 * ConfigManager - Centralized configuration management
 */
class ConfigManager {
    /**
     * Create a new ConfigManager instance
     * @param {Object} options - ConfigManager options
     */
    constructor(options = {}) {
        this.options = {
            configPath: options.configPath || process.env.SMITH_CONFIG_PATH,
            environment: options.environment || process.env.NODE_ENV || 'development',
            errorHandler: options.errorHandler || defaultErrorHandler,
            enableEnvOverrides: options.enableEnvOverrides !== undefined ? options.enableEnvOverrides : true,
            ...options
        };
        
        // Initialize config with defaults
        this.config = this._getDefaults();
        
        // Track loaded status
        this.isLoaded = false;
    }
    
    /**
     * Load configuration from files and environment
     * @returns {Promise<Object>} - Loaded configuration
     */
    async load() {
        try {
            // First load default configuration
            let config = { ...this._getDefaults() };
            
            // If configPath is specified, load from file
            if (this.options.configPath) {
                const fileConfig = await this._loadConfigFile(this.options.configPath);
                config = this._mergeConfigs(config, fileConfig);
            }
            
            // Load environment-specific configuration
            const envConfig = await this._loadEnvironmentConfig();
            if (envConfig) {
                config = this._mergeConfigs(config, envConfig);
            }
            
            // Apply environment variable overrides
            if (this.options.enableEnvOverrides) {
                config = this._applyEnvOverrides(config);
            }
            
            // Validate the final configuration
            this._validateConfig(config);
            
            // Store the loaded configuration
            this.config = config;
            this.isLoaded = true;
            
            return config;
        } catch (error) {
            const configError = this.options.errorHandler.createConfigurationError(
                `Failed to load configuration: ${error.message}`,
                { originalError: error.message }
            );
            this.options.errorHandler.handleError(configError);
            throw configError;
        }
    }
    
    /**
     * Get configuration value by path
     * @param {string} path - Dot-notation path to config value
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} - Configuration value
     */
    get(path, defaultValue) {
        if (!this.isLoaded) {
            console.warn('Configuration accessed before loading. Using defaults.');
        }
        
        const parts = path.split('.');
        let current = this.config;
        
        for (const part of parts) {
            if (current === undefined || current === null || typeof current !== 'object') {
                return defaultValue;
            }
            current = current[part];
        }
        
        return current !== undefined ? current : defaultValue;
    }
    
    /**
     * Get a section of the configuration
     * @param {string} section - Top-level section name
     * @returns {Object} - Configuration section
     */
    getSection(section) {
        if (!this.isLoaded) {
            console.warn('Configuration accessed before loading. Using defaults.');
        }
        
        return this.config[section] || {};
    }
    
    /**
     * Get entire configuration
     * @returns {Object} - Complete configuration
     */
    getAll() {
        if (!this.isLoaded) {
            console.warn('Configuration accessed before loading. Using defaults.');
        }
        
        return { ...this.config };
    }
    
    /**
     * Validate a specific configuration value
     * @param {string} path - Dot-notation path to config value
     * @param {Function} validator - Validation function
     * @param {string} errorMessage - Error message if validation fails
     * @throws {ConfigurationError} - If validation fails
     */
    validate(path, validator, errorMessage) {
        const value = this.get(path);
        
        if (!validator(value)) {
            const configError = this.options.errorHandler.createConfigurationError(
                errorMessage || `Invalid configuration value for ${path}`,
                { path, value }
            );
            this.options.errorHandler.handleError(configError);
            throw configError;
        }
    }
    
    /**
     * Get default configuration values
     * @returns {Object} - Default configuration
     * @private
     */
    _getDefaults() {
        return {
            // Smith framework core configuration
            smith: {
                dataPath: path.join(process.cwd(), 'data'),
                storagePath: path.join(process.cwd(), 'storage'),
                logging: {
                    enabled: true,
                    level: 'info',
                    filePath: null
                },
                telemetry: {
                    enabled: false,
                    endpoint: null
                },
                security: {
                    requireApproval: true,
                    allowAnonymousAgents: false
                }
            },
            
            // API configuration
            api: {
                enabled: true,
                port: 3000,
                host: 'localhost',
                prefix: '/api/smith',
                cors: {
                    enabled: true,
                    allowedOrigins: ['*']
                },
                rateLimit: {
                    enabled: true,
                    windowMs: 15 * 60 * 1000, // 15 minutes
                    max: 100 // limit each IP to 100 requests per windowMs
                }
            },
            
            // Agent configuration
            agents: {
                defaultType: 'GenericAgent',
                idPrefix: 'agent_',
                maxPerUser: 10,
                lifetimeLimit: null // null = no limit
            },
            
            // Attribute management configuration
            attributes: {
                validateOnApply: true,
                normalizeValues: true,
                defaultTemplate: 'balanced',
                attributeHistoryLimit: 10
            },
            
            // Humanization engine configuration
            humanization: {
                enabled: true,
                defaultPersona: 'neutral',
                traitsPath: path.join(process.cwd(), 'data/humanization/traits.json'),
                personasPath: path.join(process.cwd(), 'data/humanization/personas.json'),
                expressionsPath: path.join(process.cwd(), 'data/humanization/expressions.json')
            }
        };
    }
    
    /**
     * Load configuration from file
     * @param {string} configPath - Path to configuration file
     * @returns {Promise<Object>} - Configuration from file
     * @private
     */
    async _loadConfigFile(configPath) {
        try {
            const fileContent = await fs.readFile(configPath, 'utf8');
            return JSON.parse(fileContent);
        } catch (error) {
            throw new Error(`Error loading config file from ${configPath}: ${error.message}`);
        }
    }
    
    /**
     * Load environment-specific configuration
     * @returns {Promise<Object|null>} - Environment configuration or null
     * @private
     */
    async _loadEnvironmentConfig() {
        const env = this.options.environment;
        if (!env) return null;
        
        const envConfigPath = this.options.configPath 
            ? path.join(path.dirname(this.options.configPath), `config.${env}.json`)
            : path.join(process.cwd(), `config.${env}.json`);
        
        try {
            return await this._loadConfigFile(envConfigPath);
        } catch (error) {
            // Environment config is optional, so just log a warning
            console.warn(`Environment config for ${env} not found or invalid.`);
            return null;
        }
    }
    
    /**
     * Apply environment variable overrides to configuration
     * @param {Object} config - Configuration to override
     * @returns {Object} - Configuration with overrides applied
     * @private
     */
    _applyEnvOverrides(config) {
        const result = { ...config };
        
        // Apply environment variable overrides
        // Format: SMITH_SECTION_KEY=value
        // Example: SMITH_API_PORT=8080
        
        Object.keys(process.env).forEach(key => {
            if (!key.startsWith('SMITH_')) return;
            
            const path = key.replace('SMITH_', '').toLowerCase().split('_');
            if (path.length < 2) return;
            
            let current = result;
            for (let i = 0; i < path.length - 1; i++) {
                const part = path[i];
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
            
            const lastKey = path[path.length - 1];
            const value = process.env[key];
            
            // Try to parse value as JSON, fall back to string
            try {
                current[lastKey] = JSON.parse(value);
            } catch (e) {
                current[lastKey] = value;
            }
        });
        
        return result;
    }
    
    /**
     * Validate the configuration
     * @param {Object} config - Configuration to validate
     * @throws {ConfigurationError} - If validation fails
     * @private
     */
    _validateConfig(config) {
        // Validate required configuration
        if (!config.smith) {
            throw new ConfigurationError('Missing required configuration section: smith');
        }
        
        if (!config.api) {
            throw new ConfigurationError('Missing required configuration section: api');
        }
        
        // Validate paths can be accessed
        const validatePath = async (pathValue, pathName) => {
            try {
                await fs.access(pathValue);
            } catch (error) {
                console.warn(`${pathName} path does not exist or cannot be accessed: ${pathValue}`);
                // Don't throw, just warn - the path might be created later
            }
        };
        
        // These validations are async, but we're just logging warnings,
        // so we don't need to await them
        validatePath(config.smith.dataPath, 'Data');
        validatePath(config.smith.storagePath, 'Storage');
        
        // Additional validations could be added here
    }
    
    /**
     * Merge configurations with deep merge
     * @param {Object} target - Target configuration
     * @param {Object} source - Source configuration
     * @returns {Object} - Merged configuration
     * @private
     */
    _mergeConfigs(target, source) {
        const result = { ...target };
        
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this._mergeConfigs(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        });
        
        return result;
    }
}

// Create a singleton instance for global use
const defaultConfigManager = new ConfigManager();

module.exports = {
    ConfigManager,
    defaultConfigManager
}; 