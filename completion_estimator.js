s/**
 * NeoGPT: Completion Estimator Module
 * Version: 3.7.0
 * 
 * Provides sophisticated estimation of workflow completion times based on 
 * industry complexity, geographic scope, and company sizes.
 */

class CompletionEstimator {
    constructor() {
      this.baseTimeEstimates = this._initializeBaseTimeEstimates();
      this.complexityFactors = this._initializeComplexityFactors();
    }
    
    /**
     * Initialize base time estimates for workflow stages (in milliseconds)
     */
    _initializeBaseTimeEstimates() {
      return {
        'industry-research': 1800000, // 30 minutes
        'data-organization': 1200000, // 20 minutes
        'contact-identification': 2400000, // 40 minutes
        'communication-planning': 1800000, // 30 minutes
        'opportunity-analysis': 2700000, // 45 minutes
        'engagement-execution': 3600000, // 60 minutes
        'continuous-optimization': 1800000 // 30 minutes
      };
    }
    
    /**
     * Initialize complexity factors for different dimensions
     */
    _initializeComplexityFactors() {
      return {
        industry: {
          technology: 1.2, // More complex due to rapid change
          healthcare: 1.3, // Complex due to regulations
          manufacturing: 1.1, // Moderate complexity
          finance: 1.25, // Complex due to regulations
          retail: 0.9, // Lower complexity
          default: 1.0
        },
        region: {
          'north america': 1.0,
          'europe': 1.1, // More regulatory complexity
          'asia': 1.2, // Language and cultural barriers
          'australia': 0.9,
          'south america': 1.15,
          'africa': 1.25,
          'global': 1.5, // Highest complexity for global scope
          default: 1.0
        },
        companySize: {
          small: 0.8, // Simpler organization structure
          medium: 1.0, // Baseline
          large: 1.3, // More complex organization structure
          enterprise: 1.5, // Most complex
          default: 1.0
        },
        contactDiscoveryDepth: {
          basic: 0.7,
          standard: 1.0,
          comprehensive: 1.5,
          exhaustive: 2.0,
          default: 1.0
        }
      };
    }
    
    /**
     * Estimate completion time for the workflow based on configuration parameters
     */
    estimateCompletionTime(config) {
      // Calculate adjusted stage times
      const adjustedStageTimes = this._calculateAdjustedStageTimes(config);
      
      // Calculate critical path (simple sequential for this implementation)
      const totalEstimatedTime = Object.values(adjustedStageTimes).reduce((sum, time) => sum + time, 0);
      
      // Add buffer for system initialization and inter-stage transitions
      const bufferTime = totalEstimatedTime * 0.15; // 15% buffer
      
      // Calculate estimated completion date
      const now = new Date();
      const estimatedCompletionDate = new Date(now.getTime() + totalEstimatedTime + bufferTime);
      
      // Calculate detailed timeline
      const timeline = this._generateTimeline(adjustedStageTimes);
      
      return {
        estimatedCompletionDate: estimatedCompletionDate,
        totalEstimatedTime: totalEstimatedTime + bufferTime,
        breakdownByStage: adjustedStageTimes,
        timeline: timeline,
        bufferIncluded: bufferTime,
        confidence: this._calculateConfidenceLevel(config),
        variabilityFactors: this._identifyVariabilityFactors(config)
      };
    }
    
