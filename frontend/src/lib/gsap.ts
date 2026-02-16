/**
 * NEXUS PROTOCOL - GSAP Configuration
 * Centralized GSAP setup and utilities
 * Version: 1.0.0
 * Last Updated: December 20, 2025
 */

import { gsap } from 'gsap';

// Register GSAP plugins if needed
// Note: Removed Flip import to fix case-sensitivity issue
// import { Flip } from 'gsap/Flip';
// gsap.registerPlugin(Flip);

// Global GSAP configuration
gsap.defaults({
  ease: "power2.out",
  duration: 0.6
});

// Animation utilities
export const NexusAnimations = {
  // Easing presets
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
  
  // Component entrance animations
  enterFromLeft: (elements: any, options: any = {}) => {
    return gsap.fromTo(elements, 
      { x: -50, opacity: 0 },
      { 
        x: 0, 
        opacity: 1, 
        duration: options.duration || 0.6,
        ease: options.ease || "power2.out",
        stagger: options.stagger || 0.1
      }
    );
  },
  
  enterFromRight: (elements: any, options: any = {}) => {
    return gsap.fromTo(elements,
      { x: 50, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: options.duration || 0.6,
        ease: options.ease || "power2.out",
        stagger: options.stagger || 0.1
      }
    );
  },
  
  enterFromBottom: (elements: any, options: any = {}) => {
    return gsap.fromTo(elements,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: options.duration || 0.6,
        ease: options.ease || "power2.out",
        stagger: options.stagger || 0.1
      }
    );
  }
};

export { gsap };
export default gsap;