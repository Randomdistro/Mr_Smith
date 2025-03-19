const React = require('react');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const DullCowEyes = require('../data-processing/https_gateway.jsx');

/**
 * WebScraperAgent - A specialized web scraper for collecting and processing online tutorials
 * to build custom agent profiles with domain-specific knowledge.
 * 
 * This agent is part of the Mr Smith framework and integrates with other tools
 * like DullCowEyes for web interaction and screenshot capabilities.
 * It specializes in gathering CAD/3D modeling tutorials and processing them
 * into structured knowledge for agent consumption.
 * 
 * @module tools/research
 * @requires puppeteer
 * @requires fs-extra
 * @requires axios
 * @requires uuid
 * @requires ../data-processing/https_gateway
 */
class WebScraperAgent {
    constructor(options = {}) {
        this.options = {
            dataDir: path.join(process.cwd(), 'data', 'tutorials'),
            profilesDir: path.join(process.cwd(), 'data', 'agent_profiles'),
            maxConcurrentRequests: 5,
            requestDelay: 2000, // ms between requests to avoid rate limiting
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            ...options
        };
        
        // Ensure directories exist
        fs.ensureDirSync(this.options.dataDir);
        fs.ensureDirSync(this.options.profilesDir);
        
        this.logger = options.logger || console;
        this.dullCowEyes = new DullCowEyes(options);
        
        // Supported CAD/3D modeling tools
        this.supportedTools = [
            'autocad',
            'zoo.io',
            '3dstudio',
            '3dsmax',
            'sketchup',
            'creality',
            'blender'
        ];
        
        // Tutorial sources by tool
        this.tutorialSources = {
            'blender': [
                'https://www.blender.org/tutorials/',
                'https://www.blenderguru.com/',
                'https://www.youtube.com/c/BlenderGuru/videos',
                'https://www.youtube.com/c/CGGeek/videos',
                'https://www.youtube.com/c/CGCookie/videos'
            ],
            'autocad': [
                'https://knowledge.autodesk.com/support/autocad/learn',
                'https://www.autodesk.com/autodesk-university/autocad/tutorials',
                'https://www.youtube.com/c/AutodeskAutoCAD/videos'
            ],
            'sketchup': [
                'https://learn.sketchup.com/tutorials',
                'https://www.youtube.com/c/SketchUp/videos'
            ],
            // Add more sources for other tools as needed
        };
    }
    
    /**
     * Initialize the scraper
     * @returns {Promise<void>}
     */
    async initialize() {
        await this.dullCowEyes.initialize();
    }
    
    /**
     * Close the scraper
     * @returns {Promise<void>}
     */
    async close() {
        await this.dullCowEyes.close();
    }
    
    /**
     * Main method to scrape tutorials for a specific target tool
     * @param {string} target - The target tool to scrape tutorials for
     * @returns {Promise<object>} - Information about the created agent profile
     */
    async scrapeAndBuildAgentProfile(target) {
        try {
            if (!this.supportedTools.includes(target.toLowerCase())) {
                throw new Error(`Unsupported tool: ${target}. Supported tools are: ${this.supportedTools.join(', ')}`);
            }
            
            this.logger.info(`Starting to scrape tutorials for ${target}...`);
            
            // Create directory for this target if it doesn't exist
            const targetDir = path.join(this.options.dataDir, target);
            fs.ensureDirSync(targetDir);
            
            // Get tutorial sources for this target
            const sources = this.tutorialSources[target.toLowerCase()] || [];
            if (sources.length === 0) {
                this.logger.warn(`No predefined sources for ${target}, will use general search`);
                sources.push(`https://www.google.com/search?q=${encodeURIComponent(target + ' tutorials')}`);
            }
            
            // Scrape tutorials from sources
            const tutorials = await this._scrapeTutorialsFromSources(target, sources);
            
            // Process and collate the tutorials
            const collatedData = await this._processAndCollateData(target, tutorials);
            
            // Create library from the dataset
            const libraryPath = await this._createLibrary(target, collatedData);
            
            // Build agent profile
            const profilePath = await this._buildAgentProfile(target, libraryPath);
            
            return {
                target,
                tutorialsCount: tutorials.length,
                datasetSize: collatedData.length,
                libraryPath,
                profilePath,
                status: 'success'
            };
        } catch (error) {
            this.logger.error(`Error in scrapeAndBuildAgentProfile for ${target}:`, error);
            throw error;
        }
    }
    
