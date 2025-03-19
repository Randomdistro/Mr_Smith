/**
 * WebScraperTool - Tool for scraping web content for research purposes
 * Provides functionality for extracting information from websites
 */

const BaseTool = require('../BaseTool');
const axios = require('axios');

class WebScraperTool extends BaseTool {
    constructor(config = {}) {
        super({
            ...config,
            name: 'Web Scraper',
            description: 'Extracts data from websites for research purposes',
            capabilities: [
                'webpage-content',
                'search-results',
                'data-extraction'
            ]
        });
        
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
        ];
        
        this.requestDelay = config.requestDelay || 2000; // Default delay between requests
        this.maxRetries = config.maxRetries || 3;
        this.cachedResults = new Map();
    }
    
    _initializeInternal() {
        // Initialize axios instance with defaults
        this.client = axios.create({
            timeout: 10000,
            headers: {
                'User-Agent': this._getRandomUserAgent()
            }
        });
    }
    
    async _executeInternal(params) {
        const { url, searchTerms, selectors, depth = 1, extractImages = false, cacheResults = true } = params;
        
        try {
            // Handle direct URL scraping
            if (url) {
                return await this._scrapeUrl(url, selectors, extractImages);
            }
            
            // Handle search terms
            if (searchTerms) {
                return await this._performSearch(searchTerms, depth, cacheResults);
            }
            
            throw new Error('Either url or searchTerms must be provided');
        } catch (error) {
            console.error('Web scraping error:', error);
            throw error;
        }
    }
    
    async _scrapeUrl(url, selectors = {}, extractImages = false) {
        // Check cache first
        const cacheKey = `url:${url}`;
        if (this.cachedResults.has(cacheKey)) {
            return {
                source: url,
                cached: true,
                ...this.cachedResults.get(cacheKey)
            };
        }
        
        let retries = 0;
        let error;
        
        while (retries < this.maxRetries) {
            try {
                // Make request with random user agent
                const response = await this.client.get(url, {
                    headers: {
                        'User-Agent': this._getRandomUserAgent()
                    }
                });
                
                // Extract content based on selectors or default extraction
                const content = this._extractContent(response.data, selectors);
                
                // Extract metadata
                const metadata = this._extractMetadata(response.data, url);
                
                // Extract images if requested
                const images = extractImages ? this._extractImages(response.data, url) : [];
                
                const result = {
                    url,
                    title: metadata.title,
                    description: metadata.description,
                    content,
                    metadata,
                    images: extractImages ? images : [],
                    timestamp: new Date().toISOString()
                };
                
                // Cache the result
                this.cachedResults.set(cacheKey, result);
                
                return {
                    source: url,
                    cached: false,
                    ...result
                };
            } catch (err) {
                error = err;
                retries++;
                
                // Wait before retrying
                await this._delay(this.requestDelay * retries);
            }
        }
        
        throw error || new Error(`Failed to scrape URL: ${url}`);
    }
    
    async _performSearch(searchTerms, depth = 1, cacheResults = true) {
        // Check cache first if caching is enabled
        const cacheKey = `search:${searchTerms}:${depth}`;
        if (cacheResults && this.cachedResults.has(cacheKey)) {
            return {
                query: searchTerms,
                cached: true,
                ...this.cachedResults.get(cacheKey)
            };
        }
        
        try {
            // Format search terms for URL
            const formattedQuery = encodeURIComponent(searchTerms);
            
            // Search URL (using a mock implementation)
            // In a real implementation, this would use a proper search API
            const searchResults = await this._mockSearchResults(searchTerms);
            
            // If depth > 1, scrape each result URL
            const detailedResults = [];
            
            if (depth > 1 && searchResults.results.length > 0) {
                const maxResultsToScrape = Math.min(searchResults.results.length, depth === 2 ? 3 : 5);
                
                for (let i = 0; i < maxResultsToScrape; i++) {
                    const result = searchResults.results[i];
                    
                    try {
                        // Add delay between requests to avoid rate limiting
                        if (i > 0) {
                            await this._delay(this.requestDelay);
                        }
                        
                        const scrapedData = await this._scrapeUrl(result.url);
                        detailedResults.push({
                            ...result,
                            content: scrapedData.content,
                            metadata: scrapedData.metadata
                        });
                    } catch (error) {
                        console.error(`Failed to scrape search result: ${result.url}`, error);
                        // Add the result without the additional scrape data
                        detailedResults.push(result);
                    }
                }
            }
            
            // Build final result
            const result = {
                query: searchTerms,
                totalResults: searchResults.totalResults,
                results: depth > 1 ? detailedResults : searchResults.results,
                timestamp: new Date().toISOString()
            };
            
            // Cache the result if caching is enabled
            if (cacheResults) {
                this.cachedResults.set(cacheKey, result);
            }
            
            return {
                query: searchTerms,
                cached: false,
                ...result
            };
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }
    
    _extractContent(html, selectors = {}) {
        // MOCK: In a real implementation, this would use a proper HTML parser
        // like cheerio or jsdom to extract content based on selectors
        
        // Extract basic content (simulated)
        let content = '';
        
        if (html && typeof html === 'string') {
            // Remove HTML tags (very simplified)
            content = html
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            // Limit content length
            content = content.substring(0, 5000);
        }
        
        return content;
    }
    
    _extractMetadata(html, url) {
        // MOCK: In a real implementation, this would use a proper HTML parser
        // Extract basic metadata (simulated)
        let title = '';
        let description = '';
        
        if (html && typeof html === 'string') {
            // Extract title (simple regex approach - a real implementation would be more robust)
            const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
            if (titleMatch && titleMatch[1]) {
                title = titleMatch[1].trim();
            }
            
            // Extract description (simple regex approach)
            const descriptionMatch = /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i.exec(html);
            if (descriptionMatch && descriptionMatch[1]) {
                description = descriptionMatch[1].trim();
            }
        }
        
        return {
            title: title || url,
            description,
            url,
            domain: this._extractDomain(url)
        };
    }
    
    _extractImages(html, baseUrl) {
        // MOCK: In a real implementation, this would use a proper HTML parser
        // Extract image URLs (simulated)
        const images = [];
        
        if (html && typeof html === 'string') {
            // Extract image URLs (simple regex approach)
            const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
            let match;
            
            while ((match = imgRegex.exec(html)) !== null) {
                if (match[1]) {
                    // Resolve relative URLs
                    const imageUrl = this._resolveUrl(match[1], baseUrl);
                    images.push({
                        url: imageUrl,
                        alt: this._extractAltText(match[0])
                    });
                }
            }
        }
        
        return images.slice(0, 10); // Limit to 10 images
    }
    
    _extractAltText(imgTag) {
        const altMatch = /alt=["']([^"']*)["']/i.exec(imgTag);
        return altMatch && altMatch[1] ? altMatch[1].trim() : '';
    }
    
    _extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (error) {
            return '';
        }
    }
    
    _resolveUrl(relativeUrl, baseUrl) {
        try {
            return new URL(relativeUrl, baseUrl).href;
        } catch (error) {
            return relativeUrl;
        }
    }
    
    _getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }
    
    async _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async _mockSearchResults(query) {
        // This is a mock implementation for demonstration purposes
        // In a real implementation, this would call a search API
        await this._delay(500); // Simulate network delay
        
        return {
            totalResults: 42,
            results: [
                {
                    title: `Top results for ${query}`,
                    url: `https://example.com/1?q=${encodeURIComponent(query)}`,
                    snippet: `This is a sample result for ${query}. It contains relevant information about the search terms.`
                },
                {
                    title: `${query} - Wikipedia`,
                    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/ /g, '_'))}`,
                    snippet: `${query} refers to a concept, term, or entity that has various interpretations and applications across different contexts.`
                },
                {
                    title: `Understanding ${query} - Comprehensive Guide`,
                    url: `https://example.org/guides/${encodeURIComponent(query.toLowerCase().replace(/ /g, '-'))}`,
                    snippet: `Learn everything about ${query} in our comprehensive guide, covering fundamentals, applications, and best practices.`
                },
                {
                    title: `${query} News and Updates`,
                    url: `https://news-example.com/topics/${encodeURIComponent(query.toLowerCase().replace(/ /g, '-'))}`,
                    snippet: `Latest news, developments, and updates related to ${query}. Stay informed with our regular coverage.`
                },
                {
                    title: `${query} Research Papers and Publications`,
                    url: `https://academic-example.org/search?q=${encodeURIComponent(query)}`,
                    snippet: `Academic research, papers, and publications focusing on ${query} and related subjects.`
                }
            ]
        };
    }
    
    clearCache() {
        this.cachedResults.clear();
    }
}

module.exports = WebScraperTool; 