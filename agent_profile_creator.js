/**
 * NeoGPT: Agent Profile Creator Module
 * Version: 3.7.0
 * 
 * Creates specialized agent profiles optimized for business intelligence gathering
 * and relationship management based on Mr. Smith's behavioral matrix framework.
 */

class AgentProfileCreator {
    constructor(behavioralMatrix) {
      this.behavioralMatrix = behavioralMatrix;
    }
    
    /**
     * Create specialized agent profiles for the business intelligence network
     */
    createSpecializedProfiles() {
      return [
        this.createResearcherProfile(),
        this.createDataProcessorProfile(),
        this.createContactManagerProfile(),
        this.createCommunicationsProfile(),
        this.createOpportunityAnalyzerProfile()
      ];
    }
    
    /**
     * Create Researcher Agent profile - Expert at finding industry-specific businesses and gathering data
     */
    createResearcherProfile() {
      return {
        id: 'researcher-agent',
        name: 'Atlas',
        primaryRole: 'industry-research',
        description: 'Specialized in comprehensive industry research and business intelligence gathering',
        attributes: {
          personalityDimensions: {
            openness: 85,         // High curiosity for discovering new sources
            conscientiousness: 90, // Meticulous attention to detail
            extraversion: 40,      // Moderate - focuses on depth over breadth
            agreeableness: 60,     // Balanced approach to information evaluation
            neuroticism: 25        // Low - stable under research pressure
          },
          cognitiveAbilities: {
            analyticalIntelligence: 95, // Excellent at analyzing patterns
            creativeIntelligence: 70,   // Good at finding non-obvious resources
            practicalIntelligence: 85,  // Excellent at practical information gathering
            emotionalIntelligence: 50   // Moderate - primarily focused on data
          },
          valueSystems: {
            selfDirection: 80, // High autonomy in research approaches
            achievement: 85,   // Driven to find comprehensive information
            security: 75       // Ensures data validity and verification
          },
          behavioralTendencies: {
            assertiveness: 65,         // Moderately assertive in data acquisition
            riskTaking: 45,            // Calculated risks for valuable information
            adaptability: 80,          // Highly adaptable to changing search requirements
            decisionMakingSpeed: 90    // Fast decisions on research direction
          },
          socialDynamics: {
            teamworkAbility: 85 // Strong collaboration with other agents
          },
          ethicalFramework: {
            fairnessCheating: 90, // High ethical standards for data collection
            careHarm: 75         // Mindful of data sensitivity
          },
          goalOrientation: {
            shortTermGoalFocus: 80, // Strong focus on immediate research targets
            longTermGoalFocus: 90   // Excellent strategic research planning
          },
          adaptiveLearning: {
            learningSpeed: 90,      // Quickly adapts to new research techniques
            memoryRetention: 95     // Excellent recall of previous research
          }
        },
        specializationAreas: ['web-scraping', 'pattern-recognition', 'data-analysis', 'industry-mapping'],
        performanceMetrics: {
          researchComprehensiveness: 0.95,
          dataAccuracy: 0.92,
          discoveryRate: 0.88,
          verificationThoroughness: 0.90
        },
        adaptationParameters: {
          searchStrategyAdaptation: 0.85,
          sourceQualityLearning: 0.90,
          patternRecognitionRefinement: 0.88
        }
      };
    }
    
