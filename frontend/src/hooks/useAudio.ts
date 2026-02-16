/**
 * NEXUS PROTOCOL - Audio Hook
 * Custom hook for managing game audio and sound effects
 * Version: 1.0.0
 * Last Updated: February 6, 2026
 */

import { useRef, useCallback, useEffect, useState } from 'react';

interface AudioOptions {
  volume?: number;
  loop?: boolean;
  autoplay?: boolean;
  fadeIn?: boolean;
  fadeOut?: boolean;
}

interface AudioState {
  isPlaying: boolean;
  isLoaded: boolean;
  error: string | null;
  volume: number;
}

export function useAudio(src: string, options: AudioOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isLoaded: false,
    error: null,
    volume: options.volume || 0.5
  });

  const {
    volume = 0.5,
    loop = false,
    autoplay = false,
    fadeIn = false,
    fadeOut = false
  } = options;

  useEffect(() => {
    // Create audio element
    const audio = new Audio();
    audioRef.current = audio;

    // Set initial properties
    audio.volume = volume;
    audio.loop = loop;
    audio.preload = 'auto';

    // Event listeners
    const handleLoadedData = () => {
      setAudioState(prev => ({ ...prev, isLoaded: true, error: null }));
      if (autoplay) {
        play();
      }
    };

    const handleError = () => {
      setAudioState(prev => ({ 
        ...prev, 
        error: 'Failed to load audio',
        isLoaded: false 
      }));
    };

    const handlePlay = () => {
      setAudioState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleEnded = () => {
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // Set source
    audio.src = src;

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      audio.src = '';
    };
  }, [src, volume, loop, autoplay]);

  const play = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      if (fadeIn) {
        audioRef.current.volume = 0;
        await audioRef.current.play();
        fadeVolume(0, volume, 1000);
      } else {
        audioRef.current.volume = volume;
        await audioRef.current.play();
      }
    } catch (error) {
      setAudioState(prev => ({ 
        ...prev, 
        error: 'Failed to play audio. User interaction may be required.' 
      }));
    }
  }, [volume, fadeIn]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;

    if (fadeOut) {
      fadeVolume(audioRef.current.volume, 0, 500, () => {
        audioRef.current?.pause();
      });
    } else {
      audioRef.current.pause();
    }
  }, [fadeOut]);

  const stop = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    if (!audioRef.current) return;

    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    audioRef.current.volume = clampedVolume;
    setAudioState(prev => ({ ...prev, volume: clampedVolume }));
  }, []);

  const fadeVolume = useCallback((
    from: number, 
    to: number, 
    duration: number, 
    onComplete?: () => void
  ) => {
    if (!audioRef.current) return;

    const steps = 20;
    const stepDuration = duration / steps;
    const stepSize = (to - from) / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      if (!audioRef.current) {
        clearInterval(interval);
        return;
      }

      currentStep++;
      const newVolume = from + (stepSize * currentStep);
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume));

      if (currentStep >= steps) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, stepDuration);
  }, []);

  return {
    ...audioState,
    play,
    pause,
    stop,
    setVolume,
    fadeVolume
  };
}

// Predefined audio effects for the game
export const AUDIO_EFFECTS = {
  // Landing page sounds
  AMBIENT_HUM: '/audio/ambient-hum.mp3',
  BUTTON_HOVER: '/audio/button-hover.mp3',
  BUTTON_CLICK: '/audio/button-click.mp3',
  ENTER_VERSE: '/audio/enter-verse.mp3',
  
  // UI sounds
  NOTIFICATION: '/audio/notification.mp3',
  ERROR: '/audio/error.mp3',
  SUCCESS: '/audio/success.mp3',
  TYPING: '/audio/typing.mp3',
  
  // Game sounds
  TOOL_USE: '/audio/tool-use.mp3',
  OBJECTIVE_COMPLETE: '/audio/objective-complete.mp3',
  MISSION_START: '/audio/mission-start.mp3',
  MISSION_COMPLETE: '/audio/mission-complete.mp3',
  SECURITY_ALERT: '/audio/security-alert.mp3',
  
  // Agent sounds
  AGENT_SELECT: '/audio/agent-select.mp3',
  THEME_CHANGE: '/audio/theme-change.mp3'
};

// Audio context for managing global audio settings
export function useAudioContext() {
  const [globalVolume, setGlobalVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    // Check user preferences
    const savedVolume = localStorage.getItem('nexus_audio_volume');
    const savedMuted = localStorage.getItem('nexus_audio_muted');
    const savedEnabled = localStorage.getItem('nexus_audio_enabled');

    if (savedVolume) setGlobalVolume(parseFloat(savedVolume));
    if (savedMuted) setIsMuted(savedMuted === 'true');
    if (savedEnabled) setAudioEnabled(savedEnabled === 'true');
  }, []);

  const updateGlobalVolume = useCallback((volume: number) => {
    setGlobalVolume(volume);
    localStorage.setItem('nexus_audio_volume', volume.toString());
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      localStorage.setItem('nexus_audio_muted', newMuted.toString());
      return newMuted;
    });
  }, []);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => {
      const newEnabled = !prev;
      localStorage.setItem('nexus_audio_enabled', newEnabled.toString());
      return newEnabled;
    });
  }, []);

  return {
    globalVolume,
    isMuted,
    audioEnabled,
    updateGlobalVolume,
    toggleMute,
    toggleAudio,
    effectiveVolume: isMuted || !audioEnabled ? 0 : globalVolume
  };
}