/**
 * NeoGPT: Optimization Manager Module
 * Version: 3.7.0
 * 
 * Manages the continuous optimization of the agent network through adaptive workflows,
 * performance analysis, and dynamic parameter adjustments.
 */

class OptimizationManager {
    constructor(eventBus, deployedAgents) {
      this.eventBus = eventBus;
      this.deployedAgents = deployedAgents;
      this.optimizationWorkflows = [];
      this.adaptationStrategies = this._initializeAdaptationStrategies();
      this.performanceThresholds = this._initializePerformanceThresholds();
      this.lastOptimizationTime = null;
      this.optimizationHistory = [];
    }
    
    /**
     * Initialize adaptation strategies for different performance aspects
     */
    _initializeAdaptationStrategies() {
      return {
        dataQuality: {
          low: {
            actions: [
              { type: 'agent-adjustment', target: 'researcher-agent', param: 'validateData', value: true },
              { type: 'tool-adjustment', target: 'data-validator', param: 'minConfidenceThreshold', increment: 0.1 },
              { type: 'workflow-adjustment', target: 'data-organization', param: 'dataQualityGate', value: true }
            ],
            priority: 'high'
          },
          medium: {
            actions: [
              { type: 'agent-adjustment', target: 'researcher-agent', param: 'dataSourceDiversity', increment: 0.2 },
              { type: 'tool-adjustment', target: 'data-validator', param: 'requireMultipleSources', value: true }
            ],
            priority: 'medium'
          }
        },
        responseRate: {
          low: {
            actions: [
              { type: 'agent-adjustment', target: 'communications-agent', param: 'personalizationDepth', increment: 0.2 },
              { type: 'tool-adjustment', target: 'message-crafter', param: 'valueFraming', value: true },
              { type: 'workflow-adjustment', target: 'communication-planning', param: 'responseOptimization', value: 'aggressive' }
            ],
            priority: 'high'
          },
          medium: {
            actions: [
              { type: 'agent-adjustment', target: 'communications-agent', param: 'messageQuality', increment: 0.1 },
              { type: 'tool-adjustment', target: 'engagement-sequencer', param: 'timingSmartness', value: 'high' }
            ],
            priority: 'medium'
          }
        },
        opportunityQuality: {
          low: {
            actions: [
              { type: 'agent-adjustment', target: 'opportunity-analyzer-agent', param: 'detectionThreshold', increment: 0.15 },
              { type: 'tool-adjustment', target: 'need-matcher', param: 'matchingPrecision', value: 'extreme' },
              { type: 'workflow-adjustment', target: 'opportunity-analysis', param: 'deepAnalysis', value: true }
            ],
            priority: 'high'
          },
          medium: {
            actions: [
              { type: 'agent-adjustment', target: 'opportunity-analyzer-agent', param: 'opportunityScope', increment: 0.1 },
              { type: 'tool-adjustment', target: 'value-modeler', param: 'scenarioPlanning', value: true }
            ],
            priority: 'medium'
          }
        },
        systemEfficiency: {
          low: {
            actions: [
              { type: 'global-adjustment', param: 'interAgentCommunication', value: 'optimized' },
              { type: 'resource-allocation', param: 'dynamicScaling', value: true },
              { type: 'database-adjustment', param: 'queryOptimization', value: 'aggressive' }
            ],
            priority: 'high'
          },
          medium: {
            actions: [
              { type: 'global-adjustment', param: 'workloadDistribution', value: 'balanced' },
              { type: 'database-adjustment', param: 'indexRebuild', value: true }
            ],
            priority: 'medium'
          }
        }
      };
    }
    
    /**
     * Initialize performance thresholds for triggering adaptations
     */
    _initializePerformanceThresholds() {
      return {
        dataQuality: {
          low: 0.6,
          medium: 0.75,
          high: 0.9
        },
        responseRate: {
          low: 0.15,
          medium: 0.25,
          high: 0.35
        },
        opportunityQuality: {
          low: 0.5,
          medium: 0.7,
          high: 0.85
        },
        systemEfficiency: {
          low: 0.6,
          medium: 0.75,
          high: 0.9
        }
      };
    }
    
