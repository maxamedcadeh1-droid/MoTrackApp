import { useState, useEffect, useRef } from 'react';
import { Bell, Clock, Calendar, Volume2, BellOff, X, Play, Square, Music } from 'lucide-react';
import { cn } from '../lib/utils';
import { SoundService, type SoundType } from '../lib/SoundService';
import { NotificationService } from '../lib/NotificationService';

export interface ReminderSettingsData {
  reminderEnabled: boolean;
  reminderTime: string;
  reminderDays: number[];
  reminderSound: SoundType;
}

interface ReminderSettingsProps {
  value: ReminderSettingsData;
  onChange: (value: ReminderSettingsData) => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'M', full: 'Monday' },
  { value: 2, label: 'T', full: 'Tuesday' },
  { value: 3, label: 'W', full: 'Wednesday' },
  { value: 4, label: 'T', full: 'Thursday' },
  { value: 5, label: 'F', full: 'Friday' },
  { value: 6, label: 'S', full: 'Saturday' },
  { value: 0, label: 'S', full: 'Sunday' },
];

const SOUND_OPTIONS: { value: SoundType; label: string; description: string }[] = [
  { value: 'chime', label: 'Chime', description: 'Gentle ascending' },
  { value: 'bell', label: 'Bell', description: 'Soft bell' },
  { value: 'soft', label: 'Soft', description: 'Quiet notification' },
  { value: 'nature', label: 'Nature', description: 'Bird chirp' },
  { value: 'digital', label: 'Digital', description: 'Modern beep' },
  { value: 'sunrise', label: 'Sunrise', description: 'Morning ritual' },
  { value: 'night', label: 'Night', description: 'Shutdown ritual' },
  { value: 'modern_alarm', label: 'Modern', description: 'Persistent pulse' },
];

export function ReminderSettings({ value, onChange }: ReminderSettingsProps) {
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [playingSound, setPlayingSound] = useState<SoundType | null>(null);
  const playTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setNotificationPermission(NotificationService.getPermission());
    return () => {
      SoundService.stopAll();
      if (playTimeoutRef.current) window.clearTimeout(playTimeoutRef.current);
    };
  }, []);

  const handleToggle = () => {
    const enabling = !value.reminderEnabled;
    if (enabling) {
      NotificationService.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }

    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);

    onChange({
      ...value,
      reminderEnabled: enabling,
      reminderTime: enabling && !value.reminderTime
        ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        : value.reminderTime,
      reminderDays: enabling && value.reminderDays.length === 0
        ? [1, 2, 3, 4, 5, 6, 0]
        : value.reminderDays,
    });
  };

  const handleSoundChange = (sound: SoundType) => {
    onChange({ ...value, reminderSound: sound });
    previewSound(sound);
  };

  const previewSound = (sound: SoundType) => {
    SoundService.stopAll();
    if (playingSound === sound) {
      setPlayingSound(null);
      return;
    }

    setPlayingSound(sound);
    void SoundService.play(sound);

    if (playTimeoutRef.current) window.clearTimeout(playTimeoutRef.current);
    playTimeoutRef.current = window.setTimeout(() => {
      setPlayingSound(null);
    }, 5000); // Short preview for quick selection
  };

  const toggleTestAlarm = () => {
    if (playingSound === value.reminderSound) {
      SoundService.stopAlarm();
      setPlayingSound(null);
    } else {
      setPlayingSound(value.reminderSound);
      void SoundService.startAlarm(value.reminderSound);
      
      if (playTimeoutRef.current) window.clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = window.setTimeout(() => {
        setPlayingSound(null);
        SoundService.stopAlarm();
      }, 30000); // 30s test duration
    }
  };

  const handleDayToggle = (dayValue: number) => {
    const newDays = value.reminderDays.includes(dayValue)
      ? value.reminderDays.filter(d => d !== dayValue)
      : [...value.reminderDays, dayValue];
    onChange({ ...value, reminderDays: newDays });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-500",
            value.reminderEnabled ? "bg-accent/20 text-accent shadow-[0_0_20px_rgba(139,92,246,0.3)]" : "bg-white/5 text-zinc-500"
          )}>
            {value.reminderEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white">Daily Ritual Alarm</h3>
            <p className="text-xs text-zinc-500">Wake up your momentum with selected sounds</p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            "relative h-7 w-12 rounded-full transition-all duration-300",
            value.reminderEnabled ? "bg-accent" : "bg-white/10"
          )}
        >
          <span className={cn(
            "absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform shadow-lg",
            value.reminderEnabled ? "translate-x-5" : "translate-x-0"
          )} />
        </button>
      </div>

      {value.reminderEnabled && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Active Status Card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                  {playingSound ? (
                    <div className="flex items-end gap-0.5 h-3">
                      <div className="w-0.5 bg-current animate-[equalizer_0.8s_ease-in-out_infinite]" style={{ height: '100%' }} />
                      <div className="w-0.5 bg-current animate-[equalizer_0.6s_ease-in-out_infinite]" style={{ height: '60%' }} />
                      <div className="w-0.5 bg-current animate-[equalizer_1s_ease-in-out_infinite]" style={{ height: '80%' }} />
                    </div>
                  ) : <Music className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    {playingSound ? 'Playing Preview...' : 'Alarm Configuration'}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">
                    {value.reminderSound} • Looping enabled
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTestAlarm}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95",
                  playingSound === value.reminderSound
                    ? "bg-red-500/15 text-red-400 border border-red-500/20"
                    : "bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10"
                )}
              >
                {playingSound === value.reminderSound ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                {playingSound === value.reminderSound ? "Stop" : "Test 30s"}
              </button>
            </div>
          </div>

          {/* Time & Repeat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                <Clock className="h-3.5 w-3.5" />
                Time
              </label>
              <input
                type="time"
                value={value.reminderTime}
                onChange={(e) => onChange({ ...value, reminderTime: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                <Calendar className="h-3.5 w-3.5" />
                Days
              </label>
              <div className="flex gap-1.5">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={cn(
                      "flex h-10 flex-1 items-center justify-center rounded-xl text-xs font-bold transition-all",
                      value.reminderDays.includes(day.value)
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "bg-white/5 text-zinc-500 border border-white/5 hover:bg-white/10"
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sound Grid */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
              <Volume2 className="h-3.5 w-3.5" />
              Select Sound Experience
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {SOUND_OPTIONS.map((sound) => (
                <button
                  key={sound.value}
                  type="button"
                  onClick={() => handleSoundChange(sound.value)}
                  className={cn(
                    "group relative p-4 rounded-2xl border text-left transition-all duration-300",
                    value.reminderSound === sound.value
                      ? "bg-accent/10 border-accent/40 shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                      : "bg-white/[0.03] border-white/5 hover:bg-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      "text-sm font-bold",
                      value.reminderSound === sound.value ? "text-accent" : "text-white"
                    )}>
                      {sound.label}
                    </p>
                    {playingSound === sound.value && (
                      <div className="flex items-end gap-0.5 h-2">
                        <div className="w-0.5 bg-accent animate-[equalizer_0.8s_ease-in-out_infinite]" />
                        <div className="w-0.5 bg-accent animate-[equalizer_0.6s_ease-in-out_infinite]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">{sound.description}</p>
                  
                  {value.reminderSound === sound.value && (
                    <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes equalizer {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
