/**
 * MaterialsSelectionTool - Tool for selecting and analyzing materials for engineering designs
 * Provides material properties, selection criteria, and compatibility analysis
 */

const BaseTool = require('../BaseTool');
const fs = require('fs-extra');
const path = require('path');

class MaterialsSelectionTool extends BaseTool {
    constructor(config = {}) {
        super({
            name: 'MaterialsSelectionTool',
            description: 'Tool for selecting and analyzing materials for engineering designs',
            ...config
        });
        
        this.materialDatabase = new Map();
        this.selectionResults = new Map();
        this.dataDir = path.join(process.cwd(), 'data', 'materials');
        
        // Ensure directory exists
        fs.ensureDirSync(this.dataDir);
        
        // Initialize material database
        this._initializeMaterialDatabase();
    }
    
    async execute(params) {
        const { action } = params;
        
        switch(action) {
            case 'select-materials':
                return await this.selectMaterials(params);
            case 'analyze-compatibility':
                return await this.analyzeCompatibility(params);
            case 'get-material-properties':
                return await this.getMaterialProperties(params);
            case 'get-alternatives':
                return await this.getAlternatives(params);
            case 'get-sustainability-rating':
                return await this.getSustainabilityRating(params);
            default:
                throw new Error(`Unsupported action: ${action}`);
        }
    }
    
    async selectMaterials({ components, requirements = {} }) {
        try {
            const selectionId = `selection-${Date.now()}`;
            const selections = [];
            const alternatives = [];
            
            // Process each component
            for (const component of components) {
                // Match component requirements to materials
                const materialMatches = this._findMaterialMatches(component, requirements);
                
                // Sort matches by score (descending)
                materialMatches.sort((a, b) => b.score - a.score);
                
                // Select the best match
                const bestMatch = materialMatches[0];
                selections.push({
                    componentId: component.id,
                    componentName: component.name,
                    materialId: bestMatch.material.id,
                    materialName: bestMatch.material.name,
                    score: bestMatch.score,
                    properties: bestMatch.material.properties
                });
                
                // Add alternatives (next 3 best matches)
                const componentAlternatives = materialMatches.slice(1, 4).map(match => ({
                    componentId: component.id,
                    componentName: component.name,
                    materialId: match.material.id,
                    materialName: match.material.name,
                    score: match.score,
                    properties: match.material.properties
                }));
                
                alternatives.push(...componentAlternatives);
            }
            
            // Create selection result
            const selectionResult = {
                id: selectionId,
                timestamp: new Date().toISOString(),
                requirements,
                selections,
                alternatives
            };
            
            // Store the selection result
            this.selectionResults.set(selectionId, selectionResult);
            
            // Save to file
            const resultPath = path.join(this.dataDir, `${selectionId}.json`);
            fs.writeJsonSync(resultPath, selectionResult, { spaces: 2 });
            
            return {
                status: 'success',
                selectionId,
                selections,
                alternatives
            };
            
        } catch (error) {
            console.error('Error selecting materials:', error);
            throw error;
        }
    }
    
    async analyzeCompatibility({ materials }) {
        try {
            const compatibility = [];
            
            // Check each material pair for compatibility
            for (let i = 0; i < materials.length; i++) {
                for (let j = i + 1; j < materials.length; j++) {
                    const material1 = this._getMaterial(materials[i]);
                    const material2 = this._getMaterial(materials[j]);
                    
                    if (!material1 || !material2) {
                        continue;
                    }
                    
                    const compatibilityResult = this._checkCompatibility(material1, material2);
                    compatibility.push(compatibilityResult);
                }
            }
            
            return {
                status: 'success',
                compatibility
            };
            
        } catch (error) {
            console.error('Error analyzing material compatibility:', error);
            throw error;
        }
    }
    
    async getMaterialProperties({ materialId }) {
        try {
            const material = this._getMaterial(materialId);
            
            if (!material) {
                return {
                    status: 'error',
                    message: `Material not found: ${materialId}`
                };
            }
            
            return {
                status: 'success',
                material
            };
            
        } catch (error) {
            console.error('Error getting material properties:', error);
            throw error;
        }
    }
    