    /**
     * Create optimization workflows for continuous improvement
     */
    createOptimizationWorkflows() {
      this.optimizationWorkflows = [
        this._createResponseOptimizationWorkflow(),
        this._createDataQualityWorkflow(),
        this._createOpportunityQualityWorkflow(),
        this._createSystemEfficiencyWorkflow()
      ];
      
      // Register workflows with event bus
      this.optimizationWorkflows.forEach(workflow => {
        this._registerWorkflowTriggers(workflow);
      });
      
      return this.optimizationWorkflows;
    }
    
    /**
     * Create response rate optimization workflow
     */
    _createResponseOptimizationWorkflow() {
      return {
        id: 'response-optimization',
        name: 'Communication Response Optimization',
        description: 'Improves message response rates through message personalization and timing',
        triggers: [
          {
            type: 'threshold',
            metric: 'responseRate',
            comparison: 'below',
            value: this.performanceThresholds.responseRate.medium,
            checkInterval: 24 * 60 * 60 * 1000, // 24 hours
            consecutiveChecks: 2
          },
          {
            type: 'event',
            eventType: 'metrics:update:responseRate',
            condition: (data) => data.value < this.performanceThresholds.responseRate.low
          },
          {
            type: 'manual',
            command: 'optimize:responseRate'
          }
        ],
        actions: this.adaptationStrategies.responseRate.low.actions,
        feedbackMetrics: ['responseRate', 'openRate', 'engagementQuality'],
        adaptationCooldown: 7 * 24 * 60 * 60 * 1000, // 7 days
        priority: this.adaptationStrategies.responseRate.low.priority
      };
    }
    
    /**
     * Create data quality optimization workflow
     */
    _createDataQualityWorkflow() {
      return {
        id: 'data-quality-optimization',
        name: 'Data Quality Enhancement',
        description: 'Improves the quality and accuracy of gathered business intelligence',
        triggers: [
          {
            type: 'threshold',
            metric: 'dataQuality',
            comparison: 'below',
            value: this.performanceThresholds.dataQuality.medium,
            checkInterval: 48 * 60 * 60 * 1000, // 48 hours
            consecutiveChecks: 2
          },
          {
            type: 'event',
            eventType: 'metrics:update:dataQuality',
            condition: (data) => data.value < this.performanceThresholds.dataQuality.low
          },
          {
            type: 'manual',
            command: 'optimize:dataQuality'
          }
        ],
        actions: this.adaptationStrategies.dataQuality.low.actions,
        feedbackMetrics: ['dataQuality', 'dataCompleteness', 'dataAccuracy'],
        adaptationCooldown: 5 * 24 * 60 * 60 * 1000, // 5 days
        priority: this.adaptationStrategies.dataQuality.low.priority
      };
    }
    
    /**
     * Create opportunity quality optimization workflow
     */
    _createOpportunityQualityWorkflow() {
      return {
        id: 'opportunity-quality-optimization',
        name: 'Opportunity Detection Enhancement',
        description: 'Improves the quality and relevance of identified business opportunities',
        triggers: [
          {
            type: 'threshold',
            metric: 'opportunityQuality',
            comparison: 'below',
            value: this.performanceThresholds.opportunityQuality.medium,
            checkInterval: 72 * 60 * 60 * 1000, // 72 hours
            consecutiveChecks: 2
          },
          {
            type: 'event',
            eventType: 'metrics:update:opportunityQuality',
            condition: (data) => data.value < this.performanceThresholds.opportunityQuality.low
          },
          {
            type: 'manual',
            command: 'optimize:opportunityQuality'
          }
        ],
        actions: this.adaptationStrategies.opportunityQuality.low.actions,
        feedbackMetrics: ['opportunityQuality', 'opportunityRelevance', 'opportunityConversion'],
        adaptationCooldown: 10 * 24 * 60 * 60 * 1000, // 10 days
        priority: this.adaptationStrategies.opportunityQuality.low.priority
      };
    }
    