    /**
     * Calculate adjusted times for each stage based on configuration complexity
     */
    _calculateAdjustedStageTimes(config) {
      const adjustedTimes = {};
      
      // Calculate complexity multipliers
      const industryMultiplier = this._calculateIndustryComplexity(config.targetIndustries);
      const regionMultiplier = this._calculateRegionComplexity(config.targetRegions);
      const companySizeMultiplier = this._calculateCompanySizeComplexity(config.targetCompanySizes);
      const discoveryDepthMultiplier = this._getDiscoveryDepthMultiplier(config.contactDiscoveryDepth);
      
      // Apply multipliers to each stage based on relevance
      Object.entries(this.baseTimeEstimates).forEach(([stage, baseTime]) => {
        let stageMultiplier = 1.0;
        
        // Apply industry complexity to relevant stages
        if (['industry-research', 'data-organization', 'opportunity-analysis'].includes(stage)) {
          stageMultiplier *= industryMultiplier;
        }
        
        // Apply geographic complexity to relevant stages
        if (['industry-research', 'contact-identification'].includes(stage)) {
          stageMultiplier *= regionMultiplier;
        }
        
        // Apply company size complexity to relevant stages
        if (['contact-identification', 'communication-planning'].includes(stage)) {
          stageMultiplier *= companySizeMultiplier;
        }
        
        // Apply discovery depth to relevant stages
        if (['contact-identification', 'industry-research'].includes(stage)) {
          stageMultiplier *= discoveryDepthMultiplier;
        }
        
        // Apply company quantity scaling
        if (stage === 'industry-research' && config.minCompaniesPerIndustry) {
          stageMultiplier *= Math.sqrt(config.minCompaniesPerIndustry / 100);
        }
        
        // Calculate final adjusted time
        adjustedTimes[stage] = Math.ceil(baseTime * stageMultiplier);
      });
      
      return adjustedTimes;
    }
    
    /**
     * Calculate industry complexity multiplier
     */
    _calculateIndustryComplexity(industries) {
      if (!industries || industries.length === 0) {
        return this.complexityFactors.industry.default;
      }
      
      // Calculate average complexity across all target industries
      const industryFactors = industries.map(industry => {
        const factor = this.complexityFactors.industry[industry.toLowerCase()] || 
                      this.complexityFactors.industry.default;
        return factor;
      });
      
      const averageComplexity = industryFactors.reduce((sum, factor) => sum + factor, 0) / 
                               industryFactors.length;
      
      // Add additional multiplier for multiple industries
      const diversityMultiplier = Math.sqrt(industries.length);
      
      return averageComplexity * diversityMultiplier;
    }
    
    /**
     * Calculate region complexity multiplier
     */
    _calculateRegionComplexity(regions) {
      if (!regions || regions.length === 0) {
        return this.complexityFactors.region.default;
      }
      
      // Calculate average complexity across all target regions
      const regionFactors = regions.map(region => {
        const factor = this.complexityFactors.region[region.toLowerCase()] || 
                      this.complexityFactors.region.default;
        return factor;
      });
      
      const averageComplexity = regionFactors.reduce((sum, factor) => sum + factor, 0) / 
                               regionFactors.length;
      
      // Add additional multiplier for geographic diversity
      const diversityMultiplier = Math.sqrt(regions.length);
      
      return averageComplexity * diversityMultiplier;
    }
    
    /**
     * Calculate company size complexity multiplier
     */
    _calculateCompanySizeComplexity(companySizes) {
      if (!companySizes || companySizes.length === 0) {
        return this.complexityFactors.companySize.default;
      }
      
      // Calculate average complexity across all target company sizes
      const sizeFactors = companySizes.map(size => {
        const factor = this.complexityFactors.companySize[size.toLowerCase()] || 
                      this.complexityFactors.companySize.default;
        return factor;
      });
      
      return sizeFactors.reduce((sum, factor) => sum + factor, 0) / sizeFactors.length;
    }
    
    /**
     * Get discovery depth multiplier
     */
    _getDiscoveryDepthMultiplier(discoveryDepth) {
      if (!discoveryDepth) {
        return this.complexityFactors.contactDiscoveryDepth.default;
      }
      
      return this.complexityFactors.contactDiscoveryDepth[discoveryDepth] || 
             this.complexityFactors.contactDiscoveryDepth.default;
    }
    
