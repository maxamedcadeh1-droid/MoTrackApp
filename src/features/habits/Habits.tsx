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
      showToast(error.message, 'error');
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
      showToast('Please login first', 'error');
      return;
    }
    if (!newHabit.title) return;

    setSubmitting(true);
    try {
      if (editingHabit) {
        const { data, error } = await (supabase.from('habits') as any)
          .update({
            title: newHabit.title,
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
        showToast('Habit updated successfully');
        closeModal();
      } else {
        const { data, error } = await (supabase.from('habits') as any).insert({
          user_id: authUser.id,
          title: newHabit.title,
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
        showToast('Habit created successfully');
        closeModal();
      }
    } catch (error: any) {
      console.error('Save habit error:', error);
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleComplete = async (habit: Habit) => {
    if (!user) {
      showToast('Please login first', 'error');
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

    try {
      const { data, error } = await (supabase.from('habits') as any)
        .update({
          completed_dates: newCompletedDates,
          streak: newStreak,
          best_streak: newBestStreak,
          updated_at: new Date().toISOString()
        })
        .eq('id', habit.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setHabits(prev => prev.map(h => h.id === habit.id ? data : h));
        if (!isCompleted) showToast('Boom! Habit secured.');
      }
    } catch (error: any) {
      console.error('Toggle habit error:', error);
      showToast(error.message, 'error');
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
    if (!user) return;
    try {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
      setHabits(prev => prev.filter(h => h.id !== id));
      showToast('Habit deleted', 'error');
    } catch (error: any) {
      console.error('Delete habit error:', error);
      showToast(error.message, 'error');
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

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-6 bg-accent rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Neuro-Routine Synchronization</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
            Identity <span className="text-accent underline decoration-4 underline-offset-8 decoration-accent/20">Design</span>
          </h1>
          <p className="text-zinc-500 mt-4 font-medium tracking-tight max-w-xl">Your current identity is a composite of your daily recurring patterns. Architect them with precision.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="h-14 px-8 shadow-xl shadow-accent/20">
          <Plus className="w-5 h-5 mr-3" />
          DEFINE NEW HABIT
        </Button>
      </header>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-3xl" />)}
        </div>
      ) : filteredHabits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHabits.map((habit) => (
            <HabitCard 
              key={habit.id} 
              habit={habit} 
              onToggle={() => toggleComplete(habit)}
              onDelete={() => handleDelete(habit.id)}
              onEdit={() => openEdit(habit)}
            />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed border-white/5 bg-zinc-900/20 rounded-[3rem]">
          <div className="w-24 h-24 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center mb-10 shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Flame className="w-10 h-10 text-zinc-700 relative z-10" />
          </div>
          <h3 className="text-2xl font-display font-bold text-white tracking-tight leading-none uppercase tracking-widest">No Active Orbits</h3>
          <p className="text-zinc-500 max-w-xs mx-auto mt-4 text-[15px] font-medium leading-relaxed">
            "The secret of your future is hidden in your daily routine." Initialize your first habit to begin the sync.
          </p>
          <Button onClick={() => setIsAdding(true)} variant="outline" className="mt-10 h-14 px-10 border-white/10 hover:bg-accent/10 hover:border-accent/40 rounded-2xl transition-all">
            <Zap className="w-4 h-4 mr-3" />
            Initialize First Habit
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
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 z-[61] w-full max-w-lg"
            >
              <Card className="p-8 border-white/10 bg-[#0f0f0f] shadow-2xl relative">
                <button onClick={closeModal} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-accent border-accent/20">Identity Config</Badge>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                      {editingHabit ? 'Modify Habit' : 'Define New Habit'}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Habit Title</label>
                        <Input 
                            value={newHabit.title}
                            onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                            placeholder="e.g. Morning Meditation" 
                            className="bg-white/5"
                            autoFocus
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Description (Optional)</label>
                        <TextArea 
                            value={newHabit.description}
                            onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                            placeholder="Why is this important?" 
                            className="bg-white/5"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Signature Color</label>
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
                    <Button type="submit" className="flex-1" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {editingHabit ? 'Saving...' : 'Initializing...'}
                          </>
                        ) : (
                          editingHabit ? 'Save Changes' : 'Initialize Habit'
                        )}
                    </Button>
                  </div>
                </form>
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
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = habit.completed_dates?.includes(today);
  const Icon = ICONS.find(i => i.name === habit.icon)?.icon || Target;

  return (
    <Card className="group hover:border-accent/30 bg-[#0a0a0a] border-white/5 transition-all duration-500 relative overflow-hidden rounded-[2.5rem] p-8">
      <div 
        className="absolute top-0 right-0 w-40 h-40 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-20 group-hover:opacity-40 transition-opacity" 
        style={{ backgroundColor: habit.color }}
      />
      
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-105 transition-all bg-zinc-900 border border-white/5"
            style={{ color: habit.color }}
          >
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">{habit.category || 'General'}</p>
            <h3 className="text-xl font-display font-bold text-white tracking-tight mt-1">
                {habit.title}
            </h3>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-2.5 hover:bg-white/5 rounded-2xl text-zinc-600 hover:text-white transition-all">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2.5 hover:bg-red-500/10 rounded-2xl text-zinc-600 hover:text-red-400 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8 mb-8 relative z-10">
          <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-3xl flex items-center gap-4">
              <div className="p-2 w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
              </div>
              <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Streak</p>
                  <p className="text-xl font-mono font-bold text-white leading-none tracking-tighter mt-1">{habit.streak}d</p>
              </div>
          </div>
          <div className="bg-zinc-900/50 border border-white/5 p-5 rounded-3xl flex items-center gap-4">
              <div className="p-2 w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
              </div>
              <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Best</p>
                  <p className="text-xl font-mono font-bold text-white leading-none tracking-tighter mt-1">{habit.best_streak}d</p>
              </div>
          </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
        <div className="flex gap-2">
            {[...Array(7)].map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                const dateStr = date.toISOString().split('T')[0];
                const done = habit.completed_dates?.includes(dateStr);
                return (
                    <div 
                        key={i} 
                        className={cn(
                            "w-3 h-3 rounded shadow-inner transition-all",
                            done ? "bg-accent/60" : "bg-zinc-800"
                        )}
                        style={done ? { backgroundColor: `${habit.color}80` } : {}}
                    />
                );
            })}
        </div>
        <button
          onClick={onToggle}
          className={cn(
            "px-8 h-12 rounded-2xl flex items-center gap-3 transition-all duration-500 text-[11px] font-bold uppercase tracking-widest border shadow-xl relative overflow-hidden group",
            isCompletedToday 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
              : "bg-zinc-900 text-zinc-400 border-white/5 hover:border-accent/40 hover:text-white"
          )}
        >
          {isCompletedToday ? <CheckCircle2 className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          {isCompletedToday ? 'SYNCED' : 'IGNITE'}
          {!isCompletedToday && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          )}
        </button>
      </div>
    </Card>
  );
}
