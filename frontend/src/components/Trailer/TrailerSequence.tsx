/**
 * NEXUS PROTOCOL - Cinematic Trailer Sequence
 * 55-second cinematic introduction with voiceover timeline
 * Enhanced with aaa folder agent animation references
 * Version: 2.1.0 - Enhanced Agent Animations
 * Last Updated: December 20, 2025
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from '../../lib/gsap.js';
import { Zap, Eye, Brain, AlertTriangle, Lock } from 'lucide-react';
import '../../styles/trailer-cinematic.css';

export default function TrailerSequence() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const pixelRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const uiOverlayRef = useRef<HTMLDivElement>(null);
  const systemAlertRef = useRef<HTMLDivElement>(null);
  const vaultRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const voiceoverRef = useRef<HTMLDivElement>(null);

  const [currentVO, setCurrentVO] = useState('');

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem('nexus_trailer_shown', 'true');
        setTimeout(() => navigate('/login'), 1000);
      }
    });

    // 🎬 CINEMATIC TRAILER TIMELINE (55 seconds)

    // 0-5s: Black → pixel ignites
    tl.set(containerRef.current, { backgroundColor: '#000000' })
      .call(() => setCurrentVO('Every system trusts something.'))
      .fromTo(pixelRef.current,
        { scale: 0, opacity: 0, backgroundColor: '#FF1744' },
        { scale: 1, opacity: 1, duration: 2, ease: 'power2.out' }
      )
      .to(pixelRef.current, {
        scale: 50,
        opacity: 0.8,
        duration: 3,
        ease: 'power3.out'
      }, '-=1')

      // 6-15s: City reveal with UI overlays
      .call(() => setCurrentVO('Trust is the weakness.'), [], 6)
      .to(containerRef.current, {
        backgroundColor: '#0A0A0F',
        duration: 1
      }, 6)
      .fromTo(cityRef.current,
        { opacity: 0, scale: 1.2, y: 50 },
        { opacity: 1, scale: 1, y: 0, duration: 3, ease: 'power2.out' },
        6.5
      )
      .fromTo(uiOverlayRef.current,
        { opacity: 0, x: -100 },
        { opacity: 0.8, x: 0, duration: 2, ease: 'power2.out', stagger: 0.3 },
        8
      )

      // 16-25s: Agent role flashes with rapid cuts (Enhanced from aaa reference)
      .call(() => setCurrentVO('Choose how you break in.'), [], 16)
      .to([cityRef.current, uiOverlayRef.current], {
        opacity: 0,
        duration: 0.5
      }, 16)

      // GHOST Agent Flash
      .set('#role-ghost', { autoAlpha: 1 }, 16.5)
      .fromTo('#role-ghost .role-img',
        { x: 50, opacity: 0, scale: 0.8 },
        { x: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' },
        16.5
      )
      .fromTo('#role-ghost .role-text',
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
        16.5
      )
      .to('#role-ghost', { autoAlpha: 0, duration: 0.2 }, 18.3)

      // CIPHER Agent Flash
      .set('#role-cipher', { autoAlpha: 1 }, 18.5)
      .fromTo('#role-cipher .role-img',
        { x: 50, opacity: 0, scale: 0.8 },
        { x: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' },
        18.5
      )
      .fromTo('#role-cipher .role-text',
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
        18.5
      )
      .to('#role-cipher', { autoAlpha: 0, duration: 0.2 }, 20.3)

      // NEXUS Agent Flash
      .set('#role-nexus', { autoAlpha: 1 }, 20.5)
      .fromTo('#role-nexus .role-img',
        { x: 50, opacity: 0, scale: 0.8 },
        { x: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' },
        20.5
      )
      .fromTo('#role-nexus .role-text',
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
        20.5
      )
      .to('#role-nexus', { autoAlpha: 0, duration: 0.2 }, 22.3)

      // Final agent selection simulation
      .set('#agent-selection', { autoAlpha: 1 }, 23)
      .fromTo('.choice-card',
        { y: 50, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, stagger: 0.2, duration: 0.8, ease: 'back.out(1.7)' },
        23
      )
      .to('#choice-ghost', {
        scale: 1.1,
        borderColor: '#0ac8b9',
        boxShadow: '0 0 30px #0ac8b9',
        duration: 0.5
      }, 24)
      .to('.choice-card:not(#choice-ghost)', {
        opacity: 0.3,
        scale: 0.9,
        duration: 0.5
      }, 24)
      .to('#agent-selection', { autoAlpha: 0, duration: 0.5 }, 25)

      // 26-35s: System breaker alert with red inversion
      .call(() => setCurrentVO('And what you leave behind.'), [], 26)
      .to(containerRef.current, {
        backgroundColor: '#FF1744',
        duration: 0.2
      }, 26)
      .fromTo(systemAlertRef.current,
        { opacity: 0, y: 100, rotationX: -90 },
        { opacity: 1, y: 0, rotationX: 0, duration: 2, ease: 'back.out(1.7)' },
        26.5
      )
      .to(containerRef.current, {
        backgroundColor: '#000000',
        duration: 1,
        ease: 'power2.in'
      }, 33)

      // 36-48s: Black Vault sequence
      .call(() => setCurrentVO('There is no clean exit.'), [], 36)
      .fromTo(vaultRef.current,
        { opacity: 0, scale: 0.5, rotationY: -180 },
        { opacity: 1, scale: 1, rotationY: 0, duration: 4, ease: 'power3.out' },
        36
      )
      .to(vaultRef.current, {
        scale: 1.1,
        duration: 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 1
      }, 42)
      .to(vaultRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 2,
        ease: 'power2.in'
      }, 46)

      // 49-55s: Silence → Logo assembly
      .call(() => setCurrentVO(''), [], 49)
      .set(containerRef.current, { backgroundColor: '#000000' }, 49)
      .fromTo(logoRef.current,
        {
          opacity: 0,
          scale: 0.3,
          rotationY: 180,
          y: 100
        },
        {
          opacity: 1,
          scale: 1,
          rotationY: 0,
          y: 0,
          duration: 4,
          ease: 'power3.out'
        },
        50
      )
      .call(() => setCurrentVO('NEXUS PROTOCOL.'), [], 53)
      .to(logoRef.current, {
        backgroundImage: 'linear-gradient(135deg, #FF1744, #00D4FF, #0AC8B9)',
        webkitBackgroundClip: 'text',
        webkitTextFillColor: 'transparent',
        duration: 2
      }, 53);

    return () => {
      tl.kill();
    };
  }, [navigate]);

  const handleSkip = () => {
    sessionStorage.setItem('nexus_trailer_shown', 'true');
    navigate('/login');
  };

  return (
    <div
      ref={containerRef}
      className="trailer-container cursor-pointer"
      onClick={handleSkip}
    >
      {/* Skip Button Indicator */}
      <div className="absolute bottom-8 right-8 z-50 animate-pulse">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="text-arcane-teal font-mono text-sm border border-arcane-teal/30 px-4 py-2 bg-black/50 hover:bg-arcane-teal/10 transition-colors"
        >
          SKIP SEQUENCE &gt;&gt;
        </button>
      </div>

      {/* Pixel Ignition */}
      <div
        ref={pixelRef}
        className="pixel-ignite absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0"
      />

      {/* City Reveal */}
      <div
        ref={cityRef}
        className="city-backdrop absolute inset-0 opacity-0"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-arcane-dark to-transparent" />
      </div>

      {/* UI Overlays */}
      <div ref={uiOverlayRef} className="ui-overlay absolute inset-0 opacity-0">
        <div className="absolute top-8 left-8 font-mono text-arcane-teal text-sm">
          SYSTEM_STATUS: ACTIVE
        </div>
        <div className="absolute top-8 right-8 font-mono text-arcane-orange text-sm">
          TRACE_LEVEL: 23%
        </div>
        <div className="absolute bottom-8 left-8 font-mono text-arcane-muted text-xs">
          CONNECTION_SECURE
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-64 h-64 border border-arcane-teal opacity-30 animate-pulse" />
        </div>
      </div>

      {/* Enhanced Agent Role Flashes - Based on aaa reference */}
      <div id="role-ghost" className="scene absolute inset-0 flex items-center justify-center invisible bg-arcane-dark">
        <div className="flex items-center gap-8">
          <Zap size={120} className="role-img text-arcane-teal" />
          <div className="role-text text-left">
            <h2 className="text-6xl font-display font-bold text-white">GHOST</h2>
            <p className="text-arcane-teal tracking-widest">STEALTH SPECIALIST</p>
          </div>
        </div>
      </div>

      <div id="role-cipher" className="scene absolute inset-0 flex items-center justify-center invisible bg-arcane-dark">
        <div className="flex items-center gap-8">
          <Eye size={120} className="role-img text-arcane-purple" />
          <div className="role-text text-left">
            <h2 className="text-6xl font-display font-bold text-white">CIPHER</h2>
            <p className="text-arcane-purple tracking-widest">DATA ANALYST</p>
          </div>
        </div>
      </div>

      <div id="role-nexus" className="scene absolute inset-0 flex items-center justify-center invisible bg-arcane-dark">
        <div className="flex items-center gap-8">
          <Brain size={120} className="role-img text-arcane-gold" />
          <div className="role-text text-left">
            <h2 className="text-6xl font-display font-bold text-white">NEXUS</h2>
            <p className="text-arcane-gold tracking-widest">SYSTEM BREAKER</p>
          </div>
        </div>
      </div>

      {/* Agent Selection Scene */}
      <div id="agent-selection" className="scene absolute inset-0 flex flex-col items-center justify-center invisible gap-10">
        <h2 className="text-3xl font-bold tracking-widest text-white">CHOOSE YOUR PATH</h2>
        <div className="flex gap-8">
          <div id="choice-ghost" className="choice-card w-64 h-80 bg-arcane-card border border-white/10 p-6 flex flex-col items-center justify-center gap-4 transition-all">
            <Zap size={64} className="text-arcane-teal" />
            <h3 className="text-xl font-bold text-white">GHOST</h3>
            <p className="text-sm text-arcane-muted text-center">Stealth Specialist</p>
          </div>
          <div id="choice-cipher" className="choice-card w-64 h-80 bg-arcane-card border border-white/10 p-6 flex flex-col items-center justify-center gap-4 transition-all">
            <Eye size={64} className="text-arcane-purple" />
            <h3 className="text-xl font-bold text-white">CIPHER</h3>
            <p className="text-sm text-arcane-muted text-center">Data Analyst</p>
          </div>
          <div id="choice-nexus" className="choice-card w-64 h-80 bg-arcane-card border border-white/10 p-6 flex flex-col items-center justify-center gap-4 transition-all">
            <Brain size={64} className="text-arcane-gold" />
            <h3 className="text-xl font-bold text-white">NEXUS</h3>
            <p className="text-sm text-arcane-muted text-center">System Breaker</p>
          </div>
        </div>
      </div>

      {/* System Alert - Enhanced with aaa reference */}
      <div
        ref={systemAlertRef}
        className="absolute inset-0 flex items-center justify-center opacity-0"
      >
        <div className="text-center">
          <AlertTriangle size={150} className="text-arcane-danger mx-auto mb-8 animate-pulse" />
          <div className="system-alert text-6xl font-bold text-white mb-8">
            SYSTEM BREACH DETECTED
          </div>
          <div className="text-2xl text-arcane-red font-mono">
            TRACE LEVEL: CRITICAL
          </div>
        </div>
        <div className="crack-line absolute top-0 left-1/3 w-[1px] h-full bg-arcane-danger/50" style={{ clipPath: 'inset(0 100% 0 0)' }} />
        <div className="crack-line absolute top-1/3 left-0 w-full h-[1px] bg-arcane-danger/50" style={{ clipPath: 'inset(0 100% 0 0)' }} />
      </div>

      {/* Black Vault - Enhanced with aaa reference */}
      <div
        ref={vaultRef}
        className="vault-container absolute inset-0 flex items-center justify-center opacity-0"
      >
        <div className="vault-door relative">
          <div className="w-96 h-96 border-4 border-arcane-teal bg-black/90 flex flex-col items-center justify-center gap-4">
            <Lock size={80} className="text-arcane-teal" />
            <div className="text-4xl font-mono text-arcane-teal">
              █ CLASSIFIED █
            </div>
            <div className="text-sm font-mono text-arcane-muted">
              ACCESS DENIED
            </div>
          </div>
        </div>
      </div>

      {/* Final Logo */}
      <div
        ref={logoRef}
        className="logo-assembly absolute inset-0 flex items-center justify-center opacity-0"
      >
        <div className="text-center">
          <div className="logo-text text-8xl font-bold font-display mb-4">
            NEXUS
          </div>
          <div className="text-4xl font-mono text-arcane-teal">
            PROTOCOL
          </div>
        </div>
      </div>

      {/* Voiceover Display */}
      <div
        ref={voiceoverRef}
        className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center"
      >
        {currentVO && (
          <div className="voiceover-display px-8 py-4">
            <div className="text-xl font-mono text-arcane-teal">
              {currentVO}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}