import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface TraceIndicatorProps {
  traceLevel: number; // 0-100
  className?: string;
}

type TraceStatus = 'Ghost' | 'Shadow' | 'Visible' | 'Burned';

const getTraceStatus = (level: number): TraceStatus => {
  if (level <= 25) return 'Ghost';
  if (level <= 50) return 'Shadow';
  if (level <= 75) return 'Visible';
  return 'Burned';
};

const getStatusColor = (status: TraceStatus): string => {
  switch (status) {
    case 'Ghost': return 'text-green-400';
    case 'Shadow': return 'text-yellow-400';
    case 'Visible': return 'text-orange-400';
    case 'Burned': return 'text-red-500';
  }
};

const getStatusGlow = (status: TraceStatus): string => {
  switch (status) {
    case 'Ghost': return 'shadow-[0_0_10px_rgba(74,222,128,0.3)]';
    case 'Shadow': return 'shadow-[0_0_15px_rgba(250,204,21,0.4)]';
    case 'Visible': return 'shadow-[0_0_20px_rgba(251,146,60,0.5)]';
    case 'Burned': return 'shadow-[0_0_25px_rgba(239,68,68,0.7)]';
  }
};

export const TraceIndicator: React.FC<TraceIndicatorProps> = ({ 
  traceLevel, 
  className = '' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const prevLevelRef = useRef<number>(traceLevel);
  
  const status = getTraceStatus(traceLevel);
  const statusColor = getStatusColor(status);
  const statusGlow = getStatusGlow(status);

  // Animate trace level changes
  useEffect(() => {
    if (barRef.current && prevLevelRef.current !== traceLevel) {
      gsap.to(barRef.current, {
        width: `${traceLevel}%`,
        duration: 0.8,
        ease: 'power2.out'
      });
      
      prevLevelRef.current = traceLevel;
    }
  }, [traceLevel]);

  // Animate status transitions
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { scale: 1 },
        {
          scale: 1.05,
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut'
        }
      );
    }
  }, [status]);

  // Pulsing glow effect for high trace levels
  useEffect(() => {
    if (glowRef.current && (status === 'Visible' || status === 'Burned')) {
      const tl = gsap.timeline({ repeat: -1 });
      
      tl.to(glowRef.current, {
        opacity: status === 'Burned' ? 0.9 : 0.7,
        duration: 0.8,
        ease: 'sine.inOut'
      }).to(glowRef.current, {
        opacity: status === 'Burned' ? 0.5 : 0.3,
        duration: 0.8,
        ease: 'sine.inOut'
      });
      
      return () => {
        tl.kill();
      };
    }
  }, [status]);

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-mono text-gray-400">TRACE LEVEL</span>
        <span className={`text-sm font-mono font-bold ${statusColor}`}>
          {status.toUpperCase()}
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="relative h-6 bg-gray-900 border border-gray-700 rounded overflow-hidden">
        {/* Glow Layer */}
        <div
          ref={glowRef}
          className={`absolute inset-0 ${statusGlow} opacity-30`}
          style={{ width: `${traceLevel}%` }}
        />
        
        {/* Progress Bar */}
        <div
          ref={barRef}
          className={`absolute inset-0 transition-colors duration-500`}
          style={{
            width: `${traceLevel}%`,
            background: `linear-gradient(90deg, 
              ${status === 'Ghost' ? '#4ade80' : 
                status === 'Shadow' ? '#facc15' : 
                status === 'Visible' ? '#fb923c' : 
                '#ef4444'} 0%, 
              ${status === 'Ghost' ? '#22c55e' : 
                status === 'Shadow' ? '#eab308' : 
                status === 'Visible' ? '#f97316' : 
                '#dc2626'} 100%)`
          }}
        />
        
        {/* Percentage Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono font-bold text-white drop-shadow-lg">
            {traceLevel}%
          </span>
        </div>
      </div>

      {/* Status Description */}
      <div className="mt-2 text-xs font-mono text-gray-500">
        {status === 'Ghost' && 'Minimal detection risk'}
        {status === 'Shadow' && 'Moderate detection risk'}
        {status === 'Visible' && 'High detection risk'}
        {status === 'Burned' && 'CRITICAL - Identity compromised'}
      </div>
    </div>
  );
};
