import React, { useEffect, useId, useState } from 'react';
import { Card, Button, Input, Badge, Toast, TextArea, Skeleton } from '../../components/ui/Layout';
import { MobileFormSheet } from '../../components/ui/MobileFormSheet';
import { ReminderSettings, ReminderSettingsData } from '../../components/ReminderSettings';
import {
  Plus,
  Search,
  MoreVertical,
  Clock,
  AlertCircle,
  CheckCircle2,
  ListTodo,
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
  SquarePen,
  Moon,
  Sun,
  Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/useAuth';
import { Database } from '../../types/database';
import { useRouteLifecycleDebug } from '../../lib/routeLifecycleDebug';
import { cn, deriveProjectProgress } from '../../lib/utils';

type Project = Database['public']['Tables']['projects']['Row'];
type Task = Database['public']['Tables']['project_tasks']['Row'];

const PRIORITIES = ['low', 'medium', 'high'] as const;
const STATUSES = ['backlog', 'active', 'completed', 'on_hold'] as const;
const DEFAULT_TASK_REMINDER: ReminderSettingsData = {
  reminderEnabled: false,
  reminderTime: '',
  reminderDays: [],
  reminderSound: 'chime',
};

export function Projects() {
  useRouteLifecycleDebug('Projects');
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
  const projectTitle = projectForm.title.trim();

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
      showToast('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    if (searchParams.get('add') === 'true') {
      openCreate();
    }
  }, [user, searchParams]);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      showToast('Please log in first', 'error');
      return;
    }
    if (!projectTitle) return;

    setSubmitting(true);
    try {
      const nextProgress = projectForm.status === 'completed'
        ? 100
        : activeProject
          ? Math.min(activeProject.progress || 0, 100)
          : 0;

      if (activeProject) {
        const { data, error } = await (supabase.from('projects') as any)
          .update({
            title: projectTitle,
            description: projectForm.description,
            status: projectForm.status,
            priority: projectForm.priority,
            deadline: projectForm.deadline || null,
            progress: nextProgress,
            updated_at: new Date().toISOString()
          })
          .eq('id', activeProject.id)
          .eq('user_id', authUser.id)
          .select()
          .single();

        if (error) throw error;

        setProjects(prev => prev.map(p => p.id === activeProject.id ? data : p));
        window.dispatchEvent(new Event('motrack:project-updated'));
        window.dispatchEvent(new Event('motrack:reminders-updated'));
        showToast('Project updated');
        closeModal();
      } else {
        const { data, error } = await (supabase.from('projects') as any).insert({
          user_id: authUser.id,
          title: projectTitle,
          description: projectForm.description,
          status: projectForm.status,
          priority: projectForm.priority,
          deadline: projectForm.deadline || null,
          progress: nextProgress,
          color: '#8b5cf6'
        })
        .select()
        .single();

        if (error) throw error;

        setProjects(prev => [data, ...prev]);
        window.dispatchEvent(new Event('motrack:project-updated'));
        showToast('Project created');
        closeModal();
      }
    } catch (error: any) {
      console.error('Save project error:', error);
      showToast('Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== id));
      window.dispatchEvent(new Event('motrack:project-updated'));
      window.dispatchEvent(new Event('motrack:reminders-updated'));
      showToast('Project deleted');
    } catch (error: any) {
      console.error('Delete project error:', error);
      showToast('Something went wrong', 'error');
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

  const openCreate = () => {
    setActiveProject(null);
    setProjectForm({ title: '', description: '', status: 'backlog', priority: 'medium', deadline: '' });
    setIsModalOpen(true);
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

  const updateProjectInList = (projectId: string, progress: number) => {
    setProjects(prev => prev.map(project => project.id === projectId ? { ...project, progress } : project));
  };

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );
  const isSearchingExistingProjects = projects.length > 0 && filteredProjects.length === 0;

  return (
    <div className="space-y-5 pb-24">
      <header className="luxury-card rounded-[2rem] p-6">
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-blue-500/18 blur-3xl" />
        <div className="relative flex items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-violet-300">Productivity OS</p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-white">
              Projects <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Overview</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm font-medium text-zinc-400">Track project momentum, timelines, tasks, and next actions in one premium workspace.</p>
          </div>
          <Button onClick={openCreate} size="sm" className="shrink-0 rounded-2xl">
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 bg-white/5 border-white/5 focus:border-accent/40"
          />
        </div>
        <div className="flex gap-2">
          <Badge className="bg-accent/10 border-accent/20 text-accent">Active work</Badge>
          <Badge variant="outline" className="text-zinc-600 border-white/5">Archive</Badge>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <Skeleton key={i} className="h-72 rounded-3xl" />)}
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: Math.min(index * 0.06, 0.3), type: 'spring', stiffness: 205, damping: 24 }}
              className="h-full"
            >
              <ProjectCard
                project={project}
                userId={user?.id}
                onEdit={() => openEdit(project)}
                onDelete={() => handleDelete(project.id)}
                onProgressChange={updateProjectInList}
                onError={(message) => showToast(message, 'error')}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center rounded-3xl border-dashed border-white/5 bg-zinc-900/20 py-16 text-center sm:rounded-[3rem] sm:py-24">
          <div className="w-24 h-24 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center mb-10 shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            {isSearchingExistingProjects
              ? <Search className="w-10 h-10 text-zinc-700 relative z-10" />
              : <Briefcase className="w-10 h-10 text-zinc-700 relative z-10" />}
          </div>
          <h3 className="text-2xl font-display font-bold text-white tracking-tight leading-none">
            {isSearchingExistingProjects ? 'No projects match your search' : 'Create your first project'}
          </h3>
          <p className="text-zinc-500 max-w-xs mx-auto mt-4 text-[15px] font-medium leading-relaxed">
            {isSearchingExistingProjects
              ? 'Try a different project name or clear the search.'
              : 'Turn a goal into a visible plan. Add a project, then break it into a few clear tasks.'}
          </p>
          <Button
            onClick={() => isSearchingExistingProjects ? setSearch('') : openCreate()}
            variant="outline"
            className="mt-10 h-14 px-10 border-white/10 hover:bg-accent/10 hover:border-accent/40 rounded-2xl transition-all"
          >
            {isSearchingExistingProjects ? <Search className="w-4 h-4 mr-3" /> : <Target className="w-4 h-4 mr-3" />}
            {isSearchingExistingProjects ? 'Clear search' : 'Create your first project'}
          </Button>
        </Card>
      )}

      {/* Add / Edit Project Sheet */}
      <MobileFormSheet
        open={isModalOpen}
        onClose={closeModal}
        title={activeProject ? 'Edit Project' : 'Create Project'}
        badge="Project details"
        formId="project-form"
        submitLabel={activeProject ? 'Save Changes' : 'Create Project'}
        submittingLabel={activeProject ? 'Saving...' : 'Creating...'}
        submitting={submitting}
        submitDisabled={!projectTitle}
      >
        <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Project name</label>
            <Input
              value={projectForm.title}
              onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
              placeholder="e.g. Website Redesign"
              className="bg-white/5"
              required
              autoFocus
            />
            <p className="ml-1 text-xs text-zinc-600">Required. Use a clear outcome or project name.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Description</label>
            <TextArea
              value={projectForm.description}
              onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
              placeholder="Describe the outcome..."
              className="bg-white/5"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Status</label>
              <select
                value={projectForm.status}
                onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-accent/50 appearance-none md:text-sm premium-select"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Priority</label>
              <select
                value={projectForm.priority}
                onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-accent/50 appearance-none md:text-sm premium-select"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Deadline</label>
            <Input
              type="date"
              value={projectForm.deadline}
              onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })}
              className="bg-white/5"
            />
          </div>
        </form>
      </MobileFormSheet>

      <Toast
        isVisible={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}

