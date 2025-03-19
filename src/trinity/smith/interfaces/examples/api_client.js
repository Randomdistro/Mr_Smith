/**
 * api_client.js - Mr. Smith API Client Example
 * 
 * This example demonstrates how to use the Mr. Smith API
 * to create and customize agents with the Behavioral Matrix Framework
 */

const axios = require('axios');

class SmithAPIClient {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || 'http://localhost:3000/api/smith';
        this.axios = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                ...config.headers
            },
            timeout: config.timeout || 10000
        });
    }
    
    /**
     * Check API health
     */
    async checkHealth() {
        const response = await this.axios.get('/health');
        return response.data;
    }
    
    /**
     * Create a new agent
     * @param {Object} params - Agent creation parameters
     */
    async createAgent(params) {
        const response = await this.axios.post('/agent', params);
        return response.data;
    }
    
    /**
     * Create an agent optimized for a specific role
     * @param {Object} params - Role-based agent creation parameters
     */
    async createAgentForRole(params) {
        const response = await this.axios.post('/agent/role', params);
        return response.data;
    }
    
    /**
     * Get an agent by ID
     * @param {string} agentId - ID of the agent
     */
    async getAgent(agentId) {
        const response = await this.axios.get(`/agent/${agentId}`);
        return response.data;
    }
    
    /**
     * Update agent attributes
     * @param {string} agentId - ID of the agent
     * @param {Object} attributes - New attributes to apply
     */
    async updateAgentAttributes(agentId, attributes) {
        const response = await this.axios.put(`/agent/${agentId}/attributes`, attributes);
        return response.data;
    }
    
    /**
     * Get attribute definitions
     */
    async getAttributes() {
        const response = await this.axios.get('/attributes');
        return response.data;
    }
    
    /**
     * Get attribute templates
     */
    async getTemplates() {
        const response = await this.axios.get('/templates');
        return response.data;
    }
    
    /**
     * Get role definitions
     */
    async getRoles() {
        const response = await this.axios.get('/roles');
        return response.data;
    }
    
    /**
     * Get optimized attributes for a role
     * @param {string} roleName - Name of the role
     */
    async getRoleAttributes(roleName) {
        const response = await this.axios.get(`/role/${roleName}/attributes`);
        return response.data;
    }
    
    /**
     * Analyze role requirements
     * @param {Object} roleRequirements - Requirements for the role
     */
    async analyzeRole(roleRequirements) {
        const response = await this.axios.post('/analyze', { roleRequirements });
        return response.data;
    }
}

/**
 * Example usage demonstration
 */
async function runExample() {
    try {
        console.log('=== Mr. Smith API Client Example ===\n');
        
        // Create API client
        const client = new SmithAPIClient();
        
        // Check API health
        console.log('Checking API health...');
        const health = await client.checkHealth();
        console.log('API Status:', health.status);
        console.log();
        
        // Get available attribute templates
        console.log('Getting attribute templates...');
        const templatesResponse = await client.getTemplates();
        const templates = templatesResponse.templates;
        console.log(`Found ${templates.length} templates:`);
        templates.forEach(template => {
            console.log(`- ${template.name}: ${template.description}`);
        });
        console.log();
        
        // Get available roles
        console.log('Getting role definitions...');
        const rolesResponse = await client.getRoles();
        const roles = rolesResponse.roles;
        console.log(`Found ${roles.length} roles:`);
        roles.forEach(role => {
            console.log(`- ${role.name}: ${role.description}`);
        });
        console.log();
        
        // Create a business consultant agent using a role
        console.log('Creating a Business Consultant agent...');
        const consultantResult = await client.createAgentForRole({
            type: 'BusinessAgent',
            parameters: {
                industry: 'Technology Consulting',
                seniorityLevel: 8,
                specializations: ['Digital Transformation', 'Cloud Migration']
            },
            role: 'businessConsultant'
        });
        
        if (consultantResult.status === 'success') {
            console.log(`Business Consultant agent created with ID: ${consultantResult.agentId}`);
            
            // Get agent details
            const agentDetails = await client.getAgent(consultantResult.agentId);
            console.log('\nAgent Details:');
            console.log(`- Type: ${agentDetails.agent.type}`);
            console.log(`- State: ${agentDetails.agent.state.mode}`);
            console.log('- Core Personality Attributes:');
            const personality = agentDetails.agent.attributes.corePersonality;
            Object.keys(personality).forEach(trait => {
                console.log(`  - ${trait}: ${personality[trait]}`);
            });
            
            // Update some attributes
            console.log('\nUpdating agent attributes...');
            const updateResult = await client.updateAgentAttributes(consultantResult.agentId, {
                corePersonality: {
                    extraversion: 80, // Increase extraversion
                    openness: 75     // Increase openness
                },
                valueSystems: {
                    achievement: 90,  // Increase achievement drive
                    power: 60         // Decrease power orientation
                }
            });
            
            console.log('Attributes updated successfully!');
            
            // Get updated agent details
            const updatedDetails = await client.getAgent(consultantResult.agentId);
            console.log('\nUpdated Core Personality Attributes:');
            const updatedPersonality = updatedDetails.agent.attributes.corePersonality;
            Object.keys(updatedPersonality).forEach(trait => {
                console.log(`  - ${trait}: ${updatedPersonality[trait]}`);
            });
        }
        
        // Create a creative designer agent from scratch
        console.log('\nCreating a Creative Designer agent with custom attributes...');
        const designerResult = await client.createAgent({
            type: 'BusinessAgent', // Using BusinessAgent for demo purposes
            parameters: {
                industry: 'Digital Design',
                seniorityLevel: 7,
                specializations: ['UI/UX Design', 'Brand Identity']
            },
            attributes: {
                corePersonality: {
                    openness: 90,
                    conscientiousness: 65,
                    extraversion: 70,
                    agreeableness: 75,
                    neuroticism: 40
                },
                cognitiveAbilities: {
                    analyticalIntelligence: 70,
                    creativeIntelligence: 95,
                    practicalIntelligence: 75,
                    emotionalIntelligence: 80
                },
                valueSystems: {
                    selfDirection: 85,
                    stimulation: 80,
                    achievement: 75
                }
                // Other attribute categories would be filled with defaults
            }
        });
        
        if (designerResult.status === 'success') {
            console.log(`Creative Designer agent created with ID: ${designerResult.agentId}`);
        }
        
        // Analyze a custom role requirement
        console.log('\nAnalyzing custom role requirements...');
        const analysisResult = await client.analyzeRole({
            title: 'Sales Specialist',
            description: 'Looking for a highly persuasive agent with strong interpersonal skills',
            keywords: ['sales', 'persuasion', 'communication', 'relationship building'],
            priorities: ['customer engagement', 'closing deals', 'follow-up']
        });
        
        console.log(`Analysis matched role: ${analysisResult.matchedRole} (confidence: ${analysisResult.confidence.toFixed(2)})`);
        console.log('Suggested Core Personality Attributes:');
        const suggestedPersonality = analysisResult.suggestedAttributes.corePersonality;
        Object.keys(suggestedPersonality).forEach(trait => {
            console.log(`  - ${trait}: ${suggestedPersonality[trait]}`);
        });
        
        console.log('\n=== Example Complete ===');
    } catch (error) {
        console.error('Error in example:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
    }
}

// Run the example when this script is executed directly
if (require.main === module) {
    runExample().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = {
    SmithAPIClient,
    runExample
}; 