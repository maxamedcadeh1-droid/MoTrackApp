interface MomentumOrbProps {
  momentum: number;
}

export function MomentumOrb({ momentum }: MomentumOrbProps) {
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (circumference * Math.min(momentum, 100)) / 100;

  return (
    <div className="relative flex h-[72px] w-[72px] items-center justify-center">
      <svg viewBox="0 0 72 72" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="36" cy="36" r="30" stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="none" />
        <circle
          cx="36" cy="36" r="30"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          stroke="url(#orbGrad)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="orbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative text-center">
        <p className="font-mono text-base font-bold leading-none text-white">{momentum}</p>
        <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-widest text-zinc-500">score</p>
      </div>
    </div>
  );
}
