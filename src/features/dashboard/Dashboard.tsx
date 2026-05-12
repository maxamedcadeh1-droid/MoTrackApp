import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Coffee,
  Book,
  FileText,
  Flame,
  Moon,
  Sun,
  Target,
  Timer,
  Zap,
} from 'lucide-react';
import { Skeleton } from '../../components/ui/Layout';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { DashboardHero } from './components/DashboardHero';
import { CinematicCard } from './components/CinematicCard';
import { TodayMission } from './components/TodayMission';
import { ProductivityPulse } from './components/ProductivityPulse';
import { SmartSuggestion } from './components/SmartSuggestion';
import { RecentActivity } from './components/RecentActivity';
import { getTrendIndicator } from '../../lib/insights';
import { useAuth } from '../auth/AuthContext';

const DashboardChecklist = lazy(() => import('./DashboardChecklist').then((mod) => ({ default: mod.DashboardChecklist })));

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
  const trend = useMemo(() => getTrendIndicator(stats.momentum, stats.previousMomentum), [stats.momentum, stats.previousMomentum]);
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

  const hasNoData = stats.totalHabits === 0 && stats.activeProjects === 0 && stats.focusMinutes === 0;
  const incompleteHabits = Math.max(stats.totalHabits - stats.habitsCompleted, 0);
  const remainingFocusMinutes = Math.max(stats.dailyGoal - stats.focusMinutes, 0);
  const yesterdayPulse = stats.weeklyData.length >= 2 ? stats.weeklyData[stats.weeklyData.length - 2] : undefined;
  const habitsDelta = stats.habitsCompleted - (yesterdayPulse?.habitsCompleted || 0);
  const focusDelta = stats.focusMinutes - (yesterdayPulse?.focusMinutes || 0);
  const todayTasksDone = stats.weeklyData[stats.weeklyData.length - 1]?.tasksCompleted || 0;
  const taskDelta = todayTasksDone - (yesterdayPulse?.tasksCompleted || 0);

  const syncStatus = lastSyncedAt ? `Live - Synced at ${lastSyncedAt}` : 'Live sync activating...';
  const syncLabel = lastSyncedAt ? 'Live sync on' : 'Syncing...';
  const openCommandCenter = useCallback(() => window.dispatchEvent(new Event('motrack:open-command-center')), []);

  // ── LOADING SKELETON ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3 pb-36">
        <Skeleton className="h-[200px] rounded-[1.75rem]" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-[1.5rem]" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-[1.75rem]" />
        <Skeleton className="h-44 rounded-[1.75rem]" />
        <Skeleton className="h-32 rounded-[1.75rem]" />
        <Skeleton className="h-40 rounded-[1.75rem]" />
      </div>
    );
  }

  // ── STAT CARDS DATA ───────────────────────────────────────────────────────
  const statCards = [
    {
      title: 'Habits',
      subtitle: 'Completed',
      value: `${stats.habitsCompleted}/${stats.totalHabits}`,
      trend: `${habitsDelta >= 0 ? 'Up' : 'Down'} ${Math.abs(habitsDelta)} vs yesterday`,
      progress: stats.totalHabits ? Math.round((stats.habitsCompleted / stats.totalHabits) * 100) : 0,
      icon: CheckCircle2,
      color: '#10b981',
      glowColor: 'rgba(16,185,129,0.25)',
    },
    {
      title: 'Focus',
      subtitle: 'Minutes',
      value: `${stats.focusMinutes}m`,
      trend: remainingFocusMinutes > 0
        ? `${focusDelta >= 0 ? 'Up' : 'Down'} ${Math.abs(focusDelta)} min vs yesterday`
        : 'Daily goal reached',
      progress: stats.dailyGoal ? Math.min(Math.round((stats.focusMinutes / stats.dailyGoal) * 100), 100) : 0,
      icon: Clock,
      color: '#3b82f6',
      glowColor: 'rgba(59,130,246,0.25)',
    },
    {
      title: 'Active',
      subtitle: 'Projects',
      value: `${stats.activeProjects}`,
      trend: stats.activeProjects > 0 ? `${stats.projectProgress}% avg progress` : 'No active projects',
      progress: stats.projectProgress,
      icon: Briefcase,
      color: '#f59e0b',
      glowColor: 'rgba(245,158,11,0.25)',
    },
    {
      title: 'Tasks',
      subtitle: 'Completed',
      value: `${stats.completedProjectTasks}/${stats.totalProjectTasks}`,
      trend: `${taskDelta >= 0 ? 'Up' : 'Down'} ${Math.abs(taskDelta)} vs yesterday`,
      progress: stats.totalProjectTasks ? Math.round((stats.completedProjectTasks / stats.totalProjectTasks) * 100) : 0,
      icon: Target,
      color: '#8b5cf6',
      glowColor: 'rgba(139,92,246,0.25)',
    },
  ];

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-36">

      {/* 1. Hero */}
      <DashboardHero
        greeting={heroCopy.greeting}
        firstName={firstName}
        subtitle={heroCopy.subtitle}
        stats={stats}
        syncLabel={syncLabel}
        syncStatus={syncStatus}
        lastSyncedAt={lastSyncedAt}
        onQuickAdd={openCommandCenter}
        notificationsOpen={notificationsOpen}
        setNotificationsOpen={setNotificationsOpen}
        formatActivityTime={formatActivityTime}
        trend={trend}
        navigate={navigate}
      />

      {/* Onboarding checklist — only when user has no data */}
      {hasNoData && (
        <Suspense fallback={<Skeleton className="h-40 rounded-[1.75rem]" />}>
          <DashboardChecklist stats={stats} navigate={navigate} />
        </Suspense>
      )}

      {/* 2. Stat cards — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((card) => (
          <CinematicCard
            key={card.title}
            title={card.title}
            subtitle={card.subtitle}
            value={card.value}
            trend={card.trend}
            progress={card.progress}
            icon={card.icon}
            color={card.color}
            glowColor={card.glowColor}
          />
        ))}
      </div>

      {/* 3. Today's Mission */}
      <TodayMission
        incompleteHabits={incompleteHabits}
        totalHabits={stats.totalHabits}
        habitsCompleted={stats.habitsCompleted}
        remainingFocusMinutes={remainingFocusMinutes}
        activeProjects={stats.activeProjects}
        navigate={navigate}
      />

      {/* 4. Productivity Pulse */}
      <ProductivityPulse data={pulseChartData} />

      {/* 5. Smart Suggestion */}
      <SmartSuggestion
        remainingFocusMinutes={remainingFocusMinutes}
        totalHabits={stats.totalHabits}
        navigate={navigate}
      />

      {/* 6. Recent Activity */}
      <RecentActivity
        items={stats.recentActivity}
        formatTime={formatActivityTime}
        navigate={navigate}
      />

    </div>
  );
});
