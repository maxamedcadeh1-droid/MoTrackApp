import { motion } from 'motion/react';
import { Bell, Plus, Sparkles } from 'lucide-react';
import { MomentumOrb } from './MomentumOrb';
import { cn } from '../../../lib/utils';

interface DashboardHeroProps {
  greeting: string;
  firstName: string;
  subtitle: string;
  stats: any;
  syncLabel: string;
  syncStatus: string;
  lastSyncedAt: string;
  onQuickAdd: () => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (val: boolean) => void;
  formatActivityTime: (date: string) => string;
  trend: any;
  navigate: (path: string) => void;
}

export function DashboardHero({
  greeting, firstName, subtitle, stats, syncLabel, syncStatus, lastSyncedAt,
  onQuickAdd, notificationsOpen, setNotificationsOpen, formatActivityTime, trend, navigate
}: DashboardHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] bg-[#05060a] border border-white/5 px-6 py-8 sm:p-10">
      {/* Cinematic Lighting */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[100px]" />

      <div className="relative z-10 flex items-center justify-between">
        <motion.p 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text font-display text-2xl font-bold tracking-tight text-transparent"
        >
          MoTrack
        </motion.p>
        
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] text-zinc-400 transition-all hover:bg-white/[0.06] hover:text-white"
          >
            <Bell className="h-5 w-5" />
            {stats.recentActivity.length > 0 && (
              <span className="absolute right-3.5 top-3.5 h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
            )}
          </button>

          {notificationsOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute right-0 top-16 z-50 w-72 overflow-hidden rounded-3xl border border-white/10 bg-[#0c0e14] p-2 shadow-2xl backdrop-blur-2xl"
            >
              <div className="p-3 border-b border-white/5 mb-2">
                <p className="text-xs font-bold text-white">Activity Feed</p>
                <p className="text-[10px] text-zinc-500 mt-1">{syncStatus}</p>
              </div>
              <div className="space-y-1">
                {stats.recentActivity.slice(0, 3).map((item: any) => (
                  <button 
                    key={item.id}
                    className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-white/[0.03] transition-colors"
                    onClick={() => { setNotificationsOpen(false); navigate(item.type === 'note' ? '/notes' : '/habits'); }}
                  >
                    <div className="h-8 w-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <item.icon className="h-4 w-4 text-violet-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-zinc-200">{item.detail}</p>
                      <p className="text-[9px] text-zinc-500 uppercase">{formatActivityTime(item.date)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl font-bold tracking-tight text-white sm:text-7xl"
          >
            <span className="opacity-40">{greeting}</span><br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-blue-400 bg-clip-text text-transparent">{firstName}.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg font-medium text-zinc-500"
          >
            {subtitle}
          </motion.p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button className={cn("inline-flex h-12 items-center gap-2 rounded-2xl border px-5 text-sm font-bold transition-all", lastSyncedAt ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-white/5 bg-white/5 text-zinc-400")}>
              <span className={cn("h-2 w-2 rounded-full", lastSyncedAt ? "animate-pulse bg-emerald-400" : "bg-zinc-600")} />
              {syncLabel}
            </button>
            <button onClick={onQuickAdd} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 active:scale-95">
              <Plus className="h-4 w-4" /> Quick Add
            </button>
          </div>
        </div>
        <MomentumOrb momentum={stats.momentum} trend={trend} />
      </div>
    </section>
  );
}