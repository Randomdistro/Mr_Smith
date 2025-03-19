# Mr. Smith Agents & Teams Documentation

## Overview

Mr. Smith is a multi-agent system designed to handle a wide range of tasks across different domains. The system is composed of specialized agents that work independently or as coordinated teams to complete complex workflows.

## Core Agents

### Base Agents

1. **ResearcherAgent**
   - **Purpose**: Gather industry and company intelligence
   - **Capabilities**: Web scraping, information gathering, market trend analysis
   - **Key Methods**: `conductIndustryResearch()`, `conductCompanyResearch()`, `analyzeMarketTrends()`

2. **DataProcessorAgent**
   - **Purpose**: Process, enrich, and organize data
   - **Capabilities**: Data enrichment, organization, transformation, validation
   - **Key Methods**: `enrichData()`, `organizeData()`, `transformData()`, `validateData()`

3. **ContactManagerAgent**
   - **Purpose**: Manage contacts, meetings, and relationships
   - **Capabilities**: Contact creation, meeting scheduling and preparation
   - **Key Methods**: `createContact()`, `updateContact()`, `scheduleMeeting()`, `prepareMeeting()`

4. **CommunicationsAgent**
   - **Purpose**: Handle communications and content creation
   - **Capabilities**: Email drafting, response analysis, follow-up generation
   - **Key Methods**: `draftEmail()`, `analyzeResponse()`, `generateFollowup()`, `analyzeWebsite()`

5. **OpportunityAnalyzerAgent**
   - **Purpose**: Identify and score sales opportunities
   - **Capabilities**: Lead scoring, prioritization, market opportunity analysis
   - **Key Methods**: `scoreOpportunity()`, `prioritizeLeads()`, `analyzeMarketOpportunity()`, `analyzeResponseIntent()`

### Specialized Agents

6. **EngineerAgent**
   - **Purpose**: Handle technical engineering and design tasks
   - **Capabilities**: System design, technical specifications, feasibility analysis
   - **Key Methods**: `createSystemDesign()`, `createTechnicalSpecifications()`, `analyzeFeasibility()`, `selectMaterials()`

7. **MechanicAgent**
   - **Purpose**: Handle mechanical systems and repairs
   - **Capabilities**: Assembly instructions, diagnostics, maintenance scheduling
   - **Key Methods**: `performDiagnostics()`, `scheduleMaintenance()`, `createAssemblyInstructions()`, `troubleshootSystem()`

8. **DesignAgent**
   - **Purpose**: Create visual and product designs
   - **Capabilities**: Visual asset creation, UI design, product design
   - **Key Methods**: `createVisualAsset()`, `createUIDesign()`, `createProductDesign()`, `createStyleGuide()`

9. **CADAgent**
   - **Purpose**: Create and manage 2D and 3D models
   - **Capabilities**: 2D drawing creation, 3D model creation, technical drawings
   - **Key Methods**: `create2DDrawing()`, `create3DModel()`, `convertModel()`, `generateTechnicalDrawing()`

10. **PrintSliceAgent**
    - **Purpose**: Prepare 3D models for printing
    - **Capabilities**: Model slicing, print optimization, support generation
    - **Key Methods**: `sliceModel()`, `optimizePrint()`, `generateSupports()`, `createPrintJob()`

## Teams

Teams coordinate multiple agents to complete complex workflows that require different specialized skills.

### 1. Manufacturing Team

**Purpose**: End-to-end manufacturing design, from concept to production

**Agents Used**:
- EngineerAgent
- MechanicAgent
- DesignAgent
- CADAgent
- PrintSliceAgent

**Workflow**:
1. Design Concept Creation (DesignAgent)
2. Engineering Specifications (EngineerAgent)
3. CAD Modeling (CADAgent)
4. Assembly Instructions (MechanicAgent)
5. Prototype Preparation (PrintSliceAgent)

**Key Methods**:
- `handleCreateProject()`: Initiates a new manufacturing project
- `createWorkflow()`: Sets up the workflow for a project
- `executeWorkflowStep()`: Executes a specific step in the workflow

### 2. Robotailoring Team

**Purpose**: Create task-specific domestic and light commercial bespoke robots

**Agents Used**:
- EngineerAgent
- DesignAgent
- CADAgent
- MechanicAgent

**Workflow**:
1. Requirements Analysis (EngineerAgent)
2. Robot Design (DesignAgent)
3. Technical Specifications (EngineerAgent)
4. Mechanical Design (CADAgent)
5. Assembly Instructions (MechanicAgent)
6. Control System Design (EngineerAgent)

**Key Methods**:
- `handleCreateProject()`: Initiates a new robotailoring project
- `createWorkflow()`: Sets up the workflow for a project
- `_selectRobotComponents()`: Selects appropriate components for the robot

## Using Agents & Teams

Agents and teams can be accessed through the MrSmith main controller:

```javascript
// Get an agent
const researcherAgent = mrSmith.agents.get('ResearcherAgent');

// Get a team
const manufacturingTeam = mrSmith.teams.get('ManufacturingTeam');

// Start a workflow through the event system
mrSmith.eventBus.emit('project:manufacturing:create', {
  projectName: 'New Product',
  productType: 'consumer-electronics',
  requirements: {
    description: 'Compact smart device',
    constraints: { /* constraints */ }
  }
});

// Send task to an agent
const result = await researcherAgent.processTask({
  type: 'industry-research',
  parameters: {
    industryName: 'robotics',
    depth: 'comprehensive'
  }
});
```

## Extending the System

### Adding a New Agent

1. Create a new agent class that extends the base Agent class
2. Implement required methods: `initializeTools()` and `processTask()`
3. Register the agent in the MrSmith class

```javascript
class NewSpecializedAgent extends Agent {
  constructor(mrSmith, config = {}) {
    super(mrSmith, config);
    // Initialize agent-specific properties
  }

  async initializeTools() {
    // Initialize tools for this agent
  }

  async processTask(taskData) {
    const { type, parameters } = taskData;
    
    switch(type) {
      case 'some-task-type':
        return await this.someTaskMethod(parameters);
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  }
  
  async someTaskMethod(parameters) {
    // Implement task-specific logic
  }
}
```

### Adding a New Team

1. Create a new team class that coordinates multiple agents
2. Implement methods for handling events and executing workflows
3. Register the team in the MrSmith class

## Security & Compliance

All agents follow the system's ethical constraints and data retention policies as configured in the MrSmith instance. These can be customized when initializing the system. 