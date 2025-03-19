/**
 * EventBus - Central Event Communication System
 * Manages event-driven communication between system components
 */

const EventEmitter = require('events');

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.subscribers = new Map();
        this.eventHistory = [];
        this.maxHistorySize = 1000;
    }

    subscribe(eventName, subscriber, callback) {
        if (!this.subscribers.has(eventName)) {
            this.subscribers.set(eventName, new Set());
        }
        this.subscribers.get(eventName).add(subscriber);
        this.on(eventName, callback);
    }

    unsubscribe(eventName, subscriber) {
        if (this.subscribers.has(eventName)) {
            this.subscribers.get(eventName).delete(subscriber);
        }
        this.removeAllListeners(eventName);
    }

    emit(eventName, data) {
        // Add to event history
        this.addToHistory(eventName, data);
        
        // Emit the event
        super.emit(eventName, data);
    }

    addToHistory(eventName, data) {
        const event = {
            timestamp: new Date(),
            eventName,
            data
        };

        this.eventHistory.push(event);

        // Maintain history size limit
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }

    getEventHistory(eventName = null) {
        if (eventName) {
            return this.eventHistory.filter(event => event.eventName === eventName);
        }
        return [...this.eventHistory];
    }

    getSubscribers(eventName) {
        return this.subscribers.has(eventName) 
            ? Array.from(this.subscribers.get(eventName))
            : [];
    }

    clearHistory() {
        this.eventHistory = [];
    }

    async broadcast(eventName, data) {
        const subscribers = this.getSubscribers(eventName);
        const promises = subscribers.map(subscriber => 
            this.emit(eventName, { subscriber, data })
        );
        await Promise.all(promises);
    }

    // Utility methods for common event patterns
    async emitWithRetry(eventName, data, maxRetries = 3) {
        let attempts = 0;
        while (attempts < maxRetries) {
            try {
                await this.emit(eventName, data);
                return true;
            } catch (error) {
                attempts++;
                if (attempts === maxRetries) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
        }
    }

    // Event filtering and monitoring
    filterEvents(predicate) {
        return this.eventHistory.filter(predicate);
    }

    getEventCount(eventName) {
        return this.eventHistory.filter(event => event.eventName === eventName).length;
    }

    getRecentEvents(limit = 10) {
        return this.eventHistory.slice(-limit);
    }
}

module.exports = EventBus; 