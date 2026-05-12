import { motion } from 'motion/react';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface MomentumOrbProps {
  momentum: number;
  trend: {
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

export function MomentumOrb({ momentum, trend }: MomentumOrbProps) {
  const TrendIcon = trend.trend === 'down' ? TrendingDown : trend.trend === 'stable' ? ArrowRight : TrendingUp;
  const trendBadgeText = trend.trend === 'stable' ? '0%' : `${trend.percentage}%`;

  return (
    <div className="relative flex h-32 w-32 shrink-0 items-center justify-center sm:h-40 sm:w-40">
      {/* Ambient Outer Glow */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 rounded-full bg-violet-500/20 blur-3xl"
      />

      {/* The Stage */}
      <div className="relative flex h-full w-full items-center justify-center rounded-full border border-white/5 bg-black/40 backdrop-blur-md shadow-2xl">
        <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.1),transparent_70%)]" />
        
        {/* Circular Progress */}
        <svg viewBox="0 0 144 144" className="absolute inset-0 h-full w-full -rotate-90 p-1">
          <circle 
            cx="72" cy="72" r="66" 
            stroke="rgba(255,255,255,0.03)" 
            strokeWidth="4" fill="none" 
          />
          <motion.circle 
            cx="72" cy="72" r="66" 
            strokeWidth="4" strokeLinecap="round" fill="none"
            stroke="url(#orbGrad)"
            initial={{ strokeDasharray: "414.6", strokeDashoffset: "414.6" }}
            animate={{ strokeDashoffset: 414.6 - (414.6 * momentum) / 100 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="orbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="50%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>

        {/* Inner Content */}
        <div className="relative text-center z-10">
          <motion.p 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-mono text-4xl font-bold leading-none text-white sm:text-5xl"
          >
            {momentum}
          </motion.p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 sm:text-[11px]">
            Momentum
          </p>
        </div>

        {/* Floating Trend Badge */}
        <motion.span 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={cn(
            'absolute -bottom-2 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold shadow-xl backdrop-blur-xl',
            trend.trend === 'down'
              ? 'border-red-500/20 bg-red-500/10 text-red-400'
              : trend.trend === 'stable'
                ? 'border-white/10 bg-white/10 text-zinc-400'
                : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
          )}
        >
          <TrendIcon className="h-3 w-3" />
          {trendBadgeText}
        </motion.span>

        {/* Animated Wave Decorative Element */}
        <svg viewBox="0 0 100 30" className="pointer-events-none absolute bottom-10 left-6 right-6 h-6 opacity-30">
          <path 
            d="M0 15 C20 25 30 5 50 15 C70 25 80 5 100 15" 
            fill="none" 
            stroke="url(#orbGrad)" 
            strokeWidth="2" 
            className="hero-orb-wave"
          />
        </svg>
      </div>
    </div>
  );
}