    /**
     * Scrape tutorials from the provided sources
     * @param {string} target - The target tool
     * @param {Array<string>} sources - List of URLs to scrape
     * @returns {Promise<Array<object>>} - List of tutorial data
     * @private
     */
    async _scrapeTutorialsFromSources(target, sources) {
        const tutorials = [];
        
        for (const source of sources) {
            try {
                this.logger.info(`Scraping tutorials from ${source}`);
                
                // Use DullCowEyes to open the web page
                const { interactionId } = await this.dullCowEyes.openWebPage(source);
                
                // Create a new browser instance for deeper scraping
                const browser = await puppeteer.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                
                const page = await browser.newPage();
                await page.setUserAgent(this.options.userAgent);
                await page.goto(source, { waitUntil: 'networkidle2' });
                
                // Extract tutorial links
                const tutorialLinks = await page.evaluate((targetTool) => {
                    const links = [];
                    const allLinks = document.querySelectorAll('a');
                    const keywords = [
                        'tutorial', 'guide', 'how-to', 'learn', 'course',
                        targetTool, 'beginner', 'advanced', 'expert'
                    ];
                    
                    allLinks.forEach(link => {
                        const href = link.href;
                        const text = link.innerText.toLowerCase();
                        
                        // Check if the link text contains any of our keywords
                        if (keywords.some(keyword => text.includes(keyword))) {
                            links.push({
                                url: href,
                                title: link.innerText.trim() || 'Untitled Tutorial',
                                source: window.location.hostname
                            });
                        }
                    });
                    
                    return links;
                }, target);
                
                // Process each tutorial link
                for (let i = 0; i < Math.min(tutorialLinks.length, 10); i++) { // Limit to 10 tutorials per source for demo
                    const tutorialLink = tutorialLinks[i];
                    
                    try {
                        await page.goto(tutorialLink.url, { waitUntil: 'networkidle2', timeout: 30000 });
                        
                        // Extract tutorial content
                        const tutorialContent = await page.evaluate(() => {
                            // Try to find the main content area
                            const contentSelectors = [
                                'article', 'main', '.content', '#content',
                                '.post-content', '.entry-content', '.article-content'
                            ];
                            
                            let contentElement = null;
                            
                            for (const selector of contentSelectors) {
                                const element = document.querySelector(selector);
                                if (element) {
                                    contentElement = element;
                                    break;
                                }
                            }
                            
                            // If no specific content area found, use body
                            if (!contentElement) {
                                contentElement = document.body;
                            }
                            
                            // Extract text content
                            return contentElement.innerText;
                        });
                        
                        // Save tutorial data
                        const tutorialData = {
                            id: uuidv4(),
                            title: tutorialLink.title,
                            url: tutorialLink.url,
                            source: tutorialLink.source,
                            content: tutorialContent,
                            scrapedAt: new Date().toISOString()
                        };
                        
                        tutorials.push(tutorialData);
                        
                        // Save individual tutorial to file
                        const filename = `${tutorialData.id}.json`;
                        await fs.writeJson(
                            path.join(this.options.dataDir, target, filename),
                            tutorialData,
                            { spaces: 2 }
                        );
                        
                        // Delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, this.options.requestDelay));
                    } catch (error) {
                        this.logger.warn(`Error processing tutorial ${tutorialLink.url}:`, error.message);
                    }
                }
                
                await browser.close();
                
            } catch (error) {
                this.logger.warn(`Error scraping source ${source}:`, error.message);
            }
        }
        
        this.logger.info(`Scraped ${tutorials.length} tutorials for ${target}`);
        return tutorials;
    }
    
