import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Command,
  FileText,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Sparkles,
  Timer,
  User,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useReliableNavigate } from '../lib/useReliableNavigate';

type CommandItem = {
  id: string;
  label: string;
  description: string;
  icon: typeof Search;
  keywords: string[];
  action: () => void;
  group: 'Navigate' | 'Create' | 'Focus';
};

export function CommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useReliableNavigate();
  const location = useLocation();

  useEffect(() => {
    const open = () => setIsOpen(true);
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('motrack:open-command-center', open);
    document.addEventListener('keydown', down);
    return () => {
      window.removeEventListener('motrack:open-command-center', open);
      document.removeEventListener('keydown', down);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setQuery('');
  }, [location.pathname]);

  const commands = useMemo<CommandItem[]>(
    () => [
      {
        id: 'dashboard',
        label: 'Open dashboard',
        description: 'Dashboard, progress, and priorities',
        icon: LayoutDashboard,
        keywords: ['home', 'briefing', 'momentum'],
        action: () => navigate('/dashboard'),
        group: 'Navigate',
      },
      {
        id: 'habits',
        label: 'Open habits',
        description: 'Review routines and streaks',
        icon: CheckCircle2,
        keywords: ['routine', 'streak'],
        action: () => navigate('/habits'),
        group: 'Navigate',
      },
      {
        id: 'notes',
        label: 'Open notes',
        description: 'Write and search ideas',
        icon: FileText,
        keywords: ['capture', 'writing'],
        action: () => navigate('/notes'),
        group: 'Navigate',
      },
      {
        id: 'projects',
        label: 'Open projects',
        description: 'Track active work and tasks',
        icon: Briefcase,
        keywords: ['tasks', 'work'],
        action: () => navigate('/projects'),
        group: 'Navigate',
      },
      {
        id: 'timeline',
        label: 'Open timeline',
        description: 'Today’s habits, tasks, focus, and shutdown',
        icon: CalendarDays,
        keywords: ['day', 'ritual', 'schedule'],
        action: () => navigate('/timeline'),
        group: 'Navigate',
      },
      {
        id: 'analytics',
        label: 'Open analytics',
        description: 'Trends, consistency, and focus patterns',
        icon: BarChart3,
        keywords: ['stats', 'charts', 'insights'],
        action: () => navigate('/analytics'),
        group: 'Navigate',
      },
      {
        id: 'profile',
        label: 'Open profile',
        description: 'Avatar, bio, goals, and identity',
        icon: User,
        keywords: ['account', 'bio'],
        action: () => navigate('/profile'),
        group: 'Navigate',
      },
      {
        id: 'settings',
        label: 'Open settings',
        description: 'Preferences and daily goals',
        icon: Settings,
        keywords: ['preferences', 'goal'],
        action: () => navigate('/settings'),
        group: 'Navigate',
      },
      {
        id: 'create-habit',
        label: 'Create habit',
        description: 'Start a new daily routine',
        icon: Plus,
        keywords: ['new habit', 'routine'],
        action: () => navigate('/habits?add=true'),
        group: 'Create',
      },
      {
        id: 'create-note',
        label: 'Create note',
        description: 'Write a quick thought',
        icon: Plus,
        keywords: ['new note', 'capture'],
        action: () => navigate('/notes?add=true'),
        group: 'Create',
      },
      {
        id: 'create-project',
        label: 'Create project',
        description: 'Organize a new initiative',
        icon: Plus,
        keywords: ['new project', 'task'],
        action: () => navigate('/projects?add=true'),
        group: 'Create',
      },
      {
        id: 'start-focus',
        label: 'Start focus timer',
        description: 'Begin a 25 minute focus session',
        icon: Timer,
        keywords: ['pomodoro', 'deep work', 'timer'],
        action: () => navigate('/focus?start=true'),
        group: 'Focus',
      },
    ],
    [navigate]
  );

  const filteredCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return commands;
    return commands.filter((cmd) => {
      const haystack = [cmd.label, cmd.description, cmd.group, ...cmd.keywords].join(' ').toLowerCase();
      return haystack.includes(normalized);
    });
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen]);

  const runCommand = (command?: CommandItem) => {
    if (!command) return;
    command.action();
    setIsOpen(false);
    setQuery('');
  };

  const onInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((index) => Math.min(index + 1, filteredCommands.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((index) => Math.max(index - 1, 0));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(filteredCommands[selectedIndex]);
    }
  };

  const groups = ['Navigate', 'Create', 'Focus'] as const;

  return isOpen ? (
    <div className="mobile-command-center fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
      />

      <div className="mobile-command-panel relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#080b13]/94 shadow-xl shadow-black/40 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-accent/10 to-transparent" />
        <div className="relative flex items-center gap-4 border-b border-white/10 px-5 py-4">
          <Search className="h-5 w-5 text-zinc-500" />
          <input
            autoFocus
            placeholder="Search pages, create items, or start focus..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            className="h-10 flex-1 border-none bg-transparent font-sans text-base font-medium text-white placeholder:text-zinc-600 focus:outline-none"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="touch-manipulation rounded-xl p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[56vh] overflow-y-auto p-3 scrollbar-hide">
          {filteredCommands.length > 0 ? (
            groups.map((group) => {
              const items = filteredCommands.filter((cmd) => cmd.group === group);
              if (items.length === 0) return null;

              return (
                <div key={group} className="pb-3">
                  <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                    {group}
                  </p>
                  <div className="space-y-1">
                    {items.map((cmd) => {
                      const absoluteIndex = filteredCommands.findIndex((item) => item.id === cmd.id);
                      const isSelected = absoluteIndex === selectedIndex;

                      return (
                        <button
                          key={cmd.id}
                          onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                          onClick={() => runCommand(cmd)}
                          className={cn(
                            'flex w-full touch-manipulation items-center justify-between rounded-2xl p-3 text-left transition-all',
                            isSelected ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span
                              className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
                                isSelected ? 'border-accent/25 bg-accent/10 text-accent' : 'border-white/10 bg-white/[0.035] text-zinc-500'
                              )}
                            >
                              <cmd.icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold">{cmd.label}</span>
                              <span className="block truncate text-xs text-zinc-600">{cmd.description}</span>
                            </span>
                          </span>
                          <span className="ml-3 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-zinc-600">
                            Enter
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035]">
                <Sparkles className="h-6 w-6 text-zinc-600" />
              </div>
              <p className="font-display text-lg font-semibold text-white">No matching command</p>
              <p className="mt-2 text-sm text-zinc-500">Try dashboard, habit, note, project, or focus.</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/[0.02] px-5 py-3">
          <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-600">
            <Command className="h-3.5 w-3.5" />
            <span>Ctrl K opens quick search</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-600">
            <span>Arrow keys</span>
            <span>Enter</span>
            <span>Esc</span>
          </div>
        </div>
      </div>
    </div>
  ) : null;
}
