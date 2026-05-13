import { useEffect, useMemo, useState } from 'react';
import { Activity, Moon, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../features/auth/useAuth';
import { cn } from '../lib/utils';

const SPLASH_DURATION_MS = 1650;
const MIN_ENTRY_DURATION_MS = 2350;

const particles = [
  { left: '12%', top: '18%', delay: 0.1, size: 2 },
  { left: '22%', top: '72%', delay: 0.7, size: 3 },
  { left: '32%', top: '30%', delay: 1.2, size: 2 },
  { left: '44%', top: '82%', delay: 0.4, size: 2 },
  { left: '54%', top: '14%', delay: 1.6, size: 3 },
  { left: '66%', top: '66%', delay: 0.9, size: 2 },
  { left: '74%', top: '26%', delay: 1.9, size: 2 },
  { left: '86%', top: '78%', delay: 0.3, size: 3 },
  { left: '92%', top: '38%', delay: 1.4, size: 2 },
];

function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
}

function getFirstName(profile: any, email?: string | null) {
  const source = profile?.full_name || email?.split('@')[0] || 'Mohamed';
  return source.split(' ')[0] || 'Mohamed';
}

function EntryAtmosphere() {
  return (
    <>
      <div className="cinematic-entry-mesh absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.42)_78%,rgba(0,0,0,0.82)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/[0.035] to-transparent" />
      {particles.map((particle) => (
        <span
          key={`${particle.left}-${particle.top}`}
          className="cinematic-entry-particle absolute rounded-full bg-cyan-200/70 shadow-[0_0_16px_rgba(125,211,252,0.45)]"
          style={{
            left: particle.left,
            top: particle.top,
            height: particle.size,
            width: particle.size,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </>
  );
}

function MomentumMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('relative flex items-center justify-center', compact ? 'h-20 w-20' : 'h-36 w-36')}>
      <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="cinematic-orb-ring absolute inset-2 rounded-full border border-cyan-300/20" />
      <div className="absolute inset-5 rounded-full border border-violet-300/15 bg-white/[0.035] backdrop-blur-xl" />
      <div className="cinematic-orb-breath relative flex h-20 w-20 items-center justify-center rounded-full border border-white/12 bg-[radial-gradient(circle_at_38%_28%,rgba(255,255,255,0.18),rgba(139,92,246,0.22)_34%,rgba(5,8,19,0.92)_72%)] shadow-[0_0_42px_rgba(139,92,246,0.34),inset_0_1px_0_rgba(255,255,255,0.16)]">
        <Moon className={cn('text-white drop-shadow-[0_0_18px_rgba(139,92,246,0.85)]', compact ? 'h-7 w-7' : 'h-9 w-9')} />
      </div>
    </div>
  );
}

function SplashStage() {
  return (
    <motion.div
      key="splash"
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.985, filter: 'blur(10px)' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 flex flex-col items-center text-center"
    >
      <MomentumMark />
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
        className="mt-7"
      >
        <p className="font-display text-4xl font-black tracking-normal text-white sm:text-5xl">
          Build Momentum.
        </p>
        <p className="mt-3 text-sm font-medium text-zinc-400">
          Preparing your best day...
        </p>
      </motion.div>
    </motion.div>
  );
}

function LoadingStage({ greeting, firstName }: { greeting: string; firstName: string }) {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0, y: 18, scale: 0.98, filter: 'blur(12px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, scale: 0.985, filter: 'blur(10px)' }}
      transition={{ type: 'spring', stiffness: 180, damping: 24, mass: 0.85 }}
      className="premium-loading-card relative z-10 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.065] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.55),0_0_44px_rgba(139,92,246,0.18)] backdrop-blur-2xl"
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/45 to-transparent" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/16 blur-3xl" />
      <div className="flex items-center gap-4">
        <MomentumMark compact />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">
            MoTrack OS
          </p>
          <h2 className="mt-1 truncate font-display text-xl font-bold text-white">
            {greeting}, {firstName}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">Let's build your best day.</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/8 bg-black/18 p-3">
        <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            Calibrating
          </span>
          <span>Live sync</span>
        </div>
        <div className="cinematic-progress-line h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <span className="block h-full rounded-full" />
        </div>
      </div>
    </motion.div>
  );
}

export function AppEntryExperience() {
  const { user, profile, isLoading } = useAuth();
  const [phase, setPhase] = useState<'splash' | 'loading' | 'done'>('splash');
  const [minimumElapsed, setMinimumElapsed] = useState(false);

  const hour = useMemo(() => new Date().getHours(), []);
  const greeting = useMemo(() => getGreeting(hour), [hour]);
  const firstName = useMemo(() => getFirstName(profile, user?.email), [profile, user?.email]);

  useEffect(() => {
    const splashTimer = window.setTimeout(() => setPhase('loading'), SPLASH_DURATION_MS);
    const minimumTimer = window.setTimeout(() => setMinimumElapsed(true), MIN_ENTRY_DURATION_MS);

    return () => {
      window.clearTimeout(splashTimer);
      window.clearTimeout(minimumTimer);
    };
  }, []);

  useEffect(() => {
    if (!minimumElapsed || isLoading) return;
    const exitTimer = window.setTimeout(() => setPhase('done'), 120);
    return () => window.clearTimeout(exitTimer);
  }, [isLoading, minimumElapsed]);

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="entry"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(12px)' }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="cinematic-entry-root fixed inset-0 z-[10000] flex min-h-screen items-center justify-center overflow-hidden bg-[#03050d] px-5"
        >
          <EntryAtmosphere />
          <AnimatePresence mode="wait">
            {phase === 'splash' ? (
              <SplashStage />
            ) : (
              <LoadingStage greeting={greeting} firstName={firstName} />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PremiumRouteLoader({
  fullscreen = true,
  label = 'Preparing workspace...',
}: {
  fullscreen?: boolean;
  label?: string;
}) {
  const { user, profile } = useAuth();
  const hour = useMemo(() => new Date().getHours(), []);
  const greeting = useMemo(() => getGreeting(hour), [hour]);
  const firstName = useMemo(() => getFirstName(profile, user?.email), [profile, user?.email]);

  return (
    <div
      className={cn(
        'premium-route-loader relative flex items-center justify-center overflow-hidden bg-[#03050d] px-5',
        fullscreen ? 'min-h-screen' : 'min-h-[420px] rounded-[2rem]'
      )}
    >
      <EntryAtmosphere />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 170, damping: 24 }}
        className="premium-loading-card relative z-10 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.48),0_0_36px_rgba(59,130,246,0.13)] backdrop-blur-2xl"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-violet-500/10 text-violet-200 shadow-[0_0_26px_rgba(139,92,246,0.22)]">
            <Activity className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-bold text-white">
              {greeting}, {firstName}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">{label}</p>
          </div>
        </div>
        <div className="cinematic-progress-line mt-5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <span className="block h-full rounded-full" />
        </div>
      </motion.div>
    </div>
  );
}
