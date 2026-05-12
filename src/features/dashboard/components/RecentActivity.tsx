import { Sparkles } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ActivityItem {
  id: string;
  type: 'note' | 'habit' | 'project' | 'focus';
  title: string;
  detail: string;
  date: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface RecentActivityProps {
  items: ActivityItem[];
  formatTime: (value: string) => string;
  navigate: (path: string) => void;
}

export function RecentActivity({ items, formatTime, navigate }: RecentActivityProps) {
  return (
    <div
      className="relative overflow-hidden rounded-[1.75rem] p-5"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%), rgba(7,10,23,0.88)',
        border: '1px solid rgba(148,163,184,0.12)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Recent Activity</h2>
        <button
          onClick={() => navigate('/notes')}
          className="text-[10px] font-bold text-violet-400 transition-colors hover:text-violet-300"
        >
          View all
        </button>
      </div>

      <div className="space-y-2">
        {items.length > 0 ? (
          items.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  item.type === 'habit' ? 'bg-emerald-500/15 text-emerald-400' :
                  item.type === 'note'  ? 'bg-amber-500/15 text-amber-400' :
                  item.type === 'focus' ? 'bg-blue-500/15 text-blue-400' :
                  'bg-violet-500/15 text-violet-400'
                )}
              >
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{item.detail}</p>
                <p className="text-[10px] text-zinc-600">{item.title}</p>
              </div>
              <span className="shrink-0 text-[10px] text-zinc-600">{formatTime(item.date)}</span>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 py-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
              <Sparkles className="h-4 w-4 text-zinc-600" />
            </div>
            <p className="text-xs text-zinc-600">No activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
