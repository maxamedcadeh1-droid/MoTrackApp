import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowDownRight,
  ArrowUpRight,
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
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button, Card, Skeleton } from '../../components/ui/Layout';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { getMomentumInsight, getTimeBasedGreeting, getTrendIndicator } from '../../lib/insights';
import { useAuth } from '../auth/AuthContext';

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
  bestStreak: number;
  weeklyData: Array<{ day: string; score: number; focus: number; habits: number }>;
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
  bestStreak: 0,
  weeklyData: [],
};

function dateKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      setLoading(true);

      try {
        const today = startOfDay(new Date());
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const firstWeekDay = new Date(today);
        firstWeekDay.setDate(today.getDate() - 6);

        const [{ data: habitsData }, { data: projectsData }, { data: sessionsData }, { data: settings }] = await Promise.all([
          (supabase.from('habits') as any)
            .select('*')
            .eq('user_id', user.id),
          (supabase.from('projects') as any)
            .select('*, project_tasks(*)')
            .eq('user_id', user.id),
          (supabase.from('focus_sessions') as any)
            .select('*')
            .eq('user_id', user.id)
            .gte('started_at', firstWeekDay.toISOString()),
          (supabase.from('settings') as any)
            .select('daily_goal_minutes')
            .eq('user_id', user.id)
            .single(),
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

        const habitsScore = totalHabits > 0 ? Math.round((habitsCompletedToday / totalHabits) * 40) : 0;
        const focusScore = Math.min(Math.round((focusMinutesToday / dailyGoal) * 30), 30);
        const projectsScore = totalProjectTasks > 0
          ? Math.round((completedProjectTasks / totalProjectTasks) * 30)
          : activeProjects.length > 0
            ? 12
            : 0;

        const yesterdayHabitsScore = totalHabits > 0 ? Math.round((habitsCompletedYesterday / totalHabits) * 40) : 0;
        const yesterdayFocusScore = Math.min(Math.round((focusMinutesYesterday / dailyGoal) * 30), 30);
        const previousMomentum = Math.min(100, yesterdayHabitsScore + yesterdayFocusScore + projectsScore);
        const momentum = Math.min(100, habitsScore + focusScore + projectsScore);

        const weeklyData = [...Array(7)].map((_, index) => {
          const day = new Date(firstWeekDay);
          day.setDate(firstWeekDay.getDate() + index);
          const key = dateKey(day);
          const focus = sessions
            .filter((session) => session.started_at?.startsWith(key))
            .reduce((acc, session) => acc + (session.completed_minutes || 0), 0);
          const habitsDone = habits.filter((habit: any) => habit.completed_dates?.includes(key)).length;
          const dayHabitsScore = totalHabits > 0 ? (habitsDone / totalHabits) * 40 : 0;
          const dayFocusScore = Math.min((focus / dailyGoal) * 30, 30);
          return {
            day: day.toLocaleDateString('en-US', { weekday: 'short' }),
            score: Math.round(Math.min(100, dayHabitsScore + dayFocusScore + projectsScore)),
            focus,
            habits: habitsDone,
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
          bestStreak: Math.max(0, ...habits.map((habit: any) => habit.best_streak || 0)),
          weeklyData,
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

  const incompleteHabits = Math.max(stats.totalHabits - stats.habitsCompleted, 0);
  const trend = getTrendIndicator(stats.momentum, stats.previousMomentum);
  const insight = getMomentumInsight({
    momentum: stats.momentum,
    incompleteHabits,
    focusMinutes: stats.focusMinutes,
    dailyGoal: stats.dailyGoal,
    activeProjects: stats.activeProjects,
  });
  const hasNoData = stats.totalHabits === 0 && stats.activeProjects === 0 && stats.focusMinutes === 0;
  const dashboardInsight = hasNoData
    ? 'Start by creating one habit, writing one note, or starting a focus session. Your dashboard will become more useful as you add activity.'
    : incompleteHabits > 0
      ? "You're building momentum. Complete one more habit to improve today's score."
      : stats.focusMinutes < stats.dailyGoal
        ? 'Your habits are in good shape. Add one focus session to lift your productivity score.'
        : 'Strong day. Pick one project task to keep your momentum moving.';
  const remainingFocusMinutes = Math.max(stats.dailyGoal - stats.focusMinutes, 0);
  const remainingProjectTasks = Math.max(stats.totalProjectTasks - stats.completedProjectTasks, 0);
  const topPriorities = [
    {
      icon: CheckCircle2,
      label: 'Habit',
      title: stats.totalHabits === 0 ? 'Create your first habit' : incompleteHabits > 0 ? 'Complete one habit' : 'Habits are done',
      detail: stats.totalHabits === 0
        ? 'Start with one routine you can repeat.'
        : incompleteHabits > 0
          ? `${incompleteHabits} habit${incompleteHabits === 1 ? '' : 's'} left today.`
          : 'You completed every habit for today.',
      action: stats.totalHabits === 0 ? 'Create Habit' : 'Open Habits',
      onClick: () => navigate(stats.totalHabits === 0 ? '/habits?add=true' : '/habits'),
      accent: 'text-emerald-300 bg-emerald-500/10',
    },
    {
      icon: Timer,
      label: 'Focus',
      title: remainingFocusMinutes > 0 ? 'Start a focus session' : 'Focus goal reached',
      detail: remainingFocusMinutes > 0
        ? `${remainingFocusMinutes} minutes left to reach your daily goal.`
        : `${stats.focusMinutes} minutes logged today.`,
      action: remainingFocusMinutes > 0 ? 'Start Focus' : 'Review Focus',
      onClick: () => navigate(remainingFocusMinutes > 0 ? '/focus?start=true' : '/focus'),
      accent: 'text-blue-300 bg-blue-500/10',
    },
    {
      icon: Briefcase,
      label: 'Project',
      title: stats.activeProjects === 0 ? 'Create your first project' : remainingProjectTasks > 0 ? 'Close one project task' : 'Review active projects',
      detail: stats.activeProjects === 0
        ? 'Turn a goal into a visible plan.'
        : remainingProjectTasks > 0
          ? `${remainingProjectTasks} task${remainingProjectTasks === 1 ? '' : 's'} still open.`
          : `${stats.activeProjects} active project${stats.activeProjects === 1 ? '' : 's'} ready for review.`,
      action: stats.activeProjects === 0 ? 'Create Project' : 'Open Projects',
      onClick: () => navigate(stats.activeProjects === 0 ? '/projects?add=true' : '/projects'),
      accent: 'text-purple-300 bg-purple-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-36 rounded-full" />
          <Skeleton className="h-12 w-72 rounded-xl" />
          <Skeleton className="h-4 w-full max-w-xl rounded-lg" />
        </div>
        <Skeleton className="h-[360px] rounded-3xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-52 rounded-3xl" />
          <Skeleton className="h-52 rounded-3xl" />
          <Skeleton className="h-52 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.5)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Productivity overview
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-normal text-white md:text-6xl">
            {getTimeBasedGreeting(firstName)}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-500">
            {insight.message}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate('/analytics')}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button onClick={() => window.dispatchEvent(new Event('motrack:open-command-center'))}>
            <Sparkles className="mr-2 h-4 w-4" />
            Quick search
          </Button>
        </div>
      </header>

      <Card variant="premium" className="overflow-hidden border-white/10 bg-[#080b13]/80 p-0">
        <div className="grid gap-0 lg:grid-cols-12">
          <div className="relative overflow-hidden p-6 sm:p-8 lg:col-span-7 lg:p-10">
            <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-accent/14 blur-3xl" />
            <div className="relative z-10">
              <div className="mb-8 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  <Zap className="h-3.5 w-3.5" />
                  {insight.headline}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-400">
                  {trend.trend === 'up' && <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" />}
                  {trend.trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5 text-amber-300" />}
                  {trend.trend === 'stable' && <TrendingUp className="h-3.5 w-3.5 text-blue-300" />}
                  {trend.trend === 'stable' ? 'Stable vs yesterday' : `${trend.percentage}% ${trend.trend} vs yesterday`}
                </span>
              </div>

              <div className="grid gap-8 md:grid-cols-[220px_1fr] md:items-center">
                <MomentumRing score={stats.momentum} />
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">Momentum score</p>
                    <h2 className="mt-2 font-display text-3xl font-semibold text-white md:text-4xl">
                      You are {stats.momentum}% on track today.
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <BreakdownPill label="Habits" value={stats.habitsScore} max={40} color="bg-emerald-400" />
                    <BreakdownPill label="Focus" value={stats.focusScore} max={30} color="bg-blue-400" />
                    <BreakdownPill label="Projects" value={stats.projectsScore} max={30} color="bg-purple-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/[0.025] p-6 sm:p-8 lg:col-span-5 lg:border-l lg:border-t-0 lg:p-10">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Today</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-white">Today's Mission</h3>
              </div>
              <Calendar className="h-5 w-5 text-zinc-600" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <BriefingMetric icon={Timer} label="Focus time" value={`${stats.focusMinutes}/${stats.dailyGoal}m`} onClick={() => navigate('/focus')} />
              <BriefingMetric icon={CheckCircle2} label="Habits left" value={`${incompleteHabits}`} onClick={() => navigate('/habits')} />
              <BriefingMetric icon={Briefcase} label="Active projects" value={`${stats.activeProjects}`} onClick={() => navigate('/projects')} />
              <BriefingMetric icon={Target} label="Best streak" value={`${stats.bestStreak}d`} onClick={() => navigate('/habits')} />
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Smart insight</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{dashboardInsight}</p>
            </div>
          </div>
        </div>
      </Card>

      {hasNoData && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <OnboardingCard icon={CheckCircle2} title="Create your first habit" cta="Create Habit" onClick={() => navigate('/habits?add=true')} />
          <OnboardingCard icon={Timer} title="Start your first focus session" cta="Start Focus" onClick={() => navigate('/focus?start=true')} />
          <OnboardingCard icon={Briefcase} title="Create your first project" cta="Create Project" onClick={() => navigate('/projects?add=true')} />
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">Top 3 Today</h2>
            <p className="mt-1 text-sm text-zinc-500">The next small actions that move your score forward.</p>
          </div>
          <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-zinc-500">
            {stats.momentum}% today
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {topPriorities.map((priority) => (
            <PriorityCard key={priority.label} {...priority} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="border-white/10 bg-[#080b13]/72 p-5 sm:p-8 lg:col-span-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-xl font-semibold text-white">Weekly momentum</h3>
              <p className="mt-1 text-sm text-zinc-500">Habits and focus sessions translated into a daily score.</p>
            </div>
            <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs text-zinc-400">
              7 day trend
            </span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklyData}>
                <defs>
                  <linearGradient id="momentumGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.36} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} dy={12} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  cursor={{ stroke: 'var(--color-accent)', strokeWidth: 1 }}
                  contentStyle={{
                    backgroundColor: '#080b13',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    color: '#fff',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-accent)"
                  strokeWidth={3}
                  fill="url(#momentumGradient)"
                  animationDuration={1400}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-white/10 bg-[#080b13]/72 p-5 sm:p-8 lg:col-span-4">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-semibold text-white">Quick Actions</h3>
              <p className="mt-1 text-sm text-zinc-500">Small moves with the highest return.</p>
            </div>
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div className="space-y-3">
            <ActionRow icon={CheckCircle2} title="Complete one habit" detail={`${incompleteHabits} remaining today`} onClick={() => navigate('/habits')} />
            <ActionRow icon={Timer} title="Run a focus session" detail={`${Math.max(stats.dailyGoal - stats.focusMinutes, 0)} minutes to goal`} onClick={() => navigate('/focus?start=true')} />
            <ActionRow icon={Briefcase} title="Close one project task" detail={`${stats.completedProjectTasks}/${stats.totalProjectTasks} tasks complete`} onClick={() => navigate('/projects')} />
            <ActionRow icon={FileText} title="Write a note" detail="Keep ideas easy to find" onClick={() => navigate('/notes?add=true')} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function MomentumRing({ score }: { score: number }) {
  return (
    <div className="relative mx-auto h-52 w-52">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="52" pathLength={100} className="fill-none stroke-white/5" strokeWidth="9" />
        <motion.circle
          cx="60"
          cy="60"
          r="52"
          pathLength={100}
          className="fill-none stroke-accent drop-shadow-[0_0_18px_rgba(139,92,246,0.45)]"
          strokeWidth="9"
          strokeLinecap="round"
          initial={{ strokeDasharray: '0 100' }}
          animate={{ strokeDasharray: `${score} 100` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-5xl font-bold leading-none text-white">{score}</span>
        <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Momentum</span>
      </div>
    </div>
  );
}

function BreakdownPill({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-400">{label}</span>
        <span className="font-mono text-xs text-white">{value}/{max}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className={cn('h-full rounded-full', color)} />
      </div>
    </div>
  );
}

function BriefingMetric({ icon: Icon, label, value, onClick }: { icon: typeof Timer; label: string; value: string; onClick?: () => void }) {
  const content = (
    <>
      <Icon className="mb-4 h-5 w-5 text-accent" />
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-white">{value}</p>
    </>
  );

  const className = cn(
    'rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition-all',
    onClick && 'cursor-pointer hover:border-accent/30 hover:bg-accent/[0.04] hover:shadow-[0_0_24px_rgba(139,92,246,0.12)] active:scale-[0.99]'
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}

function OnboardingCard({ icon: Icon, title, cta, onClick }: { icon: typeof Timer; title: string; cta: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -3 }}
      onClick={onClick}
      className="group rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-5 text-left transition-all hover:border-accent/30 hover:bg-accent/[0.035]"
    >
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent">
        {cta}
        <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
      </span>
    </motion.button>
  );
}

function PriorityCard({
  icon: Icon,
  label,
  title,
  detail,
  action,
  accent,
  onClick,
}: {
  icon: typeof Timer;
  label: string;
  title: string;
  detail: string;
  action: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-white/10 bg-[#080b13]/72 p-5 text-left transition-all hover:border-accent/30 hover:bg-accent/[0.035] hover:shadow-[0_0_28px_rgba(139,92,246,0.12)] active:scale-[0.99]"
    >
      <div className="mb-5 flex items-center justify-between">
        <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10', accent)}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {label}
        </span>
      </div>
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 min-h-10 text-sm leading-relaxed text-zinc-500">{detail}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent">
        {action}
        <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
      </span>
    </button>
  );
}

function ActionRow({ icon: Icon, title, detail, onClick }: { icon: typeof Timer; title: string; detail: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left transition-all hover:border-accent/25 hover:bg-accent/[0.035]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-zinc-400 transition-colors group-hover:text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="mt-1 block truncate text-xs text-zinc-500">{detail}</span>
      </span>
      <Clock className="h-4 w-4 text-zinc-700 transition-colors group-hover:text-accent" />
    </button>
  );
}
