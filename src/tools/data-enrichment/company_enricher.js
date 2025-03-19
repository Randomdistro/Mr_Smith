/**
 * Company Information Enricher
 * 
 * This tool automatically enriches company profiles by fetching additional
 * information from various public APIs and data sources.
 */

const axios = require('axios');
const ExcelJS = require('exceljs');

class CompanyEnricher {
    /**
     * Create a new CompanyEnricher instance
     * @param {Object} options - Configuration options
     * @param {Object} options.logger - Logger instance
     * @param {string} options.clearbitApiKey - Clearbit API key (optional)
     * @param {string} options.crunchbaseApiKey - Crunchbase API key (optional)
     * @param {boolean} options.useMockData - Use mock data for testing (default: false)
     */
    constructor(options = {}) {
        this.logger = options.logger || console;
        this.clearbitApiKey = options.clearbitApiKey || process.env.CLEARBIT_API_KEY;
        this.crunchbaseApiKey = options.crunchbaseApiKey || process.env.CRUNCHBASE_API_KEY;
        this.useMockData = options.useMockData || false;
        
        // Configure API endpoints
        this.endpoints = {
            clearbit: 'https://company.clearbit.com/v2/companies/find',
            crunchbase: 'https://api.crunchbase.com/api/v4/entities/organizations'
        };
    }
    
    /**
     * Enrich a company spreadsheet with additional information
     * @param {string} spreadsheetPath - Path to the company spreadsheet
     * @returns {Promise<Object>} - Result of the enrichment process
     */
    async enrichCompanySpreadsheet(spreadsheetPath) {
        try {
            this.logger.info(`Enriching company data in: ${spreadsheetPath}`);
            
            // Load the workbook
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(spreadsheetPath);
            
            // Get main worksheet
            const worksheet = workbook.getWorksheet(1);
            
            // Track enrichment statistics
            const stats = {
                totalCompanies: 0,
                enriched: 0,
                failed: 0,
                newDataPoints: 0,
                updatedFields: {}
            };
            
            // Add new columns if they don't exist
            const newColumns = [
                { header: 'Industry', key: 'industry' },
                { header: 'Company Size', key: 'companySize' },
                { header: 'Founded Year', key: 'foundedYear' },
                { header: 'Location', key: 'location' },
                { header: 'LinkedIn URL', key: 'linkedinUrl' },
                { header: 'Twitter', key: 'twitter' },
                { header: 'Revenue Range', key: 'revenueRange' },
                { header: 'Technologies', key: 'technologies' },
                { header: 'Funding', key: 'funding' },
                { header: 'Competitors', key: 'competitors' },
                { header: 'Last Enriched', key: 'lastEnriched' }
            ];
            
            // Check if columns already exist
            const existingHeaders = [];
            worksheet.getRow(1).eachCell((cell) => {
                existingHeaders.push(cell.value);
            });
            
            // Add missing columns
            let columnIndex = existingHeaders.length + 1;
            for (const column of newColumns) {
                if (!existingHeaders.includes(column.header)) {
                    const col = worksheet.getColumn(columnIndex);
                    col.header = column.header;
                    col.key = column.key;
                    col.width = 20;
                    columnIndex++;
                    stats.updatedFields[column.key] = 0;
                }
            }
            
            // Process each row (skip header)
            let rowIndex = 2;
            while (rowIndex <= worksheet.rowCount) {
                const row = worksheet.getRow(rowIndex);
                const businessName = row.getCell(1).value;
                const website = row.getCell('Website') ? row.getCell('Website').value : null;
                
                if (businessName && businessName !== 'Unknown') {
                    stats.totalCompanies++;
                    
                    try {
                        // Get enriched company data
                        const enrichedData = await this.getCompanyData(businessName, website);
                        
                        if (enrichedData) {
                            // Update the spreadsheet with new data
                            await this._updateRowWithEnrichedData(row, enrichedData, stats);
                            stats.enriched++;
                        } else {
                            stats.failed++;
                        }
                    } catch (error) {
                        this.logger.error(`Error enriching data for ${businessName}:`, error);
                        stats.failed++;
                    }
                }
                
                rowIndex++;
            }
            
            // Save the updated workbook
            await workbook.xlsx.writeFile(spreadsheetPath);
            
            this.logger.info(`Enrichment completed for ${spreadsheetPath}`, stats);
            return {
                spreadsheetPath,
                stats,
                message: `Successfully enriched ${stats.enriched} out of ${stats.totalCompanies} companies`
            };
            
        } catch (error) {
            this.logger.error(`Error enriching spreadsheet ${spreadsheetPath}:`, error);
            throw error;
        }
    }
    
