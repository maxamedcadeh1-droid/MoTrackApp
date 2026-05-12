import { Bell, Plus, TrendingUp, TrendingDown, ArrowRight, Wifi } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { MomentumOrb } from './MomentumOrb';

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
    recentActivity: { id: string; type: string; title: string; detail: string; date: string; icon: any }[];
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
  navigate,
}: DashboardHeroProps) {
  const TrendIcon = trend.trend === 'down' ? TrendingDown : trend.trend === 'stable' ? ArrowRight : TrendingUp;
  const trendColor = trend.trend === 'up' ? 'text-emerald-400' : trend.trend === 'down' ? 'text-red-400' : 'text-zinc-400';
  const trendBadgeText = trend.trend === 'stable' ? '0%' : `${trend.percentage}%`;

  return (
    <div className="luxury-card relative overflow-hidden rounded-[1.7rem] p-5">
      <div className="pointer-events-none absolute inset-0 rounded-[1.7rem] bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/5" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              <Wifi className="h-2.5 w-2.5" />
              {syncLabel}
            </span>
          </div>
          <h1 className="font-display text-xl font-bold leading-tight text-white sm:text-2xl">
            {greeting} <span className="text-accent">{firstName}</span>
          </h1>
          <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>

          <div className="mt-3 flex items-center gap-2">
            <div className={cn('flex items-center gap-1 text-xs font-bold', trendColor)}>
              <TrendIcon className="h-3.5 w-3.5" />
              {trendBadgeText}
            </div>
            <span className="text-[10px] text-zinc-600">vs yesterday</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <MomentumOrb momentum={stats.momentum} />
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 transition-all hover:text-white active:scale-95"
              aria-label="Notifications"
            >
              <Bell className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onQuickAdd}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 transition-all active:scale-95"
              aria-label="Quick add"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {lastSyncedAt && (
        <p className="relative mt-3 text-[10px] text-zinc-600">{syncStatus}</p>
      )}
    </div>
  );
}
