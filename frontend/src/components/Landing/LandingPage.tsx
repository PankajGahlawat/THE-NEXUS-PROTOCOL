/**
 * NEXUS PROTOCOL - Landing Page Component
 * Integrated landing page with cyberpunk aesthetic
 * Version: 2.0.0 - With React Router
 * Last Updated: February 6, 2026
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudio } from '../../context/AudioContext';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentText, setCurrentText] = useState('');
  const [currentFile, setCurrentFile] = useState('');
  const [progress, setProgress] = useState(0); // Progress value 0-100
  const [showContent, setShowContent] = useState(false);

  const { audioStarted, playSound, startAudio } = useAudio();

  const textSequences = [
    'initializing nexus protocol systems...',
    'loading agent_profiles.dat...',
    'decrypting mission_briefings.enc...',
    'establishing secure connection...',
    'activating heist interface...'
  ];

  const fileSequences = [
    '// initializing nexus protocol systems',
    '// loading: /data/agent_profiles.dat',
    '// processing: /secure/mission_briefings.enc',
    '// connecting to: nexus.protocol.server',
    '// heist interface ready'
  ];

  // No need for audio event listeners since audio auto-plays now
  useEffect(() => {
    let sequenceIndex = 0;
    let textIndex = 0;
    let progressValue = 0;

    const typeText = () => {
      const currentSequence = textSequences[sequenceIndex];
      if (textIndex < currentSequence.length) {
        setCurrentText(currentSequence.substring(0, textIndex + 1));
        textIndex++;
        setTimeout(typeText, 30 + Math.random() * 50);
      } else {
        // Move to next sequence
        setTimeout(() => {
          sequenceIndex++;
          textIndex = 0;
          if (sequenceIndex < textSequences.length) {
            setCurrentFile(fileSequences[sequenceIndex]);
            typeText();
          }
        }, 500);
      }
    };

    const updateProgress = () => {
      if (progressValue < 100) {
        progressValue += 2;
        setProgress(progressValue);
        setTimeout(updateProgress, 50);
      }
    };

    // Start animations
    setCurrentFile(fileSequences[0]);
    typeText();
    updateProgress();

    // Show content after loading
    const timer = setTimeout(() => {
      setLoading(false);
      setTimeout(() => setShowContent(true), 100);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleEnterGame = () => {
    playSound('click');
    startAudio();
    setShowContent(false);

    // Check if trailer has been shown
    const trailerShown = sessionStorage.getItem('nexus_trailer_shown') === 'true';

    setTimeout(() => {
      if (trailerShown) {
        navigate('/login');
      } else {
        navigate('/trailer');
      }
    }, 500);
  };

  const handleCharacterSelect = (character: string) => {
    playSound('click');
    sessionStorage.setItem('nexus_preselected_character', character);
    handleEnterGame();
  };



  const createParticles = () => {
    const particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push(
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${10 + Math.random() * 10}s`
          }}
        />
      );
    }
    return particles;
  };

  if (loading) {
    return (
      <div className="landing-loading-screen">
        <div className="loading-content">
          <div className="terminal-text">
            <span className="prompt">&gt;</span> <span>{currentText}</span><span className="cursor">_</span>
          </div>
          <div className="loading-bar-container">
            <div className="loading-bar" style={{ width: `${progress}%` }} />
          </div>
          <div className="loading-info">
            <span className="file-path">{currentFile}</span>
          </div>
        </div>
        <div className="click-prompt" onClick={() => { setLoading(false); startAudio(); setTimeout(() => setShowContent(true), 100); }}>
          <span className="pulse-icon">◉</span> CLICK TO CONTINUE
        </div>
      </div>
    );
  }

  return (
    <div className={`landing-page ${showContent ? 'visible' : ''} ${audioStarted ? 'audio-active' : ''}`}>

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-left">
          <div className="logo">
            <span className="logo-text">NEXUS</span>
            <span className="logo-slash">/</span>
            <span className="logo-sub">PROTOCOL</span>
          </div>
        </div>
        <div className="nav-center">
          <a href="#story" className="nav-link">PROJECT</a>
          <a href="#characters" className="nav-link">AGENTS</a>
          <a href="#features" className="nav-link">FEATURES</a>
          <a href="#cta" className="nav-link">PLAY</a>
        </div>
        <div className="nav-right">
          <button
            className="text-arcane-teal hover:text-white mr-6 font-mono text-sm tracking-wider transition-colors"
            onClick={() => navigate('/admin')}
          >
            SYSTEM ACCESS
          </button>
          <button className="sign-in-btn" onClick={handleEnterGame}>ENTER GAME</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="grid-overlay"></div>
          <div className="particles">
            {createParticles()}
          </div>
        </div>
        <div className="hero-content">
          <h1 className="glitch-text" data-text="THE">THE</h1>
          <h1 className="glitch-text" data-text="NEXUS">NEXUS</h1>
          <h1 className="glitch-text" data-text="PROTOCOL">PROTOCOL</h1>
          <p className="hero-subtitle">CYBER HEIST SIMULATION</p>
          <div className="hero-cta">
            <button className="primary-btn nexus-initialize" onClick={handleEnterGame}>
              <span className="btn-text">INITIALIZE NEXUS</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
        <div className="scroll-indicator">
          <span className="scroll-text">SCROLL</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* Story Section */}
      <section className="story-section" id="story">
        <div className="section-content">
          <div className="section-header">
            <span className="section-tag">// GAME_OVERVIEW</span>
            <h2 className="section-title">THE EXPERIENCE</h2>
          </div>
          <div className="story-grid">
            <div className="story-card">
              <div className="card-glow"></div>
              <div className="card-content">
                <span className="card-icon">◈</span>
                <h3>The Mission</h3>
                <p>Corporate data vaults hold the secrets of power. Your team must infiltrate, extract, and escape without a trace...</p>
              </div>
            </div>
            <div className="story-card">
              <div className="card-glow"></div>
              <div className="card-content">
                <span className="card-icon">◉</span>
                <h3>The Agents</h3>
                <p>Two specialists, each with unique skills: the Hacker and the Infiltrator. Choose your path...</p>
              </div>
            </div>
            <div className="story-card">
              <div className="card-glow"></div>
              <div className="card-content">
                <span className="card-icon">◎</span>
                <h3>The Protocol</h3>
                <p>Real-time cyber heist simulation with 20+ tools, dynamic missions, and strategic gameplay...</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Characters Section */}
      <section className="characters-section" id="characters">
        <div className="section-content">
          <div className="section-header">
            <span className="section-tag">// OPERATIVES</span>
            <h2 className="section-title">CHOOSE YOUR AGENT</h2>
          </div>
          {/* Modified grid to center 2 items instead of 3 */}
          <div className="characters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 400px))', justifyContent: 'center' }}>
            <div className="character-card" onClick={() => handleCharacterSelect('hacker')}>
              <div className="character-image">
                <img src="/assets/CIPHER-001.webp" alt="CIPHER-001" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="character-overlay"></div>
              </div>
              <div className="character-info">
                <span className="character-code">CIPHER-001</span>
                <h3 className="character-name">BREACH ARCHITECT</h3>
                <p className="character-role">System Exploitation Specialist</p>
              </div>
            </div>
            <div className="character-card" onClick={() => handleCharacterSelect('infiltrator')}>
              <div className="character-image">
                <img src="/assets/GHOST-002.webp" alt="GHOST-002" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div className="character-overlay"></div>
              </div>
              <div className="character-info">
                <span className="character-code">GHOST-002</span>
                <h3 className="character-name">SHADOW LINGUIST</h3>
                <p className="character-role">Social Engineering Expert</p>
              </div>
            </div>
            {/* Analyst card removed */}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-content">
          <div className="section-header">
            <span className="section-tag">// GAME_FEATURES</span>
            <h2 className="section-title">THE SYSTEM</h2>
          </div>
          <div className="features-showcase">
            <div className="feature-card large">
              <div className="feature-bg" style={{
                backgroundImage: 'url(/assets/cyber-heist.WEBP)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.6
              }}></div>
              <div className="feature-info">
                <span className="feature-tag">MISSION_TYPE</span>
                <h3>CYBER HEIST</h3>
                <p>Real-time infiltration missions</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-bg" style={{
                backgroundImage: 'url(/assets/gameplay.WEBP)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.6
              }}></div>
              <div className="feature-info">
                <span className="feature-tag">GAMEPLAY</span>
                <h3>STRATEGIC</h3>
                <p>Risk vs reward decisions</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-bg" style={{
                backgroundImage: 'url(/assets/tool.WEBP)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.6
              }}></div>
              <div className="feature-info">
                <span className="feature-tag">TOOLS</span>
                <h3>20+ TOOLS</h3>
                <p>Hacking, stealth, analysis</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" id="cta">
        <div className="cta-content">
          <div className="cta-text">
            <span className="cta-tag">// JOIN THE HEIST</span>
            <h2 className="cta-title">READY TO<br />INFILTRATE THE<br />SYSTEM?</h2>
          </div>
          <div className="cta-buttons">
            <button className="primary-btn large nexus-initialize" onClick={handleEnterGame}>
              <span className="btn-text">INITIALIZE NEXUS</span>
              <span className="btn-arrow">→</span>
            </button>
            <button className="secondary-btn" onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="btn-text">LEARN MORE</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}