    /**
     * Get company information from various data sources
     * @param {string} companyName - Name of the company
     * @param {string} website - Company website (optional)
     * @returns {Promise<Object>} - Enriched company data
     */
    async getCompanyData(companyName, website = null) {
        try {
            this.logger.debug(`Fetching data for: ${companyName}`);
            
            if (this.useMockData) {
                return this._getMockCompanyData(companyName);
            }
            
            // Try to get data from Clearbit
            let companyData = await this._fetchFromClearbit(companyName, website);
            
            // If Clearbit fails, try Crunchbase
            if (!companyData && this.crunchbaseApiKey) {
                companyData = await this._fetchFromCrunchbase(companyName);
            }
            
            // Add data source metadata
            if (companyData) {
                companyData.lastEnriched = new Date().toISOString().split('T')[0];
            }
            
            return companyData;
            
        } catch (error) {
            this.logger.error(`Error getting data for ${companyName}:`, error);
            return null;
        }
    }
    
    /**
     * Fetch company data from Clearbit API
     * @param {string} companyName - Name of the company
     * @param {string} website - Company website (optional)
     * @returns {Promise<Object>} - Company data from Clearbit
     * @private
     */
    async _fetchFromClearbit(companyName, website = null) {
        if (!this.clearbitApiKey) {
            this.logger.warn('Clearbit API key not provided');
            return null;
        }
        
        try {
            const query = website ? { domain: website } : { name: companyName };
            
            const response = await axios.get(this.endpoints.clearbit, {
                params: query,
                headers: {
                    'Authorization': `Bearer ${this.clearbitApiKey}`
                }
            });
            
            if (response.data) {
                // Map Clearbit data to our format
                return {
                    name: response.data.name,
                    domain: response.data.domain,
                    industry: response.data.category?.industry,
                    companySize: this._formatEmployeeCount(response.data.metrics?.employees),
                    foundedYear: response.data.foundedYear,
                    location: this._formatLocation(response.data.geo),
                    description: response.data.description,
                    linkedinUrl: response.data.linkedin?.handle ? 
                        `https://www.linkedin.com/company/${response.data.linkedin.handle}` : null,
                    twitter: response.data.twitter?.handle || null,
                    revenueRange: this._formatRevenueRange(response.data.metrics?.estimatedAnnualRevenue),
                    technologies: response.data.tech ? response.data.tech.join(', ') : null,
                    dataSource: 'clearbit'
                };
            }
            
            return null;
            
        } catch (error) {
            this.logger.debug(`Clearbit lookup failed for ${companyName}:`, error.message);
            return null;
        }
    }
    
