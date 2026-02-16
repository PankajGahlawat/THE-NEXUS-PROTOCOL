/**
 * NEXUS PROTOCOL - Audio Generator
 * Generates cyberpunk-themed audio effects using Web Audio API
 * Version: 1.0.0
 * Last Updated: February 6, 2026
 */

class AudioGenerator {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.3; // Master volume
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext) return null;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    return this.audioContext;
  }

  // Generate ambient cyberpunk hum
  async generateAmbientHum(duration: number = 10): Promise<void> {
    const ctx = await this.ensureAudioContext();
    if (!ctx || !this.masterGain) return;

    // Create multiple oscillators for rich ambient sound
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    // Low frequency hum
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(60, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    oscillators.push(osc1);
    gains.push(gain1);

    // Mid frequency texture
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(120, ctx.currentTime);
    gain2.gain.setValueAtTime(0.1, ctx.currentTime);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    oscillators.push(osc2);
    gains.push(gain2);

    // High frequency sparkle
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(440, ctx.currentTime);
    gain3.gain.setValueAtTime(0.05, ctx.currentTime);
    osc3.connect(gain3);
    gain3.connect(this.masterGain);
    oscillators.push(osc3);
    gains.push(gain3);

    // Add subtle frequency modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.1, ctx.currentTime);
    lfoGain.gain.setValueAtTime(5, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    // Start all oscillators
    oscillators.forEach(osc => osc.start(ctx.currentTime));
    lfo.start(ctx.currentTime);

    // Fade in
    gains.forEach(gain => {
      gain.gain.exponentialRampToValueAtTime(gain.gain.value, ctx.currentTime + 0.1);
    });

    // Stop after duration
    setTimeout(() => {
      gains.forEach(gain => {
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      });
      setTimeout(() => {
        oscillators.forEach(osc => osc.stop());
        lfo.stop();
      }, 1000);
    }, duration * 1000);
  }

  // Generate button hover sound
  async generateButtonHover(): Promise<void> {
    const ctx = await this.ensureAudioContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  // Generate button click sound
  async generateButtonClick(): Promise<void> {
    const ctx = await this.ensureAudioContext();
    if (!ctx || !this.masterGain) return;

    // Create a more complex click sound
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(1000, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2000, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.1);
  }

  // Generate "Enter the Verse" dramatic sound
  async generateEnterVerse(): Promise<void> {
    const ctx = await this.ensureAudioContext();
    if (!ctx || !this.masterGain) return;

    // Create a dramatic rising sound
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const reverb = ctx.createConvolver();
    
    // Create impulse response for reverb
    const impulseLength = ctx.sampleRate * 2;
    const impulse = ctx.createBuffer(2, impulseLength, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < impulseLength; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
      }
    }
    reverb.buffer = impulse;
    
    // Configure oscillators
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(100, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 1.5);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(200, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 1.5);
    
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(50, ctx.currentTime);
    osc3.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 1.5);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 1.5);
    filter.Q.setValueAtTime(5, ctx.currentTime);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
    
    // Connect the audio graph
    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(gain);
    gain.connect(reverb);
    reverb.connect(this.masterGain);
    
    // Start and stop
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.2);
    osc3.start(ctx.currentTime + 0.4);
    
    osc1.stop(ctx.currentTime + 2);
    osc2.stop(ctx.currentTime + 2);
    osc3.stop(ctx.currentTime + 2);
  }

  // Generate typing/glitch sound
  async generateTypingGlitch(): Promise<void> {
    const ctx = await this.ensureAudioContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(1500 + Math.random() * 1000, ctx.currentTime);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    filter.Q.setValueAtTime(10, ctx.currentTime);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }

  // Generate notification sound
  async generateNotification(): Promise<void> {
    const ctx = await this.ensureAudioContext();
    if (!ctx || !this.masterGain) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, ctx.currentTime);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, ctx.currentTime);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.1);
    osc1.stop(ctx.currentTime + 0.5);
    osc2.stop(ctx.currentTime + 0.5);
  }

  // Set master volume
  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), 
        this.audioContext?.currentTime || 0);
    }
  }

  // Stop all audio
  stopAll(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }
}

// Create singleton instance
export const audioGenerator = new AudioGenerator();

// Audio effect functions for easy use
export const playAmbientHum = (duration?: number) => audioGenerator.generateAmbientHum(duration);
export const playButtonHover = () => audioGenerator.generateButtonHover();
export const playButtonClick = () => audioGenerator.generateButtonClick();
export const playEnterVerse = () => audioGenerator.generateEnterVerse();
export const playTypingGlitch = () => audioGenerator.generateTypingGlitch();
export const playNotification = () => audioGenerator.generateNotification();
export const setMasterVolume = (volume: number) => audioGenerator.setMasterVolume(volume);
export const stopAllAudio = () => audioGenerator.stopAll();