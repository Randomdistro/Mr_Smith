/**
 * NeoGPT: Database Schema Module
 * Version: 3.7.0
 * 
 * Defines the comprehensive database schema for the Mr. Smith agent deployment framework.
 * This schema supports business intelligence gathering, contact management,
 * and opportunity identification across multiple industries.
 */

class DatabaseSchema {
    constructor() {
      // No initialization needed
    }
    
    /**
     * Initialize a comprehensive database schema for the agent network
     */
    initializeDatabaseSchema() {
      return {
        companies: this._defineCompaniesSchema(),
        contacts: this._defineContactsSchema(),
        communications: this._defineCommunicationsSchema(),
        opportunities: this._defineOpportunitiesSchema(),
        relationships: this._defineRelationshipsSchema(),
        events: this._defineEventsSchema(),
        industryTrends: this._defineIndustryTrendsSchema(),
        systemMetrics: this._defineSystemMetricsSchema()
      };
    }
    
    /**
     * Define companies table schema
     */
    _defineCompaniesSchema() {
      return {
        fields: [
          { name: 'id', type: 'string', primaryKey: true },
          { name: 'name', type: 'string', indexed: true },
          { name: 'website', type: 'string', indexed: true },
          { name: 'industry', type: 'string', indexed: true },
          { name: 'subIndustry', type: 'string', indexed: true },
          { name: 'description', type: 'text', indexed: true },
          { name: 'products', type: 'array', indexed: true },
          { name: 'services', type: 'array', indexed: true },
          { name: 'location', type: 'object', indexed: true },
          { name: 'additionalLocations', type: 'array', indexed: false },
          { name: 'founded', type: 'date', indexed: false },
          { name: 'employees', type: 'number', indexed: true },
          { name: 'revenue', type: 'number', indexed: true },
          { name: 'technologies', type: 'array', indexed: true },
          { name: 'suppliers', type: 'array', indexed: true },
          { name: 'customers', type: 'array', indexed: true },
          { name: 'competitors', type: 'array', indexed: true },
          { name: 'partners', type: 'array', indexed: true },
          { name: 'needs', type: 'array', indexed: true },
          { name: 'offerings', type: 'array', indexed: true },
          { name: 'team', type: 'array', indexed: false },
          { name: 'tags', type: 'array', indexed: true },
          { name: 'dataQuality', type: 'number', indexed: false },
          { name: 'lastUpdated', type: 'date', indexed: true }
        ],
        indices: [
          { name: 'industry_location', fields: ['industry', 'location.country'] },
          { name: 'revenue_employees', fields: ['revenue', 'employees'] },
          { name: 'offerings_needs', fields: ['offerings', 'needs'] }
        ]
      };
    }
    
    /**
     * Define contacts table schema
     */
    _defineContactsSchema() {
      return {
        fields: [
          { name: 'id', type: 'string', primaryKey: true },
          { name: 'firstName', type: 'string', indexed: true },
          { name: 'lastName', type: 'string', indexed: true },
          { name: 'email', type: 'string', indexed: true },
          { name: 'phone', type: 'string', indexed: false },
          { name: 'companyId', type: 'string', indexed: true, foreignKey: 'companies.id' },
          { name: 'title', type: 'string', indexed: true },
          { name: 'department', type: 'string', indexed: true },
          { name: 'seniority', type: 'string', indexed: true },
          { name: 'decisionMaker', type: 'boolean', indexed: true },
          { name: 'influencer', type: 'boolean', indexed: true },
          { name: 'persona', type: 'object', indexed: false },
          { name: 'communicationPreferences', type: 'object', indexed: false },
          { name: 'relationshipStatus', type: 'string', indexed: true },
          { name: 'engagementScore', type: 'number', indexed: true },
          { name: 'lastInteraction', type: 'date', indexed: true },
          { name: 'social', type: 'object', indexed: false },
          { name: 'notes', type: 'text', indexed: false },
          { name: 'tags', type: 'array', indexed: true },
          { name: 'dataQuality', type: 'number', indexed: false },
          { name: 'lastUpdated', type: 'date', indexed: true }
        ],
        indices: [
          { name: 'company_role', fields: ['companyId', 'title'] },
          { name: 'engagement_decision', fields: ['engagementScore', 'decisionMaker'] }
        ]
      };
    }
    
