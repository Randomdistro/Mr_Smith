/**
 * create_business_agent.js - Smith Demonstration Script
 * 
 * This script demonstrates how to use The Smith to create a humanized
 * business agent and leverage its capabilities
 */

const path = require('path');
const Smith = require('../Smith');
const HumanizationEngine = require('../tools/HumanizationEngine');

async function main() {
    console.log('\n========================================');
    console.log('   SMITH AGENT CREATION DEMONSTRATION   ');
    console.log('========================================\n');
    
    try {
        // Initialize Smith
        console.log('Initializing Smith...');
        const smith = new Smith({
            // Configure directory paths relative to this file
            agentTemplatesPath: path.join(__dirname, '../agents'),
            agentStoragePath: path.join(__dirname, '../storage')
        });
        
        await smith.initialize();
        console.log('Smith initialized successfully!');
        
        // Initialize Humanization Engine
        console.log('\nInitializing Humanization Engine...');
        const humanizationEngine = new HumanizationEngine({
            traitsDataPath: path.join(__dirname, '../data/humanization/traits.json'),
            personasPath: path.join(__dirname, '../data/humanization/personas.json'),
            expressionModelsPath: path.join(__dirname, '../data/humanization/expressions.json')
        });
        
        await humanizationEngine.initialize();
        console.log('Humanization Engine initialized successfully!');
        
        // Display available personas
        const personas = humanizationEngine.getAvailablePersonas();
        console.log('\nAvailable Personas:');
        personas.forEach(persona => {
            console.log(`- ${persona.name}: ${persona.description} (Category: ${persona.category})`);
        });
        
        // Display available traits
        const traits = humanizationEngine.getAvailableTraits();
        console.log('\nAvailable Personality Traits:');
        traits.forEach(trait => {
            console.log(`- ${trait.name}: ${trait.description} (Category: ${trait.category})`);
        });
        
        // Create a business agent
        console.log('\nCreating Business Agent...');
        const agentResult = await smith.createAgent({
            id: 'business_agent_1',
            type: 'BusinessAgent',
            parameters: {
                industry: 'Technology Consulting',
                seniorityLevel: 8,
                specializations: ['Digital Transformation', 'Cloud Migration', 'Process Optimization'],
                communicationPreferences: {
                    formality: 0.7,
                    detailLevel: 0.8,
                    persuasiveness: 0.6
                }
            },
            approved: true // Bypass Oracle approval for demonstration
        });
        
        console.log(`Business Agent created with ID: ${agentResult.agentId}`);
        
        // Retrieve the agent
        const agent = agentResult.agent;
        
        // Apply humanization
        console.log('\nHumanizing the Business Agent...');
        const humanizationResult = await humanizationEngine.humanizeAgent(agent, {
            personaType: 'business',
            traitNames: ['conscientiousness', 'confidence', 'agreeableness'],
            distinctiveness: 0.7,
            constraints: {
                ethicalBoundaries: 'strict',
                communicationLimits: 'professional'
            }
        });
        
        console.log('Agent humanized successfully!');
        console.log('Applied Persona:', humanizationResult.appliedPersona);
        console.log('Applied Traits:', humanizationResult.appliedTraits.join(', '));
        
        // Display agent information
        console.log('\nAgent Information:');
        const agentState = agent.getState();
        console.log(JSON.stringify(agentState, null, 2));
        
        // Demonstrate business agent capabilities
        
        // 1. Update a client
        console.log('\nAdding a sample client...');
        const clientData = {
            name: 'Quantum Innovations Inc.',
            industry: 'Artificial Intelligence',
            size: 'Enterprise',
            contact: 'Dr. Maya Patel',
            email: 'maya.patel@quantuminnovations.ai',
            phone: '555-867-5309',
            relationship: {
                status: 'Prospecting',
                startDate: new Date()
            }
        };
        
        const client = await agent.updateClient(clientData);
        console.log(`Client added with ID: ${client.id}`);
        
        // 2. Generate a proposal
        console.log('\nGenerating a business proposal...');
        const proposal = await agent.generateProposal({
            clientId: client.id,
            title: 'AI Implementation Strategy',
            challenges: 'legacy system integration and staff adoption',
            expectedOutcomes: 'increased operational efficiency and data-driven decision making',
            startDate: new Date()
        });
        
        console.log('Proposal generated successfully!');
        console.log('Proposal ID:', proposal.id);
        console.log('Proposal Title:', proposal.title);
        console.log('Summary:', proposal.summary);
        
        // 3. Generate a follow-up email
        console.log('\nGenerating a follow-up email...');
        const email = await agent.generateFollowUpEmail(client.id, {
            type: 'proposal',
            subject: 'Your Customized AI Implementation Strategy',
            topic: 'the AI implementation strategy we discussed',
            challenges: 'integrating AI with your existing systems'
        });
        
        console.log('Email generated successfully!');
        console.log('Subject:', email.subject);
        console.log('Content:', email.content);
        
        // 4. Analyze the client
        console.log('\nAnalyzing client data...');
        const analysis = await agent.analyzeClient(client.id, {
            focusAreas: ['opportunities', 'risks']
        });
        
        console.log('Client analysis complete!');
        console.log('Opportunity Areas:', JSON.stringify(analysis.opportunityAreas, null, 2));
        console.log('Risk Factors:', JSON.stringify(analysis.riskFactors, null, 2));
        console.log('Recommendations:', JSON.stringify(analysis.recommendations, null, 2));
        
        // Display humanization effectiveness
        console.log('\nAnalyzing humanization effectiveness...');
        const humanizationAnalysis = await humanizationEngine.analyzeHumanization(agent);
        console.log('Humanization Effectiveness:', humanizationAnalysis.effectiveness);
        console.log('Consistency Score:', humanizationAnalysis.consistencyScore);
        console.log('Naturalness:', humanizationAnalysis.naturalness);
        console.log('Recommendations:', humanizationAnalysis.recommendations.join('\n- '));
        
        // Clean up
        console.log('\nDemo complete! Shutting down agent...');
        await agent.shutdown();
        console.log('Agent shut down successfully.');
        
        console.log('\nShutting down Smith...');
        await smith.shutdown();
        console.log('Smith shut down successfully.');
        
        console.log('\n========================================');
        console.log('      DEMONSTRATION COMPLETE           ');
        console.log('========================================\n');
        
    } catch (error) {
        console.error('Error in demonstration:', error);
    }
}

// Run the demonstration
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 