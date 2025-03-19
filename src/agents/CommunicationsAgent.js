/**
 * CommunicationsAgent - Specialized agent for communications management
 * Responsible for email drafting, communications analysis, and outreach
 */

const Agent = require('../core/Agent');
const uuid = require('uuid');

class CommunicationsAgent extends Agent {
    constructor(mrSmith, config = {}) {
        super(mrSmith, config);
        this.emailTemplates = new Map();
        this.sentMessages = new Map();
        this.openThreads = new Map();
        this.responseAnalytics = new Map();
    }

    async initializeTools() {
        // Load and initialize communications tools
        const WebsiteAnalyserTool = require('../tools/communications/website_analyser.jsx');
        // Assume that second_email.jsx is actually a communications tool
        const SecondEmailTool = require('../tools/data-processing/second_email.jsx');
        
        this.tools.set('website-analyser', new WebsiteAnalyserTool({
            mrSmith: this.mrSmith,
            agent: this
        }));
        
        this.tools.set('email-tool', new SecondEmailTool({
            mrSmith: this.mrSmith,
            agent: this
        }));
    }

    async processTask(taskData) {
        const { type, parameters } = taskData;
        
        switch(type) {
            case 'email-draft':
                return await this.draftEmail(parameters);
            case 'response-analysis':
                return await this.analyzeResponse(parameters);
            case 'followup-generation':
                return await this.generateFollowup(parameters);
            case 'website-analysis':
                return await this.analyzeWebsite(parameters);
            default:
                throw new Error(`Unknown task type: ${type}`);
        }
    }

