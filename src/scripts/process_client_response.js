/**
 * Script to process client responses and update the response matrix
 * 
 * Usage:
 * node process_client_response.js "ClientName" "path/to/response.txt"
 * 
 * If response.txt is not provided, the script will look for a file named 
 * "ClientName_response.txt" in the current directory.
 */

const fs = require('fs');
const path = require('path');
const SalesAgent = require('../tools/contact-management/sales_agent');
const Logger = require('../utils/logger');

const logger = new Logger({
    level: 'info',
    filename: 'client_responses.log'
});

// Initialize the sales agent
const salesAgent = new SalesAgent(logger);

async function processClientResponse() {
    try {
        // Parse command line arguments
        const args = process.argv.slice(2);
        
        if (args.length < 1) {
            console.error('Error: Missing client name argument');
            console.log('Usage: node process_client_response.js "ClientName" [path/to/response.txt]');
            process.exit(1);
        }
        
        const clientName = args[0];
        let responsePath = args[1];
        
        // If response file not specified, look for default named file
        if (!responsePath) {
            const defaultPath = `${clientName}_response.txt`;
            if (fs.existsSync(defaultPath)) {
                responsePath = defaultPath;
            } else {
                console.error(`Error: Response file not found. Expected '${defaultPath}'.`);
                console.log('Please provide response content as the second argument or create a file named "<ClientName>_response.txt"');
                process.exit(1);
            }
        }
        
        // Read the response file
        const responseContent = fs.readFileSync(responsePath, 'utf8');
        
        console.log(`Processing response for ${clientName}...`);
        
        // Process the response and update the client's matrix
        const result = await salesAgent.processEntityResponse(clientName, responseContent);
        
        console.log('Response processed successfully!');
        console.log('=== Response Analysis ===');
        console.log(`Category: ${result.processingResult.responseAnalysis.category}`);
        console.log(`Sentiment: ${result.processingResult.responseAnalysis.sentiment}`);
        console.log(`Status: ${result.processingResult.responseAnalysis.status || 'Not specified'}`);
        console.log(`Next Steps: ${result.processingResult.nextSteps}`);
        
        // Save the generated response to a file
        const responseOutputPath = `${clientName}_our_response.txt`;
        fs.writeFileSync(responseOutputPath, result.processingResult.ourResponse);
        
        console.log(`\nGenerated response saved to: ${responseOutputPath}`);
        console.log(`Response matrix updated in: ${result.spreadsheetPath}`);
        
    } catch (error) {
        logger.error('Error processing client response:', error);
        console.error('An error occurred while processing the response:', error.message);
        process.exit(1);
    }
}

// Run the script
processClientResponse(); 