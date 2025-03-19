const ExcelJS = require('exceljs');
const axios = require('axios');
const moment = require('moment');

/**
 * Meeting Assistant class to help prepare for client meetings
 * by gathering relevant information and generating briefing documents
 */
class MeetingAssistant {
    constructor(logger) {
        this.logger = logger;
        this.CLAUDE_API_ENDPOINT = process.env.CLAUDE_API_ENDPOINT;
        this.CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    }

    /**
     * Generate a comprehensive meeting brief for an upcoming client meeting
     * @param {string} clientId - Unique identifier for the client
     * @param {string} meetingType - Type of meeting (initial, follow-up, proposal, etc.)
     * @param {Date} meetingDate - Scheduled date and time of the meeting
     * @param {string} dataDirectory - Directory containing client data files
     * @returns {Promise<object>} Meeting brief document and metadata
     */
    async generateMeetingBrief(clientId, meetingType, meetingDate, dataDirectory) {
        try {
            // Gather all relevant client data
            const clientData = await this._gatherClientData(clientId, dataDirectory);
            
            // Generate the meeting brief using AI
            const brief = await this._createBriefDocument(clientData, meetingType, meetingDate);
            
            // Save the brief to the client's folder
            const savedPath = await this._saveBriefToFile(clientId, brief, meetingDate, dataDirectory);
            
            return {
                clientId,
                meetingDate,
                meetingType,
                briefDocument: brief,
                savedPath,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            this.logger.error(`Error generating meeting brief for client ${clientId}:`, error);
            throw error;
        }
    }

    /**
     * Gather all relevant data about a client from various sources
     * @param {string} clientId - Unique identifier for the client
     * @param {string} dataDirectory - Directory containing client data files
     * @returns {Promise<object>} Consolidated client data
     */
    async _gatherClientData(clientId, dataDirectory) {
        try {
            const clientData = {
                profile: {},
                interactions: [],
                opportunities: [],
                products: [],
                services: [],
                notes: []
            };

            // Load client profile
            const profilePath = `${dataDirectory}/clients/${clientId}/profile.xlsx`;
            const profileWorkbook = new ExcelJS.Workbook();
            await profileWorkbook.xlsx.readFile(profilePath);
            
            const profileSheet = profileWorkbook.getWorksheet('Profile');
            clientData.profile = {
                id: clientId,
                businessName: profileSheet.getCell('B2').value,
                contactName: profileSheet.getCell('B3').value,
                position: profileSheet.getCell('B4').value,
                email: profileSheet.getCell('B5').value,
                phone: profileSheet.getCell('B6').value,
                industry: profileSheet.getCell('B7').value,
                size: profileSheet.getCell('B8').value,
                location: profileSheet.getCell('B9').value,
                website: profileSheet.getCell('B10').value,
                relationshipStarted: profileSheet.getCell('B11').value
            };

            // Load interaction history
            const interactionsPath = `${dataDirectory}/clients/${clientId}/interactions.xlsx`;
            const interactionsWorkbook = new ExcelJS.Workbook();
            await interactionsWorkbook.xlsx.readFile(interactionsPath);
            
            const interactionsSheet = interactionsWorkbook.getWorksheet('Interactions');
            interactionsSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header
                
                clientData.interactions.push({
                    date: row.getCell(1).value,
                    type: row.getCell(2).value,
                    summary: row.getCell(3).value,
                    outcome: row.getCell(4).value,
                    nextSteps: row.getCell(5).value,
                    agent: row.getCell(6).value
                });
            });

            // Load opportunities
            const opportunitiesPath = `${dataDirectory}/clients/${clientId}/opportunities.xlsx`;
            try {
                const opportunitiesWorkbook = new ExcelJS.Workbook();
                await opportunitiesWorkbook.xlsx.readFile(opportunitiesPath);
                
                const opportunitiesSheet = opportunitiesWorkbook.getWorksheet('Opportunities');
                opportunitiesSheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; // Skip header
                    
                    clientData.opportunities.push({
                        id: row.getCell(1).value,
                        name: row.getCell(2).value,
                        value: row.getCell(3).value,
                        stage: row.getCell(4).value,
                        probability: row.getCell(5).value,
                        expectedCloseDate: row.getCell(6).value,
                        products: row.getCell(7).value,
                        services: row.getCell(8).value,
                        notes: row.getCell(9).value
                    });
                });
            } catch (error) {
                this.logger.warn(`No opportunities file found for client ${clientId}`);
            }

            // Load notes
            const notesPath = `${dataDirectory}/clients/${clientId}/notes.xlsx`;
            try {
                const notesWorkbook = new ExcelJS.Workbook();
                await notesWorkbook.xlsx.readFile(notesPath);
                
                const notesSheet = notesWorkbook.getWorksheet('Notes');
                notesSheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; // Skip header
                    
                    clientData.notes.push({
                        date: row.getCell(1).value,
                        author: row.getCell(2).value,
                        category: row.getCell(3).value,
                        content: row.getCell(4).value
                    });
                });
            } catch (error) {
                this.logger.warn(`No notes file found for client ${clientId}`);
            }

            return clientData;
        } catch (error) {
            this.logger.error(`Error gathering client data for ${clientId}:`, error);
            throw error;
        }
    }

    /**
     * Create a comprehensive meeting brief document using AI
     * @param {object} clientData - Consolidated client data
     * @param {string} meetingType - Type of meeting
     * @param {Date} meetingDate - Scheduled date and time of the meeting
     * @returns {Promise<string>} Formatted meeting brief document
     */
    async _createBriefDocument(clientData, meetingType, meetingDate) {
        try {
            // Format client data for the prompt
            const formattedInteractions = clientData.interactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5)
                .map(i => `- ${moment(i.date).format('YYYY-MM-DD')}: ${i.type} - ${i.summary} (Outcome: ${i.outcome})`)
                .join('\n');

            const formattedOpportunities = clientData.opportunities
                .map(o => `- ${o.name} ($${o.value}) - Stage: ${o.stage}, Probability: ${o.probability}%, Expected close: ${moment(o.expectedCloseDate).format('YYYY-MM-DD')}`)
                .join('\n');

            const formattedNotes = clientData.notes
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5)
                .map(n => `- ${moment(n.date).format('YYYY-MM-DD')} (${n.category}): ${n.content}`)
                .join('\n');

            const prompt = `
            Create a comprehensive meeting brief for an upcoming client meeting with the following details:

            MEETING INFORMATION:
            - Meeting Type: ${meetingType}
            - Meeting Date: ${moment(meetingDate).format('YYYY-MM-DD HH:mm')}
            - Days Until Meeting: ${moment(meetingDate).diff(moment(), 'days')}

            CLIENT PROFILE:
            - Business Name: ${clientData.profile.businessName}
            - Primary Contact: ${clientData.profile.contactName}, ${clientData.profile.position}
            - Industry: ${clientData.profile.industry}
            - Size: ${clientData.profile.size}
            - Location: ${clientData.profile.location}
            - Relationship Started: ${moment(clientData.profile.relationshipStarted).format('YYYY-MM-DD')}

            RECENT INTERACTIONS:
            ${formattedInteractions || "No recent interactions recorded."}

            ACTIVE OPPORTUNITIES:
            ${formattedOpportunities || "No active opportunities."}

            IMPORTANT NOTES:
            ${formattedNotes || "No important notes recorded."}

            Please structure the brief with the following sections:
            1. Executive Summary (key points about the client and meeting purpose)
            2. Client Background (relevant history and context)
            3. Recent Interactions (summary of recent touchpoints)
            4. Current Opportunities (status of active deals)
            5. Discussion Points (suggested topics based on history)
            6. Action Items (preparation tasks before the meeting)
            7. Strategic Recommendations (insights on how to approach the client)

            Format the document professionally with clear headings and bullet points where appropriate.
            Include specific details from the client's history to demonstrate familiarity with their business.
            Tailor the content to the meeting type (${meetingType}).
            `;

            const response = await axios.post(this.CLAUDE_API_ENDPOINT, {
                model: "claude-3.7",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                max_tokens: 2000,
                temperature: 0.2
            }, {
                headers: {
                    'Authorization': `Bearer ${this.CLAUDE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            this.logger.error('Error creating brief document:', error);
            return this._createFallbackBrief(clientData, meetingType, meetingDate);
        }
    }

    /**
     * Create a fallback meeting brief if AI generation fails
     * @param {object} clientData - Consolidated client data
     * @param {string} meetingType - Type of meeting
     * @param {Date} meetingDate - Scheduled date and time of the meeting
     * @returns {string} Formatted fallback meeting brief
     */
    _createFallbackBrief(clientData, meetingType, meetingDate) {
        const formattedDate = moment(meetingDate).format('MMMM Do YYYY, h:mm a');
        const daysUntil = moment(meetingDate).diff(moment(), 'days');
        
        return `
# MEETING BRIEF: ${clientData.profile.businessName}

## Meeting Details
- **Type:** ${meetingType}
- **Date and Time:** ${formattedDate}
- **Days Until Meeting:** ${daysUntil}
- **Primary Contact:** ${clientData.profile.contactName}, ${clientData.profile.position}

## Executive Summary
Upcoming ${meetingType} meeting with ${clientData.profile.businessName}, a ${clientData.profile.size} company in the ${clientData.profile.industry} industry. Relationship started on ${moment(clientData.profile.relationshipStarted).format('MMMM Do YYYY')}.

## Client Background
- **Industry:** ${clientData.profile.industry}
- **Location:** ${clientData.profile.location}
- **Website:** ${clientData.profile.website}
- **Contact Details:** ${clientData.profile.email}, ${clientData.profile.phone}

## Recent Interactions
${clientData.interactions.length > 0 ? 
    clientData.interactions.slice(0, 3).map(i => 
        `- ${moment(i.date).format('YYYY-MM-DD')}: ${i.type} - ${i.summary}`
    ).join('\n') : 
    "No recent interactions recorded."}

## Current Opportunities
${clientData.opportunities.length > 0 ? 
    clientData.opportunities.map(o => 
        `- ${o.name} ($${o.value}) - Stage: ${o.stage}, Probability: ${o.probability}%`
    ).join('\n') : 
    "No active opportunities."}

## Discussion Points
1. Review of previous interactions and follow-up items
2. Current business needs and challenges
3. Potential new opportunities for collaboration
4. Next steps and timeline

## Action Items Before Meeting
1. Review all recent communications
2. Prepare relevant materials based on meeting type
3. Confirm meeting details with the client
4. Research any recent industry developments

## Notes
${clientData.notes.length > 0 ? 
    clientData.notes.slice(0, 3).map(n => 
        `- ${moment(n.date).format('YYYY-MM-DD')}: ${n.content}`
    ).join('\n') : 
    "No notes available."}
`;
    }

    /**
     * Save the meeting brief to a file in the client's directory
     * @param {string} clientId - Unique identifier for the client
     * @param {string} briefDocument - The generated meeting brief
     * @param {Date} meetingDate - Scheduled date and time of the meeting
     * @param {string} dataDirectory - Directory containing client data files
     * @returns {Promise<string>} Path to the saved file
     */
    async _saveBriefToFile(clientId, briefDocument, meetingDate, dataDirectory) {
        try {
            const clientDir = `${dataDirectory}/clients/${clientId}`;
            const briefsDir = `${clientDir}/meeting_briefs`;
            const fs = require('fs-extra');
            
            // Ensure the directory exists
            await fs.ensureDir(briefsDir);
            
            // Create filename with date
            const formattedDate = moment(meetingDate).format('YYYY-MM-DD');
            const filename = `${formattedDate}_meeting_brief.md`;
            const filePath = `${briefsDir}/${filename}`;
            
            // Write the brief to file
            await fs.writeFile(filePath, briefDocument);
            
            this.logger.info(`Meeting brief saved to ${filePath}`);
            return filePath;
        } catch (error) {
            this.logger.error(`Error saving brief to file for client ${clientId}:`, error);
            throw error;
        }
    }

    /**
     * Generate talking points for a specific meeting topic
     * @param {string} clientId - Unique identifier for the client
     * @param {string} topic - The specific topic to generate talking points for
     * @param {object} clientData - Optional pre-loaded client data
     * @param {string} dataDirectory - Directory containing client data files
     * @returns {Promise<object>} Talking points and related information
     */
    async generateTalkingPoints(clientId, topic, clientData = null, dataDirectory) {
        try {
            // Load client data if not provided
            if (!clientData) {
                clientData = await this._gatherClientData(clientId, dataDirectory);
            }
            
            const prompt = `
            Generate 5-7 strategic talking points for a business meeting with ${clientData.profile.businessName} 
            on the topic of "${topic}".
            
            Client context:
            - Industry: ${clientData.profile.industry}
            - Size: ${clientData.profile.size}
            - Relationship duration: ${moment().diff(moment(clientData.profile.relationshipStarted), 'months')} months
            
            For each talking point:
            1. Provide a clear, concise statement
            2. Include a brief explanation of why it matters
            3. Suggest a question to advance the conversation
            
            Make the talking points specific, actionable, and tailored to this client's industry and situation.
            `;
            
            try {
                const response = await axios.post(this.CLAUDE_API_ENDPOINT, {
                    model: "claude-3.7",
                    messages: [{
                        role: "user",
                        content: prompt
                    }],
                    max_tokens: 1000,
                    temperature: 0.3
                }, {
                    headers: {
                        'Authorization': `Bearer ${this.CLAUDE_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                return {
                    clientId,
                    topic,
                    talkingPoints: response.data.choices[0].message.content,
                    generatedAt: new Date().toISOString()
                };
            } catch (error) {
                this.logger.error('Error generating talking points:', error);
                return this._createFallbackTalkingPoints(clientData, topic);
            }
        } catch (error) {
            this.logger.error(`Error generating talking points for client ${clientId}:`, error);
            throw error;
        }
    }

    /**
     * Create fallback talking points if AI generation fails
     * @param {object} clientData - Client data
     * @param {string} topic - Meeting topic
     * @returns {object} Fallback talking points
     */
    _createFallbackTalkingPoints(clientData, topic) {
        return {
            clientId: clientData.profile.id,
            topic,
            talkingPoints: `
# Talking Points: ${topic}

1. **Current Business Challenges**
   - Discuss the main challenges in the ${clientData.profile.industry} industry
   - Question: "What are the biggest obstacles you're facing this quarter?"

2. **Growth Opportunities**
   - Explore potential areas for business expansion
   - Question: "Which areas of your business show the most promise for growth?"

3. **Competitive Landscape**
   - Review major competitors and market positioning
   - Question: "How has the competitive landscape changed recently?"

4. **Operational Efficiency**
   - Discuss ways to improve processes and reduce costs
   - Question: "Which operational areas would benefit most from optimization?"

5. **Future Planning**
   - Address long-term goals and strategic direction
   - Question: "What does success look like for your business in the next 2-3 years?"
            `,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Record meeting outcomes and next steps after a client meeting
     * @param {string} clientId - Unique identifier for the client
     * @param {Date} meetingDate - Date and time of the meeting
     * @param {object} outcomes - Meeting outcomes and action items
     * @param {string} dataDirectory - Directory containing client data files
     * @returns {Promise<object>} Updated meeting record
     */
    async recordMeetingOutcomes(clientId, meetingDate, outcomes, dataDirectory) {
        try {
            const clientDir = `${dataDirectory}/clients/${clientId}`;
            const interactionsPath = `${clientDir}/interactions.xlsx`;
            
            // Load interactions workbook
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(interactionsPath);
            
            const worksheet = workbook.getWorksheet('Interactions');
            
            // Add new interaction row
            worksheet.addRow([
                meetingDate,
                'Meeting',
                outcomes.summary,
                outcomes.result,
                outcomes.nextSteps,
                outcomes.agent
            ]);
            
            // Save the updated workbook
            await workbook.xlsx.writeFile(interactionsPath);
            
            // If there are action items, create or update tasks
            if (outcomes.actionItems && outcomes.actionItems.length > 0) {
                await this._createActionItems(clientId, outcomes.actionItems, dataDirectory);
            }
            
            return {
                clientId,
                meetingDate,
                recorded: true,
                outcomes
            };
        } catch (error) {
            this.logger.error(`Error recording meeting outcomes for client ${clientId}:`, error);
            throw error;
        }
    }

    /**
     * Create action items from meeting outcomes
     * @param {string} clientId - Unique identifier for the client
     * @param {Array} actionItems - List of action items from the meeting
     * @param {string} dataDirectory - Directory containing client data files
     * @returns {Promise<void>}
     */
    async _createActionItems(clientId, actionItems, dataDirectory) {
        try {
            const clientDir = `${dataDirectory}/clients/${clientId}`;
            const tasksPath = `${clientDir}/tasks.xlsx`;
            
            // Create or load tasks workbook
            const workbook = new ExcelJS.Workbook();
            try {
                await workbook.xlsx.readFile(tasksPath);
            } catch (error) {
                // Create new workbook if it doesn't exist
                const worksheet = workbook.addWorksheet('Tasks');
                worksheet.columns = [
                    { header: 'Created Date', key: 'created', width: 15 },
                    { header: 'Due Date', key: 'due', width: 15 },
                    { header: 'Description', key: 'description', width: 40 },
                    { header: 'Assigned To', key: 'assignedTo', width: 20 },
                    { header: 'Priority', key: 'priority', width: 10 },
                    { header: 'Status', key: 'status', width: 15 },
                    { header: 'Completed Date', key: 'completed', width: 15 }
                ];
            }
            
            const worksheet = workbook.getWorksheet('Tasks');
            
            // Add action items as tasks
            for (const item of actionItems) {
                worksheet.addRow([
                    new Date(), // Created date
                    item.dueDate || null,
                    item.description,
                    item.assignedTo || null,
                    item.priority || 'Medium',
                    'Open',
                    null // Completed date
                ]);
            }
            
            // Save the updated workbook
            await workbook.xlsx.writeFile(tasksPath);
        } catch (error) {
            this.logger.error(`Error creating action items for client ${clientId}:`, error);
            throw error;
        }
    }
}

module.exports = MeetingAssistant;
