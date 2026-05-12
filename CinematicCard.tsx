import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/utils';

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

export function CinematicCard({ 
  title, subtitle, value, trend, progress, icon: Icon, color, glowColor 
}: CinematicCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-[#0a0c14]/40 p-5 backdrop-blur-xl transition-all duration-300"
    >
      {/* Top Border Glow Light */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Dynamic Background Glow */}
      <div 
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-20"
        style={{ backgroundColor: color }}
      />

      <div className="relative flex flex-col h-full min-h-[140px]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{subtitle}</p>
            <h3 className="text-sm font-bold text-zinc-200 mt-0.5">{title}</h3>
          </div>
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] transition-transform group-hover:scale-110"
            style={{ boxShadow: `0 0 20px ${glowColor}` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>

        <div className="mt-auto pt-6">
          <p className="font-mono text-3xl font-bold tracking-tight text-white">{value}</p>
          <p className="mt-1 text-[10px] font-medium text-zinc-500">{trend}</p>
          
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.03]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full rounded-full"
              style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}