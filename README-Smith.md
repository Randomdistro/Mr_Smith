# The Smith - Agent Creation and Management System

## Overview

The Smith is a sophisticated agent creation and management system within the Trinity Node architecture of the NeoGPT framework. It serves as the execution layer that brings agent designs to life, specializing in deploying humanized, purpose-built AI agents for a wide range of applications.

As part of the Trinity Node, The Smith works in concert with:
- **The Architect** - Designs what could be done (possibility)
- **The Oracle** - Determines what should be done (ethics)
- **The Smith** - Implements what will be done (execution)

## Key Features

### Agent Creation and Management

- **Multi-role Sprites**: Create specialized agents for diverse roles such as business consultants, technical experts, creative designers, and more
- **Template-based Creation**: Leverage pre-built agent templates for rapid deployment
- **Lifecycle Management**: Monitor, update, and manage the full lifecycle of deployed agents
- **Event-based Architecture**: React to state changes and system events efficiently

### Humanization Engine

- **Personality Traits**: Apply human-like personality traits to agents, with customizable intensity levels
- **Persona Templates**: Choose from pre-built personas or create custom ones to define agent behavior patterns
- **Expression Models**: Customize how agents communicate based on context and personality
- **Communication Styles**: Adjust formality, directness, and other communication parameters

### Comprehensive Behavioral Matrix Framework

The Smith now incorporates a sophisticated Behavioral Matrix Framework for deep agent customization:

- **Psychological Profiling**: Comprehensive psychological framework based on established models
- **Attribute Categories**: 9 distinct categories with over 40 specific attributes
- **1-100 Scale**: Precise quantification of each attribute for fine-tuned customization
- **Role Optimization**: Automatically configure attributes based on role requirements
- **Template System**: Save and reuse attribute configurations for consistent agent creation

The Behavioral Matrix includes these attribute categories:

