import { useMemo } from 'react';
import { cn } from '../lib/utils';

interface HabitHeatmapProps {
  completedDates: string[];
  months?: number;
  showStats?: boolean;
}

interface DayData {
  date: string;
  count: number;
  month: string;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['', 'M', '', 'W', '', 'F', ''];

function getHeatmapLevel(count: number, maxCount: number): number {
  if (count === 0) return 0;
  if (maxCount === 0) return 1;
  const ratio = count / maxCount;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}

function getLevelClasses(level: number): string {
  const base = 'rounded-sm transition-all duration-200';
  switch (level) {
    case 0: return `${base} bg-white/[0.03] border border-white/[0.04]`;
    case 1: return `${base} bg-violet-500/20 border border-violet-500/30`;
    case 2: return `${base} bg-violet-500/40 border border-violet-500/50`;
    case 3: return `${base} bg-blue-500/60 border border-blue-500/70`;
    case 4: return `${base} bg-blue-500/80 border border-blue-500/90 shadow-[0_0_10px_rgba(59,130,246,0.45)]`;
    default: return `${base} bg-white/[0.03]`;
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function calculateStreak(completedDates: string[]): { current: number; best: number } {
  if (completedDates.length === 0) return { current: 0, best: 0 };

  const sorted = [...completedDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if streak is active (completed today or yesterday)
  const lastDate = new Date(sorted[0]);
  lastDate.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let current = 0;
  if (diff <= 1) {
    current = 1;
    let checkDate = lastDate;
    for (let i = 1; i < sorted.length; i++) {
      const d = new Date(sorted[i]);
      d.setHours(0, 0, 0, 0);
      const dayDiff = Math.floor((checkDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff <= 1) {
        current++;
        checkDate = d;
      } else {
        break;
      }
    }
  }

  // Calculate best streak
  let best = 1;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const d1 = new Date(sorted[i - 1]);
    const d2 = new Date(sorted[i]);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    const dayDiff = Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff <= 1) {
      streak++;
      best = Math.max(best, streak);
    } else {
      streak = 1;
    }
  }

  return { current, best };
}

export function HabitHeatmap({ completedDates, months = 6, showStats = true }: HabitHeatmapProps) {
  const heatmapData = useMemo(() => {
    const data: DayData[] = [];
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(startDate.getDate() + 1); // Include start date

    // Count completions per day
    const completionCount = new Map<string, number>();
    completedDates.forEach(date => {
      completionCount.set(date, (completionCount.get(date) || 0) + 1);
    });

    // Generate all days
    const currentDate = new Date(startDate);
    let currentMonth = '';
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
      
      if (monthKey !== currentMonth) {
        currentMonth = monthKey;
      }

      data.push({
        date: dateStr,
        count: completionCount.get(dateStr) || 0,
        month: MONTH_NAMES[currentDate.getMonth()],
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  }, [completedDates, months]);

  const maxCount = useMemo(() => {
    return Math.max(...heatmapData.map(d => d.count), 1);
  }, [heatmapData]);

  const { current: currentStreak, best: bestStreak } = useMemo(() => {
    return calculateStreak(completedDates);
  }, [completedDates]);

  const totalCompleted = completedDates.length;
  const totalDays = heatmapData.length;
  const completionRate = totalDays > 0 ? Math.round((completedDates.filter(d => {
    const date = new Date(d + 'T00:00:00');
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    return date >= startDate;
  }).length / totalDays) * 100) : 0;

  // Group days by week
  const weeks: (DayData | null)[][] = [];
  let currentWeek: (DayData | null)[] = [];
  
  // Pad the first week if it doesn't start on Sunday (day 0)
  const firstHeatmapDay = heatmapData[0];
  if (firstHeatmapDay) {
    const firstDate = new Date(firstHeatmapDay.date + 'T00:00:00');
    const firstDayOfWeek = Number.isNaN(firstDate.getTime()) ? 0 : firstDate.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }
  }

  heatmapData.forEach((day) => {
    const date = new Date(day.date + 'T00:00:00');
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      // Fill the rest of the week if necessary (shouldn't happen with Sunday start)
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  
  if (currentWeek.length > 0) {
    // Pad the last week
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  // Get unique months for header
  const monthHeaders = useMemo(() => {
    const months: { name: string; offset: number }[] = [];
    let lastMonth = '';

    weeks.forEach((week, weekIndex) => {
      // Find first non-null day in week to get the month name
      const firstValidDay = week.find((d) => d !== null);
      const monthName = firstValidDay?.month;

      if (!monthName) return;
      if (monthName !== lastMonth) {
        months.push({ name: monthName, offset: weekIndex });
        lastMonth = monthName;
      }
    });

    return months;
  }, [weeks]);

  return (
    <div className="space-y-4">
      {showStats && (
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
            <span className="text-xs text-zinc-400">
              <span className="font-semibold text-white">{currentStreak}</span> day streak
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              Best: <span className="font-semibold text-white">{bestStreak}</span> days
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              <span className="font-semibold text-white">{completionRate}%</span> completion rate
            </span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month headers */}
          <div className="relative mb-2 h-5">
            {monthHeaders.map((month, index) => (
              <span
                key={`${month.name}-${index}`}
                className="absolute text-[10px] font-semibold text-zinc-600"
                style={{ left: `${month.offset * (16 + 3)}px` }}
              >
                {month.name}
              </span>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-[3px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px]">
              {DAY_NAMES.map((day, index) => (
                <div
                  key={index}
                  className="flex h-4 w-3 items-center justify-center"
                >
                  <span className="text-[8px] font-medium text-zinc-600">
                    {day}
                  </span>
                </div>
              ))}
            </div>

            {/* Heatmap cells */}
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${weekIndex}-${dayIndex}`}
                          className="h-4 w-4 rounded-sm bg-transparent opacity-0"
                        />
                      );
                    }
                    const level = getHeatmapLevel(day.count, maxCount);
                    return (
                      <div
                        key={day.date}
                        className={cn(
                          'h-4 w-4',
                          getLevelClasses(level)
                        )}
                        title={`${formatDate(day.date)}: ${day.count} habit${day.count !== 1 ? 's' : ''} completed`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <span className="text-[10px] text-zinc-600">Less</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={cn('h-3 w-3 rounded-sm', getLevelClasses(level))}
              />
            ))}
            <span className="text-[10px] text-zinc-600">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