    async draftEmail({ recipientId, templateId, customizations = {}, attachments = [] }) {
        try {
            // Check template exists
            if (templateId && !this.emailTemplates.has(templateId)) {
                return {
                    status: 'error',
                    message: 'Email template not found'
                };
            }
            
            // Generate message ID
            const messageId = uuid.v4();
            
            // Get template or create empty
            const template = templateId ? 
                this.emailTemplates.get(templateId) : 
                { subject: '', body: '', variables: [] };
            
            // Apply customizations to template
            const message = {
                id: messageId,
                recipientId,
                subject: customizations.subject || template.subject,
                body: customizations.body || template.body,
                attachments: [...attachments],
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // If template has variables, replace them with values from customizations
            if (template.variables && template.variables.length > 0) {
                for (const variable of template.variables) {
                    const value = customizations[variable] || '';
                    
                    // Replace variables in subject and body
                    message.subject = message.subject.replace(`{${variable}}`, value);
                    message.body = message.body.replace(`{${variable}}`, value);
                }
            }
            
            // Use email tool to refine the draft
            const emailTool = this.tools.get('email-tool');
            const refinedEmail = await emailTool.execute({
                action: 'refine-draft',
                email: message
            });
            
            // Update message with refined content
            message.subject = refinedEmail.subject || message.subject;
            message.body = refinedEmail.body || message.body;
            
            // Store the message
            this.sentMessages.set(messageId, message);
            
            return {
                status: 'success',
                messageId,
                message
            };
        } catch (error) {
            console.error('Error drafting email:', error);
            throw error;
        }
    }

    async analyzeResponse({ messageId, responseContent, responseMetadata = {} }) {
        try {
            if (!messageId || !responseContent) {
                throw new Error('Invalid parameters: messageId and responseContent are required');
            }
            
            // Check if original message exists
            if (!this.sentMessages.has(messageId)) {
                return {
                    status: 'error',
                    message: 'Original message not found'
                };
            }
            
            // Get original message
            const originalMessage = this.sentMessages.get(messageId);
            
            // Create analysis entry
            const analysisId = uuid.v4();
            
            // Analyze response using NLP models (mock implementation)
            const sentiment = this._analyzeSentiment(responseContent);
            const intent = this._analyzeIntent(responseContent);
            const questions = this._extractQuestions(responseContent);
            const nextSteps = this._suggestNextSteps(sentiment, intent, questions);
            
            // Create response analysis object
            const analysis = {
                id: analysisId,
                originalMessageId: messageId,
                responseContent,
                responseTimestamp: responseMetadata.timestamp || new Date().toISOString(),
                analysis: {
                    sentiment,
                    intent,
                    questions,
                    nextSteps
                },
                createdAt: new Date().toISOString()
            };
            
            // Store the analysis
            this.responseAnalytics.set(analysisId, analysis);
            
            // Update thread if it exists
            if (this.openThreads.has(messageId)) {
                const thread = this.openThreads.get(messageId);
                thread.responses = thread.responses || [];
                thread.responses.push({
                    content: responseContent,
                    timestamp: responseMetadata.timestamp || new Date().toISOString(),
                    analysisId
                });
                thread.updatedAt = new Date().toISOString();
                this.openThreads.set(messageId, thread);
            }
            
            return {
                status: 'success',
                analysisId,
                analysis
            };
        } catch (error) {
            console.error('Error analyzing response:', error);
            throw error;
        }
    }

    async generateFollowup({ messageId, analysisId, followupType = 'standard' }) {
        try {
            if (!messageId) {
                throw new Error('Invalid parameters: messageId is required');
            }
            
            // Check if original message exists
            if (!this.sentMessages.has(messageId)) {
                return {
                    status: 'error',
                    message: 'Original message not found'
                };
            }
            
            // Get original message
            const originalMessage = this.sentMessages.get(messageId);
            
            // Get analysis if provided
            let analysis = null;
            if (analysisId && this.responseAnalytics.has(analysisId)) {
                analysis = this.responseAnalytics.get(analysisId);
            }
            
            // Use email tool to generate followup
            const emailTool = this.tools.get('email-tool');
            const followupEmail = await emailTool.execute({
                action: 'generate-followup',
                originalMessage,
                responseAnalysis: analysis,
                followupType
            });
            
            // Generate new message ID
            const followupMessageId = uuid.v4();
            
            // Create followup message
            const followupMessage = {
                id: followupMessageId,
                recipientId: originalMessage.recipientId,
                subject: followupEmail.subject,
                body: followupEmail.body,
                attachments: followupEmail.attachments || [],
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                originalMessageId: messageId
            };
            
            // Store the followup message
            this.sentMessages.set(followupMessageId, followupMessage);
            
            return {
                status: 'success',
                messageId: followupMessageId,
                message: followupMessage
            };
        } catch (error) {
            console.error('Error generating followup:', error);
            throw error;
        }
    }

    async analyzeWebsite({ url }) {
        try {
            if (!url) {
                throw new Error('Invalid parameters: url is required');
            }
            
            // Use website analyzer to analyze the website
            const websiteAnalyser = this.tools.get('website-analyser');
            const analysis = await websiteAnalyser.execute({
                url
            });
            
            return {
                status: 'success',
                analysis
            };
        } catch (error) {
            console.error('Error analyzing website:', error);
            throw error;
        }
    }

    _analyzeSentiment(text) {
        // Mock sentiment analysis
        if (text.includes('thank') || text.includes('appreciate') || text.includes('great')) {
            return { score: 0.8, label: 'positive' };
        } else if (text.includes('not interested') || text.includes('unsubscribe') || text.includes('stop')) {
            return { score: -0.7, label: 'negative' };
        } else {
            return { score: 0.2, label: 'neutral' };
        }
    }

    _analyzeIntent(text) {
        // Mock intent classification
        if (text.includes('how much') || text.includes('pricing') || text.includes('cost')) {
            return 'pricing_inquiry';
        } else if (text.includes('demo') || text.includes('show me') || text.includes('presentation')) {
            return 'demo_request';
        } else if (text.includes('more information') || text.includes('tell me about')) {
            return 'information_request';
        } else {
            return 'general_response';
        }
    }

    _extractQuestions(text) {
        // Mock question extraction
        const questions = [];
        const sentences = text.split(/[.!?]/);
        
        for (const sentence of sentences) {
            if ((sentence.includes('?') || 
                 sentence.trim().toLowerCase().startsWith('what') ||
                 sentence.trim().toLowerCase().startsWith('how') ||
                 sentence.trim().toLowerCase().startsWith('when') ||
                 sentence.trim().toLowerCase().startsWith('where') ||
                 sentence.trim().toLowerCase().startsWith('why') ||
                 sentence.trim().toLowerCase().startsWith('who')) && 
                sentence.trim().length > 10) {
                questions.push(sentence.trim());
            }
        }
        
        return questions;
    }

    _suggestNextSteps(sentiment, intent, questions) {
        // Mock next steps suggestion
        if (sentiment.label === 'negative') {
            return ['respect their wishes', 'close the thread'];
        }
        
        if (intent === 'pricing_inquiry') {
            return ['provide pricing information', 'offer a custom quote'];
        }
        
        if (intent === 'demo_request') {
            return ['schedule a demo call', 'send demo materials'];
        }
        
        if (questions.length > 0) {
            return ['answer all questions', 'provide additional resources'];
        }
        
        return ['send follow-up in 3 days', 'provide additional value'];
    }

    getMessageById(messageId) {
        return this.sentMessages.get(messageId);
    }

    getAllTemplates() {
        return Array.from(this.emailTemplates.values());
    }

    getTemplateById(templateId) {
        return this.emailTemplates.get(templateId);
    }
}

module.exports = CommunicationsAgent; 