1. **Core Personality Dimensions** (Big Five model)
2. **Cognitive Abilities** (Analytical, Creative, Practical, Emotional)
3. **Value Systems** (based on Schwartz's Theory of Basic Human Values)
4. **Behavioral Tendencies** (Assertiveness, Risk-taking, etc.)
5. **Social Dynamics** (Leadership, Teamwork, etc.)
6. **Ethical Framework** (based on moral foundations theory)
7. **Stress Response** (Tolerance, Coping mechanisms)
8. **Goal Orientation** (Short/Long-term focus, Achievement drive)
9. **Adaptive Learning** (Learning speed, Memory retention, etc.)

### API-Driven Architecture

The Smith now provides a lightweight, injectable API for seamless integration:

- **RESTful Interface**: Create and manage agents via simple HTTP requests
- **Role-based Creation**: Generate agents optimized for specific roles with a single API call
- **Attribute Customization**: Fine-tune agent attributes through the API
- **Template Management**: Create and manage attribute templates programmatically
- **Role Analysis**: Analyze requirements to suggest optimal attribute configurations

### Robust Framework Architecture

The refactored Smith framework provides a solid foundation for development:

- **Centralized Configuration**: Unified configuration system with environment-specific settings
- **Comprehensive Error Handling**: Structured error handling with detailed error types
- **Event-driven Design**: Event system for robust communication between components
- **Extensible Agent Types**: Easily create custom agent types with specialized capabilities
- **Dependency Injection**: Flexible component system with dependency injection

### Business Capabilities (Example)

The included Business Agent demonstrates practical applications:
- **Client Management**: Store and analyze client information
- **Proposal Generation**: Create customized business proposals
- **Email Communication**: Generate personalized, human-like email correspondence
- **Business Analysis**: Conduct opportunity and risk analysis for clients

## System Architecture

The Smith is built on an event-driven architecture with several key components:

1. **Core Smith Controller**: Manages agent creation, approval workflow, and lifecycle
2. **Agent Templates**: Extensible base classes for various agent types
3. **Humanization Engine**: Provides personality and communication capabilities
4. **Attribute Management System**: Handles the comprehensive Behavioral Matrix Framework
5. **API Layer**: Provides injectable endpoints for agent customization
6. **Configuration Manager**: Centralizes configuration with environment-specific settings
7. **Error Handler**: Provides structured error handling and reporting
8. **Telemetry System**: Captures signals for off-site machine learning
9. **Data Storage**: Maintains agent states, templates, and operational data

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/neogpt-trinity-node.git

# Navigate to project directory
cd neogpt-trinity-node

# Install dependencies
npm install
```

### Basic Usage

```javascript
const Smith = require('./src/trinity/smith/Smith');
const HumanizationEngine = require('./src/trinity/smith/tools/HumanizationEngine');
const AttributeManager = require('./src/trinity/smith/tools/AttributeManager');

// Initialize The Smith
const smith = new Smith();
await smith.initialize();

// Initialize the Attribute Manager
const attributeManager = new AttributeManager();
await attributeManager.initialize();

// Create a business agent
const agentResult = await smith.createAgent({
  id: 'business_agent_1',
  type: 'BusinessAgent',
  parameters: {
    industry: 'Technology Consulting',
    seniorityLevel: 8,
    specializations: ['Digital Transformation', 'Cloud Migration']
  },
  approved: true
});

// Access the created agent
const agent = agentResult.agent;

// Apply custom attributes
await attributeManager.applyAttributes(agent, {
  corePersonality: {
    openness: 65,
    conscientiousness: 85,
    extraversion: 70,
    agreeableness: 75,
    neuroticism: 30
  },
  cognitiveAbilities: {
    analyticalIntelligence: 85,
    creativeIntelligence: 70,
    practicalIntelligence: 80,
    emotionalIntelligence: 75
  }
  // Other attribute categories...
});

// Use the agent
const client = await agent.updateClient({
  name: 'Acme Corporation',
  industry: 'Manufacturing'
});

const proposal = await agent.generateProposal({
  clientId: client.id,
  title: 'Digital Transformation Strategy'
});

console.log('Proposal generated:', proposal.summary);
```

## Using the API

You can interact with The Smith through its RESTful API:

```javascript
const { SmithAPIClient } = require('./src/trinity/smith/examples/api_client');

// Create API client
const client = new SmithAPIClient({
  baseUrl: 'http://localhost:3000/api/smith'
});

// Create an agent optimized for a specific role
const result = await client.createAgentForRole({
  type: 'BusinessAgent',
  parameters: {
    industry: 'Technology Consulting',
    seniorityLevel: 8
  },
  role: 'businessConsultant',
  // Optional attribute overrides
  attributeOverrides: {
    'corePersonality.extraversion': 80
  }
});

// Use the created agent through additional API calls
const agentId = result.agentId;
```

## Using the Refactored Framework

The refactored Smith framework provides improved error handling, configuration management, and extensibility:

```javascript
const Smith = require('./src/trinity/smith/Smith');
const { ConfigManager } = require('./src/trinity/smith/utils/ConfigManager');
const { ErrorHandler } = require('./src/trinity/smith/utils/ErrorHandler');

// Create custom error handler
const errorHandler = new ErrorHandler({
  enableConsoleLogging: true,
  logLevel: 'info',
  enableTelemetry: false
});

// Create custom configuration manager
const configManager = new ConfigManager({
  environment: process.env.NODE_ENV || 'development', 
  errorHandler
});

// Load configuration
await configManager.load();

// Initialize Smith with custom components
const smith = new Smith({
  errorHandler,
  configManager,
  includeErrorDetails: process.env.NODE_ENV === 'development'
});

await smith.initialize();

// Create an agent with proper error handling
try {
  const result = await smith.createAgent({
    type: 'BusinessAgent',
    parameters: {
      industry: 'Technology',
      seniorityLevel: 7
    },
    approved: true
  });
  
  if (result.status === 'success') {
    console.log(`Agent created: ${result.agentId}`);
    const agent = result.agent;
    // Use the agent...
  } else {
    console.error(`Failed to create agent: ${result.message}`);
  }
} catch (error) {
  console.error('Error creating agent:', error.message);
}

// Graceful shutdown
await smith.shutdown();
```

## Humanizing Agents

```javascript
// Initialize Humanization Engine
const humanizationEngine = new HumanizationEngine();
await humanizationEngine.initialize();

// Apply humanization to agent
const humanizationResult = await humanizationEngine.humanizeAgent(agent, {
  personaType: 'business',
  traitNames: ['conscientiousness', 'confidence', 'agreeableness'],
  distinctiveness: 0.7
});

console.log('Applied persona:', humanizationResult.appliedPersona);
console.log('Applied traits:', humanizationResult.appliedTraits);

// Generate a follow-up email with humanized content
const email = await agent.generateFollowUpEmail(client.id, {
  type: 'proposal',
  subject: 'Your Digital Transformation Strategy'
});

console.log('Email content:', email.content);
```

## Agent Templates

The Smith includes several agent templates that can be extended and customized:

- **BusinessAgent**: For sales, marketing, and business operations
- **TechnicalAgent**: For technical domains, programming, and system integration
- **CreativeAgent**: For content creation, design, and creative tasks
- **EducationAgent**: For tutoring, training, and educational content
- **CustomerServiceAgent**: For support and customer service

## Running the Demonstrations

To see The Smith in action, run the demonstration scripts:

```bash
# Run the basic agent creation demo
node src/trinity/smith/examples/create_business_agent.js

# Run the API client demo
node src/trinity/smith/examples/api_client.js

# Run the refactored framework demo
node src/trinity/smith/examples/refactored_usage.js
```

## Extending The Smith

### Creating a Custom Agent Type

1. Create a new agent class that extends BaseAgent
2. Implement the required methods (especially _processTask)
3. Register your template in templates.json

Example:

```javascript
const BaseAgent = require('./BaseAgent');

class MyCustomAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    // Initialize your custom properties
    
    // Define agent metadata
    this.agentType = 'MyCustomAgent';
    this.capabilities = ['customCapability1', 'customCapability2'];
  }
  
  async _processTask(task) {
    // Implement your task processing logic based on task type
    switch (task.type) {
      case 'customCapability1':
        return this._handleCapability1(task.data);
      case 'customCapability2':
        return this._handleCapability2(task.data);
      default:
        return super._processTask(task);
    }
  }
  
  // Add custom methods
  async _handleCapability1(data) {
    // Your implementation
    return { success: true, result: 'Processed capability 1' };
  }
  
  async _handleCapability2(data) {
    // Your implementation
    return { success: true, result: 'Processed capability 2' };
  }
}