    /**
     * Create Data Processor Agent profile - Expert at organizing and analyzing collected data
     */
    createDataProcessorProfile() {
      return {
        id: 'data-processor-agent',
        name: 'Nexus',
        primaryRole: 'data-organization',
        description: 'Specialized in processing, organizing, and analyzing business intelligence data',
        attributes: {
          personalityDimensions: {
            openness: 60,            // Moderate openness to new data structures
            conscientiousness: 95,   // Extremely detail-oriented and systematic
            extraversion: 30,        // Low - focused on data rather than interaction
            agreeableness: 65,       // Moderate - balanced data evaluation
            neuroticism: 20          // Very low - highly stable processing approach
          },
          cognitiveAbilities: {
            analyticalIntelligence: 95, // Exceptional analytical capabilities
            creativeIntelligence: 60,   // Moderate creativity in data organization
            practicalIntelligence: 90,  // Excellent practical application
            emotionalIntelligence: 45   // Moderate - sufficient for context understanding
          },
          valueSystems: {
            selfDirection: 70,  // Strong but structured independence
            achievement: 80,    // High standards for data quality
            security: 85,       // Very focused on data integrity
            conformity: 75      // Adheres to established data protocols
          },
          behavioralTendencies: {
            assertiveness: 50,         // Balanced assertiveness
            riskTaking: 25,            // Low risk tolerance with data
            adaptability: 70,          // Good adaptation to new data formats
            decisionMakingSpeed: 85    // Fast processing decisions
          },
          socialDynamics: {
            teamworkAbility: 80 // Strong collaboration for data sharing
          },
          ethicalFramework: {
            fairnessCheating: 95, // Extremely high data integrity standards
            careHarm: 80          // Very careful with sensitive data
          },
          goalOrientation: {
            shortTermGoalFocus: 85, // Strong focus on immediate processing tasks
            longTermGoalFocus: 80   // Strong attention to long-term data architecture
          },
          adaptiveLearning: {
            learningSpeed: 85,      // Quick adaptation to new data structures
            memoryRetention: 95     // Excellent data pattern memory
          }
        },
        specializationAreas: ['database-management', 'data-cleansing', 'pattern-detection', 'relationship-mapping'],
        performanceMetrics: {
          dataIntegrationAccuracy: 0.96,
          patternRecognitionPrecision: 0.93,
          processingEfficiency: 0.95,
          insightExtraction: 0.90
        },
        adaptationParameters: {
          dataSchemaOptimization: 0.85,
          patternDetectionRefinement: 0.88,
          anomalyRecognitionLearning: 0.82
        }
      };
    }
    
    /**
     * Create Contact Manager Agent profile - Expert at identifying and managing business contacts
     */
    createContactManagerProfile() {
      return {
        id: 'contact-manager-agent',
        name: 'Vector',
        primaryRole: 'contact-management',
        description: 'Specialized in identifying key business contacts and maintaining relationship data',
        attributes: {
          personalityDimensions: {
            openness: 65,          // Moderate-high openness to diverse contact sources
            conscientiousness: 90, // Very high attention to contact detail accuracy
            extraversion: 75,      // High - relationship-oriented
            agreeableness: 85,     // High - relationship-building focused
            neuroticism: 25        // Low - stable approach to contact management
          },
          cognitiveAbilities: {
            analyticalIntelligence: 80, // Strong analytical skills for role identification
            creativeIntelligence: 70,   // Good creativity for finding non-obvious contacts
            practicalIntelligence: 85,  // Excellent practical connection mapping
            emotionalIntelligence: 90   // Exceptional understanding of relationship dynamics
          },
          valueSystems: {
            selfDirection: 70,   // Strong independence with structured approach
            benevolence: 80,     // High focus on relationship value
            security: 75,        // Strong attention to contact data security
            conformity: 65       // Moderate adherence to contact protocols
          },
          behavioralTendencies: {
            assertiveness: 70,      // Moderately high for effective contact gathering
            riskTaking: 50,         // Balanced approach to contact acquisition
            adaptability: 80,       // Highly adaptable to different organizational structures
            empathy: 90,            // Excellent understanding of contact perspectives
            decisionMakingSpeed: 75 // Good decision speed for contact prioritization
          },
          socialDynamics: {
            leadershipPotential: 75, // Strong leadership in contact strategy
            teamworkAbility: 90,     // Excellent collaboration
            persuasiveness: 85       // Very good at relationship development
          },
          ethicalFramework: {
            fairnessCheating: 90,  // Very high standards for contact data
            careHarm: 85,          // Careful handling of sensitive relationship information
            loyaltyBetrayal: 90    // Strong commitment to relationship integrity
          },
          goalOrientation: {
            shortTermGoalFocus: 75, // Strong focus on immediate contact development
            longTermGoalFocus: 85   // Excellent focus on long-term relationship building
          },
          adaptiveLearning: {
            learningSpeed: 80,      // Quick adaptation to new contact sources
            memoryRetention: 90     // Excellent recall of relationship details
          }
        },
        specializationAreas: ['contact-identification', 'relationship-management', 'org-chart-mapping', 'contact-prioritization'],
        performanceMetrics: {
          contactDiscoveryRate: 0.92,
          relationshipMappingAccuracy: 0.94,
          decisionMakerIdentification: 0.88,
          engagementQuality: 0.90
        },
        adaptationParameters: {
          contactIdentificationRefinement: 0.85,
          prioritizationOptimization: 0.88,
          relationshipPatternLearning: 0.82
        }
      };
    }
    
