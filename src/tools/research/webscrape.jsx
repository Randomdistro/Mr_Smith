const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const winston = require('winston');

class GoogleMapsScraper {
    constructor(logger = winston.createLogger()) {
        this.logger = logger;
    }

    async scrapeGoogleMaps(searchQuery) {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1200, height: 800 });
            
            // Navigate to Google Maps
            await page.goto('https://www.google.com/maps');
            await page.waitForSelector('#searchboxinput');
            await page.type('#searchboxinput', searchQuery);
            await page.keyboard.press('Enter');
            
            // Wait for results to load
            await page.waitForSelector('[role="feed"]');

            const results = [];
            let previousHeight = 0;
            
            // Scroll and collect data
            while (results.length < 100) { // Limit to 100 results
                const newResults = await page.evaluate(() => {
                    const items = [];
                    const elements = document.querySelectorAll('[role="feed"] > div');
                    
                    elements.forEach(element => {
                        const nameEl = element.querySelector('h3');
                        const phoneEl = element.querySelector('[data-tooltip*="phone"]');
                        const websiteEl = element.querySelector('[data-tooltip*="website"]');
                        const descriptionEl = element.querySelector('.section-editorial-quote');
                        
                        if (nameEl) {
                            items.push({
                                name: nameEl.innerText.trim(),
                                phone: phoneEl ? phoneEl.innerText.trim() : '',
                                website: websiteEl ? websiteEl.href : '',
                                description: descriptionEl ? descriptionEl.innerText.trim() : ''
                            });
                        }
                    });
                    return items;
                });
                
                results.push(...newResults);
                
                // Scroll to load more results
                const currentHeight = await page.evaluate('document.body.scrollHeight');
                if (currentHeight === previousHeight) {
                    break;
                }
                
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
                await page.waitForTimeout(2000); // Wait for content to load
                previousHeight = currentHeight;
            }

            // Create Excel workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(searchQuery);

            // Add headers
            worksheet.columns = [
                { header: 'Business Name', key: 'name', width: 30 },
                { header: 'Phone Number', key: 'phone', width: 20 },
                { header: 'Website', key: 'website', width: 40 },
                { header: 'Description', key: 'description', width: 50 }
            ];

            // Add data
            worksheet.addRows(results);

            // Save workbook
            const filename = `${searchQuery.replace(/[^a-z0-9]/gi, '_')}_results.xlsx`;
            await workbook.xlsx.writeFile(filename);

            this.logger.info(`Scraped ${results.length} results for "${searchQuery}" saved to ${filename}`);
            return filename;

        } catch (error) {
            this.logger.error('Error during scraping:', error);
            throw error;
        } finally {
            await browser.close();
        }
    }
}

module.exports = GoogleMapsScraper;
