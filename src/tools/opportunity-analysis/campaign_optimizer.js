const ExcelJS = require('exceljs');
const axios = require('axios');
const moment = require('moment');

/**
 * EmailCampaignOptimizer - A class for analyzing and optimizing email marketing campaigns
 * Provides tools for tracking performance metrics, A/B testing, and generating recommendations
 */
class EmailCampaignOptimizer {
    constructor(logger) {
        this.logger = logger;
        this.CLAUDE_API_ENDPOINT = process.env.CLAUDE_API_ENDPOINT;
        this.CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    }

    /**
     * Analyze campaign performance from a spreadsheet
     * @param {string} campaignSpreadsheetPath - Path to the campaign data spreadsheet
     * @returns {Promise<object>} Analysis results with metrics and recommendations
     */
    async analyzeCampaignPerformance(campaignSpreadsheetPath) {
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(campaignSpreadsheetPath);
            const worksheet = workbook.getWorksheet(1);
            
            const metrics = this._calculateMetrics(worksheet);
            const segments = this._identifySegments(worksheet);
            const recommendations = await this._generateRecommendations(metrics, segments);
            
            return {
                metrics,
                segments,
                recommendations
            };
        } catch (error) {
            this.logger.error('Error analyzing campaign performance:', error);
            throw error;
        }
    }

    /**
     * Calculate key performance metrics from campaign data
     * @param {object} worksheet - ExcelJS worksheet containing campaign data
     * @returns {object} Calculated metrics
     */
    _calculateMetrics(worksheet) {
        let totalSent = 0;
        let totalOpened = 0;
        let totalClicked = 0;
        let totalResponded = 0;
        let totalConverted = 0;
        
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            
            totalSent++;
            if (row.getCell('Opened').value === true) totalOpened++;
            if (row.getCell('Clicked').value === true) totalClicked++;
            if (row.getCell('Responded').value === true) totalResponded++;
            if (row.getCell('Converted').value === true) totalConverted++;
        });
        
        return {
            totalSent,
            openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
            clickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
            responseRate: totalSent > 0 ? (totalResponded / totalSent) * 100 : 0,
            conversionRate: totalResponded > 0 ? (totalConverted / totalResponded) * 100 : 0,
            overallConversionRate: totalSent > 0 ? (totalConverted / totalSent) * 100 : 0
        };
    }

    /**
     * Identify high and low performing segments in the campaign data
     * @param {object} worksheet - ExcelJS worksheet containing campaign data
     * @returns {object} Identified segments with performance data
     */
    _identifySegments(worksheet) {
        const segments = {};
        const industries = new Map();
        const sendTimes = new Map();
        const subjectLines = new Map();
        
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header
            
            const industry = row.getCell('Industry').value;
            const sendTime = row.getCell('SendTime').value;
            const subjectLine = row.getCell('SubjectLine').value;
            const opened = row.getCell('Opened').value === true;
            const clicked = row.getCell('Clicked').value === true;
            const responded = row.getCell('Responded').value === true;
            
            // Track industry performance
            if (!industries.has(industry)) {
                industries.set(industry, { count: 0, opened: 0, clicked: 0, responded: 0 });
            }
            const industryData = industries.get(industry);
            industryData.count++;
            if (opened) industryData.opened++;
            if (clicked) industryData.clicked++;
            if (responded) industryData.responded++;
            
            // Track send time performance
            const timeBlock = this._getTimeBlock(sendTime);
            if (!sendTimes.has(timeBlock)) {
                sendTimes.set(timeBlock, { count: 0, opened: 0, clicked: 0, responded: 0 });
            }
            const timeData = sendTimes.get(timeBlock);
            timeData.count++;
            if (opened) timeData.opened++;
            if (clicked) timeData.clicked++;
            if (responded) timeData.responded++;
            
            // Track subject line performance
            if (!subjectLines.has(subjectLine)) {
                subjectLines.set(subjectLine, { count: 0, opened: 0, clicked: 0, responded: 0 });
            }
            const subjectData = subjectLines.get(subjectLine);
            subjectData.count++;
            if (opened) subjectData.opened++;
            if (clicked) subjectData.clicked++;
            if (responded) subjectData.responded++;
        });
        
        // Calculate rates and identify top performers
        segments.industries = this._calculateSegmentRates(industries);
        segments.sendTimes = this._calculateSegmentRates(sendTimes);
        segments.subjectLines = this._calculateSegmentRates(subjectLines);
        
        return segments;
    }

    /**
     * Calculate performance rates for each segment
     * @param {Map} segmentMap - Map containing segment data
     * @returns {object} Segment data with calculated rates and top performers
     */
    _calculateSegmentRates(segmentMap) {
        const segmentArray = [];
        
        segmentMap.forEach((data, key) => {
            segmentArray.push({
                name: key,
                count: data.count,
                openRate: data.count > 0 ? (data.opened / data.count) * 100 : 0,
                clickRate: data.opened > 0 ? (data.clicked / data.opened) * 100 : 0,
                responseRate: data.count > 0 ? (data.responded / data.count) * 100 : 0
            });
        });
        
        // Sort by response rate (primary KPI)
        segmentArray.sort((a, b) => b.responseRate - a.responseRate);
        
        return {
            all: segmentArray,
            topPerformers: segmentArray.slice(0, 3),
            lowPerformers: segmentArray.slice(-3).reverse()
        };
    }

    /**
     * Convert timestamp to time block for analysis
     * @param {Date} timestamp - Email send timestamp
     * @returns {string} Time block category
     */
    _getTimeBlock(timestamp) {
        const hour = moment(timestamp).hour();
        
        if (hour >= 5 && hour < 9) return 'Early Morning (5-9AM)';
        if (hour >= 9 && hour < 12) return 'Morning (9AM-12PM)';
        if (hour >= 12 && hour < 14) return 'Lunch (12-2PM)';
        if (hour >= 14 && hour < 17) return 'Afternoon (2-5PM)';
        if (hour >= 17 && hour < 20) return 'Evening (5-8PM)';
        return 'Night (8PM-5AM)';
    }

    /**
     * Generate AI-powered recommendations based on campaign analysis
     * @param {object} metrics - Campaign performance metrics
     * @param {object} segments - Identified campaign segments
     * @returns {Promise<object>} Recommendations for campaign optimization
     */
    async _generateRecommendations(metrics, segments) {
        try {
            const prompt = `
            Analyze this email campaign data and provide specific recommendations:
            
            Overall Metrics:
            - Open Rate: ${metrics.openRate.toFixed(2)}%
            - Click Rate: ${metrics.clickRate.toFixed(2)}%
            - Response Rate: ${metrics.responseRate.toFixed(2)}%
            - Conversion Rate: ${metrics.conversionRate.toFixed(2)}%
            
            Top Performing Industries:
            ${segments.industries.topPerformers.map(i => `- ${i.name}: ${i.responseRate.toFixed(2)}% response rate`).join('\n')}
            
            Low Performing Industries:
            ${segments.industries.lowPerformers.map(i => `- ${i.name}: ${i.responseRate.toFixed(2)}% response rate`).join('\n')}
            
            Top Performing Send Times:
            ${segments.sendTimes.topPerformers.map(t => `- ${t.name}: ${t.responseRate.toFixed(2)}% response rate`).join('\n')}
            
            Top Performing Subject Lines:
            ${segments.subjectLines.topPerformers.map(s => `- "${s.name}": ${s.openRate.toFixed(2)}% open rate`).join('\n')}
            
            Please provide:
            1. 3-5 specific, actionable recommendations to improve campaign performance
            2. Suggested A/B tests to run in the next campaign
            3. Specific audience segments to focus on or avoid
            4. Subject line improvement suggestions
            5. Best timing for future campaigns
            
            Format as JSON with these keys: actionableRecommendations, abTests, audienceStrategy, subjectLineStrategy, timingStrategy
            `;

            const response = await axios.post(this.CLAUDE_API_ENDPOINT, {
                model: "claude-3.7",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                max_tokens: 1500,
                temperature: 0.2,
                response_format: { type: "json_object" }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.CLAUDE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            return JSON.parse(response.data.choices[0].message.content);
        } catch (error) {
            this.logger.error('Error generating recommendations:', error);
            return {
                actionableRecommendations: [
                    "Focus on top performing industries",
                    "Adjust send times to match best performing time blocks",
                    "Revise subject lines for low-performing segments"
                ],
                abTests: [
                    "Test personalized vs. generic subject lines",
                    "Test different call-to-action placements"
                ],
                audienceStrategy: "Prioritize segments with >10% response rate",
                subjectLineStrategy: "Use question-based subject lines for higher engagement",
                timingStrategy: "Send during business hours for best results"
            };
        }
    }

    /**
     * Create an optimized campaign plan based on analysis
     * @param {string} analysisPath - Path to previous campaign analysis
     * @param {string} outputPath - Path to save the optimized campaign plan
     * @returns {Promise<object>} Campaign plan details
     */
    async createOptimizedCampaignPlan(analysisPath, outputPath) {
        try {
            // Load previous analysis
            const analysisWorkbook = new ExcelJS.Workbook();
            await analysisWorkbook.xlsx.readFile(analysisPath);
            const analysisSheet = analysisWorkbook.getWorksheet('Analysis');
            
            // Extract key insights
            const insights = this._extractInsights(analysisSheet);
            
            // Create new campaign plan
            const planWorkbook = new ExcelJS.Workbook();
            const planSheet = planWorkbook.addWorksheet('Campaign Plan');
            
            // Set up plan structure
            this._setupPlanWorksheet(planSheet, insights);
            
            // Save the plan
            await planWorkbook.xlsx.writeFile(outputPath);
            
            return {
                planPath: outputPath,
                targetSegments: insights.targetSegments,
                estimatedPerformance: insights.estimatedPerformance
            };
        } catch (error) {
            this.logger.error('Error creating optimized campaign plan:', error);
            throw error;
        }
    }

    /**
     * Extract insights from analysis worksheet
     * @param {object} worksheet - ExcelJS worksheet containing analysis
     * @returns {object} Extracted insights
     */
    _extractInsights(worksheet) {
        // Implementation would extract key data points from the analysis
        // This is a simplified placeholder
        return {
            targetSegments: ['Technology', 'Manufacturing'],
            optimalSendTime: 'Morning (9AM-12PM)',
            recommendedSubjectLines: [
                'Quick question about your business needs',
                'Opportunity for [Company Name]'
            ],
            estimatedPerformance: {
                expectedOpenRate: 25.5,
                expectedResponseRate: 8.2
            }
        };
    }

    /**
     * Set up the campaign plan worksheet
     * @param {object} worksheet - ExcelJS worksheet for the plan
     * @param {object} insights - Insights from previous campaign analysis
     */
    _setupPlanWorksheet(worksheet, insights) {
        // Set headers
        worksheet.columns = [
            { header: 'Segment', key: 'segment', width: 20 },
            { header: 'Target Companies', key: 'companies', width: 20 },
            { header: 'Subject Line', key: 'subject', width: 40 },
            { header: 'Send Time', key: 'sendTime', width: 20 },
            { header: 'Expected Open Rate', key: 'openRate', width: 20 },
            { header: 'Expected Response Rate', key: 'responseRate', width: 20 }
        ];
        
        // Add data rows
        insights.targetSegments.forEach(segment => {
            worksheet.addRow({
                segment: segment,
                companies: '[To be populated]',
                subject: insights.recommendedSubjectLines[0],
                sendTime: insights.optimalSendTime,
                openRate: `${insights.estimatedPerformance.expectedOpenRate}%`,
                responseRate: `${insights.estimatedPerformance.expectedResponseRate}%`
            });
        });
        
        // Add A/B test section
        worksheet.addRow({});
        worksheet.addRow({ segment: 'A/B Test Plan' });
        worksheet.addRow({
            segment: 'Test Group A',
            subject: insights.recommendedSubjectLines[0],
            sendTime: insights.optimalSendTime
        });
        worksheet.addRow({
            segment: 'Test Group B',
            subject: insights.recommendedSubjectLines[1],
            sendTime: insights.optimalSendTime
        });
    }
}

module.exports = EmailCampaignOptimizer;
