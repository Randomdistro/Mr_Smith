/**
 * QueryAgent - Lightweight Tier 1 agent for simple queries
 * Fire-and-forget design pattern: created for a single query, returns results, then is disposed
 */

const Agent = require('../../core/Agent');

class QueryAgent extends Agent {
    constructor(mrSmith, config = {}) {
        super(mrSmith, {
            tier: 'lightweight',
            temporary: true, // Always temporary - fire and forget
            ...config
        });
        
        this.maxRetries = config.maxRetries || 3;
        this.dataCache = new Map();
    }
    
    async initializeTools() {
        try {
            // Load only what we need for the specific query type
            // This keeps the agent lightweight
            const queryType = this.config.queryType || 'general';
            
            switch (queryType) {
                case 'web':
                    const WebScraperTool = require('../../tools/research/WebScraperTool');
                    this.tools.set('web-scraper', new WebScraperTool({
                        mrSmith: this.mrSmith,
                        agent: this
                    }));
                    break;
                    
                case 'database':
                    const DatabaseQueryTool = require('../../tools/data-processing/DatabaseQueryTool');
                    this.tools.set('database-query', new DatabaseQueryTool({
                        mrSmith: this.mrSmith,
                        agent: this
                    }));
                    break;
                    
                case 'local':
                    const LocalFileTool = require('../../tools/data-processing/LocalFileTool');
                    this.tools.set('local-file', new LocalFileTool({
                        mrSmith: this.mrSmith,
                        agent: this
                    }));
                    break;
                    
                default:
                    // Just use a basic search tool for general queries
                    const SearchTool = require('../../tools/research/SearchTool');
                    this.tools.set('search', new SearchTool({
                        mrSmith: this.mrSmith,
                        agent: this
                    }));
            }
            
            this.logger.debug(`QueryAgent initialized with ${this.tools.size} tools for ${queryType} queries`);
        } catch (error) {
            this.logger.error('Error initializing QueryAgent tools:', error);
            throw error;
        }
    }
    
    async processTask(taskData) {
        try {
            const { query, type, options = {} } = taskData;
            
            if (!query) {
                throw new Error('Query is required');
            }
            
            // Check cache first
            const cacheKey = `${type}:${query}`;
            if (this.config.useCache !== false && this.dataCache.has(cacheKey)) {
                return {
                    status: 'success',
                    data: this.dataCache.get(cacheKey),
                    fromCache: true
                };
            }
            
            // Execute query based on type
            let result;
            
            switch (type) {
                case 'web-search':
                    result = await this._executeWebSearch(query, options);
                    break;
                    
                case 'database-query':
                    result = await this._executeDatabaseQuery(query, options);
                    break;
                    
                case 'local-search':
                    result = await this._executeLocalSearch(query, options);
                    break;
                    
                default:
                    result = await this._executeGeneralSearch(query, options);
            }
            
            // Cache the result
            if (this.config.useCache !== false) {
                this.dataCache.set(cacheKey, result);
            }
            
            return {
                status: 'success',
                data: result
            };
            
        } catch (error) {
            this.logger.error('Error processing query:', error);
            throw error;
        }
    }
    
    async _executeWebSearch(query, options) {
        const webScraperTool = this.tools.get('web-scraper');
        
        if (!webScraperTool) {
            throw new Error('Web scraper tool not available');
        }
        
        let retries = 0;
        let error;
        
        while (retries < this.maxRetries) {
            try {
                return await webScraperTool.execute({
                    action: 'search',
                    query,
                    depth: options.depth || 1,
                    extractImages: options.extractImages || false
                });
            } catch (err) {
                error = err;
                retries++;
                
                if (retries < this.maxRetries) {
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                }
            }
        }
        
        throw error;
    }
    
    async _executeDatabaseQuery(query, options) {
        const databaseQueryTool = this.tools.get('database-query');
        
        if (!databaseQueryTool) {
            throw new Error('Database query tool not available');
        }
        
        return await databaseQueryTool.execute({
            action: 'query',
            query,
            database: options.database || 'main',
            limit: options.limit
        });
    }
    
    async _executeLocalSearch(query, options) {
        const localFileTool = this.tools.get('local-file');
        
        if (!localFileTool) {
            throw new Error('Local file tool not available');
        }
        
        return await localFileTool.execute({
            action: 'search',
            query,
            path: options.path || '.',
            recursive: options.recursive || false
        });
    }
    
    async _executeGeneralSearch(query, options) {
        const searchTool = this.tools.get('search');
        
        if (!searchTool) {
            throw new Error('Search tool not available');
        }
        
        return await searchTool.execute({
            action: 'search',
            query,
            limit: options.limit || 10
        });
    }
    
    cleanup() {
        // Clear cache
        this.dataCache.clear();
        
        // Call parent cleanup
        super.cleanup();
    }
}

module.exports = QueryAgent; 