import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CheckCircle2, FileText, Plus, Timer } from 'lucide-react';
import { cn } from '../lib/utils';

const actions = [
  { label: 'New Habit', icon: CheckCircle2, path: '/habits?add=true', accent: 'text-emerald-300 bg-emerald-500/10' },
  { label: 'New Note', icon: FileText, path: '/notes?add=true', accent: 'text-blue-300 bg-blue-500/10' },
  { label: 'New Project', icon: Briefcase, path: '/projects?add=true', accent: 'text-purple-300 bg-purple-500/10' },
  { label: 'Start Focus', icon: Timer, path: '/focus?start=true', accent: 'text-cyan-300 bg-cyan-500/10' },
];

export function QuickAdd() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close quick actions"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-transparent"
        />
      )}

      <div className="mobile-quick-add fixed bottom-24 right-5 z-50 md:bottom-8 md:right-8">
        {isOpen && (
          <div className="mobile-quick-add-list absolute bottom-[4.5rem] right-0 space-y-3">
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  navigate(action.path);
                  setIsOpen(false);
                }}
                className="group ml-auto flex min-h-12 touch-manipulation items-center gap-3"
              >
                <span className="whitespace-nowrap rounded-xl border border-white/10 bg-[#080b13]/95 px-3 py-2 text-xs font-semibold text-white opacity-100 shadow-xl backdrop-blur-md transition-all md:opacity-0 md:group-hover:opacity-100">
                  {action.label}
                </span>
                <span className={cn('flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 shadow-xl backdrop-blur-md transition-transform group-hover:scale-105', action.accent)}>
                  <action.icon className="h-5 w-5" />
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setIsOpen((value) => !value)}
          className={cn(
            'flex h-14 w-14 touch-manipulation items-center justify-center rounded-2xl border border-white/10 shadow-xl transition-all duration-300',
            isOpen
              ? 'rotate-45 bg-white/10 text-white backdrop-blur-md'
              : 'momentum-gradient text-white shadow-accent/25'
          )}
          aria-expanded={isOpen}
          aria-label="Open quick actions"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </>
  );
}
