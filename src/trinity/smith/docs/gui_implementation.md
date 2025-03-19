# Implementing the Mr. Smith Behavioral Matrix GUI

This document provides guidelines for implementing the graphical user interface (GUI) for the Mr. Smith Behavioral Matrix Framework. The GUI allows for intuitive agent customization with an equalizer-style interface for precise attribute adjustment.

## Overview

The Behavioral Matrix GUI is designed to provide a visual, interactive way to customize agent attributes. The interface resembles an audio equalizer, where each slider represents a different agent attribute, and adjustments produce real-time visual feedback.

## GUI Requirements

### Core Components

1. **Attribute Sliders Panel**: 
   - Equalizer-style sliders for attribute adjustments
   - Organized by category with expandable/collapsible sections
   - Visual indicators showing attribute values (0-100)

2. **Agent Visualization**:
   - Real-time visual representation of the agent
   - Updates as attributes are adjusted
   - Displays key characteristics visually

3. **Description Panel**:
   - Dynamic text description of the agent
   - Updates in real-time as attributes change
   - Highlights key traits and tendencies

4. **Control Panel**:
   - Template management (Save/Load)
   - Randomize function
   - Reset options (All/Category)
   - Search functionality
   - Apply Changes button

## Detailed Design Specifications

### 1. Attribute Sliders Panel

#### Layout

The sliders should be organized into expandable/collapsible category panels:

```
┌─ Core Personality ──────────────┐
│                                 │
│  Openness:       [===|===----]  │
│  Conscientiousness: [==|=====]  │
│  Extraversion:   [====|=-----]  │
│  Agreeableness:  [===|====---]  │
│  Neuroticism:    [==|--------]  │
│                                 │
└─────────────────────────────────┘

┌─ Cognitive Abilities ───────────┐
│                                 │
│  Analytical:     [====|====--]  │
│  Creative:       [===|=======]  │
│  Practical:      [====|======]  │
│  Emotional:      [==|========]  │
│                                 │
└─────────────────────────────────┘
```

#### Slider Design

Each slider should:
- Display the attribute name
- Show a visual bar from 0-100
- Have a draggable indicator
- Display numerical value (0-100)
- Use color gradients to indicate value ranges
  - Lower values: cooler colors (blues)
  - Middle values: neutral colors (greens/yellows)
  - Higher values: warmer colors (oranges/reds)

#### Interrelated Attributes

When certain attributes are adjusted, related attributes may be automatically affected. For example:
- Increasing Neuroticism might slightly decrease Stress Tolerance
- Increasing Extraversion might slightly increase Assertiveness

These relationships should be visually indicated with connecting lines between related sliders, and the connected sliders should animate slightly when their related attributes are adjusted.

### 2. Agent Visualization

The agent visualization should be an abstract representation that conveys personality traits visually. Options include:

#### Avatar Approach
- A humanoid figure whose appearance changes with attribute values
- Facial expressions, posture, and clothing adjust based on attributes
- Color schemes reflect dominant personality traits

#### Abstract Representation
- A particle system or geometric pattern that adjusts its behavior and appearance
- More angular/vibrant for high Extraversion, more flowing/subdued for low Extraversion
- Movement patterns reflect personality traits

#### Key Mappings
- Core Personality → Overall appearance and demeanor
- Cognitive Abilities → Head/brain visualization
- Value Systems → Heart/core visualization
- Behavioral Tendencies → Limbs/movement patterns
- Social Dynamics → Interface elements surrounding the avatar
- Ethical Framework → Color schemes and auras
- Stress Response → Environmental effects (calm/turbulent)
- Goal Orientation → Directional indicators
- Adaptive Learning → Growth/evolution indicators

### 3. Description Panel

The description panel should generate a natural language description of the agent based on its attributes. The description should update in real-time as attributes are adjusted.

Example:
```
Agent #BM-2574 is a highly conscientious individual with strong analytical abilities. 
They tend to be somewhat introverted but display moderate agreeableness in social 
interactions. Their ethical framework prioritizes fairness and care, with a strong 
drive for achievement and long-term goals. They handle stress well and adapt quickly 
to new information.
```

The description should:
- Highlight the most extreme attributes (highest and lowest values)
- Describe behavioral tendencies based on attribute combinations
- Suggest suitable roles or tasks for the agent
- Update dynamically as attributes change

### 4. Control Panel

#### Template Management
- Save Template: Save current configuration with a name
- Load Template: Load a previously saved configuration
- Dropdown menu showing available templates

#### Randomize Function
Options for randomization:
- Complete Random: All attributes randomized
- Weighted Random: Randomize with bias toward specific roles
- Partial Random: Randomize only selected categories

