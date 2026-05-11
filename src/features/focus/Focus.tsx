import { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, Toast } from '../../components/ui/Layout';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  Brain, 
  Timer as TimerIcon,
  Flame,
  Volume2,
  VolumeX,
  History,
  CheckCircle2,
  Zap,
  Waves,
  CloudRain,
  Wind
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { formatTime, cn } from '../../lib/utils';

type TimerMode = 'focus' | 'short-break' | 'long-break';

const MODES: Record<TimerMode, { label: string; minutes: number; color: string; icon: any }> = {
  focus: { label: 'Focus', minutes: 25, color: '#8b5cf6', icon: Zap },
  'short-break': { label: 'Short Rest', minutes: 5, color: '#10b981', icon: Coffee },
  'long-break': { label: 'Recharge', minutes: 15, color: '#3b82f6', icon: History },
};

const SOUNDS = [
  { id: 'rain', icon: CloudRain, label: 'Rain', url: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' },
  { id: 'waves', icon: Waves, label: 'Waves', url: 'https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3' },
  { id: 'wind', icon: Wind, label: 'Wind', url: 'https://assets.mixkit.co/active_storage/sfx/2360/2360-preview.mp3' },
];

export function Focus() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(MODES[mode].minutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as any });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  useEffect(() => {
    if (searchParams.get('start') === 'true' && !autoStartedRef.current && !isActive && mode === 'focus') {
      autoStartedRef.current = true;
      startTimeRef.current = new Date();
      setIsActive(true);
    }
  }, [searchParams, isActive, mode]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const fetchHistory = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('started_at', today)
        .order('started_at', { ascending: false });
      
      if (error) throw error;
      if (data) setSessions(data);
    } catch (error: any) {
      console.error('Fetch focus history error:', error);
    }
  };

  const toggleTimer = () => {
    if (!isActive) {
      startTimeRef.current = new Date();
      if (activeSound) playSound(activeSound);
    } else {
      stopSound();
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].minutes * 60);
    stopSound();
  };

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(MODES[newMode].minutes * 60);
    stopSound();
  };

  const handleComplete = async () => {
    setIsActive(false);
    stopSound();
    
    // Play notification sound (browser default or simple beep)
    try {
        const beep = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        beep.play();
    } catch (e) {}

    if (mode === 'focus') {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const minutesWorked = MODES.focus.minutes;
        try {
          const { error } = await (supabase.from('focus_sessions') as any).insert({
            user_id: authUser.id,
            duration_minutes: MODES.focus.minutes,
            completed_minutes: minutesWorked,
            session_type: 'pomodoro',
            status: 'completed',
            started_at: startTimeRef.current?.toISOString() || new Date().toISOString(),
            ended_at: new Date().toISOString()
          });
          
          if (error) throw error;
          
          setToast({ show: true, message: 'Focus session saved', type: 'success' });
          fetchHistory();
        } catch (error: any) {
          console.error('Save focus session error:', error);
          setToast({ show: true, message: 'Something went wrong', type: 'error' });
        }
      }
    }

    // Auto next mode
    if (mode === 'focus') setMode('short-break');
    else setMode('focus');
    setTimeLeft(MODES[mode === 'focus' ? 'short-break' : 'focus'].minutes * 60);
  };

  const playSound = (soundId: string) => {
    const sound = SOUNDS.find(s => s.id === soundId);
    if (!sound) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    audioRef.current = new Audio(sound.url);
    audioRef.current.loop = true;
    audioRef.current.play().catch(e => console.log('Audio blocked', e));
    setActiveSound(soundId);
  };

  const stopSound = () => {
    if (audioRef.current) {
        audioRef.current.pause();
    }
    setActiveSound(null);
  };

  const progress = (1 - timeLeft / (MODES[mode].minutes * 60)) * 100;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20 sm:space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-6 bg-accent rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Focus session</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
            Focus Time
          </h1>
          <p className="text-zinc-500 mt-4 font-medium tracking-tight max-w-xl">Set a clear block, reduce context switching, and give one important thing your best attention.</p>
        </div>
        <div className="flex gap-4">
            <div className="flex items-center h-14 gap-3 bg-white/5 px-6 rounded-2xl border border-white/5 shadow-xl transition-all hover:bg-white/[0.08]">
                <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Today</span>
                    <span className="text-xs font-mono font-bold text-white uppercase mt-1 tracking-tight">{sessions.length} sessions</span>
                </div>
            </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Main Timer Display */}
        <div className="flex flex-col items-center justify-center space-y-8 lg:col-span-8 lg:space-y-12">
            <div className="relative flex aspect-square w-full max-w-[34rem] flex-col items-center justify-center">
                {/* Circular Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        stroke="rgba(255,255,255,0.02)"
                        strokeWidth="2"
                        fill="none"
                    />
                    <motion.circle
                        cx="50%"
                        cy="50%"
                        r="45%"
                        stroke={MODES[mode].color}
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray="100 100"
                        initial={{ strokeDashoffset: 100 }}
                        animate={{ strokeDashoffset: 100 - progress }}
                        className="transition-all duration-1000"
                        style={{ filter: `blur(4px) drop-shadow(0 0 20px ${MODES[mode].color}40)` }}
                    />
                </svg>

                {/* Digital Time */}
                <div className="relative text-center z-10">
                    <div className="mb-6 flex flex-wrap justify-center gap-2 sm:mb-8">
                        {(Object.keys(MODES) as TimerMode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => changeMode(m)}
                                className={cn(
                                    "px-3 py-2 sm:px-4 rounded-full text-[10px] font-display font-semibold uppercase tracking-[0.16em] sm:tracking-[0.2em] transition-all border",
                                    mode === m 
                                    ? "bg-white/5 border-white/10 text-white shadow-xl" 
                                    : "text-zinc-600 border-transparent hover:text-zinc-400"
                                )}
                            >
                                {MODES[m].label}
                            </button>
                        ))}
                    </div>
                    
                    <motion.div
                        key={timeLeft}
                        initial={{ opacity: 0.8, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="font-mono text-[4.5rem] font-bold leading-none tracking-tight text-white tabular-nums sm:text-[7rem] md:text-[10rem] lg:text-[11.25rem]"
                    >
                        {formatTime(timeLeft)}
                    </motion.div>
                </div>

                <div className="absolute bottom-[18%] z-20 flex gap-4 sm:gap-8 lg:bottom-1/4">
                     <button 
                        onClick={resetTimer}
                        className="rounded-full border-white/5 p-4 text-zinc-600 shadow-2xl transition-all hover:scale-110 hover:border-white/20 hover:text-white active:scale-95 sm:p-5 glass"
                    >
                        <RotateCcw className="h-6 w-6 sm:h-8 sm:w-8" />
                    </button>

                    <button 
                        onClick={toggleTimer}
                        className={cn(
                            "w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all duration-500 active:scale-95 shadow-2xl relative group overflow-hidden border border-white/10",
                            isActive 
                                ? "bg-white/5 text-white" 
                                : "momentum-gradient text-white"
                        )}
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {isActive ? <Pause className="relative z-10 h-8 w-8 sm:h-10 sm:w-10" /> : <Play className="relative z-10 ml-1 h-8 w-8 sm:ml-1.5 sm:h-10 sm:w-10" />}
                    </button>

                    <button 
                        onClick={() => activeSound ? stopSound() : playSound('rain')}
                        className={cn(
                            "p-4 sm:p-5 rounded-full border transition-all hover:scale-110 active:scale-95 shadow-2xl",
                            activeSound ? "bg-accent/10 border-accent/20 text-accent" : "glass border-white/5 text-zinc-600 hover:text-white"
                        )}
                    >
                        {activeSound ? <Volume2 className="h-6 w-6 sm:h-8 sm:w-8" /> : <VolumeX className="h-6 w-6 sm:h-8 sm:w-8" />}
                    </button>
                </div>
            </div>
        </div>

        {/* Side Controls: Sounds & History */}
        <div className="lg:col-span-4 space-y-8">
            <Card className="border-white/5 bg-white/[0.02] p-5 sm:p-8">
                <h3 className="text-sm font-display font-semibold uppercase tracking-[0.3em] text-zinc-600 mb-6">Background audio</h3>
                <div className="space-y-4">
                    {SOUNDS.map(sound => (
                        <button
                            key={sound.id}
                            onClick={() => activeSound === sound.id ? stopSound() : playSound(sound.id)}
                            className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all border group text-left",
                                activeSound === sound.id 
                                    ? "bg-accent/10 border-accent/40 text-accent shadow-glow" 
                                    : "bg-white/5 border-white/5 text-zinc-500 hover:border-white/10 hover:text-white"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                activeSound === sound.id ? "bg-accent/20" : "bg-white/5 p-2"
                            )}>
                                <sound.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <span className="text-sm font-display font-semibold uppercase tracking-[0.2em]">{sound.label}</span>
                                <p className="text-[10px] uppercase font-bold opacity-40 mt-0.5 tracking-tighter">Ambient audio</p>
                            </div>
                            {activeSound === sound.id && (
                                <div className="flex gap-0.5">
                                    {[1,2,3].map(i => <motion.div key={i} animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }} className="w-0.5 bg-accent" />)}
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="mt-12 pt-10 border-t border-white/5">
                    <h3 className="text-sm font-display font-semibold uppercase tracking-[0.3em] text-zinc-600 mb-6">Session history</h3>
                    <div className="space-y-5 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                        {sessions.length > 0 ? sessions.map(session => (
                            <div key={session.id} className="flex gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:border-white/10 transition-all">
                                    <CheckCircle2 className="w-5 h-5 text-accent/40 group-hover:text-accent transition-colors" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[12px] font-mono font-semibold text-white uppercase tracking-tight">{session.completed_minutes}m Session</span>
                                        <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">{new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-tighter">Recorded to your daily focus total</p>
                                </div>
                            </div>
                        )) : (
                            <div className="py-12 text-center">
                                <History className="w-10 h-10 text-white/5 mx-auto mb-4" />
                                <p className="text-[10px] font-display font-semibold uppercase tracking-[0.2em] text-zinc-700">No sessions today</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
      </div>
      
      <Toast 
        isVisible={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
}
