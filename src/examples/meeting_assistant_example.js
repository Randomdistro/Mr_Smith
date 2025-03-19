/**
 * Example script demonstrating the use of the Meeting Preparation Assistant
 * 
 * This script shows how to generate meeting briefs, talking points, and record meeting outcomes
 * using the Meeting Preparation Assistant tool.
 */

const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');
const MeetingAssistant = require('../tools/contact-management/meeting_assistant');
const Logger = require('../utils/logger');

// Initialize logger
const logger = new Logger({
    logFile: path.join(__dirname, '../../logs/meeting-assistant.log'),
    console: true
});

// Initialize the meeting assistant
const meetingAssistant = new MeetingAssistant(logger);

// Sample client IDs
const sampleClientIds = ['client001', 'client002', 'client003'];

/**
 * Create sample client data for testing
 * @param {string} dataDirectory - Directory to store client data
 * @returns {Promise<Array<string>>} - Array of created client IDs
 */
async function createSampleClientData(dataDirectory) {
    logger.info('Creating sample client data');
    
    try {
        // Ensure the client directory exists
        const clientsDir = path.join(dataDirectory, 'clients');
        await fs.ensureDir(clientsDir);
        
        const createdClients = [];
        
        for (const clientId of sampleClientIds) {
            const clientDir = path.join(clientsDir, clientId);
            await fs.ensureDir(clientDir);
            
            // Create client profile
            await createClientProfile(clientId, clientDir);
            
            // Create interaction history
            await createInteractionHistory(clientId, clientDir);
            
            // Create opportunities
            await createOpportunities(clientId, clientDir);
            
            // Create notes
            await createNotes(clientId, clientDir);
            
            createdClients.push(clientId);
            logger.info(`Created sample data for client ${clientId}`);
        }
        
        return createdClients;
    } catch (error) {
        logger.error('Error creating sample client data:', error);
        throw error;
    }
}

/**
 * Create a profile spreadsheet for a client
 * @param {string} clientId - Client ID
 * @param {string} clientDir - Client directory
 * @returns {Promise<void>}
 */
async function createClientProfile(clientId, clientDir) {
    const ExcelJS = require('exceljs');
    
    // Sample client profiles
    const clientProfiles = {
        'client001': {
            businessName: 'TechInnovate Solutions',
            contactName: 'Alex Johnson',
            position: 'CTO',
            email: 'alex.johnson@techinnovate.com',
            phone: '+1 (555) 123-4567',
            industry: 'Software Development',
            size: 'Medium (100-500 employees)',
            location: 'San Francisco, CA',
            website: 'https://techinnovate.com',
            relationshipStarted: moment().subtract(6, 'months').toDate()
        },
        'client002': {
            businessName: 'Global Finance Group',
            contactName: 'Sarah Williams',
            position: 'VP of Operations',
            email: 'sarah.williams@globalfinance.com',
            phone: '+1 (555) 987-6543',
            industry: 'Financial Services',
            size: 'Large (1000+ employees)',
            location: 'New York, NY',
            website: 'https://globalfinance.com',
            relationshipStarted: moment().subtract(1, 'year').toDate()
        },
        'client003': {
            businessName: 'HealthPlus Medical',
            contactName: 'Michael Chen',
            position: 'Director of IT',
            email: 'michael.chen@healthplus.org',
            phone: '+1 (555) 456-7890',
            industry: 'Healthcare',
            size: 'Medium (100-500 employees)',
            location: 'Chicago, IL',
            website: 'https://healthplus.org',
            relationshipStarted: moment().subtract(3, 'months').toDate()
        }
    };
    
    // Create the profile spreadsheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Profile');
    
    // Add profile data
    const profile = clientProfiles[clientId];
    
    worksheet.getCell('A1').value = 'Field';
    worksheet.getCell('B1').value = 'Value';
    worksheet.getCell('A1').font = { bold: true };
    worksheet.getCell('B1').font = { bold: true };
    
    const fields = [
        { key: 'ID', value: clientId },
        { key: 'Business Name', value: profile.businessName },
        { key: 'Contact Name', value: profile.contactName },
        { key: 'Position', value: profile.position },
        { key: 'Email', value: profile.email },
        { key: 'Phone', value: profile.phone },
        { key: 'Industry', value: profile.industry },
        { key: 'Size', value: profile.size },
        { key: 'Location', value: profile.location },
        { key: 'Website', value: profile.website },
        { key: 'Relationship Started', value: profile.relationshipStarted }
    ];
    
    fields.forEach((field, index) => {
        worksheet.getCell(`A${index + 2}`).value = field.key;
        worksheet.getCell(`B${index + 2}`).value = field.value;
    });
    
    // Adjust column widths
    worksheet.getColumn('A').width = 20;
    worksheet.getColumn('B').width = 40;
    
    // Save the workbook
    const filePath = path.join(clientDir, 'profile.xlsx');
    await workbook.xlsx.writeFile(filePath);
}

