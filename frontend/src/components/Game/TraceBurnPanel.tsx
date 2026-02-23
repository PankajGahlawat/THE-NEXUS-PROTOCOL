import React from 'react';
import { TraceIndicator } from './TraceIndicator';
import { BurnStateDisplay } from './BurnStateDisplay';
import { useTraceBurn } from '../../hooks/useTraceBurn';

interface TraceBurnPanelProps {
  className?: string;
}

/**
 * Combined Trace & Burn panel with real-time WebSocket integration
 * Displays both trace level indicator and burn state with animations
 */
export const TraceBurnPanel: React.FC<TraceBurnPanelProps> = ({ className = '' }) => {
  const { traceLevel, burnState } = useTraceBurn();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Trace Level Indicator */}
      <TraceIndicator traceLevel={traceLevel} />
      
      {/* Burn State Display */}
      <BurnStateDisplay 
        burnState={burnState} 
        traceLevel={traceLevel}
      />
    </div>
  );
};
