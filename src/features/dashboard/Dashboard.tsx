import { useEffect, useState } from 'react';
import { Card, Badge, Button, Skeleton } from '../../components/ui/Layout';
import { 
  CheckCircle2, 
  Timer, 
  Briefcase, 
  TrendingUp, 
  ArrowUpRight,
  Plus,
  Clock,
  Calendar,
  Zap,
  Target,
  FileText,
  Star,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../../lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const chartData = [
  { name: 'Mon', score: 45 },
  { name: 'Tue', score: 52 },
  { name: 'Wed', score: 48 },
  { name: 'Thu', score: 70 },
  { name: 'Fri', score: 61 },
  { name: 'Sat', score: 85 },
  { name: 'Sun', score: 92 },
];

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    momentum: 0,
    habitsCompleted: 0,
    focusMinutes: 0,
    tasksCompleted: 0,
    activeProjects: 0,
    dailyGoal: 120, // Default 2 hours
  });

  const [missions, setMissions] = useState([
    { id: 'habits', title: 'Complete habits', category: 'Identity', icon: Target, done: false, sub: '0/0 tasks remaining' },
    { id: 'focus', title: 'Daily focus goal', category: 'Deep Work', icon: Timer, done: false, sub: '45m target' },
    { id: 'projects', title: 'Project progression', category: 'Missions', icon: Briefcase, done: false, sub: 'No active tasks' },
  ]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      setLoading(true);

      try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Fetch Habits
        const { data: habitsData } = await (supabase.from('habits') as any)
          .select('*')
          .eq('user_id', user.id);
        
        const habits = (habitsData || []) as any[];
        const habitsCompletedToday = habits.filter(h => 
          h.completed_dates?.includes(today)
        ).length || 0;
        const totalHabits = habits.length;

        // 2. Fetch Projects and incomplete tasks
        const { data: projects } = await (supabase.from('projects') as any)
          .select('*, project_tasks(*)')
          .eq('user_id', user.id)
          .eq('status', 'active');
        
        const activeProjects = (projects || []) as any[];
        const incompleteTasks = activeProjects.reduce((acc, p) => 
          acc + (p.project_tasks?.filter((t: any) => !t.is_done).length || 0), 0
        );

        // 3. Fetch Focus Sessions and Settings
        const [{ data: sessionsData }, { data: settings }] = await Promise.all([
          (supabase.from('focus_sessions') as any)
            .select('completed_minutes')
            .eq('user_id', user.id)
            .gte('started_at', today),
          (supabase.from('settings') as any)
            .select('daily_goal_minutes')
            .eq('user_id', user.id)
            .single()
        ]);
        
        const focusMinutesToday = (sessionsData || []).reduce((acc: number, s: any) => acc + (s.completed_minutes || 0), 0) || 0;
        const dailyFocusGoal = (settings as any)?.daily_goal_minutes || 45;

        // Calculate Momentum Score
        const habitsPart = totalHabits > 0 ? (habitsCompletedToday / totalHabits) * 40 : 0;
        const focusPart = Math.min((focusMinutesToday / dailyFocusGoal) * 30, 30);
        const tasksPart = Math.min(activeProjects.length > 0 ? ((activeProjects.length - Math.min(incompleteTasks, activeProjects.length)) / activeProjects.length) * 30 : 0, 30);
        
        const totalMomentum = Math.round(habitsPart + focusPart + tasksPart);

        setStats({
          momentum: totalMomentum,
          habitsCompleted: habitsCompletedToday,
          focusMinutes: focusMinutesToday,
          tasksCompleted: incompleteTasks, // Reusing this for "tasks remaining"
          activeProjects: activeProjects.length,
          dailyGoal: dailyFocusGoal
        });

        // Update missions state based on real data
        setMissions([
          { 
            id: 'habits', 
            title: totalHabits > 0 ? `${totalHabits - habitsCompletedToday} Habits Remaining` : 'Initialize Daily Orbit', 
            category: 'Identity', 
            icon: Target, 
            done: totalHabits > 0 && habitsCompletedToday === totalHabits,
            sub: totalHabits > 0 ? `${habitsCompletedToday}/${totalHabits} Synced` : 'No habits defined'
          },
          { 
            id: 'focus', 
            title: `${dailyFocusGoal}m Focus Quest`, 
            category: 'Deep Work', 
            icon: Timer, 
            done: focusMinutesToday >= dailyFocusGoal,
            sub: `${focusMinutesToday}m Recorded today`
          },
          { 
            id: 'projects', 
            title: incompleteTasks > 0 ? `${incompleteTasks} Tasks Awaiting` : 'Architect New Path', 
            category: 'Missions', 
            icon: Briefcase, 
            done: activeProjects.length > 0 && incompleteTasks === 0,
            sub: activeProjects.length > 0 ? `${activeProjects.length} Active Missions` : 'System idle'
          },
        ]);

      } catch (err) {
        console.error('Dashboard data error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  const handleMissionClick = (id: string) => {
    switch (id) {
      case 'habits':
        navigate('/habits');
        break;
      case 'focus':
        navigate('/focus');
        break;
      case 'projects':
        navigate('/projects');
        break;
    }
  };

  if (loading) {
    return (
      <div className="space-y-12 animate-in fade-in duration-700">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-12 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg font-medium" />
        </div>
        
        {/* Momentum Hero Skeleton */}
        <Skeleton className="h-[340px] rounded-[3rem]" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <Skeleton className="h-[400px] rounded-[2.5rem]" />
             <div className="grid grid-cols-3 gap-6">
                <Skeleton className="h-44 rounded-[2rem]" />
                <Skeleton className="h-44 rounded-[2rem]" />
                <Skeleton className="h-44 rounded-[2rem]" />
             </div>
          </div>
          <Skeleton className="h-[600px] rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-6 bg-accent rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">System Core v2.0.4 // Online</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
            MoTrack <span className="text-accent underline decoration-4 underline-offset-8 decoration-accent/20">Explorer</span>
          </h1>
          <p className="text-zinc-500 mt-4 font-medium tracking-tight max-w-xl">Your high-fidelity productivity workspace is synchronized and active.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/settings')} size="icon">
            <Calendar className="w-4 h-4 text-zinc-400" />
          </Button>
          <Button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}>
            <Zap className="w-4 h-4 mr-2" />
            Control Center
          </Button>
        </div>
      </header>

      {/* Momentum Hero */}
      <Card variant="premium" className="relative p-10 flex flex-col justify-center border-white/5 overflow-hidden group bg-[#0a0a0a]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-70 transition-opacity duration-1000" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-12 relative z-10">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-accent/10">
                <Zap className="w-5 h-5 text-accent animate-pulse" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Momentum Engine Active</span>
            </div>
            
            <div className="flex items-baseline gap-4 mb-4">
                <h2 className="text-7xl font-mono font-bold text-white tracking-tighter">
                  {stats.momentum}<span className="text-4xl ml-1 text-zinc-400">%</span>
                </h2>
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">+12% From Yesterday</span>
                </div>
            </div>

            <div className="w-full h-3 bg-zinc-900 rounded-full mt-6 overflow-hidden p-0.5 border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.momentum}%` }}
                className="h-full rounded-full momentum-gradient shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-6 mt-10 p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                <div>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Habits (40%)</p>
                    <p className="text-sm font-mono font-bold text-white">{stats.habitsCompleted} Done</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Focus (30%)</p>
                    <p className="text-sm font-mono font-bold text-white">{stats.focusMinutes}m Today</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Projects (30%)</p>
                    <p className="text-sm font-mono font-bold text-white">{stats.activeProjects} Active</p>
                </div>
            </div>
          </div>
          
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatSmall 
              icon={Target} 
              label="Habit Load" 
              value={`${stats.habitsCompleted}`} 
              sub="Routines Synced" 
              accent="text-emerald-400"
            />
            <StatSmall 
              icon={Timer} 
              label="Deep Space" 
              value={`${stats.focusMinutes}m`} 
              sub="Focus Minutes" 
              accent="text-blue-400"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Charts Card */}
          <Card className="p-8 bg-[#0a0a0a] border-white/5">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-lg font-display font-bold text-white tracking-tight leading-none uppercase tracking-widest">Neural Flow Analytics</h3>
                <p className="text-zinc-500 text-[11px] font-bold uppercase mt-2 tracking-[0.2em] opacity-40">System Momentum over 168 hours</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-white/5 border border-white/5">Weekly Report</Button>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="momentumGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff03" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#52525b', fontSize: 10, fontWeight: 700 }} 
                    dy={12}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#050505', 
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      fontSize: '11px',
                      fontWeight: 600,
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                    }}
                    cursor={{ stroke: '#8b5cf6', strokeWidth: 1 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#momentumGradient)" 
                    animationDuration={2500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Today's Mission Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pl-1">
              <h3 className="text-[11px] font-bold uppercase tracking-[.3em] text-zinc-500">Mission Operational Status</h3>
              <Star className="w-4 h-4 text-accent/50" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {missions.map((mission) => (
                <motion.button
                  key={mission.id} 
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMissionClick(mission.id)}
                  className={cn(
                    "flex flex-col text-left p-6 rounded-[2rem] border transition-all duration-500 relative overflow-hidden group h-full",
                    mission.done 
                      ? "border-emerald-500/20 bg-emerald-500/5 opacity-60" 
                      : "border-white/5 bg-[#0a0a0a] hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/5"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-inner transition-transform group-hover:scale-110",
                    mission.done ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-900 border border-white/5 text-zinc-400 group-hover:text-accent"
                  )}>
                    <mission.icon className="w-6 h-6" />
                  </div>
                  <h4 className={cn("text-[15px] font-bold tracking-tight mb-2", mission.done ? "text-emerald-400/80 line-through" : "text-white")}>
                    {mission.title}
                  </h4>
                  <div className="mt-auto">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-1">{mission.category}</p>
                    <div className="flex items-center gap-2">
                         <div className={cn("w-1 h-1 rounded-full", mission.done ? "bg-emerald-500" : "bg-zinc-800")} />
                         <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-tight">{mission.sub}</p>
                    </div>
                  </div>

                  {!mission.done && (
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <ArrowUpRight className="w-4 h-4 text-accent" />
                      </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Side Column: Action Center */}
        <div className="space-y-8">
          <Card className="p-6 h-full relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
            
            <h3 className="text-sm font-black uppercase tracking-[.3em] text-zinc-500 mb-6">Action Hub</h3>
            
            <div className="space-y-3 relative z-10">
              <QuickAction 
                icon={CheckCircle2} 
                label="Launch Habits" 
                desc="Daily synchronization"
                color="text-emerald-400"
                onClick={() => navigate('/habits')}
              />
              <QuickAction 
                icon={Timer} 
                label="Start Focus" 
                desc="Activate deep work"
                color="text-blue-400"
                onClick={() => navigate('/focus')}
              />
              <QuickAction 
                icon={FileText} 
                label="Quick Capture" 
                desc="Record a brain dump"
                color="text-amber-400"
                onClick={() => navigate('/notes')}
              />
              <QuickAction 
                icon={Briefcase} 
                label="Project OPS" 
                desc="Manage your missions"
                color="text-purple-400"
                onClick={() => navigate('/projects')}
              />
            </div>

            <div className="mt-10 pt-8 border-t border-white/5 relative z-10">
                <HeaderSmall text="Live Feed" />
                <div className="space-y-5 mt-4">
                  <FeedItem 
                    icon={Zap} 
                    title="Productivity Boost" 
                    time="10m ago" 
                    desc="You earned +12 momentum points" 
                  />
                  <FeedItem 
                    icon={Target} 
                    title="Objective Complete" 
                    time="2h ago" 
                    desc="Mission 'Morning Habits' synced" 
                  />
                  <FeedItem 
                    icon={Star} 
                    title="Weekly Progress" 
                    time="Today" 
                    desc="You are in the top 5% of users" 
                  />
                </div>
            </div>
            
            <button 
              onClick={() => navigate('/analytics')}
              className="mt-8 w-full flex items-center justify-center gap-2 p-3 rounded-xl glass border-white/5 text-zinc-500 hover:text-white hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              System Analytics <ChevronRight className="w-3 h-3" />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatSmall({ icon: Icon, label, value, sub, accent }: any) {
  return (
    <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 hover:border-accent/20 transition-all group backdrop-blur-sm">
      <div className={cn("inline-flex p-2.5 rounded-2xl bg-zinc-800/50 mb-6 transition-all group-hover:scale-110", accent)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-mono font-bold text-white tracking-tighter">{value}</span>
        <span className="text-[11px] font-medium text-zinc-600 tracking-tight">{sub}</span>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, desc, color, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-5 p-5 rounded-3xl bg-zinc-900/50 border border-white/5 hover:bg-accent/[0.03] hover:border-accent/30 transition-all group text-left backdrop-blur-sm"
    >
      <div className={cn("w-12 h-12 rounded-2xl bg-zinc-800/50 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-accent/10 border border-white/5 shadow-inner", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-[15px] font-semibold text-white tracking-tight">{label}</h4>
        <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-[0.1em] mt-1">{desc}</p>
      </div>
    </button>
  );
}

function FeedItem({ icon: Icon, title, time, desc }: any) {
  return (
    <div className="flex gap-4 group">
       <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
          <Icon className="w-4 h-4 text-zinc-500" />
       </div>
       <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-white uppercase tracking-tight">{title}</span>
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{time}</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-medium italic line-clamp-1">{desc}</p>
       </div>
    </div>
  );
}

function HeaderSmall({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px bg-white/5 flex-1" />
      <span className="text-[9px] font-black uppercase tracking-[.4em] text-zinc-700">{text}</span>
      <div className="h-px bg-white/5 flex-1" />
    </div>
  );
}
