/**
 * Logger - Simple logging utility for Mr. Smith system
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor(options = {}) {
        this.level = options.level || 'info';
        this.filename = options.filename;
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        
        // Ensure log directory exists
        if (this.filename) {
            const logDir = path.dirname(this.filename);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
        }
    }
    
    _shouldLog(level) {
        return this.levels[level] <= this.levels[this.level];
    }
    
    _formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        if (meta) {
            if (typeof meta === 'object') {
                formattedMessage += ` ${JSON.stringify(meta)}`;
            } else {
                formattedMessage += ` ${meta}`;
            }
        }
        
        return formattedMessage;
    }
    
    _writeToFile(message) {
        if (this.filename) {
            fs.appendFileSync(this.filename, message + '\n');
        }
    }
    
    error(message, meta) {
        if (this._shouldLog('error')) {
            const formattedMessage = this._formatMessage('error', message, meta);
            console.error(formattedMessage);
            this._writeToFile(formattedMessage);
        }
    }
    
    warn(message, meta) {
        if (this._shouldLog('warn')) {
            const formattedMessage = this._formatMessage('warn', message, meta);
            console.warn(formattedMessage);
            this._writeToFile(formattedMessage);
        }
    }
    
    info(message, meta) {
        if (this._shouldLog('info')) {
            const formattedMessage = this._formatMessage('info', message, meta);
            console.info(formattedMessage);
            this._writeToFile(formattedMessage);
        }
    }
    
    debug(message, meta) {
        if (this._shouldLog('debug')) {
            const formattedMessage = this._formatMessage('debug', message, meta);
            console.debug(formattedMessage);
            this._writeToFile(formattedMessage);
        }
    }
}

module.exports = Logger; 