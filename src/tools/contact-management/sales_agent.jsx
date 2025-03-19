const ExcelJS = require('exceljs');
const axios = require('axios');

class SalesAgent {
    constructor(logger) {
        this.logger = logger;
        this.CLAUDE_API_ENDPOINT = process.env.CLAUDE_API_ENDPOINT;
        this.CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    }

    async generateFirstContact(spreadsheetPath) {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(spreadsheetPath);
            const worksheet = workbook.getWorksheet(1);

            const emails = [];

            // Process rows in batches to avoid rate limits
            const batchSize = 10;
            const rows = [];
            
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header
                rows.push(row);
            });

            for (let i = 0; i < rows.length; i += batchSize) {
                const batch = rows.slice(i, i + batchSize);
                const batchEmails = await Promise.all(
                    batch.map(row => this._processRow(row))
                );
                emails.push(...batchEmails);
                
                // Rate limiting pause between batches
                if (i + batchSize < rows.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            return emails;
        } catch (error) {
            this.logger.error('Error generating first contact emails:', error);
            throw error;
        }
    }

    async _processRow(row) {
        const businessName = row.getCell(1).value;
        const contactName = row.getCell(2).value;
        const description = row.getCell(4).value;

        try {
            const email = await this._createFirstContactEmail(businessName, contactName, description);
            return email;
        } catch (error) {
            this.logger.error(`Error processing row for ${businessName}:`, error);
            return this._createFallbackEmail(businessName, contactName);
        }
    }

    async _createFirstContactEmail(businessName, contactName, description) {
        const prompt = `
        Create a personalized business email with the following requirements:

        Business Context:
        - Business Name: ${businessName}
        - Contact Name: ${contactName || 'Not provided'}
        - Business Description: ${description || 'Not provided'}

        Email Requirements:
        1. Write a professional first-contact email
        2. The sender is "The Middlemen", an online sourcing agency
        3. Explain we connect quality providers with verified buyers worldwide
        4. Mention our focus on: cost, quality, delivery speed, volume capacity
        5. Propose two opportunities:
           - We can help them find buyers for their products/services
           - We want to include their offerings in our database
        6. Request information about their terms and pricing
        7. Maintain a friendly yet professional tone
        8. Sign as "General Manager Michele Newby, The Middlemen"

        Important:
        - If there's a contact name, personalize the greeting
        - Tailor the content specifically to their business type/industry
        - Keep the email concise but comprehensive
        - Ensure the tone is warm and engaging
        - Include specific references to their business where possible

        Format the email with proper spacing and structure.
        `;

        try {
            const response = await axios.post(this.CLAUDE_API_ENDPOINT, {
                model: "claude-3.7",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                max_tokens: 1000,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${this.CLAUDE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            this.logger.error('Claude API error:', error);
            throw error;
        }
    }

    _createFallbackEmail(businessName, contactName) {
        // Fallback template if API fails
        const greeting = contactName ? 
            `Dear ${contactName},` : 
            `Dear ${businessName} Team,`;

        return `
${greeting}

I hope this email finds you well! I'm reaching out because your company caught our attention during our market research.

I represent The Middlemen, an innovative online sourcing agency that connects quality providers with verified buyers worldwide. We operate a sophisticated matching system that focuses on key factors including cost competitiveness, quality assurance, delivery capabilities, and volume capacity.

We would love to explore two potential opportunities with ${businessName}:

1. We can help expand your market reach by connecting you with our network of verified buyers.
2. We would like to include your offerings in our curated database for our global network of qualified buyers.

Everyone gets cold call emails all the time, so I can totally understand if you rolled your eyes when you started reading, but please, let me show you what we do. Is there anything you really need for your business that you're having trouble sourcing? Time is such a valuable resource! tell me what you need, anything at all, and I'll show you who we are.

I'm really looking forward to discussing this opportunity with you further.

Best regards,

Michele Newby
General Manager 
The Middlemen

Contact Details:
Email: michele.newby@themiddlemen.com
Phone: +1 (555) 123-4567
Website: www.themiddlemen.com
`;
    }

    /**
     * Track and manage client responses in a response matrix
     * @param {string} spreadsheetPath - Path to the client spreadsheet
     * @param {string} clientResponse - The latest response from the client
     * @param {number} rowIndex - Row index of the client in the spreadsheet
     * @returns {Promise<object>} Response with next actions
     */
    async manageClientResponse(spreadsheetPath, clientResponse, rowIndex) {
        try {
            // Load the workbook
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(spreadsheetPath);
            
            // Get main worksheet
            let worksheet = workbook.getWorksheet(1);
            
            // Get client data from the main sheet
            const businessName = worksheet.getCell(`A${rowIndex}`).value;
            const contactName = worksheet.getCell(`B${rowIndex}`).value;
            const description = worksheet.getCell(`D${rowIndex}`).value;
            
            // Look for or create the response matrix worksheet
            let responseSheet = workbook.getWorksheet('Response Matrix');
            if (!responseSheet) {
                responseSheet = workbook.addWorksheet('Response Matrix');
                // Create headers
                responseSheet.columns = [
                    { header: 'Business Name', key: 'business', width: 20 },
                    { header: 'Contact Name', key: 'contact', width: 20 },
                    { header: 'Date', key: 'date', width: 12 },
                    { header: 'Response Type', key: 'type', width: 15 },
                    { header: 'Client Message', key: 'clientMessage', width: 30 },
                    { header: 'Our Response', key: 'ourResponse', width: 30 },
                    { header: 'Next Steps', key: 'nextSteps', width: 20 },
                    { header: 'Status', key: 'status', width: 12 },
                    { header: 'Deliverables', key: 'deliverables', width: 25 },
                    { header: 'Outcomes', key: 'outcomes', width: 25 }
                ];
            }
            
            // Analyze client response
            const analysisPrompt = `
            Analyze this client response from ${businessName}:
            
            ${clientResponse}
            
            Please categorize this response as one of:
            - Positive (client is interested)
            - Neutral (client wants more information)
            - Negative (client is not interested)
            - Questions (client has specific questions)
            - Other (specify)
            
            Also extract:
            1. Any specific requests or needs mentioned
            2. Any questions asked
            3. Any objections raised
            4. Sentiment (positive, neutral, negative)
            5. Recommended next steps
            
            Format your response as JSON.
            `;
            
            // Get analysis of client response
            const analysis = await this._getResponseAnalysis(analysisPrompt);
            
            // Generate our response to the client
            const ourResponse = await this._generateFollowupResponse(businessName, contactName, description, clientResponse, analysis);
            
            // Add new row to response matrix
            const newRow = {
                business: businessName,
                contact: contactName,
                date: new Date().toISOString().split('T')[0],
                type: analysis.category,
                clientMessage: clientResponse.substring(0, 100) + (clientResponse.length > 100 ? '...' : ''),
                ourResponse: ourResponse.substring(0, 100) + '...',
                nextSteps: analysis.recommendedNextSteps,
                status: this._determineStatus(analysis.category),
                deliverables: this._determineDeliverables(analysis),
                outcomes: ''  // To be filled later
            };
            
            // Add row to response matrix
            responseSheet.addRow(newRow);
            
            // Update main worksheet with current status
            worksheet.getCell(`G${rowIndex}`).value = analysis.category;
            worksheet.getCell(`H${rowIndex}`).value = new Date().toISOString().split('T')[0];
            
            // Save changes
            await workbook.xlsx.writeFile(spreadsheetPath);
            
            return {
                clientName: businessName,
                contactName: contactName,
                responseAnalysis: analysis,
                ourResponse: ourResponse,
                nextSteps: analysis.recommendedNextSteps
            };
        } catch (error) {
            this.logger.error(`Error managing client response for ${spreadsheetPath}:`, error);
            throw error;
        }
    }
    
    /**
     * Generate a tailored follow-up response based on client's message
     * @param {string} businessName - Name of the business
     * @param {string} contactName - Name of the contact person
     * @param {string} description - Business description
     * @param {string} clientResponse - The client's response
     * @param {object} analysis - Analysis of the client's response
     * @returns {Promise<string>} Tailored response
     */
    async _generateFollowupResponse(businessName, contactName, description, clientResponse, analysis) {
        const greeting = contactName ? `Dear ${contactName},` : `Dear ${businessName} Team,`;
        
        const prompt = `
        Create a personalized follow-up email response with the following requirements:

        Business Context:
        - Business Name: ${businessName}
        - Contact Name: ${contactName || 'Not provided'}
        - Business Description: ${description || 'Not provided'}
        
        Client's Previous Message:
        ${clientResponse}
        
        Client Response Analysis:
        - Response Type: ${analysis.category}
        - Sentiment: ${analysis.sentiment}
        - Specific Requests: ${analysis.specificRequests || 'None'}
        - Questions Asked: ${analysis.questions || 'None'}
        - Objections Raised: ${analysis.objections || 'None'}
        
        Email Requirements:
        1. Begin with pleasantries and express appreciation for their response
        2. Engage with their specific points and questions
        3. Clearly outline potential deliverables based on their needs
        4. Discuss expected outcomes of our collaboration
        5. Suggest concrete next steps
        6. Maintain a friendly yet professional tone
        7. Sign as "General Manager Michele Newby, The Middlemen"

        Important:
        - Personalize the greeting using their name
        - Address ALL specific questions they asked
        - If they expressed objections, address them tactfully
        - If they showed interest, express enthusiasm and suggest a call or meeting
        - If they were negative, be respectful and leave the door open for future contact
        - Tailor the content specifically to their business type/industry

        Format the email with proper spacing and structure.
        `;

        try {
            const response = await axios.post(this.CLAUDE_API_ENDPOINT, {
                model: "claude-3.7",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                max_tokens: 1200,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${this.CLAUDE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            this.logger.error('Claude API error for follow-up response:', error);
            
            // Fallback response if API fails
            return `
${greeting}

Thank you for your response. We appreciate you taking the time to get back to us.

I've noted your feedback and would be happy to address any questions or concerns you may have. The Middlemen team is committed to providing value to all our business partners, and we tailor our approach to meet the specific needs of each client.

Please let me know if you'd like to discuss this further or if there's any additional information I can provide about our services.

Best regards,

Michele Newby
General Manager 
The Middlemen

Contact Details:
Email: michele.newby@themiddlemen.com
Phone: +1 (555) 123-4567
Website: www.themiddlemen.com
`;
        }
    }
    
    /**
     * Analyze client response using Claude
     * @param {string} prompt - Analysis prompt
     * @returns {Promise<object>} Analysis results
     */
    async _getResponseAnalysis(prompt) {
        try {
            const response = await axios.post(this.CLAUDE_API_ENDPOINT, {
                model: "claude-3.7",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                max_tokens: 800,
                temperature: 0.3
            }, {
                headers: {
                    'Authorization': `Bearer ${this.CLAUDE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            // Parse JSON response
            try {
                return JSON.parse(response.data.choices[0].message.content);
            } catch (parseError) {
                // If parsing fails, create structured response from text
                const content = response.data.choices[0].message.content;
                return {
                    category: content.includes('Positive') ? 'Positive' : 
                              content.includes('Neutral') ? 'Neutral' : 
                              content.includes('Negative') ? 'Negative' : 
                              content.includes('Questions') ? 'Questions' : 'Other',
                    sentiment: content.includes('positive sentiment') ? 'Positive' :
                               content.includes('negative sentiment') ? 'Negative' : 'Neutral',
                    specificRequests: 'Unable to parse specific requests',
                    questions: 'Unable to parse questions',
                    objections: 'Unable to parse objections',
                    recommendedNextSteps: 'Follow up based on general response tone'
                };
            }
        } catch (error) {
            this.logger.error('Claude API error for response analysis:', error);
            // Default analysis if API fails
            return {
                category: 'Other',
                sentiment: 'Neutral',
                specificRequests: '',
                questions: '',
                objections: '',
                recommendedNextSteps: 'Follow up to clarify client needs'
            };
        }
    }
    
    /**
     * Determine the current status based on response category
     * @param {string} category - Response category
     * @returns {string} Status
     */
    _determineStatus(category) {
        switch (category) {
            case 'Positive':
                return 'Active Lead';
            case 'Neutral':
                return 'Nurturing';
            case 'Questions':
                return 'Information Needed';
            case 'Negative':
                return 'Not Interested';
            default:
                return 'Follow Up';
        }
    }
    
    /**
     * Determine potential deliverables based on response analysis
     * @param {object} analysis - Response analysis
     * @returns {string} Potential deliverables
     */
    _determineDeliverables(analysis) {
        if (analysis.specificRequests && analysis.specificRequests.length > 0) {
            return `Requested: ${analysis.specificRequests}`;
        }
        
        switch (analysis.category) {
            case 'Positive':
                return 'Custom proposal, Supplier matches';
            case 'Neutral':
                return 'Information package, Case studies';
            case 'Questions':
                return 'Detailed answers, Sample matches';
            default:
                return 'Follow-up communication';
        }
    }

    /**
     * Process and manage responses for any entity spreadsheet
     * @param {string} entityName - Name of the entity/client
     * @param {string} clientResponse - The client's response to process
     * @returns {Promise<object>} Processing results and recommended response
     */
    async processEntityResponse(entityName, clientResponse) {
        try {
            const spreadsheetPath = `${entityName}.xlsx`;
            this.logger.info(`Processing response for entity: ${entityName}`);
            
            // Attempt to read the spreadsheet
            const workbook = new ExcelJS.Workbook();
            
            try {
                await workbook.xlsx.readFile(spreadsheetPath);
            } catch (error) {
                // If file doesn't exist, create a new one with basic structure
                this.logger.info(`Creating new spreadsheet for ${entityName}`);
                const worksheet = workbook.addWorksheet('Client Data');
                
                // Add headers to main sheet
                worksheet.columns = [
                    { header: 'Business Name', key: 'business', width: 20 },
                    { header: 'Contact Name', key: 'contact', width: 20 },
                    { header: 'Email', key: 'email', width: 25 },
                    { header: 'Business Description', key: 'description', width: 40 },
                    { header: 'Phone', key: 'phone', width: 15 },
                    { header: 'Website', key: 'website', width: 25 },
                    { header: 'Status', key: 'status', width: 15 },
                    { header: 'Last Contact Date', key: 'lastContact', width: 15 }
                ];
                
                // Add entity as the first row
                worksheet.addRow({
                    business: entityName,
                    contact: 'Unknown',
                    email: 'Unknown',
                    description: 'Initial contact',
                    status: 'New',
                    lastContact: new Date().toISOString().split('T')[0]
                });
                
                await workbook.xlsx.writeFile(spreadsheetPath);
            }
            
            // Get worksheet and determine client row
            const worksheet = workbook.getWorksheet(1);
            let rowIndex = 0;
            
            // Find the entity in the spreadsheet
            worksheet.eachRow((row, index) => {
                const businessCell = row.getCell(1);
                if (businessCell.value === entityName) {
                    rowIndex = index;
                }
            });
            
            // If entity wasn't found, add it
            if (rowIndex === 0) {
                rowIndex = worksheet.rowCount + 1;
                worksheet.addRow({
                    business: entityName,
                    contact: 'Unknown',
                    email: 'Unknown',
                    description: 'Auto-added',
                    status: 'New',
                    lastContact: new Date().toISOString().split('T')[0]
                });
                await workbook.xlsx.writeFile(spreadsheetPath);
            }
            
            // Process the response using the existing method
            const result = await this.manageClientResponse(spreadsheetPath, clientResponse, rowIndex);
            
            // Extract additional information from the response if possible
            this._updateClientDataFromResponse(worksheet, rowIndex, clientResponse);
            await workbook.xlsx.writeFile(spreadsheetPath);
            
            return {
                entityName,
                spreadsheetPath,
                processingResult: result,
                message: `Response for ${entityName} processed and matrix updated.`
            };
        } catch (error) {
            this.logger.error(`Error processing entity response for ${entityName}:`, error);
            throw error;
        }
    }
    
    /**
     * Extract and update client data from their response
     * @param {object} worksheet - The worksheet to update
     * @param {number} rowIndex - Row index in worksheet
     * @param {string} clientResponse - The client's response
     */
    _updateClientDataFromResponse(worksheet, rowIndex, clientResponse) {
        try {
            // Look for patterns that might contain useful information
            const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
            const phonePattern = /(\+\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
            const websitePattern = /(https?:\/\/)?([www.])?\w+\.\w{2,}(\.\w{2,})?(\/\S*)?/g;
            const namePattern = /([Mm]y\s+name\s+is\s+|[Tt]his\s+is\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/g;
            
            // Extract email
            const emails = clientResponse.match(emailPattern);
            if (emails && emails.length > 0) {
                worksheet.getCell(`C${rowIndex}`).value = emails[0];
            }
            
            // Extract phone
            const phones = clientResponse.match(phonePattern);
            if (phones && phones.length > 0) {
                worksheet.getCell(`E${rowIndex}`).value = phones[0];
            }
            
            // Extract website
            const websites = clientResponse.match(websitePattern);
            if (websites && websites.length > 0) {
                worksheet.getCell(`F${rowIndex}`).value = websites[0];
            }
            
            // Extract name if mentioned
            const nameMatches = [...clientResponse.matchAll(namePattern)];
            if (nameMatches && nameMatches.length > 0 && nameMatches[0][2]) {
                const extractedName = nameMatches[0][2].trim();
                // Only update if we don't have a name yet or have 'Unknown'
                const currentName = worksheet.getCell(`B${rowIndex}`).value;
                if (!currentName || currentName === 'Unknown') {
                    worksheet.getCell(`B${rowIndex}`).value = extractedName;
                }
            }
            
            // Extract potential business description
            if (clientResponse.length > 100 && 
                (worksheet.getCell(`D${rowIndex}`).value === 'Initial contact' || 
                 worksheet.getCell(`D${rowIndex}`).value === 'Auto-added')) {
                // Extract first paragraph that might describe their business
                const paragraphs = clientResponse.split('\n\n');
                for (const paragraph of paragraphs) {
                    if (paragraph.length > 30 && paragraph.length < 200 && 
                        (paragraph.includes('we') || paragraph.includes('our') || 
                         paragraph.includes('business') || paragraph.includes('company'))) {
                        worksheet.getCell(`D${rowIndex}`).value = paragraph.substring(0, 200);
                        break;
                    }
                }
            }
        } catch (error) {
            this.logger.error('Error updating client data from response:', error);
            // Continue execution even if this fails
        }
    }
}

module.exports = SalesAgent;


