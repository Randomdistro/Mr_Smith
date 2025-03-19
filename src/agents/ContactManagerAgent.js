/**
 * ContactManagerAgent - Specialized agent for contact management
 * Responsible for organizing contacts, scheduling, and managing relationships
 */

const Agent = require('../core/Agent');
const uuid = require('uuid');

class ContactManagerAgent extends Agent {
    constructor(mrSmith, config = {}) {
        super(mrSmith, config);
        this.contacts = new Map();
        this.companies = new Map();
        this.relationships = new Map();
        this.meetings = new Map();
    }

    async initializeTools() {
        // Load and initialize contact management tools
        const MeetingAssistantTool = require('../tools/contact-management/meeting_assistant');
        const SalesAgentTool = require('../tools/contact-management/sales_agent.jsx');
        
        this.tools.set('meeting-assistant', new MeetingAssistantTool({
            mrSmith: this.mrSmith,
            agent: this
        }));
        
        this.tools.set('sales-agent', new SalesAgentTool({
            mrSmith: this.mrSmith,
            agent: this
        }));
    }

    async processTask(taskData) {
        const { type, parameters } = taskData;
        
        switch(type) {
            case 'contact-creation':
                return await this.createContact(parameters);
            case 'contact-update':
                return await this.updateContact(parameters);
            case 'meeting-scheduling':
                return await this.scheduleMeeting(parameters);
            case 'meeting-preparation':
                return await this.prepareMeeting(parameters);
            default:
                throw new Error(`Unknown task type: ${type}`);
        }
    }

    async createContact({ contact, companyId }) {
        try {
            if (!contact || !contact.email) {
                throw new Error('Invalid contact data: email is required');
            }
            
            // Generate contact ID if not provided
            const contactId = contact.id || uuid.v4();
            
            // Check if contact already exists
            if (this.contacts.has(contactId)) {
                return {
                    status: 'error',
                    message: 'Contact already exists',
                    contactId
                };
            }
            
            // Create new contact object
            const newContact = {
                id: contactId,
                ...contact,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                companyId: companyId || contact.companyId
            };
            
            // Store the contact
            this.contacts.set(contactId, newContact);
            
            // Associate with company if companyId is provided
            if (newContact.companyId && this.companies.has(newContact.companyId)) {
                const company = this.companies.get(newContact.companyId);
                company.contacts = company.contacts || [];
                company.contacts.push(contactId);
                this.companies.set(newContact.companyId, company);
            }
            
            return {
                status: 'success',
                contactId,
                contact: newContact
            };
        } catch (error) {
            console.error('Error creating contact:', error);
            throw error;
        }
    }

    async updateContact({ contactId, updates }) {
        try {
            if (!contactId || !updates) {
                throw new Error('Invalid parameters: contactId and updates are required');
            }
            
            // Check if contact exists
            if (!this.contacts.has(contactId)) {
                return {
                    status: 'error',
                    message: 'Contact not found',
                    contactId
                };
            }
            
            // Get current contact data
            const contact = this.contacts.get(contactId);
            
            // Update contact
            const updatedContact = {
                ...contact,
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            // Store updated contact
            this.contacts.set(contactId, updatedContact);
            
            return {
                status: 'success',
                contactId,
                contact: updatedContact
            };
        } catch (error) {
            console.error('Error updating contact:', error);
            throw error;
        }
    }

    async scheduleMeeting({ contactIds, dateTime, duration, title, agenda }) {
        try {
            if (!contactIds || !dateTime || !title) {
                throw new Error('Invalid parameters: contactIds, dateTime, and title are required');
            }
            
            // Ensure contactIds is an array
            const participants = Array.isArray(contactIds) ? contactIds : [contactIds];
            
            // Validate that contacts exist
            for (const contactId of participants) {
                if (!this.contacts.has(contactId)) {
                    return {
                        status: 'error',
                        message: `Contact not found: ${contactId}`
                    };
                }
            }
            
            // Generate meeting ID
            const meetingId = uuid.v4();
            
            // Create meeting object
            const meeting = {
                id: meetingId,
                title,
                dateTime,
                duration: duration || 60, // Default to 1 hour
                participants,
                agenda: agenda || '',
                status: 'scheduled',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Store the meeting
            this.meetings.set(meetingId, meeting);
            
            // Use meeting assistant to create calendar invites
            const meetingAssistant = this.tools.get('meeting-assistant');
            await meetingAssistant.execute({
                action: 'create-meeting',
                meeting
            });
            
            return {
                status: 'success',
                meetingId,
                meeting
            };
        } catch (error) {
            console.error('Error scheduling meeting:', error);
            throw error;
        }
    }

    async prepareMeeting({ meetingId }) {
        try {
            if (!meetingId) {
                throw new Error('Invalid parameters: meetingId is required');
            }
            
            // Check if meeting exists
            if (!this.meetings.has(meetingId)) {
                return {
                    status: 'error',
                    message: 'Meeting not found',
                    meetingId
                };
            }
            
            // Get meeting data
            const meeting = this.meetings.get(meetingId);
            
            // Compile participant information
            const participantDetails = [];
            for (const contactId of meeting.participants) {
                if (this.contacts.has(contactId)) {
                    const contact = this.contacts.get(contactId);
                    participantDetails.push(contact);
                }
            }
            
            // Use meeting assistant to generate brief
            const meetingAssistant = this.tools.get('meeting-assistant');
            const brief = await meetingAssistant.execute({
                action: 'generate-brief',
                meeting,
                participants: participantDetails
            });
            
            // Generate talking points
            const talkingPoints = await meetingAssistant.execute({
                action: 'generate-talking-points',
                meeting,
                participants: participantDetails
            });
            
            // Update meeting with brief and talking points
            meeting.brief = brief;
            meeting.talkingPoints = talkingPoints;
            meeting.updatedAt = new Date().toISOString();
            
            // Store updated meeting
            this.meetings.set(meetingId, meeting);
            
            return {
                status: 'success',
                meetingId,
                brief,
                talkingPoints
            };
        } catch (error) {
            console.error('Error preparing meeting:', error);
            throw error;
        }
    }

    getAllContacts() {
        return Array.from(this.contacts.values());
    }

    getContactById(contactId) {
        return this.contacts.get(contactId);
    }

    getAllMeetings() {
        return Array.from(this.meetings.values());
    }

    getMeetingById(meetingId) {
        return this.meetings.get(meetingId);
    }

    getUpcomingMeetings() {
        const now = new Date();
        return Array.from(this.meetings.values())
            .filter(meeting => {
                const meetingDate = new Date(meeting.dateTime);
                return meeting.status === 'scheduled' && meetingDate > now;
            })
            .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    }
}

module.exports = ContactManagerAgent; 