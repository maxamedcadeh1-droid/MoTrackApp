import { useEffect, useRef } from 'react';
import { Bell, Plus, TrendingUp, TrendingDown, ArrowRight, Wifi, X, Clock, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../../lib/utils';
import { MomentumOrb } from './MomentumOrb';

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  detail: string;
  date: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardHeroProps {
  greeting: string;
  firstName: string;
  subtitle: string;
  stats: {
    momentum: number;
    habitsCompleted: number;
    totalHabits: number;
    focusMinutes: number;
    dailyGoal: number;
    activeProjects: number;
    recentActivity: ActivityItem[];
  };
  syncLabel: string;
  syncStatus: string;
  lastSyncedAt: string;
  onQuickAdd: () => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  formatActivityTime: (value: string) => string;
  trend: { trend: 'up' | 'down' | 'stable'; percentage: number };
  navigate: (path: string) => void;
}

export function DashboardHero({
  greeting,
  firstName,
  subtitle,
  stats,
  syncLabel,
  syncStatus,
  lastSyncedAt,
  onQuickAdd,
  notificationsOpen,
  setNotificationsOpen,
  formatActivityTime,
  trend,
}: DashboardHeroProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notificationsOpen) return;
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [notificationsOpen, setNotificationsOpen]);

  return (
    <motion.div
      className="premium-cinema-card relative overflow-visible rounded-[1.75rem] p-5"
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      style={{
        background:
          'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%), radial-gradient(circle at 0% 0%, rgba(139,92,246,0.18) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(59,130,246,0.12) 0%, transparent 50%), rgba(7,10,23,0.9)',
        border: '1px solid rgba(148,163,184,0.13)',
        boxShadow: '0 24px 70px rgba(0,0,0,0.4), 0 0 40px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {/* Ambient top-left glow */}
      <div className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />

      {/* Top bar: logo + bell */}
      <div className="relative mb-4 flex items-center justify-between">
        <span
          className="font-display text-base font-black tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 40%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          MoTrack
        </span>

        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={cn(
              'premium-control relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 transition-all hover:text-white active:scale-95',
              notificationsOpen && 'border-violet-500/30 bg-violet-500/10 text-violet-300'
            )}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {stats.recentActivity.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.9)]" />
            )}
          </button>

          {/* Notification panel */}
          {notificationsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 8, scale: 0.98, filter: 'blur(8px)' }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              className="absolute right-0 top-full z-[200] mt-2 w-[min(300px,calc(100vw-2rem))] overflow-hidden rounded-2xl shadow-2xl shadow-black/60"
              style={{
                background: 'rgba(8,11,19,0.98)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(24px)',
              }}
              role="dialog"
              aria-label="Notifications"
            >
              <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                <p className="text-sm font-bold text-white">Recent Activity</p>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400 transition-all hover:text-white active:scale-95"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="max-h-[min(300px,50vh)] overflow-y-auto">
                {stats.recentActivity.length > 0 ? (
                  <div className="space-y-px p-2">
                    {stats.recentActivity.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5">
                        <div className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                          item.type === 'habit' ? 'bg-emerald-500/15 text-emerald-400' :
                          item.type === 'note' ? 'bg-amber-500/15 text-amber-400' :
                          item.type === 'focus' ? 'bg-blue-500/15 text-blue-400' :
                          'bg-violet-500/15 text-violet-400'
                        )}>
                          <item.icon className="h-3 w-3" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-white">{item.detail}</p>
                          <p className="text-[10px] text-zinc-600">{item.title}</p>
                        </div>
                        <span className="shrink-0 text-[10px] text-zinc-600">{formatActivityTime(item.date)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <Clock className="h-5 w-5 text-zinc-700" />
                    <p className="text-xs text-zinc-600">No recent activity</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main hero content */}
      <div className="relative flex items-start justify-between gap-3">
        {/* Left: greeting + buttons */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-400">{greeting}</p>
          <h1
            className="font-display text-[1.85rem] font-black leading-tight tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #93c5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {firstName}.
          </h1>
          <p className="mt-1 text-sm font-medium text-zinc-400">{subtitle}</p>

          {/* Action buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {/* Live sync pill */}
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
              style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.25)',
                color: '#34d399',
                boxShadow: '0 0 12px rgba(16,185,129,0.15)',
              }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
              <Wifi className="h-3 w-3" />
              {syncLabel}
            </div>

            {/* Quick Add button */}
            <button
              onClick={onQuickAdd}
              className="premium-control flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #6366f1, #0ea5e9)',
                boxShadow: '0 0 16px rgba(139,92,246,0.4), 0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <Plus className="h-3 w-3" />
              Quick Add
            </button>
          </div>

          {lastSyncedAt && (
            <p className="mt-2 text-[10px] text-zinc-700">{syncStatus}</p>
          )}
        </div>

        {/* Right: Momentum Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.28, type: 'spring', stiffness: 180, damping: 18 }}
          className="shrink-0"
        >
          <MomentumOrb momentum={stats.momentum} trend={trend} />
        </motion.div>
      </div>
    </motion.div>
  );
}
