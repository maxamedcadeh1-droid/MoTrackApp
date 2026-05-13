import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, CheckCircle2, Clock, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ReminderConfig, ReminderEngine } from '../lib/ReminderEngine';
import { ReminderNotification } from '../lib/NotificationService';
import { SoundService } from '../lib/SoundService';
import { useAuth } from '../features/auth/AuthContext';
import { dateKey } from '../lib/utils';
import { WakeUpMode, WakeUpData } from './WakeUpMode';
import { NightShutdownData, NightShutdownMode } from './NightShutdownMode';

type RuntimeReminder = ReminderConfig & {
  route?: string;
};

type RuntimeToast = {
  id: string;
  title: string;
  message: string;
  route: string;
  color?: string;
};

function todayUsesReminder(days?: number[]) {
  if (!days || days.length === 0) return true;
  return days.includes(new Date().getDay());
}

function usesReminderOnDay(days: number[] | undefined, day: number) {
  if (!days || days.length === 0) return true;
  return days.includes(day);
}

function isMorningReminder(reminder: RuntimeReminder) {
  const hour = Number.parseInt(reminder.reminderTime?.split(':')[0] || '12', 10);
  const title = `${reminder.title || reminder.habitTitle || ''} ${reminder.category || ''}`.toLowerCase();
  return reminder.reminderSound === 'sunrise'
    || title.includes('wake')
    || title.includes('morning')
    || (hour >= 4 && hour <= 9);
}

