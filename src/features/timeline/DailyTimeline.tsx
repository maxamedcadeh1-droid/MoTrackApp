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
  X,
  Plus,
  Bell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Button, Skeleton, Toast, Badge, Input, TextArea } from '../../components/ui/Layout';
import { MobileFormSheet } from '../../components/ui/MobileFormSheet';
import { ReminderSettings, ReminderSettingsData } from '../../components/ReminderSettings';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { calculateDailyStreak, cn, dateKey, deriveProjectProgress } from '../../lib/utils';

type TimelineItem = {
  id: string;
  sourceId?: string;
  projectId?: string;
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

export function DailyTimeline() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as any });
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);

  // Add Reminder Form State
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: '',
    description: '',
    time: '',
    days: [1, 2, 3, 4, 5, 6, 0],
    sound: 'chime' as any,
  });
  const [reminderSettings, setReminderSettings] = useState<ReminderSettingsData>({
    reminderEnabled: true,
    reminderTime: '',
    reminderDays: [1, 2, 3, 4, 5, 6, 0],
    reminderSound: 'chime',
  });

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
          projectId: task.project_id,
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

    const refresh = () => void fetchTimeline();
    window.addEventListener('motrack:habit-updated', refresh);
    window.addEventListener('motrack:project-updated', refresh);
    window.addEventListener('motrack:reminders-updated', refresh);
    window.addEventListener('motrack:focus-updated', refresh);

    return () => {
      window.removeEventListener('motrack:habit-updated', refresh);
      window.removeEventListener('motrack:project-updated', refresh);
      window.removeEventListener('motrack:reminders-updated', refresh);
      window.removeEventListener('motrack:focus-updated', refresh);
    };
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
    const streak = calculateDailyStreak(nextDates);
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
    if (item.projectId) {
      await syncProjectProgress(item.projectId);
    }
    window.dispatchEvent(new Event('motrack:project-updated'));
    window.dispatchEvent(new Event('motrack:reminders-updated'));
    void fetchTimeline();
  };

  const syncProjectProgress = async (projectId: string) => {
    if (!user) return;

    const [{ data: tasks, error: tasksError }, { data: project, error: projectError }] = await Promise.all([
      (supabase.from('project_tasks') as any)
        .select('is_done')
        .eq('project_id', projectId)
        .eq('user_id', user.id),
      (supabase.from('projects') as any)
        .select('status,progress')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    if (tasksError || projectError) {
      console.error('Timeline project progress sync error:', tasksError || projectError);
      return;
    }

    const progress = deriveProjectProgress({ ...(project || {}), project_tasks: tasks || [] });
    const { error } = await (supabase.from('projects') as any)
      .update({ progress, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Timeline project update error:', error);
    }
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">Sequence</Badge>
              <p className="text-sm font-semibold text-zinc-500">Daily Timeline</p>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-white">
              Today’s <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">Ritual Map</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-zinc-400">
              {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="grid grid-cols-2 gap-2 sm:w-48">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Done</p>
                <p className="font-mono text-lg font-bold text-white">{completedCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Left</p>
                <p className="font-mono text-lg font-bold text-white">{scheduledCount}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setReminderForm({ title: '', description: '', time: '', days: [1, 2, 3, 4, 5, 6, 0], sound: 'chime' });
                  setReminderSettings({
                    reminderEnabled: true,
                    reminderTime: '',
                    reminderDays: [1, 2, 3, 4, 5, 6, 0],
                    reminderSound: 'chime',
                  });
                  setIsAddingReminder(true);
                }}
                variant="secondary"
                className="w-full sm:w-auto h-11 rounded-2xl gap-2 border-white/5 bg-white/5"
              >
                <Bell className="w-4 h-4" />
                Add Reminder
              </Button>
              <Button 
                onClick={() => navigate('/habits?add=true')}
                className="w-full sm:w-auto h-11 rounded-2xl gap-2 shadow-violet-500/20"
              >
                <Plus className="w-4 h-4" />
                Add Ritual
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Add Reminder Sheet */}
      <MobileFormSheet
        open={isAddingReminder}
        onClose={() => setIsAddingReminder(false)}
        title="Add Reminder"
        badge="Quick setup"
        formId="timeline-reminder-form"
        submitLabel="Add Reminder"
        submitting={submitting}
        submitDisabled={!reminderForm.title.trim() || !reminderSettings.reminderTime}
      >
        <form 
          id="timeline-reminder-form" 
          onSubmit={async (e) => {
            e.preventDefault();
            if (submitting || !user) return;
            setSubmitting(true);
            try {
              const { error } = await (supabase.from('habits') as any).insert({
                user_id: user.id,
                title: reminderForm.title.trim(),
                description: reminderForm.description.trim(),
                category: 'Reminder',
                color: '#8b5cf6',
                icon: 'zap',
                frequency: 'daily',
                reminder_enabled: true,
                reminder_time: reminderSettings.reminderTime,
                reminder_days: reminderSettings.reminderDays,
                reminder_sound: reminderSettings.reminderSound,
                completed_dates: [],
                streak: 0,
                best_streak: 0,
                is_active: true
              });

              if (error) throw error;
              
              setToast({ show: true, message: 'Reminder added to timeline', type: 'success' });
              window.dispatchEvent(new Event('motrack:habit-updated'));
              window.dispatchEvent(new Event('motrack:reminders-updated'));
              setIsAddingReminder(false);
              void fetchTimeline();
            } catch (err: any) {
              console.error('Add timeline reminder error:', err);
              setToast({ show: true, message: err.message || 'Could not add reminder', type: 'error' });
            } finally {
              setSubmitting(false);
            }
          }} 
          className="space-y-6"
        >
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Title</label>
            <Input 
              placeholder="e.g. Call the bank" 
              value={reminderForm.title}
              onChange={e => setReminderForm(f => ({ ...f, title: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Notes (optional)</label>
            <TextArea 
              placeholder="Any details..." 
              value={reminderForm.description}
              onChange={e => setReminderForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <ReminderSettings 
            value={reminderSettings}
            onChange={setReminderSettings}
          />
        </form>
      </MobileFormSheet>

      <Card className="rounded-[1.7rem] border-white/10 p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Your Day</h2>
              <p className="text-xs text-zinc-500">Smart ritual sequence</p>
            </div>
          </div>
          <Badge variant="outline" className="border-white/10 text-emerald-400 bg-emerald-400/5">Active Sync</Badge>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex gap-4">
                <Skeleton className="h-14 w-1 flex-shrink-0 rounded-full" />
                <Skeleton className="h-20 flex-1 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="relative space-y-6">
            {/* Connection Line */}
            <div className="absolute left-[1.35rem] top-8 bottom-8 w-px bg-gradient-to-b from-cyan-400/30 via-violet-400/20 to-transparent" />
            
            {items.map((item) => {
              const Icon = typeIcon(item.type);
              return (
                <div key={item.id} className="relative grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-4 rounded-3xl border border-white/8 bg-white/[0.03] p-4 transition-all hover:bg-white/[0.05]">
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
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 animate-pulse rounded-full bg-cyan-500/20 blur-2xl" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] text-cyan-400">
                <Sparkles className="h-10 w-10" />
              </div>
            </div>
            <h3 className="font-display text-xl font-bold text-white">Your day is a blank canvas</h3>
            <p className="mt-2 max-w-[280px] text-sm text-zinc-500">
              Add your first ritual or reminder to start mapping your momentum.
            </p>
            <Button 
              onClick={() => navigate('/habits?add=true')} 
              className="mt-8 rounded-2xl px-8 shadow-cyan-500/20"
              variant="primary"
            >
              Add Your First Ritual
            </Button>
          </motion.div>
        )}
      </Card>

      {/* Sync Footer */}
      <div className="flex items-center justify-center gap-2 py-4 opacity-50">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Live Sync Active</p>
      </div>

      <Toast
        isVisible={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}