#### Reset Options
- Reset All: Return all attributes to default values (50)
- Reset Category: Reset only the currently selected category
- Reset Selected: Reset only selected attributes

#### Search Functionality
- Search bar to filter attributes by name
- Instant highlighting of matching attributes
- Option to adjust all matching attributes simultaneously

#### Apply Changes Button
- Prominent button to apply the current configuration
- Should trigger a visual confirmation when pressed
- Optionally, auto-save functionality that applies changes automatically

## Technical Implementation

### Front-End Technologies

**Recommended Stack:**
- **React/Vue.js**: For component-based UI development
- **D3.js**: For data visualization and interactive elements
- **Three.js** (optional): For 3D agent visualization
- **TailwindCSS/SCSS**: For styling

### Back-End Integration

The GUI should communicate with the Mr. Smith API for:
- Fetching attribute definitions
- Loading attribute templates
- Saving new templates
- Applying attribute configurations to agents
- Retrieving role-optimized configurations

### Data Flow

1. **Initialization**:
   - Fetch attribute definitions from API
   - Initialize sliders with default or specified values
   - Generate initial visualization and description

2. **User Interaction**:
   - User adjusts sliders or loads templates
   - Front-end updates visualization and description
   - Calculates any interrelated attribute changes

3. **Apply Changes**:
   - User clicks "Apply Changes"
   - Configuration is sent to the API
   - Confirmation displayed to user

4. **Template Management**:
   - Saving templates sends configurations to API
   - Loading templates fetches configurations from API

## Responsive Design

The GUI should adapt to different screen sizes:

### Desktop Layout
- Full equalizer panel with all categories visible
- Large visualization area
- Comprehensive description

### Tablet Layout
- Collapsible categories for space efficiency
- Medium visualization area
- Scrollable description

### Mobile Layout
- Single category visible at a time with swipe navigation
- Small visualization that can be expanded
- Abbreviated description with option to view full text

## Accessibility Considerations

- Ensure all sliders are keyboard navigable
- Provide alternative text descriptions for visual elements
- Support screen readers for the description panel
- Use sufficient color contrast for text and controls
- Include numeric inputs alternative to sliders

## Sample Code Snippets

### React Component for Attribute Slider

```jsx
function AttributeSlider({ name, value, min, max, onChange, category }) {
  // Calculate color based on value
  const getColor = (val) => {
    if (val < 33) return `rgb(59, 130, 246, ${val/100})`;
    if (val < 66) return `rgb(16, 185, 129, ${val/100})`;
    return `rgb(239, 68, 68, ${val/100})`;
  };

  return (
    <div className="attribute-slider">
      <label className="attribute-name">{name}</label>
      <div className="slider-container">
        <div 
          className="slider-track"
          style={{
            background: `linear-gradient(to right, ${getColor(0)}, ${getColor(50)}, ${getColor(100)})`
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(name, parseInt(e.target.value), category)}
          className="slider"
        />
        <div 
          className="slider-thumb"
          style={{
            left: `${value}%`,
            backgroundColor: getColor(value)
          }}
        />
      </div>
      <div className="value-display">{value}</div>
    </div>
  );
}
```

### API Integration

```javascript
// Fetch attribute definitions
async function fetchAttributes() {
  try {
    const response = await fetch(`${API_BASE_URL}/attributes`);
    const data = await response.json();
    return data.attributes;
  } catch (error) {
    console.error('Error fetching attributes:', error);
    return null;
  }
}

// Apply attributes to an agent
async function applyAttributes(agentId, attributes) {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/${agentId}/attributes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attributes),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error applying attributes:', error);
    return null;
  }
}
```

## Implementation Process

1. **Prototyping Phase**:
   - Create wireframes and mockups
   - Test different visualization approaches
   - Validate user experience with stakeholders

2. **Development Phase**:
   - Build attribute slider components
   - Implement visualization engine
   - Develop description generator
   - Create control panel functionality
   - Integrate with API

3. **Testing Phase**:
   - Test usability across devices
   - Validate API integration
   - Performance testing for complex visualizations
   - Accessibility testing

4. **Deployment Phase**:
   - Documentation for users
   - Release with the Mr. Smith framework
   - Collect feedback for improvements

## Conclusion

The Behavioral Matrix GUI provides an intuitive interface for customizing agent attributes. By following these guidelines, developers can create a powerful, user-friendly tool that seamlessly integrates with the Mr. Smith Agent Customization Framework.

The final implementation should prioritize:
- Intuitive user experience
- Visual feedback
- Performance efficiency
- Seamless API integration
- Accessibility standards

These elements combined will create a powerful tool for agent customization that both technical and non-technical users can utilize effectively. 