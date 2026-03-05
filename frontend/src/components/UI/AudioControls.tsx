/**
 * NEXUS PROTOCOL - Global Audio Controls
 * YouTube-style audio control with integrated volume slider
 * Works across all pages and sections
 * Version: 4.0.0
 * Last Updated: March 4, 2026
 */

import { useState, useRef, useEffect } from 'react';
import { useAudio } from '../../context/AudioContext';
import './AudioControls.css';

export default function AudioControls() {
  const { audioStarted, isMuted, toggleMute, volume, setVolume } = useAudio();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  // Handle mouse wheel for volume control
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
  };

  // Close volume slider when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (controlsRef.current && !controlsRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false);
      }
    };

    if (showVolumeSlider) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVolumeSlider]);

  // Get volume icon based on volume level
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
          <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    } else if (volume < 0.5) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
          <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    } else {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
          <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M18.07 5.93a9 9 0 010 12.73" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
  };

  // Don't show button until audio has started (after all hooks)
  if (!audioStarted) return null;

  return (
    <div 
      className="audio-controls-wrapper" 
      ref={controlsRef}
      onMouseEnter={() => setShowVolumeSlider(true)}
      onMouseLeave={() => setShowVolumeSlider(false)}
      onWheel={handleWheel}
    >
      {/* Volume Slider - Appears on Hover */}
      <div className={`volume-slider-panel ${showVolumeSlider ? 'visible' : ''}`}>
        <div className="volume-slider-track">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="volume-slider-input"
          />
          <div className="volume-fill" style={{ height: `${(isMuted ? 0 : volume) * 100}%` }}></div>
        </div>
        <div className="volume-percentage">
          {Math.round((isMuted ? 0 : volume) * 100)}
        </div>
      </div>

      {/* Audio Control Button */}
      <div
        className={`audio-control-btn ${isMuted || volume === 0 ? 'muted' : 'playing'}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
      >
        <div className="audio-icon">
          {getVolumeIcon()}
        </div>
        <div className="audio-tooltip">
          {isMuted ? 'Unmute (m)' : 'Mute (m)'}
        </div>
      </div>
    </div>
  );
}