    /**
     * Create system efficiency optimization workflow
     */
    _createSystemEfficiencyWorkflow() {
      return {
        id: 'system-efficiency-optimization',
        name: 'System Performance Enhancement',
        description: 'Improves overall system efficiency and resource utilization',
        triggers: [
          {
            type: 'threshold',
            metric: 'systemEfficiency',
            comparison: 'below',
            value: this.performanceThresholds.systemEfficiency.medium,
            checkInterval: 24 * 60 * 60 * 1000, // 24 hours
            consecutiveChecks: 3
          },
          {
            type: 'event',
            eventType: 'metrics:update:systemEfficiency',
            condition: (data) => data.value < this.performanceThresholds.systemEfficiency.low
          },
          {
            type: 'threshold',
            metric: 'systemLoad',
            comparison: 'above',
            value: 0.85,
            checkInterval: 30 * 60 * 1000, // 30 minutes
            consecutiveChecks: 6
          },
          {
            type: 'manual',
            command: 'optimize:systemEfficiency'
          }
        ],
        actions: this.adaptationStrategies.systemEfficiency.low.actions,
        feedbackMetrics: ['systemEfficiency', 'responseTime', 'resourceUtilization'],
        adaptationCooldown: 3 * 24 * 60 * 60 * 1000, // 3 days
        priority: this.adaptationStrategies.systemEfficiency.low.priority
      };
    }
    
    /**
     * Register workflow triggers with event bus
     */
    _registerWorkflowTriggers(workflow) {
      workflow.triggers.forEach(trigger => {
        switch (trigger.type) {
          case 'event':
            this.eventBus.subscribe(trigger.eventType, (data) => {
              if (trigger.condition(data)) {
                this._executeWorkflow(workflow, {
                  trigger: 'event',
                  eventType: trigger.eventType,
                  triggerData: data
                });
              }
            });
            break;
            
          case 'manual':
            this.eventBus.subscribe(trigger.command, (data) => {
              this._executeWorkflow(workflow, {
                trigger: 'manual',
                command: trigger.command,
                triggerData: data
              });
            });
            break;
            
          case 'threshold':
            // For threshold triggers, set up periodic checking
            setInterval(() => {
              this._checkThresholdTrigger(workflow, trigger);
            }, trigger.checkInterval);
            break;
        }
      });
    }
    
    /**
     * Check if a threshold trigger should fire
     */
    _checkThresholdTrigger(workflow, trigger) {
      // This would connect to actual metrics storage in a real implementation
      // For simulation, we'll generate a random metric value
      const metricValue = this._getMetricValue(trigger.metric);
      
      // Check if the threshold condition is met
      let conditionMet = false;
      
      if (trigger.comparison === 'below') {
        conditionMet = metricValue < trigger.value;
      } else if (trigger.comparison === 'above') {
        conditionMet = metricValue > trigger.value;
      } else if (trigger.comparison === 'equal') {
        conditionMet = metricValue === trigger.value;
      }
      
      // If condition is met for consecutive checks, execute workflow
      if (conditionMet) {
        trigger.consecutiveMatches = (trigger.consecutiveMatches || 0) + 1;
        
        if (trigger.consecutiveMatches >= trigger.consecutiveChecks) {
          this._executeWorkflow(workflow, {
            trigger: 'threshold',
            metric: trigger.metric,
            value: metricValue,
            threshold: trigger.value,
            comparison: trigger.comparison
          });
          
          // Reset consecutive matches after execution
          trigger.consecutiveMatches = 0;
        }
      } else {
        // Reset consecutive matches if condition is not met
        trigger.consecutiveMatches = 0;
      }
    }
    
    /**
     * Get current value for a metric
     */
    _getMetricValue(metric) {
      // This would connect to a metrics repository in a real implementation
      // For simulation, generate values around the thresholds
      const thresholds = this.performanceThresholds[metric];
      
      if (thresholds) {
        // Generate random value centered around the medium threshold with some variance
        const center = thresholds.medium;
        const variance = 0.1;
        return Math.max(0, Math.min(1, center + (Math.random() * variance * 2 - variance)));
      }
      
      // Default to a random value between 0.5 and 0.9
      return 0.5 + (Math.random() * 0.4);
    }
    
