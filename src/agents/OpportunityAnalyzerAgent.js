/**
 * OpportunityAnalyzerAgent - Specialized agent for opportunity analysis
 * Responsible for identifying opportunities, scoring leads, and prioritizing targets
 */

const Agent = require('../core/Agent');
const uuid = require('uuid');

class OpportunityAnalyzerAgent extends Agent {
    constructor(mrSmith, config = {}) {
        super(mrSmith, config);
        this.opportunities = new Map();
        this.scoringModels = new Map();
        this.analysisCache = new Map();
        this.insightsLog = [];
    }

    async initializeTools() {
        // Load and initialize opportunity analysis tools
        const OpportunityScorerTool = require('../tools/opportunity-analysis/opportunity_scorer');
        const ResponseMatrixAnalyzerTool = require('../tools/response-analysis/response_matrix_analyzer');
        
        this.tools.set('opportunity-scorer', new OpportunityScorerTool({
            mrSmith: this.mrSmith,
            agent: this
        }));
        
        this.tools.set('response-analyzer', new ResponseMatrixAnalyzerTool({
            mrSmith: this.mrSmith,
            agent: this
        }));
        
        // Initialize default scoring models
        this._initializeDefaultScoringModels();
    }

    async processTask(taskData) {
        const { type, parameters } = taskData;
        
        switch(type) {
            case 'opportunity-scoring':
                return await this.scoreOpportunity(parameters);
            case 'lead-prioritization':
                return await this.prioritizeLeads(parameters);
            case 'market-opportunity-analysis':
                return await this.analyzeMarketOpportunity(parameters);
            case 'response-intent-analysis':
                return await this.analyzeResponseIntent(parameters);
            default:
                throw new Error(`Unknown task type: ${type}`);
        }
    }

    async scoreOpportunity({ leadData, modelId = 'default' }) {
        try {
            if (!leadData) {
                throw new Error('Invalid parameters: leadData is required');
            }
            
            // Get scoring model
            const scoringModel = this.scoringModels.get(modelId);
            if (!scoringModel) {
                return {
                    status: 'error',
                    message: `Scoring model not found: ${modelId}`
                };
            }
            
            // Generate opportunity ID
            const opportunityId = uuid.v4();
            
            // Use opportunity scorer to calculate score
            const opportunityScorer = this.tools.get('opportunity-scorer');
            const scoringResult = await opportunityScorer.execute({
                leadData,
                scoringModel
            });
            
            // Create opportunity object
            const opportunity = {
                id: opportunityId,
                leadData,
                score: scoringResult.score,
                category: scoringResult.category,
                insights: scoringResult.insights,
                modelUsed: modelId,
                timestamp: new Date().toISOString()
            };
            
            // Store the opportunity
            this.opportunities.set(opportunityId, opportunity);
            
            // Log insights for learning
            this.insightsLog.push({
                opportunityId,
                leadData: {
                    id: leadData.id,
                    company: leadData.company,
                    industry: leadData.industry
                },
                score: scoringResult.score,
                timestamp: new Date().toISOString()
            });
            
            return {
                status: 'success',
                opportunityId,
                opportunity
            };
        } catch (error) {
            console.error('Error scoring opportunity:', error);
            throw error;
        }
    }

    async prioritizeLeads({ leads, modelId = 'default', filters = {} }) {
        try {
            if (!leads || !Array.isArray(leads)) {
                throw new Error('Invalid parameters: leads array is required');
            }
            
            // Get scoring model
            const scoringModel = this.scoringModels.get(modelId);
            if (!scoringModel) {
                return {
                    status: 'error',
                    message: `Scoring model not found: ${modelId}`
                };
            }
            
            // Calculate scores for all leads
            const opportunityScorer = this.tools.get('opportunity-scorer');
            const scoringPromises = leads.map(lead => 
                opportunityScorer.execute({
                    leadData: lead,
                    scoringModel
                })
            );
            
            const scoringResults = await Promise.all(scoringPromises);
            
            // Combine leads with scores
            const scoredLeads = leads.map((lead, index) => ({
                lead,
                score: scoringResults[index].score,
                category: scoringResults[index].category,
                insights: scoringResults[index].insights
            }));
            
            // Apply filters if provided
            let filteredLeads = scoredLeads;
            if (filters.minScore) {
                filteredLeads = filteredLeads.filter(item => item.score >= filters.minScore);
            }
            if (filters.category) {
                filteredLeads = filteredLeads.filter(item => item.category === filters.category);
            }
            if (filters.industries && filters.industries.length > 0) {
                filteredLeads = filteredLeads.filter(item => 
                    filters.industries.includes(item.lead.industry)
                );
            }
            
            // Sort by score (highest first)
            const prioritizedLeads = filteredLeads.sort((a, b) => b.score - a.score);
            
            // Generate process ID
            const processId = uuid.v4();
            
            // Store in cache for later reference
            this.analysisCache.set(processId, {
                type: 'lead-prioritization',
                modelId,
                filters,
                leadCount: leads.length,
                resultCount: prioritizedLeads.length,
                timestamp: new Date().toISOString()
            });
            
            return {
                status: 'success',
                processId,
                prioritizedLeads,
                totalLeads: leads.length,
                filteredLeads: prioritizedLeads.length
            };
        } catch (error) {
            console.error('Error prioritizing leads:', error);
            throw error;
        }
    }

