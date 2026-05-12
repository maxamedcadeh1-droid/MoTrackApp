import React, { useEffect, useState } from 'react';
import { Card, Button, Input, Badge, Toast, TextArea, Skeleton } from '../../components/ui/Layout';
import { 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  SquarePen, 
  FileText,
  Loader2,
  ExternalLink,
  Tag as TagIcon,
  X,
  Maximize2,
  Calendar,
  Clock,
  LayoutGrid,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { Database } from '../../types/database';
import { cn } from '../../lib/utils';

type Note = Database['public']['Tables']['notes']['Row'];

const PRESET_TAGS = ['Ideas', 'Work', 'Personal', 'Meeting', 'Research'];

export function Notes() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewNote, setViewNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', tags: [] as string[] });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as any });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const noteTitle = noteForm.title.trim();

  const fetchNotes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setNotes(data);
    } catch (error: any) {
      console.error('Fetch notes error:', error);
      showToast('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    if (searchParams.get('add') === 'true') {
      setIsModalOpen(true);
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
    if (!noteTitle) return;

    setSubmitting(true);
    try {
      if (editingNote) {
        const { data, error } = await (supabase.from('notes') as any)
          .update({
            title: noteTitle,
            content: noteForm.content,
            tags: noteForm.tags,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingNote.id)
          .eq('user_id', authUser.id)
          .select()
          .single();

        if (error) throw error;
        
        setNotes(prev => prev.map(n => n.id === editingNote.id ? data : n));
        showToast('Note saved');
        closeModal();
      } else {
        const { data, error } = await (supabase.from('notes') as any).insert({
          user_id: authUser.id,
          title: noteTitle,
          content: noteForm.content,
          tags: noteForm.tags,
          is_pinned: false,
          color: '#8b5cf6'
        })
        .select()
        .single();

        if (error) throw error;

        setNotes(prev => [data, ...prev]);
        showToast('Note saved');
        closeModal();
      }
    } catch (error: any) {
      console.error('Save note error:', error);
      showToast('Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePin = async (note: Note) => {
    if (!user) {
      showToast('Please log in first', 'error');
      return;
    }
    const optimisticNote = {
      ...note,
      is_pinned: !note.is_pinned,
      updated_at: new Date().toISOString(),
    } as Note;

    setNotes(prev => prev.map(n => n.id === note.id ? optimisticNote : n));

    try {
      const { data, error } = await (supabase.from('notes') as any)
        .update({ 
          is_pinned: !note.is_pinned,
          updated_at: new Date().toISOString()
        })
        .eq('id', note.id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setNotes(prev => prev.map(n => n.id === note.id ? data : n));
      }
    } catch (error: any) {
      setNotes(prev => prev.map(n => n.id === note.id ? note : n));
      console.error('Toggle pin error:', error);
      showToast('Something went wrong', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      setNotes(prev => prev.filter(n => n.id !== id));
      showToast('Note deleted', 'error');
    } catch (error: any) {
      console.error('Delete note error:', error);
      showToast('Something went wrong', 'error');
    }
  };

  const showToast = (message: string, type: any = 'success') => {
    setToast({ show: true, message, type });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setViewNote(null);
    setNoteForm({ title: '', content: '', tags: [] });
  };

  const openEdit = (note: Note) => {
    setEditingNote(note);
    setNoteForm({
      title: note.title,
      content: note.content || '',
      tags: note.tags || []
    });
    setIsModalOpen(true);
  };

  const toggleTag = (tag: string) => {
    setNoteForm(prev => {
      const tags = prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags };
    });
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content?.toLowerCase().includes(search.toLowerCase()) ||
    n.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );
  const isSearchingExistingNotes = notes.length > 0 && filteredNotes.length === 0;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-6 bg-accent rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Notes and ideas</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
            Notes
          </h1>
          <p className="text-zinc-500 mt-4 font-medium tracking-tight max-w-xl">Write notes, pin important context, and keep your best ideas easy to find.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="h-14 px-8 shadow-xl shadow-accent/20">
          <Plus className="w-5 h-5 mr-3" />
          Create Note
        </Button>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <Input 
            placeholder="Search notes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 bg-white/5 border-white/5 focus:border-accent/40"
          />
        </div>
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
            <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-accent/20 text-accent" : "text-zinc-600 hover:text-white")}
            >
                <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
                onClick={() => setViewMode('list')}
                className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-accent/20 text-accent" : "text-zinc-600 hover:text-white")}
            >
                <List className="w-4 h-4" />
            </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-3xl" />)}
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className={cn(
            "grid gap-6",
            viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {filteredNotes.map((note) => (
            <NoteCard 
              key={note.id} 
              note={note} 
              viewMode={viewMode}
              onTogglePin={() => togglePin(note)}
              onDelete={() => handleDelete(note.id)}
              onEdit={() => openEdit(note)}
              onView={() => setViewNote(note)}
            />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center rounded-3xl border-dashed border-white/5 bg-zinc-900/20 py-16 text-center sm:rounded-[3rem] sm:py-24">
          <div className="w-24 h-24 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center mb-10 shadow-2xl overflow-hidden relative group">
             <div className="absolute inset-0 bg-accent/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            {isSearchingExistingNotes ? <Search className="w-10 h-10 text-zinc-700 relative z-10" /> : <FileText className="w-10 h-10 text-zinc-700 relative z-10" />}
          </div>
          <h3 className="text-2xl font-display font-bold text-white tracking-tight leading-none">
            {isSearchingExistingNotes ? 'No notes match your search' : 'Create your first note'}
          </h3>
          <p className="text-zinc-500 max-w-xs mx-auto mt-4 text-[15px] font-medium leading-relaxed">
            {isSearchingExistingNotes
              ? 'Try another keyword or clear the search to see all notes.'
              : 'Write a thought, meeting note, or quick idea. Your workspace gets smarter as context accumulates.'}
          </p>
          <Button
            onClick={() => isSearchingExistingNotes ? setSearch('') : setIsModalOpen(true)}
            variant="outline"
            className="mt-10 h-14 px-10 border-white/10 hover:bg-accent/10 hover:border-accent/40 rounded-2xl transition-all"
          >
            {isSearchingExistingNotes ? <Search className="w-4 h-4 mr-3" /> : <Maximize2 className="w-4 h-4 mr-3" />}
            {isSearchingExistingNotes ? 'Clear search' : 'Write your first note'}
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
              className="mobile-dialog-panel fixed inset-x-3 top-1/2 z-[61] max-h-[calc(100vh-1.5rem)] w-auto -translate-y-1/2 overflow-y-auto md:left-1/2 md:w-full md:max-w-3xl md:-translate-x-1/2"
            >
              <Card className="relative border-white/10 bg-[#0f0f0f] p-5 shadow-2xl sm:p-8 md:p-10">
                <button onClick={closeModal} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-accent border-accent/20">Note details</Badge>
                    <h3 className="text-3xl font-display font-bold text-white tracking-tight">
                      {editingNote ? 'Edit Note' : 'Create Note'}
                    </h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                        <Input 
                            value={noteForm.title}
                            onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                            placeholder="Note title..." 
                            className="h-auto border-none bg-transparent p-0 font-display text-2xl font-bold text-white placeholder:text-zinc-800 focus:ring-0 sm:text-3xl"
                            required
                            autoFocus
                        />
                        <p className="text-xs text-zinc-700">A title is required before saving.</p>
                    </div>
                    
                    <div className="space-y-2">
                        <TextArea 
                            value={noteForm.content}
                            onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                            placeholder="Start writing..." 
                            className="min-h-[220px] border-none bg-transparent p-0 font-sans text-base leading-relaxed text-zinc-400 placeholder:text-zinc-800 focus:ring-0 sm:min-h-[300px] sm:text-lg scrollbar-hide"
                        />
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2 text-zinc-500 mb-2">
                            <TagIcon className="w-4 h-4" />
                            <span className="text-[10px] font-display font-black uppercase tracking-[0.2em]">Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_TAGS.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border",
                                        noteForm.tags.includes(tag) 
                                          ? "bg-accent/10 border-accent/40 text-accent" 
                                          : "bg-white/5 border-white/5 text-zinc-600 hover:text-zinc-400"
                                    )}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-white/5">
                    <Button type="submit" className="flex-1 py-6 text-lg" disabled={submitting || !noteTitle}>
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          editingNote ? 'Save Changes' : 'Save Note'
                        )}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Viewer Modal */}
      <AnimatePresence>
        {viewNote && (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl"
                    onClick={closeModal}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mobile-dialog-panel fixed inset-x-3 top-1/2 z-[61] max-h-[calc(100vh-1.5rem)] w-auto -translate-y-1/2 overflow-y-auto md:left-1/2 md:w-full md:max-w-4xl md:-translate-x-1/2"
                >
                    <Card className="relative border-white/5 bg-transparent p-5 shadow-none sm:p-12 md:p-20">
                        <div className="absolute right-5 top-5 flex gap-4 sm:right-10 sm:top-10">
                            <button onClick={() => openEdit(viewNote)} className="text-zinc-500 hover:text-accent transition-colors">
                                <SquarePen className="w-6 h-6" />
                            </button>
                            <button onClick={closeModal} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-8 h-8" />
                            </button>
                        </div>
                        
                        <div className="space-y-12">
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {viewNote.tags?.map(t => (
                                        <Badge key={t} className="bg-white/5 border-white/10 text-zinc-500">{t}</Badge>
                                    ))}
                                    <Badge variant="outline" className="text-zinc-600 border-zinc-600/20 uppercase font-mono">
                                        {new Date(viewNote.created_at).toLocaleDateString()}
                                    </Badge>
                                </div>
                                <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tight leading-tight">
                                    {viewNote.title}
                                </h2>
                            </div>
                            
                            <div className="prose prose-invert max-w-none">
                                <p className="text-xl md:text-2xl text-zinc-400 leading-relaxed font-medium whitespace-pre-wrap">
                                    {viewNote.content}
                                </p>
                            </div>
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

function NoteCard({ note, viewMode, onTogglePin, onDelete, onEdit, onView }: any) {
  const isGridView = viewMode === 'grid';

  return (
    <Card 
        onClick={onView}
        className={cn(
            "group relative transition-all duration-500 cursor-pointer overflow-hidden rounded-[2.5rem] bg-[#0a0a0a] border-white/5",
            isGridView ? "min-h-[240px] p-5 sm:min-h-[280px] sm:p-8" : "p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-10"
        )}
    >
      {/* Subtle Glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-30 transition-all duration-700" />
      
      <div className={cn("flex flex-col gap-6", isGridView ? "h-full" : "flex-1 sm:flex-row sm:items-center sm:gap-12")}>
        <div className={cn("space-y-4", !isGridView && "flex-1")}>
            <div className="flex items-center gap-4">
                {note.is_pinned && <Pin className="w-4 h-4 text-accent fill-accent shadow-[0_0_10px_var(--color-accent)]" />}
                <div className="flex gap-2">
                    {note.tags?.slice(0, 2).map((t: string) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">{t}</span>
                    ))}
                </div>
            </div>
            <h3 className={cn(
                "text-2xl font-display font-bold text-white tracking-tight leading-tight group-hover:text-accent transition-colors",
                !isGridView && "text-xl"
            )}>
                {note.title}
            </h3>
            {isGridView && (
                <p className="text-[14px] text-zinc-500 line-clamp-4 leading-relaxed font-medium opacity-60 group-hover:opacity-100 transition-opacity">
                    {note.content || 'No content yet.'}
                </p>
            )}
        </div>

        <div className={cn(
            "flex items-center justify-between border-t border-white/5 pt-6",
            !isGridView && "border-none pt-0 min-w-[180px]"
        )}>
            <div className="flex items-center gap-3 text-zinc-600 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest leading-none">
                    {new Date(note.created_at).toLocaleDateString()}
                </span>
            </div>
            
            <div className="flex gap-2 opacity-100 transition-all md:opacity-0 md:group-hover:opacity-100">
                <button 
                    onClick={(e) => { e.stopPropagation(); onTogglePin(); }} 
                    className={cn("p-2.5 rounded-xl transition-all border border-transparent shadow-xl", note.is_pinned ? "bg-accent/10 border-accent/20 text-accent" : "bg-zinc-900 border-white/5 text-zinc-600 hover:text-white")}
                >
                    <Pin className={cn("w-4 h-4", note.is_pinned && "fill-current")} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-600 hover:text-white shadow-xl transition-all">
                    <SquarePen className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-600 hover:text-red-400 shadow-xl transition-all">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>

      {note.is_pinned && isGridView && (
        <div className="absolute top-0 right-0 w-10 h-10 flex items-center justify-center pointer-events-none">
            <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-l-[40px] border-t-accent/30 border-l-transparent transition-all group-hover:border-t-accent/50" />
            <Pin className="w-3.5 h-3.5 text-accent relative z-10 -mt-2 -mr-2 drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]" />
        </div>
      )}
    </Card>
  );
}
