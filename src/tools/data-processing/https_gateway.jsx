const React = require('react');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * DullCowEyes - A Puppeteer-based web page interaction utility for Mr Smith
 * Provides screenshot capture, grid overlay, and click position tracking
 * Can be embedded within other tools to provide web browsing capabilities
 */
class DullCowEyes {
    constructor(options = {}) {
        this.options = {
            screenshotDir: path.join(process.cwd(), 'data', 'screenshots'),
            overlayDir: path.join(process.cwd(), 'data', 'overlays'),
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            headless: true,
            viewportWidth: 1920,
            viewportHeight: 1080,
            ...options
        };
        
        // Ensure directories exist
        fs.ensureDirSync(this.options.screenshotDir);
        fs.ensureDirSync(this.options.overlayDir);
        
        // Track website interaction history
        this.websiteInteractions = new Map();
        
        this.logger = options.logger || console;
        this.browser = null;
    }
    
    /**
     * Initialize the Puppeteer browser instance
     * @returns {Promise<void>}
     */
    async initialize() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: this.options.headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
    }
    
    /**
     * Close the Puppeteer browser instance
     * @returns {Promise<void>}
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
    
    /**
     * Open a web page and capture a screenshot with grid overlay
     * @param {string} url - The URL to open
     * @param {object} options - Additional options for the request
     * @returns {Promise<object>} - Screenshot and overlay information
     */
    async openWebPage(url, options = {}) {
        try {
            // Initialize browser if not already done
            if (!this.browser) {
                await this.initialize();
            }
            
            // Generate a unique ID for this interaction
            const interactionId = uuidv4();
            
            // Create a new page
            const page = await this.browser.newPage();
            
            // Set viewport and user agent
            await page.setViewport({
                width: this.options.viewportWidth,
                height: this.options.viewportHeight
            });
            
            await page.setUserAgent(this.options.userAgent);
            
            // Set additional headers if provided
            if (options.headers) {
                await page.setExtraHTTPHeaders(options.headers);
            }
            
            // Navigate to the URL
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: options.timeout || 30000
            });
            
            // Get page title
            const pageTitle = await page.title();
            
            // Generate screenshot filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const domain = new URL(url).hostname;
            const screenshotFilename = `${domain}_${timestamp}.png`;
            const screenshotPath = path.join(this.options.screenshotDir, screenshotFilename);
            
            // Take screenshot
            await page.screenshot({ path: screenshotPath, fullPage: false });
            
            // Create overlay grid
            const overlayData = this._generateOverlayGrid(this.options.viewportWidth, this.options.viewportHeight);
            const overlayFilename = `${domain}_${timestamp}_overlay.json`;
            const overlayPath = path.join(this.options.overlayDir, overlayFilename);
            
            // Save overlay data
            await fs.writeJson(overlayPath, overlayData);
            
            // Store interaction data
            const interactionData = {
                id: interactionId,
                url,
                timestamp: new Date().toISOString(),
                screenshotPath,
                overlayPath,
                pageTitle,
                clickPositions: []
            };
            
            this.websiteInteractions.set(interactionId, interactionData);
            
            // Close the page
            await page.close();
            
            return {
                interactionId,
                screenshotPath,
                overlayPath,
                pageTitle,
                status: 'success'
            };
        } catch (error) {
            this.logger.error('Error opening web page with DullCowEyes:', error);
            throw new Error(`Failed to open web page: ${error.message}`);
        }
    }
    
    /**
     * Record a click position on the web page
     * @param {string} interactionId - The ID of the interaction
     * @param {number} x - X coordinate of the click
     * @param {number} y - Y coordinate of the click
     * @returns {object} - Updated click position data
     */
    recordClickPosition(interactionId, x, y) {
        if (!this.websiteInteractions.has(interactionId)) {
            throw new Error(`Interaction with ID ${interactionId} not found`);
        }
        
        const interaction = this.websiteInteractions.get(interactionId);
        const clickPosition = {
            x,
            y,
            timestamp: new Date().toISOString()
        };
        
        interaction.clickPositions.push(clickPosition);
        
        return {
            interactionId,
            clickPosition,
            totalClicks: interaction.clickPositions.length
        };
    }
    
    /**
     * Simulate a click on the web page at the specified coordinates
     * @param {string} interactionId - The ID of the interaction
     * @param {number} x - X coordinate of the click
     * @param {number} y - Y coordinate of the click
     * @returns {Promise<object>} - Result of the click operation
     */
    async simulateClick(interactionId, x, y) {
        try {
            if (!this.websiteInteractions.has(interactionId)) {
                throw new Error(`Interaction with ID ${interactionId} not found`);
            }
            
            if (!this.browser) {
                await this.initialize();
            }
            
            const interaction = this.websiteInteractions.get(interactionId);
            const page = await this.browser.newPage();
            
            await page.setViewport({
                width: this.options.viewportWidth,
                height: this.options.viewportHeight
            });
            
            await page.goto(interaction.url, { waitUntil: 'networkidle2' });
            
            // Perform the click
            await page.mouse.click(x, y);
            
            // Record the click position
            this.recordClickPosition(interactionId, x, y);
            
            // Take a new screenshot after the click
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const domain = new URL(interaction.url).hostname;
            const screenshotFilename = `${domain}_${timestamp}_after_click.png`;
            const screenshotPath = path.join(this.options.screenshotDir, screenshotFilename);
            
            await page.screenshot({ path: screenshotPath, fullPage: false });
            
            await page.close();
            
            return {
                interactionId,
                clickPosition: { x, y },
                screenshotPath,
                status: 'success'
            };
        } catch (error) {
            this.logger.error('Error simulating click:', error);
            throw new Error(`Failed to simulate click: ${error.message}`);
        }
    }
    
    /**
     * Get overlay data for a specific website domain
     * @param {string} domain - Website domain to retrieve overlay for
     * @returns {Promise<object|null>} - The most recent overlay data for the domain
     */
    async getOverlayForDomain(domain) {
        try {
            const files = await fs.readdir(this.options.overlayDir);
            
            // Filter files for the specific domain and sort by date (newest first)
            const domainFiles = files
                .filter(file => file.startsWith(`${domain}_`) && file.endsWith('_overlay.json'))
                .sort()
                .reverse();
            
            if (domainFiles.length === 0) {
                return null;
            }
            
            // Return the most recent overlay
            const overlayPath = path.join(this.options.overlayDir, domainFiles[0]);
            return await fs.readJson(overlayPath);
        } catch (error) {
            this.logger.error('Error retrieving overlay for domain:', error);
            return null;
        }
    }
    
    /**
     * Generate a grid overlay for click position tracking
     * @param {number} width - Width of the viewport
     * @param {number} height - Height of the viewport
     * @returns {object} - Grid overlay data
     * @private
     */
    _generateOverlayGrid(width, height) {
        return {
            width,
            height,
            gridSize: 20,
            gridColor: 'rgba(255, 0, 0, 0.3)',
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * React component for rendering the web page with overlay
     * @param {object} props - Component properties
     * @returns {React.Component} - React component
     */
    WebPageViewer = (props) => {
        const { interactionId, onClickPosition } = props;
        
        if (!this.websiteInteractions.has(interactionId)) {
            return React.createElement('div', null, 'Interaction not found');
        }
        
        const interaction = this.websiteInteractions.get(interactionId);
        
        const handleClick = (event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.recordClickPosition(interactionId, x, y);
            
            if (typeof onClickPosition === 'function') {
                onClickPosition(x, y);
            }
        };
        
        // Create grid lines for overlay
        const createGridLines = () => {
            const gridSize = 20;
            const lines = [];
            
            // Horizontal lines
            for (let y = 0; y <= interaction.height; y += gridSize) {
                lines.push(
                    React.createElement('line', {
                        key: `h-${y}`,
                        x1: 0,
                        y1: y,
                        x2: interaction.width,
                        y2: y,
                        stroke: 'rgba(255, 0, 0, 0.3)',
                        strokeWidth: 1
                    })
                );
            }
            
            // Vertical lines
            for (let x = 0; x <= interaction.width; x += gridSize) {
                lines.push(
                    React.createElement('line', {
                        key: `v-${x}`,
                        x1: x,
                        y1: 0,
                        x2: x,
                        y2: interaction.height,
                        stroke: 'rgba(255, 0, 0, 0.3)',
                        strokeWidth: 1
                    })
                );
            }
            
            return lines;
        };
        
        // Create markers for click positions
        const createClickMarkers = () => {
            return interaction.clickPositions.map((pos, index) => 
                React.createElement('circle', {
                    key: `click-${index}`,
                    cx: pos.x,
                    cy: pos.y,
                    r: 5,
                    fill: 'rgba(255, 0, 0, 0.7)'
                })
            );
        };
        
        return React.createElement(
            'div',
            { className: 'dull-cow-eyes-viewer' },
            React.createElement(
                'h2',
                null,
                `${interaction.pageTitle} - DullCowEyes View`
            ),
            React.createElement(
                'div',
                { className: 'screenshot-container', style: { position: 'relative' } },
                React.createElement('img', {
                    src: interaction.screenshotPath,
                    alt: 'Web page screenshot',
                    onClick: handleClick,
                    style: { cursor: 'pointer', maxWidth: '100%' }
                }),
                React.createElement(
                    'svg',
                    {
                        style: {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none'
                        },
                        viewBox: `0 0 ${interaction.width} ${interaction.height}`
                    },
                    createGridLines(),
                    createClickMarkers()
                )
            ),
            React.createElement(
                'div',
                { className: 'click-positions' },
                React.createElement('h3', null, 'Click Positions'),
                React.createElement(
                    'ul',
                    null,
                    interaction.clickPositions.map((pos, index) => 
                        React.createElement(
                            'li',
                            { key: index },
                            `Click ${index + 1}: (${pos.x}, ${pos.y}) at ${new Date(pos.timestamp).toLocaleTimeString()}`
                        )
                    )
                )
            )
        );
    };
}

module.exports = DullCowEyes;

