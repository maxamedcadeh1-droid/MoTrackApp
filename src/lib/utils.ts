import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function calculateDailyStreak(dates: string[], anchorDate = new Date()) {
  if (!dates.length) return 0;

  const completedDays = new Set(
    dates
      .map((date) => (/^\d{4}-\d{2}-\d{2}$/.test(date) ? date : dateKey(startOfDay(new Date(date)))))
      .filter(Boolean)
  );

  const today = startOfDay(anchorDate);
  
  // 4-hour buffer: If it's before 4 AM, consider "today" as yesterday for streak maintenance
  const isEarlyMorning = anchorDate.getHours() < 4;
  if (isEarlyMorning && !completedDays.has(dateKey(today))) {
    today.setDate(today.getDate() - 1);
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const cursor = completedDays.has(dateKey(today)) ? today : yesterday;
  if (!completedDays.has(dateKey(cursor))) return 0;

  let streak = 0;
  while (completedDays.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function deriveProjectProgress(project: { status?: string | null; progress?: number | null; project_tasks?: Array<{ is_done?: boolean | null }> | null }) {
  const tasks = project.project_tasks || [];
  if (tasks.length > 0) {
    const completedTasks = tasks.filter((task) => task.is_done).length;
    return Math.round((completedTasks / tasks.length) * 100);
  }

  if (project.status === 'completed') return 100;
  return Math.max(0, Math.min(100, Math.round(project.progress || 0)));
}
