/**
 * SoundService - small procedural audio layer for ritual feedback.
 * Uses Web Audio so MoTrack is not dependent on remote sound files.
 */

export type SoundType = 'chime' | 'bell' | 'soft' | 'nature' | 'digital' | 'sunrise' | 'night';
export type AmbientSoundType = 'rain' | 'waves' | 'wind';

type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

export class SoundService {
  private static audioContext: AudioContext | null = null;
  private static initialized = false;
  private static ambientNodes: Array<AudioNode | AudioBufferSourceNode | OscillatorNode | GainNode> = [];

  static async init(): Promise<void> {
    if (this.initialized && this.audioContext) return;

    try {
      const AudioContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext;
      if (!AudioContextClass) return;
      this.audioContext = new AudioContextClass();
      this.initialized = true;
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  static async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  static async play(type: SoundType = 'chime'): Promise<void> {
    await this.init();
    await this.resume();

    if (!this.audioContext) {
      console.log(`Sound unavailable: ${type}`);
      return;
    }

    switch (type) {
      case 'chime':
        this.playChime();
        break;
      case 'bell':
        this.playBell();
        break;
      case 'soft':
        this.playSoft();
        break;
      case 'nature':
        this.playNature();
        break;
      case 'digital':
        this.playDigital();
        break;
      case 'sunrise':
        this.playSunrise();
        break;
      case 'night':
        this.playNight();
        break;
    }
  }

  static async startAmbient(type: AmbientSoundType = 'rain'): Promise<void> {
    await this.init();
    await this.resume();
    this.stopAmbient();

    if (!this.audioContext) return;

    if (type === 'wind') {
      this.startWind();
      return;
    }

    const source = this.createNoiseSource();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();

    filter.type = type === 'rain' ? 'highpass' : 'lowpass';
    filter.frequency.value = type === 'rain' ? 900 : 420;
    gain.gain.value = type === 'rain' ? 0.025 : 0.04;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);
    source.loop = true;
    source.start();

    this.ambientNodes = [source, filter, gain];
  }

  static stopAmbient(): void {
    this.ambientNodes.forEach((node) => {
      if ('stop' in node && typeof node.stop === 'function') {
        try {
          node.stop();
        } catch {
          // Already stopped.
        }
      }
      if ('disconnect' in node && typeof node.disconnect === 'function') {
        try {
          node.disconnect();
        } catch {
          // Already disconnected.
        }
      }
    });
    this.ambientNodes = [];
  }

  private static startWind(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 96;
    filter.type = 'lowpass';
    filter.frequency.value = 260;
    gain.gain.value = 0.025;

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);
    oscillator.start();
    this.ambientNodes = [oscillator, filter, gain];
  }

  private static createNoiseSource(): AudioBufferSourceNode {
    const context = this.audioContext!;
    const bufferSize = context.sampleRate * 2;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  private static playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.1, delay = 0): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const startTime = this.audioContext.currentTime + delay;

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.05);
  }

  private static playChime(): void {
    this.playTone(523.25, 0.32, 'sine', 0.08, 0);
    this.playTone(659.25, 0.32, 'sine', 0.07, 0.15);
    this.playTone(783.99, 0.44, 'sine', 0.07, 0.3);
  }

  private static playBell(): void {
    this.playTone(880, 0.6, 'sine', 0.06);
    this.playTone(1108.73, 0.42, 'sine', 0.04, 0.2);
  }

  private static playSoft(): void {
    this.playTone(440, 0.22, 'sine', 0.045);
    this.playTone(523.25, 0.32, 'sine', 0.035, 0.1);
  }

  private static playNature(): void {
    this.playTone(1200, 0.1, 'sine', 0.035);
    this.playTone(1500, 0.16, 'sine', 0.045, 0.12);
    this.playTone(1000, 0.1, 'sine', 0.035, 0.28);
  }

  private static playDigital(): void {
    this.playTone(800, 0.1, 'square', 0.03);
    this.playTone(1000, 0.1, 'square', 0.03, 0.15);
    this.playTone(1200, 0.15, 'square', 0.03, 0.3);
  }

  private static playSunrise(): void {
    this.playTone(392, 0.55, 'sine', 0.045, 0);
    this.playTone(523.25, 0.65, 'sine', 0.055, 0.28);
    this.playTone(659.25, 0.9, 'triangle', 0.04, 0.62);
  }

  private static playNight(): void {
    this.playTone(261.63, 0.75, 'sine', 0.035, 0);
    this.playTone(329.63, 0.85, 'sine', 0.028, 0.35);
  }

  static stopAll(): void {
    this.stopAmbient();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.initialized = false;
    }
  }
}