    async getAlternatives({ materialId, requirements = {}, count = 5 }) {
        try {
            const material = this._getMaterial(materialId);
            
            if (!material) {
                return {
                    status: 'error',
                    message: `Material not found: ${materialId}`
                };
            }
            
            // Find materials with similar properties
            const alternatives = this._findSimilarMaterials(material, requirements, count);
            
            return {
                status: 'success',
                alternatives
            };
            
        } catch (error) {
            console.error('Error getting material alternatives:', error);
            throw error;
        }
    }
    
    async getSustainabilityRating({ materialId }) {
        try {
            const material = this._getMaterial(materialId);
            
            if (!material) {
                return {
                    status: 'error',
                    message: `Material not found: ${materialId}`
                };
            }
            
            // Get sustainability metrics
            const sustainability = material.sustainability || this._generateSustainabilityMetrics(material);
            
            return {
                status: 'success',
                sustainability
            };
            
        } catch (error) {
            console.error('Error getting sustainability rating:', error);
            throw error;
        }
    }
    
    // Private helper methods
    
    _initializeMaterialDatabase() {
        // Initialize with basic material categories and examples
        
        // Metals
        const metals = [
            {
                id: 'aluminum-6061',
                name: 'Aluminum 6061',
                category: 'metals',
                subcategory: 'aluminum',
                properties: {
                    density: 2.7, // g/cm³
                    tensileStrength: 310, // MPa
                    yieldStrength: 276, // MPa
                    modulus: 68.9, // GPa
                    thermalConductivity: 167, // W/(m·K)
                    electricalConductivity: 27.2, // MS/m
                    thermalExpansion: 23.4, // µm/(m·K)
                    corrosionResistance: 'good',
                    machinability: 'excellent'
                },
                sustainability: {
                    recyclability: 90, // %
                    energyIntensity: 'medium',
                    carbonFootprint: 8.1, // kg CO2 eq/kg
                    waterUsage: 'medium'
                },
                cost: 'medium',
                applications: ['aerospace', 'automotive', 'consumer products']
            },
            {
                id: 'stainless-steel-304',
                name: 'Stainless Steel 304',
                category: 'metals',
                subcategory: 'stainless steel',
                properties: {
                    density: 8.0, // g/cm³
                    tensileStrength: 505, // MPa
                    yieldStrength: 215, // MPa
                    modulus: 193, // GPa
                    thermalConductivity: 16.2, // W/(m·K)
                    electricalConductivity: 1.4, // MS/m
                    thermalExpansion: 17.2, // µm/(m·K)
                    corrosionResistance: 'excellent',
                    machinability: 'good'
                },
                sustainability: {
                    recyclability: 85, // %
                    energyIntensity: 'high',
                    carbonFootprint: 6.15, // kg CO2 eq/kg
                    waterUsage: 'high'
                },
                cost: 'medium-high',
                applications: ['food processing', 'medical', 'architectural']
            },
            {
                id: 'titanium-6al4v',
                name: 'Titanium Ti-6Al-4V',
                category: 'metals',
                subcategory: 'titanium',
                properties: {
                    density: 4.43, // g/cm³
                    tensileStrength: 950, // MPa
                    yieldStrength: 880, // MPa
                    modulus: 113.8, // GPa
                    thermalConductivity: 6.7, // W/(m·K)
                    electricalConductivity: 0.58, // MS/m
                    thermalExpansion: 8.6, // µm/(m·K)
                    corrosionResistance: 'excellent',
                    machinability: 'difficult'
                },
                sustainability: {
                    recyclability: 90, // %
                    energyIntensity: 'very high',
                    carbonFootprint: 31.7, // kg CO2 eq/kg
                    waterUsage: 'medium'
                },
                cost: 'high',
                applications: ['aerospace', 'medical', 'marine']
            }
        ];
        
        // Polymers
        const polymers = [
            {
                id: 'abs',
                name: 'ABS (Acrylonitrile Butadiene Styrene)',
                category: 'polymers',
                subcategory: 'thermoplastic',
                properties: {
                    density: 1.04, // g/cm³
                    tensileStrength: 40, // MPa
                    modulus: 2.3, // GPa
                    thermalConductivity: 0.17, // W/(m·K)
                    electricalResistivity: 1e16, // ohm·cm
                    thermalExpansion: 95, // µm/(m·K)
                    maxServiceTemp: 80, // °C
                    waterAbsorption: 0.7, // %
                    flammability: 'HB'
                },
                sustainability: {
                    recyclability: 55, // %
                    biodegradability: 'none',
                    energyIntensity: 'medium',
                    carbonFootprint: 3.45, // kg CO2 eq/kg
                    waterUsage: 'low'
                },
                cost: 'low',
                applications: ['consumer products', 'automotive', 'toys']
            },
            {
                id: 'pla',
                name: 'PLA (Polylactic Acid)',
                category: 'polymers',
                subcategory: 'bioplastic',
                properties: {
                    density: 1.24, // g/cm³
                    tensileStrength: 50, // MPa
                    modulus: 3.5, // GPa
                    thermalConductivity: 0.13, // W/(m·K)
                    electricalResistivity: 1e16, // ohm·cm
                    thermalExpansion: 68, // µm/(m·K)
                    maxServiceTemp: 60, // °C
                    waterAbsorption: 0.5, // %
                    flammability: 'HB'
                },
                sustainability: {
                    recyclability: 35, // %
                    biodegradability: 'good',
                    energyIntensity: 'low',
                    carbonFootprint: 0.5, // kg CO2 eq/kg
                    waterUsage: 'low'
                },
                cost: 'low-medium',
                applications: ['packaging', '3D printing', 'disposable items']
            },
            {
                id: 'peek',
                name: 'PEEK (Polyether Ether Ketone)',
                category: 'polymers',
                subcategory: 'high-performance thermoplastic',
                properties: {
                    density: 1.32, // g/cm³
                    tensileStrength: 100, // MPa
                    modulus: 3.6, // GPa
                    thermalConductivity: 0.25, // W/(m·K)
                    electricalResistivity: 1e16, // ohm·cm
                    thermalExpansion: 47, // µm/(m·K)
                    maxServiceTemp: 260, // °C
                    waterAbsorption: 0.1, // %
                    flammability: 'V-0'
                },
                sustainability: {
                    recyclability: 40, // %
                    biodegradability: 'none',
                    energyIntensity: 'high',
                    carbonFootprint: 5.2, // kg CO2 eq/kg
                    waterUsage: 'low'
                },
                cost: 'very high',
                applications: ['aerospace', 'medical', 'oil & gas']
            }
        ];
        
        // Composites
        const composites = [
            {
                id: 'carbon-fiber-epoxy',
                name: 'Carbon Fiber Reinforced Epoxy',
                category: 'composites',
                subcategory: 'fiber reinforced polymer',
                properties: {
                    density: 1.6, // g/cm³
                    tensileStrength: 1500, // MPa
                    modulus: 70, // GPa
                    thermalConductivity: 1.0, // W/(m·K)
                    electricalResistivity: 1e-3, // ohm·cm
                    thermalExpansion: 1.0, // µm/(m·K)
                    maxServiceTemp: 140, // °C
                    waterAbsorption: 0.1, // %
                    fiberVolume: 65 // %
                },
                sustainability: {
                    recyclability: 30, // %
                    biodegradability: 'none',
                    energyIntensity: 'very high',
                    carbonFootprint: 22.0, // kg CO2 eq/kg
                    waterUsage: 'medium'
                },
                cost: 'high',
                applications: ['aerospace', 'sports equipment', 'high-performance automotive']
            },
            {
                id: 'gfrp',
                name: 'Glass Fiber Reinforced Polymer',
                category: 'composites',
                subcategory: 'fiber reinforced polymer',
                properties: {
                    density: 1.8, // g/cm³
                    tensileStrength: 700, // MPa
                    modulus: 25, // GPa
                    thermalConductivity: 0.3, // W/(m·K)
                    electricalResistivity: 1e15, // ohm·cm
                    thermalExpansion: 11.0, // µm/(m·K)
                    maxServiceTemp: 120, // °C
                    waterAbsorption: 0.2, // %
                    fiberVolume: 55 // %
                },
                sustainability: {
                    recyclability: 20, // %
                    biodegradability: 'none',
                    energyIntensity: 'high',
                    carbonFootprint: 8.0, // kg CO2 eq/kg
                    waterUsage: 'medium'
                },
                cost: 'medium',
                applications: ['marine', 'construction', 'corrosion-resistant equipment']
            }
        ];
        
        // Add all materials to the database
        [...metals, ...polymers, ...composites].forEach(material => {
            this.materialDatabase.set(material.id, material);
        });
    }
    
