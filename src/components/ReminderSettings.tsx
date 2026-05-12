import { useState, useEffect } from 'react';
import { Bell, Clock, Calendar, Volume2, BellOff } from 'lucide-react';
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
];

export function ReminderSettings({ value, onChange }: ReminderSettingsProps) {
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>('default');

  useEffect(() => {
    setNotificationPermission(NotificationService.getPermission());
  }, []);

  const handleToggle = () => {
    const enabling = !value.reminderEnabled;
    if (enabling) {
      // Request permission when enabling
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

  const handleTimeChange = (time: string) => {
    onChange({
      ...value,
      reminderTime: time,
    });
  };

  const handleDayToggle = (dayValue: number) => {
    const newDays = value.reminderDays.includes(dayValue)
      ? value.reminderDays.filter(d => d !== dayValue)
      : [...value.reminderDays, dayValue];
    
    onChange({
      ...value,
      reminderDays: newDays,
    });
  };

  const handleSoundChange = (sound: SoundType) => {
    onChange({
      ...value,
      reminderSound: sound,
    });
    // Preview the sound
    void SoundService.play(sound);
  };

  const selectAllDays = () => {
    onChange({
      ...value,
      reminderDays: [1, 2, 3, 4, 5, 6, 0],
    });
  };

  const selectWeekdays = () => {
    onChange({
      ...value,
      reminderDays: [1, 2, 3, 4, 5],
    });
  };

  const selectWeekends = () => {
    onChange({
      ...value,
      reminderDays: [0, 6],
    });
  };

  const formatTimeDisplay = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-5">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
            value.reminderEnabled ? "bg-accent/10 text-accent" : "bg-white/5 text-zinc-500"
          )}>
            {value.reminderEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white">Reminder</h3>
            <p className="text-xs text-zinc-500">
              {value.reminderEnabled 
                ? formatTimeDisplay(value.reminderTime) || 'Set a time' 
                : 'Get notified to complete your habit'}
            </p>
          </div>
        </div>
        
        <button
          type="button"
          role="switch"
          aria-checked={value.reminderEnabled}
          onClick={handleToggle}
          className={cn(
            "relative h-7 w-12 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-[#05060a]",
            value.reminderEnabled ? "bg-accent" : "bg-white/10"
          )}
        >
          <span
            className={cn(
              "absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform shadow-md",
              value.reminderEnabled ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {/* Notification permission warning */}
      {value.reminderEnabled && notificationPermission === 'denied' && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
          <p className="text-xs text-amber-400">
            Browser notifications are blocked. Please enable notifications in your browser settings to receive reminders.
          </p>
        </div>
      )}

      {value.reminderEnabled && (
        <div className="space-y-5 animate-slide-up">
          {/* Time picker */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
              <Clock className="h-3.5 w-3.5" />
              Time
            </label>
            <input
              type="time"
              value={value.reminderTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-accent/50 md:text-sm"
            />
          </div>

          {/* Day selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <Calendar className="h-3.5 w-3.5" />
                Repeat
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={selectAllDays}
                  className="px-2 py-0.5 text-[10px] text-zinc-500 hover:text-white transition-colors"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={selectWeekdays}
                  className="px-2 py-0.5 text-[10px] text-zinc-500 hover:text-white transition-colors"
                >
                  Weekdays
                </button>
                <button
                  type="button"
                  onClick={selectWeekends}
                  className="px-2 py-0.5 text-[10px] text-zinc-500 hover:text-white transition-colors"
                >
                  Weekends
                </button>
              </div>
            </div>
            <div className="flex gap-1.5">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleDayToggle(day.value)}
                  title={day.full}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all",
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

          {/* Sound selector */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
              <Volume2 className="h-3.5 w-3.5" />
              Sound
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SOUND_OPTIONS.map((sound) => (
                <button
                  key={sound.value}
                  type="button"
                  onClick={() => handleSoundChange(sound.value)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    value.reminderSound === sound.value
                      ? "bg-accent/10 border-accent/30"
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                >
                  <p className={cn(
                    "text-sm font-semibold",
                    value.reminderSound === sound.value ? "text-accent" : "text-white"
                  )}>
                    {sound.label}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{sound.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
