/**
 * Response Matrix Analyzer
 * 
 * This tool analyzes client responses to identify patterns, sentiment,
 * and engagement levels. It helps categorize prospects and determine
 * the most effective follow-up strategies.
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class ResponseMatrixAnalyzer {
    /**
     * Create a new ResponseMatrixAnalyzer instance
     * @param {Object} options - Configuration options
     * @param {Object} options.logger - Logger instance
     * @param {boolean} options.includeNeutral - Whether to include neutral responses in analysis (default: true)
     * @param {Object} options.categories - Custom response categories (optional)
     */
    constructor(options = {}) {
        this.logger = options.logger || console;
        this.includeNeutral = options.includeNeutral !== false;
        
        // Default response categories
        this.categories = options.categories || {
            positive: [
                'interested',
                'yes',
                'definitely',
                'sure',
                'absolutely',
                'positive',
                'sounds good',
                'let\'s do it',
                'tell me more',
                'send me',
                'schedule',
                'meeting',
                'call',
                'demo',
                'trial'
            ],
            negative: [
                'not interested',
                'no',
                'no thanks',
                'pass',
                'decline',
                'not now',
                'not a good fit',
                'too expensive',
                'no budget',
                'already have',
                'using competitor',
                'not a priority',
                'bad timing',
                'don\'t contact',
                'unsubscribe'
            ],
            neutral: [
                'maybe',
                'perhaps',
                'considering',
                'thinking about',
                'review',
                'later',
                'check back',
                'remind me',
                'not sure',
                'need to discuss',
                'will think',
                'might be',
                'possibly',
                'alternative',
                'options'
            ],
            question: [
                'how much',
                'what is',
                'can you',
                'do you',
                'is there',
                'pricing',
                'cost',
                'compare',
                'difference',
                'features',
                'benefit',
                'roi',
                'integration',
                'support',
                'trial'
            ]
        };
        
        // Response scoring weights
        this.weights = {
            positive: 1.0,
            question: 0.8,
            neutral: 0.4,
            negative: -0.2,
            noResponse: -0.5
        };
    }
    
    /**
     * Analyze client responses in a spreadsheet
     * @param {string} spreadsheetPath - Path to the client spreadsheet
     * @param {Object} options - Analysis options
     * @param {string} options.responseColumn - Column containing response text
     * @param {string} options.dateColumn - Column containing response date
     * @param {boolean} options.createNewFile - Whether to create a new file with analysis (default: true)
     * @returns {Promise<Object>} - Analysis results
     */
    async analyzeResponseMatrix(spreadsheetPath, options = {}) {
        this.logger.info(`Analyzing responses in: ${spreadsheetPath}`);
        
        try {
            // Load the workbook
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(spreadsheetPath);
            
            // Get main worksheet
            const worksheet = workbook.getWorksheet(1);
            
            // Get column indices
            const responseColumn = options.responseColumn || 'Response';
            const dateColumn = options.dateColumn || 'Response Date';
            
            // Prepare analysis results
            const results = {
                totalClients: 0,
                analyzed: 0,
                skipped: 0,
                categories: {
                    positive: 0,
                    negative: 0,
                    neutral: 0,
                    question: 0,
                    noResponse: 0
                },
                averageScore: 0,
                recommendations: [],
                byDate: {},
                clients: []
            };
            
            // Find header row
            let headerRowIndex = 0;
            worksheet.eachRow((row, rowNumber) => {
                if (!headerRowIndex) {
                    row.eachCell((cell) => {
                        if (cell.value === responseColumn || cell.value === dateColumn) {
                            headerRowIndex = rowNumber;
                        }
                    });
                }
            });
            
            if (!headerRowIndex) {
                throw new Error(`Could not find header row with columns: ${responseColumn}, ${dateColumn}`);
            }
            
            // Get column indices
            let responseColumnIndex = null;
            let dateColumnIndex = null;
            let companyNameColumnIndex = null;
            let contactNameColumnIndex = null;
            
            worksheet.getRow(headerRowIndex).eachCell((cell, colNumber) => {
                if (cell.value === responseColumn) {
                    responseColumnIndex = colNumber;
                } else if (cell.value === dateColumn) {
                    dateColumnIndex = colNumber;
                } else if (cell.value === 'Company' || cell.value === 'Company Name') {
                    companyNameColumnIndex = colNumber;
                } else if (cell.value === 'Contact' || cell.value === 'Contact Name') {
                    contactNameColumnIndex = colNumber;
                }
            });
            
            if (!responseColumnIndex) {
                throw new Error(`Response column '${responseColumn}' not found in spreadsheet`);
            }
            
            // Prepare to add analysis columns if needed
            const existingHeaders = [];
            worksheet.getRow(headerRowIndex).eachCell((cell) => {
                existingHeaders.push(cell.value);
            });
            
            const newColumns = [
                { header: 'Response Category', key: 'responseCategory' },
                { header: 'Engagement Score', key: 'engagementScore' },
                { header: 'Recommended Action', key: 'recommendedAction' },
                { header: 'Follow-up Priority', key: 'followupPriority' }
            ];
            
            // Add new columns if they don't exist
            let columnIndex = worksheet.columnCount + 1;
            for (const column of newColumns) {
                if (!existingHeaders.includes(column.header)) {
                    const col = worksheet.getColumn(columnIndex);
                    col.header = column.header;
                    col.key = column.key;
                    columnIndex++;
                }
            }
            
            // Get response category and engagement score column indices
            let responseCategoryColumnIndex = null;
            let engagementScoreColumnIndex = null;
            let recommendedActionColumnIndex = null;
            let followupPriorityColumnIndex = null;
            
            worksheet.getRow(headerRowIndex).eachCell((cell, colNumber) => {
                if (cell.value === 'Response Category') {
                    responseCategoryColumnIndex = colNumber;
                } else if (cell.value === 'Engagement Score') {
                    engagementScoreColumnIndex = colNumber;
                } else if (cell.value === 'Recommended Action') {
                    recommendedActionColumnIndex = colNumber;
                } else if (cell.value === 'Follow-up Priority') {
                    followupPriorityColumnIndex = colNumber;
                }
            });
            
            // Process each row (skip header)
            let totalScore = 0;
            let rowIndex = headerRowIndex + 1;
            
            while (rowIndex <= worksheet.rowCount) {
                const row = worksheet.getRow(rowIndex);
                const responseText = row.getCell(responseColumnIndex).value;
                const responseDate = row.getCell(dateColumnIndex)?.value;
                const companyName = companyNameColumnIndex ? row.getCell(companyNameColumnIndex).value : `Company ${rowIndex}`;
                const contactName = contactNameColumnIndex ? row.getCell(contactNameColumnIndex).value : '';
                
                results.totalClients++;
                
                // Process the response
                if (responseText) {
                    // Analyze the response
                    const analysis = this._analyzeResponse(responseText.toString().toLowerCase());
                    const { category, score, action, priority } = analysis;
                    
                    // Update results
                    results.analyzed++;
                    results.categories[category]++;
                    totalScore += score;
                    
                    // Update recommendations if high priority
                    if (priority === 'High') {
                        results.recommendations.push({
                            company: companyName,
                            contact: contactName,
                            response: responseText,
                            category,
                            action
                        });
                    }
                    
                    // Track data by date if available
                    if (responseDate) {
                        let dateStr = '';
                        if (responseDate instanceof Date) {
                            dateStr = responseDate.toISOString().split('T')[0];
                        } else if (typeof responseDate === 'string') {
                            dateStr = responseDate.split('T')[0];
                        }
                        
                        if (dateStr) {
                            if (!results.byDate[dateStr]) {
                                results.byDate[dateStr] = {
                                    total: 0,
                                    positive: 0,
                                    negative: 0,
                                    neutral: 0,
                                    question: 0
                                };
                            }
                            
                            results.byDate[dateStr].total++;
                            results.byDate[dateStr][category]++;
                        }
                    }
                    
                    // Add client to results
                    results.clients.push({
                        company: companyName,
                        contact: contactName,
                        response: responseText,
                        category,
                        score,
                        action,
                        priority
                    });
                    
                    // Update the spreadsheet with analysis
                    if (responseCategoryColumnIndex) {
                        row.getCell(responseCategoryColumnIndex).value = this._formatCategory(category);
                    }
                    
                    if (engagementScoreColumnIndex) {
                        row.getCell(engagementScoreColumnIndex).value = score;
                    }
                    
                    if (recommendedActionColumnIndex) {
                        row.getCell(recommendedActionColumnIndex).value = action;
                    }
                    
                    if (followupPriorityColumnIndex) {
                        row.getCell(followupPriorityColumnIndex).value = priority;
                    }
                } else {
                    // No response
                    results.skipped++;
                    results.categories.noResponse++;
                    
                    // Update the spreadsheet
                    if (responseCategoryColumnIndex) {
                        row.getCell(responseCategoryColumnIndex).value = 'No Response';
                    }
                    
                    if (engagementScoreColumnIndex) {
                        row.getCell(engagementScoreColumnIndex).value = this.weights.noResponse;
                    }
                    
                    if (recommendedActionColumnIndex) {
                        row.getCell(recommendedActionColumnIndex).value = 'Send follow-up email';
                    }
                    
                    if (followupPriorityColumnIndex) {
                        row.getCell(followupPriorityColumnIndex).value = 'Medium';
                    }
                    
                    // Add to clients list
                    results.clients.push({
                        company: companyName,
                        contact: contactName,
                        response: 'No response',
                        category: 'noResponse',
                        score: this.weights.noResponse,
                        action: 'Send follow-up email',
                        priority: 'Medium'
                    });
                }
                
                rowIndex++;
            }
            
            // Calculate average score
            results.averageScore = results.analyzed > 0 ? 
                (totalScore / results.analyzed).toFixed(2) : 0;
            
            // Sort recommendations by priority
            results.recommendations.sort((a, b) => {
                const scoreA = this._getCategoryScore(a.category);
                const scoreB = this._getCategoryScore(b.category);
                return scoreB - scoreA;
            });
            
            // Save the updated workbook
            if (options.createNewFile !== false) {
                // Create new file with analysis results
                const fileDir = path.dirname(spreadsheetPath);
                const fileExt = path.extname(spreadsheetPath);
                const fileName = path.basename(spreadsheetPath, fileExt);
                const newFilePath = path.join(fileDir, `${fileName}_analyzed${fileExt}`);
                
                await workbook.xlsx.writeFile(newFilePath);
                results.analyzedFilePath = newFilePath;
            } else {
                // Update the existing file
                await workbook.xlsx.writeFile(spreadsheetPath);
                results.analyzedFilePath = spreadsheetPath;
            }
            
            // Generate summary report
            const reportPath = this._generateSummaryReport(results, spreadsheetPath);
            results.reportPath = reportPath;
            
            this.logger.info(`Analysis completed for ${spreadsheetPath}`);
            return results;
            
        } catch (error) {
            this.logger.error(`Error analyzing responses in ${spreadsheetPath}:`, error);
            throw error;
        }
    }
    
    /**
     * Analyze a single client response
     * @param {string} responseText - Client response text
     * @returns {Object} - Analysis result
     * @private
     */
    _analyzeResponse(responseText) {
        if (!responseText) {
            return {
                category: 'noResponse',
                score: this.weights.noResponse,
                action: 'Send follow-up email',
                priority: 'Medium'
            };
        }
        
        const text = responseText.toLowerCase();
        
        // Check for each category
        for (const [category, keywords] of Object.entries(this.categories)) {
            for (const keyword of keywords) {
                if (text.includes(keyword.toLowerCase())) {
                    // Found a match
                    const score = this.weights[category];
                    const { action, priority } = this._getActionAndPriority(category, text);
                    
                    return {
                        category,
                        score,
                        action,
                        priority
                    };
                }
            }
        }
        
        // Default to neutral if no match found
        return {
            category: 'neutral',
            score: this.weights.neutral,
            action: 'Monitor and re-engage in 2 weeks',
            priority: 'Medium'
        };
    }
    
    /**
     * Get the recommended action and priority based on response category
     * @param {string} category - Response category
     * @param {string} text - Response text
     * @returns {Object} - Action and priority
     * @private
     */
    _getActionAndPriority(category, text) {
        switch (category) {
            case 'positive':
                if (text.includes('meeting') || text.includes('call') || text.includes('demo')) {
                    return {
                        action: 'Schedule meeting/demo',
                        priority: 'High'
                    };
                }
                return {
                    action: 'Follow up with proposal',
                    priority: 'High'
                };
                
            case 'question':
                return {
                    action: 'Answer questions and provide information',
                    priority: 'High'
                };
                
            case 'neutral':
                return {
                    action: 'Monitor and re-engage in 2 weeks',
                    priority: 'Medium'
                };
                
            case 'negative':
                if (text.includes('expensive') || text.includes('price') || text.includes('cost') || text.includes('budget')) {
                    return {
                        action: 'Share ROI information or alternative packages',
                        priority: 'Medium'
                    };
                } else if (text.includes('competitor') || text.includes('using') || text.includes('already have')) {
                    return {
                        action: 'Add to nurture campaign with competitive differentiators',
                        priority: 'Low'
                    };
                } else if (text.includes('unsubscribe') || text.includes('don\'t contact')) {
                    return {
                        action: 'Remove from contact list',
                        priority: 'Low'
                    };
                }
                return {
                    action: 'Add to nurture campaign',
                    priority: 'Low'
                };
                
            default:
                return {
                    action: 'Send follow-up email',
                    priority: 'Medium'
                };
        }
    }
    
    /**
     * Format a category name for display
     * @param {string} category - Category name
     * @returns {string} - Formatted category name
     * @private
     */
    _formatCategory(category) {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
    
    /**
     * Get the score for a category
     * @param {string} category - Category name
     * @returns {number} - Category score
     * @private
     */
    _getCategoryScore(category) {
        return this.weights[category] || 0;
    }
    
    /**
     * Generate a summary report of the analysis
     * @param {Object} results - Analysis results
     * @param {string} sourcePath - Path to the source spreadsheet
     * @returns {string} - Path to the generated report
     * @private
     */
    _generateSummaryReport(results, sourcePath) {
        try {
            // Determine report path
            const fileDir = path.dirname(sourcePath);
            const fileName = path.basename(sourcePath, path.extname(sourcePath));
            const reportDir = path.join(fileDir, 'reports');
            const reportPath = path.join(reportDir, `${fileName}_analysis_report.txt`);
            
            // Ensure reports directory exists
            if (!fs.existsSync(reportDir)) {
                fs.mkdirSync(reportDir, { recursive: true });
            }
            
            // Generate report content
            let reportContent = `
Response Matrix Analysis Report
==============================
Source: ${sourcePath}
Date: ${new Date().toISOString().split('T')[0]}

SUMMARY
-------
Total clients: ${results.totalClients}
Responses analyzed: ${results.analyzed}
No responses: ${results.categories.noResponse}
Average engagement score: ${results.averageScore}

RESPONSE CATEGORIES
------------------
Positive responses: ${results.categories.positive} (${this._percentage(results.categories.positive, results.totalClients)}%)
Questions: ${results.categories.question} (${this._percentage(results.categories.question, results.totalClients)}%)
Neutral responses: ${results.categories.neutral} (${this._percentage(results.categories.neutral, results.totalClients)}%)
Negative responses: ${results.categories.negative} (${this._percentage(results.categories.negative, results.totalClients)}%)
No responses: ${results.categories.noResponse} (${this._percentage(results.categories.noResponse, results.totalClients)}%)

HIGH PRIORITY FOLLOW-UPS
-----------------------
`;
            
            // Add high priority recommendations
            if (results.recommendations.length > 0) {
                for (const rec of results.recommendations.slice(0, 10)) {
                    reportContent += `- ${rec.company}${rec.contact ? ' (' + rec.contact + ')' : ''}: ${rec.action}\n`;
                }
            } else {
                reportContent += 'No high priority follow-ups identified.\n';
            }
            
            // Add response trend by date if available
            if (Object.keys(results.byDate).length > 0) {
                reportContent += `
RESPONSE TRENDS BY DATE
---------------------
`;
                
                for (const [date, counts] of Object.entries(results.byDate)) {
                    reportContent += `${date}: ${counts.total} responses (`;
                    reportContent += `+${counts.positive} positive, `;
                    reportContent += `?${counts.question} questions, `;
                    reportContent += `~${counts.neutral} neutral, `;
                    reportContent += `-${counts.negative} negative)\n`;
                }
            }
            
            // Add recommended next steps
            reportContent += `
RECOMMENDED NEXT STEPS
--------------------
1. Schedule follow-ups with the ${Math.min(results.recommendations.length, 10)} high priority contacts listed above.
2. Review the ${results.categories.question} question responses to identify common inquiries and improve messaging.
3. Create nurture campaigns for the ${results.categories.neutral} neutral and ${results.categories.negative} negative responses.
`;
            
            if (results.categories.noResponse > 0) {
                reportContent += `4. Send a follow-up campaign to the ${results.categories.noResponse} non-responsive contacts.\n`;
            }
            
            // Write report to file
            fs.writeFileSync(reportPath, reportContent);
            
            return reportPath;
            
        } catch (error) {
            this.logger.error('Error generating summary report:', error);
            return null;
        }
    }
    
    /**
     * Calculate percentage
     * @param {number} part - Part value
     * @param {number} total - Total value
     * @returns {number} - Percentage
     * @private
     */
    _percentage(part, total) {
        return Math.round((part / total) * 100);
    }
    
    /**
     * Extract key phrases from a collection of responses
     * @param {Array<string>} responses - Array of response texts
     * @returns {Object} - Extracted key phrases and their frequencies
     */
    extractKeyPhrases(responses) {
        const phrases = {};
        
        // Simple phrase extraction based on word frequency
        for (const response of responses) {
            if (!response) continue;
            
            const text = response.toLowerCase();
            const words = text.split(/\W+/).filter(word => word.length > 3);
            
            // Count individual words
            for (const word of words) {
                phrases[word] = (phrases[word] || 0) + 1;
            }
            
            // Look for two-word phrases
            for (let i = 0; i < words.length - 1; i++) {
                const phrase = `${words[i]} ${words[i + 1]}`;
                phrases[phrase] = (phrases[phrase] || 0) + 1;
            }
        }
        
        // Filter out common words and low-frequency phrases
        const commonWords = ['this', 'that', 'have', 'with', 'your', 'from', 'will', 'would', 'they', 'them'];
        const filteredPhrases = {};
        
        for (const [phrase, count] of Object.entries(phrases)) {
            if (count < 2) continue; // Ignore single occurrences
            
            if (phrase.includes(' ')) {
                // Keep all multi-word phrases with count >= 2
                filteredPhrases[phrase] = count;
            } else {
                // For single words, filter out common words
                if (!commonWords.includes(phrase)) {
                    filteredPhrases[phrase] = count;
                }
            }
        }
        
        // Sort by frequency
        const sortedPhrases = Object.entries(filteredPhrases)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20) // Top 20 phrases
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
        
        return sortedPhrases;
    }
    
    /**
     * Generate personalized follow-up templates based on response categories
     * @returns {Object} - Follow-up templates for each category
     */
    generateFollowUpTemplates() {
        return {
            positive: {
                subject: 'Next steps following your interest in [Product]',
                body: `Hi [Contact],

Thank you for your positive response regarding [Product]. I'm glad to hear that you're interested in learning more.

Based on your feedback, I'd like to suggest the following next steps:

1. Schedule a personalized demo to show you how [Product] can address your specific needs
2. Connect you with one of our product specialists to answer any technical questions
3. Share case studies from similar companies that have successfully implemented our solution

Would you have 30 minutes this week for a quick call? I've opened up my calendar at [Calendar Link].

Looking forward to continuing our conversation.

Best regards,
[Your Name]`
            },
            question: {
                subject: 'Answers to your questions about [Product]',
                body: `Hi [Contact],

Thank you for your questions about [Product]. I'm happy to provide the information you're looking for.

[Insert specific answers to their questions here]

I've also attached additional resources that might be helpful as you evaluate our solution. 

Would it be helpful to schedule a brief call to discuss these points in more detail? I'm available this week and can work around your schedule.

Best regards,
[Your Name]`
            },
            neutral: {
                subject: 'Additional information about [Product] for your consideration',
                body: `Hi [Contact],

I wanted to follow up on our previous conversation about [Product].

I understand you're still evaluating your options, so I thought I'd share some additional information that might be helpful in your decision-making process:

• [Relevant benefit or feature based on their industry]
• [Recent update or improvement to the product]
• [Customer success story or testimonial]

I'm here to answer any questions you might have or provide any additional information that would be helpful.

Would it make sense to reconnect in two weeks to discuss where you are in your evaluation process?

Best regards,
[Your Name]`
            },
            negative: {
                subject: 'Touching base regarding [Product]',
                body: `Hi [Contact],

Thank you for your feedback regarding [Product]. I appreciate your honesty about your current situation.

I understand that [timing/budget/fit] is a concern right now. Many of our customers had similar concerns initially but found value in our solution because:

• [Value proposition 1]
• [Value proposition 2]
• [Value proposition 3]

Would it be helpful if I shared some alternative options that might better align with your current needs? Or would you prefer that I check back with you in [3-6 months]?

Regardless, I'm here as a resource if your situation changes or if you have any questions in the future.

Best regards,
[Your Name]`
            },
            noResponse: {
                subject: 'Following up on [Product]',
                body: `Hi [Contact],

I hope this email finds you well. I wanted to follow up on my previous message about how [Product] could help [Company Name] with [key benefit].

I understand that you're likely busy, so I'll keep this brief. Our solution has helped companies like yours achieve [specific outcome] by [how it works].

If you're interested in learning more:

• Here's a quick 2-minute overview video: [Video Link]
• You can schedule a brief call directly on my calendar: [Calendar Link]
• Or simply reply to this email with any questions

If this isn't a priority right now, no problem. Would it be better if I reached out again in a few weeks?

Best regards,
[Your Name]`
            }
        };
    }
}

module.exports = ResponseMatrixAnalyzer; 