    _getMaterial(materialId) {
        if (typeof materialId === 'object' && materialId.id) {
            materialId = materialId.id;
        }
        
        return this.materialDatabase.get(materialId);
    }
    
    _findMaterialMatches(component, requirements) {
        const matches = [];
        
        // Extract component requirements
        const componentRequirements = component.requirements || {};
        
        // Get weightings for different properties
        const weights = requirements.weights || {
            strength: 1.0,
            weight: 1.0,
            cost: 1.0,
            temperature: 1.0,
            corrosion: 1.0,
            sustainability: 1.0
        };
        
        // Check each material for compatibility
        for (const [id, material] of this.materialDatabase.entries()) {
            let score = 0;
            let maxPossibleScore = 0;
            
            // Strength requirements
            if (componentRequirements.minStrength) {
                maxPossibleScore += weights.strength;
                if (material.properties.tensileStrength >= componentRequirements.minStrength) {
                    score += weights.strength * Math.min(
                        material.properties.tensileStrength / componentRequirements.minStrength,
                        2 // Cap at 2x required value
                    ) / 2;
                }
            }
            
            // Density/weight requirements
            if (componentRequirements.maxDensity) {
                maxPossibleScore += weights.weight;
                if (material.properties.density <= componentRequirements.maxDensity) {
                    score += weights.weight * Math.min(
                        componentRequirements.maxDensity / material.properties.density,
                        2 // Cap at 2x better than required
                    ) / 2;
                }
            }
            
            // Temperature requirements
            if (componentRequirements.maxServiceTemp && material.properties.maxServiceTemp) {
                maxPossibleScore += weights.temperature;
                if (material.properties.maxServiceTemp >= componentRequirements.maxServiceTemp) {
                    score += weights.temperature;
                }
            }
            
            // Corrosion resistance
            if (componentRequirements.corrosionResistance && material.properties.corrosionResistance) {
                maxPossibleScore += weights.corrosion;
                const resistanceRanking = {
                    'poor': 0.2,
                    'fair': 0.4,
                    'good': 0.7,
                    'excellent': 1.0
                };
                
                const requiredResistance = resistanceRanking[componentRequirements.corrosionResistance] || 0.5;
                const materialResistance = resistanceRanking[material.properties.corrosionResistance] || 0.5;
                
                if (materialResistance >= requiredResistance) {
                    score += weights.corrosion * (materialResistance / 1.0);
                }
            }
            
            // Cost factor
            if (requirements.costFactor) {
                maxPossibleScore += weights.cost;
                
                const costRanking = {
                    'low': 0.9,
                    'low-medium': 0.75,
                    'medium': 0.6,
                    'medium-high': 0.4,
                    'high': 0.25,
                    'very high': 0.1
                };
                
                const materialCostRank = costRanking[material.cost] || 0.5;
                score += weights.cost * materialCostRank;
            }
            
            // Sustainability factor
            if (requirements.sustainabilityFactor) {
                maxPossibleScore += weights.sustainability;
                
                // Calculate sustainability score based on recyclability
                const recycleScore = material.sustainability?.recyclability 
                    ? material.sustainability.recyclability / 100
                    : 0.2;
                
                score += weights.sustainability * recycleScore;
            }
            
            // Normalize score
            const normalizedScore = maxPossibleScore > 0 ? (score / maxPossibleScore) * 100 : 50;
            
            matches.push({
                material,
                score: normalizedScore
            });
        }
        
        return matches;
    }
    