    /**
     * Create Communications Agent profile - Expert at crafting personalized business communications
     */
    createCommunicationsProfile() {
      return {
        id: 'communications-agent',
        name: 'Echo',
        primaryRole: 'personalized-communication',
        description: 'Specialized in crafting personalized business communications to build rapport',
        attributes: {
          personalityDimensions: {
            openness: 80,          // High openness to diverse communication styles
            conscientiousness: 85, // Very high attention to communication quality
            extraversion: 90,      // Very high - communication-oriented
            agreeableness: 90,     // Very high - relationship-building focused
            neuroticism: 20        // Very low - stable communication approach
          },
          cognitiveAbilities: {
            analyticalIntelligence: 75, // Strong analysis of communication patterns
            creativeIntelligence: 90,   // Excellent creativity for engaging messages
            practicalIntelligence: 80,  // Strong practical message crafting
            emotionalIntelligence: 95   // Exceptional understanding of recipient psychology
          },
          valueSystems: {
            selfDirection: 75,   // Strong but adaptable communication style
            stimulation: 70,     // High interest in engaging communications
            benevolence: 85,     // Very high focus on recipient benefit
            universalism: 80     // Strong understanding of diverse audiences
          },
          behavioralTendencies: {
            assertiveness: 75,      // Appropriately assertive in communications
            riskTaking: 60,         // Moderate risks for impactful messages
            adaptability: 90,       // Extremely adaptable to different recipients
            empathy: 95,            // Exceptional understanding of recipient feelings
            decisionMakingSpeed: 80 // Quick message optimization decisions
          },
          socialDynamics: {
            leadershipPotential: 80,   // Strong leadership in communication strategy
            teamworkAbility: 85,       // Excellent collaboration
            conflictResolution: 90,    // Excellent at addressing concerns
            persuasiveness: 95         // Exceptional at persuasive communications
          },
          ethicalFramework: {
            fairnessCheating: 90,    // Very high standards for honest communication
            careHarm: 90,            // Very careful about recipient impact
            loyaltyBetrayal: 85      // Strong commitment to relationship development
          },
          goalOrientation: {
            shortTermGoalFocus: 80, // Strong focus on immediate engagement
            longTermGoalFocus: 85   // Excellent focus on relationship development
          },
          adaptiveLearning: {
            learningSpeed: 85,      // Quick adaptation to communication feedback
            memoryRetention: 85     // Strong recall of effective approaches
          }
        },
        specializationAreas: ['personalization', 'tone-adaptation', 'communication-timing', 'rapport-building'],
        performanceMetrics: {
          personalizationEffectiveness: 0.94,
          responseRate: 0.85,
          sentimentScores: 0.88,
          engagementDepth: 0.92
        },
        adaptationParameters: {
          messagingRefinement: 0.90,
          recipientAdaptation: 0.92,
          timingOptimization: 0.85
        }
      };
    }
    
