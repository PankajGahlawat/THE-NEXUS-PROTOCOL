/**
 * NEXUS PROTOCOL - Global Audio Controls
 * Floating audio controls that appear throughout the entire application
 * Version: 1.0.0
 * Last Updated: February 6, 2026
 */

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAudio } from '../../context/AudioContext';
import './AudioControls.css';

export default function AudioControls() {
  const { isPlaying, isMuted, volume, audioStarted, toggleMute, setVolume, playSound } = useAudio();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const location = useLocation();

  const isAdmin = location.pathname.startsWith('/admin');

  if (!audioStarted || isAdmin) {
    return null;
  }

  const handleMuteToggle = () => {
    playSound('click');
    toggleMute();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleVolumeToggle = () => {
    playSound('hover');
    setShowVolumeSlider(!showVolumeSlider);
  };

  if (!audioStarted) {
    return null; // Don't show controls until audio is started
  }

  return (
    <div className="audio-controls">
      <div className="audio-controls-container">
        {/* Main Mute/Unmute Button */}
        <button
          className={`audio-main-btn ${isMuted ? 'muted' : 'unmuted'} ${isPlaying ? 'playing' : 'paused'}`}
          onClick={handleMuteToggle}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          <span className="audio-icon">
            {isMuted ? '🔇' : (isPlaying ? '🔊' : '🔉')}
          </span>
        </button>

        {/* Volume Control Toggle */}
        <button
          className="volume-toggle-btn"
          onClick={handleVolumeToggle}
          title="Volume Control"
        >
          <span className="volume-icon">⚙️</span>
        </button>

        {/* Volume Slider */}
        {showVolumeSlider && (
          <div className="volume-slider-container">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
              title={`Volume: ${Math.round(volume * 100)}%`}
            />
            <div className="volume-display">
              {Math.round(volume * 100)}%
            </div>
          </div>
        )}

        {/* Audio Status Indicator */}
        <div className="audio-status">
          {isPlaying && !isMuted && (
            <div className="audio-wave">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>
      </div>

      {/* Audio Info Tooltip */}
      <div className="audio-info">
        <div className="audio-info-content">
          <div className="audio-status-text">
            {isMuted ? 'AUDIO MUTED' : (isPlaying ? 'NEXUS PROTOCOL ACTIVE' : 'AUDIO PAUSED')}
          </div>
          <div className="audio-controls-hint">
            Click to {isMuted ? 'unmute' : 'mute'} • Use ⚙️ for volume
          </div>
        </div>
      </div>
    </div>
  );
}
