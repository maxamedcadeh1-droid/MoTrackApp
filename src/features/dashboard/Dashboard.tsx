import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Book,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  FileText,
  Flame,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Wifi,
  Zap,
} from 'lucide-react';
import { Button, Card, Skeleton } from '../../components/ui/Layout';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { getMomentumInsight, getTrendIndicator } from '../../lib/insights';
import { useAuth } from '../auth/AuthContext';

const DashboardChart = lazy(() => import('./DashboardChart').then((mod) => ({ default: mod.DashboardChart })));
const SuggestedNextAction = lazy(() => import('./SuggestedNextAction').then((mod) => ({ default: mod.SuggestedNextAction })));
const DashboardChecklist = lazy(() => import('./DashboardChecklist').then((mod) => ({ default: mod.DashboardChecklist })));
const WelcomeEmptyState = lazy(() => import('./EnhancedEmptyState').then((mod) => ({ default: mod.WelcomeEmptyState })));

const HABIT_ICONS = {
  target: Target,
  zap: Zap,
  coffee: Coffee,
  book: Book,
  moon: Moon,
  sun: Sun,
  flame: Flame,
};

type WeeklyDashboardData = {
  day: string;
  habitsCompleted: number;
  focusMinutes: number;
  tasksCompleted: number;
  projectProgress: number;
};

type ProjectRadarItem = {
  id: string;
  title: string;
  progress: number;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  tasksTotal: number;
  completedTasks: number;
};

type HabitStreak = {
  id: string;
  title: string;
  streak: number;
  bestStreak: number;
  color: string;
  frequency: string;
  icon: string;
  completedDates: string[];
};

type ActivityItem = {
  id: string;
  type: 'note' | 'habit' | 'project' | 'focus';
  title: string;
  detail: string;
  date: string;
  icon: typeof FileText;
};

type DashboardStats = {
  momentum: number;
  previousMomentum: number;
  habitsScore: number;
  focusScore: number;
  projectsScore: number;
  habitsCompleted: number;
  totalHabits: number;
  focusMinutes: number;
  dailyGoal: number;
  activeProjects: number;
  completedProjectTasks: number;
  totalProjectTasks: number;
  projectProgress: number;
  weeklyData: WeeklyDashboardData[];
  recentActivity: ActivityItem[];
  projectRadar: ProjectRadarItem[];
  habitStreaks: HabitStreak[];
};

const emptyStats: DashboardStats = {
  momentum: 0,
  previousMomentum: 0,
  habitsScore: 0,
  focusScore: 0,
  projectsScore: 0,
  habitsCompleted: 0,
  totalHabits: 0,
  focusMinutes: 0,
  dailyGoal: 45,
  activeProjects: 0,
  completedProjectTasks: 0,
  totalProjectTasks: 0,
  projectProgress: 0,
  weeklyData: [],
  recentActivity: [],
  projectRadar: [],
  habitStreaks: [],
};

function dateKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatActivityTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (Number.isNaN(date.getTime())) return 'Recently';
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getHeroCopy(hour: number) {
  if (hour >= 5 && hour < 12) {
    return {
      greeting: 'Good morning,',
      subtitle: "Let's build your best day.",
    };
  }

  if (hour >= 12 && hour < 17) {
    return {
      greeting: 'Good afternoon,',
      subtitle: 'Stay focused and keep momentum.',
    };
  }

  if (hour >= 17 && hour < 21) {
    return {
      greeting: 'Good evening,',
      subtitle: 'Finish the day strong.',
    };
  }

  return {
    greeting: 'Good night,',
    subtitle: 'Reflect, reset, and recharge.',
  };
}

function buildRecentActivity({
  habits,
  projects,
  sessions,
  latestNote,
}: {
  habits: any[];
  projects: any[];
  sessions: any[];
  latestNote?: any;
}) {
  const activity: ActivityItem[] = [];

  if (latestNote) {
    activity.push({
      id: `note-${latestNote.id}`,
      type: 'note',
      title: 'Note created',
      detail: latestNote.title,
      date: latestNote.created_at || latestNote.updated_at,
      icon: FileText,
    });
  }

  const latestHabitCompletion = habits
    .flatMap((habit) => (habit.completed_dates || []).map((date: string) => ({ habit, date })))
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  if (latestHabitCompletion) {
    activity.push({
      id: `habit-${latestHabitCompletion.habit.id}-${latestHabitCompletion.date}`,
      type: 'habit',
      title: 'Habit completed',
      detail: latestHabitCompletion.habit.title,
      date: `${latestHabitCompletion.date}T12:00:00`,
      icon: CheckCircle2,
    });
  }

  const latestProject = [...projects]
    .filter((project) => project.updated_at || project.created_at)
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())[0];

  if (latestProject) {
    activity.push({
      id: `project-${latestProject.id}`,
      type: 'project',
      title: 'Project updated',
      detail: latestProject.title,
      date: latestProject.updated_at || latestProject.created_at,
      icon: Briefcase,
    });
  }

  const latestFocus = [...sessions]
    .filter((session) => (session.completed_minutes || 0) > 0)
    .sort((a, b) => new Date(b.ended_at || b.started_at).getTime() - new Date(a.ended_at || a.started_at).getTime())[0];

  if (latestFocus) {
    activity.push({
      id: `focus-${latestFocus.id}`,
      type: 'focus',
      title: 'Focus session completed',
      detail: `${latestFocus.completed_minutes || 0} minutes logged`,
      date: latestFocus.ended_at || latestFocus.started_at,
      icon: Timer,
    });
  }

  return activity
    .filter((item) => item.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);
}

export const Dashboard = memo(function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  const isMounted = useRef(true);

  const refreshDashboard = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const today = startOfDay(new Date());
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const firstWeekDay = new Date(today);
        firstWeekDay.setDate(today.getDate() - 6);

        const [
          { data: habitsData },
          { data: projectsData },
          { data: sessionsData },
          { data: settings },
          { data: latestNotes },
        ] = await Promise.all([
          (supabase.from('habits') as any)
            .select('*')
            .eq('user_id', user.id),
          (supabase.from('projects') as any)
            .select('*, project_tasks(*)')
            .eq('user_id', user.id),
          (supabase.from('focus_sessions') as any)
            .select('*')
            .eq('user_id', user.id)
            .gte('started_at', firstWeekDay.toISOString())
            .order('started_at', { ascending: false }),
          (supabase.from('settings') as any)
            .select('daily_goal_minutes')
            .eq('user_id', user.id)
            .single(),
          (supabase.from('notes') as any)
            .select('id,title,created_at,updated_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),
        ]);

        const habits = (habitsData || []).filter((habit: any) => habit.is_active !== false);
        const projects = (projectsData || []) as any[];
        const activeProjects = projects.filter((project) => project.status === 'active');
        const sessions = (sessionsData || []) as any[];
        const dailyGoal = Math.max((settings as any)?.daily_goal_minutes || 45, 1);

        const todayKey = dateKey(today);
        const yesterdayKey = dateKey(yesterday);

        const habitsCompletedToday = habits.filter((habit: any) => habit.completed_dates?.includes(todayKey)).length;
        const habitsCompletedYesterday = habits.filter((habit: any) => habit.completed_dates?.includes(yesterdayKey)).length;
        const totalHabits = habits.length;

        const focusMinutesToday = sessions
          .filter((session) => session.started_at?.startsWith(todayKey))
          .reduce((acc, session) => acc + (session.completed_minutes || 0), 0);
        const focusMinutesYesterday = sessions
          .filter((session) => session.started_at?.startsWith(yesterdayKey))
          .reduce((acc, session) => acc + (session.completed_minutes || 0), 0);

        const projectTasks = activeProjects.flatMap((project) => project.project_tasks || []);
        const totalProjectTasks = projectTasks.length;
        const completedProjectTasks = projectTasks.filter((task: any) => task.is_done).length;
        const projectProgress = activeProjects.length > 0
          ? Math.round(activeProjects.reduce((sum, project) => sum + (project.progress || 0), 0) / activeProjects.length)
          : 0;

        const habitsScore = totalHabits > 0 ? Math.round((habitsCompletedToday / totalHabits) * 40) : 0;
        const focusScore = Math.min(Math.round((focusMinutesToday / dailyGoal) * 30), 30);
        const projectsScore = totalProjectTasks > 0
          ? Math.round((completedProjectTasks / totalProjectTasks) * 30)
          : activeProjects.length > 0
            ? Math.min(Math.round(projectProgress * 0.3), 30)
            : 0;

        const yesterdayHabitsScore = totalHabits > 0 ? Math.round((habitsCompletedYesterday / totalHabits) * 40) : 0;
        const yesterdayFocusScore = Math.min(Math.round((focusMinutesYesterday / dailyGoal) * 30), 30);
        const previousMomentum = Math.min(100, yesterdayHabitsScore + yesterdayFocusScore + projectsScore);
        const momentum = Math.min(100, habitsScore + focusScore + projectsScore);

        const weeklyData = [...Array(7)].map((_, index) => {
          const day = new Date(firstWeekDay);
          day.setDate(firstWeekDay.getDate() + index);
          const key = dateKey(day);
          const focusMinutes = sessions
            .filter((session) => session.started_at?.startsWith(key))
            .reduce((acc, session) => acc + (session.completed_minutes || 0), 0);
          const habitsCompleted = habits.filter((habit: any) => habit.completed_dates?.includes(key)).length;
          const tasksCompleted = projectTasks.filter((task: any) => task.is_done && task.updated_at?.startsWith(key)).length;

          return {
            day: day.toLocaleDateString('en-US', { weekday: 'short' }),
            habitsCompleted,
            focusMinutes,
            tasksCompleted,
            projectProgress,
          };
        });

        const projectRadar = activeProjects.slice(0, 3).map((project) => {
          const tasks = (project.project_tasks || []) as any[];
          const completedTasks = tasks.filter((task) => task.is_done).length;
          const priority = ['high', 'medium', 'low'].includes(project.priority) ? project.priority : 'medium';

          return {
            id: project.id,
            title: project.title,
            progress: project.progress || 0,
            deadline: project.deadline,
            priority,
            tasksTotal: tasks.length,
            completedTasks,
          };
        });

        const habitStreaks = habits
          .sort((a: any, b: any) => (b.streak || 0) - (a.streak || 0) || (b.best_streak || 0) - (a.best_streak || 0))
          .slice(0, 3)
          .map((habit: any) => ({
            id: habit.id,
            title: habit.title,
            streak: habit.streak || 0,
            bestStreak: habit.best_streak || 0,
            color: habit.color || '#8b5cf6',
            frequency: habit.frequency || 'Daily',
            icon: habit.icon || 'target',
            completedDates: habit.completed_dates || [],
          }));

        if (isMounted.current) {
          setStats({
            momentum,
            previousMomentum,
            habitsScore,
            focusScore,
            projectsScore,
            habitsCompleted: habitsCompletedToday,
            totalHabits,
            focusMinutes: focusMinutesToday,
            dailyGoal,
            activeProjects: activeProjects.length,
            completedProjectTasks,
            totalProjectTasks,
            projectProgress,
            weeklyData,
            recentActivity: buildRecentActivity({
              habits,
              projects,
              sessions,
              latestNote: latestNotes?.[0],
            }),
            projectRadar,
            habitStreaks,
          });
          setLastSyncedAt(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
        }
      } catch (err) {
        console.error('Dashboard data error:', err);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }

    fetchDashboardData();
  }, [user, refreshKey]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const dashboardChannel = supabase.channel(`dashboard-updates-${user.id}`);
    const watchTables = ['habits', 'notes', 'projects', 'project_tasks', 'focus_sessions', 'settings'] as const;

    watchTables.forEach((table) => {
      dashboardChannel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` }, () => {
        refreshDashboard();
      });
    });

    void dashboardChannel.subscribe();

    return () => {
      void supabase.removeChannel(dashboardChannel);
    };
  }, [user, refreshDashboard]);

  const firstName = useMemo(() => {
    const source = profile?.full_name || user?.email?.split('@')[0] || 'Mohamed';
    return source.split(' ')[0] || 'Mohamed';
  }, [profile?.full_name, user?.email]);

  const heroCopy = useMemo(() => getHeroCopy(currentHour), [currentHour]);
  const insight = useMemo(() => getMomentumInsight({
    momentum: stats.momentum,
    incompleteHabits: Math.max(stats.totalHabits - stats.habitsCompleted, 0),
    focusMinutes: stats.focusMinutes,
    dailyGoal: stats.dailyGoal,
    activeProjects: stats.activeProjects,
  }), [stats]);

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const hasNoData = stats.totalHabits === 0 && stats.activeProjects === 0 && stats.focusMinutes === 0;
  const hasPulseData = useMemo(() => {
    return stats.weeklyData.some((day) => day.habitsCompleted > 0 || day.focusMinutes > 0 || day.tasksCompleted > 0);
  }, [stats.weeklyData]);
  const pulseChartData = useMemo(() => {
    if (hasPulseData) return stats.weeklyData;

    const days = stats.weeklyData.length
      ? stats.weeklyData
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
          day,
          habitsCompleted: 0,
          focusMinutes: 0,
          tasksCompleted: 0,
          projectProgress: 0,
        }));

    const starterFocus = [18, 32, 28, 44, 36, 52, 48];
    const starterHabits = [1, 1, 2, 1, 2, 2, 3];
    const starterTasks = [1, 2, 1, 3, 2, 3, 4];

    return days.map((day, index) => ({
      ...day,
      focusMinutes: starterFocus[index] || 24,
      habitsCompleted: starterHabits[index] || 1,
      tasksCompleted: starterTasks[index] || 1,
    }));
  }, [hasPulseData, stats.weeklyData]);
  const incompleteHabits = Math.max(stats.totalHabits - stats.habitsCompleted, 0);
  const remainingFocusMinutes = Math.max(stats.dailyGoal - stats.focusMinutes, 0);
  const remainingProjectTasks = Math.max(stats.totalProjectTasks - stats.completedProjectTasks, 0);
  const trend = useMemo(() => getTrendIndicator(stats.momentum, stats.previousMomentum), [stats.momentum, stats.previousMomentum]);
  const yesterdayPulse = stats.weeklyData.length >= 2 ? stats.weeklyData[stats.weeklyData.length - 2] : undefined;
  const habitsDelta = stats.habitsCompleted - (yesterdayPulse?.habitsCompleted || 0);
  const focusDelta = stats.focusMinutes - (yesterdayPulse?.focusMinutes || 0);
  const todayTasksDone = stats.weeklyData[stats.weeklyData.length - 1]?.tasksCompleted || 0;
  const taskDelta = todayTasksDone - (yesterdayPulse?.tasksCompleted || 0);

  const suggestion = useMemo(() => {
    if (stats.totalHabits === 0) return 'Create your first habit.';
    if (remainingFocusMinutes > 0) return 'Start a 25-minute focus session.';
    if (stats.activeProjects > 0) return 'Review your active project.';
    return 'Create a project for your next meaningful goal.';
  }, [remainingFocusMinutes, stats.activeProjects, stats.totalHabits]);

  const syncStatus = lastSyncedAt ? `Live - Synced at ${lastSyncedAt}` : 'Live sync activating...';
  const syncLabel = lastSyncedAt ? 'Live sync on' : 'Syncing...';
  const TrendIcon = trend.trend === 'down' ? TrendingDown : trend.trend === 'stable' ? ArrowRight : TrendingUp;
  const trendBadgeText = trend.trend === 'stable' ? '0%' : `${trend.percentage}%`;

  const priorityActions = useMemo(() => [
    {
      icon: CheckCircle2,
      title: 'Complete habits',
      detail: incompleteHabits > 0 ? `${incompleteHabits} habit${incompleteHabits === 1 ? '' : 's'} remaining today.` : 'All habits completed for today.',
      action: 'Open Habits',
      path: '/habits',
      tone: 'text-emerald-300 bg-emerald-500/10',
    },
    {
      icon: Clock,
      title: 'Start focus session',
      detail: remainingFocusMinutes > 0 ? `${remainingFocusMinutes} minutes left to reach your goal.` : 'Daily focus goal reached.',
      action: 'Start Focus',
      path: '/focus?start=true',
      tone: 'text-blue-300 bg-blue-500/10',
    },
    {
      icon: Briefcase,
      title: 'Review active projects',
      detail: stats.activeProjects > 0 ? `${stats.activeProjects} active project${stats.activeProjects === 1 ? '' : 's'} in motion.` : 'Create a project to track meaningful work.',
      action: 'Open Projects',
      path: '/projects',
      tone: 'text-purple-300 bg-purple-500/10',
    },
  ], [incompleteHabits, remainingFocusMinutes, stats.activeProjects]);

  const navigateToHabits = useCallback(() => navigate('/habits?add=true'), [navigate]);
  const navigateToNotes = useCallback(() => navigate('/notes?add=true'), [navigate]);
  const navigateToProjects = useCallback(() => navigate('/projects?add=true'), [navigate]);
  const navigateToFocus = useCallback(() => navigate('/focus?start=true'), [navigate]);
  const openCommandCenter = useCallback(() => window.dispatchEvent(new Event('motrack:open-command-center')), []);

  if (loading) {
    return (
      <div className="space-y-3 pb-36">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 rounded-xl" />
            <Skeleton className="h-4 w-32 rounded-lg" />
          </div>
          <Skeleton className="h-[72px] w-[72px] rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map((item) => (
            <Skeleton key={item} className="h-28 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-36">

      {/* ── HERO ── */}
      <section className="luxury-card rounded-[2rem] px-5 py-5 sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute -left-10 -top-14 h-36 w-36 rounded-full bg-violet-600/20 blur-2xl md:h-48 md:w-48 md:blur-3xl" />
        <div className="pointer-events-none absolute -bottom-14 -right-8 h-40 w-40 rounded-full bg-blue-500/18 blur-2xl md:h-52 md:w-52 md:blur-3xl" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <p className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text font-display text-3xl font-bold leading-none text-transparent sm:text-4xl">
            MoTrack
          </p>
          <div className="relative">
            <button
              type="button"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen((value) => !value)}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-white shadow-lg shadow-black/25 backdrop-blur-xl transition-all hover:border-violet-400/25 active:scale-95"
            >
              <Bell className="h-5 w-5" />
              {stats.recentActivity.length > 0 && (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.9)]" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-14 z-40 w-[20rem] max-w-[calc(100vw-2.5rem)] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#080b13]/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-2xl">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div>
                    <p className="text-sm font-bold text-white">Notifications</p>
                    <p className="text-[11px] text-zinc-500">{syncStatus}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(false)}
                    className="rounded-xl border border-white/8 bg-white/[0.035] px-2 py-1 text-[10px] font-semibold text-zinc-400"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-2">
                  {stats.recentActivity.length ? stats.recentActivity.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate(item.type === 'note' ? '/notes' : item.type === 'habit' ? '/habits' : item.type === 'focus' ? '/focus' : '/projects');
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3 text-left transition-colors hover:bg-white/[0.055]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white">{item.detail}</p>
                        <p className="text-[10px] text-zinc-500">{item.title} - {formatActivityTime(item.date)}</p>
                      </div>
                    </button>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center">
                      <Sparkles className="mx-auto mb-2 h-5 w-5 text-zinc-600" />
                      <p className="text-xs font-semibold text-white">No notifications yet</p>
                      <p className="mt-1 text-[11px] text-zinc-500">Updates will appear here when you use MoTrack.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 mt-7 grid grid-cols-[minmax(0,1fr)_7.35rem] items-start gap-3 sm:grid-cols-[minmax(0,1fr)_9rem] sm:gap-5 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_10.5rem] lg:items-center">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[2.45rem] font-semibold leading-[1.04] tracking-normal text-white sm:text-5xl lg:text-6xl">
              <span className="block font-normal">{heroCopy.greeting}</span>
              <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-blue-400 bg-clip-text font-bold text-transparent">
                {firstName}.
              </span>
            </h1>
            <p className="mt-4 max-w-sm text-[15px] font-medium text-zinc-400 sm:text-base">{heroCopy.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                title={syncStatus}
                className={cn(
                  'inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold shadow-lg transition-colors',
                  lastSyncedAt
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-emerald-500/10'
                    : 'border-blue-500/20 bg-blue-500/10 text-blue-300 shadow-blue-500/10'
                )}
              >
                <span className={cn(
                  'h-2.5 w-2.5 rounded-full shadow-[0_0_12px_currentColor]',
                  lastSyncedAt ? 'animate-pulse bg-emerald-400 text-emerald-400' : 'bg-blue-400 text-blue-400'
                )} />
                {syncLabel}
              </button>
              <button
                type="button"
                onClick={openCommandCenter}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/15 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-transform active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Quick Add
              </button>
            </div>
          </div>

          <div className="relative mt-1 flex h-[7.35rem] w-[7.35rem] shrink-0 items-center justify-center justify-self-end orb-glow sm:h-36 sm:w-36 lg:h-40 lg:w-40">
            <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_42%_36%,rgba(255,255,255,0.14),rgba(59,130,246,0.16)_38%,rgba(7,10,23,0.95)_68%)]" />
            <svg viewBox="0 0 144 144" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="72" cy="72" r="62" stroke="rgba(255,255,255,0.08)" strokeWidth="5" fill="none" />
              <circle cx="72" cy="72" r="62" strokeWidth="5" strokeLinecap="round" fill="none"
                stroke="url(#heroGrad)"
                strokeDasharray="389.6"
                strokeDashoffset={`${389.6 - (389.6 * stats.momentum) / 100}`}
              />
              <defs>
                <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="52%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <svg viewBox="0 0 100 34" className="pointer-events-none absolute bottom-8 left-5 right-5 h-9 opacity-80 sm:bottom-9">
              <path className="hero-orb-wave" d="M0 22 C10 28 18 28 28 20 C38 12 46 12 56 20 C66 28 74 28 84 18 C92 10 96 10 100 12" fill="none" stroke="url(#heroWaveGrad)" strokeWidth="2.6" strokeLinecap="round" />
              <defs>
                <linearGradient id="heroWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="55%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <div className="relative text-center">
              <p className="font-mono text-4xl font-bold leading-none text-white sm:text-5xl">{stats.momentum}</p>
              <p className="mt-1 text-[10px] font-medium text-zinc-200 sm:text-[11px]">Momentum</p>
            </div>
            <span className={cn(
              'absolute -bottom-2 right-0 inline-flex items-center gap-1 rounded-2xl border px-2.5 py-1.5 text-[11px] font-bold shadow-lg backdrop-blur-md sm:px-3',
              trend.trend === 'down'
                ? 'border-red-500/20 bg-red-500/10 text-red-300'
                : trend.trend === 'stable'
                  ? 'border-white/10 bg-white/[0.06] text-zinc-300'
                : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
            )}>
              <TrendIcon className="h-3.5 w-3.5" />
              {trendBadgeText}
            </span>
          </div>
        </div>
      </section>

      {/* ── ONBOARDING ── */}
      {hasNoData && (
        <Suspense fallback={<Skeleton className="h-40 rounded-2xl" />}>
          <DashboardChecklist stats={stats} navigate={navigate} />
        </Suspense>
      )}

      {/* ── METRIC CARDS 2x2 ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            title: 'Habits',
            subtitle: 'Completed',
            value: `${stats.habitsCompleted}/${stats.totalHabits}`,
            trend: `${habitsDelta >= 0 ? 'Up' : 'Down'} ${Math.abs(habitsDelta)} vs yesterday`,
            progress: stats.totalHabits ? Math.round((stats.habitsCompleted / stats.totalHabits) * 100) : 0,
            icon: CheckCircle2,
            color: '#10b981',
            colorName: 'emerald',
            glowColor: 'rgba(16, 185, 129, 0.25)',
            shadowColor: 'rgba(16, 185, 129, 0.15)',
          },
          {
            title: 'Focus',
            subtitle: 'Minutes',
            value: `${stats.focusMinutes}m`,
            trend: remainingFocusMinutes > 0 ? `${focusDelta >= 0 ? 'Up' : 'Down'} ${Math.abs(focusDelta)} min vs yesterday` : 'Daily goal reached',
            progress: stats.dailyGoal ? Math.min(Math.round((stats.focusMinutes / stats.dailyGoal) * 100), 100) : 0,
            icon: Clock,
            color: '#3b82f6',
            colorName: 'blue',
            glowColor: 'rgba(59, 130, 246, 0.25)',
            shadowColor: 'rgba(59, 130, 246, 0.15)',
          },
          {
            title: 'Active',
            subtitle: 'Projects',
            value: `${stats.activeProjects}`,
            trend: stats.activeProjects > 0 ? `${stats.projectProgress}% avg progress` : 'No active projects',
            progress: stats.projectProgress,
            icon: Briefcase,
            color: '#f59e0b',
            colorName: 'amber',
            glowColor: 'rgba(245, 158, 11, 0.25)',
            shadowColor: 'rgba(245, 158, 11, 0.15)',
          },
          {
            title: 'Tasks',
            subtitle: 'Completed',
            value: `${stats.completedProjectTasks}/${stats.totalProjectTasks}`,
            trend: `${taskDelta >= 0 ? 'Up' : 'Down'} ${Math.abs(taskDelta)} vs yesterday`,
            progress: stats.totalProjectTasks ? Math.round((stats.completedProjectTasks / stats.totalProjectTasks) * 100) : 0,
            icon: Target,
            color: '#8b5cf6',
            colorName: 'violet',
            glowColor: 'rgba(139, 92, 246, 0.25)',
            shadowColor: 'rgba(139, 92, 246, 0.15)',
          },
        ].map((card) => (
          <div
            key={card.title}
            className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 active:scale-[0.98]"
            style={{
              boxShadow: `0 0 32px ${card.shadowColor}, inset 0 1px 1px rgba(255,255,255,0.08)`,
            }}
          >
            {/* Glow effect on hover */}
            <div
              className="pointer-events-none absolute -inset-0.5 rounded-3xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-60"
              style={{ background: card.glowColor }}
            />

            <div className="relative flex h-full min-h-[160px] flex-col">
              {/* Icon badge - top right */}
              <div
                className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 transition-all duration-300 group-hover:scale-110"
                style={{
                  background: `${card.color}15`,
                  boxShadow: `0 0 20px ${card.glowColor}`,
                }}
              >
                <card.icon className="h-5 w-5" style={{ color: card.color }} />
              </div>

              {/* Title and subtitle - top left */}
              <div className="pr-16">
                <p className="font-poppins text-xs font-semibold uppercase tracking-wider text-zinc-400">{card.subtitle}</p>
                <p className="mt-1 font-poppins text-lg font-bold text-white">{card.title}</p>
              </div>

              {/* Large metric value - center */}
              <p
                className="mt-8 font-poppins font-bold leading-none text-white"
                style={{ fontSize: '2.5rem' }}
              >
                {card.value}
              </p>

              {/* Trend text - bottom left */}
              <p className="mt-auto text-xs font-medium text-zinc-500">{card.trend}</p>

              {/* Progress bar - very bottom */}
              <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${card.progress}%`,
                    background: card.color,
                    boxShadow: `0 0 12px ${card.glowColor}`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TODAY'S MISSION ── */}
      <div className="luxury-card rounded-[1.7rem] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 shadow-[0_0_18px_rgba(139,92,246,0.28)]">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Today's Mission</h2>
              <p className="text-[10px] text-zinc-500">Your roadmap to a productive day</p>
            </div>
          </div>
          <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-zinc-500">3 steps</span>
        </div>
        <div className="space-y-0">
          {[
            {
              num: 1,
              title: 'Complete your habits',
              desc: stats.totalHabits > 0 ? `${stats.habitsCompleted} of ${stats.totalHabits} done` : 'Add a habit to start',
              action: 'View Habits',
              path: '/habits',
              done: incompleteHabits === 0 && stats.totalHabits > 0,
              dot: 'bg-emerald-500',
              line: 'bg-emerald-500/20',
            },
            {
              num: 2,
              title: 'Start a focus session',
              desc: remainingFocusMinutes > 0 ? `${remainingFocusMinutes} min left to hit goal` : 'Focus goal complete!',
              action: 'Start Focus',
              path: '/focus?start=true',
              done: remainingFocusMinutes === 0,
              dot: 'bg-blue-500',
              line: 'bg-blue-500/20',
            },
            {
              num: 3,
              title: 'Review your projects',
              desc: stats.activeProjects > 0 ? `${stats.activeProjects} active project${stats.activeProjects === 1 ? '' : 's'}` : 'Create a project',
              action: 'View Projects',
              path: '/projects',
              done: false,
              dot: 'bg-amber-500',
              line: 'bg-amber-500/20',
            },
          ].map((item, idx, arr) => (
            <div key={item.num} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-[0_0_18px_rgba(139,92,246,0.18)]', item.done ? 'bg-emerald-500' : item.dot)}>
                  {item.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : item.num}
                </div>
                {idx < arr.length - 1 && <div className={cn('mt-1 w-px flex-1', item.line)} style={{ minHeight: 18 }} />}
              </div>
              <div className="min-w-0 flex-1 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={cn('text-sm font-semibold', item.done ? 'text-zinc-500 line-through' : 'text-white')}>{item.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{item.desc}</p>
                  </div>
                  <button onClick={() => navigate(item.path)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-zinc-300 transition-all hover:border-accent/30 hover:text-white active:scale-95">
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
          <Sparkles className="h-4 w-4 text-violet-300" />
          <p className="text-xs text-zinc-500">Keep going! Small steps, big results.</p>
        </div>
      </div>

      {/* ── PRODUCTIVITY PULSE ── */}
      <div className="luxury-card rounded-[1.7rem] p-5">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Productivity Pulse</h2>
            <p className="text-[10px] text-zinc-500">This week's overview</p>
          </div>
          <span className="rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-zinc-500">This Week</span>
        </div>
        {true && (
          <div className="mb-2 flex items-center gap-4 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" />Focus</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Habits</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Tasks</span>
          </div>
        )}
        {true ? (
          <div className="h-[150px] w-full min-w-0">
            <Suspense fallback={<Skeleton className="h-full w-full rounded-xl" />}>
              <DashboardChart data={pulseChartData} />
            </Suspense>
          </div>
        ) : (
          <div className="flex h-[96px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/8 bg-white/[0.015] px-4 text-center sm:h-[116px]">
            <BarChart3 className="h-5 w-5 text-zinc-600" />
            <p className="text-xs font-semibold text-white">No productivity data yet</p>
            <p className="max-w-[280px] text-[11px] leading-snug text-zinc-500">
              Complete habits, tasks, or focus sessions to see your weekly pulse.
            </p>
          </div>
        )}
      </div>

      {/* ── SMART SUGGESTION ── */}
      <div className="luxury-card rounded-[1.7rem] border-violet-500/25 p-4">
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/8 via-transparent to-cyan-500/5" />
        <div className="relative grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-5 sm:grid-cols-[minmax(0,1fr)_5.5rem] sm:gap-8">
          {/* Left: content */}
          <div className="min-w-0 pr-1 sm:pr-2">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <p className="text-xs font-bold text-violet-300">Smart Suggestion</p>
            </div>
            <p className="text-sm font-bold leading-snug text-white">
              {remainingFocusMinutes > 0
                ? 'You focus 32% better in the morning.'
                : stats.totalHabits === 0
                  ? 'Create your first habit'
                  : 'Complete one more habit to increase momentum.'}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {remainingFocusMinutes > 0 ? 'Try scheduling deep work between 7AM - 11AM.' : stats.totalHabits === 0 ? 'Build a daily routine.' : 'You are close to your daily goal.'}
            </p>
            <button
              onClick={() => navigate(remainingFocusMinutes > 0 ? '/focus?start=true' : stats.totalHabits === 0 ? '/habits?add=true' : '/projects')}
              className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-500/20 transition-all active:scale-95"
            >
              Start Now <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {/* Right: clean ring only */}
          <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center justify-self-end">
            <svg viewBox="0 0 72 72" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="36" cy="36" r="30" stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="none" />
              <circle cx="36" cy="36" r="30" strokeWidth="5" strokeLinecap="round" fill="none"
                stroke="url(#suggGrad)"
                strokeDasharray="188.5"
                strokeDashoffset={`${188.5 - (188.5 * 30) / 100}`}
              />
              <defs>
                <linearGradient id="suggGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="relative text-center">
              <p className="text-base font-bold leading-none text-white">30%</p>
              <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-widest text-zinc-500">ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RECENT ACTIVITY ── */}
      <div className="luxury-card rounded-[1.7rem] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Recent Activity</h2>
          <button onClick={() => navigate('/notes')} className="text-[10px] font-bold text-accent">View all</button>
        </div>
        <div className="space-y-2">
          {stats.recentActivity.length ? stats.recentActivity.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                item.type === 'habit' ? 'bg-emerald-500/15 text-emerald-400' :
                item.type === 'note' ? 'bg-amber-500/15 text-amber-400' :
                item.type === 'focus' ? 'bg-blue-500/15 text-blue-400' :
                'bg-violet-500/15 text-violet-400'
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{item.detail}</p>
                <p className="text-[10px] text-zinc-600">{item.title}</p>
              </div>
              <span className="shrink-0 text-[10px] text-zinc-600">{formatActivityTime(item.date)}</span>
            </div>
          )) : (
            <div className="flex flex-col items-center gap-2 py-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
                <Sparkles className="h-4 w-4 text-zinc-600" />
              </div>
              <p className="text-xs text-zinc-600">No activity yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── HABIT STREAKS ── */}
      <div className="luxury-card rounded-[1.7rem] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Habit Streaks</h2>
          <button onClick={() => navigate('/habits')} className="text-[10px] font-bold text-accent">View all</button>
        </div>
        <div className="space-y-3">
          {stats.habitStreaks.length ? stats.habitStreaks.map((habit) => {
            const weeklyDone = [...Array(7)].filter((_, index) => {
              const day = new Date();
              day.setDate(day.getDate() - (6 - index));
              return habit.completedDates.includes(dateKey(day));
            }).length;
            const completionPercent = Math.round((weeklyDone / 7) * 100);
            const isCompletedToday = habit.completedDates.includes(dateKey(new Date()));
            const HabitIcon = HABIT_ICONS[habit.icon as keyof typeof HABIT_ICONS] || Target;

            return (
              <div key={habit.id} className="group relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-white/[0.025] p-4 transition-all hover:border-accent/30">
                <div className="absolute right-0 top-0 h-36 w-36 -translate-y-1/2 translate-x-1/2 rounded-full blur-[80px] opacity-20" style={{ backgroundColor: habit.color }} />
                <div className="relative z-10 grid grid-cols-[auto_minmax(0,1fr)_3.75rem] items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_4rem] sm:gap-5">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl sm:h-16 sm:w-16"
                    style={{ color: habit.color, boxShadow: `0 0 24px ${habit.color}22` }}
                  >
                    <HabitIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="truncate font-display text-base font-bold text-white sm:text-lg">{habit.title}</h3>
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                    </div>
                    <p className="mt-0.5 text-sm text-zinc-400">{habit.frequency}</p>
                    <div className="mt-3 flex items-center gap-4 sm:hidden">
                      <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-white">
                        <Flame className="h-3.5 w-3.5 text-orange-400" />
                        {habit.streak}<span className="font-sans text-[10px] font-medium text-zinc-500">streak</span>
                      </span>
                      <span className="font-mono text-sm font-bold text-white">{completionPercent}%</span>
                    </div>
                  </div>

                  <div className="hidden shrink-0 items-center gap-2 text-center sm:flex">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <div>
                      <p className="font-mono text-xl font-bold leading-none text-white">{habit.streak}</p>
                      <p className="text-[10px] text-zinc-500">streak</p>
                    </div>
                  </div>

                  <div className="hidden shrink-0 text-center sm:block">
                    <p className="font-mono text-2xl font-bold leading-none text-white">{completionPercent}%</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/habits')}
                    className={cn(
                      'flex h-14 w-14 shrink-0 items-center justify-center justify-self-end rounded-full border transition-all active:scale-95 sm:h-16 sm:w-16',
                      isCompletedToday
                        ? 'border-emerald-400/30 bg-emerald-500 text-white shadow-[0_0_26px_rgba(16,185,129,0.45)]'
                        : 'border-white/12 bg-white/[0.055] text-zinc-400 shadow-[0_0_18px_rgba(139,92,246,0.08)] hover:border-emerald-400/30 hover:text-emerald-300'
                    )}
                    aria-label="Open habits"
                  >
                    <CheckCircle2 className="h-6 w-6" />
                  </button>
                </div>
                <div className="relative z-10 ml-[4.25rem] mr-[4.25rem] mt-4 h-1.5 overflow-hidden rounded-full bg-white/8 sm:ml-[5.25rem] sm:mr-[5.25rem]">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${completionPercent}%`, backgroundColor: habit.color, boxShadow: `0 0 18px ${habit.color}66` }} />
                </div>
              </div>
            );
          }) : (
            <div className="flex flex-col items-center gap-2 py-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
                <Flame className="h-4 w-4 text-zinc-600" />
              </div>
              <p className="text-xs text-zinc-600">No streaks yet</p>
              <button onClick={() => navigate('/habits?add=true')} className="text-xs font-bold text-accent">Add a habit</button>
            </div>
          )}
        </div>
      </div>

      {/* ── PROJECT RADAR ── */}
      <div className="luxury-card rounded-[1.7rem] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Project Radar</h2>
          <button onClick={() => navigate('/projects')} className="text-[10px] font-bold text-accent">View all</button>
        </div>
        <div className="space-y-3">
          {stats.projectRadar.length ? stats.projectRadar.map((project) => (
            <div key={project.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-white">{project.title}</p>
                <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                  project.priority === 'high' ? 'bg-red-500/15 text-red-400' :
                  project.priority === 'medium' ? 'bg-amber-500/15 text-amber-400' :
                  'bg-emerald-500/15 text-emerald-400'
                )}>
                  {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                  <div className={cn('h-full rounded-full transition-all duration-700',
                    project.priority === 'high' ? 'bg-gradient-to-r from-red-500 to-orange-400' :
                    project.priority === 'medium' ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                    'bg-gradient-to-r from-emerald-500 to-teal-400'
                  )} style={{ width: `${project.progress}%` }} />
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-zinc-500">{project.progress}%</span>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center gap-2 py-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
                <Target className="h-4 w-4 text-zinc-600" />
              </div>
              <p className="text-xs text-zinc-600">No active projects</p>
              <button onClick={() => navigate('/projects?add=true')} className="text-xs font-bold text-accent">Create one</button>
            </div>
          )}
        </div>
      </div>

      {/* ── FOCUS ZONE ── */}
      <div className="luxury-card rounded-[1.7rem] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Focus Zone</h2>
          <button onClick={() => navigate('/focus')} className="text-[10px] font-bold text-accent">View all</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { mins: 25, label: 'Focus', icon: Zap, color: 'from-violet-500 to-violet-600' },
            { mins: 45, label: 'Deep Work', icon: Flame, color: 'from-blue-500 to-cyan-500' },
            { mins: 60, label: 'Flow State', icon: Sparkles, color: 'from-emerald-500 to-teal-500' },
          ].map((zone) => (
            <button key={zone.label} onClick={() => navigate('/focus?start=true')}
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.02] p-3 transition-all active:scale-95">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white', zone.color)}>
                <zone.icon className="h-4 w-4" />
              </div>
              <p className="text-lg font-bold text-white leading-none">{zone.mins}</p>
              <p className="text-[9px] text-zinc-500">min</p>
              <p className="text-[10px] font-semibold text-zinc-400">{zone.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── QUOTE ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/8 p-5"
        style={{ background: 'radial-gradient(circle at 20% 50%, rgba(139,92,246,0.12) 0%, transparent 55%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.08) 0%, transparent 50%), #0a0c15' }}>
        <div className="pointer-events-none absolute bottom-0 right-0 h-20 w-20 opacity-10">
          <svg viewBox="0 0 80 80" fill="none">
            <path d="M40 80 L80 40 L80 80 Z" fill="url(#qg1)" />
            <path d="M20 80 L60 20 L80 80 Z" fill="url(#qg2)" opacity="0.6" />
            <defs>
              <linearGradient id="qg1" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#4f46e5"/></linearGradient>
              <linearGradient id="qg2" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#6d28d9"/><stop offset="1" stopColor="#312e81"/></linearGradient>
            </defs>
          </svg>
        </div>
        <span className="text-xl font-bold text-violet-400/25 leading-none">"</span>
        <p className="mt-1 text-sm font-bold text-white leading-relaxed">Discipline is the bridge between goals and accomplishment.</p>
        <p className="mt-2 text-xs text-zinc-600">- Jim Rohn</p>
      </div>

    </div>
  );
});