module.exports = MyCustomAgent;
```

### Handling Errors Properly

The framework provides a robust error handling system:

```javascript
const { defaultErrorHandler, AgentError } = require('./utils/ErrorHandler');

// In your agent implementation
async function performTask(task) {
  try {
    // Your task logic here
    
    if (!task.data.requiredProperty) {
      throw new AgentError('Missing required property', { task });
    }
    
    return { success: true, result: 'Task completed' };
  } catch (error) {
    // Convert to AgentError if not already
    const agentError = error instanceof AgentError 
      ? error 
      : new AgentError(`Task failed: ${error.message}`, {
          task,
          originalError: error.message
        });
    
    // Log and handle the error
    defaultErrorHandler.handleError(agentError);
    
    return {
      success: false,
      error: agentError.message
    };
  }
}
```

### Creating Custom Attribute Templates

You can create custom attribute templates for specific roles:

```javascript
const attributeManager = new AttributeManager();
await attributeManager.initialize();

// Create a new attribute template
await attributeManager.createAttributeTemplate(
  'SalesSpecialist',
  'Optimized for sales roles requiring persuasion and relationship building',
  {
    corePersonality: {
      extraversion: 85,
      agreeableness: 80,
      conscientiousness: 75,
      openness: 65,
      neuroticism: 30
    },
    // Other attributes...
  }
);

// Apply the template to an agent
const template = attributeManager.getAttributeTemplate('SalesSpecialist');
await attributeManager.applyAttributes(agent, template.attributes);
```

## Configuration Reference

The Smith framework uses a centralized configuration system with these key sections:

```javascript
{
  "smith": {
    "dataPath": "./data",
    "storagePath": "./storage",
    "logging": {
      "enabled": true,
      "level": "info"
    },
    "telemetry": {
      "enabled": false,
      "endpoint": null
    },
    "security": {
      "requireApproval": true,
      "allowAnonymousAgents": false
    }
  },
  "api": {
    "enabled": true,
    "port": 3000,
    "host": "localhost",
    "prefix": "/api/smith",
    "cors": {
      "enabled": true,
      "allowedOrigins": ["*"]
    }
  },
  "agents": {
    "defaultType": "GenericAgent",
    "idPrefix": "agent_",
    "maxPerUser": 10
  },
  "attributes": {
    "validateOnApply": true,
    "normalizeValues": true,
    "defaultTemplate": "balanced"
  }
}
```

## Limitations and Future Work

- Currently operates independently of The Architect and The Oracle in demonstration mode
- Full Trinity Node integration in development
- Advanced humanization features planned for future releases
- Expanded agent template library in progress
- Machine learning for dynamic attribute optimization based on performance feedback

## License

MIT

## Acknowledgments

The Smith is part of the broader NeoGPT framework, which combines advanced AI capabilities with responsible design principles to create autonomous agent systems with ethical boundaries. 