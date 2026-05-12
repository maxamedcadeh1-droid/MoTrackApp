interface MomentumOrbProps {
  momentum: number;
  trend?: { trend: 'up' | 'down' | 'stable'; percentage: number };
}

export function MomentumOrb({ momentum, trend }: MomentumOrbProps) {
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (circumference * Math.min(momentum, 100)) / 100;
  const trendUp = trend?.trend === 'up';
  const trendDown = trend?.trend === 'down';
  const trendText = trend
    ? trend.trend === 'stable'
      ? '0%'
      : `${trendUp ? '↑' : '↓'} ${trend.percentage}%`
    : null;

  return (
    <div className="relative flex h-[108px] w-[108px] shrink-0 items-center justify-center">
      {/* Outer bloom glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full opacity-30 blur-2xl"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.7) 0%, rgba(59,130,246,0.4) 60%, transparent 100%)' }}
      />

      {/* SVG ring */}
      <svg viewBox="0 0 108 108" className="absolute inset-0 h-full w-full -rotate-90">
        {/* Track */}
        <circle cx="54" cy="54" r={r} stroke="rgba(255,255,255,0.07)" strokeWidth="6" fill="none" />
        {/* Progress arc */}
        <circle
          cx="54" cy="54" r={r}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          stroke="url(#orbGradMain)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.9)) drop-shadow(0 0 16px rgba(59,130,246,0.6))' }}
        />
        {/* Animated wave line inside */}
        <path
          d="M 20 54 Q 30 46 40 54 Q 50 62 60 54 Q 70 46 80 54 Q 90 62 100 54"
          stroke="url(#waveGrad)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          className="hero-orb-wave"
          style={{ transform: 'rotate(90deg)', transformOrigin: '54px 54px' }}
        />
        <defs>
          <linearGradient id="orbGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>

      {/* Inner glass center */}
      <div
        className="relative z-10 flex flex-col items-center justify-center rounded-full"
        style={{
          width: 72,
          height: 72,
          background: 'radial-gradient(circle at 40% 35%, rgba(139,92,246,0.18), rgba(6,8,18,0.92) 70%)',
          border: '1px solid rgba(139,92,246,0.2)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <p className="font-mono text-2xl font-bold leading-none text-white" style={{ textShadow: '0 0 20px rgba(139,92,246,0.8)' }}>
          {momentum}
        </p>
        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-zinc-500">Momentum</p>
      </div>

      {/* Trend badge — bottom right */}
      {trendText && (
        <div
          className="absolute -bottom-1 -right-1 z-20 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-lg"
          style={{
            background: trendUp
              ? 'rgba(16,185,129,0.15)'
              : trendDown
              ? 'rgba(239,68,68,0.15)'
              : 'rgba(113,113,122,0.15)',
            border: trendUp
              ? '1px solid rgba(16,185,129,0.35)'
              : trendDown
              ? '1px solid rgba(239,68,68,0.35)'
              : '1px solid rgba(113,113,122,0.25)',
            color: trendUp ? '#34d399' : trendDown ? '#f87171' : '#a1a1aa',
            boxShadow: trendUp ? '0 0 10px rgba(16,185,129,0.3)' : 'none',
          }}
        >
          {trendText}
        </div>
      )}
    </div>
  );
}
