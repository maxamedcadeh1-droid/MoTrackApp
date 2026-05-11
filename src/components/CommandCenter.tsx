import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Terminal, 
  Plus, 
  Zap, 
  Layout, 
  CheckSquare, 
  StickyNote, 
  Timer, 
  Settings as SettingsIcon,
  X,
  Command
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export function CommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands = [
    { id: 'dash', label: 'Go to Dashboard', icon: Layout, action: () => navigate('/dashboard') },
    { id: 'habits', label: 'Manage Habits', icon: Zap, action: () => navigate('/habits') },
    { id: 'projects', label: 'Mission Control', icon: CheckSquare, action: () => navigate('/projects') },
    { id: 'notes', label: 'Digital Synapse', icon: StickyNote, action: () => navigate('/notes') },
    { id: 'focus', label: 'Deep Focus', icon: Timer, action: () => navigate('/focus') },
    { id: 'settings', label: 'Terminal Settings', icon: SettingsIcon, action: () => navigate('/settings') },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
    setQuery('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-xl bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5">
              <Search className="w-5 h-5 text-zinc-500" />
              <input 
                autoFocus
                placeholder="Execute command..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-700 focus:ring-0 text-lg font-medium"
              />
              <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                <span className="text-[10px] font-black text-zinc-500 uppercase">ESC</span>
              </div>
            </div>

            <div className="p-2 max-h-[400px] overflow-y-auto scrollbar-hide">
              <div className="px-4 py-2">
                <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-2">Primary Protocols</p>
                <div className="space-y-1">
                  {filteredCommands.map(cmd => (
                    <button
                      key={cmd.id}
                      onClick={() => handleAction(cmd.action)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-zinc-900 group-hover:bg-accent/10 transition-colors">
                          <cmd.icon className="w-4 h-4 text-zinc-500 group-hover:text-accent transition-colors" />
                        </div>
                        <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors uppercase italic tracking-tight">{cmd.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-zinc-600" />
                    </button>
                  ))}
                  {filteredCommands.length === 0 && (
                    <div className="py-8 text-center">
                      <Terminal className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                      <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">No matching protocols found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Command className="w-3 h-3 text-zinc-600" />
                    <span className="text-[9px] font-black text-zinc-600 uppercase">Command Center Active</span>
                </div>
              </div>
              <p className="text-[9px] font-black text-zinc-700 uppercase italic">Version 2.0.4 - OS//MOTRACK</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ChevronRight({ className }: { className?: string }) {
    return <Plus className={cn("rotate-45", className)} />;
}
