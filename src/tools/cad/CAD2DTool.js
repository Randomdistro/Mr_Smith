/**
 * CAD2DTool - Tool for 2D CAD operations
 * Handles technical drawings and 2D modeling
 */

const BaseTool = require('../BaseTool');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class CAD2DTool extends BaseTool {
    constructor(config = {}) {
        super({
            name: 'CAD2DTool',
            description: 'Tool for 2D CAD operations',
            ...config
        });
        
        this.drawings = new Map();
        this.dataDir = path.join(process.cwd(), 'data', 'cad_drawings');
        
        // Ensure directory exists
        fs.ensureDirSync(this.dataDir);
        
        this.supportedActions = [
            'create-drawing',
            'modify-drawing',
            'export-drawing',
            'add-annotations'
        ];
    }
    
    async execute(params) {
        const { action } = params;
        
        if (!this.supportedActions.includes(action)) {
            throw new Error(`Unsupported action: ${action}`);
        }
        
        switch (action) {
            case 'create-drawing':
                return await this.createDrawing(params);
            case 'modify-drawing':
                return await this.modifyDrawing(params);
            case 'export-drawing':
                return await this.exportDrawing(params);
            case 'add-annotations':
                return await this.addAnnotations(params);
            default:
                throw new Error(`Unimplemented action: ${action}`);
        }
    }
    
    async createDrawing({ projectName, specifications, libraryComponents = [] }) {
        try {
            const drawingId = `drawing-${Date.now()}`;
            const drawingDir = path.join(this.dataDir, drawingId);
            fs.ensureDirSync(drawingDir);
            
            // Create SVG drawing file
            const svgFilePath = path.join(drawingDir, `${projectName}.svg`);
            
            // Generate SVG content based on specifications
            const svgContent = this._generateSVGDrawing(projectName, specifications, libraryComponents);
            fs.writeFileSync(svgFilePath, svgContent);
            
            // Create DXF file for CAD compatibility
            const dxfFilePath = path.join(drawingDir, `${projectName}.dxf`);
            
            // In a real implementation, you would use a library like svg2dxf
            // Here we just create a mock DXF file
            fs.writeFileSync(dxfFilePath, `Mock DXF file for ${projectName}`);
            
            // Create drawing metadata
            const drawing = {
                id: drawingId,
                name: projectName,
                type: '2d',
                specifications,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                files: {
                    svg: svgFilePath,
                    dxf: dxfFilePath
                },
                layers: this._generateLayers(specifications),
                dimensions: this._generateDimensions(specifications),
                annotations: this._generateAnnotations(specifications)
            };
            
            // Store the drawing
            this.drawings.set(drawingId, drawing);
            
            // Save drawing metadata
            fs.writeJsonSync(path.join(drawingDir, 'metadata.json'), drawing, { spaces: 2 });
            
            return {
                status: 'success',
                drawingId,
                drawing,
                files: {
                    svg: svgFilePath,
                    dxf: dxfFilePath
                }
            };
            
        } catch (error) {
            console.error('Error creating 2D drawing:', error);
            throw error;
        }
    }
    
    async modifyDrawing({ drawingId, modifications }) {
        try {
            const drawing = this.drawings.get(drawingId);
            
            if (!drawing) {
                return {
                    status: 'error',
                    message: 'Drawing not found'
                };
            }
            
            const drawingDir = path.dirname(drawing.files.svg);
            
            // Read current SVG
            const currentSvg = fs.readFileSync(drawing.files.svg, 'utf8');
            
            // Apply modifications to SVG
            const modifiedSvg = this._applySVGModifications(currentSvg, modifications);
            
            // Save modified SVG
            fs.writeFileSync(drawing.files.svg, modifiedSvg);
            
            // Update DXF file
            // In a real implementation, you would convert the modified SVG to DXF
            // Here we just update the mock DXF file
            fs.writeFileSync(drawing.files.dxf, `Modified DXF file for ${drawing.name} - ${Date.now()}`);
            
            // Update drawing metadata
            const updatedDrawing = {
                ...drawing,
                updatedAt: new Date().toISOString(),
                modifications: [
                    ...(drawing.modifications || []),
                    {
                        timestamp: new Date().toISOString(),
                        description: modifications.description || 'Drawing modified',
                        details: modifications
                    }
                ]
            };
            
            // If modifications include layer changes
            if (modifications.layers) {
                updatedDrawing.layers = [
                    ...drawing.layers.filter(layer => !modifications.layers.find(l => l.name === layer.name)),
                    ...modifications.layers
                ];
            }
            
            // If modifications include dimension changes
            if (modifications.dimensions) {
                updatedDrawing.dimensions = [
                    ...drawing.dimensions.filter(dim => !modifications.dimensions.find(d => d.id === dim.id)),
                    ...modifications.dimensions
                ];
            }
            
            // Store the updated drawing
            this.drawings.set(drawingId, updatedDrawing);
            
            // Save updated drawing metadata
            fs.writeJsonSync(path.join(drawingDir, 'metadata.json'), updatedDrawing, { spaces: 2 });
            
            return {
                status: 'success',
                drawingId,
                drawing: updatedDrawing
            };
            
        } catch (error) {
            console.error('Error modifying 2D drawing:', error);
            throw error;
        }
    }
    
    async exportDrawing({ drawingId, format = 'pdf' }) {
        try {
            const drawing = this.drawings.get(drawingId);
            
            if (!drawing) {
                return {
                    status: 'error',
                    message: 'Drawing not found'
                };
            }
            
            const drawingDir = path.dirname(drawing.files.svg);
            const exportFilePath = path.join(drawingDir, `${drawing.name}.${format.toLowerCase()}`);
            
            switch (format.toLowerCase()) {
                case 'pdf':
                    // In a real implementation, you would use a library like svg-to-pdf
                    // Here we just create a mock PDF file
                    fs.writeFileSync(exportFilePath, `Mock PDF file for ${drawing.name}`);
                    break;
                    
                case 'png':
                    // In a real implementation, you would use a library like sharp or convert
                    // Here we just create a mock PNG file
                    fs.writeFileSync(exportFilePath, `Mock PNG file for ${drawing.name}`);
                    break;
                    
                case 'dxf':
                    // Just copy the existing DXF file
                    fs.copyFileSync(drawing.files.dxf, exportFilePath);
                    break;
                    
                default:
                    return {
                        status: 'error',
                        message: `Unsupported export format: ${format}`
                    };
            }
            
            // Update drawing metadata
            const updatedDrawing = {
                ...drawing,
                updatedAt: new Date().toISOString(),
                files: {
                    ...drawing.files,
                    exports: {
                        ...(drawing.files.exports || {}),
                        [format]: exportFilePath
                    }
                }
            };
            
            // Store the updated drawing
            this.drawings.set(drawingId, updatedDrawing);
            
            // Save updated drawing metadata
            fs.writeJsonSync(path.join(drawingDir, 'metadata.json'), updatedDrawing, { spaces: 2 });
            
            return {
                status: 'success',
                drawingId,
                exportPath: exportFilePath,
                format
            };
            
        } catch (error) {
            console.error('Error exporting 2D drawing:', error);
            throw error;
        }
    }
    
    async addAnnotations({ drawingId, annotations }) {
        try {
            const drawing = this.drawings.get(drawingId);
            
            if (!drawing) {
                return {
                    status: 'error',
                    message: 'Drawing not found'
                };
            }
            
            // Read current SVG
            const currentSvg = fs.readFileSync(drawing.files.svg, 'utf8');
            
            // Add annotations to SVG
            const annotatedSvg = this._addAnnotationsToSVG(currentSvg, annotations);
            
            // Save modified SVG
            fs.writeFileSync(drawing.files.svg, annotatedSvg);
            
            // Update drawing metadata
            const updatedDrawing = {
                ...drawing,
                updatedAt: new Date().toISOString(),
                annotations: [
                    ...(drawing.annotations || []),
                    ...annotations
                ]
            };
            
            // Store the updated drawing
            this.drawings.set(drawingId, updatedDrawing);
            
            // Save updated drawing metadata
            const drawingDir = path.dirname(drawing.files.svg);
            fs.writeJsonSync(path.join(drawingDir, 'metadata.json'), updatedDrawing, { spaces: 2 });
            
            return {
                status: 'success',
                drawingId,
                drawing: updatedDrawing
            };
            
        } catch (error) {
            console.error('Error adding annotations to 2D drawing:', error);
            throw error;
        }
    }
    
    // Private helper methods
    
    _generateSVGDrawing(projectName, specifications, libraryComponents) {
        // Generate a simple SVG drawing based on specifications
        // In a real implementation, this would be much more sophisticated
        
        const width = specifications.dimensions?.width || 800;
        const height = specifications.dimensions?.height || 600;
        
        let svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <title>${projectName}</title>
    <desc>Generated ${new Date().toISOString()}</desc>
`;

        // Add a border
        svgContent += `    <rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="none" stroke="black" stroke-width="1" />\n`;
        
        // Add title block
        svgContent += `    <g id="title-block">
        <rect x="${width - 200}" y="${height - 80}" width="190" height="70" fill="none" stroke="black" stroke-width="1" />
        <text x="${width - 190}" y="${height - 60}" font-family="Arial" font-size="12">${projectName}</text>
        <text x="${width - 190}" y="${height - 40}" font-family="Arial" font-size="10">Date: ${new Date().toLocaleDateString()}</text>
        <text x="${width - 190}" y="${height - 20}" font-family="Arial" font-size="10">Scale: 1:1</text>
    </g>\n`;
        
        // Add specific content based on specifications
        if (specifications.type === 'mechanical') {
            svgContent += this._generateMechanicalDrawingSVG(specifications);
        } else if (specifications.type === 'architectural') {
            svgContent += this._generateArchitecturalDrawingSVG(specifications);
        } else if (specifications.type === 'electrical') {
            svgContent += this._generateElectricalDrawingSVG(specifications);
        } else {
            // Default drawing with some basic shapes
            svgContent += `    <g id="default-drawing">
        <rect x="100" y="100" width="200" height="150" fill="none" stroke="black" stroke-width="1" />
        <circle cx="300" cy="200" r="50" fill="none" stroke="black" stroke-width="1" />
        <line x1="100" y1="250" x2="300" y2="250" stroke="black" stroke-width="1" />
    </g>\n`;
        }
        
        // Add library components if any
        if (libraryComponents && libraryComponents.length > 0) {
            svgContent += `    <g id="library-components">\n`;
            
            libraryComponents.forEach((component, index) => {
                const x = 400 + (index % 2) * 150;
                const y = 100 + Math.floor(index / 2) * 150;
                
                svgContent += `        <g id="component-${index}" transform="translate(${x}, ${y})">
            <rect x="0" y="0" width="100" height="100" fill="none" stroke="black" stroke-width="1" />
            <text x="10" y="20" font-family="Arial" font-size="10">${component.name || 'Component'}</text>
        </g>\n`;
            });
            
            svgContent += `    </g>\n`;
        }
        
        // Close the SVG
        svgContent += `</svg>`;
        
        return svgContent;
    }
    
    _generateMechanicalDrawingSVG(specifications) {
        // Generate mechanical drawing with front, top, and side views
        return `    <g id="mechanical-drawing">
        <!-- Front View -->
        <g id="front-view" transform="translate(100, 100)">
            <rect x="0" y="0" width="200" height="150" fill="none" stroke="black" stroke-width="1" />
            <text x="5" y="-5" font-family="Arial" font-size="10">Front View</text>
            <circle cx="100" cy="75" r="50" fill="none" stroke="black" stroke-width="1" />
            <line x1="50" y1="75" x2="150" y2="75" stroke="black" stroke-width="1" stroke-dasharray="5,5" />
        </g>
        
        <!-- Top View -->
        <g id="top-view" transform="translate(100, 300)">
            <rect x="0" y="0" width="200" height="100" fill="none" stroke="black" stroke-width="1" />
            <text x="5" y="-5" font-family="Arial" font-size="10">Top View</text>
            <ellipse cx="100" cy="50" rx="80" ry="40" fill="none" stroke="black" stroke-width="1" />
        </g>
        
        <!-- Side View -->
        <g id="side-view" transform="translate(400, 100)">
            <rect x="0" y="0" width="100" height="150" fill="none" stroke="black" stroke-width="1" />
            <text x="5" y="-5" font-family="Arial" font-size="10">Side View</text>
            <line x1="0" y1="75" x2="100" y2="75" stroke="black" stroke-width="1" stroke-dasharray="5,5" />
            <path d="M 0,75 Q 50,25 100,75" fill="none" stroke="black" stroke-width="1" />
        </g>
        
        <!-- Dimensions -->
        <g id="dimensions" stroke="blue" fill="none" stroke-width="0.5">
            <line x1="100" y1="260" x2="300" y2="260" stroke="blue" />
            <line x1="100" y1="255" x2="100" y2="265" stroke="blue" />
            <line x1="300" y1="255" x2="300" y2="265" stroke="blue" />
            <text x="190" y="275" font-family="Arial" font-size="10" fill="blue" text-anchor="middle">200</text>
        </g>
    </g>`;
    }
    
    _generateArchitecturalDrawingSVG(specifications) {
        // Generate architectural floor plan
        return `    <g id="architectural-drawing">
        <!-- Floor Plan -->
        <g id="floor-plan" transform="translate(100, 100)">
            <!-- Outer Walls -->
            <rect x="0" y="0" width="400" height="300" fill="none" stroke="black" stroke-width="2" />
            
            <!-- Interior Walls -->
            <line x1="200" y1="0" x2="200" y2="150" stroke="black" stroke-width="2" />
            <line x1="200" y1="150" x2="400" y2="150" stroke="black" stroke-width="2" />
            <line x1="0" y1="200" x2="300" y2="200" stroke="black" stroke-width="2" />
            
            <!-- Doors -->
            <path d="M 200,0 A 30,30 0 0 1 230,30" fill="none" stroke="black" stroke-width="1" />
            <line x1="300" y1="200" x2="330" y2="170" stroke="black" stroke-width="1" />
            
            <!-- Windows -->
            <line x1="50" y1="0" x2="150" y2="0" stroke="black" stroke-width="1" />
            <line x1="50" y1="5" x2="150" y2="5" stroke="black" stroke-width="1" />
            <line x1="250" y1="300" x2="350" y2="300" stroke="black" stroke-width="1" />
            <line x1="250" y1="295" x2="350" y2="295" stroke="black" stroke-width="1" />
            
            <!-- Labels -->
            <text x="90" y="100" font-family="Arial" font-size="12" text-anchor="middle">Bedroom</text>
            <text x="300" y="100" font-family="Arial" font-size="12" text-anchor="middle">Kitchen</text>
            <text x="150" y="250" font-family="Arial" font-size="12" text-anchor="middle">Living Room</text>
            <text x="350" y="250" font-family="Arial" font-size="12" text-anchor="middle">Bath</text>
        </g>
        
        <!-- Legend -->
        <g id="legend" transform="translate(550, 100)">
            <rect x="0" y="0" width="150" height="100" fill="none" stroke="black" stroke-width="1" />
            <text x="10" y="20" font-family="Arial" font-size="10">Legend</text>
            <line x1="10" y1="40" x2="30" y2="40" stroke="black" stroke-width="2" />
            <text x="40" y="45" font-family="Arial" font-size="8">Wall</text>
            <line x1="10" y1="60" x2="30" y2="60" stroke="black" stroke-width="1" />
            <text x="40" y="65" font-family="Arial" font-size="8">Window</text>
            <path d="M 10,80 A 10,10 0 0 1 20,90" fill="none" stroke="black" stroke-width="1" />
            <text x="40" y="85" font-family="Arial" font-size="8">Door</text>
        </g>
    </g>`;
    }
    
    _generateElectricalDrawingSVG(specifications) {
        // Generate electrical schematic
        return `    <g id="electrical-drawing">
        <!-- Power Source -->
        <g id="power-source" transform="translate(100, 100)">
            <circle cx="0" cy="0" r="20" fill="none" stroke="black" stroke-width="1" />
            <text x="0" y="0" font-family="Arial" font-size="10" text-anchor="middle" dominant-baseline="middle">AC</text>
            <line x1="20" y1="0" x2="50" y2="0" stroke="black" stroke-width="1" />
        </g>
        
        <!-- Transformer -->
        <g id="transformer" transform="translate(150, 100)">
            <circle cx="0" cy="-20" r="10" fill="none" stroke="black" stroke-width="1" />
            <circle cx="0" cy="20" r="10" fill="none" stroke="black" stroke-width="1" />
            <line x1="0" y1="-10" x2="0" y2="10" stroke="black" stroke-width="1" />
            <line x1="0" y1="-30" x2="0" y2="-20" stroke="black" stroke-width="1" />
            <line x1="0" y1="20" x2="0" y2="30" stroke="black" stroke-width="1" />
            <line x1="0" y1="30" x2="50" y2="30" stroke="black" stroke-width="1" />
            <line x1="0" y1="-30" x2="50" y2="-30" stroke="black" stroke-width="1" />
        </g>
        
        <!-- Rectifier -->
        <g id="rectifier" transform="translate(200, 70)">
            <path d="M 0,0 L 20,20 L 40,0 L 20,-20 Z" fill="none" stroke="black" stroke-width="1" />
            <line x1="40" y1="0" x2="70" y2="0" stroke="black" stroke-width="1" />
            <line x1="20" y1="-20" x2="20" y2="-30" stroke="black" stroke-width="1" />
            <line x1="20" y1="20" x2="20" y2="30" stroke="black" stroke-width="1" />
            <text x="20" y="0" font-family="Arial" font-size="8" text-anchor="middle" dominant-baseline="middle">BR</text>
        </g>
        
        <!-- Capacitor -->
        <g id="capacitor" transform="translate(270, 70)">
            <line x1="0" y1="-15" x2="0" y2="15" stroke="black" stroke-width="2" />
            <line x1="10" y1="-15" x2="10" y2="15" stroke="black" stroke-width="2" />
            <line x1="-10" y1="0" x2="0" y2="0" stroke="black" stroke-width="1" />
            <line x1="10" y1="0" x2="20" y2="0" stroke="black" stroke-width="1" />
        </g>
        
        <!-- Load -->
        <g id="load" transform="translate(340, 70)">
            <rect x="-20" y="-10" width="40" height="20" fill="none" stroke="black" stroke-width="1" />
            <text x="0" y="0" font-family="Arial" font-size="8" text-anchor="middle" dominant-baseline="middle">LOAD</text>
            <line x1="-20" y1="0" x2="-40" y2="0" stroke="black" stroke-width="1" />
            <line x1="20" y1="0" x2="40" y2="0" stroke="black" stroke-width="1" />
        </g>
        
        <!-- Ground -->
        <g id="ground" transform="translate(380, 100)">
            <line x1="0" y1="0" x2="0" y2="30" stroke="black" stroke-width="1" />
            <line x1="-15" y1="30" x2="15" y2="30" stroke="black" stroke-width="1" />
            <line x1="-10" y1="35" x2="10" y2="35" stroke="black" stroke-width="1" />
            <line x1="-5" y1="40" x2="5" y2="40" stroke="black" stroke-width="1" />
        </g>
    </g>`;
    }
    
    _applySVGModifications(svgContent, modifications) {
        // Simple implementation to demonstrate the concept
        // In a real application, you would use a proper SVG manipulation library
        
        let modifiedSvg = svgContent;
        
        // Add a comment with the modification information
        modifiedSvg = modifiedSvg.replace('</svg>', `
    <!-- 
    Modification applied: ${new Date().toISOString()}
    Description: ${modifications.description || 'No description provided'}
    -->
</svg>`);

        // If there's specific SVG content to add or replace
        if (modifications.svgContent) {
            // Find the last group before the closing tag
            const lastGroupIndex = modifiedSvg.lastIndexOf('</g>');
            
            if (lastGroupIndex !== -1) {
                // Insert the new content before the closing SVG tag
                modifiedSvg = modifiedSvg.substring(0, lastGroupIndex + 4) + 
                              `\n    <g id="modification-${Date.now()}">\n        ${modifications.svgContent}\n    </g>\n` + 
                              modifiedSvg.substring(lastGroupIndex + 4);
            }
        }
        
        return modifiedSvg;
    }
    
    _addAnnotationsToSVG(svgContent, annotations) {
        // Add annotations to the SVG
        let annotatedSvg = svgContent;
        
        // Find the closing SVG tag
        const svgCloseIndex = annotatedSvg.lastIndexOf('</svg>');
        
        if (svgCloseIndex !== -1) {
            let annotationsGroup = `    <g id="annotations-${Date.now()}" stroke="red" fill="none" stroke-width="0.5">\n`;
            
            annotations.forEach((annotation, index) => {
                annotationsGroup += `        <g id="annotation-${index}">\n`;
                
                // Add leader line or connection
                if (annotation.x1 !== undefined && annotation.y1 !== undefined && 
                    annotation.x2 !== undefined && annotation.y2 !== undefined) {
                    annotationsGroup += `            <line x1="${annotation.x1}" y1="${annotation.y1}" x2="${annotation.x2}" y2="${annotation.y2}" stroke="red" stroke-width="0.5" />\n`;
                }
                
                // Add text
                if (annotation.text && annotation.x !== undefined && annotation.y !== undefined) {
                    annotationsGroup += `            <text x="${annotation.x}" y="${annotation.y}" font-family="Arial" font-size="10" fill="red">${annotation.text}</text>\n`;
                }
                
                annotationsGroup += `        </g>\n`;
            });
            
            annotationsGroup += `    </g>\n`;
            
            // Insert the annotations group before the closing SVG tag
            annotatedSvg = annotatedSvg.substring(0, svgCloseIndex) + annotationsGroup + annotatedSvg.substring(svgCloseIndex);
        }
        
        return annotatedSvg;
    }
    
    _generateLayers(specifications) {
        // Generate layers based on specifications
        const layers = [];
        
        if (specifications.layers) {
            return specifications.layers;
        }
        
        // Default layers
        layers.push({ name: 'Base', visible: true, locked: false, color: '#000000' });
        
        if (specifications.type === 'mechanical') {
            layers.push({ name: 'Dimensions', visible: true, locked: false, color: '#0000FF' });
            layers.push({ name: 'Annotations', visible: true, locked: false, color: '#FF0000' });
            layers.push({ name: 'Hidden Lines', visible: true, locked: false, color: '#999999' });
        } else if (specifications.type === 'architectural') {
            layers.push({ name: 'Walls', visible: true, locked: false, color: '#000000' });
            layers.push({ name: 'Doors', visible: true, locked: false, color: '#0000FF' });
            layers.push({ name: 'Windows', visible: true, locked: false, color: '#00FF00' });
            layers.push({ name: 'Furniture', visible: true, locked: false, color: '#999999' });
            layers.push({ name: 'Dimensions', visible: true, locked: false, color: '#FF0000' });
        } else if (specifications.type === 'electrical') {
            layers.push({ name: 'Power', visible: true, locked: false, color: '#FF0000' });
            layers.push({ name: 'Ground', visible: true, locked: false, color: '#00FF00' });
            layers.push({ name: 'Signals', visible: true, locked: false, color: '#0000FF' });
            layers.push({ name: 'Labels', visible: true, locked: false, color: '#000000' });
        }
        
        return layers;
    }
    
    _generateDimensions(specifications) {
        // Generate dimensions based on specifications
        const dimensions = [];
        
        if (specifications.dimensions) {
            return specifications.dimensions;
        }
        
        // Add some mock dimensions
        dimensions.push({
            id: 'dim-1',
            type: 'linear',
            x1: 100,
            y1: 250,
            x2: 300,
            y2: 250,
            value: '200',
            unit: 'mm'
        });
        
        dimensions.push({
            id: 'dim-2',
            type: 'linear',
            x1: 400,
            y1: 100,
            x2: 400,
            y2: 250,
            value: '150',
            unit: 'mm'
        });
        
        if (specifications.type === 'mechanical') {
            dimensions.push({
                id: 'dim-3',
                type: 'radius',
                x: 200,
                y: 175,
                radius: 50,
                value: 'R50',
                unit: 'mm'
            });
        }
        
        return dimensions;
    }
    
    _generateAnnotations(specifications) {
        // Generate annotations based on specifications
        const annotations = [];
        
        if (specifications.annotations) {
            return specifications.annotations;
        }
        
        // Add some mock annotations
        annotations.push({
            id: 'annot-1',
            x: 150,
            y: 50,
            text: 'NOTE: All dimensions in mm',
            type: 'note'
        });
        
        if (specifications.type === 'mechanical') {
            annotations.push({
                id: 'annot-2',
                x1: 200,
                y1: 175,
                x2: 250,
                y2: 150,
                x: 260,
                y: 150,
                text: 'Ø100 THRU',
                type: 'dimension'
            });
        } else if (specifications.type === 'architectural') {
            annotations.push({
                id: 'annot-2',
                x: 400,
                y: 50,
                text: 'Scale: 1:100',
                type: 'scale'
            });
        }
        
        return annotations;
    }
}

module.exports = CAD2DTool; 