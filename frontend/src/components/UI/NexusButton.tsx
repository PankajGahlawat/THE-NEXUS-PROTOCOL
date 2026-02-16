/**
 * NEXUS PROTOCOL - Enhanced Button Component
 * Accessible button component with theme integration
 * Version: 2.0.0
 * Last Updated: December 20, 2025
 */

import React, { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';

export type ButtonVariant = 'primary' | 'secondary' | 'tool' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface NexusButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  active?: boolean;
  children: ReactNode;
}

const NexusButton = forwardRef<HTMLButtonElement, NexusButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  active = false,
  disabled,
  className = '',
  children,
  onClick,
  ...props
}, ref) => {
  const { announceLiveRegion } = useAccessibility();

  // Handle click with accessibility announcement
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    
    if (onClick) {
      onClick(e);
    }

    // Announce action for screen readers
    const buttonText = typeof children === 'string' ? children : 'Button activated';
    announceLiveRegion(`${buttonText} activated`, 'polite');
  };

  // Base classes
  const baseClasses = [
    'nexus-button',
    'relative',
    'inline-flex',
    'items-center',
    'justify-center',
    'gap-2',
    'font-semibold',
    'text-center',
    'transition-all',
    'duration-300',
    'ease-in-out',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'focus:ring-offset-arcane-dark',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'disabled:transform-none'
  ];

  // Variant classes
  const variantClasses = {
    primary: [
      'btn-theme-primary',
      'text-white',
      'hover:shadow-theme-glow',
      'focus:ring-theme-primary'
    ],
    secondary: [
      'bg-transparent',
      'border-2',
      'border-arcane-border',
      'text-arcane-text',
      'hover:border-theme-primary',
      'hover:text-theme-primary',
      'hover:shadow-theme-glow',
      'focus:ring-theme-primary'
    ],
    tool: [
      'nexus-button--tool',
      active ? 'nexus-button--active' : '',
      'bg-transparent',
      'border',
      'border-transparent',
      'text-arcane-muted',
      'hover:bg-theme-primary/10',
      'hover:border-theme-primary',
      'hover:text-theme-primary',
      'focus:ring-theme-primary'
    ],
    danger: [
      'bg-gradient-to-r',
      'from-red-600',
      'to-red-700',
      'text-white',
      'hover:from-red-700',
      'hover:to-red-800',
      'hover:shadow-lg',
      'hover:shadow-red-500/25',
      'focus:ring-red-500'
    ],
    success: [
      'bg-gradient-to-r',
      'from-green-600',
      'to-green-700',
      'text-white',
      'hover:from-green-700',
      'hover:to-green-800',
      'hover:shadow-lg',
      'hover:shadow-green-500/25',
      'focus:ring-green-500'
    ]
  };

  // Size classes
  const sizeClasses = {
    sm: ['px-3', 'py-2', 'text-sm', 'min-h-[36px]'],
    md: ['px-6', 'py-3', 'text-base', 'min-h-[44px]'],
    lg: ['px-8', 'py-4', 'text-lg', 'min-h-[52px]']
  };

  // Border radius classes
  const borderClasses = {
    primary: ['rounded-lg'],
    secondary: ['rounded-lg'],
    tool: ['rounded-md'],
    danger: ['rounded-lg'],
    success: ['rounded-lg']
  };

  // Combine all classes
  const buttonClasses = [
    ...baseClasses,
    ...variantClasses[variant],
    ...sizeClasses[size],
    ...borderClasses[variant],
    fullWidth ? 'w-full' : '',
    loading ? 'cursor-wait' : '',
    className
  ].filter(Boolean).join(' ');

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );

  // Icon component
  const IconComponent = ({ position }: { position: 'left' | 'right' }) => {
    if (!icon || loading) return null;
    
    return (
      <span className={`flex-shrink-0 ${position === 'right' ? 'order-2' : ''}`}>
        {icon}
      </span>
    );
  };

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {/* Left icon */}
      {iconPosition === 'left' && <IconComponent position="left" />}
      
      {/* Loading spinner */}
      {loading && <LoadingSpinner />}
      
      {/* Button content */}
      <span className={loading ? 'opacity-70' : ''}>
        {children}
      </span>
      
      {/* Right icon */}
      {iconPosition === 'right' && <IconComponent position="right" />}
      
      {/* Clip path for primary variant */}
      {variant === 'primary' && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))'
          }}
        />
      )}
    </button>
  );
});

NexusButton.displayName = 'NexusButton';

export default NexusButton;