function ProjectCard({
  project,
  userId,
  onEdit,
  onDelete,
  onProgressChange,
  onError,
}: {
  project: Project;
  userId?: string;
  onEdit: () => void;
  onDelete: () => void;
  onProgressChange: (projectId: string, progress: number) => void;
  onError: (message: string) => void;
}) {
  // Unique gradient ID scoped to this card to prevent SVG ID conflicts across multiple cards
  const gradientId = useId().replace(/:/g, '_');
  const ringGradId = `projectRing_${gradientId}`;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskReminder, setTaskReminder] = useState<ReminderSettingsData>(DEFAULT_TASK_REMINDER);
  const [localProgress, setLocalProgress] = useState(deriveProjectProgress(project));
  const trimmedTaskTitle = newTaskTitle.trim();
  const completedTasks = tasks.filter((task) => task.is_done).length;

  useEffect(() => {
    if (showTasks) fetchTasks();
  }, [showTasks, project.id]);

  useEffect(() => {
    setLocalProgress(deriveProjectProgress(project));
  }, [project.progress, project.status]);

  const fetchTasks = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('project_id', project.id)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fetch project tasks error:', error);
      onError('Project tasks could not load');
      return;
    }

    if (data) {
      const rows = data as Task[];
      const progress = deriveProjectProgress({ ...project, project_tasks: rows });
      setTasks(rows);
      setLocalProgress(progress);
      onProgressChange(project.id, progress);

      if (progress !== (project.progress || 0)) {
        await updateProjectProgress(rows);
      }
    }
  };

  const addTask = async () => {
    if (!trimmedTaskTitle || submitting) return;
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser || authUser.id !== userId) {
      onError('Please log in first');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await (supabase.from('project_tasks') as any).insert({
        project_id: project.id,
        user_id: authUser.id,
        title: trimmedTaskTitle,
        due_date: newTaskDueDate || null,
        is_done: false,
        position: tasks.length,
        reminder_enabled: taskReminder.reminderEnabled,
        reminder_time: taskReminder.reminderTime || null,
        reminder_days: taskReminder.reminderDays,
        reminder_sound: taskReminder.reminderSound,
      })
      .select()
      .single();

      if (error) throw error;

      const nextTasks = [...tasks, data];
      setTasks(nextTasks);
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setTaskReminder(DEFAULT_TASK_REMINDER);
      setIsAddingTask(false);
      
      // Update global systems
      window.dispatchEvent(new Event('motrack:reminders-updated'));
      window.dispatchEvent(new Event('motrack:project-updated'));
      
      await updateProjectProgress(nextTasks);
    } catch (error: any) {
      console.error('Add task error:', error);
      onError(error.message || 'Task could not be created');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTask = async (task: Task) => {
    if (!userId) {
      onError('Please log in first');
      return;
    }

    try {
      const { data, error } = await (supabase.from('project_tasks') as any)
        .update({ is_done: !task.is_done, updated_at: new Date().toISOString() })
        .eq('id', task.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      const nextTasks = tasks.map(t => t.id === task.id ? data : t);
      setTasks(nextTasks);
      window.dispatchEvent(new Event('motrack:reminders-updated'));
      await updateProjectProgress(nextTasks);
    } catch (error: any) {
      console.error('Toggle task error:', error);
      onError('Task could not be updated');
    }
  };

  const updateProjectProgress = async (knownTasks?: Task[]) => {
    if (!userId) return;

    const taskRows = knownTasks || tasks;
    const progress = deriveProjectProgress({ ...project, project_tasks: taskRows });

    const { error } = await (supabase.from('projects') as any)
      .update({ progress, updated_at: new Date().toISOString() })
      .eq('id', project.id)
      .eq('user_id', userId);

    if (error) {
      console.error('Update project progress error:', error);
      onError('Project progress could not sync');
      return;
    }

    setLocalProgress(progress);
    onProgressChange(project.id, progress);
    window.dispatchEvent(new Event('motrack:project-updated'));
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
  const statusStyle = statusMap[project.status] || statusMap.backlog;
  const priorityStyle = priorityMap[project.priority] || priorityMap.medium;

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden rounded-[1.7rem] border-white/10 p-5 transition-all duration-500 hover:border-accent/30 sm:p-7">
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-1000" />

      <div className="flex justify-between items-start mb-10 relative z-10">
        <Badge variant="outline" className={cn("uppercase tracking-[0.2em] text-[10px] font-bold border-none px-4 py-1.5 rounded-full shadow-lg", statusStyle.color, statusStyle.bg)}>
          {(project.status || 'backlog').replace('_', ' ')}
        </Badge>
        <div className="flex gap-1">
          <button type="button" onClick={onEdit} className="p-2.5 hover:bg-white/5 rounded-2xl text-zinc-600 hover:text-white transition-all" aria-label={`Edit ${project.title}`}>
            <SquarePen className="w-4 h-4" />
          </button>
          <button type="button" onClick={onDelete} className="p-2.5 hover:bg-red-500/10 rounded-2xl text-zinc-600 hover:text-red-400 transition-all" aria-label={`Delete ${project.title}`}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative z-10 mb-8 space-y-5">
        <h3 className="font-display text-2xl font-bold leading-tight tracking-tight text-white transition-colors duration-500 group-hover:text-accent sm:text-4xl line-clamp-1">
          {project.title}
        </h3>
        <p className="text-zinc-500 text-[15px] line-clamp-2 leading-relaxed font-medium opacity-70 group-hover:opacity-100 transition-opacity">
          {project.description || 'No project description yet.'}
        </p>
        <div className="flex items-center justify-center py-2">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg viewBox="0 0 112 112" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="56" cy="56" r="42" stroke="rgba(255,255,255,0.07)" strokeWidth="8" fill="none" />
              <circle cx="56" cy="56" r="42" stroke={`url(#${ringGradId})`} strokeWidth="8" strokeLinecap="round" fill="none" strokeDasharray="263.9" strokeDashoffset={`${263.9 - (263.9 * localProgress) / 100}`} />
              <defs>
                <linearGradient id={ringGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-mono text-2xl font-bold text-white">{localProgress}%</span>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-10 relative z-10">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">Project progress</p>
              <p className="text-xs font-mono font-bold text-white uppercase">{localProgress}% completed</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-accent/5 border border-accent/10 flex items-center justify-center text-accent/50 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5 p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${localProgress}%` }}
              className="h-full rounded-full momentum-gradient shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-white/5 pt-8 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-zinc-500">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
                {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl bg-white/5 border border-white/5", priorityStyle)}>
                <Flag className="w-4 h-4" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-600">
                {project.priority} PRIORITY
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTasks(!showTasks)}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-accent/10 bg-accent/5 px-6 text-accent shadow-xl shadow-accent/5 transition-all hover:bg-accent/10 xl:w-auto group/btn"
          >
            <ListTodo className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Tasks ({completedTasks}/{tasks.length})</span>
          </button>
        </div>

        <AnimatePresence>
          {showTasks && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="-mx-5 -mb-5 mt-6 overflow-hidden border-t border-white/5 bg-[#0c0c0c] shadow-inner sm:-mx-8 sm:-mb-8 lg:-mx-10 lg:-mb-10"
            >
              <div className="space-y-6 p-5 sm:p-8 lg:p-10">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-[.3em] text-zinc-600">Project tasks</h4>
                  {!isAddingTask && (
                    <button onClick={() => setIsAddingTask(true)} className="text-accent text-[10px] font-bold uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Add task</button>
                  )}
                </div>

                {isAddingTask && (
                  <div className="mb-6 space-y-4 rounded-3xl border border-white/8 bg-white/[0.025] p-4 duration-300 animate-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_11rem_auto_auto]">
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Task name..."
                        className="h-12 rounded-xl border-white/5 bg-zinc-900 text-sm focus:border-accent/40"
                        onKeyDown={(e) => e.key === 'Enter' && addTask()}
                      />
                      <Input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="h-12 rounded-xl border-white/5 bg-zinc-900 text-sm focus:border-accent/40"
                      />
                      <Button onClick={addTask} disabled={!trimmedTaskTitle} className="h-12 px-6"><Check className="w-5 h-5" /></Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setIsAddingTask(false);
                          setNewTaskTitle('');
                          setNewTaskDueDate('');
                          setTaskReminder(DEFAULT_TASK_REMINDER);
                        }}
                        className="h-12 px-6 rounded-xl text-zinc-500 hover:bg-white/5"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="border-t border-white/5 pt-4">
                      <ReminderSettings value={taskReminder} onChange={setTaskReminder} />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {tasks.map(task => (
                    <button
                      type="button"
                      key={task.id}
                      onClick={() => toggleTask(task)}
                      aria-label={task.is_done ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                      className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-[#080808] p-4 text-left shadow-xl transition-all hover:border-accent/20 group/task"
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                        task.is_done ? "bg-accent border-accent text-white shadow-[0_0_10px_rgba(139,92,246,0.4)]" : "border-white/10 text-transparent group-hover/task:border-accent/40"
                      )}>
                        <Check className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className={cn(
                          "block truncate text-[15px] font-medium transition-all",
                          task.is_done ? "text-zinc-600 line-through" : "text-zinc-300 group-hover/task:text-white"
                        )}>
                          {task.title}
                        </span>
                        {(task.due_date || task.reminder_enabled) && (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                            {task.due_date && <span>Due {new Date(task.due_date).toLocaleDateString()}</span>}
                            {task.reminder_enabled && task.reminder_time && <span className="text-violet-300">Reminder {task.reminder_time}</span>}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                  {tasks.length === 0 && !isAddingTask && (
                    <div className="py-10 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto opacity-20">
                        <ListTodo className="w-6 h-6" />
                      </div>
                      <p className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest">No tasks yet</p>
                      <button
                        type="button"
                        onClick={() => setIsAddingTask(true)}
                        className="text-sm font-semibold text-accent transition-colors hover:text-white"
                      >
                        Add first task
                      </button>
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
