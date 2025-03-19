import React, { useState, useEffect } from 'react';
import { Search, Save, RefreshCw, Zap, FileText, User } from 'lucide-react';

const AgentCustomizationInterface = () => {
  // Custom Slider component
  const Slider = ({ value, min, max, step, onValueChange, className }) => {
    return (
      <div className={`w-full ${className}`}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => onValueChange([parseInt(e.target.value)])}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    );
  };

  // Custom Button component
  const Button = ({ children, onClick, className, variant = "primary", size = "md" }) => {
    const variantClasses = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
    };
    
    const sizeClasses = {
      sm: "py-1 px-3 text-sm",
      md: "py-2 px-4",
      lg: "py-3 px-6 text-lg",
    };
    
    return (
      <button
        onClick={onClick}
        className={`rounded-md font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      >
        {children}
      </button>
    );
  };

  // Custom Input component
  const CustomInput = ({ type, value, onChange, placeholder, className, icon }) => {
    return (
      <div className={`relative ${className}`}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
        {icon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {icon}
          </div>
        )}
      </div>
    );
  };

  // Custom Card component
  const Card = ({ children, className }) => {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        {children}
      </div>
    );
  };

  // Custom Select component
  const CustomSelect = ({ value, onValueChange, className, children }) => {
    return (
      <div className={`relative ${className}`}>
        <select
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none"
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    );
  };

  // State for agent attributes
  const [attributes, setAttributes] = useState({
    personalityDimensions: {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50
    },
    cognitiveAbilities: {
      analyticalIntelligence: 50,
      creativeIntelligence: 50,
      practicalIntelligence: 50,
      emotionalIntelligence: 50
    },
    valueSystems: {
      selfDirection: 50,
      stimulation: 50,
      hedonism: 50,
      achievement: 50,
      power: 50,
      security: 50,
      conformity: 50,
      tradition: 50,
      benevolence: 50,
      universalism: 50
    },
    behavioralTendencies: {
      assertiveness: 50,
      riskTaking: 50,
      adaptability: 50,
      empathy: 50,
      decisionMakingSpeed: 50
    },
    socialDynamics: {
      leadershipPotential: 50,
      teamworkAbility: 50,
      conflictResolution: 50,
      persuasiveness: 50
    },
    ethicalFramework: {
      careHarm: 50,
      fairnessCheating: 50,
      loyaltyBetrayal: 50,
      authoritySubversion: 50,
      sanctityDegradation: 50,
      libertyOppression: 50
    },
    stressResponse: {
      stressTolerance: 50,
      copingMechanisms: ['problem-solving']
    },
    goalOrientation: {
      shortTermGoalFocus: 50,
      longTermGoalFocus: 50,
      achievementDrive: 50
    },
    adaptiveLearning: {
      learningSpeed: 50,
      memoryRetention: 50,
      skillAcquisitionRate: 50
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAttributes, setFilteredAttributes] = useState([]);
  const [agentName, setAgentName] = useState('New Agent');
  const [agentRole, setAgentRole] = useState('general-purpose');
  const [activeCategory, setActiveCategory] = useState('personalityDimensions');
  const [presets, setPresets] = useState([
    { name: 'Researcher', role: 'industry-research' },
    { name: 'Data Processor', role: 'data-organization' },
    { name: 'Contact Manager', role: 'contact-identification' },
    { name: 'Communications', role: 'communication-planning' },
    { name: 'Opportunity Analyzer', role: 'opportunity-analysis' }
  ]);

  // Relationships between attributes (for interconnected sliders)
  const attributeRelationships = {
    'personalityDimensions.openness': ['cognitiveAbilities.creativeIntelligence', 'behavioralTendencies.adaptability'],
    'personalityDimensions.conscientiousness': ['goalOrientation.achievementDrive', 'cognitiveAbilities.analyticalIntelligence'],
    'personalityDimensions.extraversion': ['socialDynamics.leadershipPotential', 'behavioralTendencies.assertiveness'],
    'personalityDimensions.agreeableness': ['ethicalFramework.careHarm', 'socialDynamics.teamworkAbility'],
    'personalityDimensions.neuroticism': ['stressResponse.stressTolerance', 'behavioralTendencies.riskTaking'],
    'cognitiveAbilities.emotionalIntelligence': ['behavioralTendencies.empathy', 'socialDynamics.conflictResolution'],
    'cognitiveAbilities.analyticalIntelligence': ['goalOrientation.longTermGoalFocus', 'adaptiveLearning.learningSpeed']
  };

  // Calculate related attributes and their connection strength
  const getRelatedAttributes = (category, attribute) => {
    const fullKey = `${category}.${attribute}`;
    return attributeRelationships[fullKey] || [];
  };

  // Function to handle slider changes with connections to related attributes
  const handleSliderChange = (category, attribute, value) => {
    setAttributes(prev => {
      const newAttributes = { ...prev };
      newAttributes[category][attribute] = value;
      
      // Update related attributes with diminishing effect
      const relatedAttributes = getRelatedAttributes(category, attribute);
      relatedAttributes.forEach(relatedAttr => {
        const [relCategory, relAttribute] = relatedAttr.split('.');
        const currentValue = newAttributes[relCategory][relAttribute];
        const influence = 0.3; // 30% influence
        const newRelatedValue = Math.min(100, Math.max(1, 
          Math.round(currentValue + (value - prev[category][attribute]) * influence)
        ));
        newAttributes[relCategory][relAttribute] = newRelatedValue;
      });
      
      return newAttributes;
    });
  };

  // Filter attributes based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredAttributes([]);
      return;
    }
    
    const results = [];
    
    Object.entries(attributes).forEach(([category, attrs]) => {
      Object.keys(attrs).forEach(attr => {
        if (attr.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ category, attribute: attr });
        }
      });
    });
    
    setFilteredAttributes(results);
  }, [searchQuery, attributes]);

  // Load a preset
  const loadPreset = (presetName) => {
    const preset = presets.find(p => p.name === presetName);
    if (!preset) return;
    
    // Simulated preset values based on the agent roles defined in the framework
    let presetValues = { ...attributes };
    
    if (preset.role === 'industry-research') {
      presetValues.personalityDimensions.openness = 85;
      presetValues.personalityDimensions.conscientiousness = 90;
      presetValues.personalityDimensions.extraversion = 40;
      presetValues.cognitiveAbilities.analyticalIntelligence = 95;
      presetValues.cognitiveAbilities.practicalIntelligence = 85;
      // Additional preset values would be defined here
    } else if (preset.role === 'data-organization') {
      presetValues.personalityDimensions.conscientiousness = 95;
      presetValues.personalityDimensions.extraversion = 30;
      presetValues.cognitiveAbilities.analyticalIntelligence = 95;
      presetValues.cognitiveAbilities.practicalIntelligence = 90;
      // Additional preset values would be defined here
    }
    // Additional role presets would be defined here
    
    setAttributes(presetValues);
    setAgentName(preset.name);
    setAgentRole(preset.role);
  };

  // Generate a randomized configuration
  const randomizeConfiguration = () => {
    setAttributes(prev => {
      const newAttributes = { ...prev };
      
      Object.keys(newAttributes).forEach(category => {
        if (typeof newAttributes[category] === 'object') {
          Object.keys(newAttributes[category]).forEach(attr => {
            if (Array.isArray(newAttributes[category][attr])) {
              // Handle array type attributes (like copingMechanisms)
              // This is simplified and would need more complex handling in a real implementation
            } else if (typeof newAttributes[category][attr] === 'number') {
              // Randomize numeric values
              newAttributes[category][attr] = Math.floor(Math.random() * 100) + 1;
            }
          });
        }
      });
      
      return newAttributes;
    });
  };

  // Reset all values or a specific category
  const resetValues = (category = null) => {
    if (category) {
      setAttributes(prev => ({
        ...prev,
        [category]: Object.fromEntries(
          Object.keys(prev[category]).map(attr => [
            attr, 
            Array.isArray(prev[category][attr]) ? ['problem-solving'] : 50
          ])
        )
      }));
    } else {
      // Reset all categories to default values
      const defaultAttributes = Object.fromEntries(
        Object.keys(attributes).map(category => [
          category,
          Object.fromEntries(
            Object.keys(attributes[category]).map(attr => [
              attr, 
              Array.isArray(attributes[category][attr]) ? ['problem-solving'] : 50
            ])
          )
        ])
      );
      setAttributes(defaultAttributes);
    }
  };

  // Generate agent description based on current configuration
  const generateAgentDescription = () => {
    const personalityTraits = [];
    
    // Analyze personality dimensions
    if (attributes.personalityDimensions.openness > 75) personalityTraits.push("highly creative and open to new experiences");
    else if (attributes.personalityDimensions.openness < 25) personalityTraits.push("practical and conventional");
    
    if (attributes.personalityDimensions.conscientiousness > 75) personalityTraits.push("extremely organized and detail-oriented");
    else if (attributes.personalityDimensions.conscientiousness < 25) personalityTraits.push("flexible and spontaneous");
    
    if (attributes.personalityDimensions.extraversion > 75) personalityTraits.push("highly sociable and energetic");
    else if (attributes.personalityDimensions.extraversion < 25) personalityTraits.push("reserved and thoughtful");
    
    if (attributes.personalityDimensions.agreeableness > 75) personalityTraits.push("compassionate and cooperative");
    else if (attributes.personalityDimensions.agreeableness < 25) personalityTraits.push("analytical and challenging");
    
    if (attributes.personalityDimensions.neuroticism < 25) personalityTraits.push("emotionally stable and resilient");
    else if (attributes.personalityDimensions.neuroticism > 75) personalityTraits.push("sensitive and emotionally responsive");
    
    // Analyze cognitive abilities
    const cognitiveStrengths = [];
    if (attributes.cognitiveAbilities.analyticalIntelligence > 70) cognitiveStrengths.push("analytical reasoning");
    if (attributes.cognitiveAbilities.creativeIntelligence > 70) cognitiveStrengths.push("creative problem-solving");
    if (attributes.cognitiveAbilities.practicalIntelligence > 70) cognitiveStrengths.push("practical application");
    if (attributes.cognitiveAbilities.emotionalIntelligence > 70) cognitiveStrengths.push("emotional understanding");
    
    // Create description
    const traitsText = personalityTraits.length > 0 
      ? `This agent is ${personalityTraits.join(", ")}.` 
      : "This agent has a balanced personality profile.";
    
    const cognitiveText = cognitiveStrengths.length > 0
      ? `Excels in ${cognitiveStrengths.join(", ")}.`
      : "Has balanced cognitive abilities across multiple domains.";
    
    const roleText = `Optimized for ${agentRole.replace(/-/g, " ")} tasks.`;
    
    return `${traitsText} ${cognitiveText} ${roleText}`;
  };

  // Render slider for a specific attribute
  const renderSlider = (category, attribute) => {
    const value = attributes[category][attribute];
    const relatedAttributes = getRelatedAttributes(category, attribute);
    
    return (
      <div className="mb-6 relative" key={`${category}-${attribute}`}>
        <div className="flex justify-between mb-1">
          <label className="text-sm font-medium">
            {attribute.replace(/([A-Z])/g, ' $1').trim()}
          </label>
          <span className="text-sm font-bold">{value}</span>
        </div>
        
        <Slider
          value={[value]}
          min={1}
          max={100}
          step={1}
          onValueChange={(vals) => handleSliderChange(category, attribute, vals[0])}
          className="mb-2"
        />
        
        {/* Connection lines to related attributes */}
        {relatedAttributes.length > 0 && (
          <div className="absolute -right-4 top-1/2 w-4 h-4">
            <div className="w-4 h-0.5 bg-blue-400"></div>
          </div>
        )}
      </div>
    );
  };

  // Render a category of attributes
  const renderCategory = (category) => {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 text-blue-600">
          {category.replace(/([A-Z])/g, ' $1').trim()}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          {Object.keys(attributes[category]).map((attribute, index) => (
            // Alternate between top and bottom row for attribute sliders
            <div key={attribute} className={index % 2 === 0 ? "" : "mt-4"}>
              {renderSlider(category, attribute)}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => resetValues(category)}
            className="text-xs"
          >
            Reset Category
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left sidebar - Categories */}
      <div className="w-64 bg-white shadow-md p-4">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Agent Configuration</h2>
          <CustomInput
            type="text"
            placeholder="Agent name"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="mb-2"
          />
          <CustomSelect 
            value={agentRole}
            onValueChange={setAgentRole}
            className="w-full"
          >
            <option value="industry-research">Industry Research</option>
            <option value="data-organization">Data Organization</option>
            <option value="contact-identification">Contact Identification</option>
            <option value="communication-planning">Communication Planning</option>
            <option value="opportunity-analysis">Opportunity Analysis</option>
            <option value="general-purpose">General Purpose</option>
          </CustomSelect>
        </div>

        <div className="mb-4">
          <CustomInput
            type="text"
            placeholder="Search attributes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
            icon={<Search className="h-4 w-4" />}
          />
          
          {filteredAttributes.length > 0 && (
            <div className="bg-gray-100 p-2 rounded max-h-40 overflow-y-auto mb-4">
              {filteredAttributes.map(({category, attribute}) => (
                <div 
                  key={`${category}-${attribute}`}
                  className="text-sm p-1 cursor-pointer hover:bg-blue-100 rounded"
                  onClick={() => {
                    setActiveCategory(category);
                    setSearchQuery('');
                    // Would also scroll to the attribute in a real implementation
                  }}
                >
                  <strong>{category}:</strong> {attribute}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1">
          {Object.keys(attributes).map(category => (
            <div 
              key={category}
              className={`p-2 rounded cursor-pointer ${activeCategory === category ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveCategory(category)}
            >
              {category.replace(/([A-Z])/g, ' $1').trim()}
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-2">
          <Button size="sm" className="w-full" onClick={() => loadPreset(agentName)}>
            <Save className="h-4 w-4 mr-2" />
            Save Preset
          </Button>
          <Button size="sm" className="w-full" variant="outline" onClick={randomizeConfiguration}>
            <Zap className="h-4 w-4 mr-2" />
            Randomize
          </Button>
          <Button size="sm" className="w-full" variant="outline" onClick={() => resetValues()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-bold mb-2">Saved Presets</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {presets.map(preset => (
              <div 
                key={preset.name}
                className="text-sm p-2 cursor-pointer hover:bg-gray-100 rounded flex items-center"
                onClick={() => loadPreset(preset.name)}
              >
                <User className="h-3 w-3 mr-2" />
                {preset.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{agentName}</h1>
          <p className="text-gray-600">{agentRole.replace(/-/g, " ")}</p>
        </div>

        {/* Attribute editor */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          {renderCategory(activeCategory)}
        </div>

        {/* Agent preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Agent Preview</h2>
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
              {/* This would be a visual representation of the agent */}
              <User className="h-20 w-20 text-gray-400" />
            </div>
            <Button className="w-full">Apply Changes</Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Agent Description</h2>
            <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto">
              <p>{generateAgentDescription()}</p>
              
              <h3 className="text-lg font-bold mt-4 mb-2">Key Attributes:</h3>
              <ul className="list-disc pl-5">
                {Object.entries(attributes).flatMap(([category, attrs]) => 
                  Object.entries(attrs)
                    .filter(([_, value]) => typeof value === 'number' && (value >= 80 || value <= 20))
                    .map(([attr, value]) => (
                      <li key={`${category}-${attr}`}>
                        <strong>{attr}:</strong> {value} 
                        {value >= 80 ? ' (Exceptional)' : ' (Low Priority)'}
                      </li>
                    ))
                )}
              </ul>
            </div>
            <Button variant="outline" className="w-full mt-4">
              <FileText className="h-4 w-4 mr-2" />
              Generate Full Profile
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgentCustomizationInterface;