import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Badge, Toast, TextArea, Skeleton } from '../../components/ui/Layout';
import { 
  Plus, 
  CheckCircle2, 
  Trash2, 
  Edit2, 
  Search,
  Check,
  Loader2,
  TrendingUp,
  Target,
  Zap,
  Coffee,
  Book,
  Moon,
  Sun,
  Flame,
  Award,
  Filter,
  MoreVertical,
  Sparkles,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { Database } from '../../types/database';
import { cn } from '../../lib/utils';

type Habit = Database['public']['Tables']['habits']['Row'];

const CATEGORIES = ['All', 'Health', 'Work', 'Mind', 'Personal', 'Other'];
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const ICONS = [
  { name: 'target', icon: Target },
  { name: 'zap', icon: Zap },
  { name: 'coffee', icon: Coffee },
  { name: 'book', icon: Book },
  { name: 'moon', icon: Moon },
  { name: 'sun', icon: Sun },
  { name: 'flame', icon: Flame },
];

export function Habits() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [pendingDeleteHabit, setPendingDeleteHabit] = useState<Habit | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newHabit, setNewHabit] = useState({ 
    title: '', 
    description: '',
    category: 'Health', 
    color: '#8b5cf6', 
    icon: 'target' 
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as any });
  const habitTitle = newHabit.title.trim();

  const fetchHabits = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setHabits(data);
    } catch (error: any) {
      console.error('Fetch habits error:', error);
      showToast('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
    if (searchParams.get('add') === 'true') {
      setIsAdding(true);
    }
  }, [user, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      showToast('Please log in first', 'error');
      return;
    }
    if (!habitTitle) return;

    setSubmitting(true);
    try {
      if (editingHabit) {
        const { data, error } = await (supabase.from('habits') as any)
          .update({
            title: habitTitle,
            description: newHabit.description,
            category: newHabit.category,
            color: newHabit.color,
            icon: newHabit.icon,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingHabit.id)
          .eq('user_id', authUser.id) // Security: ensure user owns the record
          .select()
          .single();

        if (error) throw error;
        
        setHabits(prev => prev.map(h => h.id === editingHabit.id ? data : h));
        showToast('Habit updated');
        closeModal();
      } else {
        const { data, error } = await (supabase.from('habits') as any).insert({
          user_id: authUser.id,
          title: habitTitle,
          description: newHabit.description,
          category: newHabit.category,
          color: newHabit.color,
          icon: newHabit.icon,
          frequency: 'daily',
          streak: 0,
          best_streak: 0,
          completed_dates: [],
          is_active: true
        })
        .select()
        .single();

        if (error) throw error;

        setHabits(prev => [data, ...prev]);
        showToast('Habit created');
        closeModal();
      }
    } catch (error: any) {
      console.error('Save habit error:', error);
      showToast('Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleComplete = async (habit: Habit) => {
    if (!user) {
      showToast('Please log in first', 'error');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const isCompleted = habit.completed_dates?.includes(today);

    let newCompletedDates = [...(habit.completed_dates || [])];
    if (isCompleted) {
      newCompletedDates = newCompletedDates.filter(d => d !== today);
    } else {
      newCompletedDates.push(today);
    }

    const newStreak = calculateStreak(newCompletedDates);
    const newBestStreak = Math.max(newStreak, habit.best_streak);
    const optimisticHabit = {
      ...habit,
      completed_dates: newCompletedDates,
      streak: newStreak,
      best_streak: newBestStreak,
      updated_at: new Date().toISOString(),
    } as Habit;

    setHabits(prev => prev.map(h => h.id === habit.id ? optimisticHabit : h));

    try {
      const { data, error } = await (supabase.from('habits') as any)
        .update({
          completed_dates: newCompletedDates,
          streak: newStreak,
          best_streak: newBestStreak,
          updated_at: new Date().toISOString()
        })
        .eq('id', habit.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setHabits(prev => prev.map(h => h.id === habit.id ? data : h));
        if (!isCompleted) showToast('Habit completed');
      }
    } catch (error: any) {
      setHabits(prev => prev.map(h => h.id === habit.id ? habit : h));
      console.error('Toggle habit error:', error);
      showToast('Something went wrong', 'error');
    }
  };

  const calculateStreak = (dates: string[]) => {
    if (!dates.length) return 0;
    const sortedDates = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);

    // If not completed today or yesterday, streak is broken
    const lastDate = new Date(sortedDates[0]);
    lastDate.setHours(0, 0, 0, 0);
    
    const diff = Math.floor((current.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 1) return 0;

    // Count backwards
    let checkDate = lastDate;
    for (let i = 0; i < sortedDates.length; i++) {
        const d = new Date(sortedDates[i]);
        d.setHours(0, 0, 0, 0);
        if (i === 0 || Math.floor((checkDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)) <= 1) {
            streak++;
            checkDate = d;
        } else {
            break;
        }
    }
    return streak;
  };

  const handleDelete = async (id: string) => {
    if (!user || deletingHabitId) return;

    setDeletingHabitId(id);
    try {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
      setHabits(prev => prev.filter(h => h.id !== id));
      setPendingDeleteHabit(null);
      showToast('Habit deleted');
    } catch (error: any) {
      console.error('Delete habit error:', error);
      showToast('Something went wrong', 'error');
    } finally {
      setDeletingHabitId(null);
    }
  };

  const showToast = (message: string, type: any = 'success') => {
    setToast({ show: true, message, type });
  };

  const closeModal = () => {
    setIsAdding(false);
    setEditingHabit(null);
    setNewHabit({ title: '', description: '', category: 'Health', color: '#8b5cf6', icon: 'target' });
  };

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setNewHabit({
      title: habit.title,
      description: habit.description || '',
      category: habit.category || 'Health',
      color: habit.color || '#8b5cf6',
      icon: habit.icon || 'target'
    });
    setIsAdding(true);
  };

  const filteredHabits = habits.filter(h => {
    const matchesSearch = h.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || h.category === filter;
    return matchesSearch && matchesFilter;
  });
  const isFilteringExistingHabits = habits.length > 0 && filteredHabits.length === 0;
  const todayKey = new Date().toISOString().split('T')[0];
  const completedToday = habits.filter((habit) => habit.completed_dates?.includes(todayKey)).length;
  const completionRate = habits.length ? Math.round((completedToday / habits.length) * 100) : 0;
  const bestStreak = Math.max(0, ...habits.map((habit) => habit.streak || 0));
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="space-y-5 pb-24">
      <header className="luxury-card rounded-[2rem] p-6">
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-blue-500/18 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold leading-tight text-white">
              Momentum <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Engine</span>
            </h1>
            <p className="mt-2 text-sm font-medium text-zinc-400">Small habits. Massive momentum.</p>
            <div className="mt-6 flex gap-3">
              {weekDays.map((day, index) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - index));
                const done = habits.some((habit) => habit.completed_dates?.includes(date.toISOString().split('T')[0]));

                return (
                  <div key={`${day}-${index}`} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-semibold text-zinc-500">{day}</span>
                    <span className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold',
                      done
                        ? 'border-blue-500/35 bg-blue-500/15 text-blue-300 shadow-[0_0_18px_rgba(59,130,246,0.26)]'
                        : 'border-white/10 bg-white/[0.03] text-zinc-600'
                    )}>
                      {done ? <Check className="h-4 w-4" /> : day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center orb-glow">
            <svg viewBox="0 0 112 112" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.08)" strokeWidth="5" fill="none" />
              <circle cx="56" cy="56" r="48" stroke="url(#habitMomentum)" strokeWidth="5" strokeLinecap="round" fill="none" strokeDasharray="301.6" strokeDashoffset={`${301.6 - (301.6 * completionRate) / 100}`} />
              <defs>
                <linearGradient id="habitMomentum" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-center">
              <p className="font-mono text-3xl font-bold text-white">{completionRate}</p>
              <p className="text-[10px] text-zinc-400">Momentum</p>
            </div>
          </div>
        </div>
      </header>

      <Card className="rounded-[1.7rem] border-violet-500/20 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/18 text-violet-300 shadow-[0_0_24px_rgba(139,92,246,0.22)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-violet-300">AI Insight</p>
            <p className="mt-1 text-base font-bold text-white">You're on a {bestStreak || 7}-day streak.</p>
            <p className="text-sm text-zinc-400">Keep it up, Mohamed.</p>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-white">Habits</h2>
        <Button onClick={() => setIsAdding(true)} size="sm" className="rounded-2xl">
          <Plus className="mr-2 h-4 w-4" />
          Add Habit
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <Input 
            placeholder="Search habits..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 bg-white/5 border-white/5 focus:border-accent/40"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full lg:w-auto scrollbar-hide pb-2 lg:pb-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-display font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border",
                filter === cat 
                  ? "bg-accent/10 border-accent/30 text-accent" 
                  : "bg-white/5 border-white/5 text-zinc-500 hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-3xl" />)}
        </div>
      ) : filteredHabits.length > 0 ? (
        <div className="space-y-3">
          {filteredHabits.map((habit) => (
            <HabitCard 
              key={habit.id} 
              habit={habit} 
              onToggle={() => toggleComplete(habit)}
              onDelete={() => setPendingDeleteHabit(habit)}
              onEdit={() => openEdit(habit)}
            />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center rounded-3xl border-dashed border-white/5 bg-zinc-900/20 py-16 text-center sm:rounded-[3rem] sm:py-24">
          <div className="w-24 h-24 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center mb-10 shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            {isFilteringExistingHabits ? <Search className="w-10 h-10 text-zinc-700 relative z-10" /> : <Flame className="w-10 h-10 text-zinc-700 relative z-10" />}
          </div>
          <h3 className="text-2xl font-display font-bold text-white tracking-tight leading-none">
            {isFilteringExistingHabits ? 'No habits match your search' : 'Create your first habit'}
          </h3>
          <p className="text-zinc-500 max-w-xs mx-auto mt-4 text-[15px] font-medium leading-relaxed">
            {isFilteringExistingHabits
              ? 'Try a different keyword or clear filters to see all habits again.'
              : 'Start with one small routine you can complete today. MoTrack will turn it into streaks, consistency, and momentum.'}
          </p>
          <Button
            onClick={() => {
              if (isFilteringExistingHabits) {
                setSearch('');
                setFilter('All');
              } else {
                setIsAdding(true);
              }
            }}
            variant="outline"
            className="mt-10 h-14 px-10 border-white/10 hover:bg-accent/10 hover:border-accent/40 rounded-2xl transition-all"
          >
            {isFilteringExistingHabits ? <Search className="w-4 h-4 mr-3" /> : <Zap className="w-4 h-4 mr-3" />}
            {isFilteringExistingHabits ? 'Clear filters' : 'Create your first habit'}
          </Button>
        </Card>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="mobile-dialog-panel fixed inset-x-3 top-1/2 z-[61] max-h-[calc(100vh-1.5rem)] w-auto -translate-y-1/2 overflow-y-auto md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2"
            >
              <Card className="relative border-white/10 bg-[#0f0f0f] p-5 shadow-2xl sm:p-8">
                <button onClick={closeModal} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-accent border-accent/20">Habit setup</Badge>
                    <h3 className="text-2xl font-display font-bold text-white tracking-tight">
                      {editingHabit ? 'Edit Habit' : 'Create Habit'}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Habit title</label>
                        <Input 
                            value={newHabit.title}
                            onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                            placeholder="e.g. Morning walk" 
                            className="bg-white/5"
                            required
                            autoFocus
                        />
                        <p className="ml-1 text-xs text-zinc-600">Required. Keep it short and easy to complete.</p>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Description (optional)</label>
                        <TextArea 
                            value={newHabit.description}
                            onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                            placeholder="Why is this important?" 
                            className="bg-white/5"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Category</label>
                            <select 
                                value={newHabit.category}
                                onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 appearance-none"
                            >
                                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Icon</label>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {ICONS.map(i => (
                                    <button
                                        key={i.name}
                                        type="button"
                                        onClick={() => setNewHabit({ ...newHabit, icon: i.name })}
                                        className={cn(
                                            "p-2.5 rounded-xl border transition-all",
                                            newHabit.icon === i.name ? "bg-accent/10 border-accent/40 text-accent" : "bg-white/5 border-white/5 text-zinc-500"
                                        )}
                                    >
                                        <i.icon className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Color</label>
                        <div className="flex gap-3">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setNewHabit({ ...newHabit, color: c })}
                                    className={cn(
                                        "w-8 h-8 rounded-full transition-all border-2",
                                        newHabit.color === c ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <Button type="button" variant="ghost" className="flex-1" onClick={closeModal} disabled={submitting}>Cancel</Button>
                    <Button type="submit" className="flex-1" disabled={submitting || !habitTitle}>
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {editingHabit ? 'Saving...' : 'Creating...'}
                          </>
                        ) : (
                          editingHabit ? 'Save Changes' : 'Create Habit'
                        )}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingDeleteHabit && (
          <>
            <motion.button
              type="button"
              aria-label="Cancel habit deletion"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md"
              onClick={() => setPendingDeleteHabit(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              className="mobile-dialog-panel fixed inset-x-4 top-1/2 z-[71] -translate-y-1/2 md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2"
            >
              <Card className="rounded-[1.7rem] border-red-500/20 p-5 shadow-2xl shadow-red-500/10">
                <div className="mb-5 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold text-white">Delete habit?</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      This will permanently remove "{pendingDeleteHabit.title}" from your account.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setPendingDeleteHabit(null)}
                    disabled={deletingHabitId === pendingDeleteHabit.id}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="flex-1"
                    onClick={() => handleDelete(pendingDeleteHabit.id)}
                    disabled={deletingHabitId === pendingDeleteHabit.id}
                  >
                    {deletingHabitId === pendingDeleteHabit.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Toast 
        isVisible={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
}

function HabitCard({ habit, onToggle, onDelete, onEdit }: { habit: Habit; onToggle: () => void; onDelete: () => void; onEdit: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = habit.completed_dates?.includes(today);
  const Icon = ICONS.find(i => i.name === habit.icon)?.icon || Target;
  const weeklyDone = [...Array(7)].filter((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return habit.completed_dates?.includes(date.toISOString().split('T')[0]);
  }).length;
  const completionPercent = Math.round((weeklyDone / 7) * 100);

  return (
    <Card className="group relative min-h-[132px] overflow-visible rounded-[1.7rem] border-white/10 p-4 pr-20 transition-all duration-300 hover:border-accent/30 sm:pr-24">
      <div 
        className="absolute right-0 top-0 h-36 w-36 -translate-y-1/2 translate-x-1/2 rounded-full blur-[80px] opacity-20 transition-opacity group-hover:opacity-40"
        style={{ backgroundColor: habit.color }}
      />

      {menuOpen && (
        <button
          type="button"
          aria-label="Close habit actions"
          className="fixed inset-0 z-20 cursor-default"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="absolute right-4 top-4 z-30">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-label={`Open actions for ${habit.title}`}
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((value) => !value);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/8 bg-white/[0.035] text-zinc-500 transition-all hover:border-white/15 hover:text-white"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-10 w-40 overflow-hidden rounded-2xl border border-white/10 bg-[#080b13]/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-2xl">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit habit
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete habit
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onToggle}
        className={cn(
          'absolute right-4 top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border transition-all active:scale-95',
          isCompletedToday
            ? 'border-emerald-400/30 bg-emerald-500 text-white shadow-[0_0_26px_rgba(16,185,129,0.45)]'
            : 'border-white/12 bg-white/[0.055] text-zinc-400 shadow-[0_0_18px_rgba(139,92,246,0.08)] hover:border-emerald-400/30 hover:text-emerald-300'
        )}
        aria-label={isCompletedToday ? 'Mark incomplete' : 'Complete habit'}
      >
        <CheckCircle2 className="h-6 w-6" />
      </button>
      
      <div className="relative z-10 flex items-center gap-4">
        <div 
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl transition-all group-hover:scale-105"
          style={{ color: habit.color, boxShadow: `0 0 24px ${habit.color}22` }}
        >
          <Icon className="h-7 w-7" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-lg font-bold text-white">{habit.title}</h3>
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
          </div>
          <p className="mt-0.5 text-sm text-zinc-400">{habit.frequency || 'Daily'}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${completionPercent}%`, backgroundColor: habit.color, boxShadow: `0 0 18px ${habit.color}66` }} />
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-4 sm:flex">
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-white">{habit.streak || 0}</p>
            <p className="text-[10px] text-zinc-500">streak</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-white">{completionPercent}%</p>
            <p className="text-[10px] text-zinc-500">week</p>
          </div>
        </div>
      </div>
      <div className="relative z-10 mt-3 flex items-center gap-4 pl-20 sm:hidden">
        <span className="font-mono text-sm font-bold text-white">{habit.streak || 0}<span className="ml-1 font-sans text-[10px] font-medium text-zinc-500">streak</span></span>
        <span className="font-mono text-sm font-bold text-white">{completionPercent}%<span className="ml-1 font-sans text-[10px] font-medium text-zinc-500">week</span></span>
      </div>
    </Card>
  );
}
