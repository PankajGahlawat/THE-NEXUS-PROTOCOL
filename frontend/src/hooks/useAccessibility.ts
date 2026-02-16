/**
 * NEXUS PROTOCOL - Accessibility Utilities Hook
 * Provides accessibility features and utilities
 * Version: 2.0.0
 * Last Updated: December 20, 2025
 */

import { useEffect, useCallback, useRef, useState } from 'react';

export interface AccessibilityConfig {
  announceChanges: boolean;
  focusManagement: boolean;
  keyboardNavigation: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderOptimizations: boolean;
}

export interface FocusManagement {
  trapFocus: (container: HTMLElement) => () => void;
  restoreFocus: (element?: HTMLElement) => void;
  moveFocusToNext: () => void;
  moveFocusToPrevious: () => void;
  announceLiveRegion: (message: string, priority?: 'polite' | 'assertive') => void;
}

// Debounce utility for performance optimization
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: number;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
}

// Default accessibility configuration
const DEFAULT_CONFIG: AccessibilityConfig = {
  announceChanges: true,
  focusManagement: true,
  keyboardNavigation: true,
  reducedMotion: false,
  highContrast: false,
  screenReaderOptimizations: true
};

export function useAccessibility(config: Partial<AccessibilityConfig> = {}) {
  const [accessibilityConfig, setAccessibilityConfig] = useState<AccessibilityConfig>({
    ...DEFAULT_CONFIG,
    ...config
  });

  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const focusHistoryRef = useRef<HTMLElement[]>([]);

  // Initialize accessibility features
  useEffect(() => {
    // Create live region for announcements
    if (accessibilityConfig.announceChanges && !liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.id = 'nexus-live-region';
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    // Detect system preferences
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

    const updateMotionPreference = (e: MediaQueryListEvent) => {
      setAccessibilityConfig(prev => ({ ...prev, reducedMotion: e.matches }));
    };

    const updateContrastPreference = (e: MediaQueryListEvent) => {
      setAccessibilityConfig(prev => ({ ...prev, highContrast: e.matches }));
    };

    reducedMotionQuery.addEventListener('change', updateMotionPreference);
    highContrastQuery.addEventListener('change', updateContrastPreference);

    // Set initial values
    setAccessibilityConfig(prev => ({
      ...prev,
      reducedMotion: reducedMotionQuery.matches,
      highContrast: highContrastQuery.matches
    }));

    return () => {
      reducedMotionQuery.removeEventListener('change', updateMotionPreference);
      highContrastQuery.removeEventListener('change', updateContrastPreference);
      
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current);
        liveRegionRef.current = null;
      }
    };
  }, [accessibilityConfig.announceChanges]);

  // Optimized live region announcements with debouncing
  const announceLiveRegion = useCallback(
    debounce((message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (!accessibilityConfig.announceChanges || !liveRegionRef.current) return;

      // Use DocumentFragment for better performance
      const fragment = document.createDocumentFragment();
      const textNode = document.createTextNode(message);
      fragment.appendChild(textNode);

      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.replaceChildren(fragment);

      // Clear after announcement with cleanup
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    }, 100),
    [accessibilityConfig.announceChanges]
  );

  // Focus management utilities
  const trapFocus = useCallback((container: HTMLElement) => {
    if (!accessibilityConfig.focusManagement) return () => {};

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        restoreFocus();
      }
    };

    // Store current focus
    const previouslyFocusedElement = document.activeElement as HTMLElement;
    focusHistoryRef.current.push(previouslyFocusedElement);

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Add event listeners
    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
    };
  }, [accessibilityConfig.focusManagement]);

  const restoreFocus = useCallback((element?: HTMLElement) => {
    if (!accessibilityConfig.focusManagement) return;

    const targetElement = element || focusHistoryRef.current.pop();
    if (targetElement && typeof targetElement.focus === 'function') {
      targetElement.focus();
    }
  }, [accessibilityConfig.focusManagement]);

  const moveFocusToNext = useCallback(() => {
    if (!accessibilityConfig.keyboardNavigation) return;

    const focusableElements = document.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    focusableElements[nextIndex]?.focus();
  }, [accessibilityConfig.keyboardNavigation]);

  const moveFocusToPrevious = useCallback(() => {
    if (!accessibilityConfig.keyboardNavigation) return;

    const focusableElements = document.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement);
    const previousIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    focusableElements[previousIndex]?.focus();
  }, [accessibilityConfig.keyboardNavigation]);

  // Keyboard navigation hook
  const useKeyboardNavigation = useCallback((
    onEnter?: () => void,
    onEscape?: () => void,
    onArrowUp?: () => void,
    onArrowDown?: () => void,
    onArrowLeft?: () => void,
    onArrowRight?: () => void
  ) => {
    useEffect(() => {
      if (!accessibilityConfig.keyboardNavigation) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
          case 'Enter':
            if (onEnter) {
              e.preventDefault();
              onEnter();
            }
            break;
          case 'Escape':
            if (onEscape) {
              e.preventDefault();
              onEscape();
            }
            break;
          case 'ArrowUp':
            if (onArrowUp) {
              e.preventDefault();
              onArrowUp();
            }
            break;
          case 'ArrowDown':
            if (onArrowDown) {
              e.preventDefault();
              onArrowDown();
            }
            break;
          case 'ArrowLeft':
            if (onArrowLeft) {
              e.preventDefault();
              onArrowLeft();
            }
            break;
          case 'ArrowRight':
            if (onArrowRight) {
              e.preventDefault();
              onArrowRight();
            }
            break;
          case 'Tab':
            if (e.shiftKey) {
              moveFocusToPrevious();
            } else {
              moveFocusToNext();
            }
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]);
  }, [accessibilityConfig.keyboardNavigation, moveFocusToNext, moveFocusToPrevious]);

  // Screen reader utilities
  const announcePageChange = useCallback((pageName: string) => {
    announceLiveRegion(`Navigated to ${pageName}`, 'assertive');
  }, [announceLiveRegion]);

  const announceStateChange = useCallback((stateName: string, newValue: string) => {
    announceLiveRegion(`${stateName} changed to ${newValue}`, 'polite');
  }, [announceLiveRegion]);

  const announceError = useCallback((errorMessage: string) => {
    announceLiveRegion(`Error: ${errorMessage}`, 'assertive');
  }, [announceLiveRegion]);

  const announceSuccess = useCallback((successMessage: string) => {
    announceLiveRegion(`Success: ${successMessage}`, 'polite');
  }, [announceLiveRegion]);

  // ARIA utilities
  const setAriaLabel = useCallback((element: HTMLElement, label: string) => {
    element.setAttribute('aria-label', label);
  }, []);

  const setAriaDescribedBy = useCallback((element: HTMLElement, describedById: string) => {
    element.setAttribute('aria-describedby', describedById);
  }, []);

  const setAriaExpanded = useCallback((element: HTMLElement, expanded: boolean) => {
    element.setAttribute('aria-expanded', expanded.toString());
  }, []);

  const setAriaSelected = useCallback((element: HTMLElement, selected: boolean) => {
    element.setAttribute('aria-selected', selected.toString());
  }, []);

  // Focus management object
  const focusManagement: FocusManagement = {
    trapFocus,
    restoreFocus,
    moveFocusToNext,
    moveFocusToPrevious,
    announceLiveRegion
  };

  return {
    config: accessibilityConfig,
    updateConfig: setAccessibilityConfig,
    focusManagement,
    useKeyboardNavigation,
    announcePageChange,
    announceStateChange,
    announceError,
    announceSuccess,
    setAriaLabel,
    setAriaDescribedBy,
    setAriaExpanded,
    setAriaSelected,
    announceLiveRegion
  };
}

// Utility function to check if element is focusable
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ];

  return focusableSelectors.some(selector => element.matches(selector));
}

// Utility function to get all focusable elements within a container
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
}

// Utility function to create accessible ID
export function createAccessibleId(prefix: string = 'nexus'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
}