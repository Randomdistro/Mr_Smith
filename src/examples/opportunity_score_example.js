/**
 * Example script demonstrating the use of the Opportunity Score Calculator
 * 
 * This script creates a sample spreadsheet with prospect data, calculates opportunity scores,
 * and generates recommended actions based on the scores.
 */

const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const OpportunityScorer = require('../tools/opportunity-analysis/opportunity_scorer');
const Logger = require('../utils/logger');

// Initialize logger
const logger = new Logger({ 
    logFile: path.join(__dirname, '../../logs/opportunity-scorer.log'),
    console: true
});

// Sample company data for demonstration
const sampleCompanies = [
    {
        company: 'TechVision Inc.',
        industry: 'Technology',
        companySize: 'Enterprise (5,000+)',
        revenue: '$500M-$999M',
        lastContact: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        totalInteractions: 12,
        meetings: 2,
        responseHistory: 'Initial call was positive. Interested in pricing and demo. Requested case studies.',
        lastResponse: 'Let\'s schedule a follow-up meeting next week.',
        notes: 'Looking to implement new solution by Q4. Budget approved. Decision timeline is 45 days.'
    },
    {
        company: 'Global Finance Partners',
        industry: 'Finance',
        companySize: 'Large (1,000-5,000)',
        revenue: '$100M-$499M',
        lastContact: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        totalInteractions: 5,
        meetings: 1,
        responseHistory: 'Initial interest was moderate. Asked about integration with existing systems.',
        lastResponse: 'We\'re evaluating several options currently.',
        notes: 'Possible competitor engagement. ROI is a major concern.'
    },
    {
        company: 'HealthPlus Systems',
        industry: 'Healthcare',
        companySize: 'Mid-size (500-999)',
        revenue: '$50M-$99M',
        lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        totalInteractions: 8,
        meetings: 0,
        responseHistory: 'Initial call was positive. Requested information about compliance features.',
        lastResponse: 'Sounds interesting, tell me more about your security certifications.',
        notes: 'Security and compliance are top priorities. Looking for HIPAA compliant solutions.'
    },
    {
        company: 'Retail Innovators',
        industry: 'Retail',
        companySize: 'Small (100-499)',
        revenue: '$10M-$49M',
        lastContact: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        totalInteractions: 3,
        meetings: 0,
        responseHistory: 'Brief interest initially, but slow to respond to follow-ups.',
        lastResponse: 'We\'re not ready to make changes at this time.',
        notes: 'Seasonal business focused on Q4 holiday planning.'
    },
    {
        company: 'EduLearn Academy',
        industry: 'Education',
        companySize: 'Small (100-499)',
        revenue: '$5M-$9M',
        lastContact: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        totalInteractions: 4,
        meetings: 1,
        responseHistory: 'Open to learning more. Budget constraints are a concern.',
        lastResponse: 'This looks promising, but we need to secure funding first.',
        notes: 'New fiscal year begins in 3 months. Decision making committee includes 5 stakeholders.'
    },
    {
        company: 'Manufacturing Pro',
        industry: 'Manufacturing',
        companySize: 'Mid-size (500-999)',
        revenue: '$100M-$499M',
        lastContact: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        totalInteractions: 7,
        meetings: 1,
        responseHistory: 'Very engaged. Multiple departments interested in implementation.',
        lastResponse: 'We\'d like to move forward with a proposal. Can you provide pricing options?',
        notes: 'CTO is the decision maker. Looking for ROI within 18 months. Competitor product in place but contract ending.'
    },
    {
        company: 'StartupNow',
        industry: 'Technology',
        companySize: 'Startup (1-99)',
        revenue: '$1M-$4M',
        lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        totalInteractions: 6,
        meetings: 0,
        responseHistory: 'Very enthusiastic initially. Concerned about scalability.',
        lastResponse: 'We need something that can grow with us. How does your pricing scale?',
        notes: 'Recently received Series A funding. Fast growth trajectory. Looking for modern solutions.'
    },
    {
        company: 'Government Services',
        industry: 'Government',
        companySize: 'Large (1,000-5,000)',
        revenue: '$50M-$99M',
        lastContact: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        totalInteractions: 2,
        meetings: 0,
        responseHistory: 'Initial inquiry about procurement process.',
        lastResponse: 'Need to follow established procurement procedures.',
        notes: 'Long sales cycle expected. RFP process required. Budget allocation happens annually.'
    }
];

