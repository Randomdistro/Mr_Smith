# Mr. Smith Agent Deployment Framework

A powerful framework for deploying specialized agents for business intelligence gathering, contact management, and relationship building within industry-specific contexts.

## System Architecture

The Mr. Smith system is built around a multi-agent architecture where each agent specializes in a specific domain of business intelligence and sales operations.

### Core Components

- **MrSmith**: Central controller that manages agents and orchestrates workflows
- **Agent**: Base class for all specialized agents
- **BaseTool**: Base class for all tools used by agents
- **EnterpriseDatabase**: Data storage and retrieval system
- **EventBus**: Communication system between agents and components
- **BehavioralMatrix**: Personality and behavior modeling system

### Specialized Agents

1. **ResearcherAgent**: Gathers industry and company intelligence
   - Web scraping
   - Search functionality
   - Data gathering
   
2. **DataProcessorAgent**: Processes, enriches, and organizes data
   - Data enrichment
   - Data organization
   - Data transformation
   - Data validation

3. **ContactManagerAgent**: Manages contacts, meetings, and relationships
   - Contact creation and management
   - Meeting scheduling
   - Meeting preparation
   - Relationship tracking

4. **CommunicationsAgent**: Handles email drafting and communication analysis
   - Email drafting
   - Response analysis
   - Follow-up generation
   - Website analysis

5. **OpportunityAnalyzerAgent**: Identifies and scores sales opportunities
   - Opportunity scoring
   - Lead prioritization
   - Market opportunity analysis
   - Response intent analysis

## Directory Structure

```
.
├── src/
│   ├── agents/                 # Specialized agent implementations
│   │   ├── ResearcherAgent.js
│   │   ├── DataProcessorAgent.js
│   │   ├── ContactManagerAgent.js
│   │   ├── CommunicationsAgent.js
│   │   └── OpportunityAnalyzerAgent.js
│   ├── core/                   # Core system components
│   │   ├── MrSmith.js          # Main system controller
│   │   ├── Agent.js            # Base agent class
│   │   ├── EnterpriseDatabase.js
│   │   ├── EventBus.js
│   │   └── BehavioralMatrix.js
│   ├── tools/                  # Tools used by agents
│   │   ├── BaseTool.js         # Base tool class
│   │   ├── research/           # Research tools
│   │   ├── data-processing/    # Data processing tools
│   │   ├── contact-management/ # Contact management tools
│   │   ├── communications/     # Communication tools
│   │   ├── opportunity-analysis/ # Opportunity analysis tools
│   │   └── data-enrichment/    # Data enrichment tools
│   ├── utils/                  # Utility functions
│   ├── workflow/               # Workflow definitions
│   ├── examples/               # Example usage
│   └── index.js                # Main entry point
├── data/                       # Data storage
├── logs/                       # Log files
├── tests/                      # Test files
└── config/                     # Configuration files
```

## Usage

```javascript
// Import the system
const mrSmithSystem = require('./src');

// Start a workflow
mrSmithSystem.mrSmith.eventBus.emit('workflow:start', {
  type: 'lead-generation',
  parameters: {
    industry: 'technology',
    region: 'North America',
    companySize: '50-200',
    productFit: 'high'
  }
});
```

## Available Commands

The system provides several npm commands for using the toolkit:

```bash
# Run company enrichment tool
npm run enrich
npm run enrich:mock   # Run with mock data (no API keys needed)
npm run enrich:real   # Run with real API data
npm run enrich:single # Look up individual companies

# Response analysis
npm run response
npm run response:template # Generate follow-up templates

# Opportunity scoring
npm run opportunity
npm run opportunity:create # Create sample prospect data

# Meeting management
npm run meeting
npm run meeting:create # Create sample client data
npm run meeting:brief  # Generate a meeting brief
npm run meeting:talking-points # Generate meeting talking points
```

## Extending the System

### Adding a New Agent

1. Create a new agent class that extends the base Agent class
2. Implement required methods: `initializeTools()` and `processTask()`
3. Register the agent in the MrSmith class

### Adding a New Tool

1. Create a new tool class that extends the BaseTool class
2. Implement required methods: `_initializeInternal()` and `_executeInternal()`
3. Register the tool with an agent in its `initializeTools()` method

## License

MIT 