    _checkCompatibility(material1, material2) {
        // Create a compatibility result between two materials
        const result = {
            material1: {
                id: material1.id,
                name: material1.name
            },
            material2: {
                id: material2.id,
                name: material2.name
            },
            compatible: true,
            issues: [],
            score: 100 // Default high compatibility
        };
        
        // Check galvanic corrosion (for metals)
        if (material1.category === 'metals' && material2.category === 'metals') {
            // Simple galvanic check (in a real system this would use galvanic series)
            if (material1.subcategory !== material2.subcategory) {
                result.compatible = false;
                result.score -= 40;
                result.issues.push('Potential galvanic corrosion risk');
            }
        }
        
        // Check thermal expansion differences
        if (material1.properties.thermalExpansion && material2.properties.thermalExpansion) {
            const expansionDiff = Math.abs(material1.properties.thermalExpansion - material2.properties.thermalExpansion);
            if (expansionDiff > 10) {
                result.score -= Math.min(expansionDiff, 50);
                result.issues.push('Thermal expansion mismatch may cause stress');
            }
        }
        
        // Check chemical compatibility (simplified)
        if (material1.category === 'polymers' && material2.category === 'polymers') {
            // Simplified check - different polymer types might have compatibility issues
            if (material1.subcategory !== material2.subcategory) {
                result.score -= 20;
                result.issues.push('Potential polymer incompatibility');
            }
        }
        
        // Set final compatibility flag
        result.compatible = result.score >= 60;
        
        return result;
    }
    
