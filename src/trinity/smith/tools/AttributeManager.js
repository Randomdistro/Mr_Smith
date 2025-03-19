/**
 * AttributeManager.js - Agent Attribute Management System
 * 
 * Part of the Mr. Smith Agent Customization Framework
 * Handles the comprehensive Behavioral Matrix Framework for agent customization
 */

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;

class AttributeManager extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            attributeTemplatesPath: config.attributeTemplatesPath || path.join(__dirname, '../data/attributes'),
            roleDefinitionsPath: config.roleDefinitionsPath || path.join(__dirname, '../data/roles'),
            attributeProfilesPath: config.attributeProfilesPath || path.join(__dirname, '../storage/agent_profiles'),
            ...config
        };
        
        // Attribute definitions
        this.attributeDefinitions = {
            corePersonality: {},
            cognitiveAbilities: {},
            valueSystems: {},
            behavioralTendencies: {},
            socialDynamics: {},
            ethicalFramework: {},
            stressResponse: {},
            goalOrientation: {},
            adaptiveLearning: {}
        };
        
        // Attribute templates for quick agent creation
        this.attributeTemplates = new Map();
        
        // Role definitions for attribute optimization
        this.roleDefinitions = new Map();
        
        // Initialize state
        this.isInitialized = false;
    }
    
    /**
     * Initialize the attribute management system
     */
    async initialize() {
        try {
            // Create necessary directories
            await this._ensureDirectories();
            
            // Load attribute definitions
            await this._loadAttributeDefinitions();
            
            // Load attribute templates
            await this._loadAttributeTemplates();
            
            // Load role definitions
            await this._loadRoleDefinitions();
            
            this.isInitialized = true;
            this.emit('attributeManager:initialized', { timestamp: new Date() });
            
            return true;
        } catch (error) {
            console.error('Failed to initialize AttributeManager:', error);
            this.emit('attributeManager:error', { error, context: 'initialization' });
            throw error;
        }
    }
    
    /**
     * Get all available attribute categories and their traits
     */
    getAttributes() {
        return { ...this.attributeDefinitions };
    }
    
    /**
     * Get a specific attribute definition
     * @param {string} category - Attribute category
     * @param {string} attribute - Attribute name
     */
    getAttribute(category, attribute) {
        if (!this.attributeDefinitions[category]) {
            return null;
        }
        
        return this.attributeDefinitions[category][attribute] || null;
    }
    
    /**
     * Get available attribute templates
     */
    getAttributeTemplates() {
        return Array.from(this.attributeTemplates.values());
    }
    
    /**
     * Get a specific attribute template
     * @param {string} templateName - Name of the template
     */
    getAttributeTemplate(templateName) {
        return this.attributeTemplates.get(templateName) || null;
    }
    
    /**
     * Get available role definitions
     */
    getRoleDefinitions() {
        return Array.from(this.roleDefinitions.values());
    }
    
    /**
     * Get a specific role definition
     * @param {string} roleName - Name of the role
     */
    getRoleDefinition(roleName) {
        return this.roleDefinitions.get(roleName) || null;
    }
    
    /**
     * Apply attributes to an agent
     * @param {Object} agent - Agent instance
     * @param {Object} attributes - Attribute configuration
     */
    async applyAttributes(agent, attributes) {
        if (!this.isInitialized) {
            throw new Error('AttributeManager not initialized');
        }
        
        try {
            // Validate attributes
            const validationResult = this._validateAttributes(attributes);
            if (!validationResult.valid) {
                throw new Error(`Invalid attributes: ${validationResult.errors.join(', ')}`);
            }
            
            // Normalize attribute values
            const normalizedAttributes = this._normalizeAttributes(attributes);
            
            // Apply to agent
            await agent.applyAttributes(normalizedAttributes);
            
            // Save profile for future reference
            await this._saveAttributeProfile(agent.id, normalizedAttributes);
            
            this.emit('attributeManager:attributes_applied', {
                agentId: agent.id,
                timestamp: new Date()
            });
            
            return {
                success: true,
                appliedAttributes: normalizedAttributes
            };
        } catch (error) {
            this.emit('attributeManager:error', {
                error,
                context: 'attribute_application',
                agentId: agent.id
            });
            
            throw error;
        }
    }
    
    /**
     * Get attributes optimized for a specific role
     * @param {string} roleName - Name of the role
     * @param {Object} baseAttributes - Optional base attributes to start with
     */
    async getOptimizedAttributes(roleName, baseAttributes = null) {
        if (!this.isInitialized) {
            throw new Error('AttributeManager not initialized');
        }
        
        // Get role definition
        const role = this.roleDefinitions.get(roleName);
        if (!role) {
            throw new Error(`Role "${roleName}" not found`);
        }
        
        // Start with base attributes or balanced template
        const attributes = baseAttributes || 
            this.attributeTemplates.get('balanced')?.attributes ||
            this._createBalancedAttributes();
        
        // Apply role-specific optimizations
        return this._applyRoleOptimizations(attributes, role.attributeImportance);
    }
    
    /**
     * Create a new attribute template
     * @param {string} templateName - Name of the template
     * @param {string} description - Description of the template
     * @param {Object} attributes - Attribute configuration
     */
    async createAttributeTemplate(templateName, description, attributes) {
        if (!this.isInitialized) {
            throw new Error('AttributeManager not initialized');
        }
        
        // Validate attributes
        const validationResult = this._validateAttributes(attributes);
        if (!validationResult.valid) {
            throw new Error(`Invalid attributes: ${validationResult.errors.join(', ')}`);
        }
        
        // Create template object
        const template = {
            name: templateName,
            description,
            attributes: this._normalizeAttributes(attributes),
            created: new Date()
        };
        
        // Add to templates map
        this.attributeTemplates.set(templateName, template);
        
        // Save to file
        await this._saveAttributeTemplates();
        
        this.emit('attributeManager:template_created', {
            templateName,
            timestamp: new Date()
        });
        
        return template;
    }
    
    /**
     * Create a new role definition
     * @param {string} roleName - Name of the role
     * @param {string} description - Description of the role
     * @param {Object} attributeImportance - Weighted importance of attributes for this role
     */
    async createRoleDefinition(roleName, description, attributeImportance) {
        if (!this.isInitialized) {
            throw new Error('AttributeManager not initialized');
        }
        
        // Create role object
        const role = {
            name: roleName,
            description,
            attributeImportance,
            created: new Date()
        };
        
        // Add to roles map
        this.roleDefinitions.set(roleName, role);
        
        // Save to file
        await this._saveRoleDefinitions();
        
        this.emit('attributeManager:role_created', {
            roleName,
            timestamp: new Date()
        });
        
        return role;
    }
    
    /**
     * Load an agent's attribute profile
     * @param {string} agentId - ID of the agent
     */
    async loadAttributeProfile(agentId) {
        try {
            const profilePath = path.join(this.config.attributeProfilesPath, `${agentId}.json`);
            const data = await fs.readFile(profilePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }
    
    // Private methods
    
    /**
     * Ensure necessary directories exist
     */
    async _ensureDirectories() {
        const dirs = [
            this.config.attributeTemplatesPath,
            this.config.roleDefinitionsPath,
            this.config.attributeProfilesPath
        ];
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                // Directory exists, continue
            }
        }
    }
    
    /**
     * Load attribute definitions
     */
    async _loadAttributeDefinitions() {
        try {
            const definitionsPath = path.join(this.config.attributeTemplatesPath, 'definitions.json');
            
            // Check if file exists
            try {
                await fs.access(definitionsPath);
            } catch (error) {
                // Create default definitions
                await this._createDefaultDefinitions();
            }
            
            // Load definitions
            const data = await fs.readFile(definitionsPath, 'utf8');
            this.attributeDefinitions = JSON.parse(data);
            
            this.emit('attributeManager:definitions_loaded', {
                categories: Object.keys(this.attributeDefinitions),
                timestamp: new Date()
            });
        } catch (error) {
            throw new Error(`Failed to load attribute definitions: ${error.message}`);
        }
    }
    
    /**
     * Create default attribute definitions
     */
    async _createDefaultDefinitions() {
        // Create comprehensive attribute definitions
        const definitions = {
            corePersonality: {
                openness: {
                    name: "Openness to Experience",
                    description: "Tendency to appreciate new ideas, imagination, and curiosity",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "corePersonality"
                },
                conscientiousness: {
                    name: "Conscientiousness",
                    description: "Tendency to be organized, disciplined, and achievement-oriented",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "corePersonality"
                },
                extraversion: {
                    name: "Extraversion",
                    description: "Tendency to seek stimulation in the company of others",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "corePersonality"
                },
                agreeableness: {
                    name: "Agreeableness",
                    description: "Tendency to be compassionate and cooperative rather than suspicious",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "corePersonality"
                },
                neuroticism: {
                    name: "Neuroticism",
                    description: "Tendency to experience negative emotions easily",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "corePersonality"
                }
            },
            cognitiveAbilities: {
                analyticalIntelligence: {
                    name: "Analytical Intelligence",
                    description: "Ability to analyze problems, identify patterns, and apply logic",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "cognitiveAbilities"
                },
                creativeIntelligence: {
                    name: "Creative Intelligence",
                    description: "Ability to generate novel and valuable ideas",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "cognitiveAbilities"
                },
                practicalIntelligence: {
                    name: "Practical Intelligence",
                    description: "Ability to solve real-world problems with available resources",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "cognitiveAbilities"
                },
                emotionalIntelligence: {
                    name: "Emotional Intelligence",
                    description: "Ability to perceive, understand, and manage emotions",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "cognitiveAbilities"
                }
            },
            valueSystems: {
                selfDirection: {
                    name: "Self-Direction",
                    description: "Value of independent thought and action",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "valueSystems"
                },
                stimulation: {
                    name: "Stimulation",
                    description: "Value of excitement, novelty, and challenge in life",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "valueSystems"
                },
                hedonism: {
                    name: "Hedonism",
                    description: "Value of pleasure and sensuous gratification",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "valueSystems"
                },
                achievement: {
                    name: "Achievement",
                    description: "Value of personal success through competence",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "valueSystems"
                },
                power: {
                    name: "Power",
                    description: "Value of social status, prestige, and control",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "valueSystems"
                },
                security: {
                    name: "Security",
                    description: "Value of safety, harmony, and stability",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "valueSystems"
                },
                conformity: {
                    name: "Conformity",
                    description: "Value of restraint of actions likely to upset others",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "valueSystems"
                },
                tradition: {
                    name: "Tradition",
                    description: "Value of respect for cultural traditions and customs",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "valueSystems"
                },
                benevolence: {
                    name: "Benevolence",
                    description: "Value of preserving and enhancing the welfare of others",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "valueSystems"
                },
                universalism: {
                    name: "Universalism",
                    description: "Value of understanding, appreciation, and protection for all people",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "valueSystems"
                }
            },
            behavioralTendencies: {
                assertiveness: {
                    name: "Assertiveness",
                    description: "Tendency to express oneself confidently and stand up for one's views",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "behavioralTendencies"
                },
                riskTaking: {
                    name: "Risk-taking",
                    description: "Tendency to engage in potentially rewarding activities despite uncertainty",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "behavioralTendencies"
                },
                adaptability: {
                    name: "Adaptability",
                    description: "Ability to adjust to new conditions or circumstances",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "behavioralTendencies"
                },
                empathy: {
                    name: "Empathy",
                    description: "Ability to understand and share the feelings of others",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "behavioralTendencies"
                },
                decisionSpeed: {
                    name: "Decision-making Speed",
                    description: "Speed at which decisions are made",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "behavioralTendencies"
                }
            },
            socialDynamics: {
                leadershipPotential: {
                    name: "Leadership Potential",
                    description: "Capacity to lead and influence others",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "socialDynamics"
                },
                teamworkAbility: {
                    name: "Teamwork Ability",
                    description: "Capacity to collaborate effectively with others",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "socialDynamics"
                },
                conflictResolution: {
                    name: "Conflict Resolution",
                    description: "Ability to handle and resolve disagreements constructively",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "socialDynamics"
                },
                persuasiveness: {
                    name: "Persuasiveness",
                    description: "Ability to convince others to adopt a perspective or course of action",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "socialDynamics"
                }
            },
            ethicalFramework: {
                careHarm: {
                    name: "Care/Harm",
                    description: "Concern for the suffering of others and desire to protect them",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "ethicalFramework"
                },
                fairnessCheating: {
                    name: "Fairness/Cheating",
                    description: "Concern for proportional treatment and justice",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "ethicalFramework"
                },
                loyaltyBetrayal: {
                    name: "Loyalty/Betrayal",
                    description: "Concern for obligations of group membership and unity",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "ethicalFramework"
                },
                authoritySubversion: {
                    name: "Authority/Subversion",
                    description: "Concern for social order and respect for traditions",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "ethicalFramework"
                },
                sanctityDegradation: {
                    name: "Sanctity/Degradation",
                    description: "Concern for purity, disgust, and contamination",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "ethicalFramework"
                },
                libertyOppression: {
                    name: "Liberty/Oppression",
                    description: "Concern for freedom and resistance to domination",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "ethicalFramework"
                }
            },
            stressResponse: {
                stressTolerance: {
                    name: "Stress Tolerance",
                    description: "Ability to function effectively under pressure",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "stressResponse"
                },
                copingMechanisms: {
                    name: "Coping Mechanisms",
                    description: "Strategies used to manage stress and difficult situations",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "stressResponse"
                }
            },
            goalOrientation: {
                shortTermFocus: {
                    name: "Short-term Goal Focus",
                    description: "Emphasis on immediate objectives and tasks",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "goalOrientation"
                },
                longTermFocus: {
                    name: "Long-term Goal Focus",
                    description: "Emphasis on distant future objectives and planning",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "goalOrientation"
                },
                achievementDrive: {
                    name: "Achievement Drive",
                    description: "Motivation to accomplish challenging tasks and surpass standards",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "goalOrientation"
                }
            },
            adaptiveLearning: {
                learningSpeed: {
                    name: "Learning Speed",
                    description: "Rate at which new information and skills are acquired",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "adaptiveLearning"
                },
                memoryRetention: {
                    name: "Memory Retention",
                    description: "Ability to store and recall information over time",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "adaptiveLearning"
                },
                skillAcquisitionRate: {
                    name: "Skill Acquisition Rate",
                    description: "Speed at which new abilities are developed and refined",
                    min: 0,
                    max: 100,
                    default: 50,
                    category: "adaptiveLearning"
                }
            }
        };
        
        // Save to file
        const definitionsPath = path.join(this.config.attributeTemplatesPath, 'definitions.json');
        await fs.writeFile(definitionsPath, JSON.stringify(definitions, null, 2));
        
        return definitions;
    }
    
    /**
     * Load attribute templates
     */
    async _loadAttributeTemplates() {
        try {
            const templatesPath = path.join(this.config.attributeTemplatesPath, 'templates.json');
            
            // Check if file exists
            try {
                await fs.access(templatesPath);
            } catch (error) {
                // Create default templates
                await this._createDefaultTemplates();
            }
            
            // Load templates
            const data = await fs.readFile(templatesPath, 'utf8');
            const templates = JSON.parse(data);
            
            // Store templates
            this.attributeTemplates.clear();
            for (const [name, template] of Object.entries(templates)) {
                this.attributeTemplates.set(name, template);
            }
            
            this.emit('attributeManager:templates_loaded', {
                count: this.attributeTemplates.size,
                templates: Array.from(this.attributeTemplates.keys()),
                timestamp: new Date()
            });
        } catch (error) {
            throw new Error(`Failed to load attribute templates: ${error.message}`);
        }
    }
    
    /**
     * Create default attribute templates
     */
    async _createDefaultTemplates() {
        // Create default balanced template
        const balanced = {
            name: "Balanced",
            description: "Evenly distributed attributes for general-purpose agents",
            attributes: this._createBalancedAttributes(),
            created: new Date()
        };
        
        // Create business consultant template
        const businessConsultant = {
            name: "Business Consultant",
            description: "Optimized for business strategy and consulting roles",
            attributes: {
                corePersonality: {
                    openness: 65,
                    conscientiousness: 85,
                    extraversion: 70,
                    agreeableness: 60,
                    neuroticism: 30
                },
                cognitiveAbilities: {
                    analyticalIntelligence: 85,
                    creativeIntelligence: 70,
                    practicalIntelligence: 80,
                    emotionalIntelligence: 75
                },
                valueSystems: {
                    selfDirection: 75,
                    stimulation: 60,
                    hedonism: 40,
                    achievement: 85,
                    power: 70,
                    security: 65,
                    conformity: 55,
                    tradition: 50,
                    benevolence: 65,
                    universalism: 60
                },
                // Additional attribute categories...
            },
            created: new Date()
        };
        
        // Create creative designer template
        const creativeDesigner = {
            name: "Creative Designer",
            description: "Optimized for creative design and artistic roles",
            attributes: {
                corePersonality: {
                    openness: 90,
                    conscientiousness: 65,
                    extraversion: 60,
                    agreeableness: 70,
                    neuroticism: 45
                },
                cognitiveAbilities: {
                    analyticalIntelligence: 65,
                    creativeIntelligence: 90,
                    practicalIntelligence: 75,
                    emotionalIntelligence: 70
                },
                valueSystems: {
                    selfDirection: 85,
                    stimulation: 80,
                    hedonism: 70,
                    achievement: 75,
                    power: 50,
                    security: 45,
                    conformity: 35,
                    tradition: 40,
                    benevolence: 70,
                    universalism: 75
                },
                // Additional attribute categories...
            },
            created: new Date()
        };
        
        // Combine templates
        const templates = {
            balanced,
            businessConsultant,
            creativeDesigner
        };
        
        // Save to file
        const templatesPath = path.join(this.config.attributeTemplatesPath, 'templates.json');
        await fs.writeFile(templatesPath, JSON.stringify(templates, null, 2));
        
        return templates;
    }
    
    /**
     * Load role definitions
     */
    async _loadRoleDefinitions() {
        try {
            const rolesPath = path.join(this.config.roleDefinitionsPath, 'roles.json');
            
            // Check if file exists
            try {
                await fs.access(rolesPath);
            } catch (error) {
                // Create default roles
                await this._createDefaultRoles();
            }
            
            // Load roles
            const data = await fs.readFile(rolesPath, 'utf8');
            const roles = JSON.parse(data);
            
            // Store roles
            this.roleDefinitions.clear();
            for (const [name, role] of Object.entries(roles)) {
                this.roleDefinitions.set(name, role);
            }
            
            this.emit('attributeManager:roles_loaded', {
                count: this.roleDefinitions.size,
                roles: Array.from(this.roleDefinitions.keys()),
                timestamp: new Date()
            });
        } catch (error) {
            throw new Error(`Failed to load role definitions: ${error.message}`);
        }
    }
    
    /**
     * Create default role definitions
     */
    async _createDefaultRoles() {
        // Create business consultant role
        const businessConsultant = {
            name: "Business Consultant",
            description: "Agent specializing in business strategy and consulting",
            attributeImportance: {
                "corePersonality.conscientiousness": 0.9,
                "corePersonality.openness": 0.7,
                "corePersonality.extraversion": 0.7,
                "corePersonality.neuroticism": -0.7,
                "cognitiveAbilities.analyticalIntelligence": 0.9,
                "cognitiveAbilities.practicalIntelligence": 0.8,
                "cognitiveAbilities.emotionalIntelligence": 0.7,
                "valueSystems.achievement": 0.8,
                "valueSystems.power": 0.6,
                "behavioralTendencies.assertiveness": 0.8,
                "behavioralTendencies.adaptability": 0.7,
                "socialDynamics.persuasiveness": 0.8,
                "socialDynamics.leadershipPotential": 0.7,
                "ethicalFramework.fairnessCheating": 0.8,
                "goalOrientation.achievementDrive": 0.9,
                "goalOrientation.longTermFocus": 0.8
            },
            created: new Date()
        };
        
        // Create creative designer role
        const creativeDesigner = {
            name: "Creative Designer",
            description: "Agent specializing in creative design and artistic work",
            attributeImportance: {
                "corePersonality.openness": 0.9,
                "corePersonality.conscientiousness": 0.6,
                "cognitiveAbilities.creativeIntelligence": 0.9,
                "cognitiveAbilities.practicalIntelligence": 0.7,
                "valueSystems.selfDirection": 0.8,
                "valueSystems.stimulation": 0.8,
                "valueSystems.hedonism": 0.7,
                "behavioralTendencies.riskTaking": 0.7,
                "behavioralTendencies.adaptability": 0.8,
                "socialDynamics.teamworkAbility": 0.7,
                "ethicalFramework.libertyOppression": 0.7,
                "goalOrientation.achievementDrive": 0.7,
                "adaptiveLearning.learningSpeed": 0.7,
                "adaptiveLearning.skillAcquisitionRate": 0.8
            },
            created: new Date()
        };
        
        // Create technical expert role
        const technicalExpert = {
            name: "Technical Expert",
            description: "Agent specializing in technical domains and problem-solving",
            attributeImportance: {
                "corePersonality.conscientiousness": 0.8,
                "corePersonality.openness": 0.7,
                "corePersonality.neuroticism": -0.8,
                "cognitiveAbilities.analyticalIntelligence": 0.9,
                "cognitiveAbilities.practicalIntelligence": 0.8,
                "valueSystems.achievement": 0.7,
                "valueSystems.selfDirection": 0.7,
                "behavioralTendencies.adaptability": 0.7,
                "behavioralTendencies.decisionSpeed": 0.7,
                "socialDynamics.teamworkAbility": 0.6,
                "ethicalFramework.fairnessCheating": 0.7,
                "goalOrientation.shortTermFocus": 0.7,
                "goalOrientation.longTermFocus": 0.7,
                "adaptiveLearning.learningSpeed": 0.8,
                "adaptiveLearning.memoryRetention": 0.8
            },
            created: new Date()
        };
        
        // Combine roles
        const roles = {
            businessConsultant,
            creativeDesigner,
            technicalExpert
        };
        
        // Save to file
        const rolesPath = path.join(this.config.roleDefinitionsPath, 'roles.json');
        await fs.writeFile(rolesPath, JSON.stringify(roles, null, 2));
        
        return roles;
    }
    
    /**
     * Save attribute templates to file
     */
    async _saveAttributeTemplates() {
        const templates = {};
        for (const [name, template] of this.attributeTemplates.entries()) {
            templates[name] = template;
        }
        
        const templatesPath = path.join(this.config.attributeTemplatesPath, 'templates.json');
        await fs.writeFile(templatesPath, JSON.stringify(templates, null, 2));
    }
    
    /**
     * Save role definitions to file
     */
    async _saveRoleDefinitions() {
        const roles = {};
        for (const [name, role] of this.roleDefinitions.entries()) {
            roles[name] = role;
        }
        
        const rolesPath = path.join(this.config.roleDefinitionsPath, 'roles.json');
        await fs.writeFile(rolesPath, JSON.stringify(roles, null, 2));
    }
    
    /**
     * Save an attribute profile for an agent
     * @param {string} agentId - ID of the agent
     * @param {Object} attributes - Attribute configuration
     */
    async _saveAttributeProfile(agentId, attributes) {
        const profilePath = path.join(this.config.attributeProfilesPath, `${agentId}.json`);
        const profile = {
            agentId,
            attributes,
            created: new Date(),
            updated: new Date()
        };
        
        await fs.writeFile(profilePath, JSON.stringify(profile, null, 2));
    }
    
    /**
     * Validate attribute configuration
     * @param {Object} attributes - Attribute configuration to validate
     */
    _validateAttributes(attributes) {
        const errors = [];
        
        // Check if attributes is an object
        if (typeof attributes !== 'object' || attributes === null) {
            return { valid: false, errors: ['Attributes must be an object'] };
        }
        
        // Check each category
        for (const category in attributes) {
            if (!this.attributeDefinitions[category]) {
                errors.push(`Unknown attribute category: ${category}`);
                continue;
            }
            
            const categoryAttributes = attributes[category];
            
            // Check if category attributes is an object
            if (typeof categoryAttributes !== 'object' || categoryAttributes === null) {
                errors.push(`Attribute category ${category} must be an object`);
                continue;
            }
            
            // Check each attribute in the category
            for (const attribute in categoryAttributes) {
                const definition = this.attributeDefinitions[category][attribute];
                
                if (!definition) {
                    errors.push(`Unknown attribute: ${category}.${attribute}`);
                    continue;
                }
                
                const value = categoryAttributes[attribute];
                
                // Check if value is a number
                if (typeof value !== 'number') {
                    errors.push(`Attribute ${category}.${attribute} must be a number`);
                    continue;
                }
                
                // Check if value is within range
                if (value < definition.min || value > definition.max) {
                    errors.push(`Attribute ${category}.${attribute} must be between ${definition.min} and ${definition.max}`);
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Normalize attribute values (ensure all required attributes are present with at least default values)
     * @param {Object} attributes - Attribute configuration to normalize
     */
    _normalizeAttributes(attributes) {
        const normalized = { ...attributes };
        
        // Ensure all categories are present
        for (const category in this.attributeDefinitions) {
            if (!normalized[category]) {
                normalized[category] = {};
            }
            
            // Ensure all attributes in the category are present
            for (const attribute in this.attributeDefinitions[category]) {
                if (normalized[category][attribute] === undefined) {
                    normalized[category][attribute] = this.attributeDefinitions[category][attribute].default;
                }
            }
        }
        
        return normalized;
    }
    
    /**
     * Create a balanced attribute configuration with all attributes at 50
     */
    _createBalancedAttributes() {
        const balanced = {};
        
        for (const category in this.attributeDefinitions) {
            balanced[category] = {};
            
            for (const attribute in this.attributeDefinitions[category]) {
                balanced[category][attribute] = 50; // Default balanced value
            }
        }
        
        return balanced;
    }
    
    /**
     * Apply role-specific optimizations to attributes
     * @param {Object} attributes - Base attribute configuration
     * @param {Object} attributeImportance - Weighted importance of attributes for the role
     */
    _applyRoleOptimizations(attributes, attributeImportance) {
        const optimized = this._normalizeAttributes(attributes);
        
        // Apply role-specific adjustments
        for (const attributePath in attributeImportance) {
            const [category, attribute] = attributePath.split('.');
            const importance = attributeImportance[attributePath];
            
            if (!optimized[category] || !this.attributeDefinitions[category][attribute]) {
                continue;
            }
            
            // Calculate adjustment (positive importance increases value, negative decreases)
            const baseValue = optimized[category][attribute];
            const adjustment = importance * 25; // Max adjustment of ±25 points
            
            // Apply adjustment, clamping to valid range
            const min = this.attributeDefinitions[category][attribute].min;
            const max = this.attributeDefinitions[category][attribute].max;
            optimized[category][attribute] = Math.max(min, Math.min(max, baseValue + adjustment));
        }
        
        return optimized;
    }
}

module.exports = AttributeManager; 