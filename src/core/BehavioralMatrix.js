/**
 * BehavioralMatrix - Agent Attribute Configuration System
 * Manages agent behaviors, attributes, and personality traits
 */

const { EventEmitter } = require('events');

class BehavioralMatrix extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            matrixPath: config.matrixPath || './data/behavioral_matrix.json',
            ...config
        };
        this.matrix = new Map();
        this.attributes = new Map();
        this.behaviors = new Map();
        this.isLoaded = false;
    }

    async load() {
        try {
            // Load matrix configuration
            await this.loadMatrixConfig();
            
            // Initialize default attributes
            this.initializeDefaultAttributes();
            
            // Initialize default behaviors
            this.initializeDefaultBehaviors();
            
            this.isLoaded = true;
            this.emit('loaded');
            
            return true;
        } catch (error) {
            console.error('Failed to load behavioral matrix:', error);
            this.emit('error', error);
            throw error;
        }
    }

    async loadMatrixConfig() {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            const matrixConfig = JSON.parse(
                await fs.readFile(path.resolve(this.config.matrixPath), 'utf8')
            );
            
            // Load matrix data
            for (const [key, value] of Object.entries(matrixConfig)) {
                this.matrix.set(key, value);
            }
        } catch (error) {
            console.error('Failed to load matrix configuration:', error);
            throw error;
        }
    }

    initializeDefaultAttributes() {
        // Define default attributes
        const defaultAttributes = {
            adaptability: {
                type: 'numeric',
                range: [0, 100],
                default: 50
            },
            creativity: {
                type: 'numeric',
                range: [0, 100],
                default: 50
            },
            efficiency: {
                type: 'numeric',
                range: [0, 100],
                default: 50
            },
            reliability: {
                type: 'numeric',
                range: [0, 100],
                default: 50
            },
            sociability: {
                type: 'numeric',
                range: [0, 100],
                default: 50
            }
        };

        for (const [key, value] of Object.entries(defaultAttributes)) {
            this.attributes.set(key, value);
        }
    }

    initializeDefaultBehaviors() {
        // Define default behaviors
        const defaultBehaviors = {
            communication: {
                style: 'professional',
                frequency: 'moderate',
                formality: 'high'
            },
            decisionMaking: {
                style: 'analytical',
                speed: 'moderate',
                riskTolerance: 'medium'
            },
            problemSolving: {
                approach: 'systematic',
                creativity: 'balanced',
                persistence: 'high'
            },
            collaboration: {
                style: 'cooperative',
                leadership: 'situational',
                adaptability: 'high'
            }
        };

        for (const [key, value] of Object.entries(defaultBehaviors)) {
            this.behaviors.set(key, value);
        }
    }

    async save() {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            const matrixData = {
                attributes: Object.fromEntries(this.attributes),
                behaviors: Object.fromEntries(this.behaviors),
                matrix: Object.fromEntries(this.matrix)
            };
            
            await fs.writeFile(
                path.resolve(this.config.matrixPath),
                JSON.stringify(matrixData, null, 2)
            );
            
            this.emit('saved');
            return true;
        } catch (error) {
            console.error('Failed to save behavioral matrix:', error);
            this.emit('error', error);
            throw error;
        }
    }

    // Attribute Management
    setAttribute(agentId, attributeName, value) {
        if (!this.attributes.has(attributeName)) {
            throw new Error(`Attribute ${attributeName} not found`);
        }

        const attribute = this.attributes.get(attributeName);
        if (attribute.type === 'numeric') {
            value = Math.max(attribute.range[0], Math.min(attribute.range[1], value));
        }

        if (!this.matrix.has(agentId)) {
            this.matrix.set(agentId, {});
        }

        this.matrix.get(agentId)[attributeName] = value;
        this.emit('attribute:updated', { agentId, attributeName, value });
    }

    getAttribute(agentId, attributeName) {
        if (!this.attributes.has(attributeName)) {
            throw new Error(`Attribute ${attributeName} not found`);
        }

        const agentMatrix = this.matrix.get(agentId) || {};
        return agentMatrix[attributeName] || this.attributes.get(attributeName).default;
    }

    // Behavior Management
    setBehavior(agentId, behaviorName, value) {
        if (!this.behaviors.has(behaviorName)) {
            throw new Error(`Behavior ${behaviorName} not found`);
        }

        if (!this.matrix.has(agentId)) {
            this.matrix.set(agentId, {});
        }

        this.matrix.get(agentId)[behaviorName] = value;
        this.emit('behavior:updated', { agentId, behaviorName, value });
    }

    getBehavior(agentId, behaviorName) {
        if (!this.behaviors.has(behaviorName)) {
            throw new Error(`Behavior ${behaviorName} not found`);
        }

        const agentMatrix = this.matrix.get(agentId) || {};
        return agentMatrix[behaviorName] || this.behaviors.get(behaviorName);
    }

    // Matrix Analysis
    getAgentProfile(agentId) {
        const profile = {
            attributes: {},
            behaviors: {}
        };

        for (const [attributeName] of this.attributes) {
            profile.attributes[attributeName] = this.getAttribute(agentId, attributeName);
        }

        for (const [behaviorName] of this.behaviors) {
            profile.behaviors[behaviorName] = this.getBehavior(agentId, behaviorName);
        }

        return profile;
    }

    // Utility Methods
    validateAttribute(attributeName, value) {
        const attribute = this.attributes.get(attributeName);
        if (!attribute) {
            throw new Error(`Attribute ${attributeName} not found`);
        }

        if (attribute.type === 'numeric') {
            return value >= attribute.range[0] && value <= attribute.range[1];
        }

        return true;
    }

    getSimilarAgents(agentId, threshold = 0.8) {
        const targetProfile = this.getAgentProfile(agentId);
        const similarAgents = [];

        for (const [otherId, otherMatrix] of this.matrix) {
            if (otherId === agentId) continue;

            const otherProfile = this.getAgentProfile(otherId);
            const similarity = this.calculateProfileSimilarity(targetProfile, otherProfile);

            if (similarity >= threshold) {
                similarAgents.push({ agentId: otherId, similarity });
            }
        }

        return similarAgents.sort((a, b) => b.similarity - a.similarity);
    }

    calculateProfileSimilarity(profile1, profile2) {
        let totalSimilarity = 0;
        let count = 0;

        // Compare attributes
        for (const [attributeName, value1] of Object.entries(profile1.attributes)) {
            const value2 = profile2.attributes[attributeName];
            if (typeof value1 === 'number' && typeof value2 === 'number') {
                totalSimilarity += 1 - Math.abs(value1 - value2) / 100;
                count++;
            }
        }

        // Compare behaviors
        for (const [behaviorName, behavior1] of Object.entries(profile1.behaviors)) {
            const behavior2 = profile2.behaviors[behaviorName];
            if (typeof behavior1 === 'object' && typeof behavior2 === 'object') {
                const behaviorSimilarity = this.calculateBehaviorSimilarity(behavior1, behavior2);
                totalSimilarity += behaviorSimilarity;
                count++;
            }
        }

        return count > 0 ? totalSimilarity / count : 0;
    }

    calculateBehaviorSimilarity(behavior1, behavior2) {
        let similarity = 0;
        let count = 0;

        for (const [key, value1] of Object.entries(behavior1)) {
            const value2 = behavior2[key];
            if (value1 === value2) {
                similarity += 1;
            }
            count++;
        }

        return count > 0 ? similarity / count : 0;
    }
}

module.exports = BehavioralMatrix; 