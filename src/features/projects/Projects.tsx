import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Badge, Toast, TextArea, Skeleton } from '../../components/ui/Layout';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  ListTodo,
  Loader2,
  Briefcase,
  X,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  List,
  Target,
  Flag,
  Trash2,
  Check,
  Calendar,
  SquarePen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { Database } from '../../types/database';
import { cn } from '../../lib/utils';

type Project = Database['public']['Tables']['projects']['Row'];
type Task = Database['public']['Tables']['project_tasks']['Row'];

const PRIORITIES = ['low', 'medium', 'high'] as const;
const STATUSES = ['backlog', 'active', 'completed', 'on_hold'] as const;

export function Projects() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({ 
    title: '', 
    description: '', 
    status: 'backlog' as any, 
    priority: 'medium' as any,
    deadline: ''
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as any });

  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProjects(data);
    } catch (error: any) {
      console.error('Fetch projects error:', error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    if (searchParams.get('add') === 'true') {
      setIsModalOpen(true);
    }
  }, [user, searchParams]);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      showToast('Please login first', 'error');
      return;
    }
    if (!projectForm.title) return;

    setSubmitting(true);
    try {
      if (activeProject) {
        const { data, error } = await (supabase.from('projects') as any)
          .update({
            title: projectForm.title,
            description: projectForm.description,
            status: projectForm.status,
            priority: projectForm.priority,
            deadline: projectForm.deadline || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeProject.id)
          .eq('user_id', authUser.id)
          .select()
          .single();

        if (error) throw error;
        
        setProjects(prev => prev.map(p => p.id === activeProject.id ? data : p));
        showToast('Mission parameters updated');
        closeModal();
      } else {
        const { data, error } = await (supabase.from('projects') as any).insert({
          user_id: authUser.id,
          title: projectForm.title,
          description: projectForm.description,
          status: projectForm.status,
          priority: projectForm.priority,
          deadline: projectForm.deadline || null,
          progress: 0,
          color: '#8b5cf6'
        })
        .select()
        .single();

        if (error) throw error;

        setProjects(prev => [data, ...prev]);
        showToast('New mission initialized');
        closeModal();
      }
    } catch (error: any) {
      console.error('Save project error:', error);
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== id));
      showToast('Mission aborted', 'error');
    } catch (error: any) {
      console.error('Delete project error:', error);
      showToast(error.message, 'error');
    }
  };

  const showToast = (message: string, type: any = 'success') => {
    setToast({ show: true, message, type });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveProject(null);
    setProjectForm({ title: '', description: '', status: 'backlog', priority: 'medium', deadline: '' });
  };

  const openEdit = (project: Project) => {
    setActiveProject(project);
    setProjectForm({
      title: project.title,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
      deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-6 bg-accent rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Mission Architecture Protocol</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
            Mission <span className="text-accent underline decoration-4 underline-offset-8 decoration-accent/20">Control</span>
          </h1>
          <p className="text-zinc-500 mt-4 font-medium tracking-tight max-w-xl">Deconstruct your high-level vision into tactical operational cycles and actionable sub-objectives.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="h-14 px-8 shadow-xl shadow-accent/20">
          <Plus className="w-5 h-5 mr-3" />
          INITIALIZE MISSION
        </Button>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <Input 
            placeholder="Search objectives..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 bg-white/5 border-white/5 focus:border-accent/40"
          />
        </div>
        <div className="flex gap-2">
            <Badge className="bg-accent/10 border-accent/20 text-accent">Deployment</Badge>
            <Badge variant="outline" className="text-zinc-600 border-white/5">Archive</Badge>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2].map(i => <Skeleton key={i} className="h-72 rounded-3xl" />)}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredProjects.map((project) => (
            <ProjectCard 
                key={project.id} 
                project={project} 
                onEdit={() => openEdit(project)}
                onDelete={() => handleDelete(project.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed border-white/5 bg-zinc-900/20 rounded-[3rem]">
          <div className="w-24 h-24 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center mb-10 shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Briefcase className="w-10 h-10 text-zinc-700 relative z-10" />
          </div>
          <h3 className="text-2xl font-display font-bold text-white tracking-tight leading-none uppercase tracking-widest">No Missions Active</h3>
          <p className="text-zinc-500 max-w-xs mx-auto mt-4 text-[15px] font-medium leading-relaxed">
            "Nature abhors a vacuum. Fill your workspace with purpose." Deploy your first mission to begin.
          </p>
          <Button onClick={() => setIsModalOpen(true)} variant="outline" className="mt-10 h-14 px-10 border-white/10 hover:bg-accent/10 hover:border-accent/40 rounded-2xl transition-all">
            <Target className="w-4 h-4 mr-3" />
            Deploy New Mission
          </Button>
        </Card>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 z-[61] w-full max-w-xl"
            >
              <Card className="p-8 border-white/10 bg-[#0f0f0f] shadow-2xl relative">
                <button onClick={closeModal} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-accent border-accent/20">Mission Manifest</Badge>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                      {activeProject ? 'Modify Mission' : 'Initialize Mission'}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Mission Identifier</label>
                        <Input 
                            value={projectForm.title}
                            onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                            placeholder="e.g. Website Redesign" 
                            className="bg-white/5"
                            autoFocus
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Contextual Brief</label>
                        <TextArea 
                            value={projectForm.description}
                            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                            placeholder="Specify mission objectives..." 
                            className="bg-white/5"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Status</label>
                            <select 
                                value={projectForm.status}
                                onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 appearance-none"
                            >
                                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Priority</label>
                            <select 
                                value={projectForm.priority}
                                onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 appearance-none"
                            >
                                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Timeline Deadline</label>
                        <Input 
                            type="date"
                            value={projectForm.deadline}
                            onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })}
                            className="bg-white/5"
                        />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <Button type="button" variant="ghost" className="flex-1" onClick={closeModal} disabled={submitting}>Abort</Button>
                    <Button type="submit" className="flex-1" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {activeProject ? 'Updating...' : 'Deploying...'}
                          </>
                        ) : (
                          activeProject ? 'Update Mission' : 'Execute Creation'
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

function ProjectCard({ project, onEdit, onDelete }: { project: Project; onEdit: () => void; onDelete: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTasks, setShowTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  useEffect(() => {
    if (showTasks) fetchTasks();
  }, [showTasks, project.id]);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: true });
    if (data) setTasks(data);
  };

  const addTask = async () => {
    if (!newTaskTitle) return;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    try {
      const { data, error } = await (supabase.from('project_tasks') as any).insert({
        project_id: project.id,
        user_id: authUser.id,
        title: newTaskTitle,
        is_done: false,
        position: tasks.length
      })
      .select()
      .single();

      if (error) throw error;
      
      setTasks(prev => [...prev, data]);
      setNewTaskTitle('');
      setIsAddingTask(false);
      updateProjectProgress();
    } catch (error: any) {
      console.error('Add task error:', error);
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      const { data, error } = await (supabase.from('project_tasks') as any)
        .update({ is_done: !task.is_done })
        .eq('id', task.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setTasks(prev => prev.map(t => t.id === task.id ? data : t));
      updateProjectProgress();
    } catch (error: any) {
      console.error('Toggle task error:', error);
    }
  };

  const updateProjectProgress = async () => {
      // Fetch latest tasks for progress calculation
      const { data } = await supabase.from('project_tasks').select('is_done').eq('project_id', project.id);
      const tasks = (data || []) as any[];
      if (tasks.length > 0) {
          const done = tasks.filter(t => t.is_done).length;
          const progress = Math.round((done / tasks.length) * 100);
          await (supabase.from('projects') as any).update({ progress }).eq('id', project.id);
      } else {
          await (supabase.from('projects') as any).update({ progress: 0 }).eq('id', project.id);
      }
  };

  const statusMap: any = {
    backlog: { color: 'text-zinc-500', bg: 'bg-white/5' },
    active: { color: 'text-accent', bg: 'bg-accent/10' },
    completed: { color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    on_hold: { color: 'text-amber-400', bg: 'bg-amber-400/10' }
  };

  const priorityMap: any = {
    low: 'text-zinc-600',
    medium: 'text-accent',
    high: 'text-red-500'
  };

  return (
    <Card className="group flex flex-col h-full hover:border-accent/30 bg-[#0a0a0a] border-white/5 transition-all duration-700 relative overflow-hidden rounded-[2.5rem] p-10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-1000" />
      
      <div className="flex justify-between items-start mb-10 relative z-10">
        <Badge variant="outline" className={cn("uppercase tracking-[0.2em] text-[10px] font-bold border-none px-4 py-1.5 rounded-full shadow-lg", statusMap[project.status].color, statusMap[project.status].bg)}>
            {project.status.replace('_', ' ')}
        </Badge>
        <div className="flex gap-1">
            <button onClick={onEdit} className="p-2.5 hover:bg-white/5 rounded-2xl text-zinc-600 hover:text-white transition-all">
                <SquarePen className="w-4.5 h-4.5" />
            </button>
            <button onClick={onDelete} className="p-2.5 hover:bg-red-500/10 rounded-2xl text-zinc-600 hover:text-red-400 transition-all">
                <Trash2 className="w-4.5 h-4.5" />
            </button>
        </div>
      </div>

      <div className="space-y-6 mb-12 relative z-10">
        <h3 className="text-4xl font-display font-bold text-white tracking-tight leading-tight group-hover:text-accent transition-colors duration-500 line-clamp-1">
          {project.title}
        </h3>
        <p className="text-zinc-500 text-[15px] line-clamp-2 leading-relaxed font-medium opacity-70 group-hover:opacity-100 transition-opacity">
          {project.description || 'No system brief provided for this mission path.'}
        </p>
      </div>

      <div className="mt-auto space-y-10 relative z-10">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
                 <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">Mission sync status</p>
                 <p className="text-xs font-mono font-bold text-white uppercase">{project.progress}% completed</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-accent/5 border border-accent/10 flex items-center justify-center text-accent/50 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5 p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              className="h-full rounded-full momentum-gradient shadow-[0_0_15px_rgba(var(--color-accent),0.3)]" 
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-8 border-t border-white/5">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-zinc-500">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
                {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'UNTETHERED'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl bg-white/5 border border-white/5", priorityMap[project.priority])}>
                <Flag className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-600">
                {project.priority} PRIORITY
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => setShowTasks(!showTasks)}
            className="flex items-center h-12 gap-3 text-accent bg-accent/5 px-6 rounded-2xl border border-accent/10 hover:bg-accent/10 transition-all group/btn shadow-xl shadow-accent/5"
          >
            <ListTodo className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Invariants {tasks.length > 0 && `(${tasks.filter(t => t.is_done).length}/${tasks.length})`}</span>
          </button>
        </div>

        <AnimatePresence>
            {showTasks && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-[#0c0c0c] -mx-10 -mb-10 mt-6 border-t border-white/5 shadow-inner"
                >
                    <div className="p-10 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                             <h4 className="text-[11px] font-bold uppercase tracking-[.3em] text-zinc-600">Sub-Objectives Matrix</h4>
                             {!isAddingTask && (
                                <button onClick={() => setIsAddingTask(true)} className="text-accent text-[10px] font-bold uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Add Entry</button>
                             )}
                        </div>

                        {isAddingTask && (
                            <div className="flex gap-3 mb-6 animate-in slide-in-from-top-4 duration-300">
                                <Input 
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Task identifier..."
                                    className="bg-zinc-900 h-12 text-sm rounded-xl border-white/5 focus:border-accent/40"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                                />
                                <Button onClick={addTask} className="h-12 px-6"><Check className="w-5 h-5" /></Button>
                                <Button variant="ghost" onClick={() => setIsAddingTask(false)} className="h-12 px-6 text-zinc-500 rounded-xl hover:bg-white/5"><X className="w-5 h-5" /></Button>
                            </div>
                        )}

                        <div className="space-y-3">
                             {tasks.map(task => (
                                <div 
                                    key={task.id} 
                                    onClick={() => toggleTask(task)}
                                    className="flex items-center gap-4 p-4 rounded-2xl bg-[#080808] border border-white/5 hover:border-accent/20 cursor-pointer group/task transition-all shadow-xl"
                                >
                                    <div className={cn(
                                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                                        task.is_done ? "bg-accent border-accent text-white shadow-[0_0_10px_rgba(var(--color-accent),0.4)]" : "border-white/10 text-transparent group-hover/task:border-accent/40"
                                    )}>
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span className={cn(
                                        "text-[15px] font-medium transition-all flex-1",
                                        task.is_done ? "text-zinc-600 line-through" : "text-zinc-300 group-hover/task:text-white"
                                    )}>
                                        {task.title}
                                    </span>
                                </div>
                             ))}
                             {tasks.length === 0 && !isAddingTask && (
                                <div className="py-10 text-center space-y-4">
                                     <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto opacity-20">
                                        <ListTodo className="w-6 h-6" />
                                     </div>
                                     <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest">No Sub-Objectives Initialized</p>
                                </div>
                             )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
