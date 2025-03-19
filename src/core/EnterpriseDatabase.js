/**
 * EnterpriseDatabase - Data storage and retrieval system
 * Provides centralized data management for all agents
 */

const fs = require('fs');
const path = require('path');

class EnterpriseDatabase {
    constructor(config = {}) {
        this.dataDirectory = config.dataDirectory || path.join(process.cwd(), 'data');
        this.connected = false;
        this.cache = new Map();
        this.options = {
            encryption: config.encryption || false,
            backup: config.backup || false,
            distributed: config.distributed || false,
            ...config
        };
    }

    async connect() {
        try {
            // Ensure data directory exists
            if (!fs.existsSync(this.dataDirectory)) {
                fs.mkdirSync(this.dataDirectory, { recursive: true });
            }
            
            // Create subdirectories for different data types
            const subdirs = ['agents', 'clients', 'projects', 'models', 'workflows'];
            
            for (const subdir of subdirs) {
                const subdirPath = path.join(this.dataDirectory, subdir);
                if (!fs.existsSync(subdirPath)) {
                    fs.mkdirSync(subdirPath, { recursive: true });
                }
            }
            
            // Load cached data
            await this._loadCache();
            
            this.connected = true;
            return true;
        } catch (error) {
            console.error('Error connecting to database:', error);
            throw error;
        }
    }

    async disconnect() {
        try {
            // Persist cache to disk
            await this._persistCache();
            
            this.connected = false;
            return true;
        } catch (error) {
            console.error('Error disconnecting from database:', error);
            throw error;
        }
    }

    async _loadCache() {
        try {
            // Load global metadata
            const metadataPath = path.join(this.dataDirectory, 'metadata.json');
            
            if (fs.existsSync(metadataPath)) {
                const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                this.cache.set('metadata', metadata);
            } else {
                this.cache.set('metadata', {
                    version: '1.0.0',
                    created: new Date().toISOString(),
                    lastBackup: null
                });
            }
            
            // In a real implementation, this would load more data from disk
            // For this example, we just initialize an empty cache
            
            return true;
        } catch (error) {
            console.error('Error loading cache:', error);
            throw error;
        }
    }

    async _persistCache() {
        try {
            // Save global metadata
            const metadata = this.cache.get('metadata') || {
                version: '1.0.0',
                created: new Date().toISOString(),
                lastBackup: null
            };
            
            metadata.lastUpdated = new Date().toISOString();
            
            const metadataPath = path.join(this.dataDirectory, 'metadata.json');
            fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
            
            // In a real implementation, this would persist more data to disk
            // For this example, we don't actually persist the entire cache
            
            return true;
        } catch (error) {
            console.error('Error persisting cache:', error);
            throw error;
        }
    }

    async getAgentConfig(agentName) {
        // Check if we have agent configuration
        const agentConfigsPath = path.join(this.dataDirectory, 'agents', 'configs.json');
        
        try {
            if (fs.existsSync(agentConfigsPath)) {
                const agentConfigs = JSON.parse(fs.readFileSync(agentConfigsPath, 'utf8'));
                return agentConfigs[agentName] || {};
            }
        } catch (error) {
            console.error(`Error loading agent config for ${agentName}:`, error);
        }
        
        // Return default empty config
        return {};
    }

    async saveData(collection, id, data) {
        if (!this.connected) {
            throw new Error('Database not connected');
        }
        
        try {
            // Ensure collection directory exists
            const collectionDir = path.join(this.dataDirectory, collection);
            if (!fs.existsSync(collectionDir)) {
                fs.mkdirSync(collectionDir, { recursive: true });
            }
            
            // Save the data
            const filePath = path.join(collectionDir, `${id}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            
            // Update cache
            const cacheKey = `${collection}:${id}`;
            this.cache.set(cacheKey, data);
            
            return { id, success: true };
        } catch (error) {
            console.error(`Error saving data to ${collection}/${id}:`, error);
            throw error;
        }
    }

    async getData(collection, id) {
        if (!this.connected) {
            throw new Error('Database not connected');
        }
        
        try {
            // Check cache first
            const cacheKey = `${collection}:${id}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            
            // Read from file
            const filePath = path.join(this.dataDirectory, collection, `${id}.json`);
            
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                // Update cache
                this.cache.set(cacheKey, data);
                
                return data;
            }
            
            return null;
        } catch (error) {
            console.error(`Error getting data from ${collection}/${id}:`, error);
            throw error;
        }
    }

    async queryData(collection, query = {}) {
        if (!this.connected) {
            throw new Error('Database not connected');
        }
        
        try {
            const collectionDir = path.join(this.dataDirectory, collection);
            
            if (!fs.existsSync(collectionDir)) {
                return [];
            }
            
            const files = fs.readdirSync(collectionDir).filter(file => file.endsWith('.json'));
            const results = [];
            
            for (const file of files) {
                const filePath = path.join(collectionDir, file);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                // Simple query matching
                let matches = true;
                for (const [key, value] of Object.entries(query)) {
                    if (data[key] !== value) {
                        matches = false;
                        break;
                    }
                }
                
                if (matches) {
                    results.push(data);
                }
            }
            
            return results;
        } catch (error) {
            console.error(`Error querying data from ${collection}:`, error);
            throw error;
        }
    }

    async deleteData(collection, id) {
        if (!this.connected) {
            throw new Error('Database not connected');
        }
        
        try {
            const filePath = path.join(this.dataDirectory, collection, `${id}.json`);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                
                // Remove from cache
                const cacheKey = `${collection}:${id}`;
                this.cache.delete(cacheKey);
                
                return { id, success: true };
            }
            
            return { id, success: false, reason: 'not-found' };
        } catch (error) {
            console.error(`Error deleting data from ${collection}/${id}:`, error);
            throw error;
        }
    }
}

module.exports = EnterpriseDatabase; 