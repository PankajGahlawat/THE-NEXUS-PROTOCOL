# Trace & Burn Visual Components - Integration Guide

## Overview

The Trace & Burn visual system provides real-time feedback on Red Team identity residue levels with animated indicators and WebSocket integration.

## Components

### 1. TraceIndicator
Displays the current trace level (0-100%) with color-coded status:
- **Ghost** (0-25%): Green - Minimal detection risk
- **Shadow** (26-50%): Yellow - Moderate detection risk
- **Visible** (51-75%): Orange - High detection risk
- **Burned** (76-100%): Red - Critical, identity compromised

### 2. BurnStateDisplay
Shows the burn state with visual effects and tool effectiveness penalties:
- **LOW** (0-25%): Green indicators, 100% effectiveness
- **MODERATE** (26-50%): Yellow indicators, 80% effectiveness
- **HIGH** (51-75%): Orange with pulsing, 60% effectiveness, countermeasure warning
- **CRITICAL** (76-100%): Red with intense pulsing, 40% effectiveness, emergency protocol

### 3. TraceBurnPanel
Combined component that displays both TraceIndicator and BurnStateDisplay with automatic WebSocket integration.

## Integration into MissionUI

### Step 1: Import the Component

```typescript
import { TraceBurnPanel } from '../Game';
```

### Step 2: Add to Your UI Layout

```typescript
export default function MissionUI() {
  const { gameState } = useGame();

  return (
    <div className="mission-container">
      {/* Existing mission content */}
      
      {/* Add Trace & Burn Panel */}
      <div className="sidebar">
        <TraceBurnPanel className="mb-4" />
        
        {/* Other sidebar content */}
      </div>
    </div>
  );
}
```

### Step 3: Alternative - Use Individual Components

If you need more control over layout:

```typescript
import { TraceIndicator, BurnStateDisplay } from '../Game';
import { useTraceBurn } from '../../hooks/useTraceBurn';

export default function MissionUI() {
  const { traceLevel, burnState } = useTraceBurn();

  return (
    <div className="mission-container">
      {/* Top bar with trace indicator */}
      <div className="top-bar">
        <TraceIndicator traceLevel={traceLevel} className="w-64" />
      </div>
      
      {/* Sidebar with burn state */}
      <div className="sidebar">
        <BurnStateDisplay 
          burnState={burnState} 
          traceLevel={traceLevel}
          className="mb-4"
        />
      </div>
    </div>
  );
}
```

## WebSocket Events

The components automatically subscribe to these WebSocket events:

### trace_update
```json
{
  "type": "trace_update",
  "traceLevel": 45,
  "timestamp": "2026-02-19T14:30:00Z"
}
```

### burn_update
```json
{
  "type": "burn_update",
  "burnState": "HIGH",
  "traceLevel": 65,
  "timestamp": "2026-02-19T14:30:00Z"
}
```

### tool_use (with trace effects)
```json
{
  "type": "tool_use",
  "toolId": "nmap",
  "effects": {
    "traceIncrease": 10,
    "success": true
  },
  "timestamp": "2026-02-19T14:30:00Z"
}
```

## Animations

All components use GSAP for smooth animations:

- **Trace level changes**: Smooth bar width transitions (0.8s)
- **Status transitions**: Scale pulse effect (0.3s)
- **HIGH/CRITICAL states**: Continuous pulsing glow
- **State changes**: Fade and slide animations

## Styling

Components use Tailwind CSS and are fully customizable:

```typescript
<TraceBurnPanel 
  className="bg-gray-800 p-4 rounded-lg shadow-xl"
/>
```

## Example: Full Integration

```typescript
import { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { TraceBurnPanel } from '../Game';
import { useTraceBurn } from '../../hooks/useTraceBurn';

export default function MissionUI() {
  const { gameState, connectWebSocket } = useGame();
  const { showCountermeasureWarning, showEmergencyProtocol } = useTraceBurn();

  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Main Content */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">
          {gameState.currentMission?.name}
        </h1>
        
        {/* Mission objectives and content */}
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-gray-800 p-4 space-y-4">
        {/* Trace & Burn Panel */}
        <TraceBurnPanel />
        
        {/* Conditional Warnings */}
        {showCountermeasureWarning && (
          <div className="p-3 bg-orange-900/50 border border-orange-500 rounded">
            <p className="text-sm text-orange-300">
              ⚠ Blue Team countermeasures likely active
            </p>
          </div>
        )}
        
        {showEmergencyProtocol && (
          <div className="p-3 bg-red-900/70 border border-red-500 rounded">
            <p className="text-sm font-bold text-red-400">
              🚨 EMERGENCY: Consider tactical withdrawal
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Testing

To test the components without a backend:

```typescript
// In your component or test file
import { TraceIndicator, BurnStateDisplay } from '../Game';

function TestComponent() {
  const [trace, setTrace] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrace(prev => (prev + 5) % 100);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const burnState = 
    trace <= 25 ? 'LOW' :
    trace <= 50 ? 'MODERATE' :
    trace <= 75 ? 'HIGH' : 'CRITICAL';

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <TraceIndicator traceLevel={trace} className="mb-4" />
      <BurnStateDisplay burnState={burnState} traceLevel={trace} />
    </div>
  );
}
```

## Requirements Validation

This implementation satisfies:

- ✅ **Requirement 4.1-4.4**: Trace level visual status (Ghost/Shadow/Visible/Burned)
- ✅ **Requirement 4.5-4.8**: Burn state color-coded indicators with pulsing
- ✅ **Requirement 4.9**: Animated transitions between trace levels
- ✅ **Requirement 4.10**: Countermeasure warnings at HIGH burn
- ✅ **Requirement 4.11**: Emergency protocol notifications at CRITICAL
- ✅ **Requirement 4.12**: Stealth tool trace reduction animations (via WebSocket)
- ✅ **Requirement 3.6**: Real-time trace level updates via WebSocket
- ✅ **Requirement 3.7**: Real-time burn state updates via WebSocket
