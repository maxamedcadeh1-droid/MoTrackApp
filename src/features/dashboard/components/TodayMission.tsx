import { ArrowRight, CheckCircle2, Sparkles, Target } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface TodayMissionProps {
  incompleteHabits: number;
  totalHabits: number;
  habitsCompleted: number;
  remainingFocusMinutes: number;
  activeProjects: number;
  navigate: (path: string) => void;
}

export function TodayMission({
  incompleteHabits,
  totalHabits,
  habitsCompleted,
  remainingFocusMinutes,
  activeProjects,
  navigate,
}: TodayMissionProps) {
  const steps = [
    {
      num: 1,
      title: 'Complete your habits',
      desc: totalHabits > 0 ? `${habitsCompleted} of ${totalHabits} done` : 'Add a habit to start',
      path: '/habits',
      done: incompleteHabits === 0 && totalHabits > 0,
      dot: 'bg-emerald-500',
      line: 'bg-emerald-500/20',
    },
    {
      num: 2,
      title: 'Start a focus session',
      desc: remainingFocusMinutes > 0 ? `${remainingFocusMinutes} min left to hit goal` : 'Focus goal complete!',
      path: '/focus?start=true',
      done: remainingFocusMinutes === 0,
      dot: 'bg-blue-500',
      line: 'bg-blue-500/20',
    },
    {
      num: 3,
      title: 'Review your projects',
      desc: activeProjects > 0 ? `${activeProjects} active project${activeProjects === 1 ? '' : 's'}` : 'Create a project',
      path: '/projects',
      done: false,
      dot: 'bg-amber-500',
      line: 'bg-amber-500/20',
    },
  ];

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
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-2xl"
            style={{
              background: 'rgba(139,92,246,0.15)',
              color: '#a78bfa',
              boxShadow: '0 0 18px rgba(139,92,246,0.28)',
            }}
          >
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Today's Mission</h2>
            <p className="text-[10px] text-zinc-500">Your roadmap to a productive day</p>
          </div>
        </div>
        <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-zinc-500">
          3 steps
        </span>
      </div>

      {/* Steps */}
      <div>
        {steps.map((item, idx, arr) => (
          <div key={item.num} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                  item.done ? 'bg-emerald-500' : item.dot
                )}
                style={{ boxShadow: '0 0 14px rgba(139,92,246,0.2)' }}
              >
                {item.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : item.num}
              </div>
              {idx < arr.length - 1 && (
                <div className={cn('mt-1 w-px flex-1', item.line)} style={{ minHeight: 18 }} />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={cn('text-sm font-semibold', item.done ? 'text-zinc-500 line-through' : 'text-white')}>
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => navigate(item.path)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-400 transition-all hover:border-violet-500/30 hover:text-white active:scale-95"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
        <p className="text-xs text-zinc-500">Keep going! Small steps, big results.</p>
      </div>
    </div>
  );
}