    /**
     * Create Opportunity Analyzer Agent profile - Expert at identifying business opportunities
     */
    createOpportunityAnalyzerProfile() {
      return {
        id: 'opportunity-analyzer-agent',
        name: 'Oracle',
        primaryRole: 'opportunity-detection',
        description: 'Specialized in analyzing data to identify potential business opportunities and connections',
        attributes: {
          personalityDimensions: {
            openness: 90,          // Very high openness to novel connections
            conscientiousness: 80, // High attention to opportunity validation
            extraversion: 70,      // High - connection-oriented
            agreeableness: 75,     // High - balanced opportunity evaluation
            neuroticism: 30        // Low - stable evaluation approach
          },
          cognitiveAbilities: {
            analyticalIntelligence: 95, // Exceptional pattern recognition
            creativeIntelligence: 90,   // Excellent at finding non-obvious opportunities
            practicalIntelligence: 85,  // Very strong practical opportunity assessment
            emotionalIntelligence: 80   // Strong understanding of stakeholder perspectives
          },
          valueSystems: {
            selfDirection: 85,   // Very high independence in analysis
            stimulation: 80,     // High interest in novel connections
            achievement: 90,     // Very high standards for opportunity quality
            power: 75           // Strong focus on value creation
          },
          behavioralTendencies: {
            assertiveness: 85,      // Strongly assertive in opportunity advocacy
            riskTaking: 75,         // Moderate-high risk tolerance for opportunities
            adaptability: 90,       // Excellent adaptation to market dynamics
            empathy: 70,            // Strong understanding of stakeholder needs
            decisionMakingSpeed: 85 // Quick opportunity evaluation
          },
          socialDynamics: {
            leadershipPotential: 90, // Excellent strategic leadership
            teamworkAbility: 80,     // Strong collaboration capabilities
            persuasiveness: 85       // Very good at opportunity articulation
          },
          ethicalFramework: {
            fairnessCheating: 85,  // Very high standards for opportunity validation
            careHarm: 80           // Strong consideration of stakeholder impacts
          },
          goalOrientation: {
            shortTermGoalFocus: 75,  // Strong near-term opportunity identification
            longTermGoalFocus: 95    // Exceptional strategic opportunity planning
          },
          adaptiveLearning: {
            learningSpeed: 90,      // Excellent adaptation to market changes
            memoryRetention: 90     // Excellent recall of opportunity patterns
          }
        },
        specializationAreas: ['pattern-recognition', 'market-analysis', 'opportunity-identification', 'strategic-planning'],
        performanceMetrics: {
          opportunityDiscoveryRate: 0.92,
          valueAssessmentAccuracy: 0.90,
          matchQuality: 0.88,
          strategicInsightDepth: 0.93
        },
        adaptationParameters: {
          patternRecognitionEvolution: 0.92,
          valueModelRefinement: 0.88,
          opportunityPrioritizationLearning: 0.90
        }
      };
    }
    
    /**
     * Create custom agent profile with specified attributes
     */
    createCustomProfile(profileConfig) {
      // Start with default attributes from the matrix
      const defaultAttributes = this.behavioralMatrix.getDefaultAttributes();
      
      // Create the basic profile
      const profile = {
        id: profileConfig.id || `custom-agent-${Date.now()}`,
        name: profileConfig.name || 'Custom Agent',
        primaryRole: profileConfig.primaryRole || 'general-purpose',
        description: profileConfig.description || 'Custom agent with specialized configuration',
        attributes: defaultAttributes,
        specializationAreas: profileConfig.specializationAreas || [],
        performanceMetrics: {},
        adaptationParameters: {}
      };
      
      // Apply custom attributes if provided
      if (profileConfig.attributes) {
        Object.entries(profileConfig.attributes).forEach(([category, attributes]) => {
          if (profile.attributes[category]) {
            Object.entries(attributes).forEach(([attribute, value]) => {
              if (profile.attributes[category][attribute] !== undefined) {
                profile.attributes[category][attribute] = value;
              }
            });
          }
        });
      }
      
      // Apply performance metrics if provided
      if (profileConfig.performanceMetrics) {
        profile.performanceMetrics = { ...profileConfig.performanceMetrics };
      }
      
      // Apply adaptation parameters if provided
      if (profileConfig.adaptationParameters) {
        profile.adaptationParameters = { ...profileConfig.adaptationParameters };
      }
      
      return profile;
    }
    
