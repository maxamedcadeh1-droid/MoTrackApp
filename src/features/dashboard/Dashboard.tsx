import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import { Button, Card, Skeleton } from '../../components/ui/Layout';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { getTrendIndicator } from '../../lib/insights';
import { useAuth } from '../auth/AuthContext';

const DashboardChart = lazy(() => import('./DashboardChart').then((mod) => ({ default: mod.DashboardChart })));

type WeeklyDashboardData = {
  day: string;
  habitsCompleted: number;
  focusMinutes: number;
  projectProgress: number;
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

          return {
            day: day.toLocaleDateString('en-US', { weekday: 'short' }),
            habitsCompleted,
            focusMinutes,
            projectProgress,
          };
        });

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
        });
      } catch (err) {
        console.error('Dashboard data error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  const firstName = useMemo(() => {
    const source = profile?.full_name || user?.email?.split('@')[0] || 'Mohamed';
    return source.split(' ')[0] || 'Mohamed';
  }, [profile?.full_name, user?.email]);

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

  const momentumInsight = useMemo(() => {
    if (hasNoData) return 'Start with one habit, one note, or one focus session to build your first dashboard signal.';
    if (remainingProjectTasks > 0) return "You're building momentum. Complete one more task to improve today's score.";
    if (incompleteHabits > 0) return "You're building momentum. Complete one more habit to improve today's score.";
    if (remainingFocusMinutes > 0) return "Your habits are in good shape. Start a focus session to improve today's score.";
    return 'Strong progress today. Review an active project to keep momentum moving.';
  }, [hasNoData, incompleteHabits, remainingFocusMinutes, remainingProjectTasks]);

  const metrics = useMemo(() => [
    {
      icon: CheckCircle2,
      label: 'Habits Completed',
      value: `${stats.habitsCompleted}/${stats.totalHabits}`,
      detail: stats.totalHabits > 0 ? `${incompleteHabits} left today` : 'Create your first habit',
      tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/15',
    },
    {
      icon: Timer,
      label: 'Focus Minutes',
      value: `${stats.focusMinutes}`,
      detail: `${remainingFocusMinutes} minutes to daily goal`,
      tone: 'text-blue-300 bg-blue-500/10 border-blue-500/15',
    },
    {
      icon: Briefcase,
      label: 'Active Projects',
      value: `${stats.activeProjects}`,
      detail: `${stats.projectProgress}% average progress`,
      tone: 'text-purple-300 bg-purple-500/10 border-purple-500/15',
    },
    {
      icon: Target,
      label: 'Tasks Completed',
      value: `${stats.completedProjectTasks}/${stats.totalProjectTasks}`,
      detail: remainingProjectTasks > 0 ? `${remainingProjectTasks} open tasks` : 'No open project tasks',
      tone: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/15',
    },
  ], [incompleteHabits, remainingFocusMinutes, remainingProjectTasks, stats]);

  const missions = useMemo(() => [
    {
      icon: CheckCircle2,
      title: 'Complete habits',
      detail: stats.totalHabits === 0 ? 'Create a routine you can complete today.' : `${incompleteHabits} habit${incompleteHabits === 1 ? '' : 's'} left today.`,
      action: 'Open Habits',
      path: '/habits',
      tone: 'text-emerald-300 bg-emerald-500/10',
    },
    {
      icon: Timer,
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
  ], [incompleteHabits, remainingFocusMinutes, stats.activeProjects, stats.totalHabits]);

  const navigateToHabits = useCallback(() => navigate('/habits?add=true'), [navigate]);
  const navigateToNotes = useCallback(() => navigate('/notes?add=true'), [navigate]);
  const navigateToProjects = useCallback(() => navigate('/projects?add=true'), [navigate]);
  const navigateToFocus = useCallback(() => navigate('/focus?start=true'), [navigate]);
  const openCommandCenter = useCallback(() => window.dispatchEvent(new Event('motrack:open-command-center')), []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-40 rounded-full" />
            <Skeleton className="h-12 w-72 rounded-xl" />
            <Skeleton className="h-4 w-full max-w-xl rounded-lg" />
          </div>
          <Skeleton className="h-14 w-56 rounded-2xl" />
        </div>
        <Skeleton className="h-[360px] rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-36 rounded-3xl" />)}
        </div>
        <Skeleton className="h-[360px] rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-12">
      <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-zinc-400">
              <Calendar className="h-3.5 w-3.5 text-accent" />
              {todayLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/10 bg-emerald-500/5 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Synced
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-normal text-white md:text-6xl">
            Good morning, {firstName}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-500">
            Here's your productivity overview for today.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:items-center">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex min-h-14 min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 text-left transition-all hover:border-accent/25 hover:bg-white/[0.055] md:min-w-[220px]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={firstName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="h-4 w-4 text-accent" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{profile?.full_name || firstName}</span>
              <span className="mt-0.5 block truncate text-xs text-zinc-500">{user?.email || 'Account'}</span>
            </span>
          </button>
          <Button type="button" onClick={openCommandCenter} className="h-14 px-5">
            <Sparkles className="mr-2 h-4 w-4" />
            Quick action
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card variant="premium" className="overflow-hidden border-white/10 bg-[#080b13]/80 p-0 xl:col-span-8">
          <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
            <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.18),transparent_58%)]" />
              <MomentumRing score={stats.momentum} />
            </div>
            <div className="relative p-5 sm:p-8 lg:p-10">
              <div className="mb-8 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Momentum score
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs font-medium text-zinc-400">
                  {trend.trend === 'up' ? '+' : trend.trend === 'down' ? '-' : ''}
                  {trend.trend === 'stable' ? 'Stable vs yesterday' : `${trend.percentage}% vs yesterday`}
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-zinc-500">Today's score</p>
                  <h2 className="mt-2 max-w-2xl font-display text-3xl font-semibold leading-tight text-white md:text-4xl">
                    {stats.momentum}% on track today.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
                    {momentumInsight}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <ContributionPill label="Habits" value={stats.habitsScore} max={40} color="bg-emerald-400" />
                  <ContributionPill label="Focus" value={stats.focusScore} max={30} color="bg-blue-400" />
                  <ContributionPill label="Projects" value={stats.projectsScore} max={30} color="bg-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-white/10 bg-[#080b13]/72 p-5 sm:p-6 xl:col-span-4">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Suggested next step</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-white">Keep moving</h3>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
              <Sparkles className="h-5 w-5" />
            </span>
          </div>
          <p className="min-h-14 text-base font-medium leading-relaxed text-zinc-300">{suggestion}</p>
          <Button type="button" onClick={suggestion.includes('habit') ? navigateToHabits : suggestion.includes('project') ? () => navigate('/projects') : navigateToFocus} className="mt-6 w-full">
            Take next step
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">Today's Mission</h2>
            <p className="mt-1 text-sm text-zinc-500">Three simple moves that improve today's score.</p>
          </div>
          <span className="w-fit rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 font-mono text-xs text-zinc-500">
            {stats.momentum}% today
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {missions.map((mission) => (
            <MissionCard key={mission.title} {...mission} onClick={() => navigate(mission.path)} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card className="min-w-0 border-white/10 bg-[#080b13]/72 p-5 sm:p-8 xl:col-span-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">Weekly Productivity</h2>
              <p className="mt-1 text-sm text-zinc-500">Habits completed, focus minutes, and project progress.</p>
            </div>
            <span className="w-fit rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 font-mono text-xs text-zinc-400">
              7 days
            </span>
          </div>
          <Suspense fallback={<Skeleton className="h-[300px] rounded-2xl" />}>
            <DashboardChart data={stats.weeklyData} />
          </Suspense>
        </Card>

        <Card className="border-white/10 bg-[#080b13]/72 p-5 sm:p-8 xl:col-span-4">
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">Recent Activity</h2>
              <p className="mt-1 text-sm text-zinc-500">Latest updates from your workspace.</p>
            </div>
            <Clock className="h-5 w-5 text-zinc-600" />
          </div>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-5">
              <p className="text-sm leading-relaxed text-zinc-500">
                Your activity will appear here once you start using MoTrack.
              </p>
            </div>
          )}
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card className="border-white/10 bg-[#080b13]/72 p-5 sm:p-8 xl:col-span-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">Quick Actions</h2>
              <p className="mt-1 text-sm text-zinc-500">Create or start something without leaving the dashboard.</p>
            </div>
            <Zap className="h-5 w-5 text-accent" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <QuickActionButton icon={CheckCircle2} label="New Habit" onClick={navigateToHabits} />
            <QuickActionButton icon={FileText} label="New Note" onClick={navigateToNotes} />
            <QuickActionButton icon={Briefcase} label="New Project" onClick={navigateToProjects} />
            <QuickActionButton icon={Timer} label="Start Focus" onClick={navigateToFocus} />
          </div>
        </Card>

        <Card className="border-white/10 bg-[#080b13]/72 p-5 sm:p-8 xl:col-span-4">
          <div className="flex h-full flex-col justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Workspace health</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-white">Clean overview</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                Your dashboard uses live habits, focus, project, note, and task data from Supabase.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => navigate('/analytics')} className="w-full">
              <BarChart3 className="mr-2 h-4 w-4" />
              View analytics
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
});