    /**
     * Execute an optimization workflow
     */
    _executeWorkflow(workflow, triggerInfo) {
      // Check if workflow is on cooldown
      const now = Date.now();
      const lastExecution = workflow.lastExecutionTime;
      
      if (lastExecution && (now - lastExecution) < workflow.adaptationCooldown) {
        console.log(`Workflow ${workflow.id} is on cooldown, skipping execution`);
        return false;
      }
      
      console.log(`Executing optimization workflow: ${workflow.id}`);
      
      // Execute each action
      const actionResults = workflow.actions.map(action => this._executeAction(action));
      
      // Update workflow execution time
      workflow.lastExecutionTime = now;
      this.lastOptimizationTime = now;
      
      // Record optimization in history
      this.optimizationHistory.push({
        workflowId: workflow.id,
        timestamp: new Date(),
        trigger: triggerInfo,
        actions: workflow.actions,
        actionResults,
        feedbackMetrics: workflow.feedbackMetrics.map(metric => ({
          name: metric,
          valueBefore: this._getMetricValue(metric)
        }))
      });
      
      // Publish optimization event
      this.eventBus.publish('system:optimization', {
        workflowId: workflow.id,
        timestamp: new Date(),
        trigger: triggerInfo,
        actions: workflow.actions.length,
        priority: workflow.priority
      });
      
      return true;
    }
    
    /**
     * Execute a single optimization action
     */
    _executeAction(action) {
      console.log(`Executing optimization action: ${action.type} on ${action.target || 'system'}`);
      
      switch (action.type) {
        case 'agent-adjustment':
          return this._executeAgentAdjustment(action);
          
        case 'tool-adjustment':
          return this._executeToolAdjustment(action);
          
        case 'workflow-adjustment':
          return this._executeWorkflowAdjustment(action);
          
        case 'global-adjustment':
          return this._executeGlobalAdjustment(action);
          
        case 'resource-allocation':
          return this._executeResourceAllocation(action);
          
        case 'database-adjustment':
          return this._executeDatabaseAdjustment(action);
          
        default:
          console.error(`Unknown action type: ${action.type}`);
          return { status: 'error', message: `Unknown action type: ${action.type}` };
      }
    }
    
    /**
     * Execute agent parameter adjustment
     */
    _executeAgentAdjustment(action) {
      const targetAgent = this.deployedAgents.find(agent => agent.profile.id === action.target);
      
      if (!targetAgent) {
        return { status: 'error', message: `Agent not found: ${action.target}` };
      }
      
      try {
        // Determine the new value based on increment or direct value
        let newValue;
        
        if (action.increment !== undefined) {
          const currentValue = targetAgent.getParameter(action.param) || 0;
          newValue = currentValue + action.increment;
        } else {
          newValue = action.value;
        }
        
        // Apply the adjustment
        targetAgent.setParameter(action.param, newValue);
        
        return {
          status: 'success',
          agent: action.target,
          parameter: action.param,
          newValue: newValue
        };
      } catch (error) {
        return {
          status: 'error',
          message: `Error adjusting agent parameter: ${error.message}`,
          agent: action.target,
          parameter: action.param
        };
      }
    }
    
    /**
     * Execute tool parameter adjustment
     */
    _executeToolAdjustment(action) {
      // Find the agent that owns the tool
      const owningAgent = this.deployedAgents.find(agent => 
        agent.tools.some(tool => tool.id === action.target)
      );
      
      if (!owningAgent) {
        return { status: 'error', message: `Tool not found: ${action.target}` };
      }
      
      const tool = owningAgent.tools.find(tool => tool.id === action.target);
      
      try {
        // Determine the new value based on increment or direct value
        let adjustments = {};
        
        if (action.param) {
          if (action.increment !== undefined) {
            const currentValue = tool.parameters[action.param] || 0;
            adjustments[action.param] = currentValue + action.increment;
          } else {
            adjustments[action.param] = action.value;
          }
        } else if (action.parameters) {
          adjustments = action.parameters;
        }
        
        // Apply the adjustment
        tool.adjustParameters(adjustments);
        
        return {
          status: 'success',
          tool: action.target,
          parameters: adjustments,
          owningAgent: owningAgent.profile.id
        };
      } catch (error) {
        return {
          status: 'error',
          message: `Error adjusting tool parameter: ${error.message}`,
          tool: action.target
        };
      }
    }
    