    /**
     * Define communications table schema
     */
    _defineCommunicationsSchema() {
      return {
        fields: [
          { name: 'id', type: 'string', primaryKey: true },
          { name: 'contactId', type: 'string', indexed: true, foreignKey: 'contacts.id' },
          { name: 'companyId', type: 'string', indexed: true, foreignKey: 'companies.id' },
          { name: 'type', type: 'string', indexed: true },
          { name: 'direction', type: 'string', indexed: true },
          { name: 'subject', type: 'string', indexed: true },
          { name: 'content', type: 'text', indexed: true },
          { name: 'sentAt', type: 'date', indexed: true },
          { name: 'receivedAt', type: 'date', indexed: true },
          { name: 'status', type: 'string', indexed: true },
          { name: 'response', type: 'text', indexed: true },
          { name: 'responseAt', type: 'date', indexed: true },
          { name: 'sentimentScore', type: 'number', indexed: true },
          { name: 'intentScore', type: 'object', indexed: false },
          { name: 'nextSteps', type: 'array', indexed: false },
          { name: 'sequenceId', type: 'string', indexed: true },
          { name: 'tags', type: 'array', indexed: true },
          { name: 'metadata', type: 'object', indexed: false },
          { name: 'lastUpdated', type: 'date', indexed: true }
        ],
        indices: [
          { name: 'contact_sent', fields: ['contactId', 'sentAt'] },
          { name: 'response_sentiment', fields: ['responseAt', 'sentimentScore'] }
        ]
      };
    }
    
    /**
     * Define opportunities table schema
     */
    _defineOpportunitiesSchema() {
      return {
        fields: [
          { name: 'id', type: 'string', primaryKey: true },
          { name: 'companyId', type: 'string', indexed: true, foreignKey: 'companies.id' },
          { name: 'primaryContactId', type: 'string', indexed: true, foreignKey: 'contacts.id' },
          { name: 'additionalContactIds', type: 'array', indexed: false },
          { name: 'type', type: 'string', indexed: true },
          { name: 'status', type: 'string', indexed: true },
          { name: 'title', type: 'string', indexed: true },
          { name: 'description', type: 'text', indexed: true },
          { name: 'needsFulfilled', type: 'array', indexed: true },
          { name: 'offeringsUtilized', type: 'array', indexed: true },
          { name: 'estimatedValue', type: 'number', indexed: true },
          { name: 'probability', type: 'number', indexed: true },
          { name: 'discoveredAt', type: 'date', indexed: true },
          { name: 'lastUpdated', type: 'date', indexed: true },
          { name: 'nextAction', type: 'object', indexed: false },
          { name: 'tags', type: 'array', indexed: true },
          { name: 'dataPoints', type: 'array', indexed: false },
          { name: 'metadata', type: 'object', indexed: false }
        ],
        indices: [
          { name: 'value_probability', fields: ['estimatedValue', 'probability'] },
          { name: 'company_status', fields: ['companyId', 'status'] }
        ]
      };
    }
    
    /**
     * Define relationships table schema
     */
    _defineRelationshipsSchema() {
      return {
        fields: [
          { name: 'id', type: 'string', primaryKey: true },
          { name: 'sourceCompanyId', type: 'string', indexed: true, foreignKey: 'companies.id' },
          { name: 'targetCompanyId', type: 'string', indexed: true, foreignKey: 'companies.id' },
          { name: 'type', type: 'string', indexed: true },
          { name: 'strength', type: 'number', indexed: true },
          { name: 'description', type: 'text', indexed: false },
          { name: 'established', type: 'date', indexed: true },
          { name: 'lastVerified', type: 'date', indexed: true },
          { name: 'dataPoints', type: 'array', indexed: false },
          { name: 'confidenceScore', type: 'number', indexed: true },
          { name: 'tags', type: 'array', indexed: true },
          { name: 'metadata', type: 'object', indexed: false },
          { name: 'lastUpdated', type: 'date', indexed: true }
        ],
        indices: [
          { name: 'relationship_type', fields: ['sourceCompanyId', 'targetCompanyId', 'type'] },
          { name: 'relationship_strength', fields: ['type', 'strength'] }
        ]
      };
    }
    
    /**
     * Define events table schema
     */
    _defineEventsSchema() {
      return {
        fields: [
          { name: 'id', type: 'string', primaryKey: true },
          { name: 'type', type: 'string', indexed: true },
          { name: 'companyId', type: 'string', indexed: true, foreignKey: 'companies.id' },
          { name: 'contactId', type: 'string', indexed: true, foreignKey: 'contacts.id' },
          { name: 'timestamp', type: 'date', indexed: true },
          { name: 'description', type: 'text', indexed: true },
          { name: 'importance', type: 'number', indexed: true },
          { name: 'source', type: 'string', indexed: true },
          { name: 'relatedEvents', type: 'array', indexed: false },
          { name: 'metadata', type: 'object', indexed: false },
          { name: 'tags', type: 'array', indexed: true }
        ],
        indices: [
          { name: 'event_timeline', fields: ['companyId', 'timestamp'] },
          { name: 'event_importance', fields: ['type', 'importance'] }
        ]
      };
    }
    
