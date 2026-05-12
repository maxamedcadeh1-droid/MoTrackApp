import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Button, Badge, Toast, Input } from '../../components/ui/Layout';
import {
  CheckCircle2,
  Clock,
  CloudRain,
  History,
  Pause,
  Play,
  RotateCcw,
  Timer as TimerIcon,
  Volume2,
  Waves,
  Wind,
  Zap,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { formatTime, cn } from '../../lib/utils';
import { AmbientSoundType, SoundService } from '../../lib/SoundService';
import { FocusRitualMode, FocusSummary } from '../../components/FocusRitualMode';

type PresetId = '25' | '45' | '60' | 'custom';

const PRESETS: { id: PresetId; label: string; minutes: number }[] = [
  { id: '25', label: '25 min', minutes: 25 },
  { id: '45', label: '45 min', minutes: 45 },
  { id: '60', label: '60 min', minutes: 60 },
  { id: 'custom', label: 'Custom', minutes: 30 },
];

const SOUNDS: { id: AmbientSoundType; icon: any; label: string }[] = [
  { id: 'rain', icon: CloudRain, label: 'Rain' },
  { id: 'waves', icon: Waves, label: 'Waves' },
  { id: 'wind', icon: Wind, label: 'Wind' },
];

export function Focus() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [preset, setPreset] = useState<PresetId>('25');
  const [customMinutes, setCustomMinutes] = useState(30);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [activeSound, setActiveSound] = useState<AmbientSoundType | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [summaryMinutes, setSummaryMinutes] = useState<number | null>(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as any });

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const autoStartedRef = useRef(false);

  const durationMinutes = useMemo(() => {
    if (preset === 'custom') return Math.max(1, Math.min(customMinutes || 1, 240));
    return PRESETS.find((item) => item.id === preset)?.minutes || 25;
  }, [customMinutes, preset]);

  useEffect(() => {
    void fetchHistory();
  }, [user]);

  useEffect(() => {
    if (!sessionStarted) {
      setTimeLeft(durationMinutes * 60);
    }
  }, [durationMinutes, sessionStarted]);

  useEffect(() => {
    if (searchParams.get('start') === 'true' && !autoStartedRef.current && !sessionStarted) {
      autoStartedRef.current = true;
      startSession();
    }
  }, [searchParams, sessionStarted]);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (sessionStarted && isRunning && timeLeft === 0) {
      void completeSession();
    }
  }, [isRunning, sessionStarted, timeLeft]);

  useEffect(() => {
    return () => {
      SoundService.stopAmbient();
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const fetchHistory = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('started_at', `${today}T00:00:00`)
        .order('started_at', { ascending: false });

      if (error) throw error;
      if (data) setSessions(data);
    } catch (error: any) {
      console.error('Fetch focus history error:', error);
    }
  };

  const startSession = async () => {
    if (!startTimeRef.current) startTimeRef.current = new Date();
    setSessionStarted(true);
    setIsRunning(true);
    if (activeSound) await SoundService.startAmbient(activeSound);
  };

  const pauseSession = () => {
    setIsRunning(false);
    SoundService.stopAmbient();
  };

  const toggleTimer = () => {
    if (isRunning) {
      pauseSession();
    } else {
      void startSession();
    }
  };

  const resetDraft = () => {
    setIsRunning(false);
    setSessionStarted(false);
    setTimeLeft(durationMinutes * 60);
    startTimeRef.current = null;
    SoundService.stopAmbient();
  };

  const changePreset = (nextPreset: PresetId) => {
    if (sessionStarted) return;
    setPreset(nextPreset);
  };

  const saveSession = async (status: 'completed' | 'ended', minutes: number) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser || minutes <= 0) return;

    const { error } = await (supabase.from('focus_sessions') as any).insert({
      user_id: authUser.id,
      duration_minutes: durationMinutes,
      completed_minutes: minutes,
      session_type: 'focus',
      status,
      started_at: startTimeRef.current?.toISOString() || new Date().toISOString(),
      ended_at: new Date().toISOString(),
    });

    if (error) throw error;
    window.dispatchEvent(new Event('motrack:focus-updated'));
  };

  const completeSession = async () => {
    setIsRunning(false);
    SoundService.stopAmbient();
    void SoundService.play('chime');

    try {
      await saveSession('completed', durationMinutes);
      await fetchHistory();
      setSummaryMinutes(durationMinutes);
      setToast({ show: true, message: 'Focus session saved', type: 'success' });
    } catch (error: any) {
      console.error('Save focus session error:', error);
      setToast({ show: true, message: 'Something went wrong', type: 'error' });
    } finally {
      setSessionStarted(false);
      startTimeRef.current = null;
      setTimeLeft(durationMinutes * 60);
    }
  };

  const endSession = async () => {
    const elapsedSeconds = durationMinutes * 60 - timeLeft;
    const completedMinutes = Math.floor(elapsedSeconds / 60);
    setIsRunning(false);
    SoundService.stopAmbient();

    try {
      if (completedMinutes > 0) {
        await saveSession('ended', Math.min(completedMinutes, durationMinutes));
        await fetchHistory();
        setToast({ show: true, message: 'Focus session logged', type: 'success' });
      } else {
        setToast({ show: true, message: 'Focus session ended', type: 'info' });
      }
    } catch (error: any) {
      console.error('End focus session error:', error);
      setToast({ show: true, message: 'Something went wrong', type: 'error' });
    } finally {
      setSessionStarted(false);
      startTimeRef.current = null;
      setTimeLeft(durationMinutes * 60);
    }
  };

  const toggleSound = async (sound: AmbientSoundType) => {
    if (activeSound === sound) {
      setActiveSound(null);
      SoundService.stopAmbient();
      return;
    }

    setActiveSound(sound);
    if (sessionStarted && isRunning) {
      await SoundService.startAmbient(sound);
    }
  };

  const progress = Math.round((1 - timeLeft / Math.max(durationMinutes * 60, 1)) * 100);

  return (
    <div className="mx-auto space-y-5 pb-24 sm:space-y-8">
      <header className="luxury-card rounded-[2rem] p-6">
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-blue-500/18 blur-3xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-violet-300">Focus Ritual</p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-white">Deep Focus</h1>
            <p className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.9)]" />
              Fullscreen sessions with ambient sound
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Today</p>
            <p className="mt-1 font-mono text-sm font-bold text-white">{sessions.length} sessions</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="luxury-card flex flex-col items-center justify-center rounded-[2rem] p-5 lg:col-span-8">
          <div className="w-full max-w-2xl space-y-7">
            <div className="flex flex-wrap justify-center gap-2">
              {PRESETS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => changePreset(item.id)}
                  disabled={sessionStarted}
                  className={cn(
                    'min-h-11 rounded-2xl border px-4 text-xs font-bold uppercase tracking-[0.14em] transition-all disabled:cursor-not-allowed disabled:opacity-50',
                    preset === item.id
                      ? 'border-violet-400/30 bg-violet-400/12 text-white shadow-lg shadow-violet-500/10'
                      : 'border-white/8 bg-white/[0.035] text-zinc-500 hover:text-white'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {preset === 'custom' && !sessionStarted && (
              <div className="mx-auto max-w-xs">
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Custom minutes</label>
                <Input
                  type="number"
                  min={1}
                  max={240}
                  value={customMinutes}
                  onChange={(event) => setCustomMinutes(Number(event.target.value))}
                  className="mt-2 h-12 bg-white/5 text-center font-mono"
                />
              </div>
            )}

            <div className="relative mx-auto flex aspect-square w-full max-w-[25rem] flex-col items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="50%" cy="50%" r="45%" stroke="rgba(255,255,255,0.04)" strokeWidth="2" fill="none" />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="#8b5cf6"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray="100 100"
                  strokeDashoffset={100 - progress}
                  className="focus-progress-ring transition-all duration-500"
                  style={{ '--focus-ring-glow': 'rgba(139,92,246,0.38)' } as any}
                />
              </svg>

              <div className="relative z-10 text-center">
                <Badge className="mx-auto mb-5 w-fit border-violet-500/20 bg-violet-500/10 text-violet-200">{durationMinutes} minute ritual</Badge>
                <div className="font-mono text-[4.25rem] font-bold leading-none tracking-normal text-white tabular-nums sm:text-[7rem] md:text-[8rem]">
                  {formatTime(timeLeft)}
                </div>
                <p className="mx-auto mt-5 max-w-xs text-sm text-zinc-500">
                  {sessionStarted ? 'Your fullscreen ritual is active.' : 'Choose a preset, pick a sound, and begin.'}
                </p>
              </div>

              <div className="absolute bottom-[12%] z-20 flex gap-4 sm:gap-8">
                <button
                  type="button"
                  onClick={resetDraft}
                  className="rounded-full border-white/5 p-4 text-zinc-600 shadow-2xl transition-all hover:scale-110 hover:border-white/20 hover:text-white active:scale-95 sm:p-5 glass"
                >
                  <RotateCcw className="h-6 w-6 sm:h-8 sm:w-8" />
                </button>

                <button
                  type="button"
                  onClick={toggleTimer}
                  className={cn(
                    'flex h-20 w-20 items-center justify-center rounded-full border border-white/10 shadow-2xl transition-all duration-300 active:scale-95 sm:h-24 sm:w-24',
                    isRunning ? 'bg-white/5 text-white' : 'momentum-gradient text-white'
                  )}
                >
                  {isRunning ? <Pause className="h-8 w-8 sm:h-10 sm:w-10" /> : <Play className="ml-1 h-8 w-8 sm:h-10 sm:w-10" />}
                </button>

                <button
                  type="button"
                  onClick={() => activeSound ? void toggleSound(activeSound) : void toggleSound('rain')}
                  className={cn(
                    'rounded-full border p-4 shadow-2xl transition-all hover:scale-110 active:scale-95 sm:p-5',
                    activeSound ? 'border-accent/20 bg-accent/10 text-accent' : 'glass border-white/5 text-zinc-600 hover:text-white'
                  )}
                >
                  {activeSound ? <Volume2 className="h-6 w-6 sm:h-8 sm:w-8" /> : <TimerIcon className="h-6 w-6 sm:h-8 sm:w-8" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 lg:col-span-4">
          <Card className="rounded-[1.7rem] border-white/10 p-5 sm:p-8">
            <h3 className="mb-6 text-sm font-display font-semibold uppercase tracking-[0.3em] text-zinc-600">Ambient sound</h3>
            <div className="space-y-4">
              {SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  type="button"
                  onClick={() => void toggleSound(sound.id)}
                  className={cn(
                    'group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all',
                    activeSound === sound.id
                      ? 'border-accent/40 bg-accent/10 text-accent shadow-glow'
                      : 'border-white/5 bg-white/5 text-zinc-500 hover:border-white/10 hover:text-white'
                  )}
                >
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl transition-colors', activeSound === sound.id ? 'bg-accent/20' : 'bg-white/5')}>
                    <sound.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-display font-semibold uppercase tracking-[0.2em]">{sound.label}</span>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-tighter opacity-40">Procedural audio</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-10 border-t border-white/5 pt-8">
              <h3 className="mb-6 text-sm font-display font-semibold uppercase tracking-[0.3em] text-zinc-600">Session history</h3>
              <div className="max-h-[300px] space-y-5 overflow-y-auto pr-2 scrollbar-hide">
                {sessions.length > 0 ? sessions.map((session) => (
                  <div key={session.id} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/5">
                      <CheckCircle2 className="h-5 w-5 text-accent/60" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-mono font-semibold uppercase tracking-tight text-white">{session.completed_minutes}m Session</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-700">{new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[10px] font-medium uppercase tracking-tighter text-zinc-600">{session.status || 'completed'}</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-12 text-center">
                    <History className="mx-auto mb-4 h-10 w-10 text-white/5" />
                    <p className="text-[10px] font-display font-semibold uppercase tracking-[0.2em] text-zinc-700">No sessions today</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <FocusRitualMode
        open={sessionStarted}
        label="Deep Focus"
        durationMinutes={durationMinutes}
        timeLeft={timeLeft}
        isRunning={isRunning}
        activeSound={activeSound}
        onToggleRunning={toggleTimer}
        onEnd={() => void endSession()}
        onToggleSound={(sound) => void toggleSound(sound)}
      />

      <FocusSummary
        open={summaryMinutes !== null}
        minutes={summaryMinutes || 0}
        onClose={() => setSummaryMinutes(null)}
      />

      <Toast
        isVisible={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}
