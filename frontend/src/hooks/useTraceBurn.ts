import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';

export type BurnState = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

interface TraceBurnData {
  traceLevel: number;
  burnState: BurnState;
  showCountermeasureWarning: boolean;
  showEmergencyProtocol: boolean;
}

/**
 * Custom hook for managing Trace & Burn state with WebSocket integration
 * Subscribes to trace_update and burn_update events from the backend
 */
export const useTraceBurn = () => {
  const { gameState } = useGame();
  const [traceBurnData, setTraceBurnData] = useState<TraceBurnData>({
    traceLevel: 0,
    burnState: 'LOW',
    showCountermeasureWarning: false,
    showEmergencyProtocol: false
  });

  // Calculate burn state from trace level
  const calculateBurnState = useCallback((traceLevel: number): BurnState => {
    if (traceLevel <= 25) return 'LOW';
    if (traceLevel <= 50) return 'MODERATE';
    if (traceLevel <= 75) return 'HIGH';
    return 'CRITICAL';
  }, []);

  // Update trace and burn state from game context
  useEffect(() => {
    const newBurnState = calculateBurnState(gameState.traceLevel);
    
    setTraceBurnData({
      traceLevel: gameState.traceLevel,
      burnState: newBurnState,
      showCountermeasureWarning: newBurnState === 'HIGH',
      showEmergencyProtocol: newBurnState === 'CRITICAL'
    });
  }, [gameState.traceLevel, calculateBurnState]);

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    const ws = gameState.websocket;
    
    if (!ws) return;

    const handleTraceUpdate = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle trace_update event
        if (data.type === 'trace_update') {
          const newTraceLevel = data.traceLevel ?? data.trace ?? 0;
          const newBurnState = calculateBurnState(newTraceLevel);
          
          setTraceBurnData({
            traceLevel: newTraceLevel,
            burnState: newBurnState,
            showCountermeasureWarning: newBurnState === 'HIGH',
            showEmergencyProtocol: newBurnState === 'CRITICAL'
          });
        }
        
        // Handle burn_update event
        if (data.type === 'burn_update') {
          const burnState = data.burnState as BurnState;
          const traceLevel = data.traceLevel ?? traceBurnData.traceLevel;
          
          setTraceBurnData({
            traceLevel,
            burnState,
            showCountermeasureWarning: burnState === 'HIGH',
            showEmergencyProtocol: burnState === 'CRITICAL'
          });
        }

        // Handle tool_use event (may include trace changes)
        if (data.type === 'tool_use' && data.effects?.traceIncrease !== undefined) {
          const currentTrace = traceBurnData.traceLevel;
          const newTraceLevel = Math.min(100, currentTrace + data.effects.traceIncrease);
          const newBurnState = calculateBurnState(newTraceLevel);
          
          setTraceBurnData({
            traceLevel: newTraceLevel,
            burnState: newBurnState,
            showCountermeasureWarning: newBurnState === 'HIGH',
            showEmergencyProtocol: newBurnState === 'CRITICAL'
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.addEventListener('message', handleTraceUpdate);

    return () => {
      ws.removeEventListener('message', handleTraceUpdate);
    };
  }, [gameState.websocket, calculateBurnState, traceBurnData.traceLevel]);

  return traceBurnData;
};
