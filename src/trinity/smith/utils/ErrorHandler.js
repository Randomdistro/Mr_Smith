/**
 * ErrorHandler.js - Standardized error handling for Smith framework
 * 
 * This utility provides consistent error handling, logging, and reporting
 * throughout the Smith framework components.
 */

const { EventEmitter } = require('events');

/**
 * Custom error types for the Smith framework
 */
class SmithError extends Error {
    constructor(message, code = 'SMITH_ERROR', details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;
        this.timestamp = new Date();
        Error.captureStackTrace(this, this.constructor);
    }
    
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

// Specific error types
class ConfigurationError extends SmithError {
    constructor(message, details = {}) {
        super(message, 'CONFIGURATION_ERROR', details);
    }
}

class ValidationError extends SmithError {
    constructor(message, details = {}) {
        super(message, 'VALIDATION_ERROR', details);
    }
}

class AgentError extends SmithError {
    constructor(message, details = {}) {
        super(message, 'AGENT_ERROR', details);
    }
}

class AttributeError extends SmithError {
    constructor(message, details = {}) {
        super(message, 'ATTRIBUTE_ERROR', details);
    }
}

class APIError extends SmithError {
    constructor(message, details = {}, statusCode = 500) {
        super(message, 'API_ERROR', details);
        this.statusCode = statusCode;
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            statusCode: this.statusCode
        };
    }
}

/**
 * ErrorHandler - Central error handling utility
 * 
 * Provides standardized error creation, logging, and reporting
 * with optional integration with monitoring systems.
 */
