/**
 * NEXUS PROTOCOL - Theme Context Provider
 * Provides theme management across the application
 * Version: 1.0.0
 * Last Updated: December 20, 2025
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useThemeManager, type AgentTheme, type ThemeConfig, type ThemeColors } from '../hooks/useTheme.js';

interface ThemeContextType {
  config: ThemeConfig;
  setTheme: (theme: AgentTheme) => void;
  toggleHighContrast: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: AgentTheme;
}

export function ThemeProvider({ children, initialTheme = 'hacker' }: ThemeProviderProps) {
  const themeManager = useThemeManager(initialTheme);

  return (
    <ThemeContext.Provider value={themeManager}>
      {children}
    </ThemeContext.Provider>
  );
}