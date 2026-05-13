import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Pause, Play, Square, Volume2, VolumeX } from 'lucide-react';
import { AmbientSoundType } from '../lib/SoundService';
import { formatTime, cn } from '../lib/utils';

interface FocusRitualModeProps {
  open: boolean;
  label: string;
  durationMinutes: number;
  timeLeft: number;
  isRunning: boolean;
  activeSound: AmbientSoundType | null;
  onToggleRunning: () => void;
  onEnd: () => void;
  onToggleSound: (sound: AmbientSoundType) => void;
}

const FOCUS_MESSAGES = [
  'One clean block. One clear outcome.',
  'Stay with the signal.',
  'Let the work get quiet.',
  'Small progress still compounds.',
];

const SOUNDS: { id: AmbientSoundType; label: string }[] = [
  { id: 'rain', label: 'Rain' },
  { id: 'waves', label: 'Waves' },
  { id: 'wind', label: 'Wind' },
];

export function FocusRitualMode({
  open,
  label,
  durationMinutes,
  timeLeft,
  isRunning,
  activeSound,
  onToggleRunning,
  onEnd,
  onToggleSound,
}: FocusRitualModeProps) {
  const totalSeconds = Math.max(durationMinutes * 60, 1);
  const progress = Math.max(0, Math.min(100, (1 - timeLeft / totalSeconds) * 100));
  const circumference = 565.5;
  const messageIndex = Math.min(FOCUS_MESSAGES.length - 1, Math.floor(progress / 26));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="safe-area-top safe-area-bottom fixed inset-0 z-[105] overflow-y-auto bg-[#03050d] text-white"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-8 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-violet-500/16 blur-3xl" />
            <div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-cyan-500/12 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(139,92,246,0.12),transparent_42%),linear-gradient(180deg,transparent,rgba(0,0,0,0.46))]" />
          </div>

          <div className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 py-6">
            <header className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Focus ritual</p>
                <h1 className="mt-2 font-display text-2xl font-bold">{label}</h1>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Session</p>
                <p className="font-mono text-sm font-bold">{durationMinutes}m</p>
              </div>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
              <div className="relative flex aspect-square w-full max-w-[23rem] items-center justify-center">
                <svg viewBox="0 0 220 220" className="absolute inset-0 h-full w-full -rotate-90">
                  <circle cx="110" cy="110" r="90" stroke="rgba(255,255,255,0.06)" strokeWidth="9" fill="none" />
                  <motion.circle
                    cx="110"
                    cy="110"
                    r="90"
                    stroke="url(#focusRitualRing)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: circumference - (circumference * progress) / 100 }}
                    transition={{ duration: 0.35 }}
                    className="drop-shadow-[0_0_18px_rgba(139,92,246,0.42)]"
                  />
                  <defs>
                    <linearGradient id="focusRitualRing" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="relative text-center">
                  <p className="font-mono text-[4.5rem] font-bold leading-none tracking-normal sm:text-[6.5rem]">
                    {formatTime(timeLeft)}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-zinc-400">{FOCUS_MESSAGES[messageIndex]}</p>
                </div>
              </div>

              <div className="flex items-end justify-center gap-1">
                {[18, 34, 24, 42, 20, 36, 50, 26, 44, 22, 38, 30].map((height, index) => (
                  <span
                    key={index}
                    className={cn(
                      'w-1 rounded-full bg-gradient-to-t from-violet-500 to-cyan-300 transition-opacity',
                      isRunning ? 'opacity-100' : 'opacity-45'
                    )}
                    style={{ height }}
                  />
                ))}
              </div>

              <div className="flex w-full max-w-md items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={onToggleRunning}
                  className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-2xl shadow-violet-500/25 active:scale-95"
                >
                  {isRunning ? <Pause className="h-8 w-8" /> : <Play className="ml-1 h-8 w-8" />}
                </button>
                <button
                  type="button"
                  onClick={onEnd}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-300 active:scale-95"
                  aria-label="End focus session"
                >
                  <Square className="h-5 w-5" />
                </button>
              </div>

              <div className="grid w-full max-w-lg grid-cols-3 gap-2">
                {SOUNDS.map((sound) => (
                  <button
                    key={sound.id}
                    type="button"
                    onClick={() => onToggleSound(sound.id)}
                    className={cn(
                      'flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-bold transition-colors',
                      activeSound === sound.id
                        ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
                        : 'border-white/10 bg-white/[0.04] text-zinc-400'
                    )}
                  >
                    {activeSound === sound.id ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    {sound.label}
                  </button>
                ))}
              </div>
            </main>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface FocusSummaryProps {
  open: boolean;
  minutes: number;
  onClose: () => void;
}

export function FocusSummary({ open, minutes, onClose }: FocusSummaryProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close focus summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[115] bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            className="mobile-dialog-panel fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[116] rounded-[2rem] border border-emerald-500/20 bg-[#07110e]/95 p-6 text-center shadow-2xl shadow-emerald-500/10 backdrop-blur-2xl md:bottom-auto md:left-1/2 md:top-24 md:max-w-md md:-translate-x-1/2"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold text-white">Focus complete</h2>
            <p className="mt-2 text-sm text-zinc-400">{minutes} minutes logged to today.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 min-h-12 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-sm font-bold text-white"
            >
              Continue
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