    /**
     * Generate a detailed timeline for the workflow
     */
    _generateTimeline(stageTimes) {
      const timeline = [];
      const now = new Date();
      let currentTime = now.getTime();
      
      // Define stage dependencies (which stages must complete before others)
      const dependencies = {
        'industry-research': [],
        'data-organization': ['industry-research'],
        'contact-identification': ['data-organization'],
        'opportunity-analysis': ['data-organization'],
        'communication-planning': ['contact-identification', 'opportunity-analysis'],
        'engagement-execution': ['communication-planning'],
        'continuous-optimization': ['engagement-execution']
      };
      
      // Define typical stage overlap (percent of previous stage that can overlap with current)
      const stageOverlap = {
        'data-organization': 0.2, // Can start when industry-research is 80% complete
        'contact-identification': 0.1,
        'opportunity-analysis': 0.15,
        'communication-planning': 0.1,
        'engagement-execution': 0.05,
        'continuous-optimization': 0.0 // Requires full completion of previous stage
      };
      
      // Track completion times for each stage
      const stageCompletions = {};
      
      // Generate timeline entries for each stage
      Object.entries(stageTimes).forEach(([stage, duration]) => {
        // Calculate start time based on dependencies
        let startTime = currentTime;
        
        if (dependencies[stage].length > 0) {
          // Find the latest completion time among dependencies
          const latestDependencyCompletion = Math.max(
            ...dependencies[stage].map(dep => {
              // Apply overlap if applicable
              const overlap = stageOverlap[stage] || 0;
              const dependencyDuration = stageTimes[dep];
              return stageCompletions[dep] - (dependencyDuration * overlap);
            })
          );
          
          startTime = Math.max(currentTime, latestDependencyCompletion);
        }
        
        // Calculate end time
        const endTime = startTime + duration;
        stageCompletions[stage] = endTime;
        
        // Add to timeline
        timeline.push({
          stage: stage,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          duration: duration,
          durationHours: Math.round(duration / (1000 * 60 * 60) * 10) / 10
        });
        
        // Update current time only if this is a critical path stage
        if (stage === 'industry-research' || 
            stage === 'data-organization' || 
            stage === 'contact-identification' || 
            stage === 'communication-planning' ||
            stage === 'engagement-execution' ||
            stage === 'continuous-optimization') {
          currentTime = endTime;
        }
      });
      
      // Sort timeline by start time
      timeline.sort((a, b) => a.startTime - b.startTime);
      
      return timeline;
    }
    
    /**
     * Calculate confidence level for the estimate
     */
    _calculateConfidenceLevel(config) {
      // Base confidence
      let confidence = 0.8;
      
      // Adjust based on industry complexity
      if (config.targetIndustries && config.targetIndustries.length > 0) {
        // More industries = lower confidence
        confidence -= 0.02 * Math.max(0, config.targetIndustries.length - 1);
        
        // Specific complex industries lower confidence
        const complexIndustries = ['healthcare', 'finance', 'technology'];
        const hasComplexIndustry = config.targetIndustries.some(industry => 
          complexIndustries.includes(industry.toLowerCase())
        );
        
        if (hasComplexIndustry) {
          confidence -= 0.05;
        }
      }
      
      // Adjust based on geographic complexity
      if (config.targetRegions && config.targetRegions.length > 0) {
        // More regions = lower confidence
        confidence -= 0.03 * Math.max(0, config.targetRegions.length - 1);
        
        // Global scope significantly lowers confidence
        const hasGlobalScope = config.targetRegions.some(region => 
          region.toLowerCase() === 'global'
        );
        
        if (hasGlobalScope) {
          confidence -= 0.1;
        }
      }
      
      // Adjust based on company quantity
      if (config.minCompaniesPerIndustry) {
        // Higher company count = lower confidence
        confidence -= 0.05 * Math.max(0, (config.minCompaniesPerIndustry - 100) / 100);
      }
      
      // Comprehensive contact discovery lowers confidence
      if (config.contactDiscoveryDepth === 'comprehensive' || 
          config.contactDiscoveryDepth === 'exhaustive') {
        confidence -= 0.05;
      }
      
      // Ensure confidence stays within reasonable bounds
      return Math.max(0.5, Math.min(0.95, confidence));
    }
    
