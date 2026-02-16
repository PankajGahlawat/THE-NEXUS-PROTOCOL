/**
 * NEXUS PROTOCOL - Performance-Optimized Animation Library
 * GSAP-based animations with GPU acceleration and performance monitoring
 * Version: 3.0.0 - Performance Enhanced
 * Last Updated: December 20, 2025
 */

import { gsap } from 'gsap';

// Performance monitoring
let animationCount = 0;
const MAX_CONCURRENT_ANIMATIONS = 10;

// Debounce utility for performance
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: number;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
}

// Animation performance monitor
function trackAnimation(name: string, timeline: gsap.core.Timeline) {
  animationCount++;
  
  if (animationCount > MAX_CONCURRENT_ANIMATIONS) {
    console.warn(`⚠️ High animation count: ${animationCount}. Consider optimizing.`);
  }
  
  timeline.eventCallback('onComplete', () => {
    animationCount--;
  });
  
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    console.log(`🎬 Animation started: ${name} (Active: ${animationCount})`);
  }
}

// Global GSAP Configuration for Performance
gsap.defaults({
  ease: "power2.out",
  duration: 0.6,
  force3D: true, // Force GPU acceleration
  autoAlpha: 1 // Use autoAlpha instead of opacity for better performance
});

// Set global performance settings
gsap.config({
  force3D: true,
  nullTargetWarn: false
});

