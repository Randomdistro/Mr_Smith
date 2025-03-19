/**
 * HumanizationEngine.js - Agent Humanization Tool
 * 
 * Provides capabilities for imbuing agents with human-like traits,
 * behaviors, communication styles, and decision-making processes
 */

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;

class HumanizationEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            traitsDataPath: config.traitsDataPath || path.join(__dirname, '../data/humanization/traits.json'),
            personasPath: config.personasPath || path.join(__dirname, '../data/humanization/personas.json'),
            expressionModelsPath: config.expressionModelsPath || path.join(__dirname, '../data/humanization/expressions.json'),
            ...config
        };
        
        // Core data stores
        this.traits = new Map();
        this.personas = new Map();
        this.expressionModels = new Map();
        
        // Tracking and metrics
        this.metrics = {
            totalAgentsHumanized: 0,
            traitsApplied: {},
            personasUsed: {},
            lastActivity: null
        };
        
        this.isInitialized = false;
    }
    
    /**
     * Initialize the Humanization Engine
     */
    async initialize() {
        try {
            // Ensure directories exist
            await this._ensureDirectories();
            
            // Load traits data
            await this._loadTraits();
            
            // Load personas
            await this._loadPersonas();
            
            // Load expression models
            await this._loadExpressionModels();
            
            this.isInitialized = true;
            this.metrics.lastActivity = new Date();
            
            this.emit('humanization:initialized', {
                traitsCount: this.traits.size,
                personasCount: this.personas.size,
                expressionModelsCount: this.expressionModels.size,
                timestamp: this.metrics.lastActivity
            });
            
            return true;
        } catch (error) {
            console.error('Failed to initialize Humanization Engine:', error);
            this.emit('humanization:error', { error, context: 'initialization' });
            throw error;
        }
    }
    
    /**
     * Apply humanization to an agent
     * @param {Object} agent - The agent to humanize
     * @param {Object} options - Humanization options
     * @param {string} options.personaType - Type of persona to apply (e.g., 'business', 'casual')
     * @param {Array} options.traitNames - Specific traits to apply
     * @param {number} options.distinctiveness - How distinctive/strong the humanization should be (0-1)
     * @param {Object} options.constraints - Constraints on the humanization (e.g., ethical bounds)
     */
    async humanizeAgent(agent, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Humanization Engine not initialized');
        }
        
        try {
            this.metrics.lastActivity = new Date();
            
            // Select persona
            const persona = await this._selectPersona(options.personaType);
            
            // Select traits
            const traits = await this._selectTraits(options.traitNames, options.distinctiveness);
            
            // Select expression model
            const expressionModel = await this._selectExpressionModel(persona);
            
            // Apply persona to agent
            await this._applyPersona(agent, persona);
            
            // Apply traits to agent
            await this._applyTraits(agent, traits, options.distinctiveness);
            
            // Apply expression model to agent
            await this._applyExpressionModel(agent, expressionModel);
            
            // Apply constraints
            if (options.constraints) {
                await this._applyConstraints(agent, options.constraints);
            }
            
            // Update metrics
            this.metrics.totalAgentsHumanized++;
            this._updateTraitMetrics(traits);
            this._updatePersonaMetrics(persona);
            
            // Create result
            const result = {
                agentId: agent.id,
                appliedPersona: persona.name,
                appliedTraits: traits.map(t => t.name),
                expressionModel: expressionModel.name,
                constraints: options.constraints || {}
            };
            
            this.emit('humanization:agent_humanized', {
                ...result,
                timestamp: new Date()
            });
            
            return result;
        } catch (error) {
            this.emit('humanization:error', {
                error,
                context: 'agent_humanization',
                agentId: agent.id,
                options
            });
            throw error;
        }
    }
    
    /**
     * Get available personas
     */
    getAvailablePersonas() {
        return Array.from(this.personas.values()).map(p => ({
            name: p.name,
            description: p.description,
            category: p.category
        }));
    }
    
    /**
     * Get available traits
     */
    getAvailableTraits() {
        return Array.from(this.traits.values()).map(t => ({
            name: t.name,
            description: t.description,
            category: t.category
        }));
    }
    
    /**
     * Get humanization metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Generate persona variations
     * @param {string} basePersonaName - Base persona to create variations from
     * @param {number} variationCount - Number of variations to generate
     * @param {number} variationStrength - How different the variations should be (0-1)
     */
    async generatePersonaVariations(basePersonaName, variationCount = 3, variationStrength = 0.5) {
        if (!this.personas.has(basePersonaName)) {
            throw new Error(`Base persona "${basePersonaName}" not found`);
        }
        
        const basePersona = this.personas.get(basePersonaName);
        const variations = [];
        
        for (let i = 0; i < variationCount; i++) {
            const variation = await this._createPersonaVariation(basePersona, variationStrength);
            variations.push(variation);
        }
        
        return variations;
    }
    
    /**
     * Analyze humanization effectiveness
     * @param {Object} agent - The humanized agent to analyze
     */
    async analyzeHumanization(agent) {
        // To be implemented: analysis of how human-like the agent's behaviors are
        return {
            agentId: agent.id,
            effectiveness: 0.85, // Placeholder
            consistencyScore: 0.9, // Placeholder
            naturalness: 0.8, // Placeholder
            recommendations: [
                "Increase variation in response timing",
                "Add more personality in failure scenarios"
            ]
        };
    }
    
    // Private methods
    
    /**
     * Ensure necessary directories exist
     */
    async _ensureDirectories() {
        try {
            const dirs = [
                path.dirname(this.config.traitsDataPath),
                path.dirname(this.config.personasPath),
                path.dirname(this.config.expressionModelsPath)
            ];
            
            for (const dir of dirs) {
                try {
                    await fs.mkdir(dir, { recursive: true });
                } catch (e) {
                    // Directory already exists, continue
                }
            }
        } catch (error) {
            throw new Error(`Failed to create directories: ${error.message}`);
        }
    }
    
    /**
     * Load traits data
     */
    async _loadTraits() {
        try {
            // Check if traits file exists
            try {
                await fs.access(this.config.traitsDataPath);
            } catch (e) {
                // Create default traits file
                const defaultTraits = {
                    "conscientiousness": {
                        "name": "conscientiousness",
                        "description": "Tendency to be organized, responsible, and hardworking",
                        "category": "big5",
                        "behaviors": {
                            "high": ["Organized", "Thorough", "Detail-oriented"],
                            "low": ["Disorganized", "Impulsive", "Careless"]
                        },
                        "expressions": {
                            "high": ["Let me double-check that for you", "I'll make sure everything is in order"],
                            "low": ["Let's just get it done", "The details aren't that important"]
                        }
                    },
                    "extroversion": {
                        "name": "extroversion",
                        "description": "Tendency to be social, outgoing, and energetic",
                        "category": "big5",
                        "behaviors": {
                            "high": ["Talkative", "Assertive", "Enthusiastic"],
                            "low": ["Reserved", "Reflective", "Quiet"]
                        },
                        "expressions": {
                            "high": ["I'm excited to work with you!", "Let's discuss this further!"],
                            "low": ["I'll consider this carefully", "I'd prefer to analyze this first"]
                        }
                    },
                    "agreeableness": {
                        "name": "agreeableness",
                        "description": "Tendency to be cooperative, compassionate, and friendly",
                        "category": "big5",
                        "behaviors": {
                            "high": ["Cooperative", "Sympathetic", "Helpful"],
                            "low": ["Challenging", "Detached", "Analytical"]
                        },
                        "expressions": {
                            "high": ["I understand your concern", "How can I help you with that?"],
                            "low": ["That's not logical", "The facts don't support that"]
                        }
                    },
                    "confidence": {
                        "name": "confidence",
                        "description": "Level of self-assurance and conviction",
                        "category": "business",
                        "behaviors": {
                            "high": ["Decisive", "Bold", "Authoritative"],
                            "low": ["Cautious", "Uncertain", "Hesitant"]
                        },
                        "expressions": {
                            "high": ["I'm certain this is the right approach", "Trust me on this"],
                            "low": ["We might want to consider...", "Perhaps we could try..."]
                        }
                    },
                    "humor": {
                        "name": "humor",
                        "description": "Tendency to use humor in interactions",
                        "category": "communication",
                        "behaviors": {
                            "high": ["Playful", "Witty", "Light-hearted"],
                            "low": ["Serious", "Straightforward", "Literal"]
                        },
                        "expressions": {
                            "high": ["On the bright side...", "That's one way to look at it!"],
                            "low": ["To be clear...", "The important thing to understand is..."]
                        }
                    }
                };
                
                await fs.writeFile(
                    this.config.traitsDataPath, 
                    JSON.stringify(defaultTraits, null, 2)
                );
            }
            
            // Load traits
            const traitsData = JSON.parse(await fs.readFile(this.config.traitsDataPath, 'utf8'));
            
            // Store traits
            for (const [name, trait] of Object.entries(traitsData)) {
                this.traits.set(name, trait);
            }
        } catch (error) {
            throw new Error(`Failed to load traits: ${error.message}`);
        }
    }
    
    /**
     * Load personas
     */
    async _loadPersonas() {
        try {
            // Check if personas file exists
            try {
                await fs.access(this.config.personasPath);
            } catch (e) {
                // Create default personas file
                const defaultPersonas = {
                    "business_consultant": {
                        "name": "business_consultant",
                        "description": "Professional business consultant with industry expertise",
                        "category": "business",
                        "baseTraits": {
                            "conscientiousness": 0.8,
                            "extroversion": 0.6,
                            "agreeableness": 0.7,
                            "confidence": 0.9,
                            "humor": 0.4
                        },
                        "communicationStyle": {
                            "formality": 0.8,
                            "directness": 0.7,
                            "technical": 0.6
                        }
                    },
                    "creative_designer": {
                        "name": "creative_designer",
                        "description": "Innovative and artistic creative professional",
                        "category": "creative",
                        "baseTraits": {
                            "conscientiousness": 0.6,
                            "extroversion": 0.7,
                            "agreeableness": 0.8,
                            "confidence": 0.7,
                            "humor": 0.8
                        },
                        "communicationStyle": {
                            "formality": 0.4,
                            "directness": 0.5,
                            "technical": 0.4
                        }
                    },
                    "technical_expert": {
                        "name": "technical_expert",
                        "description": "Knowledgeable and precise technical specialist",
                        "category": "technical",
                        "baseTraits": {
                            "conscientiousness": 0.9,
                            "extroversion": 0.4,
                            "agreeableness": 0.5,
                            "confidence": 0.8,
                            "humor": 0.3
                        },
                        "communicationStyle": {
                            "formality": 0.7,
                            "directness": 0.9,
                            "technical": 0.9
                        }
                    },
                    "supportive_assistant": {
                        "name": "supportive_assistant",
                        "description": "Helpful and friendly assistant focused on user satisfaction",
                        "category": "support",
                        "baseTraits": {
                            "conscientiousness": 0.8,
                            "extroversion": 0.7,
                            "agreeableness": 0.9,
                            "confidence": 0.6,
                            "humor": 0.6
                        },
                        "communicationStyle": {
                            "formality": 0.5,
                            "directness": 0.6,
                            "technical": 0.4
                        }
                    }
                };
                
                await fs.writeFile(
                    this.config.personasPath, 
                    JSON.stringify(defaultPersonas, null, 2)
                );
            }
            
            // Load personas
            const personasData = JSON.parse(await fs.readFile(this.config.personasPath, 'utf8'));
            
            // Store personas
            for (const [name, persona] of Object.entries(personasData)) {
                this.personas.set(name, persona);
            }
        } catch (error) {
            throw new Error(`Failed to load personas: ${error.message}`);
        }
    }
    
    /**
     * Load expression models
     */
    async _loadExpressionModels() {
        try {
            // Check if expression models file exists
            try {
                await fs.access(this.config.expressionModelsPath);
            } catch (e) {
                // Create default expression models file
                const defaultExpressionModels = {
                    "business_formal": {
                        "name": "business_formal",
                        "description": "Formal business communication style",
                        "category": "business",
                        "templates": {
                            "greeting": ["I hope this message finds you well.", "Thank you for the opportunity to connect."],
                            "agreement": ["I concur with your assessment.", "Your proposal aligns with our objectives."],
                            "disagreement": ["I would like to offer an alternative perspective.", "There may be some additional factors to consider."],
                            "closing": ["I look forward to our continued collaboration.", "Please let me know if you require any clarification."]
                        },
                        "wordChoices": {
                            "positive": ["optimal", "advantageous", "beneficial", "profitable"],
                            "negative": ["suboptimal", "challenging", "concerning", "problematic"],
                            "neutral": ["noteworthy", "significant", "relevant", "substantial"]
                        }
                    },
                    "technical_precise": {
                        "name": "technical_precise",
                        "description": "Precise technical communication style",
                        "category": "technical",
                        "templates": {
                            "greeting": ["Let's review the technical specifications.", "I've analyzed the system parameters."],
                            "agreement": ["The data confirms your hypothesis.", "Your technical assessment is accurate."],
                            "disagreement": ["The metrics indicate a different conclusion.", "The technical specifications don't support that approach."],
                            "closing": ["Let me know if you need additional technical details.", "I'm available to discuss implementation specifics."]
                        },
                        "wordChoices": {
                            "positive": ["efficient", "optimized", "reliable", "scalable"],
                            "negative": ["inefficient", "unstable", "deprecated", "incompatible"],
                            "neutral": ["documented", "specified", "measured", "configured"]
                        }
                    },
                    "casual_friendly": {
                        "name": "casual_friendly",
                        "description": "Casual and friendly communication style",
                        "category": "casual",
                        "templates": {
                            "greeting": ["Hey there!", "Great to connect with you!"],
                            "agreement": ["I'm totally with you on that.", "That sounds like a great idea!"],
                            "disagreement": ["I see it a bit differently.", "Have you thought about it this way?"],
                            "closing": ["Looking forward to chatting more!", "Let me know what you think!"]
                        },
                        "wordChoices": {
                            "positive": ["great", "awesome", "fantastic", "excellent"],
                            "negative": ["tricky", "tough", "not ideal", "needs work"],
                            "neutral": ["interesting", "notable", "worth considering", "substantial"]
                        }
                    }
                };
                
                await fs.writeFile(
                    this.config.expressionModelsPath, 
                    JSON.stringify(defaultExpressionModels, null, 2)
                );
            }
            
            // Load expression models
            const expressionModelsData = JSON.parse(await fs.readFile(this.config.expressionModelsPath, 'utf8'));
            
            // Store expression models
            for (const [name, model] of Object.entries(expressionModelsData)) {
                this.expressionModels.set(name, model);
            }
        } catch (error) {
            throw new Error(`Failed to load expression models: ${error.message}`);
        }
    }
    
    /**
     * Select persona based on type
     * @param {string} personaType - Type of persona to select
     */
    async _selectPersona(personaType) {
        if (!personaType) {
            // If no specific type, select a random persona
            const personaArray = Array.from(this.personas.values());
            return personaArray[Math.floor(Math.random() * personaArray.length)];
        }
        
        // Find personas matching the specified type
        const matchingPersonas = Array.from(this.personas.values())
            .filter(p => p.category === personaType);
        
        if (matchingPersonas.length === 0) {
            throw new Error(`No personas found for type "${personaType}"`);
        }
        
        // Select a random matching persona
        return matchingPersonas[Math.floor(Math.random() * matchingPersonas.length)];
    }
    
    /**
     * Select traits based on names or generate a balanced set
     * @param {Array} traitNames - Specific traits to select
     * @param {number} distinctiveness - How distinctive the traits should be
     */
    async _selectTraits(traitNames, distinctiveness = 0.5) {
        if (traitNames && Array.isArray(traitNames) && traitNames.length > 0) {
            // Select specific traits
            const traits = [];
            
            for (const name of traitNames) {
                if (this.traits.has(name)) {
                    traits.push(this.traits.get(name));
                }
            }
            
            if (traits.length === 0) {
                throw new Error('None of the specified traits were found');
            }
            
            return traits;
        }
        
        // No specific traits requested, create a balanced set
        const allTraits = Array.from(this.traits.values());
        const traitCount = Math.max(3, Math.floor(allTraits.length * distinctiveness));
        const shuffledTraits = allTraits.sort(() => 0.5 - Math.random());
        
        return shuffledTraits.slice(0, traitCount);
    }
    
    /**
     * Select expression model based on persona
     * @param {Object} persona - The selected persona
     */
    async _selectExpressionModel(persona) {
        // Try to find an expression model matching the persona category
        const matchingModels = Array.from(this.expressionModels.values())
            .filter(m => m.category === persona.category);
        
        if (matchingModels.length > 0) {
            return matchingModels[Math.floor(Math.random() * matchingModels.length)];
        }
        
        // No matching model, select a random model
        const modelArray = Array.from(this.expressionModels.values());
        return modelArray[Math.floor(Math.random() * modelArray.length)];
    }
    
    /**
     * Apply persona to agent
     * @param {Object} agent - The agent to humanize
     * @param {Object} persona - The selected persona
     */
    async _applyPersona(agent, persona) {
        // Store the persona in the agent's data store
        agent.storeData('persona', persona);
        
        // Apply base traits from the persona
        if (persona.baseTraits) {
            agent.storeData('baseTraits', persona.baseTraits);
        }
        
        // Apply communication style from the persona
        if (persona.communicationStyle) {
            agent.storeData('communicationStyle', persona.communicationStyle);
        }
        
        return true;
    }
    
    /**
     * Apply traits to agent
     * @param {Object} agent - The agent to humanize
     * @param {Array} traits - The selected traits
     * @param {number} distinctiveness - How distinctive the traits should be
     */
    async _applyTraits(agent, traits, distinctiveness = 0.5) {
        // Get existing traits or create new map
        const agentTraits = agent.retrieveData('traits') || new Map();
        
        // Apply each trait with a level based on distinctiveness
        for (const trait of traits) {
            // Calculate trait level with some randomness but centered around distinctiveness
            const baseLevel = distinctiveness;
            const variance = 0.2; // Variance to add randomness
            let level = baseLevel + (Math.random() * variance * 2 - variance);
            
            // Ensure level is between 0 and 1
            level = Math.max(0, Math.min(1, level));
            
            // Store trait and level
            agentTraits.set(trait.name, {
                name: trait.name,
                level,
                behaviors: this._selectTraitBehaviors(trait, level),
                expressions: this._selectTraitExpressions(trait, level)
            });
        }
        
        // Store updated traits in agent
        agent.storeData('traits', agentTraits);
        
        return true;
    }
    
    /**
     * Apply expression model to agent
     * @param {Object} agent - The agent to humanize
     * @param {Object} expressionModel - The selected expression model
     */
    async _applyExpressionModel(agent, expressionModel) {
        // Store the expression model in the agent's data store
        agent.storeData('expressionModel', expressionModel);
        
        return true;
    }
    
    /**
     * Apply constraints to agent
     * @param {Object} agent - The agent to humanize
     * @param {Object} constraints - The constraints to apply
     */
    async _applyConstraints(agent, constraints) {
        // Store constraints in the agent's data store
        agent.storeData('constraints', constraints);
        
        return true;
    }
    
    /**
     * Select behaviors for a trait based on level
     * @param {Object} trait - The trait
     * @param {number} level - The trait level (0-1)
     */
    _selectTraitBehaviors(trait, level) {
        if (!trait.behaviors) {
            return [];
        }
        
        // Determine whether to use high or low behaviors based on level
        const behaviors = level > 0.5 ? trait.behaviors.high : trait.behaviors.low;
        
        // If no behaviors found, return empty array
        if (!behaviors || !Array.isArray(behaviors)) {
            return [];
        }
        
        return [...behaviors];
    }
    
    /**
     * Select expressions for a trait based on level
     * @param {Object} trait - The trait
     * @param {number} level - The trait level (0-1)
     */
    _selectTraitExpressions(trait, level) {
        if (!trait.expressions) {
            return [];
        }
        
        // Determine whether to use high or low expressions based on level
        const expressions = level > 0.5 ? trait.expressions.high : trait.expressions.low;
        
        // If no expressions found, return empty array
        if (!expressions || !Array.isArray(expressions)) {
            return [];
        }
        
        return [...expressions];
    }
    
    /**
     * Create a variation of a persona
     * @param {Object} basePersona - The base persona
     * @param {number} variationStrength - How different the variation should be (0-1)
     */
    async _createPersonaVariation(basePersona, variationStrength) {
        const variation = {
            ...basePersona,
            name: `${basePersona.name}_variation_${Date.now()}`,
            baseTraits: { ...basePersona.baseTraits },
            communicationStyle: { ...basePersona.communicationStyle }
        };
        
        // Modify base traits
        if (variation.baseTraits) {
            for (const [trait, value] of Object.entries(variation.baseTraits)) {
                // Add random variation within bounds
                const change = (Math.random() * 2 - 1) * variationStrength;
                variation.baseTraits[trait] = Math.max(0, Math.min(1, value + change));
            }
        }
        
        // Modify communication style
        if (variation.communicationStyle) {
            for (const [style, value] of Object.entries(variation.communicationStyle)) {
                // Add random variation within bounds
                const change = (Math.random() * 2 - 1) * variationStrength;
                variation.communicationStyle[style] = Math.max(0, Math.min(1, value + change));
            }
        }
        
        return variation;
    }
    
    /**
     * Update trait metrics
     * @param {Array} traits - The traits applied
     */
    _updateTraitMetrics(traits) {
        for (const trait of traits) {
            const name = trait.name;
            this.metrics.traitsApplied[name] = (this.metrics.traitsApplied[name] || 0) + 1;
        }
    }
    
    /**
     * Update persona metrics
     * @param {Object} persona - The persona applied
     */
    _updatePersonaMetrics(persona) {
        const name = persona.name;
        this.metrics.personasUsed[name] = (this.metrics.personasUsed[name] || 0) + 1;
    }
}

module.exports = HumanizationEngine; 