    /**
     * Process and collate the tutorial data
     * @param {string} target - The target tool
     * @param {Array<object>} tutorials - List of tutorial data
     * @returns {Promise<string>} - Collated dataset content
     * @private
     */
    async _processAndCollateData(target, tutorials) {
        this.logger.info(`Processing and collating ${tutorials.length} tutorials for ${target}`);
        
        // Sort tutorials by estimated quality/relevance
        tutorials.sort((a, b) => {
            // Simple heuristic: longer content might be more comprehensive
            return b.content.length - a.content.length;
        });
        
        // Collate all tutorial content
        let collatedContent = `# ${target.toUpperCase()} TUTORIAL COLLECTION\n\n`;
        
        for (const tutorial of tutorials) {
            collatedContent += `## ${tutorial.title}\n`;
            collatedContent += `Source: ${tutorial.url}\n\n`;
            collatedContent += `${tutorial.content}\n\n`;
            collatedContent += `---\n\n`;
        }
        
        // Save collated content to file
        const collatedPath = path.join(this.options.dataDir, `${target}_collated.md`);
        await fs.writeFile(collatedPath, collatedContent);
        
        return collatedContent;
    }
    
    /**
     * Create a library from the collated dataset
     * @param {string} target - The target tool
     * @param {string} collatedData - Collated dataset content
     * @returns {Promise<string>} - Path to the created library
     * @private
     */
    async _createLibrary(target, collatedData) {
        this.logger.info(`Creating library for ${target}`);
        
        // Create library structure
        const libraryData = {
            id: uuidv4(),
            name: `${target.charAt(0).toUpperCase() + target.slice(1)} Knowledge Library`,
            description: `Comprehensive knowledge library for ${target} created from online tutorials`,
            createdAt: new Date().toISOString(),
            target: target,
            contentSummary: this._generateContentSummary(collatedData),
            datasetSize: collatedData.length,
            dataPath: `${target}_collated.md`
        };
        
        // Save library metadata
        const libraryPath = path.join(this.options.dataDir, `${target}_library.json`);
        await fs.writeJson(libraryPath, libraryData, { spaces: 2 });
        
        return libraryPath;
    }
    
