# NeoGPT Mr. Smith

An intelligent agent system for business development and opportunity analysis, powered by specialized AI agents working in collaboration.

## Overview

NeoGPT Mr. Smith is a sophisticated system of specialized AI agents designed to assist in business development, market research, and opportunity analysis. The system employs multiple specialized agents working together to provide comprehensive business intelligence and actionable insights.

### Core Features

- **Specialized Agent System**: Multiple AI agents with specific roles and capabilities
- **Distributed Database**: Robust data storage and management system
- **Event-Driven Architecture**: Efficient communication between system components
- **Behavioral Matrix**: Configurable agent attributes and behaviors
- **Workflow Management**: Coordinated task execution and process management
- **API Integration**: RESTful and GraphQL APIs for system interaction

## System Architecture

### Core Components

1. **MrSmith.js**: Main system controller orchestrating all components
2. **Agent.js**: Base class for all specialized agents
3. **EventBus.js**: Event-driven communication system
4. **EnterpriseDatabase.js**: Distributed database implementation
5. **BehavioralMatrix.js**: Agent attribute configuration system

### Specialized Agents

1. **ResearcherAgent**: Industry research specialist
2. **DataProcessorAgent**: Data organization specialist
3. **ContactManagerAgent**: Contact management specialist
4. **CommunicationsAgent**: Personalized communication specialist
5. **OpportunityAnalyzerAgent**: Opportunity analysis specialist

### Tool Categories

1. **Research Tools**
   - IndustryScannerTool
   - WebsiteAnalyzerTool
   - SupplyChainMapperTool
   - DataValidatorTool

2. **Data Processing Tools**
   - DataIntegratorTool
   - PatternDetectorTool
   - KnowledgeGraphTool
   - DataClassifierTool

3. **Contact Management Tools**
   - ContactExtractorTool
   - OrgChartBuilderTool
   - RelationshipTrackerTool
   - ContactPrioritizerTool

4. **Communication Tools**
   - MessageCrafterTool
   - EngagementSequencerTool
   - PersonaAnalyzerTool
   - ResponseOptimizerTool

5. **Opportunity Analysis Tools**
   - NeedMatcherTool
   - TrendAnalyzerTool
   - ValueModelerTool
   - ConnectionSynthesizerTool

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/neogpt-mr-smith.git
cd neogpt-mr-smith
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize the database:
```bash
npm run db:init
```

## Usage

### Starting the System

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

## Configuration

The system can be configured through various configuration files:

- `config/agentProfiles.js`: Agent profile configurations
- `config/toolConfigurations.js`: Tool parameter configurations
- `config/workflowDefinitions.js`: Workflow stage definitions
- `config/industryTaxonomies.js`: Industry classification system

## API Documentation

### REST API

The system provides a RESTful API for external interaction:

- `GET /api/agents`: List all agents
- `GET /api/agents/:id`: Get agent details
- `POST /api/workflows`: Create new workflow
- `GET /api/workflows/:id`: Get workflow status
- `POST /api/tasks`: Create new task
- `GET /api/tasks/:id`: Get task status

### GraphQL API

A GraphQL API is also available for more complex queries:

```graphql
query {
  agents {
    id
    name
    type
    status
  }
  workflows {
    id
    status
    tasks {
      id
      status
    }
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to the open-source community for the tools and libraries used in this project 