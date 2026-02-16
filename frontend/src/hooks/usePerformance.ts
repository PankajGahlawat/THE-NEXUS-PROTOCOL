/**
 * NEXUS PROTOCOL - Performance Monitoring Hook
 * Real-time performance tracking and optimization
 * Version: 1.0.0
 * Last Updated: December 20, 2025
 */

import { useEffect, useCallback, useRef, useState } from 'react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  animationCount: number;
  isLowPerformance: boolean;
}

interface PerformanceConfig {
  enableMonitoring: boolean;
  fpsThreshold: number;
  memoryThreshold: number;
  renderTimeThreshold: number;
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableMonitoring: typeof window !== 'undefined' && window.location?.hostname === 'localhost',
  fpsThreshold: 30, // Below 30 FPS is considered low performance
  memoryThreshold: 50 * 1024 * 1024, // 50MB
  renderTimeThreshold: 16.67 // 60 FPS = 16.67ms per frame
};

export function usePerformance(config: Partial<PerformanceConfig> = {}) {
  const performanceConfig = { ...DEFAULT_CONFIG, ...config };
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    animationCount: 0,
    isLowPerformance: false
  });

  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());
  const renderStartRef = useRef<number>(0);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // FPS monitoring
  const measureFPS = useCallback(() => {
    const now = Date.now();
    frameCountRef.current++;

    if (now - lastTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
      
      setMetrics(prev => ({
        ...prev,
        fps,
        isLowPerformance: fps < performanceConfig.fpsThreshold
      }));

      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    if (performanceConfig.enableMonitoring) {
      animationFrameRef.current = requestAnimationFrame(measureFPS);
    }
  }, [performanceConfig.enableMonitoring, performanceConfig.fpsThreshold]);

  // Memory usage monitoring
  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize;
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage,
        isLowPerformance: prev.isLowPerformance || memoryUsage > performanceConfig.memoryThreshold
      }));
    }
  }, [performanceConfig.memoryThreshold]);

  // Render time monitoring
  const startRenderMeasurement = useCallback(() => {
    renderStartRef.current = Date.now();
  }, []);

  const endRenderMeasurement = useCallback(() => {
    const renderTime = Date.now() - renderStartRef.current;
    
    setMetrics(prev => ({
      ...prev,
      renderTime,
      isLowPerformance: prev.isLowPerformance || renderTime > performanceConfig.renderTimeThreshold
    }));
  }, [performanceConfig.renderTimeThreshold]);

  // Performance optimization suggestions
  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = [];

    if (metrics.fps < 30) {
      suggestions.push('Consider reducing animation complexity or frequency');
    }

    if (metrics.memoryUsage > 50 * 1024 * 1024) {
      suggestions.push('High memory usage detected - check for memory leaks');
    }

    if (metrics.renderTime > 16.67) {
      suggestions.push('Slow render times - consider component memoization');
    }

    if (metrics.animationCount > 10) {
      suggestions.push('Too many concurrent animations - consider batching');
    }

    return suggestions;
  }, [metrics]);

  // Adaptive performance settings
  const getAdaptiveSettings = useCallback(() => {
    const isLowEnd = metrics.isLowPerformance;
    
    return {
      animationDuration: isLowEnd ? 0.3 : 0.6,
      particleCount: isLowEnd ? 10 : 50,
      shadowQuality: isLowEnd ? 'low' : 'high',
      enableBlur: !isLowEnd,
      enableParticles: !isLowEnd,
      maxConcurrentAnimations: isLowEnd ? 3 : 10
    };
  }, [metrics.isLowPerformance]);

  // Initialize monitoring
  useEffect(() => {
    if (!performanceConfig.enableMonitoring) return;

    // Start FPS monitoring
    measureFPS();

    // Memory monitoring interval
    const memoryInterval = setInterval(measureMemory, 5000);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(memoryInterval);
    };
  }, [performanceConfig.enableMonitoring, measureFPS, measureMemory]);

  // Performance warning system
  useEffect(() => {
    if (metrics.isLowPerformance && performanceConfig.enableMonitoring) {
      console.warn('⚠️ Low performance detected:', {
        fps: metrics.fps,
        memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        renderTime: `${metrics.renderTime.toFixed(2)}ms`,
        suggestions: getOptimizationSuggestions()
      });
    }
  }, [metrics.isLowPerformance, performanceConfig.enableMonitoring, getOptimizationSuggestions]);

  return {
    metrics,
    startRenderMeasurement,
    endRenderMeasurement,
    getOptimizationSuggestions,
    getAdaptiveSettings,
    isLowPerformance: metrics.isLowPerformance
  };
}

export default usePerformance;