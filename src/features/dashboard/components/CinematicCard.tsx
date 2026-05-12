import type { ElementType } from 'react';
import type { LucideIcon } from 'lucide-react';

interface CinematicCardProps {
  title: string;
  subtitle: string;
  value: string;
  trend: string;
  progress: number;
  icon: LucideIcon;
  color: string;
  glowColor: string;
}

export function CinematicCard({ title, subtitle, value, trend, progress, icon: Icon, color, glowColor }: CinematicCardProps) {
  return (
    <div className="luxury-card relative overflow-hidden rounded-[1.7rem] p-4">
      <div
        className="pointer-events-none absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full blur-[60px] opacity-30"
        style={{ backgroundColor: color }}
      />
      <div className="relative">
        <div
          className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${color}20`, color, boxShadow: `0 0 18px ${glowColor}` }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{title}</p>
        <p className="font-display text-2xl font-bold leading-tight text-white">{value}</p>
        <p className="mt-0.5 text-[10px] text-zinc-500">{subtitle}</p>
        <p className="mt-1 truncate text-[10px] text-zinc-600">{trend}</p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color, boxShadow: `0 0 10px ${glowColor}` }}
          />
        </div>
      </div>
    </div>
  );
}