export function ReminderRuntime() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState<RuntimeToast | null>(null);
  const [wakeData, setWakeData] = useState<WakeUpData | null>(null);
  const [nightData, setNightData] = useState<NightShutdownData | null>(null);
  const remindersRef = useRef<RuntimeReminder[]>([]);
  const snoozeTimerRef = useRef<number | null>(null);

  const firstName = useMemo(() => {
    const source = profile?.full_name || user?.email?.split('@')[0] || 'there';
    return source.split(' ')[0] || 'there';
  }, [profile?.full_name, user?.email]);

  const fetchMomentumScore = useCallback(async () => {
    if (!user) return 0;

    const today = dateKey(new Date());
    const [{ data: habits }, { data: sessions }, { data: projects }] = await Promise.all([
      (supabase.from('habits') as any).select('completed_dates,is_active').eq('user_id', user.id),
      (supabase.from('focus_sessions') as any).select('completed_minutes,started_at').eq('user_id', user.id).gte('started_at', `${today}T00:00:00`),
      (supabase.from('projects') as any).select('progress,status').eq('user_id', user.id).eq('status', 'active'),
    ]);

    const activeHabits = (habits || []).filter((habit: any) => habit.is_active !== false);
    const completedHabits = activeHabits.filter((habit: any) => habit.completed_dates?.includes(today)).length;
    const habitScore = activeHabits.length ? Math.round((completedHabits / activeHabits.length) * 45) : 0;
    const focusMinutes = (sessions || []).reduce((sum: number, session: any) => sum + (session.completed_minutes || 0), 0);
    const focusScore = Math.min(Math.round((focusMinutes / 45) * 30), 30);
    const projectRows = projects || [];
    const projectScore = projectRows.length
      ? Math.min(Math.round(projectRows.reduce((sum: number, project: any) => sum + (project.progress || 0), 0) / projectRows.length * 0.25), 25)
      : 0;

    return Math.min(habitScore + focusScore + projectScore, 100);
  }, [user]);

  const fetchNightShutdownData = useCallback(async (): Promise<NightShutdownData | null> => {
    if (!user) return null;

    const today = dateKey(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = dateKey(tomorrow);
    const tomorrowDay = tomorrow.getDay();

    const [{ data: habits }, { data: tasks }] = await Promise.all([
      (supabase.from('habits') as any)
        .select('id,title,completed_dates,is_active,reminder_enabled,reminder_time,reminder_days')
        .eq('user_id', user.id)
        .eq('is_active', true),
      (supabase.from('project_tasks') as any)
        .select('id,title,due_date,is_done,reminder_enabled,reminder_time,reminder_days')
        .eq('user_id', user.id)
        .eq('is_done', false),
    ]);

    const activeHabits = habits || [];
    const completedHabits = activeHabits.filter((habit: any) => habit.completed_dates?.includes(today)).length;
    const habitPreview = activeHabits
      .filter((habit: any) => habit.reminder_enabled && habit.reminder_time && usesReminderOnDay(habit.reminder_days, tomorrowDay))
      .map((habit: any) => ({
        id: `habit-${habit.id}`,
        title: habit.title,
        type: 'habit' as const,
        time: habit.reminder_time,
      }));

    const taskPreview = (tasks || [])
      .filter((task: any) => {
        const dueTomorrow = task.due_date?.startsWith(tomorrowKey);
        const reminderTomorrow = task.reminder_enabled && task.reminder_time && (!task.reminder_days?.length || task.reminder_days.includes(tomorrowDay));
        return dueTomorrow || reminderTomorrow;
      })
      .map((task: any) => ({
        id: `task-${task.id}`,
        title: task.title,
        type: 'task' as const,
        time: task.reminder_time || (task.due_date ? new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined),
      }));

    return {
      userName: firstName,
      completedHabits,
      totalHabits: activeHabits.length,
      tomorrowPreview: [...habitPreview, ...taskPreview].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99')).slice(0, 6),
      triggeredAt: new Date().toISOString(),
    };
  }, [firstName, user]);

  const fetchReminders = useCallback(async () => {
    if (!user) return;

    const [{ data: habits }, { data: tasks }, { data: settings }] = await Promise.all([
      (supabase.from('habits') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true),
      (supabase.from('project_tasks') as any)
        .select('*, projects(title,color,status)')
        .eq('user_id', user.id)
        .eq('is_done', false),
      (supabase.from('settings') as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    const habitReminders: RuntimeReminder[] = (habits || [])
      .filter((habit: any) => habit.reminder_enabled && habit.reminder_time)
      .map((habit: any) => ({
        id: `habit:${habit.id}`,
        itemId: habit.id,
        habitId: habit.id,
        type: 'habit',
        experience: isMorningReminder({
          reminderTime: habit.reminder_time,
          reminderSound: habit.reminder_sound || 'chime',
          title: habit.title,
          category: habit.category,
          reminderEnabled: true,
          reminderDays: habit.reminder_days || [],
        }) ? 'wake' : 'standard',
        title: habit.title,
        habitTitle: habit.title,
        category: habit.category,
        color: habit.color,
        habitColor: habit.color,
        reminderEnabled: habit.reminder_enabled,
        reminderTime: habit.reminder_time,
        reminderDays: habit.reminder_days || [],
        reminderSound: habit.reminder_sound || 'chime',
        lastTriggeredAt: habit.last_triggered_at,
        route: '/habits',
      }));

    const taskReminders: RuntimeReminder[] = (tasks || [])
      .filter((task: any) => task.reminder_enabled && task.reminder_time)
      .map((task: any) => ({
        id: `task:${task.id}`,
        itemId: task.id,
        type: 'task',
        experience: 'standard',
        title: task.title,
        color: task.projects?.color || '#3b82f6',
        reminderEnabled: task.reminder_enabled,
        reminderTime: task.reminder_time,
        reminderDays: task.reminder_days || [],
        reminderSound: task.reminder_sound || 'chime',
        lastTriggeredAt: task.last_triggered_at,
        metadata: {
          projectTitle: task.projects?.title,
        },
        route: '/projects',
      }));

    const sleepReminder: RuntimeReminder[] = settings?.sleep_reminder_enabled && settings?.sleep_reminder_time
      ? [{
        id: `sleep:${user.id}`,
        itemId: user.id,
        type: 'sleep',
        experience: 'shutdown',
        title: 'Night Shutdown',
        color: '#3b82f6',
        reminderEnabled: settings.sleep_reminder_enabled,
        reminderTime: settings.sleep_reminder_time,
        reminderDays: settings.sleep_reminder_days || [],
        reminderSound: settings.sleep_reminder_sound || 'night',
        lastTriggeredAt: settings.sleep_last_triggered_at,
        route: '/dashboard',
      }]
      : [];

    const reminders = [...habitReminders, ...taskReminders, ...sleepReminder].filter((reminder) => todayUsesReminder(reminder.reminderDays));
    remindersRef.current = reminders;
    ReminderEngine.setReminders(reminders);
  }, [user]);

  const markTriggered = useCallback(async (reminder: ReminderConfig, triggeredAt: string) => {
    if (!user) return;

    if (reminder.type === 'habit' && reminder.itemId) {
      await (supabase.from('habits') as any)
        .update({ last_triggered_at: triggeredAt })
        .eq('id', reminder.itemId)
        .eq('user_id', user.id);
    }

    if (reminder.type === 'task' && reminder.itemId) {
      await (supabase.from('project_tasks') as any)
        .update({ last_triggered_at: triggeredAt })
        .eq('id', reminder.itemId)
        .eq('user_id', user.id);
    }

    if (reminder.type === 'sleep') {
      await (supabase.from('settings') as any)
        .update({ sleep_last_triggered_at: triggeredAt })
        .eq('user_id', user.id);
    }
  }, [user]);

  const handleTrigger = useCallback(async (notification: ReminderNotification, reminder: RuntimeReminder) => {
    if (reminder.experience === 'wake') {
      void SoundService.startAlarm(reminder.reminderSound || 'sunrise');
      const momentumScore = await fetchMomentumScore();
      setWakeData({
        userName: firstName,
        habitTitle: reminder.title || reminder.habitTitle || 'Morning routine',
        habitColor: reminder.color || reminder.habitColor,
        momentumScore,
        triggeredAt: new Date().toISOString(),
      });
      return;
    }

    if (reminder.experience === 'shutdown') {
      void SoundService.startAlarm(reminder.reminderSound || 'night');
      const shutdownData = await fetchNightShutdownData();
      if (shutdownData) {
        setNightData(shutdownData);
        return;
      }
    }

    void SoundService.play(reminder.reminderSound || 'chime');
    setToast({
      id: `${notification.type || 'reminder'}-${notification.itemId || Date.now()}`,
      title: notification.type === 'task' ? 'Task reminder' : 'Habit reminder',
      message: notification.message || `Time for: ${notification.title || notification.habitTitle || 'your ritual'}`,
      route: reminder.route || '/dashboard',
      color: reminder.color || reminder.habitColor,
    });

    window.setTimeout(() => {
      setToast(null);
      SoundService.stopAlarm();
    }, 9000);
  }, [fetchMomentumScore, fetchNightShutdownData, firstName]);

  useEffect(() => {
    if (!user) {
      ReminderEngine.cleanup();
      return;
    }

    ReminderEngine.init({
      onTrigger: handleTrigger as any,
      onMarkTriggered: markTriggered,
    });
    ReminderEngine.start();
    void fetchReminders();

    const refresh = () => void fetchReminders();
    window.addEventListener('motrack:reminders-updated', refresh);
    window.addEventListener('motrack:habit-updated', refresh);

    const channel = supabase.channel(`ritual-reminders-${user.id}`);
    (['habits', 'project_tasks', 'settings'] as const).forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` }, refresh);
    });
    void channel.subscribe();

    return () => {
      if (snoozeTimerRef.current) window.clearTimeout(snoozeTimerRef.current);
      window.removeEventListener('motrack:reminders-updated', refresh);
      window.removeEventListener('motrack:habit-updated', refresh);
      void supabase.removeChannel(channel);
      ReminderEngine.cleanup();
    };
  }, [fetchReminders, handleTrigger, markTriggered, user]);

  const dismissWake = () => {
    SoundService.stopAlarm();
    setWakeData(null);
  };

  const snoozeWake = () => {
    SoundService.stopAlarm();
    const currentWake = wakeData;
    setWakeData(null);
    if (!currentWake) return;
    snoozeTimerRef.current = window.setTimeout(() => {
      setWakeData({ ...currentWake, triggeredAt: new Date().toISOString() });
    }, 9 * 60 * 1000);
  };

  const startMorningRoutine = () => {
    SoundService.stopAlarm();
    setWakeData(null);
    navigate('/habits');
  };

  const saveNightReflection = async (reflection: { wentWell: string; improveTomorrow: string }) => {
    SoundService.stopAlarm();
    if (!user) return;

    const hasReflection = reflection.wentWell.trim() || reflection.improveTomorrow.trim();
    if (hasReflection) {
      await (supabase.from('notes') as any).insert({
        user_id: user.id,
        title: `Night Reflection - ${new Date().toLocaleDateString()}`,
        content: [
          reflection.wentWell.trim() ? `What went well:\n${reflection.wentWell.trim()}` : '',
          reflection.improveTomorrow.trim() ? `What should improve tomorrow:\n${reflection.improveTomorrow.trim()}` : '',
        ].filter(Boolean).join('\n\n'),
        tags: ['reflection', 'shutdown'],
        is_pinned: false,
        color: '#3b82f6',
      });
    }

    setNightData(null);
    navigate('/dashboard');
  };

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            className="mobile-toast fixed bottom-24 left-1/2 z-[120] w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 overflow-hidden rounded-3xl border border-white/10 bg-[#070a16]/95 p-4 shadow-2xl shadow-black/45 backdrop-blur-2xl md:bottom-8"
          >
            <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-3xl" style={{ backgroundColor: `${toast.color || '#8b5cf6'}33` }} />
            <div className="relative flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-violet-300">
                <Bell className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-zinc-500" />
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{toast.title}</p>
                </div>
                <p className="mt-1 text-sm font-bold text-white">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => {
                    navigate(toast.route);
                    setToast(null);
                  }}
                  className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 text-xs font-bold text-violet-200 transition-colors hover:bg-violet-500/15"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Open ritual
                </button>
              </div>
              <button
                type="button"
                aria-label="Dismiss reminder"
                onClick={() => setToast(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <WakeUpMode
        data={wakeData}
        onDismiss={dismissWake}
        onSnooze={snoozeWake}
        onComplete={startMorningRoutine}
      />

      <NightShutdownMode
        data={nightData}
        onDismiss={() => setNightData(null)}
        onSaveReflection={saveNightReflection}
      />
    </>
  );
}
