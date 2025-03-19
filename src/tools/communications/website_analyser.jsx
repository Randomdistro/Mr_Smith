const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

class WebsiteAnalyzer {
    constructor(logger) {
        this.logger = logger;
    }

    async analyzeWebsites(excelFile) {
        try {
            // Load Excel workbook
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(excelFile);
            const worksheet = workbook.getWorksheet(1);

            // Launch browser
            const browser = await puppeteer.launch({
                headless: true
            });

            // Process each website
            for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
                const row = worksheet.getRow(rowNumber);
                const websiteUrl = row.getCell('website').value;

                if (!websiteUrl) continue;

                try {
                    const {content, businessInfo} = await this._scrapeWebsite(browser, websiteUrl);
                    const analysis = this._analyzeContent(content);
                    
                    // Update Excel row with findings
                    row.getCell('Business Description').value = analysis.businessDescription;
                    row.getCell('Contact Person').value = businessInfo.contactPerson;
                    row.getCell('Email').value = businessInfo.email;
                    row.getCell('Phone').value = businessInfo.phone;
                    row.getCell('Address').value = businessInfo.address;
                    row.getCell('Industry').value = analysis.industry;
                    row.getCell('Key Products/Services').value = analysis.keyProducts;
                    row.getCell('Company Size').value = businessInfo.companySize;
                    row.getCell('Founded').value = businessInfo.founded;
                    
                    await row.commit();
                    this.logger.info(`Analyzed website: ${websiteUrl}`);
                } catch (error) {
                    this.logger.error(`Error analyzing ${websiteUrl}: ${error.message}`);
                    continue;
                }
            }

            // Save updated workbook
            await workbook.xlsx.writeFile(excelFile);
            await browser.close();

        } catch (error) {
            this.logger.error('Error in website analysis:', error);
            throw error;
        }
    }

    async _scrapeWebsite(browser, url) {
        const page = await browser.newPage();
        await page.goto(url, {waitUntil: 'networkidle0'});

        const content = await page.evaluate(() => {
            return document.body.innerText;
        });

        // Extract business information using selectors and patterns
        const businessInfo = await page.evaluate(() => {
            const info = {};
            
            // Contact person - look for common patterns
            const contactPatterns = document.evaluate(
                "//*[contains(text(), 'Contact') or contains(text(), 'CEO') or contains(text(), 'Manager')]/following::*[1]",
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
            info.contactPerson = contactPatterns ? contactPatterns.innerText.trim() : '';

            // Email addresses
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const emails = document.body.innerText.match(emailRegex) || [];
            info.email = emails[0] || '';

            // Phone numbers
            const phoneRegex = /(\+?[0-9\s-()]{10,})/g;
            const phones = document.body.innerText.match(phoneRegex) || [];
            info.phone = phones[0] || '';

            // Address - look for postal code patterns
            const addressPattern = /[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}/g;
            const addresses = document.body.innerText.match(addressPattern) || [];
            info.address = addresses[0] || '';

            return info;
        });

        await page.close();
        return {content, businessInfo};
    }

    _analyzeContent(content) {
        const tokens = tokenizer.tokenize(content.toLowerCase());
        
        // Extract key information
        const analysis = {
            businessDescription: this._generateBusinessDescription(content),
            industry: this._detectIndustry(tokens),
            keyProducts: this._extractKeyProducts(content),
        };

        return analysis;
    }

    _generateBusinessDescription(content) {
        // Extract first few relevant sentences that describe the business
        const sentences = content.split(/[.!?]+/);
        const relevantSentences = sentences.filter(sentence => 
            sentence.toLowerCase().includes('we') ||
            sentence.toLowerCase().includes('our') ||
            sentence.toLowerCase().includes('mission') ||
            sentence.toLowerCase().includes('provide')
        ).slice(0, 3);

        return relevantSentences.join('. ').trim() + '.';
    }

    _detectIndustry(tokens) {
        const industryKeywords = {
            'technology': ['software', 'technology', 'digital', 'it', 'tech'],
            'manufacturing': ['manufacturing', 'production', 'factory', 'industrial'],
            'retail': ['retail', 'shop', 'store', 'ecommerce'],
            'services': ['service', 'consulting', 'professional'],
            // Add more industries as needed
        };

        const matches = {};
        for (const [industry, keywords] of Object.entries(industryKeywords)) {
            matches[industry] = keywords.filter(keyword => tokens.includes(keyword)).length;
        }

        return Object.entries(matches)
            .sort((a, b) => b[1] - a[1])[0][0];
    }

    _extractKeyProducts(content) {
        const productSection = content.match(/products?|services?:?.*([\s\S]{50,200})/i);
        if (productSection) {
            return productSection[0].split('\n')[0].trim();
        }
        return '';
    }
}

module.exports = WebsiteAnalyzer;