    async analyzeMarketOpportunity({ industry, region, companySize, productFit }) {
        try {
            // Implementation for market opportunity analysis
            // [...]
            return { status: 'not-implemented' };
        } catch (error) {
            console.error('Error analyzing market opportunity:', error);
            throw error;
        }
    }

    async analyzeResponseIntent({ responseData }) {
        try {
            if (!responseData || !responseData.content) {
                throw new Error('Invalid parameters: responseData with content is required');
            }
            
            // Generate analysis ID
            const analysisId = uuid.v4();
            
            // Use response analyzer to analyze intent
            const responseAnalyzer = this.tools.get('response-analyzer');
            const analysis = await responseAnalyzer.execute({
                responseContent: responseData.content,
                metadata: responseData.metadata || {}
            });
            
            // Extract buying signals
            const buyingSignals = this._extractBuyingSignals(analysis);
            
            // Calculate opportunity score based on signals
            const opportunityScore = this._calculateOpportunityScore(buyingSignals);
            
            // Create analysis result
            const result = {
                id: analysisId,
                responseData,
                analysis,
                buyingSignals,
                opportunityScore,
                timestamp: new Date().toISOString()
            };
            
            // Store in cache
            this.analysisCache.set(analysisId, result);
            
            return {
                status: 'success',
                analysisId,
                result
            };
        } catch (error) {
            console.error('Error analyzing response intent:', error);
            throw error;
        }
    }

    _initializeDefaultScoringModels() {
        // Create default scoring model
        const defaultModel = {
            id: 'default',
            name: 'Default Opportunity Scoring Model',
            factors: [
                { name: 'companySize', weight: 0.2 },
                { name: 'industry', weight: 0.3 },
                { name: 'budget', weight: 0.25 },
                { name: 'timeline', weight: 0.15 },
                { name: 'decisionMakerAccess', weight: 0.1 }
            ],
            categoryThresholds: {
                hot: 0.8,
                warm: 0.6,
                lukewarm: 0.4,
                cold: 0.0
            }
        };
        
        // Create industry-specific models
        const technologyModel = {
            id: 'technology',
            name: 'Technology Industry Scoring Model',
            factors: [
                { name: 'companySize', weight: 0.15 },
                { name: 'growthRate', weight: 0.2 },
                { name: 'technologyStack', weight: 0.25 },
                { name: 'innovationFocus', weight: 0.2 },
                { name: 'budget', weight: 0.2 }
            ],
            categoryThresholds: {
                hot: 0.75,
                warm: 0.6,
                lukewarm: 0.4,
                cold: 0.0
            }
        };
        
        // Store models
        this.scoringModels.set('default', defaultModel);
        this.scoringModels.set('technology', technologyModel);
    }

    _extractBuyingSignals(analysis) {
        // Extract buying signals from response analysis
        const signals = [];
        
        if (analysis.intent === 'purchase_intent') {
            signals.push({ type: 'intent', strength: 0.9 });
        } else if (analysis.intent === 'information_gathering') {
            signals.push({ type: 'intent', strength: 0.6 });
        }
        
        if (analysis.questions && analysis.questions.length > 0) {
            const pricingQuestions = analysis.questions.filter(q => 
                q.toLowerCase().includes('price') || 
                q.toLowerCase().includes('cost') || 
                q.toLowerCase().includes('budget')
            );
            
            if (pricingQuestions.length > 0) {
                signals.push({ type: 'pricing_inquiry', strength: 0.7 });
            }
        }
        
        if (analysis.sentiment && analysis.sentiment.score > 0.7) {
            signals.push({ type: 'positive_sentiment', strength: 0.8 });
        }
        
        if (analysis.urgency && analysis.urgency > 0.5) {
            signals.push({ type: 'urgency', strength: analysis.urgency });
        }
        
        return signals;
    }

    _calculateOpportunityScore(signals) {
        if (!signals || signals.length === 0) {
            return 0;
        }
        
        // Calculate weighted score
        const weights = {
            intent: 0.4,
            pricing_inquiry: 0.3,
            positive_sentiment: 0.2,
            urgency: 0.1
        };
        
        let totalScore = 0;
        let totalWeight = 0;
        
        for (const signal of signals) {
            const weight = weights[signal.type] || 0.1;
            totalScore += signal.strength * weight;
            totalWeight += weight;
        }
        
        // Normalize score
        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }

    getOpportunityById(opportunityId) {
        return this.opportunities.get(opportunityId);
    }

    getAllOpportunities() {
        return Array.from(this.opportunities.values());
    }

    getScoringModels() {
        return Array.from(this.scoringModels.values());
    }
}

module.exports = OpportunityAnalyzerAgent; 