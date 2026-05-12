import { ArrowRight, Sparkles } from 'lucide-react';
import { RoutineSuggestion } from '../../../lib/RoutineSuggestionService';

interface SmartSuggestionProps {
  suggestion: RoutineSuggestion;
  navigate: (path: string) => void;
}

export function SmartSuggestion({ suggestion, navigate }: SmartSuggestionProps) {
  const progress = suggestion.confidence;
  const circumference = 188.5;
  const offset = circumference - (circumference * progress) / 100;

  return (
    <div
      className="relative overflow-hidden rounded-[1.75rem] p-5"
      style={{
        background:
          'linear-gradient(145deg, rgba(139,92,246,0.08) 0%, rgba(255,255,255,0.02) 100%), rgba(7,10,23,0.9)',
        border: '1px solid rgba(139,92,246,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 30px rgba(139,92,246,0.06)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-violet-500/8 via-transparent to-cyan-500/5" />

      <div className="relative grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-5">
        {/* Left */}
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <p className="text-xs font-bold text-violet-300">Smart Suggestion</p>
          </div>
          <p className="text-sm font-bold leading-snug text-white">{suggestion.headline}</p>
          <p className="mt-1 text-xs text-zinc-400">{suggestion.subtext}</p>
          <button
            onClick={() => navigate(suggestion.actionPath)}
            className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              boxShadow: '0 4px 16px rgba(139,92,246,0.35)',
            }}
          >
            {suggestion.actionLabel} <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Right: progress ring */}
        <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center justify-self-end">
          <svg viewBox="0 0 72 72" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="36" cy="36" r="30" stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="none" />
            <circle
              cx="36" cy="36" r="30"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              stroke="url(#suggGradComp)"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
            <defs>
              <linearGradient id="suggGradComp" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="relative text-center">
            <p className="text-base font-bold leading-none text-white">{progress}%</p>
            <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-widest text-zinc-500">fit</p>
          </div>
        </div>
      </div>
    </div>
  );
}
