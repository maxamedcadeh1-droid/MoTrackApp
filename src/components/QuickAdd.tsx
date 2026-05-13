import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, CheckCircle2, FileText, Plus, Timer, X } from 'lucide-react';
import { cn } from '../lib/utils';

const actions = [
  { label: 'New Habit', icon: CheckCircle2, path: '/habits?add=true', color: 'from-emerald-500 to-teal-500', iconBg: 'bg-emerald-500/15 text-emerald-400' },
  { label: 'Start Focus', icon: Timer, path: '/focus?start=true', color: 'from-violet-500 to-fuchsia-500', iconBg: 'bg-violet-500/15 text-violet-400' },
  { label: 'New Project', icon: Briefcase, path: '/projects?add=true', color: 'from-blue-500 to-cyan-500', iconBg: 'bg-blue-500/15 text-blue-400' },
  { label: 'New Note', icon: FileText, path: '/notes?add=true', color: 'from-amber-400 to-orange-500', iconBg: 'bg-amber-500/15 text-amber-400' },
];

export function QuickAdd({ isHidden = false }: { isHidden?: boolean }) {
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
      {/* Backdrop */}
      {isOpen && !isHidden && (
        <button
          type="button"
          aria-label="Close quick actions"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[85] bg-black/20 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* FAB Container - z-[90] to be above backdrop z-[85] */}
      {!isHidden && (
        <div className="fixed bottom-[max(6rem,calc(5.5rem+var(--safe-area-bottom)))] right-6 z-[90] md:bottom-10 md:right-10">
          {/* Action buttons */}
          {isOpen && (
            <div className="absolute bottom-[5rem] right-0 flex flex-col gap-3 items-end">
              {actions.map((action, idx) => (
                <button
                  key={action.label}
                  onClick={() => {
                    navigate(action.path);
                    setIsOpen(false);
                  }}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  className="group flex min-h-12 touch-manipulation items-center gap-3 animate-in fade-in slide-in-from-bottom-2"
                >
                  <span className="whitespace-nowrap rounded-2xl border border-white/10 bg-[#080b13]/98 px-3.5 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-xl transition-all md:opacity-0 md:group-hover:opacity-100">
                    {action.label}
                  </span>
                  <span className={cn('flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl transition-all group-hover:scale-110 active:scale-95', action.iconBg)}>
                    <action.icon className="h-5 w-5" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Main FAB */}
          <div className="relative flex h-16 w-16 items-center justify-center">
            {/* Pulsating Glow - now properly contained */}
            {!isOpen && (
              <div className="absolute inset-0 animate-pulse rounded-[1.4rem] bg-gradient-to-br from-violet-500/30 to-cyan-500/30 blur-lg" />
            )}
            
            <button
              onClick={() => setIsOpen((v) => !v)}
              className={cn(
                'relative z-10 flex h-full w-full touch-manipulation items-center justify-center rounded-[1.4rem] border shadow-2xl transition-all duration-300 active:scale-95',
                isOpen
                  ? 'rotate-45 border-white/20 bg-white/10 text-white backdrop-blur-xl'
                  : 'border-white/10 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-white'
              )}
              aria-expanded={isOpen}
              aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