    /**
     * Identify factors that could cause variability in the estimate
     */
    _identifyVariabilityFactors(config) {
      const factors = [];
      
      // Industry variability factors
      if (config.targetIndustries && config.targetIndustries.length > 0) {
        if (config.targetIndustries.length > 2) {
          factors.push({
            factor: 'industry-diversity',
            description: 'Multiple industries increase complexity and coordination requirements',
            impact: 'high'
          });
        }
        
        if (config.targetIndustries.some(i => i.toLowerCase() === 'technology')) {
          factors.push({
            factor: 'tech-industry-volatility',
            description: 'Technology industry experiences rapid changes in company structures',
            impact: 'medium'
          });
        }
        
        if (config.targetIndustries.some(i => i.toLowerCase() === 'healthcare' || i.toLowerCase() === 'finance')) {
          factors.push({
            factor: 'regulatory-complexity',
            description: 'Highly regulated industries require additional verification steps',
            impact: 'high'
          });
        }
      }
      
      // Geographic variability factors
      if (config.targetRegions && config.targetRegions.length > 0) {
        if (config.targetRegions.length > 2) {
          factors.push({
            factor: 'geographic-diversity',
            description: 'Multiple regions require handling of different business cultures',
            impact: 'high'
          });
        }
        
        if (config.targetRegions.some(r => r.toLowerCase() === 'asia' || r.toLowerCase() === 'africa')) {
          factors.push({
            factor: 'language-cultural-barriers',
            description: 'Diverse language and cultural factors may slow data processing',
            impact: 'medium'
          });
        }
        
        if (config.targetRegions.some(r => r.toLowerCase() === 'global')) {
          factors.push({
            factor: 'global-scope',
            description: 'Global scope substantially increases complexity across all stages',
            impact: 'very-high'
          });
        }
      }
      
      // Company size variability factors
      if (config.targetCompanySizes && config.targetCompanySizes.includes('enterprise')) {
        factors.push({
          factor: 'enterprise-complexity',
          description: 'Enterprise organizations have complex decision-making structures',
          impact: 'high'
        });
      }
      
      // Discovery depth factors
      if (config.contactDiscoveryDepth === 'comprehensive' || config.contactDiscoveryDepth === 'exhaustive') {
        factors.push({
          factor: 'deep-discovery',
          description: 'Comprehensive contact discovery extends research timelines',
          impact: 'medium'
        });
      }
      
      // Company quantity factors
      if (config.minCompaniesPerIndustry && config.minCompaniesPerIndustry > 200) {
        factors.push({
          factor: 'high-volume',
          description: 'Large number of target companies increases processing time',
          impact: 'high'
        });
      }
      
      return factors;
    }
    
