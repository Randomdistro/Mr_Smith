/**
 * OpportunityScorerTool - Tool for scoring and evaluating sales opportunities
 * Provides functionality for assessing lead quality and sales potential
 */

const BaseTool = require('../BaseTool');

class OpportunityScorerTool extends BaseTool {
    constructor(config = {}) {
        super({
            ...config,
            name: 'Opportunity Scorer',
            description: 'Scores and evaluates sales opportunities based on various factors',
            capabilities: [
                'lead-scoring',
                'opportunity-assessment',
                'prioritization'
            ]
        });
        
        this.defaultFactors = {
            companySize: {
                weight: 0.2,
                ranges: [
                    { min: 1, max: 10, score: 0.3 },
                    { min: 11, max: 50, score: 0.5 },
                    { min: 51, max: 200, score: 0.7 },
                    { min: 201, max: 1000, score: 0.9 },
                    { min: 1001, max: Infinity, score: 1.0 }
                ]
            },
            industry: {
                weight: 0.3,
                values: {
                    'technology': 0.95,
                    'healthcare': 0.9,
                    'finance': 0.85,
                    'education': 0.7,
                    'manufacturing': 0.65,
                    'retail': 0.6,
                    'government': 0.5,
                    'non-profit': 0.4
                },
                default: 0.5
            },
            budget: {
                weight: 0.25,
                ranges: [
                    { min: 0, max: 10000, score: 0.3 },
                    { min: 10001, max: 50000, score: 0.6 },
                    { min: 50001, max: 100000, score: 0.8 },
                    { min: 100001, max: Infinity, score: 1.0 }
                ]
            },
            timeline: {
                weight: 0.15,
                values: {
                    'immediate': 1.0,
                    'this-quarter': 0.8,
                    'next-quarter': 0.6,
                    'this-year': 0.4,
                    'next-year': 0.2,
                    'undecided': 0.1
                },
                default: 0.1
            },
            decisionMakerAccess: {
                weight: 0.1,
                values: {
                    'direct': 1.0,
                    'indirect': 0.6,
                    'none': 0.2
                },
                default: 0.2
            }
        };
        
        this.defaultCategoryThresholds = {
            hot: 0.8,
            warm: 0.6,
            lukewarm: 0.4,
            cold: 0.0
        };
    }
    
    _initializeInternal() {
        // No specific initialization needed
    }
    
    async _executeInternal(params) {
        const { leadData, scoringModel = {} } = params;
        
        try {
            if (!leadData) {
                throw new Error('leadData is required');
            }
            
            // Use provided model or default
            const factors = scoringModel.factors || [];
            const factorMap = {};
            
            // Convert factors array to map for easier access
            factors.forEach(factor => {
                factorMap[factor.name] = factor;
            });
            
            // Calculate score using model
            const scoreResult = this._calculateScore(leadData, factorMap);
            
            // Determine category
            const categoryThresholds = scoringModel.categoryThresholds || this.defaultCategoryThresholds;
            const category = this._determineCategory(scoreResult.score, categoryThresholds);
            
            // Generate insights
            const insights = this._generateInsights(scoreResult, category, leadData);
            
            return {
                score: scoreResult.score,
                category,
                factorScores: scoreResult.factorScores,
                insights,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error scoring opportunity:', error);
            throw error;
        }
    }
    
    _calculateScore(leadData, factorMap) {
        let totalScore = 0;
        let totalWeight = 0;
        const factorScores = {};
        
        // Calculate score for each factor
        for (const [factorName, factorConfig] of Object.entries(this.defaultFactors)) {
            // Check if this factor is overridden in the model
            const factor = factorMap[factorName] || factorConfig;
            const weight = factor.weight || factorConfig.weight;
            
            // Get value from lead data
            const value = leadData[factorName];
            
            if (value === undefined || value === null) {
                continue; // Skip if the factor is not present in the lead data
            }
            
            // Calculate score for this factor
            let factorScore;
            
            if (factorConfig.ranges) {
                // Score based on ranges
                factorScore = this._scoreByRange(value, factorConfig.ranges);
            } else if (factorConfig.values) {
                // Score based on discrete values
                factorScore = factorConfig.values[value];
                
                if (factorScore === undefined) {
                    factorScore = factorConfig.default || 0;
                }
            } else {
                // Direct score
                factorScore = value;
            }
            
            // Store factor score
            factorScores[factorName] = factorScore;
            
            // Add to total
            totalScore += factorScore * weight;
            totalWeight += weight;
        }
        
        // Normalize score
        const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
        
        return {
            score: Math.round(normalizedScore * 100) / 100, // Round to 2 decimal places
            factorScores
        };
    }
    
    _scoreByRange(value, ranges) {
        // Find the range that contains the value
        for (const range of ranges) {
            if (value >= range.min && value <= range.max) {
                return range.score;
            }
        }
        
        return 0; // Default if no range matches
    }
    
    _determineCategory(score, thresholds) {
        if (score >= thresholds.hot) return 'hot';
        if (score >= thresholds.warm) return 'warm';
        if (score >= thresholds.lukewarm) return 'lukewarm';
        return 'cold';
    }
    
    _generateInsights(scoreResult, category, leadData) {
        const insights = [];
        
        // Add category insight
        insights.push({
            type: 'category',
            message: `This lead is categorized as ${category} with a score of ${scoreResult.score}.`
        });
        
        // Add insights based on factor scores
        for (const [factor, score] of Object.entries(scoreResult.factorScores)) {
            if (score >= 0.8) {
                insights.push({
                    type: 'strength',
                    factor,
                    message: `Strong ${factor} indicates high potential.`
                });
            } else if (score <= 0.3) {
                insights.push({
                    type: 'weakness',
                    factor,
                    message: `Weak ${factor} may present challenges.`
                });
            }
        }
        
        // Add industry-specific insights
        if (leadData.industry) {
            const industryInsight = this._getIndustryInsight(leadData.industry);
            if (industryInsight) {
                insights.push({
                    type: 'industry',
                    factor: 'industry',
                    message: industryInsight
                });
            }
        }
        
        // Add timeline insights
        if (leadData.timeline) {
            const timelineScore = scoreResult.factorScores.timeline;
            if (timelineScore >= 0.8) {
                insights.push({
                    type: 'urgency',
                    factor: 'timeline',
                    message: 'Short timeline indicates urgent need. Prioritize follow-up.'
                });
            } else if (timelineScore <= 0.4) {
                insights.push({
                    type: 'nurture',
                    factor: 'timeline',
                    message: 'Long timeline suggests nurturing approach. Develop relationship over time.'
                });
            }
        }
        
        return insights;
    }
    
    _getIndustryInsight(industry) {
        const industryInsights = {
            'technology': 'Technology companies typically have shorter sales cycles and are open to innovative solutions.',
            'healthcare': 'Healthcare organizations often have complex decision-making processes and regulatory concerns.',
            'finance': 'Financial institutions prioritize security and compliance in their purchasing decisions.',
            'education': 'Educational institutions often have limited budgets but value long-term partnerships.',
            'manufacturing': 'Manufacturing companies focus on operational efficiency and return on investment.',
            'retail': 'Retail businesses are sensitive to solutions that impact customer experience.',
            'government': 'Government entities have structured procurement processes that may extend timelines.',
            'non-profit': 'Non-profits are cost-conscious and mission-driven in their purchasing decisions.'
        };
        
        return industryInsights[industry] || null;
    }
}

module.exports = OpportunityScorerTool; 