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
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const trendUp = trend.startsWith('Up') || trend.startsWith('↑') || trend.includes('reached') || trend.includes('progress');

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-[1.5rem] p-4"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%), rgba(7,10,23,0.88)',
        border: `1px solid rgba(148,163,184,0.12)`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.04) inset`,
      }}
    >
      {/* Corner ambient glow */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full blur-2xl"
        style={{ backgroundColor: color, opacity: 0.18 }}
      />

      {/* Top row: label + icon */}
      <div className="relative mb-3 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{title}</p>
          <p className="text-[10px] text-zinc-600">{subtitle}</p>
        </div>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${color}18`,
            color,
            boxShadow: `0 0 14px ${glowColor}, 0 0 0 1px ${color}22`,
          }}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Large metric value */}
      <p
        className="relative font-display text-[1.75rem] font-bold leading-none tracking-tight text-white"
        style={{ textShadow: `0 0 24px ${glowColor}` }}
      >
        {value}
      </p>

      {/* Trend text */}
      <p
        className="mt-1.5 truncate text-[10px] font-semibold"
        style={{ color: trendUp ? '#34d399' : '#a1a1aa' }}
      >
        {trendUp && <span className="mr-0.5">↑</span>}
        {trend}
      </p>

      {/* Progress bar */}
      <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${clampedProgress}%`,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 8px ${glowColor}`,
          }}
        />
      </div>
    </div>
  );
}