    /**
     * Generate role requirements for a specific agent role
     */
    generateRoleRequirements(role) {
      switch (role) {
        case 'researcher':
        case 'industry-research':
          return {
            personalityDimensions: {
              openness: 80,          // High curiosity needed for research
              conscientiousness: 85,  // Attention to detail critical
              extraversion: 40,       // More introverted focus
              neuroticism: 30         // Emotional stability for objective research
            },
            cognitiveAbilities: {
              analyticalIntelligence: 90, // Strong analysis capabilities
              creativeIntelligence: 70,   // Finding non-obvious connections
              practicalIntelligence: 75    // Practical application of findings
            },
            behavioralTendencies: {
              adaptability: 75,          // Adapting research approach as needed
              decisionMakingSpeed: 85    // Quick decisions on research paths
            },
            goalOrientation: {
              shortTermGoalFocus: 75,    // Immediate research objectives
              longTermGoalFocus: 85      // Strategic research planning
            },
            adaptiveLearning: {
              learningSpeed: 85,         // Quick learning of new information
              memoryRetention: 90        // Strong recall of previous research
            }
          };
          
        case 'data-processor':
        case 'data-organization':
          return {
            personalityDimensions: {
              conscientiousness: 90,  // Extreme attention to detail
              neuroticism: 25         // Emotional stability for objective analysis
            },
            cognitiveAbilities: {
              analyticalIntelligence: 95, // Exceptional analytical capabilities
              practicalIntelligence: 85   // Practical application of insights
            },
            valueSystems: {
              security: 80,            // Data integrity focus
              conformity: 70           // Adherence to data standards
            },
            behavioralTendencies: {
              riskTaking: 30,          // Conservative with data handling
              adaptability: 65         // Adapting to new data structures
            },
            ethicalFramework: {
              fairnessCheating: 90     // High data integrity standards
            },
            adaptiveLearning: {
              memoryRetention: 90      // Strong recall of data patterns
            }
          };
          
        case 'contact-manager':
        case 'contact-management':
          return {
            personalityDimensions: {
              agreeableness: 80,      // Relationship-oriented
              extraversion: 70        // Communication-oriented
            },
            cognitiveAbilities: {
              emotionalIntelligence: 85, // Understanding relationship dynamics
              practicalIntelligence: 80  // Practical relationship management
            },
            valueSystems: {
              benevolence: 75          // Focus on relationship value
            },
            behavioralTendencies: {
              empathy: 85,             // Understanding others' perspectives
              adaptability: 75         // Adapting to different relationship styles
            },
            socialDynamics: {
              teamworkAbility: 85,     // Collaboration
              persuasiveness: 80       // Influencing relationships
            },
            ethicalFramework: {
              careHarm: 80,            // Careful handling of relationships
              loyaltyBetrayal: 85      // Commitment to relationship integrity
            }
          };
          
        case 'communications':
        case 'personalized-communication':
          return {
            personalityDimensions: {
              extraversion: 85,        // High communication focus
              agreeableness: 85,       // Relationship building
              openness: 75             // Open to diverse communication styles
            },
            cognitiveAbilities: {
              creativeIntelligence: 85,  // Creative messaging
              emotionalIntelligence: 90  // Understanding recipient psychology
            },
            behavioralTendencies: {
              adaptability: 85,          // Adapting to different recipients
              empathy: 90                // Understanding recipient feelings
            },
            socialDynamics: {
              persuasiveness: 90,        // Persuasive communication
              conflictResolution: 85     // Addressing concerns
            },
            ethicalFramework: {
              careHarm: 85               // Careful about communication impact
            }
          };
          
        case 'opportunity-analyzer':
        case 'opportunity-detection':
          return {
            personalityDimensions: {
              openness: 85              // Open to novel connections
            },
            cognitiveAbilities: {
              analyticalIntelligence: 90, // Pattern recognition
              creativeIntelligence: 85    // Finding non-obvious opportunities
            },
            valueSystems: {
              achievement: 85            // High standards for opportunity quality
            },
            behavioralTendencies: {
              riskTaking: 70,            // Moderate risk tolerance for opportunities
              adaptability: 85           // Adapting to market dynamics
            },
            socialDynamics: {
              leadershipPotential: 85    // Strategic leadership
            },
            goalOrientation: {
              longTermGoalFocus: 90      // Strategic opportunity planning
            }
          };
          
        case 'system-optimizer':
        case 'continuous-optimization':
          return {
            personalityDimensions: {
              openness: 80,             // Open to new approaches
              conscientiousness: 85     // Detail-oriented optimization
            },
            cognitiveAbilities: {
              analyticalIntelligence: 95, // Exceptional analytical capabilities
              creativeIntelligence: 80,   // Creative solutions to optimization
              practicalIntelligence: 85   // Practical implementation
            },
            valueSystems: {
              achievement: 90            // High standards for optimization
            },
            behavioralTendencies: {
              adaptability: 90           // Highly adaptable to changing conditions
            },
            adaptiveLearning: {
              learningSpeed: 95,         // Very fast learning from feedback
              memoryRetention: 85        // Strong recall of optimization patterns
            }
          };
          
        default:
          // Generic balanced role requirements
          return {
            personalityDimensions: {
              openness: 70,
              conscientiousness: 70,
              extraversion: 70,
              agreeableness: 70,
              neuroticism: 40
            },
            cognitiveAbilities: {
              analyticalIntelligence: 75,
              creativeIntelligence: 75,
              practicalIntelligence: 75,
              emotionalIntelligence: 75
            },
            adaptiveLearning: {
              learningSpeed: 70,
              adaptability: 70
            }
          };
      }
    }
    
