import { lazy, Suspense } from 'react';
import { Skeleton } from '../../../components/ui/Layout';

const DashboardChart = lazy(() =>
  import('../DashboardChart').then((mod) => ({ default: mod.DashboardChart }))
);

interface WeeklyPoint {
  day: string;
  habitsCompleted: number;
  focusMinutes: number;
  tasksCompleted: number;
  projectProgress: number;
}

interface ProductivityPulseProps {
  data: WeeklyPoint[];
}

export function ProductivityPulse({ data }: ProductivityPulseProps) {
  return (
    <div
      className="relative overflow-hidden rounded-[1.75rem] p-5"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%), rgba(7,10,23,0.88)',
        border: '1px solid rgba(148,163,184,0.12)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Productivity Pulse</h2>
          <p className="text-[10px] text-zinc-500">This week's overview</p>
        </div>
        <span className="rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-zinc-500">
          This Week
        </span>
      </div>

      {/* Legend */}
      <div className="mb-2 flex items-center gap-4 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Focus
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Habits
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          Tasks
        </span>
      </div>

      {/* Chart */}
      <div className="h-[150px] w-full min-w-0">
        <Suspense fallback={<Skeleton className="h-full w-full rounded-xl" />}>
          <DashboardChart data={data} />
        </Suspense>
      </div>
    </div>
  );
}