/**
 * Create interaction history for a client
 * @param {string} clientId - Client ID
 * @param {string} clientDir - Client directory
 * @returns {Promise<void>}
 */
async function createInteractionHistory(clientId, clientDir) {
    const ExcelJS = require('exceljs');
    
    // Sample interaction data
    const interactionData = {
        'client001': [
            {
                date: moment().subtract(5, 'months').toDate(),
                type: 'Initial Meeting',
                summary: 'Discussed potential implementation of our solution',
                outcome: 'Positive',
                nextSteps: 'Send product information',
                agent: 'John Smith'
            },
            {
                date: moment().subtract(4, 'months').toDate(),
                type: 'Email',
                summary: 'Sent detailed product information and pricing',
                outcome: 'Information Delivered',
                nextSteps: 'Follow up in one week',
                agent: 'John Smith'
            },
            {
                date: moment().subtract(3, 'months').toDate(),
                type: 'Phone Call',
                summary: 'Discussed implementation timeline and requirements',
                outcome: 'Positive',
                nextSteps: 'Schedule technical assessment',
                agent: 'John Smith'
            },
            {
                date: moment().subtract(2, 'months').toDate(),
                type: 'Technical Assessment',
                summary: 'Conducted technical review of current systems',
                outcome: 'Completed',
                nextSteps: 'Prepare proposal',
                agent: 'Maria Rodriguez'
            },
            {
                date: moment().subtract(1, 'month').toDate(),
                type: 'Proposal Meeting',
                summary: 'Presented full implementation proposal',
                outcome: 'Considering Options',
                nextSteps: 'Decision expected in 2 weeks',
                agent: 'John Smith'
            }
        ],
        'client002': [
            {
                date: moment().subtract(11, 'months').toDate(),
                type: 'Initial Meeting',
                summary: 'Introduced our services and capabilities',
                outcome: 'Interested',
                nextSteps: 'Schedule follow-up with department heads',
                agent: 'Emily Taylor'
            },
            {
                date: moment().subtract(9, 'months').toDate(),
                type: 'Department Meeting',
                summary: 'Met with operations and IT teams',
                outcome: 'Positive',
                nextSteps: 'Prepare initial assessment',
                agent: 'Emily Taylor'
            },
            {
                date: moment().subtract(6, 'months').toDate(),
                type: 'Assessment Review',
                summary: 'Reviewed assessment findings and recommendations',
                outcome: 'Approved Phase 1',
                nextSteps: 'Begin implementation planning',
                agent: 'Emily Taylor'
            },
            {
                date: moment().subtract(3, 'months').toDate(),
                type: 'Implementation Kickoff',
                summary: 'Started phase 1 implementation',
                outcome: 'In Progress',
                nextSteps: 'Weekly status updates',
                agent: 'David Wilson'
            },
            {
                date: moment().subtract(1, 'week').toDate(),
                type: 'Status Review',
                summary: 'Reviewed implementation progress',
                outcome: 'On Track',
                nextSteps: 'Prepare for phase 1 completion',
                agent: 'David Wilson'
            }
        ],
        'client003': [
            {
                date: moment().subtract(3, 'months').toDate(),
                type: 'Initial Meeting',
                summary: 'Discussed healthcare compliance requirements and solutions',
                outcome: 'Interested',
                nextSteps: 'Prepare compliance assessment',
                agent: 'Sarah Johnson'
            },
            {
                date: moment().subtract(2, 'months').toDate(),
                type: 'Assessment Presentation',
                summary: 'Presented compliance gaps and recommendations',
                outcome: 'Concerned about timeline',
                nextSteps: 'Revise proposal with extended timeline',
                agent: 'Sarah Johnson'
            },
            {
                date: moment().subtract(1, 'month').toDate(),
                type: 'Revised Proposal',
                summary: 'Presented revised implementation approach',
                outcome: 'Better Reception',
                nextSteps: 'Await budget approval',
                agent: 'Sarah Johnson'
            },
            {
                date: moment().subtract(1, 'week').toDate(),
                type: 'Email Update',
                summary: 'Client informed us budget is approved',
                outcome: 'Ready to Proceed',
                nextSteps: 'Schedule kickoff meeting',
                agent: 'Sarah Johnson'
            }
        ]
    };
    
    // Create the interactions spreadsheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Interactions');
    
    // Add headers
    worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Type', key: 'type', width: 20 },
        { header: 'Summary', key: 'summary', width: 40 },
        { header: 'Outcome', key: 'outcome', width: 20 },
        { header: 'Next Steps', key: 'nextSteps', width: 30 },
        { header: 'Agent', key: 'agent', width: 20 }
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    
    // Add interaction data
    interactionData[clientId].forEach(interaction => {
        worksheet.addRow(interaction);
    });
    
    // Save the workbook
    const filePath = path.join(clientDir, 'interactions.xlsx');
    await workbook.xlsx.writeFile(filePath);
}