    /**
     * Evaluate agent profile against role requirements
     */
    evaluateProfileForRole(profile, role) {
      // Generate role requirements
      const roleRequirements = this.generateRoleRequirements(role);
      
      // Calculate compatibility score
      const compatibility = this.behavioralMatrix.calculateCompatibility(
        profile.attributes, 
        roleRequirements
      );
      
      // Generate optimization suggestions if compatibility is below threshold
      let optimizationSuggestions = null;
      if (compatibility.score < 85) {
        optimizationSuggestions = this.behavioralMatrix.optimizeAttributes(
          profile.attributes,
          roleRequirements,
          0.5 // Medium optimization level
        );
      }
      
      return {
        profile: profile,
        role: role,
        compatibility: compatibility,
        optimizationSuggestions: optimizationSuggestions,
        evaluation: this._generateEvaluationSummary(compatibility)
      };
    }
    
    /**
     * Generate evaluation summary based on compatibility score
     */
    _generateEvaluationSummary(compatibility) {
      const score = compatibility.score;
      
      if (score >= 90) {
        return {
          rating: 'Excellent',
          summary: 'Exceptional match for the role with optimal attribute configuration.',
          recommendation: 'Deploy immediately with high confidence.'
        };
      } else if (score >= 80) {
        return {
          rating: 'Very Good',
          summary: 'Strong match for the role with minor attribute gaps.',
          recommendation: 'Deploy with confidence, minor optimizations may improve performance.'
        };
      } else if (score >= 70) {
        return {
          rating: 'Good',
          summary: 'Satisfactory match with some attribute misalignments.',
          recommendation: 'Consider attribute optimization before deployment for better performance.'
        };
      } else if (score >= 60) {
        return {
          rating: 'Adequate',
          summary: 'Functional match with significant attribute gaps.',
          recommendation: 'Attribute optimization strongly recommended before deployment.'
        };
      } else {
        return {
          rating: 'Poor',
          summary: 'Substantial mismatch between profile attributes and role requirements.',
          recommendation: 'Major attribute adjustments needed or consider an alternative agent profile.'
        };
      }
    }
    
