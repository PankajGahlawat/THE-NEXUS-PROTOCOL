/**
 * NEXUS PROTOCOL - Enhanced Card Component
 * Accessible card component with theme integration
 * Version: 2.0.0
 * Last Updated: December 20, 2025
 */

import React, { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'agent';
export type CardSize = 'sm' | 'md' | 'lg';

interface NexusCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  size?: CardSize;
  interactive?: boolean;
  selected?: boolean;
  loading?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

const NexusCard = forwardRef<HTMLDivElement, NexusCardProps>(({
  variant = 'default',
  size = 'md',
  interactive = false,
  selected = false,
  loading = false,
  header,
  footer,
  className = '',
  children,
  onClick,
  ...props
}, ref) => {

  // Base classes
  const baseClasses = [
    'nexus-card',
    'relative',
    'overflow-hidden',
    'transition-all',
    'duration-300',
    'ease-in-out'
  ];

  // Variant classes
  const variantClasses = {
    default: [
      'bg-arcane-card',
      'border',
      'border-arcane-border'
    ],
    elevated: [
      'bg-arcane-card',
      'border',
      'border-arcane-border',
      'shadow-lg',
      'shadow-black/20'
    ],
    outlined: [
      'bg-transparent',
      'border-2',
      'border-arcane-border'
    ],
    agent: [
      'bg-gradient-to-br',
      'from-arcane-panel',
      'to-arcane-card',
      'border-2',
      'border-arcane-border'
    ]
  };

  // Size classes
  const sizeClasses = {
    sm: ['p-4', 'rounded-lg'],
    md: ['p-6', 'rounded-xl'],
    lg: ['p-8', 'rounded-2xl']
  };

  // Interactive classes
  const interactiveClasses = interactive ? [
    'cursor-pointer',
    'hover:border-theme-primary',
    'hover:shadow-theme-glow',
    'hover:-translate-y-1',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-theme-primary',
    'focus:ring-offset-2',
    'focus:ring-offset-arcane-dark'
  ] : [];

  // Selected classes
  const selectedClasses = selected ? [
    'border-theme-primary',
    'shadow-theme-glow',
    'scale-105'
  ] : [];

  // Loading classes
  const loadingClasses = loading ? [
    'animate-pulse',
    'pointer-events-none'
  ] : [];

  // Combine all classes
  const cardClasses = [
    ...baseClasses,
    ...variantClasses[variant],
    ...sizeClasses[size],
    ...interactiveClasses,
    ...selectedClasses,
    ...loadingClasses,
    className
  ].filter(Boolean).join(' ');

  // Handle click
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (loading || !interactive) return;
    if (onClick) onClick(e);
  };

  // Handle keyboard interaction
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || loading) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onClick) {
        onClick(e as any);
      }
    }
  };

  return (
    <div
      ref={ref}
      className={cardClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      aria-pressed={interactive && selected ? true : undefined}
      aria-busy={loading}
      {...props}
    >
      {/* Theme accent line */}
      <div 
        className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-theme-primary to-theme-accent transition-opacity duration-300 ${
          selected || (interactive && 'hover:opacity-100') ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Header */}
      {header && (
        <div className="nexus-card-header mb-4 pb-4 border-b border-arcane-border">
          {header}
        </div>
      )}

      {/* Content */}
      <div className="nexus-card-content">
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-arcane-border rounded animate-pulse" />
            <div className="h-4 bg-arcane-border rounded animate-pulse w-3/4" />
            <div className="h-4 bg-arcane-border rounded animate-pulse w-1/2" />
          </div>
        ) : (
          children
        )}
      </div>

      {/* Footer */}
      {footer && (
        <div className="nexus-card-footer mt-4 pt-4 border-t border-arcane-border">
          {footer}
        </div>
      )}

      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-4 right-4">
          <div className="w-6 h-6 bg-theme-primary rounded-full flex items-center justify-center">
            <svg 
              className="w-4 h-4 text-white" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
});

NexusCard.displayName = 'NexusCard';

export default NexusCard;