/**
 * Create opportunities for a client
 * @param {string} clientId - Client ID
 * @param {string} clientDir - Client directory
 * @returns {Promise<void>}
 */
async function createOpportunities(clientId, clientDir) {
    const ExcelJS = require('exceljs');
    
    // Sample opportunity data
    const opportunityData = {
        'client001': [
            {
                id: 'OPP001',
                name: 'Enterprise Implementation',
                value: 150000,
                stage: 'Proposal',
                probability: 60,
                expectedCloseDate: moment().add(1, 'month').toDate(),
                products: 'Software Platform, API Integration',
                services: 'Implementation, Training',
                notes: 'Decision committee meeting scheduled next week'
            }
        ],
        'client002': [
            {
                id: 'OPP002',
                name: 'Phase 2 Expansion',
                value: 200000,
                stage: 'Discovery',
                probability: 40,
                expectedCloseDate: moment().add(3, 'months').toDate(),
                products: 'Data Analysis Module, Reporting Suite',
                services: 'Custom Development, Integration',
                notes: 'Depends on successful completion of Phase 1'
            },
            {
                id: 'OPP003',
                name: 'Mobile Application',
                value: 75000,
                stage: 'Initial Interest',
                probability: 20,
                expectedCloseDate: moment().add(6, 'months').toDate(),
                products: 'Mobile SDK, Authentication Module',
                services: 'App Development, UX Design',
                notes: 'Early discussions, budget not yet allocated'
            }
        ],
        'client003': [
            {
                id: 'OPP004',
                name: 'Compliance System Implementation',
                value: 120000,
                stage: 'Contract',
                probability: 90,
                expectedCloseDate: moment().add(2, 'weeks').toDate(),
                products: 'Compliance Platform, Audit Tools',
                services: 'Implementation, Staff Training, Documentation',
                notes: 'Contract in legal review, expected to sign soon'
            }
        ]
    };
    
    // Create the opportunities spreadsheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Opportunities');
    
    // Add headers
    worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Value', key: 'value', width: 15 },
        { header: 'Stage', key: 'stage', width: 15 },
        { header: 'Probability', key: 'probability', width: 15 },
        { header: 'Expected Close Date', key: 'expectedCloseDate', width: 20 },
        { header: 'Products', key: 'products', width: 30 },
        { header: 'Services', key: 'services', width: 30 },
        { header: 'Notes', key: 'notes', width: 40 }
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    
    // Add opportunity data
    if (opportunityData[clientId]) {
        opportunityData[clientId].forEach(opportunity => {
            worksheet.addRow(opportunity);
        });
    }
    
    // Save the workbook
    const filePath = path.join(clientDir, 'opportunities.xlsx');
    await workbook.xlsx.writeFile(filePath);
}