    /**
     * Define industry trends table schema
     */
    _defineIndustryTrendsSchema() {
      return {
        fields: [
          { name: 'id', type: 'string', primaryKey: true },
          { name: 'industry', type: 'string', indexed: true },
          { name: 'subIndustry', type: 'string', indexed: true },
          { name: 'name', type: 'string', indexed: true },
          { name: 'description', type: 'text', indexed: true },
          { name: 'strength', type: 'number', indexed: true },
          { name: 'timeframe', type: 'string', indexed: true },
          { name: 'impactAreas', type: 'array', indexed: true },
          { name: 'affectedCompanies', type: 'array', indexed: false },
          { name: 'relatedTrends', type: 'array', indexed: false },
          { name: 'sources', type: 'array', indexed: false },
          { name: 'confidenceScore', type: 'number', indexed: true },
          { name: 'discoveredAt', type: 'date', indexed: true },
          { name: 'lastUpdated', type: 'date', indexed: true }
        ],
        indices: [
          { name: 'trend_industry', fields: ['industry', 'strength'] },
          { name: 'trend_timeframe', fields: ['timeframe', 'strength'] }
        ]
      };
    }
    
    /**
     * Define system metrics table schema
     */
    _defineSystemMetricsSchema() {
      return {
        fields: [
          { name: 'id', type: 'string', primaryKey: true },
          { name: 'timestamp', type: 'date', indexed: true },
          { name: 'metricType', type: 'string', indexed: true },
          { name: 'agentId', type: 'string', indexed: true },
          { name: 'value', type: 'number', indexed: true },
          { name: 'context', type: 'object', indexed: false },
          { name: 'metadata', type: 'object', indexed: false }
        ],
        indices: [
          { name: 'metric_timeline', fields: ['metricType', 'timestamp'] },
          { name: 'agent_performance', fields: ['agentId', 'metricType'] }
        ]
      };
    }
    
    /**
     * Create a custom schema with additional fields
     */
    createCustomSchema(customFields = {}) {
      const baseSchema = this.initializeDatabaseSchema();
      const customSchema = JSON.parse(JSON.stringify(baseSchema)); // Deep copy
      
      // Apply custom fields to each table
      Object.entries(customFields).forEach(([tableName, fields]) => {
        if (customSchema[tableName]) {
          // Add each custom field
          fields.forEach(field => {
            // Check if field already exists
            const existingFieldIndex = customSchema[tableName].fields.findIndex(f => f.name === field.name);
            
            if (existingFieldIndex >= 0) {
              // Update existing field
              customSchema[tableName].fields[existingFieldIndex] = { 
                ...customSchema[tableName].fields[existingFieldIndex], 
                ...field 
              };
            } else {
              // Add new field
              customSchema[tableName].fields.push(field);
            }
          });
        }
      });
      
      return customSchema;
    }
    
    /**
     * Customize schema for specific industry
     */
    customizeForIndustry(industry) {
      const baseSchema = this.initializeDatabaseSchema();
      
      switch (industry.toLowerCase()) {
        case 'technology':
          return this._customizeForTechnology(baseSchema);
        case 'healthcare':
          return this._customizeForHealthcare(baseSchema);
        case 'manufacturing':
          return this._customizeForManufacturing(baseSchema);
        case 'finance':
          return this._customizeForFinance(baseSchema);
        case 'retail':
          return this._customizeForRetail(baseSchema);
        default:
          return baseSchema;
      }
    }
    
    /**
     * Customize schema for technology industry
     */
    _customizeForTechnology(schema) {
      // Add technology-specific fields to companies
      schema.companies.fields.push(
        { name: 'techStack', type: 'array', indexed: true },
        { name: 'developmentMethodology', type: 'string', indexed: false },
        { name: 'apiAvailability', type: 'boolean', indexed: true },
        { name: 'softwareCategories', type: 'array', indexed: true },
        { name: 'integrations', type: 'array', indexed: false }
      );
      
      // Add tech-specific metrics to opportunities
      schema.opportunities.fields.push(
        { name: 'implementationComplexity', type: 'number', indexed: true },
        { name: 'technicalRequirements', type: 'array', indexed: false }
      );
      
      // Add tech industry trends
      schema.industryTrends.fields.push(
        { name: 'techCategory', type: 'string', indexed: true },
        { name: 'adoptionPhase', type: 'string', indexed: true }
      );
      
      return schema;
    }
    
    /**
     * Customize schema for healthcare industry
     */
    _customizeForHealthcare(schema) {
      // Add healthcare-specific fields to companies
      schema.companies.fields.push(
        { name: 'facilitiesCount', type: 'number', indexed: false },
        { name: 'specialties', type: 'array', indexed: true },
        { name: 'accreditations', type: 'array', indexed: true },
        { name: 'regulatoryCompliance', type: 'object', indexed: false },
        { name: 'patientVolume', type: 'number', indexed: true }
      );
      
      // Add healthcare-specific fields to opportunities
      schema.opportunities.fields.push(
        { name: 'regulatoryImpact', type: 'object', indexed: false },
        { name: 'clinicalValue', type: 'number', indexed: true }
      );
      
      return schema;
    }
    
