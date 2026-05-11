import { useEffect, useState } from 'react';
import { Card, Badge, Skeleton } from '../../components/ui/Layout';
import { 
  TrendingUp, 
  Target, 
  Calendar,
  Zap,
  Activity,
  Award,
  Loader2,
  Clock,
  PieChart as PieIcon,
  BarChart3,
  Flame,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../../lib/utils';
import { Database } from '../../types/database';

type FocusSession = Database['public']['Tables']['focus_sessions']['Row'];
type Habit = Database['public']['Tables']['habits']['Row'];

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    productivityScore: 0,
    totalFocusHours: 0,
    completionRate: 0,
    bestStreak: 0,
    bestDay: 'N/A',
    projectProgress: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user) return;
      setLoading(true);

      try {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        // 1. Fetch Focus Sessions
        const { data: sessions } = await supabase
            .from('focus_sessions')
            .select('*')
            .eq('user_id', user.id);

        // 2. Fetch Habits
        const { data: habits } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', user.id);

        // 3. Fetch Projects
        const { data: projects } = await supabase
            .from('projects')
            .select('progress')
            .eq('user_id', user.id);

        const focusSessions = (sessions || []) as FocusSession[];
        const userHabits = (habits || []) as Habit[];
        const userProjects = (projects || []) as { progress: number | null }[];

        // Process Graph Data (Last 7 Days)
        const dailyData = last7Days.map(date => {
            const daySessions = focusSessions.filter(s => s.started_at?.startsWith(date)) || [];
            const dayMinutes = daySessions.reduce((acc, s) => acc + (s.completed_minutes || 0), 0);
            
            const dayHabits = userHabits.filter(h => h.completed_dates?.includes(date)) || [];
            
            return {
                day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                focus: dayMinutes,
                habits: dayHabits.length * 10, // Weight for graph
                score: Math.min(Math.round((dayMinutes / 120) * 50 + (dayHabits.length / Math.max(userHabits.length || 1, 1)) * 50), 100)
            };
        });
        setChartData(dailyData);

        // Process Distribution Data
        const categories = userHabits.reduce((acc: any, h) => {
            const cat = h.category || 'Other';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {});
        
        const dist = Object.entries(categories || {}).map(([name, value]) => ({ name, value }));
        setDistributionData(dist);

        // Summary Stats
        const totalMinutes = focusSessions.reduce((acc, s) => acc + (s.completed_minutes || 0), 0) || 0;
        const maxStreak = Math.max(...(userHabits.map(h => h.best_streak || 0) || [0]));
        const avgProjectProgress = userProjects.length > 0 
            ? Math.round(userProjects.reduce((acc, p) => acc + (p.progress || 0), 0) / userProjects.length)
            : 0;
        
        // Best Day calc
        const dayCounts = focusSessions.reduce((acc: any, s) => {
            const day = new Date(s.started_at).toLocaleDateString();
            acc[day] = (acc[day] || 0) + (s.completed_minutes || 0);
            return acc;
        }, {});
        const bestDayDate = dayCounts ? Object.entries(dayCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] : 'N/A';

        setStats({
            productivityScore: Math.round(dailyData.reduce((acc, d) => acc + (d.score || 0), 0) / 7),
            totalFocusHours: Math.round(totalMinutes / 60),
            completionRate: Math.round(((userHabits.length || 0) > 0 ? (userHabits.reduce((acc, h) => acc + (h.streak > 0 ? 1 : 0), 0) / userHabits.length) : 0) * 100),
            bestStreak: maxStreak,
            bestDay: bestDayDate || 'N/A',
            projectProgress: avgProjectProgress
        });

      } catch (err) {
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-[450px] rounded-3xl" />
            <Skeleton className="h-[450px] rounded-3xl" />
          </div>
        </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header>
        <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 bg-accent rounded-full" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Telemetry Analysis Protocol 0.8</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
          Performance <span className="text-accent underline decoration-4 underline-offset-8 decoration-accent/20">Matrix</span>
        </h1>
        <p className="text-zinc-500 mt-4 font-medium tracking-tight max-w-xl">Decrypt your operational patterns and neural focus cycles through cryptographic data visualization.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsSummaryCard 
          icon={Activity} 
          label="Productivity Grade" 
          value={`${stats.productivityScore}%`} 
          trend="Algorithmic Score"
          color="text-accent"
        />
        <MetricsSummaryCard 
          icon={Clock} 
          label="Deep Focus Load" 
          value={`${stats.totalFocusHours}h`} 
          trend="Total Sync Time"
          color="text-blue-400"
        />
        <MetricsSummaryCard 
          icon={TrendingUp} 
          label="Sequence Streak" 
          value={`${stats.bestStreak}d`} 
          trend="Max Continuity"
          color="text-emerald-400"
        />
        <MetricsSummaryCard 
          icon={Zap} 
          label="Sync Reliability" 
          value={`${stats.completionRate}%`} 
          trend="Daily Success Rate"
          color="text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Momentum Chart */}
        <Card className="lg:col-span-8 p-10 relative overflow-hidden group bg-[#0a0a0a] border-white/5">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
            
            <div className="flex items-center justify-between mb-12 relative z-10">
                <div>
                    <h3 className="text-lg font-display font-bold text-white uppercase tracking-widest leading-none">Momentum Oscillation</h3>
                    <p className="text-[11px] font-bold uppercase text-zinc-600 mt-3 tracking-[0.2em] opacity-40">Operational Flow Over 7 Solar Cycles</p>
                </div>
            </div>

            <div className="h-[340px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="analytGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff03" />
                        <XAxis 
                            dataKey="day" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#3f3f46', fontSize: 10, fontWeight: 700 }} 
                            dy={12}
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#050505', 
                                border: '1px solid #ffffff10', 
                                borderRadius: '16px',
                                fontSize: '11px',
                                fontWeight: 600,
                                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                            }}
                            cursor={{ stroke: 'var(--color-accent)', strokeWidth: 1 }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="var(--color-accent)" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#analytGradient)" 
                            animationDuration={2000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            
            <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-3 gap-8 relative z-10">
                <MiniMeta label="Peak Performance" value={stats.bestDay} />
                <MiniMeta label="Project Build" value={`${stats.projectProgress}%`} />
                <MiniMeta label="Matrix Status" value="SYNCED" accent="text-accent" />
            </div>
        </Card>

        {/* Distribution Card */}
        <Card className="lg:col-span-4 p-8 flex flex-col bg-[#0a0a0a] border-white/5 h-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-[.3em] mb-10 text-center relative z-10">Sector distribution</h3>
            
            <div className="h-[250px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={distributionData.length > 0 ? distributionData : [{ name: 'None', value: 1 }]}
                            innerRadius={75}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {distributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                            ))}
                            {distributionData.length === 0 && <Cell fill="#09090b" />}
                        </Pie>
                        <Tooltip 
                             contentStyle={{ 
                                backgroundColor: '#050505', 
                                border: '1px solid #ffffff10', 
                                borderRadius: '16px',
                                fontSize: '11px',
                                fontWeight: 600
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <PieIcon className="w-8 h-8 text-white/5 mx-auto mb-2" />
                    <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest whitespace-nowrap">Core Load</p>
                </div>
            </div>

            <div className="mt-10 space-y-4 flex-1 relative z-10">
                {distributionData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest group-hover:text-white transition-colors">{item.name}</span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-zinc-400">{item.value} Node{item.value !== 1 ? 's' : ''}</span>
                    </div>
                ))}
            </div>
            
            <button className="mt-10 w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-white/5 text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-all shadow-xl hover:shadow-accent/5 relative z-10 group">
                Full System Audit <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
        </Card>
      </div>

      {/* Habits Output Bar Chart */}
      <Card className="p-10 bg-[#0a0a0a] border-white/5">
        <div className="flex items-center justify-between mb-12">
            <div>
                 <h3 className="text-lg font-display font-bold text-white uppercase tracking-widest leading-none">Output Frequency</h3>
                 <p className="text-[11px] font-bold uppercase text-zinc-600 mt-3 tracking-[0.2em] opacity-40">System Habit Completion Density</p>
            </div>
            <BarChart3 className="w-6 h-6 text-zinc-800" />
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff02" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#3f3f46', fontSize: 10, fontWeight: 700 }} />
              <YAxis hide />
              <Tooltip 
                 cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                 contentStyle={{ backgroundColor: '#050505', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '11px', fontWeight: 600 }}
              />
              <Bar dataKey="habits" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function MetricsSummaryCard({ icon: Icon, label, value, trend, color }: any) {
  return (
    <Card className="hover:border-accent/40 bg-zinc-900/50 border-white/5 transition-all duration-500 relative overflow-hidden group p-8">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
      <div className="flex flex-col gap-6 relative z-10">
        <div className={cn("inline-flex p-3 rounded-2xl bg-zinc-800/80 border border-white/5 w-fit group-hover:scale-110 group-hover:bg-accent/10 transition-all", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em]">{label}</p>
          <h4 className="text-4xl font-mono font-bold text-white mt-1 tracking-tighter">{value}</h4>
          <div className="flex items-center gap-2 mt-4">
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", color.replace('text-', 'bg-'))} />
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{trend}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function MiniMeta({ label, value, accent }: any) {
    return (
        <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">{label}</p>
            <p className={cn("text-base font-display font-bold tracking-tight text-white", accent)}>{value}</p>
        </div>
    );
}