class ErrorHandler extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            enableConsoleLogging: config.enableConsoleLogging !== undefined ? 
                config.enableConsoleLogging : true,
            logLevel: config.logLevel || 'error', // debug, info, warn, error
            enableTelemetry: config.enableTelemetry !== undefined ?
                config.enableTelemetry : false,
            telemetryEndpoint: config.telemetryEndpoint || null,
            ...config
        };
        
        this.errorCounts = {
            total: 0,
            byType: {}
        };
        
        // Set log level threshold
        this._setLogLevel();
    }
    
    /**
     * Handle and process an error
     * @param {Error} error - Error to handle
     * @param {Object} context - Additional context information
     * @param {boolean} rethrow - Whether to rethrow the error after handling
     * @returns {Error} - The handled error (possibly wrapped)
     */
    handleError(error, context = {}, rethrow = false) {
        // Ensure it's a SmithError
        const smithError = this._wrapError(error, context);
        
        // Track error statistics
        this._trackError(smithError);
        
        // Log the error
        this._logError(smithError, context);
        
        // Send telemetry if enabled
        if (this.config.enableTelemetry) {
            this._sendTelemetry(smithError, context);
        }
        
        // Emit error event
        this.emit('error', smithError, context);
        
        // Rethrow if requested
        if (rethrow) {
            throw smithError;
        }
        
        return smithError;
    }
    
    /**
     * Create a configuration error
     * @param {string} message - Error message
     * @param {Object} details - Error details
     * @returns {ConfigurationError} - New error instance
     */
    createConfigurationError(message, details = {}) {
        return new ConfigurationError(message, details);
    }
    
    /**
     * Create a validation error
     * @param {string} message - Error message
     * @param {Object} details - Error details
     * @returns {ValidationError} - New error instance
     */
    createValidationError(message, details = {}) {
        return new ValidationError(message, details);
    }
    
    /**
     * Create an agent error
     * @param {string} message - Error message
     * @param {Object} details - Error details
     * @returns {AgentError} - New error instance
     */
    createAgentError(message, details = {}) {
        return new AgentError(message, details);
    }
    
    /**
     * Create an attribute error
     * @param {string} message - Error message
     * @param {Object} details - Error details
     * @returns {AttributeError} - New error instance
     */
    createAttributeError(message, details = {}) {
        return new AttributeError(message, details);
    }
    
    /**
     * Create an API error
     * @param {string} message - Error message
     * @param {Object} details - Error details
     * @param {number} statusCode - HTTP status code
     * @returns {APIError} - New error instance
     */
    createAPIError(message, details = {}, statusCode = 500) {
        return new APIError(message, details, statusCode);
    }
    
    /**
     * Handle HTTP API errors for Express middleware
     * @returns {Function} - Express middleware function
     */
    createAPIErrorHandler() {
        return (err, req, res, next) => {
            const apiError = err instanceof APIError ? 
                err : 
                new APIError(err.message || 'Internal Server Error', 
                             { originalError: err.message }, 
                             err.statusCode || 500);
            
            // Handle the error
            this.handleError(apiError, { 
                url: req.url, 
                method: req.method, 
                ip: req.ip 
            });
            
            // Send error response
            res.status(apiError.statusCode).json({
                status: 'error',
                message: apiError.message,
                code: apiError.code,
                ...(this.config.includeErrorDetails ? { details: apiError.details } : {})
            });
        };
    }
    
    /**
     * Get error statistics
     * @returns {Object} - Error statistics
     */
    getErrorStats() {
        return { ...this.errorCounts };
    }
    
    /**
     * Reset error statistics
     */
    resetErrorStats() {
        this.errorCounts = {
            total: 0,
            byType: {}
        };
    }
    
    /**
     * Wrap a standard error in a SmithError if needed
     * @param {Error} error - Error to wrap
     * @param {Object} context - Additional context
     * @returns {SmithError} - SmithError instance
     * @private
     */
    _wrapError(error, context) {
        if (error instanceof SmithError) {
            return error;
        }
        
        // Add context to details
        const details = {
            originalError: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            ...context
        };
        
        return new SmithError(error.message, 'GENERIC_ERROR', details);
    }
    
    /**
     * Track error statistics
     * @param {SmithError} error - Error to track
     * @private
     */
    _trackError(error) {
        this.errorCounts.total += 1;
        
        const errorType = error.name;
        if (!this.errorCounts.byType[errorType]) {
            this.errorCounts.byType[errorType] = 0;
        }
        
        this.errorCounts.byType[errorType] += 1;
    }
    
    /**
     * Log an error to the console
     * @param {SmithError} error - Error to log
     * @param {Object} context - Additional context
     * @private
     */
    _logError(error, context) {
        if (!this.config.enableConsoleLogging) {
            return;
        }
        
        const severity = this._getErrorSeverity(error);
        
        // Only log if severity meets threshold
        if (this._severityLevels[severity] < this._logLevelThreshold) {
            return;
        }
        
        const timestamp = new Date().toISOString();
        const errorInfo = {
            timestamp,
            name: error.name,
            code: error.code,
            message: error.message,
            severity,
            context: Object.keys(context).length > 0 ? context : undefined
        };
        
        // Use appropriate console method based on severity
        switch (severity) {
            case 'debug':
                console.debug('[DEBUG]', JSON.stringify(errorInfo, null, 2));
                break;
            case 'info':
                console.info('[INFO]', JSON.stringify(errorInfo, null, 2));
                break;
            case 'warn':
                console.warn('[WARNING]', JSON.stringify(errorInfo, null, 2));
                break;
            case 'error':
            default:
                console.error('[ERROR]', JSON.stringify(errorInfo, null, 2));
                if (this.config.logLevel === 'debug') {
                    console.error(error.stack);
                }
        }
    }
    
    /**
     * Send error telemetry to monitoring service
     * @param {SmithError} error - Error to report
     * @param {Object} context - Additional context
     * @private
     */
    _sendTelemetry(error, context) {
        if (!this.config.telemetryEndpoint) {
            return;
        }
        
        // This would be implemented to send to monitoring service
        // For example, using fetch or axios to send error data
        
        // Placeholder implementation:
        const telemetryData = {
            error: error.toJSON(),
            context,
            source: 'smith-framework',
            timestamp: new Date().toISOString()
        };
        
        // Asynchronously send telemetry (implementation would vary)
        this._sendTelemetryAsync(telemetryData).catch(err => {
            // Don't use handleError here to avoid potential loops
            if (this.config.enableConsoleLogging) {
                console.error('Failed to send error telemetry:', err.message);
            }
        });
    }
    
    /**
     * Async function to send telemetry data
     * @param {Object} data - Telemetry data to send
     * @private
     */
    async _sendTelemetryAsync(data) {
        // This would use fetch/axios to send to monitoring service
        // Placeholder implementation that logs but doesn't actually send
        if (this.config.logLevel === 'debug') {
            console.debug('Would send telemetry:', data);
        }
    }
    
    /**
     * Determine error severity based on error type
     * @param {SmithError} error - Error to evaluate
     * @returns {string} - Severity level (debug, info, warn, error)
     * @private
     */
    _getErrorSeverity(error) {
        // Default to error level
        if (!error || !error.code) {
            return 'error';
        }
        
        // Map error codes to severity levels
        const severityMap = {
            VALIDATION_ERROR: 'warn',
            CONFIGURATION_ERROR: 'error',
            AGENT_ERROR: 'error',
            ATTRIBUTE_ERROR: 'warn',
            API_ERROR: error.statusCode < 500 ? 'warn' : 'error'
        };
        
        return severityMap[error.code] || 'error';
    }
    
    /**
     * Set log level threshold based on configuration
     * @private
     */
    _setLogLevel() {
        // Define severity levels with numeric values
        this._severityLevels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        
        // Set threshold based on configured log level
        this._logLevelThreshold = this._severityLevels[this.config.logLevel] || 
                                 this._severityLevels.error;
    }
}

// Create a singleton instance for global use
const defaultErrorHandler = new ErrorHandler();

// Export error types and handler
module.exports = {
    SmithError,
    ConfigurationError,
    ValidationError,
    AgentError,
    AttributeError,
    APIError,
    ErrorHandler,
    defaultErrorHandler
}; 