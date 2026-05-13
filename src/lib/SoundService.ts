/**
 * SoundService - Robust audio management for MoTrack.
 * Supports real audio files with fallbacks and looping alarm logic.
 */

export type SoundType = 'chime' | 'bell' | 'soft' | 'nature' | 'digital' | 'sunrise' | 'night' | 'modern_alarm';

const SOUND_FILES: Record<SoundType, string> = {
  chime: '/sounds/chime.mp3',
  bell: '/sounds/bell.mp3',
  soft: '/sounds/soft.mp3',
  nature: '/sounds/nature.mp3',
  digital: '/sounds/digital.mp3',
  sunrise: '/sounds/sunrise.mp3',
  night: '/sounds/night.mp3',
  modern_alarm: '/sounds/modern.mp3',
};

// Fallback URLs (Mixkit/Pixabay stable URLs)
const FALLBACK_URLS: Record<SoundType, string> = {
  chime: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  bell: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  soft: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  nature: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
  digital: 'https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3',
  sunrise: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  night: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
  modern_alarm: 'https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3',
};

export class SoundService {
  private static currentAudio: HTMLAudioElement | null = null;
  private static alarmTimeout: number | null = null;
  private static isAlarmActive = false;

  /**
   * Play a one-shot sound effect (or short preview)
   */
  static async play(type: SoundType, volume = 0.5): Promise<void> {
    try {
      this.stopAll();
      const audio = new Audio(SOUND_FILES[type]);
      audio.volume = volume;
      
      // Attempt to play, fallback if local file missing
      try {
        await audio.play();
      } catch {
        const fallbackAudio = new Audio(FALLBACK_URLS[type]);
        fallbackAudio.volume = volume;
        await fallbackAudio.play();
      }
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }

  /**
   * Start a looping alarm for a specified duration (30-60s)
   */
  static async startAlarm(type: SoundType, durationMs = 60000): Promise<void> {
    if (this.isAlarmActive) return;
    
    try {
      this.stopAll();
      this.isAlarmActive = true;
      
      let audio = new Audio(SOUND_FILES[type]);
      audio.loop = true;
      audio.volume = 0.7;

      const attemptPlay = async (el: HTMLAudioElement) => {
        try {
          await el.play();
          this.currentAudio = el;
        } catch (err) {
          console.warn('Primary alarm audio failed, trying fallback...', err);
          const fallback = new Audio(FALLBACK_URLS[type]);
          fallback.loop = true;
          fallback.volume = 0.7;
          await fallback.play();
          this.currentAudio = fallback;
        }
      };

      await attemptPlay(audio);

      // Auto-stop after duration
      this.alarmTimeout = window.setTimeout(() => {
        this.stopAlarm();
      }, durationMs);

    } catch (error) {
      console.error('Failed to start alarm:', error);
      this.isAlarmActive = false;
    }
  }

  /**
   * Stop only the active alarm
   */
  static stopAlarm(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (this.alarmTimeout) {
      clearTimeout(this.alarmTimeout);
      this.alarmTimeout = null;
    }
    this.isAlarmActive = false;
  }

  /**
   * Stop everything
   */
  static stopAll(): void {
    this.stopAlarm();
    // In case of multiple overlaps (safety)
    const audios = document.querySelectorAll('audio');
    audios.forEach(a => { a.pause(); a.remove(); });
  }

  /**
   * Check if sound is currently playing
   */
  static isPlaying(): boolean {
    return this.isAlarmActive;
  }
}