export const NexusAnimations = {
  // Easing presets optimized for performance
  EASINGS: {
    smooth: "power2.out",
    snap: "power3.out", 
    elastic: "elastic.out(1, 0.7)",
    bounce: "back.out(1.1)",
    linear: "none"
  },
  
  // Timing constants
  TIMING: {
    instant: 0.15,
    fast: 0.3,
    normal: 0.6,
    slow: 0.9,
    verySlow: 1.2
  },

  // Performance-optimized entrance animations
  enterFromLeft: (elements: string | Element | Element[], options: any = {}) => {
    const tl = gsap.timeline({ paused: true });
    
    tl.fromTo(elements, 
      { 
        x: -30, 
        autoAlpha: 0,
        rotationY: -15 // Add subtle 3D effect
      },
      { 
        x: 0, 
        autoAlpha: 1,
        rotationY: 0,
        duration: options.duration || 0.6,
        ease: options.ease || "power2.out",
        stagger: options.stagger || 0.1,
        force3D: true
      }
    );

    trackAnimation('enterFromLeft', tl);
    
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => tl.play());
    
    return tl;
  },
  
  enterFromRight: (elements: string | Element | Element[], options: any = {}) => {
    const tl = gsap.timeline({ paused: true });
    
    tl.fromTo(elements,
      { 
        x: 30, 
        autoAlpha: 0,
        rotationY: 15
      },
      {
        x: 0,
        autoAlpha: 1,
        rotationY: 0,
        duration: options.duration || 0.6,
        ease: options.ease || "power2.out",
        stagger: options.stagger || 0.1,
        force3D: true
      }
    );

    trackAnimation('enterFromRight', tl);
    requestAnimationFrame(() => tl.play());
    
    return tl;
  },
  
  enterFromBottom: (elements: string | Element | Element[], options: any = {}) => {
    const tl = gsap.timeline({ paused: true });
    
    tl.fromTo(elements,
      { 
        y: 20, 
        autoAlpha: 0,
        scale: 0.95
      },
      {
        y: 0,
        autoAlpha: 1,
        scale: 1,
        duration: options.duration || 0.6,
        ease: options.ease || "power2.out",
        stagger: options.stagger || 0.1,
        force3D: true
      }
    );

    trackAnimation('enterFromBottom', tl);
    requestAnimationFrame(() => tl.play());
    
    return tl;
  },

  // Optimized interactive feedback animations
  buttonPress: (element: string | Element) => {
    return gsap.to(element, {
      scale: 0.95,
      duration: 0.1,
      ease: "power2.out",
      yoyo: true,
      repeat: 1,
      force3D: true
    });
  },
  
  cardHover: (element: string | Element) => {
    return gsap.to(element, {
      y: -2,
      scale: 1.02,
      duration: 0.3,
      ease: "power2.out",
      force3D: true
    });
  },
  
  cardHoverOut: (element: string | Element) => {
    return gsap.to(element, {
      y: 0,
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
      force3D: true
    });
  },

  // Optimized theme transition with batched updates
  themeTransition: (elements: string | Element | Element[], newTheme: string) => {
    const tl = gsap.timeline();
    
    // Batch DOM reads/writes for better performance
    tl.to(elements, {
      autoAlpha: 0.8,
      duration: 0.2,
      ease: "power2.in",
      force3D: true
    })
    .call(() => {
      // Batch theme application
      requestAnimationFrame(() => {
        document.documentElement.setAttribute('data-theme', newTheme);
      });
    })
    .to(elements, {
      autoAlpha: 1,
      duration: 0.4,
      ease: "power2.out",
      force3D: true
    });
    
    trackAnimation('themeTransition', tl);
    return tl;
  },

  // Performance-optimized loading animations
  loadingSpinner: (element: string | Element) => {
    return gsap.to(element, {
      rotation: 360,
      duration: 1,
      ease: "none",
      repeat: -1,
      transformOrigin: "center center",
      force3D: true
    });
  },
  
  loadingPulse: (elements: string | Element | Element[]) => {
    return gsap.to(elements, {
      autoAlpha: 0.5,
      duration: 1,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      stagger: 0.2,
      force3D: true
    });
  },

  // Mission-specific animations
  objectiveComplete: (element: string | Element) => {
    const tl = gsap.timeline();
    
    tl.to(element, {
      backgroundColor: '#36FFB0',
      scale: 1.05,
      duration: 0.2,
      ease: "power2.out",
      force3D: true
    })
    .to(element, {
      scale: 1,
      duration: 0.3,
      ease: "elastic.out(1, 0.5)",
      force3D: true
    });
    
    trackAnimation('objectiveComplete', tl);
    return tl;
  },

  traceUpdate: (element: string | Element, newLevel: number) => {
    const color = newLevel < 25 ? '#36FFB0' : 
                  newLevel < 50 ? '#F1C76C' :
                  newLevel < 75 ? '#FF4655' : '#FF1744';
    
    return gsap.to(element, {
      rotation: (newLevel / 100) * 360,
      borderTopColor: color,
      duration: 0.5,
      ease: "power2.out",
      force3D: true
    });
  },

  // Agent selection animations
  agentReveal: (elements: string | Element | Element[]) => {
    const tl = gsap.timeline({ paused: true });
    
    tl.fromTo(elements,
      {
        autoAlpha: 0,
        y: 30,
        scale: 0.9,
        rotationX: -15
      },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        rotationX: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        force3D: true
      }
    );

    trackAnimation('agentReveal', tl);
    requestAnimationFrame(() => tl.play());
    
    return tl;
  },

  agentSelect: (element: string | Element) => {
    const tl = gsap.timeline();
    
    tl.to(element, {
      scale: 1.05,
      duration: 0.2,
      ease: "power2.out",
      force3D: true
    })
    .to(element, {
      scale: 1.02,
      duration: 0.3,
      ease: "elastic.out(1, 0.7)",
      force3D: true
    });
    
    trackAnimation('agentSelect', tl);
    return tl;
  },

  // System alert animations
  systemAlert: (elements: string | Element | Element[]) => {
    const tl = gsap.timeline();
    
    tl.to(elements, {
      backgroundColor: '#FF4655',
      duration: 0.1,
      ease: "power2.out",
      force3D: true
    })
    .to(elements, {
      y: 2,
      duration: 0.05,
      repeat: 5,
      yoyo: true,
      ease: "sine.inOut",
      force3D: true
    })
    .to(elements, {
      backgroundColor: 'transparent',
      y: 0,
      duration: 0.3,
      ease: "power2.out",
      force3D: true
    });
    
    trackAnimation('systemAlert', tl);
    return tl;
  },

  // Utility functions
  killAll: () => {
    gsap.killTweensOf("*");
    animationCount = 0;
  },

  // Performance monitoring
  getActiveAnimations: () => animationCount,
  
  // Responsive animation scaling
  setAnimationScale: (scale: number) => {
    gsap.globalTimeline.timeScale(scale);
  },

  // Batch animation for better performance
  batchAnimate: (animations: Array<() => gsap.core.Timeline>) => {
    const tl = gsap.timeline();
    
    animations.forEach((animFn, index) => {
      tl.add(animFn(), index * 0.1);
    });
    
    trackAnimation('batchAnimate', tl);
    return tl;
  }
};

// Debounced animation functions for high-frequency updates
export const DebouncedAnimations = {
  traceUpdate: debounce(NexusAnimations.traceUpdate, 100),
  themeTransition: debounce(NexusAnimations.themeTransition, 200)
};

// Performance utilities
export const AnimationUtils = {
  // Check if reduced motion is preferred
  shouldReduceMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Adaptive animation based on device performance
  getOptimalDuration: (baseDuration: number) => {
    const isLowEnd = navigator.hardwareConcurrency <= 2;
    const isReducedMotion = AnimationUtils.shouldReduceMotion();
    
    if (isReducedMotion) return baseDuration * 0.5;
    if (isLowEnd) return baseDuration * 0.7;
    return baseDuration;
  },

  // Memory cleanup
  cleanup: () => {
    NexusAnimations.killAll();
    gsap.globalTimeline.clear();
  }
};

// Initialize performance monitoring
if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
  // Monitor animation performance
  setInterval(() => {
    if (animationCount > 5) {
      console.warn(`🎬 High animation load: ${animationCount} active animations`);
    }
  }, 5000);
}

export default NexusAnimations;