function MomentumRing({ score }: { score: number }) {
  const strokeDasharray = `${score} 100`;

  return (
    <div className="relative h-56 w-56">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="52" pathLength={100} className="fill-none stroke-white/5" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r="52"
          pathLength={100}
          className="fill-none stroke-accent transition-all duration-700"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-6xl font-bold leading-none text-white">{score}</span>
        <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Momentum</span>
      </div>
    </div>
  );
}

function ContributionPill({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percent = Math.min((value / max) * 100, 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-zinc-400">{label}</span>
        <span className="font-mono text-xs text-white">{value}/{max}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone }: { icon: typeof Timer; label: string; value: string; detail: string; tone: string }) {
  return (
    <Card className="border-white/10 bg-[#080b13]/72 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl border', tone)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-2 font-mono text-4xl font-bold leading-none text-white">{value}</p>
      <p className="mt-3 text-sm text-zinc-600">{detail}</p>
    </Card>
  );
}

function MissionCard({
  icon: Icon,
  title,
  detail,
  action,
  tone,
  onClick,
}: {
  icon: typeof Timer;
  title: string;
  detail: string;
  action: string;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group cursor-pointer rounded-3xl border border-white/10 bg-[#080b13]/72 p-5 text-left transition-all duration-200 hover:border-accent/30 hover:bg-accent/[0.035] hover:shadow-[0_0_24px_rgba(139,92,246,0.10)] active:scale-[0.99] sm:p-6"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <span className={cn('flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10', tone)}>
          <Icon className="h-5 w-5" />
        </span>
        <ArrowRight className="h-4 w-4 text-zinc-700 transition-all group-hover:translate-x-1 group-hover:text-accent" />
      </div>
      <h3 className="font-display text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 min-h-10 text-sm leading-relaxed text-zinc-500">{detail}</p>
      <span className="mt-5 inline-flex text-sm font-semibold text-accent">{action}</span>
    </button>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = item.icon;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white">{item.title}</span>
        <span className="mt-1 block truncate text-xs text-zinc-500">{item.detail}</span>
      </span>
      <span className="shrink-0 font-mono text-[10px] text-zinc-600">{formatActivityTime(item.date)}</span>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, onClick }: { icon: typeof Timer; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-14 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left transition-all hover:border-accent/30 hover:bg-accent/[0.04] active:scale-[0.99]"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-accent transition-colors group-hover:bg-accent/10">
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-sm font-semibold text-white">{label}</span>
      </span>
      <Plus className="h-4 w-4 text-zinc-700 transition-colors group-hover:text-accent" />
    </button>
  );
}