/**
 * Create notes for a client
 * @param {string} clientId - Client ID
 * @param {string} clientDir - Client directory
 * @returns {Promise<void>}
 */
async function createNotes(clientId, clientDir) {
    const ExcelJS = require('exceljs');
    
    // Sample notes data
    const notesData = {
        'client001': [
            {
                date: moment().subtract(5, 'months').toDate(),
                author: 'John Smith',
                category: 'General',
                content: 'Initial meeting went well. Client expressed concerns about implementation timeline.'
            },
            {
                date: moment().subtract(3, 'months').toDate(),
                author: 'Maria Rodriguez',
                category: 'Technical',
                content: 'Client system uses outdated API version. Will require additional integration work.'
            },
            {
                date: moment().subtract(1, 'month').toDate(),
                author: 'John Smith',
                category: 'Sales',
                content: 'Budget constraints may limit initial scope. Consider phased approach.'
            }
        ],
        'client002': [
            {
                date: moment().subtract(11, 'months').toDate(),
                author: 'Emily Taylor',
                category: 'General',
                content: 'Client recently underwent restructuring. New IT director is more open to our solution.'
            },
            {
                date: moment().subtract(6, 'months').toDate(),
                author: 'Emily Taylor',
                category: 'Sales',
                content: 'Procurement requires three vendor quotes. We need to emphasize our unique capabilities.'
            },
            {
                date: moment().subtract(2, 'months').toDate(),
                author: 'David Wilson',
                category: 'Technical',
                content: 'Legacy system integration will require custom connectors. Added to implementation plan.'
            }
        ],
        'client003': [
            {
                date: moment().subtract(3, 'months').toDate(),
                author: 'Sarah Johnson',
                category: 'Compliance',
                content: 'Client must meet HIPAA requirements by end of fiscal year. Critical priority.'
            },
            {
                date: moment().subtract(2, 'months').toDate(),
                author: 'Sarah Johnson',
                category: 'General',
                content: 'IT team is understaffed. We should plan for more hands-on support during implementation.'
            },
            {
                date: moment().subtract(1, 'week').toDate(),
                author: 'Sarah Johnson',
                category: 'Sales',
                content: 'Budget approval received! Implementation can start next month.'
            }
        ]
    };
    
    // Create the notes spreadsheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Notes');
    
    // Add headers
    worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Author', key: 'author', width: 20 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Content', key: 'content', width: 60 }
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    
    // Add notes data
    if (notesData[clientId]) {
        notesData[clientId].forEach(note => {
            worksheet.addRow(note);
        });
    }
    
    // Save the workbook
    const filePath = path.join(clientDir, 'notes.xlsx');
    await workbook.xlsx.writeFile(filePath);
}

/**
 * Generate a meeting brief for a client
 * @param {string} clientId - Client ID
 * @param {string} dataDirectory - Data directory
 * @returns {Promise<object>} - Generated brief details
 */
async function generateMeetingBrief(clientId, dataDirectory) {
    logger.info(`Generating meeting brief for client ${clientId}`);
    
    try {
        // Determine meeting type based on client ID
        let meetingType;
        if (clientId === 'client001') {
            meetingType = 'proposal';
        } else if (clientId === 'client002') {
            meetingType = 'status-review';
        } else {
            meetingType = 'kick-off';
        }
        
        // Schedule meeting date (future date)
        const meetingDate = moment().add(5, 'days').hour(10).minute(0).second(0).toDate();
        
        // Generate the brief
        const briefResult = await meetingAssistant.generateMeetingBrief(
            clientId,
            meetingType,
            meetingDate,
            dataDirectory
        );
        
        logger.info(`Meeting brief generated successfully and saved to: ${briefResult.savedPath}`);
        return briefResult;
    } catch (error) {
        logger.error(`Error generating meeting brief for client ${clientId}:`, error);
        throw error;
    }
}

