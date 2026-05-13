import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'glass' | 'solid' | 'glow' | 'premium';
  id?: string;
  onClick?: () => void;
}

export function Card({ children, className, variant = 'glass', id, onClick }: CardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={cardRef}
      id={id}
      onClick={onClick}
      initial={false}
      animate={{
        scale: isHovered ? 1.005 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 group transition-all duration-300",
        "premium-card-interaction",
        variant === 'glass' && "glass-card border-white/10 hover:border-white/20",
        variant === 'solid' && "bg-[#0a0a0a] border border-white/5 hover:border-white/10",
        variant === 'glow' && "glass-accent shadow-[0_0_20px_rgba(139,92,246,0.08)] hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]",
        variant === 'premium' && "glass-card bg-gradient-to-br from-purple-500/5 to-blue-500/5",
        onClick && "cursor-pointer active:scale-[0.98]",
        className
      )}
    >
      {/* Shimmer effect on hover */}
      <div 
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none",
          isHovered && "opacity-100"
        )}
        style={{
          background: `linear-gradient(
            45deg,
            transparent 30%,
            rgba(255,255,255,0.03) 40%,
            rgba(255,255,255,0.05) 50%,
            rgba(255,255,255,0.03) 60%,
            transparent 70%
          )`,
          backgroundSize: '200% 200%',
          animation: isHovered ? 'shimmer 3s ease-in-out infinite' : 'none',
        }}
      />
      {children}
    </motion.div>
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

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
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
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const addRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || props.disabled) return;
    
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      id: Date.now(),
      x,
      y,
      size,
    };

    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  };

  return (
    <button
      ref={buttonRef}
      onClick={addRipple}
      className={cn(
        "relative overflow-hidden inline-flex min-h-10 touch-manipulation items-center justify-center rounded-xl font-sans font-semibold tracking-normal transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060a] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97] active:duration-75",
        "premium-control",
        variant === 'primary' && "border border-white/10 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500 text-white shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 hover:shadow-blue-500/30 hover:shadow-violet-500/30",
        variant === 'secondary' && "border border-white/10 bg-white/[0.075] text-white shadow-lg shadow-black/15 hover:bg-white/[0.12] hover:shadow-black/25",
        variant === 'ghost' && "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5",
        variant === 'outline' && "bg-transparent text-white border border-white/10 hover:border-white/30 hover:bg-white/5",
        variant === 'danger' && "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30",
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
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/20 animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            transform: 'scale(0)',
          }}
        />
      ))}
    </button>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      // text-base (16px) on mobile to prevent iOS Safari auto-zoom
      // md:text-sm on desktop for consistent styling
      className={cn(
        "w-full min-h-11 touch-manipulation rounded-xl border border-white/10 bg-[#070a16]/75 px-4 py-3 text-base text-white placeholder:text-zinc-600 shadow-inner shadow-black/20 transition-all focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/35 md:text-sm",
        "premium-input",
        className
      )}
      {...props}
    />
  );
}

export function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      // text-base (16px) on mobile to prevent iOS Safari auto-zoom
      // md:text-sm on desktop for consistent styling
      className={cn(
        "min-h-[100px] w-full touch-manipulation rounded-xl border border-white/10 bg-[#070a16]/75 px-4 py-3 text-base text-white placeholder:text-zinc-600 shadow-inner shadow-black/20 transition-all focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/35 md:text-sm",
        "premium-input",
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

// Re-export Modal components for convenience
export { Modal, ModalFooter, ModalBody } from './Modal';
export { useModal, useModalContext, ModalProvider } from './ModalContext';
