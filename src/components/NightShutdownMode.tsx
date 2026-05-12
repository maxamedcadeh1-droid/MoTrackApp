import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Moon, Save, Sunrise, X } from 'lucide-react';
import { SoundService } from '../lib/SoundService';

export interface TomorrowPreviewItem {
  id: string;
  title: string;
  type: 'habit' | 'task';
  time?: string;
}

export interface NightShutdownData {
  userName: string;
  completedHabits: number;
  totalHabits: number;
  tomorrowPreview: TomorrowPreviewItem[];
  triggeredAt: string;
}

interface NightShutdownModeProps {
  data: NightShutdownData | null;
  onDismiss: () => void;
  onSaveReflection: (reflection: { wentWell: string; improveTomorrow: string }) => void;
}

export function NightShutdownMode({ data, onDismiss, onSaveReflection }: NightShutdownModeProps) {
  const [wentWell, setWentWell] = useState('');
  const [improveTomorrow, setImproveTomorrow] = useState('');

  useEffect(() => {
    if (!data) return;

    void SoundService.play('night');
    const timer = window.setInterval(() => {
      void SoundService.play('night');
    }, 8000);

    return () => window.clearInterval(timer);
  }, [data]);

  useEffect(() => {
    if (!data) {
      setWentWell('');
      setImproveTomorrow('');
    }
  }, [data]);

  if (!data) return null;

  const completionRate = data.totalHabits ? Math.round((data.completedHabits / data.totalHabits) * 100) : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="safe-area-top safe-area-bottom fixed inset-0 z-[110] overflow-y-auto bg-[#030713] text-white"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-28 top-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -left-24 bottom-16 h-80 w-80 rounded-full bg-violet-500/16 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.16),transparent_40%),linear-gradient(180deg,transparent,rgba(0,0,0,0.42))]" />
        </div>

        <div className="relative mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 py-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-400/10 text-blue-200">
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Shutdown ritual</p>
                <p className="text-sm text-zinc-500">A calm close for today</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Dismiss shutdown"
              onClick={onDismiss}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-400 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <motion.div
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex-1 space-y-5"
          >
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <p className="text-sm font-semibold text-zinc-400">Rest well, {data.userName}.</p>
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
                Let the day land softly.
              </h1>
              <div className="mt-6 flex items-center gap-5">
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                  <svg viewBox="0 0 96 96" className="absolute inset-0 h-full w-full -rotate-90">
                    <circle cx="48" cy="48" r="38" stroke="rgba(255,255,255,0.08)" strokeWidth="7" fill="none" />
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      stroke="url(#nightCompletion)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray="238.7"
                      strokeDashoffset={238.7 - (238.7 * completionRate) / 100}
                    />
                    <defs>
                      <linearGradient id="nightCompletion" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="100%" stopColor="#a78bfa" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="text-center">
                    <p className="font-mono text-2xl font-bold">{completionRate}</p>
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">done</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{data.completedHabits}/{data.totalHabits} habits completed</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    Small wins count. Tonight is for noticing what worked, then setting tomorrow down gently.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-3">
                <Sunrise className="h-5 w-5 text-blue-200" />
                <h2 className="font-display text-lg font-bold">Tomorrow preview</h2>
              </div>
              {data.tomorrowPreview.length > 0 ? (
                <div className="space-y-3">
                  {data.tomorrowPreview.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">{item.type}</p>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-bold text-blue-200">{item.time || 'Anytime'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-white/8 bg-white/[0.025] p-4 text-sm text-zinc-500">
                  Nothing scheduled yet for tomorrow.
                </p>
              )}
            </section>

            <section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
              <div>
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">What went well today?</label>
                <textarea
                  value={wentWell}
                  onChange={(event) => setWentWell(event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-2xl border border-white/10 bg-[#070a16]/80 px-4 py-3 text-base text-white placeholder:text-zinc-700 focus:border-blue-400/40 focus:outline-none focus:ring-2 focus:ring-blue-400/20 md:text-sm"
                  placeholder="A win, a moment, a choice..."
                />
              </div>
              <div>
                <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">What should improve tomorrow?</label>
                <textarea
                  value={improveTomorrow}
                  onChange={(event) => setImproveTomorrow(event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-2xl border border-white/10 bg-[#070a16]/80 px-4 py-3 text-base text-white placeholder:text-zinc-700 focus:border-blue-400/40 focus:outline-none focus:ring-2 focus:ring-blue-400/20 md:text-sm"
                  placeholder="One adjustment is enough."
                />
              </div>
            </section>
          </motion.div>

          <div className="sticky bottom-0 -mx-5 mt-6 border-t border-white/10 bg-[#030713]/85 px-5 py-4 backdrop-blur-2xl">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onDismiss}
                className="flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-bold text-zinc-300"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => onSaveReflection({ wentWell, improveTomorrow })}
                className="flex min-h-12 flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-blue-500/20"
              >
                {wentWell || improveTomorrow ? <Save className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                Save Reflection
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
