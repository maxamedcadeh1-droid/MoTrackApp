import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  Plus,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Button, Card, Skeleton } from '../../components/ui/Layout';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { getMomentumInsight, getTimeBasedGreeting, getTrendIndicator } from '../../lib/insights';
import { useAuth } from '../auth/AuthContext';

const DashboardChart = lazy(() => import('./DashboardChart').then((mod) => ({ default: mod.DashboardChart })));
const SuggestedNextAction = lazy(() => import('./SuggestedNextAction').then((mod) => ({ default: mod.SuggestedNextAction })));
const DashboardChecklist = lazy(() => import('./DashboardChecklist').then((mod) => ({ default: mod.DashboardChecklist })));
const WelcomeEmptyState = lazy(() => import('./EnhancedEmptyState').then((mod) => ({ default: mod.WelcomeEmptyState })));

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

  const greeting = useMemo(() => getTimeBasedGreeting(firstName), [firstName]);
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
  const incompleteHabits = Math.max(stats.totalHabits - stats.habitsCompleted, 0);
  const remainingFocusMinutes = Math.max(stats.dailyGoal - stats.focusMinutes, 0);
  const remainingProjectTasks = Math.max(stats.totalProjectTasks - stats.completedProjectTasks, 0);
  const trend = useMemo(() => getTrendIndicator(stats.momentum, stats.previousMomentum), [stats.momentum, stats.previousMomentum]);

  const suggestion = useMemo(() => {
    if (stats.totalHabits === 0) return 'Create your first habit.';
    if (remainingFocusMinutes > 0) return 'Start a 25-minute focus session.';
    if (stats.activeProjects > 0) return 'Review your active project.';
    return 'Create a project for your next meaningful goal.';
  }, [remainingFocusMinutes, stats.activeProjects, stats.totalHabits]);

  const syncStatus = lastSyncedAt ? `Live · Synced at ${lastSyncedAt}` : 'Live sync activating…';

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

﻿  if (loading) {
    return (
      <div className="space-y-4 pb-12">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-4 w-80 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_320px]">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
      </div>
    );
  }

