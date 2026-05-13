import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { animate, motion } from 'motion/react';

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

function parseMetric(value: string) {
  const fraction = value.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    return {
      target: Number(fraction[1]),
      format: (latest: number) => `${Math.round(latest)}/${fraction[2]}`,
    };
  }

  const minutes = value.match(/^(\d+)m$/);
  if (minutes) {
    return {
      target: Number(minutes[1]),
      format: (latest: number) => `${Math.round(latest)}m`,
    };
  }

  const plainNumber = value.match(/^\d+$/);
  if (plainNumber) {
    return {
      target: Number(value),
      format: (latest: number) => `${Math.round(latest)}`,
    };
  }

  return null;
}

function AnimatedMetric({ value, glowColor }: { value: string; glowColor: string }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const metric = parseMetric(value);
    if (!metric) {
      setDisplayValue(value);
      return;
    }

    setDisplayValue(metric.format(0));
    const controls = animate(0, metric.target, {
      duration: 1.05,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplayValue(metric.format(latest)),
    });

    return () => controls.stop();
  }, [value]);

  return (
    <motion.p
      className="relative font-display font-bold leading-none tracking-tight text-white"
      style={{
        fontSize: value.includes('/') ? '1.35rem' : '1.75rem',
        textShadow: `0 0 24px ${glowColor}`,
      }}
    >
      {displayValue}
    </motion.p>
  );
}

export function CinematicCard({ title, subtitle, value, trend, progress, icon: Icon, color, glowColor }: CinematicCardProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const isUp = trend.startsWith('↑') || trend.startsWith('✓') || trend.includes('reached') || trend.includes('progress');
  const isDown = trend.startsWith('↓');
  const trendColor = isUp ? '#34d399' : isDown ? '#f87171' : '#a1a1aa';

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="premium-cinema-card relative flex flex-col overflow-hidden rounded-[1.5rem] p-4"
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
        <motion.div
          initial={{ rotate: -8, scale: 0.92 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.2 }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${color}18`,
            color,
            boxShadow: `0 0 14px ${glowColor}, 0 0 0 1px ${color}22`,
          }}
        >
          <Icon className="h-3.5 w-3.5" />
        </motion.div>
      </div>

      {/* Large metric value */}
      <AnimatedMetric value={value} glowColor={glowColor} />

      {/* Trend text */}
      <p
        className="mt-1.5 truncate text-[10px] font-semibold"
        style={{ color: trendColor }}
      >
        {trend}
      </p>

      {/* Progress bar */}
      <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="h-full rounded-full transition-all duration-700"
          style={{
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 8px ${glowColor}`,
          }}
        />
      </div>
    </motion.div>
  );
}