    /**
     * Execute workflow adjustment
     */
    _executeWorkflowAdjustment(action) {
      // Find the workflow stage
      const stage = this.workflowConfiguration?.workflowStages.find(s => s.name === action.target);
      
      if (!stage) {
        return { status: 'error', message: `Workflow stage not found: ${action.target}` };
      }
      
      try {
        // Apply the adjustment
        if (action.param) {
          stage[action.param] = action.value;
        } else if (action.parameters) {
          Object.entries(action.parameters).forEach(([param, value]) => {
            stage[param] = value;
          });
        }
        
        // Notify the primary agent of workflow change
        const primaryAgent = this.deployedAgents.find(agent => agent.profile.id === stage.primaryAgent);
        if (primaryAgent) {
          primaryAgent.handleWorkflowUpdate({
            stage: action.target,
            parameters: action.parameters || { [action.param]: action.value }
          });
        }
        
        return {
          status: 'success',
          workflowStage: action.target,
          parameters: action.parameters || { [action.param]: action.value }
        };
      } catch (error) {
        return {
          status: 'error',
          message: `Error adjusting workflow: ${error.message}`,
          workflowStage: action.target
        };
      }
    }
    
    /**
     * Execute global system adjustment
     */
    _executeGlobalAdjustment(action) {
      try {
        // Apply the adjustment to system configuration
        if (action.param && this.systemConfiguration) {
          this.systemConfiguration[action.param] = action.value;
          
          // Broadcast configuration change to all agents
          this.eventBus.publish('system:configuration-updated', {
            parameter: action.param,
            value: action.value,
            timestamp: new Date()
          });
        }
        
        return {
          status: 'success',
          parameter: action.param,
          value: action.value
        };
      } catch (error) {
        return {
          status: 'error',
          message: `Error applying global adjustment: ${error.message}`,
          parameter: action.param
        };
      }
    }
    
    /**
     * Execute resource allocation adjustment
     */
    _executeResourceAllocation(action) {
      try {
        // Apply resource allocation change
        if (action.target) {
          // Target specific agent
          const targetAgent = this.deployedAgents.find(agent => agent.profile.id === action.target);
          
          if (!targetAgent) {
            return { status: 'error', message: `Agent not found: ${action.target}` };
          }
          
          targetAgent.adjustResourceAllocation({
            [action.param]: action.value
          });
          
          return {
            status: 'success',
            agent: action.target,
            parameter: action.param,
            value: action.value
          };
        } else {
          // Global resource allocation change
          this.eventBus.publish('system:resource-adjustment', {
            parameter: action.param,
            value: action.value,
            timestamp: new Date()
          });
          
          return {
            status: 'success',
            parameter: action.param,
            value: action.value,
            scope: 'global'
          };
        }
      } catch (error) {
        return {
          status: 'error',
          message: `Error adjusting resource allocation: ${error.message}`,
          parameter: action.param
        };
      }
    }
    
    /**
     * Execute database adjustment
     */
    _executeDatabaseAdjustment(action) {
      try {
        // Apply database configuration change
        if (this.masterDatabase) {
          if (action.param) {
            this.masterDatabase.updateConfiguration({
              [action.param]: action.value
            });
          } else if (action.parameters) {
            this.masterDatabase.updateConfiguration(action.parameters);
          }
        }
        
        return {
          status: 'success',
          parameters: action.parameters || { [action.param]: action.value }
        };
      } catch (error) {
        return {
          status: 'error',
          message: `Error adjusting database: ${error.message}`,
          parameters: action.parameters || { [action.param]: action.value }
        };
      }
    }
    
    /**
     * Manually trigger an optimization workflow
     */
    triggerOptimization(workflowId, options = {}) {
      const workflow = this.optimizationWorkflows.find(w => w.id === workflowId);
      
      if (!workflow) {
        return {
          status: 'error',
          message: `Workflow not found: ${workflowId}`
        };
      }
      
      const result = this._executeWorkflow(workflow, {
        trigger: 'manual',
        command: `optimize:${workflowId}`,
        options: options
      });
      
      return {
        status: result ? 'success' : 'skipped',
        workflowId: workflowId,
        timestamp: new Date(),
        message: result ? 
          'Optimization workflow executed successfully' : 
          'Workflow execution skipped (on cooldown)'
      };
    }
    
