/**
 * Company Enricher Example
 * 
 * This example demonstrates how to use the CompanyEnricher tool
 * to automatically enhance your client spreadsheets with additional
 * company information from public APIs.
 */

const path = require('path');
const CompanyEnricher = require('../tools/data-enrichment/company_enricher');
const Logger = require('../utils/logger');

// Initialize logger
const logger = new Logger({
    level: 'debug',
    filename: path.join(__dirname, '../../logs/company-enricher.log')
});

/**
 * Example function to demonstrate company enrichment with mock data
 */
async function enrichCompanyDataWithMock() {
    logger.info('Starting company enrichment process with mock data');
    
    try {
        // Initialize the company enricher with mock data option
        const enricher = new CompanyEnricher({
            logger,
            useMockData: true // Use mock data for demonstration
        });
        
        // Path to your spreadsheet (adjust as needed)
        const spreadsheetPath = path.join(__dirname, '../../data/clients.xlsx');
        
        logger.info(`Enriching spreadsheet: ${spreadsheetPath}`);
        
        // Perform the enrichment process
        const result = await enricher.enrichCompanySpreadsheet(spreadsheetPath);
        
        // Display the results
        logger.info('Enrichment completed successfully');
        logger.info(`Total companies processed: ${result.stats.totalCompanies}`);
        logger.info(`Companies enriched: ${result.stats.enriched}`);
        logger.info(`New data points added: ${result.stats.newDataPoints}`);
        
        console.log('\nEnrichment Statistics:');
        console.log('-----------------------');
        console.log(`Total companies: ${result.stats.totalCompanies}`);
        console.log(`Successfully enriched: ${result.stats.enriched}`);
        console.log(`Failed to enrich: ${result.stats.failed}`);
        console.log(`New data points added: ${result.stats.newDataPoints}`);
        
        console.log('\nUpdated Fields:');
        console.log('--------------');
        for (const [field, count] of Object.entries(result.stats.updatedFields)) {
            if (count > 0) {
                console.log(`${field}: ${count} companies`);
            }
        }
        
        console.log(`\nEnriched spreadsheet saved to: ${result.spreadsheetPath}`);
        
    } catch (error) {
        logger.error('Error in enrichment process:', error);
        console.error('Error enriching company data:', error.message);
    }
}

/**
 * Example function to demonstrate company enrichment with real APIs
 */
async function enrichCompanyDataWithRealAPIs() {
    logger.info('Starting company enrichment process with real APIs');
    
    try {
        // Initialize the company enricher with API keys
        const enricher = new CompanyEnricher({
            logger,
            clearbitApiKey: process.env.CLEARBIT_API_KEY, // Set your API key in environment variables
            crunchbaseApiKey: process.env.CRUNCHBASE_API_KEY,
            useMockData: false
        });
        
        // Path to your spreadsheet (adjust as needed)
        const spreadsheetPath = path.join(__dirname, '../../data/clients.xlsx');
        
        logger.info(`Enriching spreadsheet: ${spreadsheetPath}`);
        
        // Perform the enrichment process
        const result = await enricher.enrichCompanySpreadsheet(spreadsheetPath);
        
        // Display the results (same as in the mock example)
        logger.info('Enrichment completed successfully');
        logger.info(`Total companies processed: ${result.stats.totalCompanies}`);
        logger.info(`Companies enriched: ${result.stats.enriched}`);
        logger.info(`New data points added: ${result.stats.newDataPoints}`);
        
        console.log('\nEnrichment Statistics:');
        console.log('-----------------------');
        console.log(`Total companies: ${result.stats.totalCompanies}`);
        console.log(`Successfully enriched: ${result.stats.enriched}`);
        console.log(`Failed to enrich: ${result.stats.failed}`);
        console.log(`New data points added: ${result.stats.newDataPoints}`);
        
        console.log('\nUpdated Fields:');
        console.log('--------------');
        for (const [field, count] of Object.entries(result.stats.updatedFields)) {
            if (count > 0) {
                console.log(`${field}: ${count} companies`);
            }
        }
        
        console.log(`\nEnriched spreadsheet saved to: ${result.spreadsheetPath}`);
        
    } catch (error) {
        logger.error('Error in enrichment process:', error);
        console.error('Error enriching company data:', error.message);
    }
}

/**
 * Example function to demonstrate enriching a single company
 */
async function enrichSingleCompany() {
    logger.info('Fetching data for a single company');
    
    try {
        // Initialize the company enricher
        const enricher = new CompanyEnricher({
            logger,
            useMockData: true // Use mock data for demonstration
        });
        
        // Company names to look up
        const companies = [
            'Acme Corporation',
            'Globex Industries',
            'Stark Enterprises',
            'Wayne Enterprises'
        ];
        
        console.log('\nCompany Information Lookup:');
        console.log('--------------------------');
        
        for (const company of companies) {
            // Get company data
            const data = await enricher.getCompanyData(company);
            
            if (data) {
                console.log(`\n${data.name}:`);
                console.log(`  Industry: ${data.industry || 'Unknown'}`);
                console.log(`  Size: ${data.companySize || 'Unknown'}`);
                console.log(`  Founded: ${data.foundedYear || 'Unknown'}`);
                console.log(`  Location: ${data.location || 'Unknown'}`);
                console.log(`  Revenue: ${data.revenueRange || 'Unknown'}`);
                console.log(`  Technologies: ${data.technologies || 'Unknown'}`);
                console.log(`  LinkedIn: ${data.linkedinUrl || 'Unknown'}`);
            } else {
                console.log(`\nNo data found for ${company}`);
            }
        }
        
    } catch (error) {
        logger.error('Error looking up company data:', error);
        console.error('Error:', error.message);
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const mode = args[0] || 'mock';
    
    console.log('Company Information Enricher Example');
    console.log('===================================');
    
    if (mode === 'real') {
        if (!process.env.CLEARBIT_API_KEY && !process.env.CRUNCHBASE_API_KEY) {
            console.log('Warning: No API keys provided. Set CLEARBIT_API_KEY or CRUNCHBASE_API_KEY in your environment.');
            console.log('Falling back to mock data mode.');
            await enrichCompanyDataWithMock();
        } else {
            await enrichCompanyDataWithRealAPIs();
        }
    } else if (mode === 'single') {
        await enrichSingleCompany();
    } else {
        await enrichCompanyDataWithMock();
    }
}

// Run the example
main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
}); 