    /**
     * Create an estimation for a specific industry
     */
    createIndustrySpecificEstimation(industry, config = {}) {
      // Apply industry-specific configurations
      const industryConfig = { ...config };
      
      industryConfig.targetIndustries = [industry];
      
      // Set industry-specific defaults if not provided
      switch (industry.toLowerCase()) {
        case 'technology':
          industryConfig.contactDiscoveryDepth = config.contactDiscoveryDepth || 'comprehensive';
          industryConfig.targetCompanySizes = config.targetCompanySizes || ['small', 'medium', 'large'];
          industryConfig.minCompaniesPerIndustry = config.minCompaniesPerIndustry || 150;
          break;
          
        case 'healthcare':
          industryConfig.contactDiscoveryDepth = config.contactDiscoveryDepth || 'comprehensive';
          industryConfig.targetCompanySizes = config.targetCompanySizes || ['medium', 'large', 'enterprise'];
          industryConfig.minCompaniesPerIndustry = config.minCompaniesPerIndustry || 100;
          break;
          
        case 'manufacturing':
          industryConfig.contactDiscoveryDepth = config.contactDiscoveryDepth || 'standard';
          industryConfig.targetCompanySizes = config.targetCompanySizes || ['medium', 'large'];
          industryConfig.minCompaniesPerIndustry = config.minCompaniesPerIndustry || 120;
          break;
          
        case 'finance':
          industryConfig.contactDiscoveryDepth = config.contactDiscoveryDepth || 'comprehensive';
          industryConfig.targetCompanySizes = config.targetCompanySizes || ['large', 'enterprise'];
          industryConfig.minCompaniesPerIndustry = config.minCompaniesPerIndustry || 80;
          break;
          
        case 'retail':
          industryConfig.contactDiscoveryDepth = config.contactDiscoveryDepth || 'standard';
          industryConfig.targetCompanySizes = config.targetCompanySizes || ['small', 'medium', 'large'];
          industryConfig.minCompaniesPerIndustry = config.minCompaniesPerIndustry || 200;
          break;
      }
      
      // Create estimation with industry-specific configuration
      return this.estimateCompletionTime(industryConfig);
    }
    
    /**
     * Compare estimates for different configuration options
     */
    compareEstimates(baseConfig, variations) {
      const baseEstimate = this.estimateCompletionTime(baseConfig);
      const comparisonResults = [];
      
      // Generate estimates for each variation
      variations.forEach(variation => {
        // Create configuration with this variation
        const varConfig = { ...baseConfig, ...variation.config };
        
        // Generate estimate
        const estimate = this.estimateCompletionTime(varConfig);
        
        // Calculate differences
        const timeDifference = estimate.totalEstimatedTime - baseEstimate.totalEstimatedTime;
        const percentDifference = (timeDifference / baseEstimate.totalEstimatedTime) * 100;
        
        // Find stage with biggest difference
        const stageDifferences = {};
        Object.entries(estimate.breakdownByStage).forEach(([stage, time]) => {
          const baseTime = baseEstimate.breakdownByStage[stage] || 0;
          stageDifferences[stage] = time - baseTime;
        });
        
        const biggestDifferenceStage = Object.entries(stageDifferences)
          .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
        
        // Add to comparison results
        comparisonResults.push({
          variation: variation.name,
          changedParameters: Object.keys(variation.config),
          totalTime: estimate.totalEstimatedTime,
          completionDate: estimate.estimatedCompletionDate,
          timeDifference: timeDifference,
          percentDifference: percentDifference,
          biggestImpact: {
            stage: biggestDifferenceStage[0],
            timeDifference: biggestDifferenceStage[1],
            percentDifference: (biggestDifferenceStage[1] / baseEstimate.breakdownByStage[biggestDifferenceStage[0]]) * 100
          },
          confidence: estimate.confidence,
          variables: estimate.variabilityFactors.map(f => f.factor)
        });
      });
      
      // Sort by total time
      comparisonResults.sort((a, b) => a.totalTime - b.totalTime);
      
      return {
        baseEstimate: {
          totalTime: baseEstimate.totalEstimatedTime,
          completionDate: baseEstimate.estimatedCompletionDate,
          confidence: baseEstimate.confidence
        },
        variations: comparisonResults,
        fastestVariation: comparisonResults[0],
        slowestVariation: comparisonResults[comparisonResults.length - 1],
        timestamp: new Date()
      };
    }
    