/**
 * Create a sample spreadsheet with prospect data
 * @param {string} outputPath - Path where the sample spreadsheet will be saved
 * @returns {Promise<string>} Path to the created spreadsheet
 */
async function createSampleSpreadsheet(outputPath) {
    logger.info(`Creating sample prospect spreadsheet at: ${outputPath}`);
    
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Prospects');
    
    // Define columns
    worksheet.columns = [
        { header: 'Company', key: 'company', width: 25 },
        { header: 'Industry', key: 'industry', width: 18 },
        { header: 'Company Size', key: 'companySize', width: 20 },
        { header: 'Revenue Range', key: 'revenue', width: 18 },
        { header: 'Last Contact Date', key: 'lastContact', width: 20 },
        { header: 'Total Interactions', key: 'totalInteractions', width: 15 },
        { header: 'Meetings', key: 'meetings', width: 10 },
        { header: 'Response History', key: 'responseHistory', width: 40 },
        { header: 'Last Response', key: 'lastResponse', width: 40 },
        { header: 'Notes', key: 'notes', width: 40 }
    ];
    
    // Add style to header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Add companies to the worksheet
    for (const company of sampleCompanies) {
        worksheet.addRow(company);
    }
    
    // Ensure the directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save the workbook
    await workbook.xlsx.writeFile(outputPath);
    logger.info(`Created sample spreadsheet with ${sampleCompanies.length} prospects`);
    
    return outputPath;
}

/**
 * Score prospects and generate actions
 * @param {string} spreadsheetPath - Path to the prospect spreadsheet
 * @returns {Promise<object>} Scoring results
 */
async function scoreProspects(spreadsheetPath) {
    logger.info(`Scoring prospects in: ${spreadsheetPath}`);
    
    // Create opportunity scorer with custom weights
    const scorer = new OpportunityScorer({
        logger,
        weights: {
            // Default weights work well, but you can customize them
            companySize: 8,
            revenue: 12,
            industry: 10,
            growthRate: 10,
            
            recentActivity: 15,
            responseRate: 12,
            clickRate: 5,
            meetingAttendance: 8,
            
            explicitInterest: 10,
            implicitInterest: 5,
            budgetDiscussion: 5
        }
    });
    
    // Calculate opportunity scores
    const results = await scorer.calculateOpportunityScores(spreadsheetPath);
    
    // Print summary of results
    logger.info(`Scoring completed for ${results.scoredProspects} prospects`);
    logger.info(`Hot opportunities: ${results.categories.hot}`);
    logger.info(`Warm opportunities: ${results.categories.warm}`);
    logger.info(`Lukewarm opportunities: ${results.categories.lukewarm}`);
    logger.info(`Cool opportunities: ${results.categories.cool}`);
    logger.info(`Cold opportunities: ${results.categories.cold}`);
    
    // Generate suggested actions
    const actions = scorer.generateSuggestedActions(results.prospects);
    
    // Display high priority actions
    logger.info('\nHIGH PRIORITY ACTIONS:');
    for (const action of actions.highPriority) {
        logger.info(`- ${action.company}: ${action.action} (Due: ${action.dueDate})`);
    }
    
    // Display medium priority actions
    if (actions.mediumPriority.length > 0) {
        logger.info('\nMEDIUM PRIORITY ACTIONS:');
        for (const action of actions.mediumPriority.slice(0, 3)) {
            logger.info(`- ${action.company}: ${action.action} (Due: ${action.dueDate})`);
        }
        if (actions.mediumPriority.length > 3) {
            logger.info(`  ...and ${actions.mediumPriority.length - 3} more medium priority actions`);
        }
    }
    
    return results;
}

/**
 * Main function to run the example
 */
async function main() {
    try {
        // Determine paths
        const dataDir = path.join(__dirname, '../../data');
        const spreadsheetPath = path.join(dataDir, 'sample_prospects.xlsx');
        
        // Create sample data if requested or if file doesn't exist
        if (process.argv.includes('create') || !fs.existsSync(spreadsheetPath)) {
            await createSampleSpreadsheet(spreadsheetPath);
            logger.info('Sample prospect data created successfully!');
        }
        
        // Score prospects if requested
        if (process.argv.includes('score') || process.argv.length <= 2) {
            const results = await scoreProspects(spreadsheetPath);
            logger.info(`Scoring completed! Results saved to: ${results.scoredFilePath}`);
            logger.info(`Summary report saved to: ${results.reportPath}`);
        }
        
    } catch (error) {
        logger.error('Error running opportunity score example:', error);
    }
}

// Run the example
main(); 