    /**
     * Customize schema for manufacturing industry
     */
    _customizeForManufacturing(schema) {
      // Add manufacturing-specific fields to companies
      schema.companies.fields.push(
        { name: 'manufacturingCapacity', type: 'number', indexed: false },
        { name: 'facilities', type: 'array', indexed: false },
        { name: 'certifications', type: 'array', indexed: true },
        { name: 'supplyChain', type: 'object', indexed: false },
        { name: 'rawMaterials', type: 'array', indexed: true }
      );
      
      // Add manufacturing-specific relationships
      schema.relationships.fields.push(
        { name: 'supplyChainPosition', type: 'string', indexed: true },
        { name: 'capacityUtilization', type: 'number', indexed: false }
      );
      
      return schema;
    }
    
    /**
     * Customize schema for finance industry
     */
    _customizeForFinance(schema) {
      // Add finance-specific fields to companies
      schema.companies.fields.push(
        { name: 'regulatoryStatus', type: 'object', indexed: false },
        { name: 'assetsUnderManagement', type: 'number', indexed: true },
        { name: 'financialProducts', type: 'array', indexed: true },
        { name: 'marketSegments', type: 'array', indexed: true },
        { name: 'complianceFrameworks', type: 'array', indexed: false }
      );
      
      // Add finance-specific opportunities
      schema.opportunities.fields.push(
        { name: 'regulatoryConsiderations', type: 'object', indexed: false },
        { name: 'financialImpact', type: 'object', indexed: false },
        { name: 'riskAssessment', type: 'object', indexed: true }
      );
      
      return schema;
    }
    
    /**
     * Customize schema for retail industry
     */
    _customizeForRetail(schema) {
      // Add retail-specific fields to companies
      schema.companies.fields.push(
        { name: 'storeCount', type: 'number', indexed: true },
        { name: 'channels', type: 'array', indexed: true },
        { name: 'productCategories', type: 'array', indexed: true },
        { name: 'seasonality', type: 'object', indexed: false },
        { name: 'targetDemographic', type: 'array', indexed: true }
      );
      
      // Add retail-specific opportunities
      schema.opportunities.fields.push(
        { name: 'salesVelocity', type: 'number', indexed: true },
        { name: 'marketingSupport', type: 'object', indexed: false },
        { name: 'channelStrategy', type: 'string', indexed: true }
      );
      
      return schema;
    }
    
    /**
     * Generate SQL schema creation statements
     */
    generateSQLSchema(schema = null) {
      const dbSchema = schema || this.initializeDatabaseSchema();
      let sqlStatements = '';
      
      // Generate CREATE TABLE statements for each table
      Object.entries(dbSchema).forEach(([tableName, tableSchema]) => {
        sqlStatements += `CREATE TABLE ${tableName} (\n`;
        
        // Add fields
        const fieldDefinitions = tableSchema.fields.map(field => {
          let definition = `  ${field.name} `;
          
          // Map type to SQL
          switch (field.type) {
            case 'string':
              definition += 'VARCHAR(255)';
              break;
            case 'text':
              definition += 'TEXT';
              break;
            case 'number':
              definition += 'NUMERIC';
              break;
            case 'boolean':
              definition += 'BOOLEAN';
              break;
            case 'date':
              definition += 'TIMESTAMP';
              break;
            case 'object':
            case 'array':
              definition += 'JSONB';
              break;
            default:
              definition += 'VARCHAR(255)';
          }
          
          // Add constraints
          if (field.primaryKey) {
            definition += ' PRIMARY KEY';
          }
          if (field.foreignKey) {
            const [refTable, refField] = field.foreignKey.split('.');
            definition += ` REFERENCES ${refTable}(${refField})`;
          }
          
          return definition;
        });
        
        sqlStatements += fieldDefinitions.join(',\n') + '\n);\n\n';
        
        // Add indices
        if (tableSchema.indices) {
          tableSchema.indices.forEach(index => {
            const indexFields = index.fields.join(', ');
            sqlStatements += `CREATE INDEX idx_${tableName}_${index.name} ON ${tableName}(${indexFields});\n`;
          });
        }
        
        // Add individual field indices
        tableSchema.fields.forEach(field => {
          if (field.indexed && !field.primaryKey) {
            sqlStatements += `CREATE INDEX idx_${tableName}_${field.name} ON ${tableName}(${field.name});\n`;
          }
        });
        
        sqlStatements += '\n';
      });
      
      return sqlStatements;
    }
  }
  
  // Export the DatabaseSchema class for use by other modules
  module.exports = DatabaseSchema;