﻿  return (
    <div className="space-y-4 pb-12">

      {/* ── MOBILE HERO SECTION ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-[#0a0c15] via-[#080b13] to-[#0a0c15] p-5 shadow-2xl">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" />
        
        <div className="relative flex items-start justify-between gap-4">
          {/* Left: Greeting */}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
              {greeting.split(',')[0]},{' '}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
                {firstName}
              </span>
              .
            </h1>
            <p className="mt-1.5 text-sm text-zinc-400">Let's build your best day.</p>
            
            {/* Badges */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live sync on
              </span>
              {trend.trend !== 'stable' && (
                <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
                  trend.trend === 'up' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-red-500/20 bg-red-500/10 text-red-400'
                )}>
                  {trend.trend === 'up' ? '↑' : '↓'} {trend.percentage}%
                </span>
              )}
            </div>
          </div>

          {/* Right: Momentum Orb */}
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center sm:h-24 sm:w-24">
            {/* Glow effect */}
            <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 blur-xl" />
            {/* Ring */}
            <svg viewBox="0 0 96 96" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="48" cy="48" r="42" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" />
              <circle cx="48" cy="48" r="42" strokeWidth="6" strokeLinecap="round" fill="none"
                stroke="url(#heroMomentumGrad)"
                strokeDasharray="263.9"
                strokeDashoffset={`${263.9 - (263.9 * stats.momentum) / 100}`}
              />
              <defs>
                <linearGradient id="heroMomentumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="50%" stopColor="#d946ef" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            {/* Score */}
            <div className="relative text-center">
              <p className="text-2xl font-bold text-white leading-none sm:text-3xl">{stats.momentum}</p>
              <p className="text-[9px] font-medium uppercase tracking-widest text-zinc-500 mt-0.5">score</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ONBOARDING ── */}
      {hasNoData && (
        <Suspense fallback={<Skeleton className="h-40 rounded-2xl" />}>
          <DashboardChecklist stats={stats} navigate={navigate} />
        </Suspense>
      )}

      {/* ── METRIC CARDS (2x2 grid) ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: 'Habits',
            value: `${stats.habitsCompleted}/${stats.totalHabits}`,
            desc: incompleteHabits > 0 ? `${incompleteHabits} left` : 'All done!',
            progress: stats.totalHabits ? Math.round((stats.habitsCompleted / stats.totalHabits) * 100) : 0,
            icon: CheckCircle2,
            color: '#10b981',
            bgGlow: 'from-emerald-500/10 to-emerald-500/5',
          },
          {
            label: 'Focus',
            value: `${stats.focusMinutes}m`,
            desc: remainingFocusMinutes > 0 ? `${remainingFocusMinutes}m left` : 'Goal hit!',
            progress: stats.dailyGoal ? Math.min(Math.round((stats.focusMinutes / stats.dailyGoal) * 100), 100) : 0,
            icon: Clock,
            color: '#3b82f6',
            bgGlow: 'from-blue-500/10 to-blue-500/5',
          },
          {
            label: 'Projects',
            value: `${stats.activeProjects}`,
            desc: `${stats.projectProgress}% avg`,
            progress: stats.projectProgress,
            icon: Briefcase,
            color: '#f59e0b',
            bgGlow: 'from-amber-500/10 to-amber-500/5',
          },
          {
            label: 'Tasks',
            value: `${stats.completedProjectTasks}/${stats.totalProjectTasks}`,
            desc: remainingProjectTasks > 0 ? `${remainingProjectTasks} left` : 'All done!',
            progress: stats.totalProjectTasks ? Math.round((stats.completedProjectTasks / stats.totalProjectTasks) * 100) : 0,
            icon: Target,
            color: '#8b5cf6',
            bgGlow: 'from-violet-500/10 to-violet-500/5',
          },
        ].map((card) => (
          <div key={card.label} className={cn('glass-card relative overflow-hidden border-white/8 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15')}>
            {/* Glow background */}
            <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br opacity-40', card.bgGlow)} />
            
            <div className="relative">
              {/* Icon */}
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${card.color}18` }}>
                <card.icon className="h-5 w-5" style={{ color: card.color }} />
              </div>
              
              {/* Value */}
              <p className="text-2xl font-bold text-white leading-none">{card.value}</p>
              <p className="mt-1 text-xs font-medium text-zinc-500">{card.label}</p>
              <p className="mt-1.5 text-xs font-medium text-zinc-400">{card.desc}</p>
              
              {/* Progress line */}
              <div className="mt-3 h-1 w-full rounded-full bg-white/8">
                <div className="h-1 rounded-full transition-all duration-500" style={{ width: `${card.progress}%`, background: card.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>
﻿
      {/* ── TODAY'S MISSION ── */}
      <div className="glass-card border-white/8 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/15">
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Today's Mission</h2>
              <p className="text-[10px] text-zinc-500">Your roadmap to a productive day</p>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-zinc-400">3 steps</span>
        </div>

        <div className="space-y-0">
          {[
            {
              num: 1,
              title: 'Complete your habits',
              desc: stats.totalHabits > 0 ? `${stats.habitsCompleted} of ${stats.totalHabits} done` : "Add a habit to start",
              action: 'View Habits',
              path: '/habits',
              done: incompleteHabits === 0 && stats.totalHabits > 0,
              dotColor: 'bg-emerald-500',
              lineColor: 'bg-emerald-500/20',
            },
            {
              num: 2,
              title: 'Start a focus session',
              desc: remainingFocusMinutes > 0 ? `${remainingFocusMinutes} min left to hit goal` : 'Focus goal complete!',
              action: 'Start Focus',
              path: '/focus?start=true',
              done: remainingFocusMinutes === 0,
              dotColor: 'bg-blue-500',
              lineColor: 'bg-blue-500/20',
            },
            {
              num: 3,
              title: 'Review your projects',
              desc: stats.activeProjects > 0 ? `${stats.activeProjects} active project${stats.activeProjects === 1 ? '' : 's'}` : 'Create a project',
              action: 'View Projects',
              path: '/projects',
              done: false,
              dotColor: 'bg-amber-500',
              lineColor: 'bg-amber-500/20',
            },
          ].map((item, idx, arr) => (
            <div key={item.num} className="flex gap-3">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white transition-all', item.done ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : item.dotColor)}>
                  {item.done ? <CheckCircle2 className="h-4 w-4" /> : item.num}
                </div>
                {idx < arr.length - 1 && (
                  <div className={cn('mt-1 w-0.5 flex-1', item.lineColor)} style={{ minHeight: '20px' }} />
                )}
              </div>
              {/* Content */}
              <div className="min-w-0 flex-1 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={cn('text-sm font-semibold leading-tight', item.done ? 'text-zinc-500 line-through' : 'text-white')}>{item.title}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{item.desc}</p>
                  </div>
                  <button onClick={() => navigate(item.path)}
                    className="shrink-0 flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 transition-all hover:border-accent/30 hover:bg-accent/10 hover:text-white active:scale-95">
                    {item.action}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-1 flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
          <span className="text-base">🚀</span>
          <p className="text-xs text-zinc-400">Keep going! Small steps, big results.</p>
        </div>
      </div>

      {/* ── PRODUCTIVITY PULSE ── */}
      <div className="glass-card border-white/8 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Productivity Pulse</h2>
            <p className="text-[10px] text-zinc-500">This week's overview</p>
          </div>
          <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-zinc-400">This Week</span>
        </div>
      {/* ── PRODUCTIVITY PULSE ── */}
      <div className="glass-card border-white/8 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Productivity Pulse</h2>
            <p className="text-[10px] text-zinc-500">This week's overview</p>
          </div>
          <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-zinc-400">This Week</span>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" />Focus</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Habits</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Tasks</span>
        </div>
        <div className="h-[180px] w-full min-w-0">
          <Suspense fallback={<Skeleton className="h-[180px] w-full rounded-xl" />}>
            <DashboardChart data={stats.weeklyData} />
          </Suspense>
        </div>
      </div>

      {/* ── SMART SUGGESTION ── */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-[#0a0c15] to-cyan-500/8 p-5">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/15 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400">✨</span>
              <p className="text-xs font-bold text-violet-300">Smart Suggestion</p>
            </div>
            <p className="text-sm font-bold text-white leading-snug">
              {remainingFocusMinutes > 0 ? `Start a ${Math.min(remainingFocusMinutes, 25)}-minute focus session` : stats.totalHabits === 0 ? 'Create your first habit' : 'Review your active projects'}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {remainingFocusMinutes > 0 ? "You'll boost your momentum score" : stats.totalHabits === 0 ? 'Build a daily routine' : 'Stay on top of your goals'}
            </p>
            <button
              onClick={() => navigate(remainingFocusMinutes > 0 ? '/focus?start=true' : stats.totalHabits === 0 ? '/habits?add=true' : '/projects')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 active:scale-95"
            >
              Start Now
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {/* Mini momentum ring */}
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
            <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="none" />
              <circle cx="32" cy="32" r="28" strokeWidth="5" strokeLinecap="round" fill="none"
                stroke="url(#suggRing)"
                strokeDasharray="175.9"
                strokeDashoffset={`${175.9 - (175.9 * stats.momentum) / 100}`}
              />
              <defs>
                <linearGradient id="suggRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="relative text-center">
              <p className="text-sm font-bold text-white leading-none">{stats.momentum}%</p>
            </div>
          </div>
        </div>
      </div>
﻿
      {/* ── RECENT ACTIVITY ── */}
      <div className="glass-card border-white/8 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Recent Activity</h2>
          <button onClick={() => navigate('/notes')} className="text-xs font-semibold text-accent hover:underline">View all</button>
        </div>
        <div className="space-y-2.5">
          {stats.recentActivity.length ? stats.recentActivity.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/5">
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
            <div className="py-8 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Sparkles className="h-5 w-5 text-zinc-600" />
              </div>
              <p className="text-xs text-zinc-600">No activity yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── HABIT STREAKS ── */}
      <div className="glass-card border-white/8 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Habit Streaks</h2>
          <button onClick={() => navigate('/habits')} className="text-xs font-semibold text-accent hover:underline">View all</button>
        </div>
        <div className="space-y-3">
          {stats.habitStreaks.length ? stats.habitStreaks.map((habit) => (
            <div key={habit.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${habit.color}18` }}>
                <Target className="h-4 w-4" style={{ color: habit.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{habit.title}</p>
                <p className="text-xs text-zinc-500">{habit.streak} day streak</p>
              </div>
              <div className="flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold" style={{ background: `${habit.color}18`, color: habit.color }}>
                <Flame className="h-3.5 w-3.5" />
                {habit.streak}
              </div>
            </div>
          )) : (
            <div className="py-8 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Flame className="h-5 w-5 text-zinc-600" />
              </div>
              <p className="text-xs text-zinc-600">No streaks yet</p>
              <button onClick={() => navigate('/habits?add=true')} className="mt-2 text-xs font-semibold text-accent hover:underline">Add a habit</button>
            </div>
          )}
        </div>
      </div>

      {/* ── PROJECT RADAR ── */}
      <div className="glass-card border-white/8 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Project Radar</h2>
          <button onClick={() => navigate('/projects')} className="text-xs font-semibold text-accent hover:underline">View all</button>
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
                <div className="flex-1 h-1.5 rounded-full bg-white/8">
                  <div className={cn('h-1.5 rounded-full transition-all duration-500',
                    project.priority === 'high' ? 'bg-gradient-to-r from-red-500 to-orange-400' :
                    project.priority === 'medium' ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                    'bg-gradient-to-r from-emerald-500 to-teal-400'
                  )} style={{ width: `${project.progress}%` }} />
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-zinc-500">{project.progress}%</span>
              </div>
            </div>
          )) : (
            <div className="py-8 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Target className="h-5 w-5 text-zinc-600" />
              </div>
              <p className="text-xs text-zinc-600">No active projects</p>
              <button onClick={() => navigate('/projects?add=true')} className="mt-2 text-xs font-semibold text-accent hover:underline">Create one</button>
            </div>
          )}
        </div>
      </div>

      {/* ── FOCUS ZONE ── */}
      <div className="glass-card border-white/8 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Focus Zone</h2>
          <button onClick={() => navigate('/focus')} className="text-xs font-semibold text-accent hover:underline">View all</button>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { mins: 25, label: 'Focus', icon: Zap, color: 'from-violet-500 to-violet-600' },
            { mins: 45, label: 'Deep Work', icon: Flame, color: 'from-blue-500 to-cyan-500' },
            { mins: 60, label: 'Flow State', icon: Sparkles, color: 'from-emerald-500 to-teal-500' },
          ].map((zone) => (
            <button key={zone.label} onClick={() => navigate('/focus?start=true')}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15 active:scale-95">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', zone.color)}>
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
        style={{background:'radial-gradient(circle at 20% 50%, rgba(139,92,246,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.1) 0%, transparent 50%), #0a0c15'}}>
        <div className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 opacity-15">
          <svg viewBox="0 0 96 96" fill="none">
            <path d="M48 96 L96 48 L96 96 Z" fill="url(#qMtn1)" />
            <path d="M24 96 L72 24 L96 96 Z" fill="url(#qMtn2)" opacity="0.6" />
            <defs>
              <linearGradient id="qMtn1" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#4f46e5"/></linearGradient>
              <linearGradient id="qMtn2" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#6d28d9"/><stop offset="1" stopColor="#312e81"/></linearGradient>
            </defs>
          </svg>
        </div>
        <div className="relative">
          <span className="text-2xl font-bold text-violet-400/30 leading-none">"</span>
          <p className="mt-1 text-sm font-bold text-white leading-relaxed">
            Discipline is the bridge between goals and accomplishment.
          </p>
          <p className="mt-2 text-xs text-zinc-500">– Jim Rohn</p>
        </div>
      </div>

    </div>
  );
});