    /**
     * Get optimization metrics and history
     */
    getOptimizationMetrics() {
      const lastExecutions = {};
      
      this.optimizationWorkflows.forEach(workflow => {
        lastExecutions[workflow.id] = workflow.lastExecutionTime ?
          new Date(workflow.lastExecutionTime) : null;
      });
      
      const recentOptimizations = this.optimizationHistory
        .slice(-10) // Get the latest 10 optimizations
        .map(opt => ({
          workflowId: opt.workflowId,
          timestamp: opt.timestamp,
          trigger: opt.trigger.trigger,
          actionsExecuted: opt.actionResults.length,
          success: opt.actionResults.every(r => r.status === 'success')
        }));
      
      // Calculate optimization effectiveness by comparing metrics before and after
      const effectivenessData = this._calculateOptimizationEffectiveness();
      
      return {
        totalOptimizations: this.optimizationHistory.length,
        lastOptimizationTime: this.lastOptimizationTime ? new Date(this.lastOptimizationTime) : null,
        activeWorkflows: this.optimizationWorkflows.length,
        workflowLastExecutions: lastExecutions,
        recentOptimizations: recentOptimizations,
        optimizationEffectiveness: effectivenessData,
        timestamp: new Date()
      };
    }
    
    /**
     * Calculate optimization effectiveness by comparing metrics before and after
     */
    _calculateOptimizationEffectiveness() {
      const effectiveness = {};
      
      // Group optimizations by workflow
      const workflowOptimizations = {};
      
      this.optimizationHistory.forEach(opt => {
        if (!workflowOptimizations[opt.workflowId]) {
          workflowOptimizations[opt.workflowId] = [];
        }
        
        workflowOptimizations[opt.workflowId].push(opt);
      });
      
      // Calculate effectiveness for each workflow
      Object.entries(workflowOptimizations).forEach(([workflowId, optimizations]) => {
        // Skip if less than 2 optimizations (need before and after)
        if (optimizations.length < 2) {
          effectiveness[workflowId] = {
            status: 'insufficient-data',
            metricsTracked: optimizations[0]?.feedbackMetrics.map(m => m.name) || []
          };
          return;
        }
        
        // Calculate metric improvements
        const metricImprovements = {};
        
        // Get metrics from latest optimization
        const latestOpt = optimizations[optimizations.length - 1];
        
        latestOpt.feedbackMetrics.forEach(metric => {
          // For each metric, find the value before the previous optimization
          const previousOpt = optimizations[optimizations.length - 2];
          const previousMetric = previousOpt.feedbackMetrics.find(m => m.name === metric.name);
          
          if (previousMetric && previousMetric.valueBefore !== undefined) {
            const currentValue = this._getMetricValue(metric.name);
            const previousValue = previousMetric.valueBefore;
            
            // Calculate improvement
            const improvement = currentValue - previousValue;
            const percentageImprovement = (improvement / previousValue) * 100;
            
            metricImprovements[metric.name] = {
              before: previousValue,
              after: currentValue,
              improvement: improvement,
              percentageImprovement: percentageImprovement,
              positive: improvement > 0
            };
          }
        });
        
        // Calculate overall effectiveness
        const positiveImprovements = Object.values(metricImprovements)
          .filter(imp => imp.positive)
          .length;
        
        const totalMetrics = Object.keys(metricImprovements).length;
        
        const overallEffectiveness = totalMetrics > 0 ?
          positiveImprovements / totalMetrics : 0;
        
        effectiveness[workflowId] = {
          status: 'calculated',
          overallEffectiveness: overallEffectiveness,
          metricImprovements: metricImprovements,
          optimizationsAnalyzed: optimizations.length
        };
      });
      
      return effectiveness;
    }
    
    /**
     * Add a custom optimization workflow
     */
    addCustomWorkflow(workflowConfig) {
      // Validate workflow configuration
      if (!workflowConfig.id || !workflowConfig.name || !workflowConfig.actions) {
        return {
          status: 'error',
          message: 'Invalid workflow configuration: missing required fields (id, name, actions)'
        };
      }
      
      // Create and register the workflow
      const workflow = {
        id: workflowConfig.id,
        name: workflowConfig.name,
        description: workflowConfig.description || 'Custom optimization workflow',
        triggers: workflowConfig.triggers || [
          {
            type: 'manual',
            command: `optimize:${workflowConfig.id}`
          }
        ],
        actions: workflowConfig.actions,
        feedbackMetrics: workflowConfig.feedbackMetrics || [],
        adaptationCooldown: workflowConfig.cooldown || (24 * 60 * 60 * 1000), // Default 24 hours
        priority: workflowConfig.priority || 'medium'
      };
      
      // Add to workflow list
      this.optimizationWorkflows.push(workflow);
      
      // Register workflow triggers
      this._registerWorkflowTriggers(workflow);
      
      return {
        status: 'success',
        message: 'Custom workflow added successfully',
        workflowId: workflow.id
      };
    }
    
