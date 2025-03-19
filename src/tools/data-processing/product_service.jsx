const ExcelJS = require('exceljs');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ProductService {
    constructor(logger) {
        this.logger = logger;
        this.CLAUDE_API_ENDPOINT = process.env.CLAUDE_API_ENDPOINT;
        this.CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
        this.catalogPath = 'data/product_catalog.xlsx';
        this.requestsPath = 'data/client_requests.xlsx';
        this.deliverablesPath = 'data/client_deliverables.xlsx';
        this.emailsPath = 'data/incoming_emails.xlsx';
        
        // Initialize files if they don't exist
        this._initializeFiles();
    }

    async _initializeFiles() {
        const files = [
            { path: this.catalogPath, sheets: ['Products', 'Services', 'Providers', 'PricingHistory'] },
            { path: this.requestsPath, sheets: ['Requests'] },
            { path: this.deliverablesPath, sheets: ['Deliverables'] },
            { path: this.emailsPath, sheets: ['Emails'] }
        ];

        for (const file of files) {
            if (!fs.existsSync(file.path)) {
                const workbook = new ExcelJS.Workbook();
                
                for (const sheetName of file.sheets) {
                    const worksheet = workbook.addWorksheet(sheetName);
                    
                    // Set up columns based on sheet type
                    if (sheetName === 'Products') {
                        worksheet.columns = [
                            { header: 'ProductID', key: 'productId', width: 15 },
                            { header: 'Name', key: 'name', width: 30 },
                            { header: 'Category', key: 'category', width: 20 },
                            { header: 'Description', key: 'description', width: 50 },
                            { header: 'Provider', key: 'provider', width: 30 },
                            { header: 'CurrentPrice', key: 'currentPrice', width: 15 },
                            { header: 'BulkDiscountThreshold', key: 'bulkDiscountThreshold', width: 20 },
                            { header: 'BulkDiscountPercentage', key: 'bulkDiscountPercentage', width: 20 },
                            { header: 'TransportationCost', key: 'transportationCost', width: 20 },
                            { header: 'LastUpdated', key: 'lastUpdated', width: 20 }
                        ];
                    } else if (sheetName === 'Services') {
                        worksheet.columns = [
                            { header: 'ServiceID', key: 'serviceId', width: 15 },
                            { header: 'Name', key: 'name', width: 30 },
                            { header: 'Category', key: 'category', width: 20 },
                            { header: 'Description', key: 'description', width: 50 },
                            { header: 'Provider', key: 'provider', width: 30 },
                            { header: 'CurrentPrice', key: 'currentPrice', width: 15 },
                            { header: 'ServiceArea', key: 'serviceArea', width: 30 },
                            { header: 'IsInHouse', key: 'isInHouse', width: 10 },
                            { header: 'LastUpdated', key: 'lastUpdated', width: 20 }
                        ];
                    } else if (sheetName === 'Providers') {
                        worksheet.columns = [
                            { header: 'ProviderID', key: 'providerId', width: 15 },
                            { header: 'Name', key: 'name', width: 30 },
                            { header: 'ContactPerson', key: 'contactPerson', width: 30 },
                            { header: 'Email', key: 'email', width: 30 },
                            { header: 'Phone', key: 'phone', width: 20 },
                            { header: 'Address', key: 'address', width: 50 },
                            { header: 'ServiceArea', key: 'serviceArea', width: 30 },
                            { header: 'Rating', key: 'rating', width: 10 }
                        ];
                    } else if (sheetName === 'PricingHistory') {
                        worksheet.columns = [
                            { header: 'ItemID', key: 'itemId', width: 15 },
                            { header: 'ItemType', key: 'itemType', width: 10 },
                            { header: 'Price', key: 'price', width: 15 },
                            { header: 'Date', key: 'date', width: 20 }
                        ];
                    } else if (sheetName === 'Requests') {
                        worksheet.columns = [
                            { header: 'RequestID', key: 'requestId', width: 15 },
                            { header: 'ClientID', key: 'clientId', width: 15 },
                            { header: 'ClientName', key: 'clientName', width: 30 },
                            { header: 'RequestDate', key: 'requestDate', width: 20 },
                            { header: 'ProductServiceRequested', key: 'productServiceRequested', width: 50 },
                            { header: 'Quantity', key: 'quantity', width: 10 },
                            { header: 'Status', key: 'status', width: 15 },
                            { header: 'EstimatedCost', key: 'estimatedCost', width: 15 }
                        ];
                    } else if (sheetName === 'Deliverables') {
                        worksheet.columns = [
                            { header: 'DeliverableID', key: 'deliverableId', width: 15 },
                            { header: 'RequestID', key: 'requestId', width: 15 },
                            { header: 'ClientID', key: 'clientId', width: 15 },
                            { header: 'DeliveryDate', key: 'deliveryDate', width: 20 },
                            { header: 'ProductServiceDelivered', key: 'productServiceDelivered', width: 50 },
                            { header: 'Quantity', key: 'quantity', width: 10 },
                            { header: 'ActualCost', key: 'actualCost', width: 15 },
                            { header: 'ClientCharge', key: 'clientCharge', width: 15 },
                            { header: 'Profit', key: 'profit', width: 15 },
                            { header: 'Status', key: 'status', width: 15 }
                        ];
                    } else if (sheetName === 'Emails') {
                        worksheet.columns = [
                            { header: 'EmailID', key: 'emailId', width: 15 },
                            { header: 'Sender', key: 'sender', width: 30 },
                            { header: 'Subject', key: 'subject', width: 50 },
                            { header: 'ReceiveDate', key: 'receiveDate', width: 20 },
                            { header: 'Content', key: 'content', width: 100 },
                            { header: 'RelevantProducts', key: 'relevantProducts', width: 50 },
                            { header: 'RelevantServices', key: 'relevantServices', width: 50 },
                            { header: 'ProcessedStatus', key: 'processedStatus', width: 15 }
                        ];
                    }
                }
                
                await workbook.xlsx.writeFile(file.path);
                this.logger.info(`Initialized file: ${file.path}`);
            }
        }
    }

    async updateCatalogPrices() {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(this.catalogPath);
            
            const productsSheet = workbook.getWorksheet('Products');
            const servicesSheet = workbook.getWorksheet('Services');
            const pricingHistorySheet = workbook.getWorksheet('PricingHistory');
            
            const today = new Date().toISOString().split('T')[0];
            
            // Update product prices
            productsSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header
                
                // Simulate price update (in real implementation, fetch from provider API)
                const currentPrice = row.getCell('CurrentPrice').value;
                const priceVariation = (Math.random() * 0.1) - 0.05; // -5% to +5%
                const newPrice = currentPrice * (1 + priceVariation);
                
                // Update price
                row.getCell('CurrentPrice').value = parseFloat(newPrice.toFixed(2));
                row.getCell('LastUpdated').value = today;
                
                // Add to pricing history
                pricingHistorySheet.addRow({
                    itemId: row.getCell('ProductID').value,
                    itemType: 'Product',
                    price: parseFloat(newPrice.toFixed(2)),
                    date: today
                });
            });
            
            // Update service prices
            servicesSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header
                
                // Simulate price update
                const currentPrice = row.getCell('CurrentPrice').value;
                const priceVariation = (Math.random() * 0.08) - 0.03; // -3% to +5%
                const newPrice = currentPrice * (1 + priceVariation);
                
                // Update price
                row.getCell('CurrentPrice').value = parseFloat(newPrice.toFixed(2));
                row.getCell('LastUpdated').value = today;
                
                // Add to pricing history
                pricingHistorySheet.addRow({
                    itemId: row.getCell('ServiceID').value,
                    itemType: 'Service',
                    price: parseFloat(newPrice.toFixed(2)),
                    date: today
                });
            });
            
            await workbook.xlsx.writeFile(this.catalogPath);
            this.logger.info('Catalog prices updated successfully');
            
            return true;
        } catch (error) {
            this.logger.error('Error updating catalog prices:', error);
            throw error;
        }
    }

    async processClientRequest(clientId, clientName, productServiceRequested, quantity) {
        try {
            // Generate a unique request ID
            const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            // Find matching products/services in catalog
            const matches = await this._findMatchingItems(productServiceRequested);
            
            // Calculate estimated cost
            const estimatedCost = await this._calculateEstimatedCost(matches, quantity);
            
            // Add request to client_requests.xlsx
            const requestsWorkbook = new ExcelJS.Workbook();
            await requestsWorkbook.xlsx.readFile(this.requestsPath);
            const requestsSheet = requestsWorkbook.getWorksheet('Requests');
            
            requestsSheet.addRow({
                requestId: requestId,
                clientId: clientId,
                clientName: clientName,
                requestDate: new Date().toISOString(),
                productServiceRequested: productServiceRequested,
                quantity: quantity,
                status: 'Pending',
                estimatedCost: estimatedCost
            });
            
            await requestsWorkbook.xlsx.writeFile(this.requestsPath);
            
            this.logger.info(`Client request processed: ${requestId} for ${clientName}`);
            
            return {
                requestId: requestId,
                matches: matches,
                estimatedCost: estimatedCost
            };
        } catch (error) {
            this.logger.error('Error processing client request:', error);
            throw error;
        }
    }

    async _findMatchingItems(requestDescription) {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(this.catalogPath);
            
            const productsSheet = workbook.getWorksheet('Products');
            const servicesSheet = workbook.getWorksheet('Services');
            
            const matches = {
                products: [],
                services: []
            };
            
            // Search for matching products
            productsSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header
                
                const productName = row.getCell('Name').value;
                const productDescription = row.getCell('Description').value;
                const productCategory = row.getCell('Category').value;
                
                // Simple keyword matching (could be enhanced with NLP in production)
                if (
                    this._textContainsKeywords(requestDescription, productName) ||
                    this._textContainsKeywords(requestDescription, productDescription) ||
                    this._textContainsKeywords(requestDescription, productCategory)
                ) {
                    matches.products.push({
                        id: row.getCell('ProductID').value,
                        name: productName,
                        category: productCategory,
                        price: row.getCell('CurrentPrice').value,
                        provider: row.getCell('Provider').value,
                        bulkDiscountThreshold: row.getCell('BulkDiscountThreshold').value,
                        bulkDiscountPercentage: row.getCell('BulkDiscountPercentage').value,
                        transportationCost: row.getCell('TransportationCost').value
                    });
                }
            });
            
            // Search for matching services
            servicesSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header
                
                const serviceName = row.getCell('Name').value;
                const serviceDescription = row.getCell('Description').value;
                const serviceCategory = row.getCell('Category').value;
                
                if (
                    this._textContainsKeywords(requestDescription, serviceName) ||
                    this._textContainsKeywords(requestDescription, serviceDescription) ||
                    this._textContainsKeywords(requestDescription, serviceCategory)
                ) {
                    matches.services.push({
                        id: row.getCell('ServiceID').value,
                        name: serviceName,
                        category: serviceCategory,
                        price: row.getCell('CurrentPrice').value,
                        provider: row.getCell('Provider').value,
                        serviceArea: row.getCell('ServiceArea').value,
                        isInHouse: row.getCell('IsInHouse').value
                    });
                }
            });
            
            return matches;
        } catch (error) {
            this.logger.error('Error finding matching items:', error);
            throw error;
        }
    }

    _textContainsKeywords(text, keywords) {
        if (!text || !keywords) return false;
        
        const textLower = text.toLowerCase();
        const keywordsLower = keywords.toLowerCase();
        
        // Split keywords into individual words
        const keywordArray = keywordsLower.split(/\s+/);
        
        // Check if any keyword is present in the text
        return keywordArray.some(keyword => 
            keyword.length > 3 && textLower.includes(keyword)
        );
    }

    async _calculateEstimatedCost(matches, quantity) {
        let lowestCost = Number.MAX_VALUE;
        
        // Check products
        for (const product of matches.products) {
            let cost = product.price * quantity;
            
            // Apply bulk discount if applicable
            if (quantity >= product.bulkDiscountThreshold) {
                cost = cost * (1 - (product.bulkDiscountPercentage / 100));
            }
            
            // Add transportation cost
            cost += product.transportationCost;
            
            if (cost < lowestCost) {
                lowestCost = cost;
            }
        }
        
        // Check services
        for (const service of matches.services) {
            let cost = service.price * quantity;
            
            // In-house services might have different pricing models
            if (service.isInHouse === 'Yes') {
                // Apply in-house discount (example: 10%)
                cost = cost * 0.9;
            }
            
            if (cost < lowestCost) {
                lowestCost = cost;
            }
        }
        
        return lowestCost === Number.MAX_VALUE ? 0 : parseFloat(lowestCost.toFixed(2));
    }

    async recordDeliverable(requestId, productServiceDelivered, quantity, actualCost, clientCharge) {
        try {
            // Generate a unique deliverable ID
            const deliverableId = `DEL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            // Get client ID from request
            const requestsWorkbook = new ExcelJS.Workbook();
            await requestsWorkbook.xlsx.readFile(this.requestsPath);
            const requestsSheet = requestsWorkbook.getWorksheet('Requests');
            
            let clientId = null;
            requestsSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header
                
                if (row.getCell('RequestID').value === requestId) {
                    clientId = row.getCell('ClientID').value;
                    
                    // Update request status
                    row.getCell('Status').value = 'Fulfilled';
                    return false; // Break the loop
                }
            });
            
            if (!clientId) {
                throw new Error(`Request ID ${requestId} not found`);
            }
            
            await requestsWorkbook.xlsx.writeFile(this.requestsPath);
            
            // Calculate profit
            const profit = clientCharge - actualCost;
            
            // Add deliverable to client_deliverables.xlsx
            const deliverablesWorkbook = new ExcelJS.Workbook();
            await deliverablesWorkbook.xlsx.readFile(this.deliverablesPath);
            const deliverablesSheet = deliverablesWorkbook.getWorksheet('Deliverables');
            
            deliverablesSheet.addRow({
                deliverableId: deliverableId,
                requestId: requestId,
                clientId: clientId,
                deliveryDate: new Date().toISOString(),
                productServiceDelivered: productServiceDelivered,
                quantity: quantity,
                actualCost: actualCost,
                clientCharge: clientCharge,
                profit: profit,
                status: 'Delivered'
            });
            
            await deliverablesWorkbook.xlsx.writeFile(this.deliverablesPath);
            
            this.logger.info(`Deliverable recorded: ${deliverableId} for request ${requestId}`);
            
            return {
                deliverableId: deliverableId,
                profit: profit
            };
        } catch (error) {
            this.logger.error('Error recording deliverable:', error);
            throw error;
        }
    }

    async processIncomingEmail(sender, subject, content) {
        try {
            // Generate a unique email ID
            const emailId = `EMAIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            // Analyze email content for relevant products/services
            const relevantItems = await this._analyzeEmailForRelevance(content);
            
            // Add email to incoming_emails.xlsx
            const emailsWorkbook = new ExcelJS.Workbook();
            await emailsWorkbook.xlsx.readFile(this.emailsPath);
            const emailsSheet = emailsWorkbook.getWorksheet('Emails');
            
            emailsSheet.addRow({
                emailId: emailId,
                sender: sender,
                subject: subject,
                receiveDate: new Date().toISOString(),
                content: content,
                relevantProducts: relevantItems.products.join(', '),
                relevantServices: relevantItems.services.join(', '),
                processedStatus: relevantItems.isRelevant ? 'Relevant' : 'Not Relevant'
            });
            
            await emailsWorkbook.xlsx.writeFile(this.emailsPath);
            
            // If relevant, notify sales agents
            if (relevantItems.isRelevant) {
                this._notifySalesAgents(emailId, sender, subject, relevantItems);
            }
            
            this.logger.info(`Email processed: ${emailId} from ${sender}`);
            
            return {
                emailId: emailId,
                isRelevant: relevantItems.isRelevant,
                relevantItems: relevantItems
            };
        } catch (error) {
            this.logger.error('Error processing incoming email:', error);
            throw error;
        }
    }

    async _analyzeEmailForRelevance(content) {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(this.catalogPath);
            
            const productsSheet = workbook.getWorksheet('Products');
            const servicesSheet = workbook.getWorksheet('Services');
            
            const relevantProducts = [];
            const relevantServices = [];
            
            // Check for product relevance
            productsSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header
                
                const productName = row.getCell('Name').value;
                const productCategory = row.getCell('Category').value;
                
                if (
                    this._textContainsKeywords(content, productName) ||
                    this._textContainsKeywords(content, productCategory)
                ) {
                    relevantProducts.push(productName);
                }
            });
            
            // Check for service relevance
            servicesSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header
                
                const serviceName = row.getCell('Name').value;
                const serviceCategory = row.getCell('Category').value;
                
                if (
                    this._textContainsKeywords(content, serviceName) ||
                    this._textContainsKeywords(content, serviceCategory)
                ) {
                    relevantServices.push(serviceName);
                }
            });
            
            // For more advanced analysis, we could use Claude API here
            // to perform semantic analysis of the email content
            
            return {
                products: relevantProducts,
                services: relevantServices,
                isRelevant: relevantProducts.length > 0 || relevantServices.length > 0
            };
        } catch (error) {
            this.logger.error('Error analyzing email for relevance:', error);
            throw error;
        }
    }

    _notifySalesAgents(emailId, sender, subject, relevantItems) {
        // In a real implementation, this would send notifications to sales agents
        // via email, Slack, or other communication channels
        
        this.logger.info(`Notifying sales agents about relevant email ${emailId} from ${sender}`);
        
        // Example notification data that would be sent
        const notificationData = {
            emailId: emailId,
            sender: sender,
            subject: subject,
            relevantProducts: relevantItems.products,
            relevantServices: relevantItems.services,
            timestamp: new Date().toISOString()
        };
        
        // Log the notification data (in production, this would be sent to agents)
        this.logger.info('Notification data:', notificationData);
        
        return notificationData;
    }

    async generateCatalogReport() {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(this.catalogPath);
            
            const productsSheet = workbook.getWorksheet('Products');
            const servicesSheet = workbook.getWorksheet('Services');
            
            const productCount = productsSheet.rowCount - 1; // Subtract header
            const serviceCount = servicesSheet.rowCount - 1;
            
            let totalProductValue = 0;
            let totalServiceValue = 0;
            
            // Calculate total product value
            productsSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header
                totalProductValue += row.getCell('CurrentPrice').value;
            });
            
            // Calculate total service value
            servicesSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header
                totalServiceValue += row.getCell('CurrentPrice').value;
            });
            
            // Get in-house service providers
            const inHouseServices = [];
            servicesSheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header
                
                if (row.getCell('IsInHouse').value === 'Yes') {
                    inHouseServices.push({
                        name: row.getCell('Name').value,
                        price: row.getCell('CurrentPrice').value,
                        area: row.getCell('ServiceArea').value
                    });
                }
            });
            
            return {
                productCount: productCount,
                serviceCount: serviceCount,
                totalProductValue: totalProductValue,
                totalServiceValue: totalServiceValue,
                inHouseServices: inHouseServices,
                reportDate: new Date().toISOString()
            };
        } catch (error) {
            this.logger.error('Error generating catalog report:', error);
            throw error;
        }
    }

    async searchCatalog(query, type = 'all') {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(this.catalogPath);
            
            const results = {
                products: [],
                services: []
            };
            
            // Search products if requested
            if (type === 'all' || type === 'products') {
                const productsSheet = workbook.getWorksheet('Products');
                
                productsSheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; // Skip header
                    
                    const productName = row.getCell('Name').value;
                    const productDescription = row.getCell('Description').value;
                    const productCategory = row.getCell('Category').value;
                    
                    if (
                        this._textContainsKeywords(productName, query) ||
                        this._textContainsKeywords(productDescription, query) ||
                        this._textContainsKeywords(productCategory, query)
                    ) {
                        results.products.push({
                            id: row.getCell('ProductID').value,
                            name: productName,
                            category: productCategory,
                            price: row.getCell('CurrentPrice').value,
                            provider: row.getCell('Provider').value
                        });
                    }
                });
            }
            
            // Search services if requested
            if (type === 'all' || type === 'services') {
                const servicesSheet = workbook.getWorksheet('Services');
                
                servicesSheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; // Skip header
                    
                    const serviceName = row.getCell('Name').value;
                    const serviceDescription = row.getCell('Description').value;
                    const serviceCategory = row.getCell('Category').value;
                    
                    if (
                        this._textContainsKeywords(serviceName, query) ||
                        this._textContainsKeywords(serviceDescription, query) ||
                        this._textContainsKeywords(serviceCategory, query)
                    ) {
                        results.services.push({
                            id: row.getCell('ServiceID').value,
                            name: serviceName,
                            category: serviceCategory,
                            price: row.getCell('CurrentPrice').value,
                            provider: row.getCell('Provider').value,
                            serviceArea: row.getCell('ServiceArea').value,
                            isInHouse: row.getCell('IsInHouse').value
                        });
                    }
                });
            }
            
            return results;
        } catch (error) {
            this.logger.error('Error searching catalog:', error);
            throw error;
        }
    }
}

module.exports = ProductService;
