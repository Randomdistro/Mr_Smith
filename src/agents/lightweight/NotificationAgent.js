/**
 * NotificationAgent - Lightweight Tier 1 agent for notifications
 * Fire-and-forget agent that sends notifications and then terminates
 */

const Agent = require('../../core/Agent');

class NotificationAgent extends Agent {
    constructor(mrSmith, config = {}) {
        super(mrSmith, {
            tier: 'lightweight',
            temporary: true, // Always temporary - fire and forget
            ...config
        });
        
        this.maxRetries = config.maxRetries || 3;
        this.notificationHistory = [];
    }
    
    async initializeTools() {
        try {
            // Load only what we need for the notification type
            const notificationType = this.config.notificationType || 'console';
            
            switch (notificationType) {
                case 'email':
                    const EmailTool = require('../../tools/communications/EmailTool');
                    this.tools.set('email', new EmailTool({
                        mrSmith: this.mrSmith,
                        agent: this
                    }));
                    break;
                    
                case 'sms':
                    const SmsTool = require('../../tools/communications/SmsTool');
                    this.tools.set('sms', new SmsTool({
                        mrSmith: this.mrSmith,
                        agent: this
                    }));
                    break;
                    
                case 'slack':
                    const SlackTool = require('../../tools/communications/SlackTool');
                    this.tools.set('slack', new SlackTool({
                        mrSmith: this.mrSmith,
                        agent: this
                    }));
                    break;
                    
                default:
                    // Default to console notifications
                    const ConsoleTool = require('../../tools/communications/ConsoleTool');
                    this.tools.set('console', new ConsoleTool({
                        mrSmith: this.mrSmith,
                        agent: this
                    }));
            }
            
            this.logger.debug(`NotificationAgent initialized with ${this.tools.size} tools for ${notificationType} notifications`);
        } catch (error) {
            this.logger.error('Error initializing NotificationAgent tools:', error);
            throw error;
        }
    }
    
    async processTask(taskData) {
        try {
            const { 
                message, 
                type = 'info', 
                channel = 'default', 
                recipient, 
                options = {} 
            } = taskData;
            
            if (!message) {
                throw new Error('Notification message is required');
            }
            
            // Create notification object
            const notification = {
                id: `notification-${Date.now()}`,
                message,
                type,
                channel,
                recipient,
                timestamp: new Date(),
                options
            };
            
            // Add to history
            this.notificationHistory.push(notification);
            
            // Send notification based on type
            let result;
            
            switch (this.config.notificationType) {
                case 'email':
                    result = await this._sendEmailNotification(notification);
                    break;
                    
                case 'sms':
                    result = await this._sendSmsNotification(notification);
                    break;
                    
                case 'slack':
                    result = await this._sendSlackNotification(notification);
                    break;
                    
                default:
                    result = await this._sendConsoleNotification(notification);
            }
            
            return {
                status: 'success',
                notificationId: notification.id,
                delivered: result.delivered,
                metadata: result.metadata
            };
            
        } catch (error) {
            this.logger.error('Error sending notification:', error);
            throw error;
        }
    }
    
    async _sendEmailNotification(notification) {
        const emailTool = this.tools.get('email');
        
        if (!emailTool) {
            throw new Error('Email tool not available');
        }
        
        let retries = 0;
        let error;
        
        while (retries < this.maxRetries) {
            try {
                return await emailTool.execute({
                    action: 'send',
                    to: notification.recipient,
                    subject: notification.options.subject || `Mr. Smith Notification: ${notification.type}`,
                    body: notification.message,
                    html: notification.options.html,
                    attachments: notification.options.attachments
                });
            } catch (err) {
                error = err;
                retries++;
                
                if (retries < this.maxRetries) {
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                }
            }
        }
        
        throw error;
    }
    
    async _sendSmsNotification(notification) {
        const smsTool = this.tools.get('sms');
        
        if (!smsTool) {
            throw new Error('SMS tool not available');
        }
        
        return await smsTool.execute({
            action: 'send',
            to: notification.recipient,
            message: notification.message,
            priority: notification.options.priority || 'normal'
        });
    }
    
    async _sendSlackNotification(notification) {
        const slackTool = this.tools.get('slack');
        
        if (!slackTool) {
            throw new Error('Slack tool not available');
        }
        
        return await slackTool.execute({
            action: 'send',
            channel: notification.channel,
            message: notification.message,
            blocks: notification.options.blocks,
            attachments: notification.options.attachments
        });
    }
    
    async _sendConsoleNotification(notification) {
        const consoleTool = this.tools.get('console');
        
        if (!consoleTool) {
            throw new Error('Console tool not available');
        }
        
        return await consoleTool.execute({
            action: 'log',
            level: notification.type,
            message: notification.message,
            metadata: {
                channel: notification.channel,
                timestamp: notification.timestamp
            }
        });
    }
    
    cleanup() {
        // No special cleanup needed for notifications
        super.cleanup();
    }
}

module.exports = NotificationAgent; 