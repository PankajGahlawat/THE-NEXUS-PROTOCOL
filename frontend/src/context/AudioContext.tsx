/**
 * NEXUS PROTOCOL - Global Audio Context
 * Manages background music (gamevoice.mp3) and sound effects throughout the entire application
 * Version: 1.0.0
 * Last Updated: February 6, 2026
 */

import { createContext, useContext, useRef, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface AudioContextType {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  audioStarted: boolean;
  startAudio: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  playSound: (soundType: string) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

interface AudioProviderProps {
  children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.6);
  const [audioStarted, setAudioStarted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize audio element with gamevoice.mp3
  useEffect(() => {
    const audio = new Audio('/audio/gamevoice.mp3');
    audio.loop = true;
    audio.preload = 'auto';
    audioRef.current = audio;

    // Audio event listeners
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // Tab visibility handling
    const handleVisibilityChange = () => {
      if (audioStarted && !isMuted) {
        if (document.hidden) {
          audio.pause();
        } else {
          audio.play().catch(err => console.log("Resume blocked:", err));
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      
      // Cleanup audio
      audio.pause();
      audio.src = '';
    };
  }, [audioStarted, isMuted]);

  // Start audio function (Method 1 - Recommended)
  const startAudio = () => {
    if (audioRef.current && !audioStarted) {
      const audio = audioRef.current;
      audio.volume = 0; // Start silent for fade-in
      
      audio.play().then(() => {
        setAudioStarted(true);
        
        // Cinematic fade-in effect
        let currentVolume = 0;
        const fadeIn = setInterval(() => {
          currentVolume += 0.03;
          const targetVolume = isMuted ? 0 : volume;
          audio.volume = Math.min(currentVolume, targetVolume);
          if (currentVolume >= targetVolume) {
            clearInterval(fadeIn);
          }
        }, 100);
        
      }).catch(err => {
        console.log("Audio autoplay blocked:", err);
      });
    }
  };

  // Toggle mute function
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (audioRef.current) {
      audioRef.current.volume = newMutedState ? 0 : volume;
    }

    // Save preference
    localStorage.setItem('nexus_audio_muted', newMutedState.toString());
  };

  // Set volume function
  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = clampedVolume;
    }

    // Save preference
    localStorage.setItem('nexus_audio_volume', clampedVolume.toString());
  };

  // Play sound effect (using Web Audio API)
  const playSound = (soundType: string) => {
    if (!isMuted) {
      // Simple beep sounds using Web Audio API
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Different sounds for different types
        switch (soundType) {
          case 'click':
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.3;
            break;
          case 'hover':
            oscillator.frequency.value = 600;
            gainNode.gain.value = 0.15;
            break;
          case 'success':
            oscillator.frequency.value = 1000;
            gainNode.gain.value = 0.2;
            break;
          case 'error':
            oscillator.frequency.value = 200;
            gainNode.gain.value = 0.25;
            break;
          default:
            oscillator.frequency.value = 440;
            gainNode.gain.value = 0.2;
        }
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        console.log('Sound effect blocked:', error);
      }
    }
  };

  // Load saved preferences
  useEffect(() => {
    const savedMuted = localStorage.getItem('nexus_audio_muted');
    const savedVolume = localStorage.getItem('nexus_audio_volume');

    if (savedMuted) {
      setIsMuted(savedMuted === 'true');
    }
    if (savedVolume) {
      setVolumeState(parseFloat(savedVolume));
    }
  }, []);

  // Set up first interaction listeners for gamevoice.mp3
  useEffect(() => {
    const handleFirstInteraction = () => {
      startAudio();
      // Remove listeners after first use
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };

    if (!audioStarted) {
      document.addEventListener("click", handleFirstInteraction);
      document.addEventListener("keydown", handleFirstInteraction);
    }

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [audioStarted]);

  const value: AudioContextType = {
    isPlaying,
    isMuted,
    volume,
    audioStarted,
    startAudio,
    toggleMute,
    setVolume,
    playSound
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
