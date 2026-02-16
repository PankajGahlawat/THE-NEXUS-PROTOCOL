/**
 * NEXUS PROTOCOL - Theme Management Hook
 * Provides theme switching and management functionality
 * Version: 2.0.0
 * Last Updated: December 20, 2025
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

export type AgentTheme = 'hacker' | 'infiltrator';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  highlight: string;
  glow: string;
  name: string;
}

export interface ThemeConfig {
  theme: AgentTheme;
  colors: ThemeColors;
  isDark: boolean;
  isHighContrast: boolean;
  reducedMotion: boolean;
}

// Theme color definitions
const THEME_COLORS: Record<AgentTheme, ThemeColors> = {
  hacker: {
    primary: '#FF1744',
    secondary: '#DC143C',
    accent: '#8B0000',
    highlight: '#FF6B35',
    glow: 'rgba(255, 23, 68, 0.5)',
    name: 'CIPHER'
  },
  infiltrator: {
    primary: '#00D4FF',
    secondary: '#6B2FB5',
    accent: '#9D4EDD',
    highlight: '#FF10F0',
    glow: 'rgba(0, 212, 255, 0.5)',
    name: 'GHOST'
  }
};

// Theme context
export const ThemeContext = createContext<{
  config: ThemeConfig;
  setTheme: (theme: AgentTheme) => void;
  toggleHighContrast: () => void;
  colors: ThemeColors;
} | null>(null);

// Custom hook for theme management
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme hook implementation
export function useThemeManager(initialTheme: AgentTheme = 'hacker') {
  const [theme, setThemeState] = useState<AgentTheme>(initialTheme);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect system preferences
  useEffect(() => {
    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(highContrastQuery.matches);

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    highContrastQuery.addEventListener('change', handleHighContrastChange);

    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(reducedMotionQuery.matches);

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Set theme data attribute
    root.setAttribute('data-theme', theme);

    // Apply theme colors as CSS custom properties
    const colors = THEME_COLORS[theme];
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-secondary', colors.secondary);
    root.style.setProperty('--theme-accent', colors.accent);
    root.style.setProperty('--theme-highlight', colors.highlight);
    root.style.setProperty('--theme-glow', colors.glow);
    root.style.setProperty('--theme-name', `"${colors.name}"`);

    // Apply accessibility preferences
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Store theme preference
    localStorage.setItem('nexus-theme', theme);
    localStorage.setItem('nexus-high-contrast', isHighContrast.toString());

  }, [theme, isHighContrast, reducedMotion]);

  // Load saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('nexus-theme') as AgentTheme;
    const savedHighContrast = localStorage.getItem('nexus-high-contrast') === 'true';

    if (savedTheme && THEME_COLORS[savedTheme]) {
      setThemeState(savedTheme);
    }

    if (savedHighContrast !== null) {
      setIsHighContrast(savedHighContrast);
    }
  }, []);

  const setTheme = useCallback((newTheme: AgentTheme) => {
    if (THEME_COLORS[newTheme]) {
      setThemeState(newTheme);

      // Announce theme change for screen readers
      const announcement = `Theme changed to ${THEME_COLORS[newTheme].name}`;
      announceToScreenReader(announcement);
    }
  }, []);

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast(prev => {
      const newValue = !prev;
      const announcement = `High contrast mode ${newValue ? 'enabled' : 'disabled'}`;
      announceToScreenReader(announcement);
      return newValue;
    });
  }, []);

  const config: ThemeConfig = {
    theme,
    colors: THEME_COLORS[theme],
    isDark: true, // Nexus Protocol is always dark theme
    isHighContrast,
    reducedMotion
  };

  return {
    config,
    setTheme,
    toggleHighContrast,
    colors: THEME_COLORS[theme]
  };
}

// Utility function to announce changes to screen readers
function announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Utility function to get theme-aware color
export function getThemeColor(colorKey: keyof ThemeColors, theme?: AgentTheme): string {
  const currentTheme = theme || (document.documentElement.getAttribute('data-theme') as AgentTheme) || 'hacker';
  return THEME_COLORS[currentTheme][colorKey];
}

// Utility function to check if current theme matches
export function isCurrentTheme(theme: AgentTheme): boolean {
  return document.documentElement.getAttribute('data-theme') === theme;
}

// Utility function to get CSS custom property value
export function getCSSCustomProperty(property: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
}

// Utility function to set CSS custom property
export function setCSSCustomProperty(property: string, value: string): void {
  document.documentElement.style.setProperty(property, value);
}

// Export theme constants for external use
export { THEME_COLORS };