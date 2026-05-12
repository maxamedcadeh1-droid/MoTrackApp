import { CheckCircle2, Clock, Target, TrendingUp, Zap } from 'lucide-react';
import { Card, Button } from '../../components/ui/Layout';
import { cn } from '../../lib/utils';

interface SuggestedNextActionProps {
  stats: {
    totalHabits: number;
    habitsCompleted: number;
    focusMinutes: number;
    dailyGoal: number;
    activeProjects: number;
    momentum: number;
    previousMomentum: number;
  };
  navigate: (path: string) => void;
}

export function SuggestedNextAction({ stats, navigate }: SuggestedNextActionProps) {
  const incompleteHabits = Math.max(stats.totalHabits - stats.habitsCompleted, 0);
  const remainingFocus = Math.max(stats.dailyGoal - stats.focusMinutes, 0);
  const momentumTrend = stats.momentum - stats.previousMomentum;

  const suggestions = [
    {
      id: 'complete-habit',
      title: 'Complete a habit',
      description: `${incompleteHabits} habit${incompleteHabits === 1 ? '' : 's'} left today`,
      action: 'Open Habits',
      icon: CheckCircle2,
      priority: incompleteHabits > 0 ? 'high' : 'low',
      path: '/habits',
    },
    {
      id: 'start-focus',
      title: 'Start focus session',
      description: `${remainingFocus} minutes to reach your daily goal`,
      action: 'Start Focus',
      icon: Clock,
      priority: remainingFocus > 0 ? 'high' : 'low',
      path: '/focus?start=true',
    },
    {
      id: 'create-project',
      title: 'Create your next project',
      description: 'Turn a goal into a visible plan',
      action: 'Create Project',
      icon: Target,
      priority: stats.activeProjects === 0 ? 'high' : 'low',
      path: '/projects?add=true',
    },
    {
      id: 'review-progress',
      title: 'Review your progress',
      description: `Momentum ${momentumTrend > 0 ? 'up' : momentumTrend < 0 ? 'down' : 'stable'} vs yesterday`,
      action: 'View Analytics',
      icon: TrendingUp,
      priority: 'medium',
      path: '/analytics',
    },
  ];

  const topSuggestion = suggestions.sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (b.priority === 'high' && a.priority !== 'high') return 1;
    if (a.id === 'complete-habit' && incompleteHabits > 0) return -1;
    if (b.id === 'complete-habit' && incompleteHabits > 0) return 1;
    if (a.id === 'start-focus' && remainingFocus > 0) return -1;
    if (b.id === 'start-focus' && remainingFocus > 0) return 1;
    return 0;
  })[0];

  return (
    <Card className="glass-card border-white/10 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-[0_18px_40px_rgba(139,92,246,0.18)]">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-400">Suggested next action</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Highest-impact move</h3>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/10 bg-[#090a12]/85 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/5 text-accent">
            <topSuggestion.icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xl font-semibold text-white">{topSuggestion.title}</h4>
            <p className="mt-2 text-sm text-zinc-400">{topSuggestion.description}</p>
          </div>
        </div>

        <Button
          onClick={() => navigate(topSuggestion.path)}
          className="mt-6 w-full justify-center rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_24px_80px_rgba(139,92,246,0.24)]"
        >
          {topSuggestion.action}
        </Button>
      </div>
    </Card>
  );
}
