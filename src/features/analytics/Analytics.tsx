import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Sparkles,
  Timer,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button, Card, Skeleton } from '../../components/ui/Layout';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { useAuth } from '../auth/AuthContext';

type AnalyticsStats = {
  productivityScore: number;
  totalFocusHours: number;
  consistencyRate: number;
  bestStreak: number;
  currentStreak: number;
  bestDay: string;
  projectCompletionRate: number;
  bestFocusHour: string;
};

const initialStats: AnalyticsStats = {
  productivityScore: 0,
  totalFocusHours: 0,
  consistencyRate: 0,
  bestStreak: 0,
  currentStreak: 0,
  bestDay: 'No data',
  projectCompletionRate: 0,
  bestFocusHour: 'No data',
};

function dateKey(date: Date) {
  return date.toISOString().split('T')[0];
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function Analytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AnalyticsStats>(initialStats);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [focusGraph, setFocusGraph] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [hourData, setHourData] = useState<any[]>([]);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user) return;
      setLoading(true);

      try {
        const today = startOfDay(new Date());
        const last7Start = new Date(today);
        last7Start.setDate(today.getDate() - 6);
        const last28Start = new Date(today);
        last28Start.setDate(today.getDate() - 27);

        const [{ data: sessionsData }, { data: habitsData }, { data: projectsData }] = await Promise.all([
          (supabase.from('focus_sessions') as any)
            .select('*')
            .eq('user_id', user.id)
            .gte('started_at', last28Start.toISOString()),
          (supabase.from('habits') as any)
            .select('*')
            .eq('user_id', user.id),
          (supabase.from('projects') as any)
            .select('progress,status')
            .eq('user_id', user.id),
        ]);

        const sessions = sessionsData || [];
        const habits = habitsData || [];
        const projects = projectsData || [];
        const totalHabits = Math.max(habits.filter((habit: any) => habit.is_active !== false).length, 1);

        const week = [...Array(7)].map((_, index) => {
          const day = new Date(last7Start);
          day.setDate(last7Start.getDate() + index);
          const key = dateKey(day);
          const focus = sessions
            .filter((session: any) => session.started_at?.startsWith(key))
            .reduce((sum: number, session: any) => sum + (session.completed_minutes || 0), 0);
          const habitsDone = habits.filter((habit: any) => habit.completed_dates?.includes(key)).length;
          const score = Math.min(100, Math.round((focus / 120) * 55 + (habitsDone / totalHabits) * 45));
          return {
            day: day.toLocaleDateString('en-US', { weekday: 'short' }),
            date: key,
            focus,
            habits: habitsDone,
            score,
          };
        });

        const days28 = [...Array(28)].map((_, index) => {
          const day = new Date(last28Start);
          day.setDate(last28Start.getDate() + index);
          const key = dateKey(day);
          const focus = sessions
            .filter((session: any) => session.started_at?.startsWith(key))
            .reduce((sum: number, session: any) => sum + (session.completed_minutes || 0), 0);
          const habitsDone = habits.filter((habit: any) => habit.completed_dates?.includes(key)).length;
          const intensity = Math.min(4, Math.ceil((focus / 35) + (habitsDone > 0 ? 1 : 0)));
          return {
            date: key,
            label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            focus,
            habits: habitsDone,
            intensity,
            active: focus > 0 || habitsDone > 0,
          };
        });

        const hours = [...Array(24)].map((_, hour) => {
          const minutes = sessions
            .filter((session: any) => new Date(session.started_at).getHours() === hour)
            .reduce((sum: number, session: any) => sum + (session.completed_minutes || 0), 0);
          return {
            hour,
            label: hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`,
            minutes,
          };
        });

        const totalMinutes = sessions.reduce((sum: number, session: any) => sum + (session.completed_minutes || 0), 0);
        const avgProjectProgress = projects.length > 0
          ? Math.round(projects.reduce((sum: number, project: any) => sum + (project.progress || 0), 0) / projects.length)
          : 0;
        const bestDaily = [...week].sort((a, b) => b.score - a.score)[0];
        const bestHour = [...hours].sort((a, b) => b.minutes - a.minutes)[0];
        const activeDays = days28.filter((day) => day.active).length;

        setWeeklyTrend(week);
        setFocusGraph(week.map((day) => ({ day: day.day, minutes: day.focus })));
        setHeatmap(days28);
        setHourData(hours.filter((hour) => hour.minutes > 0 || hour.hour % 3 === 0));
        setStats({
          productivityScore: Math.round(week.reduce((sum, day) => sum + day.score, 0) / week.length),
          totalFocusHours: Math.round((totalMinutes / 60) * 10) / 10,
          consistencyRate: Math.round((activeDays / days28.length) * 100),
          bestStreak: Math.max(0, ...habits.map((habit: any) => habit.best_streak || 0)),
          currentStreak: Math.max(0, ...habits.map((habit: any) => habit.streak || 0)),
          bestDay: bestDaily && bestDaily.score > 0 ? bestDaily.day : 'No data',
          projectCompletionRate: avgProjectProgress,
          bestFocusHour: bestHour && bestHour.minutes > 0 ? bestHour.label : 'No data',
        });
        setHasData(sessions.length > 0 || habits.length > 0 || projects.length > 0);
      } catch (err) {
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [user]);

  const insight = useMemo(() => {
    if (!hasData) return 'Start with a habit, project, or focus session to unlock your first insights.';
    if (stats.productivityScore >= 75) return 'Your week is trending strong. The main opportunity is protecting the same focus window each day.';
    if (stats.consistencyRate >= 50) return 'Your consistency base is forming. One extra focus session on low-activity days will lift the whole trend.';
    return 'Your data suggests a simple next step: anchor one daily habit and one focused work block.';
  }, [hasData, stats.consistencyRate, stats.productivityScore]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-72 rounded-xl" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 rounded-3xl" />)}
        </div>
        <Skeleton className="h-[420px] rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_18px_rgba(139,92,246,0.5)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Productivity overview
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-normal text-white md:text-6xl">
            Performance insights
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-500">{insight}</p>
        </div>
        <Button onClick={() => navigate('/focus?start=true')}>
          <Timer className="mr-2 h-4 w-4" />
          Start focus
        </Button>
      </header>

      {!hasData && (
        <Card className="border-dashed border-white/10 bg-white/[0.025] p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-accent/10 text-accent">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-white">Unlock your analytics</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
                  Add a habit, create a project, or complete a focus session. Your charts will become useful as soon as real activity appears.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate('/habits?add=true')}>Create Habit</Button>
              <Button variant="outline" onClick={() => navigate('/projects?add=true')}>Create Project</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Activity} label="Productivity score" value={`${stats.productivityScore}%`} detail="Weekly blended score" color="text-accent" />
        <MetricCard icon={Clock} label="Focus hours" value={`${stats.totalFocusHours}h`} detail="Last 28 days" color="text-blue-300" />
        <MetricCard icon={CheckCircle2} label="Consistency" value={`${stats.consistencyRate}%`} detail="Active days this month" color="text-emerald-300" />
        <MetricCard icon={Briefcase} label="Projects" value={`${stats.projectCompletionRate}%`} detail="Average completion" color="text-purple-300" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="border-white/10 bg-[#080b13]/72 p-5 sm:p-8 xl:col-span-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-semibold text-white">Productivity trend</h3>
              <p className="mt-1 text-sm text-zinc-500">Weekly blend of focus minutes and habit completion.</p>
            </div>
            <TrendingUp className="h-5 w-5 text-zinc-600" />
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="analyticsTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} dy={12} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--color-accent)' }} />
                <Area type="monotone" dataKey="score" stroke="var(--color-accent)" strokeWidth={3} fill="url(#analyticsTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-white/10 bg-[#080b13]/72 p-5 sm:p-8 xl:col-span-4">
          <div className="mb-8">
            <h3 className="font-display text-xl font-semibold text-white">Consistency heatmap</h3>
            <p className="mt-1 text-sm text-zinc-500">Daily activity across the last 28 days.</p>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {heatmap.map((day) => (
              <div
                key={day.date}
                title={`${day.label}: ${day.focus}m focus, ${day.habits} habits`}
                className={cn(
                  'aspect-square rounded-lg border border-white/5 transition-transform hover:scale-110',
                  day.intensity === 0 && 'bg-white/[0.035]',
                  day.intensity === 1 && 'bg-accent/15',
                  day.intensity === 2 && 'bg-accent/30',
                  day.intensity === 3 && 'bg-accent/55',
                  day.intensity >= 4 && 'bg-accent'
                )}
              />
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <MiniStat icon={Award} label="Best day" value={stats.bestDay} />
            <MiniStat icon={Clock} label="Best hour" value={stats.bestFocusHour} />
            <MiniStat icon={Flame} label="Current streak" value={`${stats.currentStreak}d`} />
            <MiniStat icon={Calendar} label="Best streak" value={`${stats.bestStreak}d`} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Weekly focus graph" description="Completed focus minutes by day." icon={Timer}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={focusGraph}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="minutes" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Focus hour tracking" description="When your focused minutes usually happen." icon={BarChart3}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="minutes" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: '#080b13',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 16,
  color: '#fff',
  boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
};

function MetricCard({ icon: Icon, label, value, detail, color }: { icon: typeof Activity; label: string; value: string; detail: string; color: string }) {
  return (
    <Card className="border-white/10 bg-[#080b13]/72 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5', color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-2 font-mono text-4xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-3 text-sm text-zinc-600">{detail}</p>
    </Card>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <Icon className="mb-3 h-4 w-4 text-accent" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ChartCard({ title, description, icon: Icon, children }: { title: string; description: string; icon: typeof Activity; children: ReactNode }) {
  return (
    <Card className="h-[340px] border-white/10 bg-[#080b13]/72 p-5 sm:h-[360px] sm:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        </div>
        <Icon className="h-5 w-5 text-zinc-600" />
      </div>
      <div className="h-[250px]">{children}</div>
    </Card>
  );
}