    /**
     * Generate a summary of the content
     * @param {string} content - The content to summarize
     * @returns {object} - Content summary
     * @private
     */
    _generateContentSummary(content) {
        // Count words
        const wordCount = content.split(/\s+/).length;
        
        // Count sections (markdown headers)
        const sectionCount = (content.match(/^#+\s+/gm) || []).length;
        
        // Extract main topics (could be improved with NLP)
        const topics = new Set();
        const lines = content.split('\n');
        for (const line of lines) {
            if (line.startsWith('## ')) {
                const topic = line.replace('## ', '').trim();
                topics.add(topic);
            }
        }
        
        return {
            wordCount,
            sectionCount,
            topicCount: topics.size,
            sampleTopics: Array.from(topics).slice(0, 10)
        };
    }
    
    /**
     * Build an agent profile from the library
     * @param {string} target - The target tool
     * @param {string} libraryPath - Path to the library file
     * @returns {Promise<string>} - Path to the created agent profile
     * @private
     */
    async _buildAgentProfile(target, libraryPath) {
        this.logger.info(`Building agent profile for ${target}`);
        
        // Load library data
        const libraryData = await fs.readJson(libraryPath);
        
        // Create agent profile
        const profileData = {
            id: uuidv4(),
            name: `${target.charAt(0).toUpperCase() + target.slice(1)} Expert Agent`,
            description: `An AI agent specialized in ${target} with comprehensive knowledge of tutorials and best practices`,
            createdAt: new Date().toISOString(),
            target: target,
            libraryId: libraryData.id,
            capabilities: this._getToolCapabilities(target),
            integrations: this._getToolIntegrations(target),
            version: '1.0.0'
        };
        
        // Save agent profile
        const profilePath = path.join(this.options.profilesDir, `${target}_agent_profile.json`);
        await fs.writeJson(profilePath, profileData, { spaces: 2 });
        
        return profilePath;
    }
    
    /**
     * Get capabilities for a specific tool
     * @param {string} target - The target tool
     * @returns {Array<string>} - List of capabilities
     * @private
     */
    _getToolCapabilities(target) {
        const commonCapabilities = [
            'tutorial_guidance',
            'error_troubleshooting',
            'best_practices',
            'workflow_optimization'
        ];
        
        const specificCapabilities = {
            'blender': [
                'modeling_techniques',
                'texturing',
                'rigging',
                'animation',
                'rendering',
                'node_editor',
                'python_scripting',
                'screen_interaction'
            ],
            'autocad': [
                '2d_drafting',
                '3d_modeling',
                'parametric_design',
                'technical_drawing',
                'annotation'
            ],
            'sketchup': [
                '3d_modeling',
                'layout_design',
                'extension_usage',
                'rendering'
            ]
            // Add more tool-specific capabilities as needed
        };
        
        return [
            ...commonCapabilities,
            ...(specificCapabilities[target.toLowerCase()] || [])
        ];
    }
    
    /**
     * Get integrations for a specific tool
     * @param {string} target - The target tool
     * @returns {Array<object>} - List of integrations
     * @private
     */
    _getToolIntegrations(target) {
        const integrations = [];
        
        // Add the tool itself as primary integration
        integrations.push({
            name: target,
            type: 'primary',
            capabilities: ['full_api_access', 'screen_interaction']
        });
        
        // Add related tools as secondary integrations
        const relatedTools = {
            'blender': ['autocad', 'sketchup', '3dsmax'],
            'autocad': ['zoo.io', 'sketchup'],
            'sketchup': ['autocad', 'blender'],
            // Add more related tools as needed
        };
        
        const related = relatedTools[target.toLowerCase()] || [];
        for (const relatedTool of related) {
            integrations.push({
                name: relatedTool,
                type: 'secondary',
                capabilities: ['file_import_export', 'format_conversion']
            });
        }
        
        return integrations;
    }
    
    /**
     * React component for displaying the agent profile
     * @param {object} props - Component properties
     * @returns {React.Component} - React component
     */
    AgentProfileViewer = (props) => {
        const { profileId } = props;
        const [profile, setProfile] = React.useState(null);
        const [loading, setLoading] = React.useState(true);
        const [error, setError] = React.useState(null);
        
        React.useEffect(() => {
            const loadProfile = async () => {
                try {
                    // Find the profile file
                    const files = await fs.readdir(this.options.profilesDir);
                    const profileFile = files.find(file => file.includes(profileId));
                    
                    if (!profileFile) {
                        throw new Error(`Profile with ID ${profileId} not found`);
                    }
                    
                    const profileData = await fs.readJson(path.join(this.options.profilesDir, profileFile));
                    setProfile(profileData);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            
            loadProfile();
        }, [profileId]);
        
        if (loading) {
            return React.createElement('div', null, 'Loading agent profile...');
        }
        
        if (error) {
            return React.createElement('div', { style: { color: 'red' } }, `Error: ${error}`);
        }
        
        if (!profile) {
            return React.createElement('div', null, 'Profile not found');
        }
        
        return React.createElement(
            'div',
            { className: 'agent-profile-viewer' },
            React.createElement('h2', null, profile.name),
            React.createElement('p', null, profile.description),
            React.createElement('h3', null, 'Capabilities'),
            React.createElement(
                'ul',
                null,
                profile.capabilities.map((capability, index) => 
                    React.createElement('li', { key: index }, capability.replace(/_/g, ' '))
                )
            ),
            React.createElement('h3', null, 'Integrations'),
            React.createElement(
                'ul',
                null,
                profile.integrations.map((integration, index) => 
                    React.createElement(
                        'li',
                        { key: index },
                        `${integration.name} (${integration.type}): ${integration.capabilities.join(', ')}`
                    )
                )
            )
        );
    };
}

module.exports = WebScraperAgent;