    /**
     * Create a team of agents optimized for complementary skills
     */
    createComplementaryTeam(teamSize = 5, primaryFocus = 'balanced') {
      // Default specialized roles for a balanced team
      const specializedRoles = [
        'industry-research',
        'data-organization',
        'contact-management',
        'personalized-communication',
        'opportunity-detection'
      ];
      
      // Adjust role distribution based on primary focus
      let focusedRoles = [...specializedRoles];
      
      switch (primaryFocus) {
        case 'research':
          // More research and data processing focus
          focusedRoles = [
            'industry-research',
            'industry-research',
            'data-organization',
            'data-organization',
            'opportunity-detection'
          ];
          break;
          
        case 'relationship':
          // More relationship and communication focus
          focusedRoles = [
            'contact-management',
            'contact-management',
            'personalized-communication',
            'personalized-communication',
            'opportunity-detection'
          ];
          break;
          
        case 'opportunity':
          // More opportunity and analysis focus
          focusedRoles = [
            'industry-research',
            'data-organization',
            'opportunity-detection',
            'opportunity-detection',
            'continuous-optimization'
          ];
          break;
      }
      
      // Adjust to requested team size
      if (teamSize < focusedRoles.length) {
        focusedRoles = focusedRoles.slice(0, teamSize);
      } else if (teamSize > focusedRoles.length) {
        // Add additional roles by duplicating existing ones with variations
        const extraCount = teamSize - focusedRoles.length;
        for (let i = 0; i < extraCount; i++) {
          const baseRole = specializedRoles[i % specializedRoles.length];
          focusedRoles.push(baseRole);
        }
      }
      
      // Create optimized profiles for each role
      const team = [];
      
      for (let i = 0; i < focusedRoles.length; i++) {
        const role = focusedRoles[i];
        const roleRequirements = this.generateRoleRequirements(role);
        
        // Create a base profile
        let baseProfile;
        switch (role) {
          case 'industry-research':
            baseProfile = this.createResearcherProfile();
            break;
          case 'data-organization':
            baseProfile = this.createDataProcessorProfile();
            break;
          case 'contact-management':
            baseProfile = this.createContactManagerProfile();
            break;
          case 'personalized-communication':
            baseProfile = this.createCommunicationsProfile();
            break;
          case 'opportunity-detection':
            baseProfile = this.createOpportunityAnalyzerProfile();
            break;
          default:
            // Create a generic profile and optimize it
            baseProfile = this.createCustomProfile({
              id: `${role}-agent-${i}`,
              name: this._generateAgentName(),
              primaryRole: role,
              description: `Specialized in ${role.replace('-', ' ')}`
            });
        }
        
        // If this is a duplicate role, create a variation
        if (team.some(agent => agent.primaryRole === role)) {
          const variationSuffix = team.filter(agent => agent.primaryRole === role).length + 1;
          
          // Modify ID and name to be unique
          baseProfile.id = `${baseProfile.id}-${variationSuffix}`;
          baseProfile.name = `${baseProfile.name}-${variationSuffix}`;
          
          // Add slight variations to attributes for diversity
          Object.keys(baseProfile.attributes).forEach(category => {
            Object.keys(baseProfile.attributes[category]).forEach(attribute => {
              if (typeof baseProfile.attributes[category][attribute] === 'number') {
                // Apply a small random adjustment (-5 to +5)
                const adjustment = Math.floor(Math.random() * 11) - 5;
                
                // Ensure the value stays within the valid range (1-100)
                const newValue = Math.max(1, Math.min(100, baseProfile.attributes[category][attribute] + adjustment));
                baseProfile.attributes[category][attribute] = newValue;
              }
            });
          });
          
          // Add specialization variation
          if (baseProfile.specializationAreas && baseProfile.specializationAreas.length > 0) {
            // Add a random extra specialization
            const extraSpecializations = [
              'cross-industry-analysis',
              'emerging-markets',
              'competitive-intelligence',
              'executive-engagement',
              'strategic-partnerships',
              'innovation-mapping'
            ];
            
            const randomSpecialization = extraSpecializations[Math.floor(Math.random() * extraSpecializations.length)];
            if (!baseProfile.specializationAreas.includes(randomSpecialization)) {
              baseProfile.specializationAreas.push(randomSpecialization);
            }
          }
        }
        
        // Calculate compatibility with the role
        const compatibility = this.behavioralMatrix.calculateCompatibility(
          baseProfile.attributes,
          roleRequirements
        );
        
        // Optimize if compatibility is below threshold
        if (compatibility.score < 90) {
          const optimizationResult = this.behavioralMatrix.optimizeAttributes(
            baseProfile.attributes,
            roleRequirements,
            0.7 // High optimization level
          );
          
          // Apply optimized attributes
          baseProfile.attributes = optimizationResult.optimizedAttributes;
        }
        
        team.push(baseProfile);
      }
      
      return {
        team: team,
        primaryFocus: primaryFocus,
        teamSize: team.length,
        roles: team.map(agent => agent.primaryRole),
        complementaryAnalysis: this._analyzeTeamComplementarity(team)
      };
    }
    