/**
 * Generate talking points for a specific topic
 * @param {string} clientId - Client ID
 * @param {string} topic - Meeting topic
 * @param {string} dataDirectory - Data directory
 * @returns {Promise<object>} - Generated talking points
 */
async function generateTalkingPoints(clientId, topic, dataDirectory) {
    logger.info(`Generating talking points for client ${clientId} on topic: ${topic}`);
    
    try {
        const result = await meetingAssistant.generateTalkingPoints(clientId, topic, null, dataDirectory);
        logger.info(`Talking points generated successfully for "${topic}"`);
        return result;
    } catch (error) {
        logger.error(`Error generating talking points for client ${clientId}:`, error);
        throw error;
    }
}

/**
 * Record meeting outcomes for a client
 * @param {string} clientId - Client ID
 * @param {object} outcomes - Meeting outcomes
 * @param {string} dataDirectory - Data directory
 * @returns {Promise<object>} - Updated meeting record
 */
async function recordMeetingOutcomes(clientId, outcomes, dataDirectory) {
    logger.info(`Recording meeting outcomes for client ${clientId}`);
    
    try {
        const meetingDate = new Date();
        const result = await meetingAssistant.recordMeetingOutcomes(
            clientId,
            meetingDate,
            outcomes,
            dataDirectory
        );
        
        logger.info(`Meeting outcomes recorded successfully for client ${clientId}`);
        return result;
    } catch (error) {
        logger.error(`Error recording meeting outcomes for client ${clientId}:`, error);
        throw error;
    }
}

/**
 * Main function to run the example
 */
async function main() {
    try {
        // Determine data directory
        const dataDir = path.join(__dirname, '../../data');
        
        // Check command line arguments
        const args = process.argv.slice(2);
        const command = args[0];
        
        // Create sample data if requested or if required directories don't exist
        if (command === 'create' || !fs.existsSync(path.join(dataDir, 'clients', 'client001'))) {
            await createSampleClientData(dataDir);
            logger.info('Sample client data created successfully');
        }
        
        // Handle different commands
        if (command === 'brief' || !command) {
            // Generate meeting brief for a client
            const clientId = args[1] || 'client001';
            const brief = await generateMeetingBrief(clientId, dataDir);
            logger.info(`Brief generated for ${brief.clientId}`);
            logger.info(`Meeting Type: ${brief.meetingType}`);
            logger.info(`Meeting Date: ${moment(brief.meetingDate).format('YYYY-MM-DD HH:mm')}`);
            logger.info(`Brief Saved To: ${brief.savedPath}`);
        } else if (command === 'talking-points') {
            // Generate talking points
            const clientId = args[1] || 'client001';
            const topic = args[2] || 'Implementation Timeline';
            const talkingPoints = await generateTalkingPoints(clientId, topic, dataDir);
            logger.info('Talking Points:');
            logger.info(talkingPoints.talkingPoints);
        } else if (command === 'record') {
            // Record meeting outcomes
            const clientId = args[1] || 'client001';
            const outcomes = {
                summary: 'Discussed implementation plan and timeline',
                result: 'Positive reception, questions about integration',
                nextSteps: 'Schedule technical deep dive session',
                agent: 'John Smith',
                actionItems: [
                    {
                        description: 'Prepare technical architecture document',
                        dueDate: moment().add(1, 'week').toDate(),
                        assignedTo: 'Maria Rodriguez',
                        priority: 'High'
                    },
                    {
                        description: 'Coordinate with IT for access requirements',
                        dueDate: moment().add(2, 'weeks').toDate(),
                        assignedTo: 'John Smith',
                        priority: 'Medium'
                    }
                ]
            };
            
            const result = await recordMeetingOutcomes(clientId, outcomes, dataDir);
            logger.info(`Meeting outcomes recorded for ${result.clientId}`);
            logger.info(`Action items created: ${outcomes.actionItems.length}`);
        }
        
    } catch (error) {
        logger.error('Error running meeting assistant example:', error);
    }
}

// Run the example
main(); 