    /**
     * Generate an optimized configuration to meet a target completion date
     */
    generateOptimizedConfig(baseConfig, targetDate) {
      const baseEstimate = this.estimateCompletionTime(baseConfig);
      const targetTime = new Date(targetDate).getTime();
      const currentEstimatedTime = baseEstimate.estimatedCompletionDate.getTime();
      
      // Check if already meets target
      if (currentEstimatedTime <= targetTime) {
        return {
          status: 'already-meets-target',
          baseConfig: baseConfig,
          currentEstimate: baseEstimate,
          targetDate: new Date(targetDate)
        };
      }
      
      // Calculate time reduction needed
      const reductionNeeded = currentEstimatedTime - targetTime;
      const reductionPercent = reductionNeeded / baseEstimate.totalEstimatedTime;
      
      // Determine optimization strategy based on reduction needed
      let optimizationStrategy;
      let optimizedConfig = { ...baseConfig };
      
      if (reductionPercent <= 0.1) {
        // Small reduction (up to 10%) - minor tweaks
        optimizationStrategy = 'minor-adjustments';
        
        // Reduce company count slightly
        if (optimizedConfig.minCompaniesPerIndustry) {
          optimizedConfig.minCompaniesPerIndustry = Math.max(50, 
            Math.floor(optimizedConfig.minCompaniesPerIndustry * 0.9));
        }
        
      } else if (reductionPercent <= 0.25) {
        // Medium reduction (10-25%) - scope adjustments
        optimizationStrategy = 'scope-reduction';
        
        // Reduce discovery depth
        if (optimizedConfig.contactDiscoveryDepth === 'exhaustive') {
          optimizedConfig.contactDiscoveryDepth = 'comprehensive';
        } else if (optimizedConfig.contactDiscoveryDepth === 'comprehensive') {
          optimizedConfig.contactDiscoveryDepth = 'standard';
        }
        
        // Reduce company count moderately
        if (optimizedConfig.minCompaniesPerIndustry) {
          optimizedConfig.minCompaniesPerIndustry = Math.max(50, 
            Math.floor(optimizedConfig.minCompaniesPerIndustry * 0.75));
        }
        
        // Reduce regions if more than one
        if (optimizedConfig.targetRegions && optimizedConfig.targetRegions.length > 1) {
          // Sort regions by complexity and remove the most complex one
          const sortedRegions = [...optimizedConfig.targetRegions].sort((a, b) => {
            const aFactor = this.complexityFactors.region[a.toLowerCase()] || 
                           this.complexityFactors.region.default;
            const bFactor = this.complexityFactors.region[b.toLowerCase()] || 
                           this.complexityFactors.region.default;
            return bFactor - aFactor;
          });
          
          optimizedConfig.targetRegions = sortedRegions.slice(0, sortedRegions.length - 1);
        }
        
      } else if (reductionPercent <= 0.5) {
        // Large reduction (25-50%) - major scope reduction
        optimizationStrategy = 'major-scope-reduction';
        
        // Reduce to basic discovery depth
        optimizedConfig.contactDiscoveryDepth = 'basic';
        
        // Reduce company count significantly
        if (optimizedConfig.minCompaniesPerIndustry) {
          optimizedConfig.minCompaniesPerIndustry = Math.max(50, 
            Math.floor(optimizedConfig.minCompaniesPerIndustry * 0.6));
        }
        
        // Reduce to a single region (least complex)
        if (optimizedConfig.targetRegions && optimizedConfig.targetRegions.length > 1) {
          const sortedRegions = [...optimizedConfig.targetRegions].sort((a, b) => {
            const aFactor = this.complexityFactors.region[a.toLowerCase()] || 
                           this.complexityFactors.region.default;
            const bFactor = this.complexityFactors.region[b.toLowerCase()] || 
                           this.complexityFactors.region.default;
            return aFactor - bFactor;
          });
          
          optimizedConfig.targetRegions = [sortedRegions[0]];
        }
        
        // Reduce to a single industry (least complex)
        if (optimizedConfig.targetIndustries && optimizedConfig.targetIndustries.length > 1) {
          const sortedIndustries = [...optimizedConfig.targetIndustries].sort((a, b) => {
            const aFactor = this.complexityFactors.industry[a.toLowerCase()] || 
                           this.complexityFactors.industry.default;
            const bFactor = this.complexityFactors.industry[b.toLowerCase()] || 
                           this.complexityFactors.industry.default;
            return aFactor - bFactor;
          });
          
          optimizedConfig.targetIndustries = [sortedIndustries[0]];
        }
        
      } else {
        // Extreme reduction (>50%) - not feasible
        return {
          status: 'target-not-feasible',
          baseConfig: baseConfig,
          currentEstimate: baseEstimate,
          targetDate: new Date(targetDate),
          feasibilityGap: reductionNeeded,
          recommendation: 'Adjust target date or consider a phased approach'
        };
      }
      
      // Calculate new estimate with optimized configuration
      const optimizedEstimate = this.estimateCompletionTime(optimizedConfig);
      
      // Check if optimization meets target
      const newEstimatedTime = optimizedEstimate.estimatedCompletionDate.getTime();
      const targetMet = newEstimatedTime <= targetTime;
      
      return {
        status: targetMet ? 'target-achievable' : 'partial-optimization',
        baseConfig: baseConfig,
        optimizedConfig: optimizedConfig,
        optimizationStrategy: optimizationStrategy,
        currentEstimate: baseEstimate,
        optimizedEstimate: optimizedEstimate,
        targetDate: new Date(targetDate),
        timeReduction: currentEstimatedTime - newEstimatedTime,
        reductionPercent: ((currentEstimatedTime - newEstimatedTime) / baseEstimate.totalEstimatedTime) * 100,
        remainingGap: targetMet ? 0 : newEstimatedTime - targetTime,
        configChanges: this._identifyConfigChanges(baseConfig, optimizedConfig)
      };
    }
    
