import React from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, Clock, Target } from 'lucide-react';
import { Card } from '../../components/ui/Layout';
import { cn } from '../../lib/utils';

interface WeeklySummaryProps {
  stats: {
    momentum: number;
    previousMomentum: number;
    habitsCompleted: number;
    totalHabits: number;
    focusMinutes: number;
    dailyGoal: number;
    activeProjects: number;
    completedProjectTasks: number;
    totalProjectTasks: number;
  };
  weeklyData: Array<{
    day: string;
    score: number;
    focus: number;
    habits: number;
  }>;
}

export function WeeklyProductivitySummary({ stats, weeklyData }: WeeklySummaryProps) {
  const momentumChange = stats.momentum - stats.previousMomentum;
  const momentumTrend = momentumChange > 0 ? 'up' : momentumChange < 0 ? 'down' : 'stable';

  const avgDailyFocus = weeklyData.reduce((sum, day) => sum + day.focus, 0) / 7;
  const avgDailyHabits = weeklyData.reduce((sum, day) => sum + day.habits, 0) / 7;
  const bestDay = weeklyData.reduce((best, day) =>
    day.score > best.score ? day : best, weeklyData[0]
  );

  const habitConsistency = stats.totalHabits > 0 ? (stats.habitsCompleted / stats.totalHabits) * 100 : 0;
  const projectProgress = stats.totalProjectTasks > 0 ? (stats.completedProjectTasks / stats.totalProjectTasks) * 100 : 0;

  return (
    <Card className="border-white/10 bg-[#080b13]/72 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-white">This week</h3>
          <p className="text-sm text-zinc-500">Your productivity summary</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              momentumTrend === 'up' ? "bg-emerald-500/10 text-emerald-400" :
              momentumTrend === 'down' ? "bg-red-500/10 text-red-400" :
              "bg-zinc-500/10 text-zinc-400"
            )}>
              {momentumTrend === 'up' ? <TrendingUp className="w-4 h-4" /> :
               momentumTrend === 'down' ? <TrendingDown className="w-4 h-4" /> :
               <Minus className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.momentum}</div>
              <div className="text-xs text-zinc-500">Momentum score</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{Math.round(avgDailyFocus)}m</div>
              <div className="text-xs text-zinc-500">Daily focus avg</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{Math.round(avgDailyHabits)}</div>
              <div className="text-xs text-zinc-500">Habits per day</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{bestDay.day}</div>
              <div className="text-xs text-zinc-500">Best day</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Habit consistency</span>
          <span className="text-sm font-medium text-white">{Math.round(habitConsistency)}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-1.5 rounded-full"
            style={{ width: `${habitConsistency}%` }}
          />
        </div>

        {stats.totalProjectTasks > 0 && (
          <>
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-zinc-400">Project progress</span>
              <span className="text-sm font-medium text-white">{Math.round(projectProgress)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-400 h-1.5 rounded-full"
                style={{ width: `${projectProgress}%` }}
              />
            </div>
          </>
        )}
      </div>
    </Card>
  );
}