    _findSimilarMaterials(material, requirements, count) {
        const similarMaterials = [];
        
        // Get all materials of the same category first
        const categoryMaterials = Array.from(this.materialDatabase.values())
            .filter(m => m.id !== material.id && m.category === material.category);
        
        // Calculate similarity scores
        for (const candidateMaterial of categoryMaterials) {
            const similarity = this._calculateMaterialSimilarity(material, candidateMaterial);
            
            similarMaterials.push({
                material: candidateMaterial,
                similarityScore: similarity
            });
        }
        
        // Sort by similarity and return top matches
        return similarMaterials
            .sort((a, b) => b.similarityScore - a.similarityScore)
            .slice(0, count)
            .map(result => ({
                id: result.material.id,
                name: result.material.name,
                category: result.material.category,
                similarityScore: result.similarityScore,
                properties: result.material.properties
            }));
    }
    
    _calculateMaterialSimilarity(material1, material2) {
        let similarityScore = 0;
        let comparedProperties = 0;
        
        // Compare numerical properties
        const properties = [
            'density', 'tensileStrength', 'yieldStrength', 'modulus', 
            'thermalConductivity', 'thermalExpansion'
        ];
        
        for (const prop of properties) {
            if (material1.properties[prop] && material2.properties[prop]) {
                comparedProperties++;
                
                // Calculate similarity based on ratio (closer to 1 is more similar)
                const ratio = material1.properties[prop] > material2.properties[prop] ?
                    material2.properties[prop] / material1.properties[prop] :
                    material1.properties[prop] / material2.properties[prop];
                
                similarityScore += ratio;
            }
        }
        
        // Category/subcategory match
        if (material1.subcategory === material2.subcategory) {
            similarityScore += 1;
            comparedProperties += 1;
        }
        
        // Applications overlap
        if (material1.applications && material2.applications) {
            const overlap = material1.applications.filter(app => material2.applications.includes(app)).length;
            if (overlap > 0) {
                similarityScore += overlap / material1.applications.length;
                comparedProperties += 1;
            }
        }
        
        // Normalize score
        return comparedProperties > 0 ? (similarityScore / comparedProperties) * 100 : 0;
    }
    
    _generateSustainabilityMetrics(material) {
        // Generate mock sustainability metrics if not already present
        if (material.sustainability) {
            return material.sustainability;
        }
        
        const metrics = {
            recyclability: Math.floor(Math.random() * 100), // %
            energyIntensity: ['low', 'medium', 'high', 'very high'][Math.floor(Math.random() * 4)],
            carbonFootprint: Math.random() * 30, // kg CO2 eq/kg
            waterUsage: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
        };
        
        // Adjust based on material type (more realistic values)
        if (material.category === 'metals') {
            metrics.recyclability = 70 + Math.floor(Math.random() * 30); // Metals are highly recyclable
        } else if (material.category === 'polymers') {
            metrics.recyclability = Math.floor(Math.random() * 60); // Less recyclable
            if (material.subcategory === 'bioplastic') {
                metrics.biodegradability = 'good';
                metrics.carbonFootprint *= 0.2; // Much lower carbon footprint
            } else {
                metrics.biodegradability = 'none';
            }
        } else if (material.category === 'composites') {
            metrics.recyclability = Math.floor(Math.random() * 40); // Difficult to recycle
            metrics.energyIntensity = 'high';
        }
        
        return metrics;
    }
    
    getMaterialsInCategory(category) {
        return Array.from(this.materialDatabase.values())
            .filter(material => material.category === category);
    }
    
    getSelectionHistory() {
        return Array.from(this.selectionResults.values());
    }
    
    getSelectionById(selectionId) {
        return this.selectionResults.get(selectionId);
    }
}

module.exports = MaterialsSelectionTool; 