    /**
     * Identify changes between two configurations
     */
    _identifyConfigChanges(baseConfig, newConfig) {
      const changes = [];
      
      // Compare industries
      if (baseConfig.targetIndustries?.length !== newConfig.targetIndustries?.length) {
        changes.push({
          parameter: 'targetIndustries',
          before: baseConfig.targetIndustries?.length,
          after: newConfig.targetIndustries?.length,
          change: 'reduced-count',
          impact: 'high'
        });
      }
      
      // Compare regions
      if (baseConfig.targetRegions?.length !== newConfig.targetRegions?.length) {
        changes.push({
          parameter: 'targetRegions',
          before: baseConfig.targetRegions?.length,
          after: newConfig.targetRegions?.length,
          change: 'reduced-count',
          impact: 'high'
        });
      }
      
      // Compare company size
      if (baseConfig.targetCompanySizes?.length !== newConfig.targetCompanySizes?.length) {
        changes.push({
          parameter: 'targetCompanySizes',
          before: baseConfig.targetCompanySizes?.join(', '),
          after: newConfig.targetCompanySizes?.join(', '),
          change: 'adjusted-sizes',
          impact: 'medium'
        });
      }
      
      // Compare company count
      if (baseConfig.minCompaniesPerIndustry !== newConfig.minCompaniesPerIndustry) {
        changes.push({
          parameter: 'minCompaniesPerIndustry',
          before: baseConfig.minCompaniesPerIndustry,
          after: newConfig.minCompaniesPerIndustry,
          change: 'reduced-count',
          impact: 'medium',
          reductionPercent: ((baseConfig.minCompaniesPerIndustry - newConfig.minCompaniesPerIndustry) / 
                            baseConfig.minCompaniesPerIndustry) * 100
        });
      }
      
      // Compare discovery depth
      if (baseConfig.contactDiscoveryDepth !== newConfig.contactDiscoveryDepth) {
        changes.push({
          parameter: 'contactDiscoveryDepth',
          before: baseConfig.contactDiscoveryDepth,
          after: newConfig.contactDiscoveryDepth,
          change: 'reduced-depth',
          impact: 'high'
        });
      }
      
      return changes;
    }
  }
  
  // Export the CompletionEstimator class for use by other modules
  module.exports = CompletionEstimator;