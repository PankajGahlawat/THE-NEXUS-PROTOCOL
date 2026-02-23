import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface BurnStateDisplayProps {
  burnState: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  traceLevel: number;
  className?: string;
}

const getBurnStateConfig = (state: string) => {
  switch (state) {
    case 'LOW':
      return {
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        borderColor: 'border-green-500/50',
        glowColor: 'shadow-[0_0_15px_rgba(74,222,128,0.4)]',
        icon: '✓',
        message: 'Operations nominal',
        effectivenessLabel: 'Tool Effectiveness: 100%'
      };
    case 'MODERATE':
      return {
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/20',
        borderColor: 'border-yellow-500/50',
        glowColor: 'shadow-[0_0_20px_rgba(250,204,21,0.5)]',
        icon: '⚠',
        message: 'Increased visibility detected',
        effectivenessLabel: 'Tool Effectiveness: 80%'
      };
    case 'HIGH':
      return {
        color: 'text-orange-400',
        bgColor: 'bg-orange-900/20',
        borderColor: 'border-orange-500/50',
        glowColor: 'shadow-[0_0_25px_rgba(251,146,60,0.6)]',
        icon: '⚠⚠',
        message: 'WARNING: Countermeasures likely',
        effectivenessLabel: 'Tool Effectiveness: 60%'
      };
    case 'CRITICAL':
      return {
        color: 'text-red-500',
        bgColor: 'bg-red-900/30',
        borderColor: 'border-red-500/70',
        glowColor: 'shadow-[0_0_30px_rgba(239,68,68,0.8)]',
        icon: '⚠⚠⚠',
        message: 'CRITICAL: Identity burned - Immediate action required',
        effectivenessLabel: 'Tool Effectiveness: 40%'
      };
    default:
      return getBurnStateConfig('LOW');
  }
};

export const BurnStateDisplay: React.FC<BurnStateDisplayProps> = ({
  burnState,
  traceLevel,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const warningRef = useRef<HTMLDivElement>(null);
  
  const config = getBurnStateConfig(burnState);

  // Pulsing effect for HIGH and CRITICAL states
  useEffect(() => {
    if (containerRef.current && (burnState === 'HIGH' || burnState === 'CRITICAL')) {
      const intensity = burnState === 'CRITICAL' ? 1.08 : 1.04;
      const duration = burnState === 'CRITICAL' ? 0.5 : 0.7;
      
      const tl = gsap.timeline({ repeat: -1 });
      
      tl.to(containerRef.current, {
        scale: intensity,
        duration: duration,
        ease: 'sine.inOut'
      }).to(containerRef.current, {
        scale: 1,
        duration: duration,
        ease: 'sine.inOut'
      });
      
      return () => {
        tl.kill();
      };
    }
  }, [burnState]);

  // Icon pulsing animation
  useEffect(() => {
    if (iconRef.current && (burnState === 'HIGH' || burnState === 'CRITICAL')) {
      const tl = gsap.timeline({ repeat: -1 });
      
      tl.to(iconRef.current, {
        opacity: 1,
        scale: 1.2,
        duration: 0.4,
        ease: 'power2.out'
      }).to(iconRef.current, {
        opacity: 0.6,
        scale: 1,
        duration: 0.4,
        ease: 'power2.in'
      });
      
      return () => {
        tl.kill();
      };
    }
  }, [burnState]);

  // Warning message animation for CRITICAL state
  useEffect(() => {
    if (warningRef.current && burnState === 'CRITICAL') {
      const tl = gsap.timeline({ repeat: -1 });
      
      tl.to(warningRef.current, {
        opacity: 1,
        duration: 0.3
      }).to(warningRef.current, {
        opacity: 0.4,
        duration: 0.3
      });
      
      return () => {
        tl.kill();
      };
    }
  }, [burnState]);

  // State transition animation
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0.8, y: -5 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'back.out(1.7)'
        }
      );
    }
  }, [burnState]);

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
    >
      {/* Main Display Card */}
      <div 
        className={`
          ${config.bgColor} 
          ${config.borderColor} 
          ${config.glowColor}
          border-2 rounded-lg p-4 transition-all duration-300
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div 
              ref={iconRef}
              className={`text-2xl ${config.color}`}
            >
              {config.icon}
            </div>
            <span className="text-sm font-mono text-gray-400">BURN STATE</span>
          </div>
          <span className={`text-lg font-mono font-bold ${config.color}`}>
            {burnState}
          </span>
        </div>

        {/* Status Message */}
        <div 
          ref={warningRef}
          className={`text-sm font-mono ${config.color} mb-2`}
        >
          {config.message}
        </div>

        {/* Effectiveness Indicator */}
        <div className="text-xs font-mono text-gray-500 mb-3">
          {config.effectivenessLabel}
        </div>

        {/* Visual Indicator Bars */}
        <div className="flex gap-1">
          {[...Array(4)].map((_, index) => {
            const isActive = index < Math.ceil(traceLevel / 25);
            const barColor = 
              index === 0 ? 'bg-green-500' :
              index === 1 ? 'bg-yellow-500' :
              index === 2 ? 'bg-orange-500' :
              'bg-red-500';
            
            return (
              <div
                key={index}
                className={`
                  flex-1 h-2 rounded transition-all duration-500
                  ${isActive ? barColor : 'bg-gray-700'}
                  ${isActive && (burnState === 'HIGH' || burnState === 'CRITICAL') ? 'animate-pulse' : ''}
                `}
              />
            );
          })}
        </div>

        {/* Countermeasure Warning for HIGH state */}
        {burnState === 'HIGH' && (
          <div className="mt-3 p-2 bg-orange-950/50 border border-orange-500/30 rounded text-xs font-mono text-orange-300">
            ⚠ Countermeasure deployment imminent
          </div>
        )}

        {/* Emergency Protocol for CRITICAL state */}
        {burnState === 'CRITICAL' && (
          <div className="mt-3 p-2 bg-red-950/70 border border-red-500/50 rounded">
            <div className="text-xs font-mono font-bold text-red-400 mb-1">
              🚨 EMERGENCY PROTOCOL ACTIVE
            </div>
            <div className="text-xs font-mono text-red-300">
              • Reduce trace immediately<br />
              • Use stealth tools<br />
              • Consider tactical withdrawal
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