    /**
     * Create a specialized optimization workflow based on system needs
     */
    createSpecializedWorkflow(targetArea, severity = 'medium') {
      // Generate workflow based on target area
      let workflow;
      
      switch (targetArea) {
        case 'contactEngagement':
          workflow = {
            id: 'contact-engagement-optimization',
            name: 'Contact Engagement Enhancement',
            description: 'Improves contact engagement rates and relationship development',
            triggers: [
              {
                type: 'threshold',
                metric: 'contactEngagementRate',
                comparison: 'below',
                value: 0.3,
                checkInterval: 48 * 60 * 60 * 1000, // 48 hours
                consecutiveChecks: 2
              },
              {
                type: 'manual',
                command: 'optimize:contactEngagement'
              }
            ],
            actions: [
              { 
                type: 'agent-adjustment',
                target: 'contact-manager-agent',
                param: 'relationshipFocus',
                increment: 0.2
              },
              {
                type: 'tool-adjustment',
                target: 'relationship-tracker',
                param: 'engagementMetrics',
                value: true
              },
              {
                type: 'workflow-adjustment',
                target: 'communication-planning',
                param: 'relationshipFirstStrategy',
                value: true
              }
            ],
            feedbackMetrics: ['contactEngagementRate', 'relationshipDepth', 'responsiveness'],
            adaptationCooldown: 5 * 24 * 60 * 60 * 1000, // 5 days
            priority: severity
          };
          break;
          
        case 'conversionRate':
          workflow = {
            id: 'conversion-rate-optimization',
            name: 'Opportunity Conversion Enhancement',
            description: 'Improves the conversion rate of identified opportunities',
            triggers: [
              {
                type: 'threshold',
                metric: 'conversionRate',
                comparison: 'below',
                value: 0.1,
                checkInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
                consecutiveChecks: 2
              },
              {
                type: 'manual',
                command: 'optimize:conversionRate'
              }
            ],
            actions: [
              { 
                type: 'agent-adjustment',
                target: 'opportunity-analyzer-agent',
                param: 'valueQuantification',
                increment: 0.15
              },
              {
                type: 'tool-adjustment',
                target: 'value-modeler',
                param: 'roiProjection',
                value: 'enhanced'
              },
              {
                type: 'workflow-adjustment',
                target: 'opportunity-analysis',
                param: 'stakeholderMapping',
                value: true
              }
            ],
            feedbackMetrics: ['conversionRate', 'opportunityQuality', 'dealSize'],
            adaptationCooldown: 14 * 24 * 60 * 60 * 1000, // 14 days
            priority: severity
          };
          break;
          
        case 'dataDiscovery':
          workflow = {
            id: 'data-discovery-optimization',
            name: 'Business Intelligence Enhancement',
            description: 'Improves the discovery and collection of business intelligence',
            triggers: [
              {
                type: 'threshold',
                metric: 'dataDiscoveryRate',
                comparison: 'below',
                value: 50,
                checkInterval: 3 * 24 * 60 * 60 * 1000, // 3 days
                consecutiveChecks: 2
              },
              {
                type: 'manual',
                command: 'optimize:dataDiscovery'
              }
            ],
            actions: [
              { 
                type: 'agent-adjustment',
                target: 'researcher-agent',
                param: 'discoveryDepth',
                increment: 0.2
              },
              {
                type: 'tool-adjustment',
                target: 'industry-scanner',
                param: 'scanDepth',
                value: 'deep'
              },
              {
                type: 'workflow-adjustment',
                target: 'industry-research',
                param: 'comprehensiveSearch',
                value: true
              }
            ],
            feedbackMetrics: ['dataDiscoveryRate', 'dataQuality', 'companyCoverage'],
            adaptationCooldown: 4 * 24 * 60 * 60 * 1000, // 4 days
            priority: severity
          };
          break;
          
        default:
          return {
            status: 'error',
            message: `Unknown target area: ${targetArea}`
          };
      }
      
      // Add to workflow list
      this.optimizationWorkflows.push(workflow);
      
      // Register workflow triggers
      this._registerWorkflowTriggers(workflow);
      
      return {
        status: 'success',
        message: 'Specialized workflow created successfully',
        workflowId: workflow.id
      };
    }
    
