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

let globalAudioContext: AudioContext | null = null;
const getGlobalAudioContext = () => {
  if (!globalAudioContext) {
    globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (globalAudioContext.state === 'suspended') {
    globalAudioContext.resume();
  }
  return globalAudioContext;
};

const AudioContextData = createContext<AudioContextType | undefined>(undefined);

interface AudioProviderProps {
  children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.6);
  const [audioStarted, setAudioStarted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize audio element with gamevoice.mp3 and auto-play
  useEffect(() => {
    const audio = new Audio('/audio/gamevoice.mp3');
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    // Audio event listeners
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // Auto-play immediately when component mounts
    const attemptAutoPlay = () => {
      audio.play().then(() => {
        setAudioStarted(true);
        console.log('Audio started automatically');
      }).catch(err => {
        console.log("Audio autoplay blocked, will retry on user interaction:", err);
        // Set up fallback for user interaction
        const handleInteraction = () => {
          audio.play().then(() => {
            setAudioStarted(true);
            document.removeEventListener("click", handleInteraction);
            document.removeEventListener("keydown", handleInteraction);
          }).catch(e => console.log("Audio play failed:", e));
        };
        document.addEventListener("click", handleInteraction, { once: true });
        document.addEventListener("keydown", handleInteraction, { once: true });
      });
    };

    // Try to play immediately
    attemptAutoPlay();

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
  }, []); // Only run once on mount

  // Start audio function (Method 1 - Recommended)
  const startAudio = () => {
    if (audioRef.current) {
      const audio = audioRef.current;
      if (!audio.paused && audioStarted) return; // Already playing
      
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
    
    let activeVolume = volume;
    if (!newMutedState && volume === 0) {
      activeVolume = 0.6;
      setVolumeState(0.6);
      localStorage.setItem('nexus_audio_volume', '0.6');
    }
    
    if (audioRef.current) {
      audioRef.current.volume = newMutedState ? 0 : activeVolume;
      if (!newMutedState && audioRef.current.paused) {
        audioRef.current.play().catch(e => console.log("Play failed on unmute:", e));
      }
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
      if (clampedVolume > 0 && audioRef.current.paused) {
        audioRef.current.play().catch(e => console.log("Play failed on setVolume:", e));
      }
    }

    // Save preference
    localStorage.setItem('nexus_audio_volume', clampedVolume.toString());
  };

  // Play sound effect (using Web Audio API)
  const playSound = (soundType: string) => {
    if (!isMuted) {
      // Simple beep sounds using Web Audio API
      try {
        const audioContext = getGlobalAudioContext();
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

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = volume;
    }
  }, [volume, isMuted]);

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
    <AudioContextData.Provider value={value}>
      {children}
    </AudioContextData.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContextData);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