    /**
     * Fetch company data from Crunchbase API
     * @param {string} companyName - Name of the company
     * @returns {Promise<Object>} - Company data from Crunchbase
     * @private
     */
    async _fetchFromCrunchbase(companyName) {
        if (!this.crunchbaseApiKey) {
            this.logger.warn('Crunchbase API key not provided');
            return null;
        }
        
        try {
            const response = await axios.get(`${this.endpoints.crunchbase}/search`, {
                params: {
                    name: companyName,
                    field_ids: 'name,short_description,website,linkedin,twitter,founded_on,employee_count,funding_total,categories'
                },
                headers: {
                    'X-cb-user-key': this.crunchbaseApiKey
                }
            });
            
            if (response.data?.entities?.items && response.data.entities.items.length > 0) {
                const entity = response.data.entities.items[0].properties;
                
                // Map Crunchbase data to our format
                return {
                    name: entity.name,
                    domain: entity.website?.replace(/^https?:\/\//, ''),
                    industry: entity.categories?.length > 0 ? entity.categories[0].name : null,
                    companySize: this._formatEmployeeCount(entity.employee_count),
                    foundedYear: entity.founded_on ? new Date(entity.founded_on).getFullYear() : null,
                    location: entity.location_identifiers?.length > 0 ? 
                        entity.location_identifiers[0].value : null,
                    description: entity.short_description,
                    linkedinUrl: entity.linkedin?.value || null,
                    twitter: entity.twitter?.value || null,
                    funding: entity.funding_total?.value 
                        ? `$${(entity.funding_total.value / 1000000).toFixed(1)}M` 
                        : null,
                    dataSource: 'crunchbase'
                };
            }
            
            return null;
            
        } catch (error) {
            this.logger.debug(`Crunchbase lookup failed for ${companyName}:`, error.message);
            return null;
        }
    }
    
    /**
     * Update a spreadsheet row with enriched company data
     * @param {Object} row - ExcelJS row object
     * @param {Object} data - Enriched company data
     * @param {Object} stats - Statistics tracking object
     * @private
     */
    async _updateRowWithEnrichedData(row, data, stats) {
        // Map of field name to column index or key
        const fieldMap = {
            'industry': 'Industry',
            'companySize': 'Company Size',
            'foundedYear': 'Founded Year',
            'location': 'Location',
            'linkedinUrl': 'LinkedIn URL',
            'twitter': 'Twitter',
            'revenueRange': 'Revenue Range',
            'technologies': 'Technologies',
            'funding': 'Funding',
            'competitors': 'Competitors',
            'lastEnriched': 'Last Enriched'
        };
        
        // Update each field if we have data for it
        for (const [field, column] of Object.entries(fieldMap)) {
            if (data[field] !== undefined && data[field] !== null) {
                const cell = row.getCell(column);
                const oldValue = cell.value;
                
                // Only update if the cell is empty or the data is newer
                if (!oldValue || oldValue === '' || field === 'lastEnriched') {
                    cell.value = data[field];
                    stats.newDataPoints++;
                    
                    if (stats.updatedFields[field] !== undefined) {
                        stats.updatedFields[field]++;
                    } else {
                        stats.updatedFields[field] = 1;
                    }
                }
            }
        }
        
        // If we have a website domain but no website in the spreadsheet, update it
        if (data.domain && (!row.getCell('Website') || !row.getCell('Website').value)) {
            const websiteCell = row.getCell('Website');
            if (websiteCell) {
                websiteCell.value = `https://${data.domain}`;
                stats.newDataPoints++;
                stats.updatedFields['website'] = (stats.updatedFields['website'] || 0) + 1;
            }
        }
        
        // If we have a description but no description in the spreadsheet, update it
        if (data.description && 
            (!row.getCell('Business Description') || 
             row.getCell('Business Description').value === 'Initial contact' ||
             row.getCell('Business Description').value === 'Auto-added')) {
            
            const descCell = row.getCell('Business Description');
            if (descCell) {
                descCell.value = data.description.substring(0, 200);
                stats.newDataPoints++;
                stats.updatedFields['description'] = (stats.updatedFields['description'] || 0) + 1;
            }
        }
    }
    
    /**
     * Format employee count into a size category
     * @param {number} count - Number of employees
     * @returns {string} - Size category
     * @private
     */
    _formatEmployeeCount(count) {
        if (!count) return null;
        
        if (count < 10) return '1-9';
        if (count < 50) return '10-49';
        if (count < 200) return '50-199';
        if (count < 500) return '200-499';
        if (count < 1000) return '500-999';
        if (count < 5000) return '1,000-4,999';
        if (count < 10000) return '5,000-9,999';
        return '10,000+';
    }
    
    /**
     * Format location information
     * @param {Object} geo - Location object
     * @returns {string} - Formatted location
     * @private
     */
    _formatLocation(geo) {
        if (!geo) return null;
        
        const city = geo.city || '';
        const state = geo.state || '';
        const country = geo.country || '';
        
        if (city && state && country === 'USA') {
            return `${city}, ${state}, USA`;
        } else if (city && country) {
            return `${city}, ${country}`;
        } else if (country) {
            return country;
        }
        
        return null;
    }
    
    /**
     * Format revenue range
     * @param {string} revenue - Revenue string
     * @returns {string} - Formatted revenue range
     * @private
     */
    _formatRevenueRange(revenue) {
        if (!revenue) return null;
        
        // Convert to millions for readability
        const revenueInMillions = revenue / 1000000;
        
        if (revenueInMillions < 1) return '<$1M';
        if (revenueInMillions < 10) return '$1M-$10M';
        if (revenueInMillions < 50) return '$10M-$50M';
        if (revenueInMillions < 100) return '$50M-$100M';
        if (revenueInMillions < 500) return '$100M-$500M';
        if (revenueInMillions < 1000) return '$500M-$1B';
        return '$1B+';
    }
    
    /**
     * Generate mock company data for testing
     * @param {string} companyName - Name of the company
     * @returns {Object} - Mock company data
     * @private
     */
    _getMockCompanyData(companyName) {
        const industries = ['Technology', 'Healthcare', 'Manufacturing', 'Retail', 'Finance', 'Education'];
        const sizes = ['1-9', '10-49', '50-199', '200-499', '500-999', '1,000-4,999'];
        const revenueRanges = ['<$1M', '$1M-$10M', '$10M-$50M', '$50M-$100M', '$100M-$500M'];
        const locations = ['New York, USA', 'San Francisco, USA', 'London, UK', 'Tokyo, Japan', 'Berlin, Germany'];
        const years = Array.from({length: 30}, (_, i) => 1990 + i);
        const techs = ['AWS', 'React', 'Angular', 'Python', 'Java', 'Node.js', 'Docker', 'Kubernetes'];
        
        // Create a deterministic but varied result based on company name
        const hash = this._simpleHash(companyName);
        
        return {
            name: companyName,
            domain: companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
            industry: industries[hash % industries.length],
            companySize: sizes[hash % sizes.length],
            foundedYear: years[hash % years.length],
            location: locations[hash % locations.length],
            description: `${companyName} is a leading provider of innovative solutions in the ${industries[hash % industries.length]} industry.`,
            linkedinUrl: `https://www.linkedin.com/company/${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            twitter: `@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            revenueRange: revenueRanges[hash % revenueRanges.length],
            technologies: [
                techs[hash % techs.length], 
                techs[(hash + 1) % techs.length], 
                techs[(hash + 2) % techs.length]
            ].join(', '),
            funding: `$${(hash % 100) + 1}M`,
            competitors: [
                `Competitor ${hash % 10 + 1}`, 
                `Competitor ${(hash + 5) % 10 + 1}`
            ].join(', '),
            dataSource: 'mock',
            lastEnriched: new Date().toISOString().split('T')[0]
        };
    }
    
    /**
     * Simple string hash function
     * @param {string} str - String to hash
     * @returns {number} - Hash value
     * @private
     */
    _simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }
}

module.exports = CompanyEnricher; 