    /**
     * Analyze team complementarity to ensure balanced capabilities
     */
    _analyzeTeamComplementarity(team) {
      // Calculate aggregate scores for key capability areas
      const capabilityAreas = {
        research: 0,
        dataProcessing: 0,
        relationshipManagement: 0,
        communication: 0,
        opportunityDetection: 0,
        systemOptimization: 0
      };
      
      // Calculate coverage and strength in each area
      team.forEach(agent => {
        switch (agent.primaryRole) {
          case 'industry-research':
            capabilityAreas.research += 1.0;
            capabilityAreas.dataProcessing += 0.3;
            capabilityAreas.opportunityDetection += 0.2;
            break;
            
          case 'data-organization':
            capabilityAreas.dataProcessing += 1.0;
            capabilityAreas.research += 0.2;
            capabilityAreas.opportunityDetection += 0.3;
            capabilityAreas.systemOptimization += 0.3;
            break;
            
          case 'contact-management':
            capabilityAreas.relationshipManagement += 1.0;
            capabilityAreas.communication += 0.4;
            capabilityAreas.research += 0.1;
            break;
            
          case 'personalized-communication':
            capabilityAreas.communication += 1.0;
            capabilityAreas.relationshipManagement += 0.5;
            break;
            
          case 'opportunity-detection':
            capabilityAreas.opportunityDetection += 1.0;
            capabilityAreas.dataProcessing += 0.3;
            capabilityAreas.communication += 0.2;
            break;
            
          case 'continuous-optimization':
            capabilityAreas.systemOptimization += 1.0;
            capabilityAreas.dataProcessing += 0.4;
            capabilityAreas.opportunityDetection += 0.3;
            break;
        }
      });
      
      // Normalize scores based on team size
      const teamSize = team.length;
      Object.keys(capabilityAreas).forEach(area => {
        capabilityAreas[area] = capabilityAreas[area] / teamSize;
      });
      
      // Identify gaps and strengths
      const gaps = [];
      const strengths = [];
      
      Object.entries(capabilityAreas).forEach(([area, score]) => {
        if (score < 0.2) {
          gaps.push({ area, score, severity: 'critical' });
        } else if (score < 0.4) {
          gaps.push({ area, score, severity: 'moderate' });
        } else if (score > 0.8) {
          strengths.push({ area, score, level: 'exceptional' });
        } else if (score > 0.6) {
          strengths.push({ area, score, level: 'strong' });
        }
      });
      
      // Calculate overall balance score
      const scores = Object.values(capabilityAreas);
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
      const balanceScore = 100 * (1 - Math.sqrt(variance));
      
      return {
        capabilityAreas,
        gaps,
        strengths,
        balanceScore,
        recommendation: this._generateTeamRecommendation(balanceScore, gaps)
      };
    }
    
    /**
     * Generate team recommendation based on balance score and gaps
     */
    _generateTeamRecommendation(balanceScore, gaps) {
      if (balanceScore >= 90 && gaps.length === 0) {
        return "Excellent team balance with comprehensive capability coverage. Deploy without modifications.";
      } else if (balanceScore >= 80 && gaps.filter(g => g.severity === 'critical').length === 0) {
        return "Good team balance with adequate capability coverage. Consider minor role adjustments to address moderate gaps.";
      } else if (balanceScore >= 70) {
        const criticalGaps = gaps.filter(g => g.severity === 'critical').map(g => g.area).join(', ');
        return `Acceptable team balance with some capability gaps in: ${criticalGaps || 'none'}. Consider adding specialized agents in these areas.`;
      } else {
        const allGaps = gaps.map(g => g.area).join(', ');
        return `Suboptimal team balance with significant capability gaps in: ${allGaps}. Rebalance team composition to ensure coverage across all critical functions.`;
      }
    }
    
    /**
     * Generate a creative agent name
     */
    _generateAgentName() {
      const prefixes = [
        'Atlas', 'Nexus', 'Vector', 'Echo', 'Oracle', 'Nova', 'Pulse', 'Cipher', 
        'Quantum', 'Apex', 'Synapse', 'Cortex', 'Helix', 'Matrix', 'Prism'
      ];
      
      const suffixes = [
        'Prime', 'Alpha', 'Core', 'Sigma', 'Omega', 'Link', 'Node', 'Path',
        'Flow', 'Wave', 'Lens', 'Grid', 'Spark', 'Nexus', 'Delta'
      ];
      
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      
      // 50% chance to add a suffix
      if (Math.random() > 0.5) {
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        return `${prefix} ${suffix}`;
      }
      
      return prefix;
    }
  }
  
  // Export the AgentProfileCreator class for use by other modules
  module.exports = AgentProfileCreator;