    /**
     * Create optimizations based on agent performance metrics
     */
    generateOptimizationsFromMetrics() {
      const agentMetrics = this.deployedAgents.map(agent => ({
        agentId: agent.profile.id,
        metrics: agent.getPerformanceMetrics()
      }));
      
      const generatedOptimizations = [];
      
      // Identify underperforming aspects
      agentMetrics.forEach(agent => {
        // Check for low success rate
        if (agent.metrics.successRate < 0.7) {
          generatedOptimizations.push({
            type: 'agent-optimization',
            target: agent.agentId,
            issue: 'Low task success rate',
            severity: agent.metrics.successRate < 0.5 ? 'high' : 'medium',
            recommendedActions: [
              {
                type: 'agent-adjustment',
                target: agent.agentId,
                param: 'thoroughness',
                increment: 0.2
              },
              {
                type: 'tool-adjustment',
                target: this._getPrimaryToolForAgent(agent.agentId),
                param: 'validationLevel',
                value: 'enhanced'
              }
            ]
          });
        }
        
        // Check for high error rate
        if (agent.metrics.errorRate > 0.1) {
          generatedOptimizations.push({
            type: 'agent-optimization',
            target: agent.agentId,
            issue: 'High error rate',
            severity: agent.metrics.errorRate > 0.2 ? 'high' : 'medium',
            recommendedActions: [
              {
                type: 'agent-adjustment',
                target: agent.agentId,
                param: 'errorHandling',
                value: 'comprehensive'
              }
            ]
          });
        }
        
        // Check for slow processing
        if (agent.metrics.averageTaskCompletionTime > 60000) {
          generatedOptimizations.push({
            type: 'agent-optimization',
            target: agent.agentId,
            issue: 'Slow task processing',
            severity: agent.metrics.averageTaskCompletionTime > 120000 ? 'high' : 'medium',
            recommendedActions: [
              {
                type: 'resource-allocation',
                target: agent.agentId,
                param: 'processingPriority',
                value: 'high'
              }
            ]
          });
        }
      });
      
      return {
        generatedOptimizations,
        timestamp: new Date(),
        metricsAnalyzed: agentMetrics.length,
        optimizationCount: generatedOptimizations.length
      };
    }
    
    /**
     * Get primary tool for an agent
     */
    _getPrimaryToolForAgent(agentId) {
      const toolMap = {
        'researcher-agent': 'industry-scanner',
        'data-processor-agent': 'data-integrator',
        'contact-manager-agent': 'contact-extractor',
        'communications-agent': 'message-crafter',
        'opportunity-analyzer-agent': 'need-matcher'
      };
      
      return toolMap[agentId] || 'data-validator';
    }
    
    /**
     * Apply an optimization from recommendations
     */
    applyOptimization(optimizationId, recommendationData) {
      if (!recommendationData || !recommendationData.recommendedActions) {
        return {
          status: 'error',
          message: 'Invalid recommendation data'
        };
      }
      
      const actionResults = recommendationData.recommendedActions.map(action => 
        this._executeAction(action)
      );
      
      // Record in history
      this.optimizationHistory.push({
        workflowId: 'manual-optimization',
        timestamp: new Date(),
        trigger: {
          trigger: 'manual',
          optimizationId
        },
        actions: recommendationData.recommendedActions,
        actionResults,
        feedbackMetrics: []
      });
      
      return {
        status: 'success',
        message: 'Optimization applied successfully',
        optimizationId,
        actionsPerformed: actionResults.length,
        results: actionResults
      };
    }
  }
  
  // Export the OptimizationManager class for use by other modules
  module.exports = OptimizationManager;