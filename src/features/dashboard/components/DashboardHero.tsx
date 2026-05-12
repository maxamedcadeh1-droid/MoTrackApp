import { useEffect, useRef } from 'react';
import { Bell, Plus, TrendingUp, TrendingDown, ArrowRight, Wifi, X, Clock } from 'lucide-react';
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
  const TrendIcon = trend.trend === 'down' ? TrendingDown : trend.trend === 'stable' ? ArrowRight : TrendingUp;
  const trendColor = trend.trend === 'up' ? 'text-emerald-400' : trend.trend === 'down' ? 'text-red-400' : 'text-zinc-400';
  const trendBadgeText = trend.trend === 'stable' ? '0%' : `${trend.percentage}%`;

  const panelRef = useRef<HTMLDivElement>(null);

  // Close notification panel on outside click
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
    <div className="luxury-card relative overflow-visible rounded-[1.7rem] p-5">
      <div className="pointer-events-none absolute inset-0 rounded-[1.7rem] bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/5" />

      {/* Main hero row */}
      <div className="relative flex items-start gap-3">
        {/* Left: text content — takes all available space */}
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

        {/* Right: orb + action buttons — fixed width, never grows */}
        <div className="relative shrink-0" ref={panelRef}>
          <MomentumOrb momentum={stats.momentum} />

          {/* Action buttons row below orb */}
          <div className="mt-2 flex items-center justify-end gap-1.5">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-400 transition-all hover:text-white active:scale-95',
                notificationsOpen && 'border-accent/30 bg-accent/10 text-accent'
              )}
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
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

          {/* Notification panel — anchored to the right side, z-[200] to stay above everything */}
          {notificationsOpen && (
            <div
              className="absolute right-0 top-full z-[200] mt-2 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#080b13]/98 shadow-2xl shadow-black/60 backdrop-blur-2xl"
              role="dialog"
              aria-label="Notifications"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                <p className="text-sm font-bold text-white">Recent Activity</p>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-400 transition-all hover:text-white active:scale-95"
                  aria-label="Close notifications"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Scrollable activity list */}
              <div className="max-h-[min(320px,50vh)] overflow-y-auto">
                {stats.recentActivity.length > 0 ? (
                  <div className="space-y-px p-2">
                    {stats.recentActivity.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
                      >
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            item.type === 'habit' ? 'bg-emerald-500/15 text-emerald-400' :
                            item.type === 'note' ? 'bg-amber-500/15 text-amber-400' :
                            item.type === 'focus' ? 'bg-blue-500/15 text-blue-400' :
                            'bg-violet-500/15 text-violet-400'
                          )}
                        >
                          <item.icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-white">{item.detail}</p>
                          <p className="text-[10px] text-zinc-600">{item.title}</p>
                        </div>
                        <span className="shrink-0 text-[10px] text-zinc-600">
                          {formatActivityTime(item.date)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <Clock className="h-6 w-6 text-zinc-700" />
                    <p className="text-xs text-zinc-600">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {lastSyncedAt && (
        <p className="relative mt-3 text-[10px] text-zinc-600">{syncStatus}</p>
      )}
    </div>
  );
}
