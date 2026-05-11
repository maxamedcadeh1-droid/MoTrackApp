import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Zap, StickyNote, CheckSquare, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export function QuickAdd() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { label: 'Habit', icon: Zap, color: 'bg-accent/10 text-accent', path: '/habits?add=true' },
    { label: 'Note', icon: StickyNote, color: 'bg-blue-500/10 text-blue-500', path: '/notes?add=true' },
    { label: 'Mission', icon: CheckSquare, color: 'bg-emerald-500/10 text-emerald-500', path: '/projects?add=true' },
  ];

  return (
    <div className="fixed bottom-24 right-8 z-50 md:bottom-8">
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-20 right-0 space-y-4">
            {actions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  navigate(action.path);
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 group ml-auto"
              >
                <span className="px-3 py-1.5 rounded-lg bg-[#0f0f0f] border border-white/10 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </span>
                <div className={cn("p-4 rounded-2xl shadow-2xl border border-white/5 transition-transform hover:scale-110", action.color)}>
                  <action.icon className="w-5 h-5" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-5 rounded-[2rem] shadow-2xl transition-all duration-300 flex items-center justify-center border border-white/10",
          isOpen ? "bg-zinc-800 text-white rotate-45" : "bg-accent text-white"
        )}
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
}
