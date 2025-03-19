const ExcelJS = require('exceljs');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class EmailResponseProcessor {
    constructor(logger) {
        this.logger = logger;
        this.CLAUDE_API_ENDPOINT = process.env.CLAUDE_API_ENDPOINT;
        this.CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    }

    async processResponse(email, spreadsheetPath) {
        try {
            // Read original spreadsheet
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(spreadsheetPath);
            const worksheet = workbook.getWorksheet(1);

            // Find matching row based on email content
            const matchingRow = await this._findMatchingRow(email, worksheet);
            if (!matchingRow) {
                this.logger.error('No matching record found for email');
                return;
            }

            // Analyze email sentiment
            const sentiment = this._analyzeEmailSentiment(email);

            if (sentiment === 'negative') {
                await this._handleNegativeResponse(matchingRow);
                return;
            }

            // Process positive response
            await this._handlePositiveResponse(email, matchingRow);

        } catch (error) {
            this.logger.error('Error processing email response:', error);
            throw error;
        }
    }

    async _findMatchingRow(email, worksheet) {
        let matchingRow = null;
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            const businessName = row.getCell(1).value;
            const contactName = row.getCell(2).value;
            
            if (email.toLowerCase().includes(businessName.toLowerCase()) ||
                (contactName && email.toLowerCase().includes(contactName.toLowerCase()))) {
                matchingRow = row;
            }
        });
        return matchingRow;
    }

    _analyzeEmailSentiment(email) {
        const positiveIndicators = ['interested', 'yes', 'please', 'would like', 'tell me more'];
        const negativeIndicators = ['not interested', 'remove', 'unsubscribe', 'stop', 'no thanks'];

        email = email.toLowerCase();
        
        for (const indicator of negativeIndicators) {
            if (email.includes(indicator)) return 'negative';
        }
        
        for (const indicator of positiveIndicators) {
            if (email.includes(indicator)) return 'positive';
        }
        
        return 'neutral';
    }

    async _handlePositiveResponse(email, matchingRow) {
        // Create new entity spreadsheet
        const entityName = matchingRow.getCell(1).value;
        const fileNumber = this._generateFileNumber();
        const newWorkbook = new ExcelJS.Workbook();
        const entitySheet = newWorkbook.addWorksheet('Business Info');

        // Extract and organize business information
        const businessInfo = await this._extractBusinessInfo(email, matchingRow);
        
        // Set up entity spreadsheet
        this._setupEntitySpreadsheet(entitySheet, businessInfo, fileNumber);

        // Save entity spreadsheet
        const filename = `${entityName.replace(/[^a-z0-9]/gi, '_')}.xlsx`;
        await newWorkbook.xlsx.writeFile(path.join('data', 'entities', filename));

        // Process business request
        await this._processBusinessRequest(businessInfo);

        // Generate AI response
        const response = await this._generateAIResponse(businessInfo);

        // Add to out tray
        await this._addToOutTray(response, businessInfo);

        // Update related files
        await this._updateRelatedFiles(businessInfo);
    }

    async _handleNegativeResponse(matchingRow) {
        const phoneNumber = matchingRow.getCell(3).value;
        
        // Add to Do Not Call list
        const dncWorkbook = new ExcelJS.Workbook();
        await dncWorkbook.xlsx.readFile('data/do_not_call.xlsx');
        const dncSheet = dncWorkbook.getWorksheet(1);
        dncSheet.addRow([phoneNumber, new Date().toISOString()]);
        await dncWorkbook.xlsx.writeFile('data/do_not_call.xlsx');

        // Send apology email
        const apologyEmail = this._generateApologyEmail(matchingRow);
        await this._addToOutTray(apologyEmail, { type: 'apology' });
    }

    _generateFileNumber() {
        return `F${Date.now().toString(36).toUpperCase()}`;
    }

    async _extractBusinessInfo(email, matchingRow) {
        return {
            fileNumber: this._generateFileNumber(),
            businessName: matchingRow.getCell(1).value,
            abn: this._extractABN(email),
            phone: matchingRow.getCell(3).value,
            email: this._extractEmails(email),
            url: this._extractURL(email),
            mainActivity: await this._analyzeBusinessActivity(email),
            respondent: {
                name: this._extractRespondentName(email),
                position: this._extractPosition(email),
                style: this._analyzeWritingStyle(email),
                interests: this._extractPersonalInterests(email)
            },
            request: this._extractBusinessRequest(email),
            productLines: this._extractProductLines(email)
        };
    }

    async _generateAIResponse(businessInfo) {
        const prompt = `
        Create a personalized follow-up email response using this information:
        ${JSON.stringify(businessInfo, null, 2)}

        Requirements:
        1. Reference their specific request/needs
        2. Include subtle connection to their personal interests if found
        3. Maintain professional but warm tone
        4. Include specific next steps
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

    async _addToOutTray(response, businessInfo) {
        const outTrayWorkbook = new ExcelJS.Workbook();
        await outTrayWorkbook.xlsx.readFile('data/out_tray.xlsx');
        const outTraySheet = outTrayWorkbook.getWorksheet(1);
        
        outTraySheet.addRow([
            new Date().toISOString(),
            businessInfo.fileNumber,
            businessInfo.businessName,
            response,
            'pending_review'
        ]);

        await outTrayWorkbook.xlsx.writeFile('data/out_tray.xlsx');
    }

    _generateApologyEmail(matchingRow) {
        return `
Dear ${matchingRow.getCell(2).value || 'Valued Business Owner'},

We sincerely apologize for any inconvenience caused. As a token of our respect for your time, please accept ${process.env.PAYOLA_OFFER}.

We have removed your contact information from our database.

Best regards,
The Middlemen Team
        `;
    }

    // Additional helper methods would go here for:
    // _extractABN(), _extractEmails(), _extractURL(), _analyzeBusinessActivity(),
    // _extractRespondentName(), _extractPosition(), _analyzeWritingStyle(),
    // _extractPersonalInterests(), _extractBusinessRequest(), _extractProductLines(),
    // _processBusinessRequest(), _updateRelatedFiles(), _setupEntitySpreadsheet()
}

module.exports = EmailResponseProcessor;
