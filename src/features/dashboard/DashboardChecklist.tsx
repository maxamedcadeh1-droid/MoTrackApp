import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Target, Clock, FileText, BarChart3 } from 'lucide-react';
import { Card, Button } from '../../components/ui/Layout';
import { cn } from '../../lib/utils';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  action: string;
  icon: React.ComponentType<{ className?: string }>;
  completed: boolean;
  onClick: () => void;
}

interface DashboardChecklistProps {
  stats: {
    totalHabits: number;
    activeProjects: number;
    focusMinutes: number;
  };
  navigate: (path: string) => void;
  onComplete?: () => void;
}

export function DashboardChecklist({ stats, navigate, onComplete }: DashboardChecklistProps) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const checklistItems: ChecklistItem[] = [
    {
      id: 'create-habit',
      title: 'Create your first habit',
      description: 'Start with one routine you can repeat daily',
      action: 'Create Habit',
      icon: Target,
      completed: stats.totalHabits > 0,
      onClick: () => navigate('/habits?add=true'),
    },
    {
      id: 'start-focus',
      title: 'Try a focus session',
      description: 'Experience deep work with time blocking',
      action: 'Start Focus',
      icon: Clock,
      completed: stats.focusMinutes > 0,
      onClick: () => navigate('/focus?start=true'),
    },
    {
      id: 'create-project',
      title: 'Plan your first project',
      description: 'Turn a goal into a visible plan with tasks',
      action: 'Create Project',
      icon: CheckCircle2,
      completed: stats.activeProjects > 0,
      onClick: () => navigate('/projects?add=true'),
    },
    {
      id: 'write-note',
      title: 'Capture a thought',
      description: 'Keep ideas organized and easy to find',
      action: 'Write Note',
      icon: FileText,
      completed: false, // We'll track this separately if needed
      onClick: () => navigate('/notes?add=true'),
    },
    {
      id: 'view-analytics',
      title: 'Check your progress',
      description: 'See how your habits and focus build momentum',
      action: 'View Analytics',
      icon: BarChart3,
      completed: false, // We'll track this separately if needed
      onClick: () => navigate('/analytics'),
    },
  ];

  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const isComplete = completedCount === totalCount;

  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  if (isComplete) {
    return (
      <Card className="border-white/10 bg-[#080b13]/72 p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="font-display text-lg font-semibold text-white mb-2">Setup complete!</h3>
          <p className="text-sm text-zinc-500 mb-4">You're all set to build momentum</p>
          <Button
            onClick={() => navigate('/analytics')}
            size="sm"
            variant="outline"
            className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
          >
            View your progress
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-[#080b13]/72 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">Get started</h3>
          <p className="text-sm text-zinc-500">Complete these steps to unlock your full potential</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{completedCount}</div>
          <div className="text-xs text-zinc-500">of {totalCount}</div>
        </div>
      </div>

      <div className="space-y-3">
        {checklistItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left group"
          >
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
              item.completed
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-white/10 text-zinc-500 group-hover:bg-accent/20 group-hover:text-accent"
            )}>
              {item.completed ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white text-sm">{item.title}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{item.description}</div>
            </div>
            <div className="text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
              {item.action}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="w-full bg-white/10 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-accent to-blue-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>
    </Card>
  );
}