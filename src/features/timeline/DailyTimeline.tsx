import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlarmClock,
  Bed,
  Briefcase,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Timer,
} from 'lucide-react';
import { Card, Button, Skeleton, Toast, Badge } from '../../components/ui/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { cn, dateKey } from '../../lib/utils';

type TimelineItem = {
  id: string;
  sourceId?: string;
  type: 'wake' | 'habit' | 'task' | 'focus' | 'sleep';
  title: string;
  subtitle: string;
  time?: string;
  status: 'scheduled' | 'complete' | 'missed' | 'active';
  color: string;
  actionLabel?: string;
  route?: string;
};

function isTodayReminder(days?: number[]) {
  if (!days || days.length === 0) return true;
  return days.includes(new Date().getDay());
}

function isMorning(time?: string) {
  const hour = Number.parseInt(time?.split(':')[0] || '12', 10);
  return hour >= 4 && hour <= 9;
}

function displayTime(value?: string) {
  if (!value) return 'Anytime';
  if (/^\d{2}:\d{2}/.test(value)) {
    const [hours, minutes] = value.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Anytime';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function sortValue(item: TimelineItem) {
  if (!item.time) return 24 * 60 + 1;
  if (/^\d{2}:\d{2}/.test(item.time)) {
    const [hours, minutes] = item.time.split(':').map(Number);
    return hours * 60 + minutes;
  }
  const date = new Date(item.time);
  return Number.isNaN(date.getTime()) ? 24 * 60 + 1 : date.getHours() * 60 + date.getMinutes();
}

function typeIcon(type: TimelineItem['type']) {
  if (type === 'wake') return AlarmClock;
  if (type === 'task') return Briefcase;
  if (type === 'focus') return Timer;
  if (type === 'sleep') return Bed;
  return CheckCircle2;
}

function calculateStreak(dates: string[]) {
  if (!dates.length) return 0;
  const dateSet = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (dateSet.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function DailyTimeline() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as any });
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);

  const fetchTimeline = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [{ data: habits }, { data: tasks }, { data: sessions }, { data: settings }] = await Promise.all([
        (supabase.from('habits') as any)
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true),
        (supabase.from('project_tasks') as any)
          .select('*, projects(title,color,status)')
          .eq('user_id', user.id),
        (supabase.from('focus_sessions') as any)
          .select('*')
          .eq('user_id', user.id)
          .gte('started_at', `${todayKey}T00:00:00`)
          .lte('started_at', `${todayKey}T23:59:59`)
          .order('started_at', { ascending: true }),
        (supabase.from('settings') as any)
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      const habitItems: TimelineItem[] = (habits || [])
        .filter((habit: any) => habit.reminder_enabled && habit.reminder_time && isTodayReminder(habit.reminder_days))
        .map((habit: any) => {
          const complete = habit.completed_dates?.includes(todayKey);
          return {
            id: `habit-${habit.id}`,
            sourceId: habit.id,
            type: isMorning(habit.reminder_time) ? 'wake' : 'habit',
            title: habit.title,
            subtitle: habit.category || 'Habit',
            time: habit.reminder_time,
            status: complete ? 'complete' : 'scheduled',
            color: habit.color || '#8b5cf6',
            actionLabel: complete ? 'Done' : 'Complete',
            route: '/habits',
          };
        });

      const taskItems: TimelineItem[] = (tasks || [])
        .filter((task: any) => {
          const dueToday = task.due_date?.startsWith(todayKey);
          const reminderToday = task.reminder_enabled && task.reminder_time && isTodayReminder(task.reminder_days);
          return dueToday || reminderToday;
        })
        .map((task: any) => ({
          id: `task-${task.id}`,
          sourceId: task.id,
          type: 'task',
          title: task.title,
          subtitle: task.projects?.title || 'Project task',
          time: task.reminder_time || task.due_date,
          status: task.is_done ? 'complete' : 'scheduled',
          color: task.projects?.color || '#3b82f6',
          actionLabel: task.is_done ? 'Done' : 'Finish',
          route: '/projects',
        }));

      const focusItems: TimelineItem[] = (sessions || []).map((session: any) => ({
        id: `focus-${session.id}`,
        sourceId: session.id,
        type: 'focus',
        title: `${session.completed_minutes || session.duration_minutes || 0} minute focus session`,
        subtitle: session.status || 'Focus',
        time: session.started_at,
        status: session.status === 'completed' ? 'complete' : 'active',
        color: '#22d3ee',
        route: '/focus',
      }));

      const sleepItems: TimelineItem[] = settings?.sleep_reminder_enabled && settings?.sleep_reminder_time && isTodayReminder(settings.sleep_reminder_days)
        ? [{
          id: `sleep-${user.id}`,
          type: 'sleep',
          title: 'Night Shutdown',
          subtitle: 'Reflection and tomorrow preview',
          time: settings.sleep_reminder_time,
          status: 'scheduled',
          color: '#60a5fa',
          route: '/settings',
        }]
        : [];

      setItems([...habitItems, ...taskItems, ...focusItems, ...sleepItems].sort((a, b) => sortValue(a) - sortValue(b)));
    } catch (error: any) {
      console.error('Fetch timeline error:', error);
      setToast({ show: true, message: 'Timeline could not load', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [todayKey, user]);

  useEffect(() => {
    void fetchTimeline();
  }, [fetchTimeline]);

  const completeHabit = async (item: TimelineItem) => {
    if (!user || !item.sourceId) return;

    const { data } = await (supabase.from('habits') as any)
      .select('completed_dates,streak,best_streak')
      .eq('id', item.sourceId)
      .eq('user_id', user.id)
      .single();

    const completedDates = data?.completed_dates || [];
    if (completedDates.includes(todayKey)) return;

    const nextDates = [...completedDates, todayKey];
    const streak = calculateStreak(nextDates);
    const { error } = await (supabase.from('habits') as any)
      .update({
        completed_dates: nextDates,
        streak,
        best_streak: Math.max(streak, data?.best_streak || 0),
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.sourceId)
      .eq('user_id', user.id);

    if (error) {
      setToast({ show: true, message: 'Could not complete habit', type: 'error' });
      return;
    }

    setToast({ show: true, message: 'Habit completed', type: 'success' });
    window.dispatchEvent(new Event('motrack:habit-updated'));
    void fetchTimeline();
  };

  const completeTask = async (item: TimelineItem) => {
    if (!user || !item.sourceId) return;

    const { error } = await (supabase.from('project_tasks') as any)
      .update({ is_done: true, updated_at: new Date().toISOString() })
      .eq('id', item.sourceId)
      .eq('user_id', user.id);

    if (error) {
      setToast({ show: true, message: 'Could not complete task', type: 'error' });
      return;
    }

    setToast({ show: true, message: 'Task completed', type: 'success' });
    window.dispatchEvent(new Event('motrack:reminders-updated'));
    void fetchTimeline();
  };

  const runQuickAction = (item: TimelineItem) => {
    if (item.status === 'complete') {
      if (item.route) navigate(item.route);
      return;
    }

    if (item.type === 'habit' || item.type === 'wake') {
      void completeHabit(item);
      return;
    }

    if (item.type === 'task') {
      void completeTask(item);
      return;
    }

    if (item.route) navigate(item.route);
  };

  const completedCount = items.filter((item) => item.status === 'complete').length;
  const scheduledCount = items.filter((item) => item.status !== 'complete').length;

  return (
    <div className="space-y-5 pb-24">
      <header className="luxury-card rounded-[2rem] p-6">
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-cyan-500/16 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-200">Daily Timeline</p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-white">
              Today’s <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">Ritual Map</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-zinc-400">
              {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:w-60">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Complete</p>
              <p className="mt-1 font-mono text-xl font-bold text-white">{completedCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Ahead</p>
              <p className="mt-1 font-mono text-xl font-bold text-white">{scheduledCount}</p>
            </div>
          </div>
        </div>
      </header>

      <Card className="rounded-[1.7rem] border-white/10 p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Ritual sequence</h2>
              <p className="text-xs text-zinc-500">Built from your saved data</p>
            </div>
          </div>
          <Badge variant="outline" className="border-white/10 text-zinc-500">Live</Badge>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-20 rounded-2xl" />)}
          </div>
        ) : items.length > 0 ? (
          <div className="relative space-y-3">
            <div className="absolute bottom-8 left-[1.35rem] top-8 w-px bg-gradient-to-b from-cyan-400/25 via-white/10 to-violet-400/20" />
            {items.map((item) => {
              const Icon = typeIcon(item.type);
              return (
                <div key={item.id} className="relative grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#070a16] shadow-xl" style={{ color: item.color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-bold text-white">{item.title}</p>
                      {item.status === 'complete' ? <Check className="h-4 w-4 shrink-0 text-emerald-300" /> : <Circle className="h-3 w-3 shrink-0 text-zinc-600" />}
                    </div>
                    <p className="mt-1 truncate text-xs text-zinc-500">{item.subtitle}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="flex items-center gap-1 font-mono text-xs font-bold text-zinc-300">
                      <Clock className="h-3.5 w-3.5 text-zinc-600" />
                      {displayTime(item.time)}
                    </span>
                    {item.actionLabel ? (
                      <button
                        type="button"
                        onClick={() => runQuickAction(item)}
                        className={cn(
                          'min-h-9 rounded-xl border px-3 text-[10px] font-bold uppercase tracking-widest transition-colors',
                          item.status === 'complete'
                            ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                            : 'border-violet-400/20 bg-violet-400/10 text-violet-200'
                        )}
                      >
                        {item.actionLabel}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => item.route && navigate(item.route)}
                        className="min-h-9 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400"
                      >
                        Open
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-zinc-700" />
            <h3 className="mt-5 font-display text-xl font-bold text-white">No rituals scheduled today</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">Add habit reminders, task reminders, focus sessions, or a shutdown ritual to populate the timeline.</p>
            <Button onClick={() => navigate('/habits?add=true')} className="mt-6 rounded-2xl">Add Reminder</Button>
          </div>
        )}
      </Card>

      <Toast
        isVisible={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}
