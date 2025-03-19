/**
 * Opportunity Score Calculator
 * 
 * This tool evaluates prospects and assigns opportunity scores based on 
 * engagement history, company attributes, and buying signals.
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class OpportunityScorer {
    /**
     * Create a new OpportunityScorer instance
     * @param {Object} options - Configuration options
     * @param {Object} options.logger - Logger instance
     * @param {Object} options.weights - Custom scoring weights (optional)
     * @param {Object} options.thresholds - Custom score thresholds (optional)
     * @param {Array} options.buyingSignals - Custom buying signals (optional)
     */
    constructor(options = {}) {
        this.logger = options.logger || console;
        
        // Default scoring weights for different factors
        this.weights = options.weights || {
            // Company attributes (40%)
            companySize: 10,
            revenue: 10, 
            industry: 10,
            growthRate: 10,
            
            // Engagement metrics (40%)
            recentActivity: 15,
            responseRate: 10,
            clickRate: 5,
            meetingAttendance: 10,
            
            // Buying signals (20%)
            explicitInterest: 10,
            implicitInterest: 5,
            budgetDiscussion: 5
        };
        
        // Verify weights add up to 100
        const totalWeight = Object.values(this.weights).reduce((sum, weight) => sum + weight, 0);
        if (totalWeight !== 100) {
            this.logger.warn(`Scoring weights total ${totalWeight}, not 100. This may cause unexpected results.`);
        }
        
        // Score thresholds for opportunity classification
        this.thresholds = options.thresholds || {
            hot: 80,     // 80-100: Hot opportunity
            warm: 60,    // 60-79: Warm opportunity
            lukewarm: 40, // 40-59: Lukewarm opportunity
            cold: 20     // 0-19: Cold opportunity, 20-39: Cool opportunity
        };
        
        // Buying signals to look for in prospect interactions
        this.buyingSignals = options.buyingSignals || [
            // Explicit interest signals
            'demo request',
            'pricing',
            'quote',
            'proposal',
            'trial',
            'budget',
            'decision timeline',
            'decision maker',
            'purchase',
            'contract',
            
            // Implicit interest signals
            'roi',
            'implementation',
            'integration',
            'competitor',
            'versus',
            'vs.',
            'comparison',
            'case study',
            'testimonial',
            'user',
            'alternatives',
            'options'
        ];
    }
    
    /**
     * Calculate opportunity scores for prospects in a spreadsheet
     * @param {string} spreadsheetPath - Path to the prospect spreadsheet
     * @param {Object} options - Processing options
     * @param {Array} options.requiredColumns - Required column headers
     * @param {boolean} options.createNewFile - Whether to create a new file with scores (default: true)
     * @returns {Promise<Object>} - Scoring results
     */
    async calculateOpportunityScores(spreadsheetPath, options = {}) {
        this.logger.info(`Calculating opportunity scores for prospects in: ${spreadsheetPath}`);
        
        try {
            // Required columns for scoring
            const requiredColumns = options.requiredColumns || [
                'Company',
                'Industry',
                'Company Size',
                'Revenue Range',
                'Response History'
            ];
            
            // Load the workbook
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(spreadsheetPath);
            
            // Get main worksheet
            const worksheet = workbook.getWorksheet(1);
            
            // Verify required columns exist
            this._verifyRequiredColumns(worksheet, requiredColumns);
            
            // Prepare results object to track scoring
            const results = {
                totalProspects: 0,
                scoredProspects: 0,
                skipped: 0,
                categories: {
                    hot: 0,
                    warm: 0,
                    lukewarm: 0,
                    cool: 0,
                    cold: 0
                },
                topOpportunities: [],
                prospects: []
            };
            
            // Find column indices for required fields
            const columnIndices = this._getColumnIndices(worksheet);
            
            // Add score columns if they don't exist
            this._addScoreColumns(worksheet, columnIndices);
            
            // Process each row (skip header)
            let rowIndex = 2; // Assuming first row is header
            while (rowIndex <= worksheet.rowCount) {
                const row = worksheet.getRow(rowIndex);
                
                // Skip empty rows
                if (!row.getCell(1).value) {
                    rowIndex++;
                    continue;
                }
                
                results.totalProspects++;
                
                try {
                    // Extract prospect data
                    const prospect = this._extractProspectData(row, columnIndices);
                    
                    // Calculate opportunity score
                    const scoreDetails = this._calculateScore(prospect);
                    const { score, category, breakdown } = scoreDetails;
                    
                    // Update results
                    results.scoredProspects++;
                    results.categories[category]++;
                    
                    // Add prospect to results
                    const prospectWithScore = {
                        ...prospect,
                        score,
                        category,
                        breakdown
                    };
                    
                    results.prospects.push(prospectWithScore);
                    
                    // Add to top opportunities if it's a good opportunity
                    if (category === 'hot' || category === 'warm') {
                        results.topOpportunities.push(prospectWithScore);
                    }
                    
                    // Update the spreadsheet with scores
                    this._updateRowWithScores(row, columnIndices, scoreDetails);
                    
                } catch (error) {
                    this.logger.warn(`Skipped prospect at row ${rowIndex}: ${error.message}`);
                    results.skipped++;
                }
                
                rowIndex++;
            }
            
            // Sort top opportunities by score
            results.topOpportunities.sort((a, b) => b.score - a.score);
            
            // Save the updated workbook
            if (options.createNewFile !== false) {
                // Create new file with scores
                const fileDir = path.dirname(spreadsheetPath);
                const fileExt = path.extname(spreadsheetPath);
                const fileName = path.basename(spreadsheetPath, fileExt);
                const newFilePath = path.join(fileDir, `${fileName}_scored${fileExt}`);
                
                await workbook.xlsx.writeFile(newFilePath);
                results.scoredFilePath = newFilePath;
            } else {
                // Update the existing file
                await workbook.xlsx.writeFile(spreadsheetPath);
                results.scoredFilePath = spreadsheetPath;
            }
            
            // Generate summary report
            const reportPath = this._generateSummaryReport(results, spreadsheetPath);
            results.reportPath = reportPath;
            
            this.logger.info(`Opportunity scoring completed for ${spreadsheetPath}`);
            return results;
            
        } catch (error) {
            this.logger.error(`Error calculating opportunity scores in ${spreadsheetPath}:`, error);
            throw error;
        }
    }
    
    /**
     * Verify that required columns exist in the worksheet
     * @param {Object} worksheet - ExcelJS worksheet
     * @param {Array} requiredColumns - Array of required column headers
     * @throws {Error} If required columns are missing
     * @private
     */
    _verifyRequiredColumns(worksheet, requiredColumns) {
        const headers = [];
        worksheet.getRow(1).eachCell((cell) => {
            headers.push(cell.value);
        });
        
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
            throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
        }
    }
    
    /**
     * Get column indices for various fields
     * @param {Object} worksheet - ExcelJS worksheet
     * @returns {Object} Object mapping field names to column indices
     * @private
     */
    _getColumnIndices(worksheet) {
        const indices = {};
        
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            indices[cell.value] = colNumber;
        });
        
        return indices;
    }
    
    /**
     * Add score columns to the worksheet if they don't exist
     * @param {Object} worksheet - ExcelJS worksheet
     * @param {Object} columnIndices - Object mapping field names to column indices
     * @private
     */
    _addScoreColumns(worksheet, columnIndices) {
        // Columns to add
        const scoreColumns = [
            { header: 'Opportunity Score', key: 'opportunityScore' },
            { header: 'Opportunity Category', key: 'opportunityCategory' },
            { header: 'Next Action', key: 'nextAction' },
            { header: 'Priority', key: 'priority' }
        ];
        
        // Check which columns already exist
        const existingColumns = Object.keys(columnIndices);
        
        // Add missing columns
        let columnIndex = worksheet.columnCount + 1;
        for (const column of scoreColumns) {
            if (!existingColumns.includes(column.header)) {
                const col = worksheet.getColumn(columnIndex);
                col.header = column.header;
                col.key = column.key;
                columnIndices[column.header] = columnIndex;
                columnIndex++;
            }
        }
    }
    
    /**
     * Extract prospect data from a row
     * @param {Object} row - ExcelJS row
     * @param {Object} columnIndices - Column indices mapping
     * @returns {Object} Extracted prospect data
     * @private
     */
    _extractProspectData(row, columnIndices) {
        const prospect = {
            company: row.getCell(columnIndices['Company']).value,
            industry: columnIndices['Industry'] ? row.getCell(columnIndices['Industry']).value : null,
            companySize: columnIndices['Company Size'] ? row.getCell(columnIndices['Company Size']).value : null,
            revenue: columnIndices['Revenue Range'] ? row.getCell(columnIndices['Revenue Range']).value : null,
            responseHistory: columnIndices['Response History'] ? row.getCell(columnIndices['Response History']).value : null,
            lastContact: columnIndices['Last Contact Date'] ? row.getCell(columnIndices['Last Contact Date']).value : null,
            totalInteractions: columnIndices['Total Interactions'] ? row.getCell(columnIndices['Total Interactions']).value : 0,
            meetings: columnIndices['Meetings'] ? row.getCell(columnIndices['Meetings']).value : 0,
            lastResponse: columnIndices['Last Response'] ? row.getCell(columnIndices['Last Response']).value : null,
            notes: columnIndices['Notes'] ? row.getCell(columnIndices['Notes']).value : null
        };
        
        // Extract buying signals from notes and responses
        prospect.buyingSignals = this._extractBuyingSignals(prospect);
        
        return prospect;
    }
    
    /**
     * Extract buying signals from prospect data
     * @param {Object} prospect - Prospect data
     * @returns {Object} Extracted buying signals
     * @private
     */
    _extractBuyingSignals(prospect) {
        const signals = {
            explicit: [],
            implicit: []
        };
        
        // Text fields to check for buying signals
        const textToCheck = [
            prospect.responseHistory,
            prospect.lastResponse,
            prospect.notes
        ].filter(Boolean).map(text => text.toString().toLowerCase());
        
        if (textToCheck.length > 0) {
            const combinedText = textToCheck.join(' ');
            
            // Check for explicit buying signals (first half of signals list)
            const explicitSignals = this.buyingSignals.slice(0, this.buyingSignals.length / 2);
            for (const signal of explicitSignals) {
                if (combinedText.includes(signal.toLowerCase())) {
                    signals.explicit.push(signal);
                }
            }
            
            // Check for implicit buying signals (second half of signals list)
            const implicitSignals = this.buyingSignals.slice(this.buyingSignals.length / 2);
            for (const signal of implicitSignals) {
                if (combinedText.includes(signal.toLowerCase())) {
                    signals.implicit.push(signal);
                }
            }
        }
        
        return signals;
    }
    
    /**
     * Calculate opportunity score for a prospect
     * @param {Object} prospect - Prospect data
     * @returns {Object} Score details including total score, category, and breakdown
     * @private
     */
    _calculateScore(prospect) {
        const scoreBreakdown = {
            companyAttributes: 0,
            engagement: 0,
            buyingSignals: 0
        };
        
        // Score company attributes
        scoreBreakdown.companyAttributes = this._scoreCompanyAttributes(prospect);
        
        // Score engagement metrics
        scoreBreakdown.engagement = this._scoreEngagement(prospect);
        
        // Score buying signals
        scoreBreakdown.buyingSignals = this._scoreBuyingSignals(prospect);
        
        // Calculate total score (0-100)
        const totalScore = Math.min(100, Math.max(0, 
            scoreBreakdown.companyAttributes + 
            scoreBreakdown.engagement + 
            scoreBreakdown.buyingSignals
        ));
        
        // Determine opportunity category
        let category;
        if (totalScore >= this.thresholds.hot) {
            category = 'hot';
        } else if (totalScore >= this.thresholds.warm) {
            category = 'warm';
        } else if (totalScore >= this.thresholds.lukewarm) {
            category = 'lukewarm';
        } else if (totalScore >= this.thresholds.cold) {
            category = 'cool';
        } else {
            category = 'cold';
        }
        
        // Determine next action based on category
        const nextAction = this._determineNextAction(category, prospect);
        
        // Determine priority
        const priority = this._determinePriority(totalScore);
        
        return {
            score: Math.round(totalScore),
            category,
            breakdown: scoreBreakdown,
            nextAction,
            priority
        };
    }
    
    /**
     * Score company attributes
     * @param {Object} prospect - Prospect data
     * @returns {number} Attribute score component
     * @private
     */
    _scoreCompanyAttributes(prospect) {
        let score = 0;
        
        // Score company size
        if (prospect.companySize) {
            const sizeScore = this._scoreCompanySize(prospect.companySize);
            score += sizeScore * (this.weights.companySize / 10);
        }
        
        // Score revenue
        if (prospect.revenue) {
            const revenueScore = this._scoreRevenue(prospect.revenue);
            score += revenueScore * (this.weights.revenue / 10);
        }
        
        // Score industry
        if (prospect.industry) {
            const industryScore = this._scoreIndustry(prospect.industry);
            score += industryScore * (this.weights.industry / 10);
        }
        
        // Growth rate would be scored here if available
        
        return score;
    }
    
    /**
     * Score company size
     * @param {string} companySize - Company size string
     * @returns {number} Score from 0-10
     * @private
     */
    _scoreCompanySize(companySize) {
        const size = companySize.toString().toLowerCase();
        
        if (size.includes('enterprise') || size.includes('10,000+') || size.includes('large')) {
            return 10;
        } else if (size.includes('mid-market') || size.includes('1,000') || size.includes('medium')) {
            return 8;
        } else if (size.includes('500') || size.includes('small to medium')) {
            return 6;
        } else if (size.includes('small') || size.includes('100')) {
            return 4;
        } else if (size.includes('startup') || size.includes('micro') || size.includes('1-')) {
            return 2;
        } else {
            return 5; // Middle score for unknown
        }
    }
    
    /**
     * Score company revenue
     * @param {string} revenue - Revenue range string
     * @returns {number} Score from 0-10
     * @private
     */
    _scoreRevenue(revenue) {
        const rev = revenue.toString().toLowerCase();
        
        if (rev.includes('$1b') || rev.includes('billion') || rev.includes('1000m')) {
            return 10;
        } else if (rev.includes('$500m') || rev.includes('$999m')) {
            return 9;
        } else if (rev.includes('$100m') || rev.includes('$499m')) {
            return 8;
        } else if (rev.includes('$50m') || rev.includes('$99m')) {
            return 7;
        } else if (rev.includes('$10m') || rev.includes('$49m')) {
            return 6;
        } else if (rev.includes('$5m') || rev.includes('$9m')) {
            return 5;
        } else if (rev.includes('$1m') || rev.includes('$4m')) {
            return 4;
        } else if (rev.includes('$500k') || rev.includes('$999k')) {
            return 3;
        } else if (rev.includes('$100k') || rev.includes('$499k')) {
            return 2;
        } else if (rev.includes('<$100k') || rev.includes('under')) {
            return 1;
        } else {
            return 5; // Middle score for unknown
        }
    }
    
    /**
     * Score company industry
     * @param {string} industry - Industry string
     * @returns {number} Score from 0-10
     * @private
     */
    _scoreIndustry(industry) {
        // These would be configured based on your target industries
        const targetIndustries = [
            'Technology', 'Software', 'SaaS', 'Finance', 'Banking', 
            'Healthcare', 'Insurance', 'Manufacturing', 'Retail', 'E-commerce'
        ];
        
        const secondaryIndustries = [
            'Education', 'Government', 'Non-profit', 'Construction', 'Real Estate',
            'Transportation', 'Logistics', 'Energy', 'Telecommunications'
        ];
        
        const ind = industry.toString();
        
        // Check if it's a primary target industry
        for (const target of targetIndustries) {
            if (ind.includes(target)) {
                return 10;
            }
        }
        
        // Check if it's a secondary target industry
        for (const secondary of secondaryIndustries) {
            if (ind.includes(secondary)) {
                return 7;
            }
        }
        
        // Default for other industries
        return 4;
    }
    
    /**
     * Score engagement metrics
     * @param {Object} prospect - Prospect data
     * @returns {number} Engagement score component
     * @private
     */
    _scoreEngagement(prospect) {
        let score = 0;
        
        // Score recency of activity
        if (prospect.lastContact) {
            const recencyScore = this._scoreRecency(prospect.lastContact);
            score += recencyScore * (this.weights.recentActivity / 10);
        }
        
        // Score response history
        if (prospect.responseHistory) {
            const responseScore = this._scoreResponseHistory(prospect.responseHistory);
            score += responseScore * (this.weights.responseRate / 10);
        }
        
        // Score meetings
        if (prospect.meetings) {
            const meetingScore = prospect.meetings > 0 ? 10 : 0;
            score += meetingScore * (this.weights.meetingAttendance / 10);
        }
        
        // Score total interactions (as proxy for click rate)
        if (prospect.totalInteractions) {
            const interactionScore = Math.min(10, prospect.totalInteractions);
            score += interactionScore * (this.weights.clickRate / 10);
        }
        
        return score;
    }
    
    /**
     * Score recency of last contact
     * @param {Date|string} lastContact - Last contact date
     * @returns {number} Score from 0-10
     * @private
     */
    _scoreRecency(lastContact) {
        if (!lastContact) return 0;
        
        const contactDate = new Date(lastContact);
        const now = new Date();
        const daysSinceContact = Math.floor((now - contactDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceContact <= 7) {
            return 10; // Within last week
        } else if (daysSinceContact <= 14) {
            return 8; // Within last two weeks
        } else if (daysSinceContact <= 30) {
            return 6; // Within last month
        } else if (daysSinceContact <= 60) {
            return 4; // Within last two months
        } else if (daysSinceContact <= 90) {
            return 2; // Within last three months
        } else {
            return 0; // More than three months
        }
    }
    
    /**
     * Score response history
     * @param {string} responseHistory - Response history text
     * @returns {number} Score from 0-10
     * @private
     */
    _scoreResponseHistory(responseHistory) {
        if (!responseHistory) return 0;
        
        const responseText = responseHistory.toString().toLowerCase();
        
        // Count positive responses
        const positiveIndicators = ['interested', 'yes', 'sure', 'sounds good', 'tell me more'];
        let positiveCount = 0;
        
        for (const indicator of positiveIndicators) {
            if (responseText.includes(indicator)) {
                positiveCount++;
            }
        }
        
        return Math.min(10, positiveCount * 2);
    }
    
    /**
     * Score buying signals
     * @param {Object} prospect - Prospect data
     * @returns {number} Buying signals score component
     * @private
     */
    _scoreBuyingSignals(prospect) {
        let score = 0;
        
        // Score explicit buying signals
        if (prospect.buyingSignals && prospect.buyingSignals.explicit) {
            const explicitCount = prospect.buyingSignals.explicit.length;
            const explicitScore = Math.min(10, explicitCount * 3);
            score += explicitScore * (this.weights.explicitInterest / 10);
        }
        
        // Score implicit buying signals
        if (prospect.buyingSignals && prospect.buyingSignals.implicit) {
            const implicitCount = prospect.buyingSignals.implicit.length;
            const implicitScore = Math.min(10, implicitCount * 2);
            score += implicitScore * (this.weights.implicitInterest / 10);
        }
        
        // Score budget discussion
        if (prospect.buyingSignals && 
            (prospect.buyingSignals.explicit.includes('budget') || 
             prospect.buyingSignals.explicit.includes('pricing') ||
             prospect.buyingSignals.explicit.includes('quote'))) {
            score += this.weights.budgetDiscussion;
        }
        
        return score;
    }
    
    /**
     * Determine next action based on opportunity category
     * @param {string} category - Opportunity category
     * @param {Object} prospect - Prospect data
     * @returns {string} Recommended next action
     * @private
     */
    _determineNextAction(category, prospect) {
        switch (category) {
            case 'hot':
                if (prospect.buyingSignals.explicit.includes('demo request')) {
                    return 'Schedule demo';
                } else if (prospect.buyingSignals.explicit.includes('pricing')) {
                    return 'Send proposal';
                } else {
                    return 'Request meeting';
                }
                
            case 'warm':
                if (prospect.meetings > 0) {
                    return 'Follow up with case studies';
                } else {
                    return 'Invite to product webinar';
                }
                
            case 'lukewarm':
                return 'Send relevant content';
                
            case 'cool':
                return 'Add to nurture campaign';
                
            case 'cold':
                return 'Re-engage in 90 days';
                
            default:
                return 'Review and qualify';
        }
    }
    
    /**
     * Determine priority level based on score
     * @param {number} score - Opportunity score
     * @returns {string} Priority level
     * @private
     */
    _determinePriority(score) {
        if (score >= 80) {
            return 'High';
        } else if (score >= 60) {
            return 'Medium-High';
        } else if (score >= 40) {
            return 'Medium';
        } else if (score >= 20) {
            return 'Medium-Low';
        } else {
            return 'Low';
        }
    }
    
    /**
     * Update a spreadsheet row with opportunity scores
     * @param {Object} row - ExcelJS row
     * @param {Object} columnIndices - Object mapping field names to column indices
     * @param {Object} scoreDetails - Score details object
     * @private
     */
    _updateRowWithScores(row, columnIndices, scoreDetails) {
        const { score, category, nextAction, priority } = scoreDetails;
        
        // Update score column
        if (columnIndices['Opportunity Score']) {
            row.getCell(columnIndices['Opportunity Score']).value = score;
        }
        
        // Update category column
        if (columnIndices['Opportunity Category']) {
            row.getCell(columnIndices['Opportunity Category']).value = this._formatCategory(category);
        }
        
        // Update next action column
        if (columnIndices['Next Action']) {
            row.getCell(columnIndices['Next Action']).value = nextAction;
        }
        
        // Update priority column
        if (columnIndices['Priority']) {
            row.getCell(columnIndices['Priority']).value = priority;
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
     * Generate a summary report of the opportunity scoring
     * @param {Object} results - Scoring results
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
            const reportPath = path.join(reportDir, `${fileName}_opportunity_report.txt`);
            
            // Ensure reports directory exists
            if (!fs.existsSync(reportDir)) {
                fs.mkdirSync(reportDir, { recursive: true });
            }
            
            // Generate report content
            let reportContent = `
Opportunity Scoring Report
=========================
Source: ${sourcePath}
Date: ${new Date().toISOString().split('T')[0]}

SUMMARY
-------
Total prospects: ${results.totalProspects}
Scored prospects: ${results.scoredProspects}
Skipped: ${results.skipped}

OPPORTUNITY CATEGORIES
--------------------
Hot opportunities: ${results.categories.hot} (${this._percentage(results.categories.hot, results.totalProspects)}%)
Warm opportunities: ${results.categories.warm} (${this._percentage(results.categories.warm, results.totalProspects)}%)
Lukewarm opportunities: ${results.categories.lukewarm} (${this._percentage(results.categories.lukewarm, results.totalProspects)}%)
Cool opportunities: ${results.categories.cool} (${this._percentage(results.categories.cool, results.totalProspects)}%)
Cold opportunities: ${results.categories.cold} (${this._percentage(results.categories.cold, results.totalProspects)}%)

TOP OPPORTUNITIES
---------------
`;
            
            // Add top opportunities
            if (results.topOpportunities.length > 0) {
                const topTen = results.topOpportunities.slice(0, 10);
                for (const [index, opportunity] of topTen.entries()) {
                    reportContent += `${index + 1}. ${opportunity.company} (${opportunity.score} points, ${this._formatCategory(opportunity.category)})\n`;
                    reportContent += `   Next action: ${opportunity.nextAction}\n`;
                    
                    if (opportunity.buyingSignals && opportunity.buyingSignals.explicit.length > 0) {
                        reportContent += `   Buying signals: ${opportunity.buyingSignals.explicit.join(', ')}\n`;
                    }
                    
                    reportContent += '\n';
                }
            } else {
                reportContent += 'No hot or warm opportunities identified.\n';
            }
            
            // Add recommended next steps
            reportContent += `
RECOMMENDED FOCUS
---------------
1. Prioritize the ${results.categories.hot} hot opportunities for immediate follow-up.
2. Schedule follow-up activities for the ${results.categories.warm} warm opportunities within the next week.
3. Develop nurture campaigns for the ${results.categories.lukewarm} lukewarm and ${results.categories.cool} cool opportunities.
`;
            
            if (results.categories.cold > 0) {
                reportContent += `4. Review the ${results.categories.cold} cold opportunities to determine if they should be kept in the pipeline.\n`;
            }
            
            // Write report to file
            fs.writeFileSync(reportPath, reportContent);
            
            return reportPath;
            
        } catch (error) {
            this.logger.error('Error generating opportunity report:', error);
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
     * Generate suggested actions for a list of prospects
     * @param {Array} prospects - Array of scored prospects
     * @returns {Object} - Suggested actions grouped by priority
     */
    generateSuggestedActions(prospects) {
        const actions = {
            highPriority: [],
            mediumPriority: [],
            lowPriority: []
        };
        
        for (const prospect of prospects) {
            const action = {
                company: prospect.company,
                score: prospect.score,
                category: prospect.category,
                action: prospect.nextAction || this._determineNextAction(prospect.category, prospect),
                dueDate: this._suggestDueDate(prospect.category)
            };
            
            if (prospect.category === 'hot' || prospect.score >= 80) {
                actions.highPriority.push(action);
            } else if (prospect.category === 'warm' || prospect.score >= 50) {
                actions.mediumPriority.push(action);
            } else {
                actions.lowPriority.push(action);
            }
        }
        
        // Sort each priority list by score
        actions.highPriority.sort((a, b) => b.score - a.score);
        actions.mediumPriority.sort((a, b) => b.score - a.score);
        actions.lowPriority.sort((a, b) => b.score - a.score);
        
        return actions;
    }
    
    /**
     * Suggest a due date based on opportunity category
     * @param {string} category - Opportunity category
     * @returns {string} - Suggested due date
     * @private
     */
    _suggestDueDate(category) {
        const today = new Date();
        let dueDate;
        
        switch (category) {
            case 'hot':
                // Due in 1-2 business days
                dueDate = new Date(today);
                dueDate.setDate(dueDate.getDate() + 2);
                break;
                
            case 'warm':
                // Due in one week
                dueDate = new Date(today);
                dueDate.setDate(dueDate.getDate() + 7);
                break;
                
            case 'lukewarm':
                // Due in two weeks
                dueDate = new Date(today);
                dueDate.setDate(dueDate.getDate() + 14);
                break;
                
            case 'cool':
                // Due in four weeks
                dueDate = new Date(today);
                dueDate.setDate(dueDate.getDate() + 28);
                break;
                
            case 'cold':
                // Due in 90 days
                dueDate = new Date(today);
                dueDate.setDate(dueDate.getDate() + 90);
                break;
                
            default:
                // Default to one week
                dueDate = new Date(today);
                dueDate.setDate(dueDate.getDate() + 7);
        }
        
        return dueDate.toISOString().split('T')[0];
    }
}

module.exports = OpportunityScorer; 