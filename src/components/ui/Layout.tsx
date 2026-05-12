import React from 'react';
import { cn } from '../../lib/utils';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'glass' | 'solid' | 'glow' | 'premium';
  id?: string;
  onClick?: () => void;
}

export function Card({ children, className, variant = 'glass', id, onClick }: CardProps) {
  return (
    <div
      id={id}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 group transition-all duration-300",
        variant === 'glass' && "glass-card border-white/5",
        variant === 'solid' && "bg-[#0a0a0a] border border-white/5",
        variant === 'glow' && "glass-accent shadow-[0_0_20px_rgba(139,92,246,0.08)]",
        variant === 'premium' && "glass-card bg-gradient-to-br from-purple-500/5 to-blue-500/5",
        onClick && "cursor-pointer active:scale-[0.99]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Badge({ 
  children, 
  className, 
  variant = 'default' 
}: { 
  children: React.ReactNode; 
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline'
}) {
  return (
    <span className={cn(
      "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.16em]",
      variant === 'default' && "bg-white/5 text-zinc-400 border border-white/10",
      variant === 'success' && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      variant === 'warning' && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      variant === 'error' && "bg-red-500/10 text-red-400 border border-red-500/20",
      variant === 'outline' && "bg-transparent text-zinc-500 border border-white/5",
      className
    )}>
      {children}
    </span>
  );
}

export function Button({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 touch-manipulation items-center justify-center rounded-xl font-sans font-semibold tracking-normal transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060a] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]",
        variant === 'primary' && "bg-accent text-white shadow-lg shadow-accent/20 hover:-translate-y-0.5 hover:shadow-accent/35 hover:neon-glow-purple",
        variant === 'secondary' && "bg-white/10 text-white hover:bg-white/20",
        variant === 'ghost' && "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5",
        variant === 'outline' && "bg-transparent text-white border border-white/10 hover:border-white/30 hover:bg-white/5",
        variant === 'danger' && "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
        size === 'sm' && "px-3 py-1.5 text-xs",
        size === 'md' && "px-5 py-2.5 text-sm",
        size === 'lg' && "px-8 py-3.5 text-base",
        size === 'icon' && "p-2.5",
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full min-h-11 touch-manipulation rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/35",
        className
      )}
      {...props}
    />
  );
}

export function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[100px] w-full touch-manipulation rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/35",
        className
      )}
      {...props}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("skeleton-shimmer rounded-xl", className)} />
  );
}

export function Toast({ 
  message, 
  type = 'info', 
  isVisible, 
  onClose 
}: { 
  message: string; 
  type?: 'success' | 'error' | 'info' | 'warning'; 
  isVisible: boolean; 
  onClose: () => void 
}) {
  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "mobile-toast fixed bottom-24 left-1/2 z-[100] flex w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl border px-5 py-3 shadow-xl backdrop-blur-md transition-all duration-200 sm:w-auto sm:px-6 md:bottom-8",
        type === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        type === 'error' && "bg-red-500/10 border-red-500/20 text-red-400",
        type === 'info' && "bg-blue-500/10 border-blue-500/20 text-blue-400",
        type === 'warning' && "bg-amber-500/10 border-amber-500/20 text-amber-400"
      )}
    >
      {type === 'success' && <CheckCircle className="w-5 h-5" />}
      {type === 'error' && <AlertCircle className="w-5 h-5" />}
      {type === 'info' && <Info className="w-5 h-5" />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-auto rounded-md p-1 transition-colors hover:bg-white/10">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
