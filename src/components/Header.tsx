import { motion } from 'motion/react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="mb-12 relative"
    >
      <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-1 h-12 bg-accent/40 blur-sm rounded-full hidden lg:block" />
      <h1 className="text-5xl font-display font-bold tracking-tight text-white mb-2">
        {title}
      </h1>
      {subtitle && (
        <p className="text-zinc-500 text-base font-sans font-medium tracking-wide max-w-2xl">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
