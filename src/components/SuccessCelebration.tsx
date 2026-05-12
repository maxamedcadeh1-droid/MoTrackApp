import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Sparkles, Star, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  delay: number;
  color: string;
}

interface SuccessCelebrationProps {
  show: boolean;
  message?: string;
  type?: 'habit' | 'streak' | 'milestone';
  onComplete?: () => void;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

export function SuccessCelebration({ 
  show, 
  message = 'Great job!', 
  type = 'habit',
  onComplete 
}: SuccessCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Generate random particles
      const newParticles: Particle[] = [];
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const distance = 60 + Math.random() * 40;
        newParticles.push({
          id: Date.now() + i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          rotation: Math.random() * 360,
          scale: 0.5 + Math.random() * 0.5,
          delay: Math.random() * 0.2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
      setParticles(newParticles);

      // Auto hide after animation
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setParticles([]);
          onComplete?.();
        }, 500);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const getIcon = () => {
    switch (type) {
      case 'streak':
        return <Zap className="w-6 h-6 text-amber-400" />;
      case 'milestone':
        return <Star className="w-6 h-6 text-yellow-400" />;
      default:
        return <Check className="w-6 h-6 text-emerald-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-[200]"
        >
          {/* Center icon */}
          <div className="relative">
            {/* Glow effect */}
            <div 
              className="absolute inset-0 rounded-full blur-2xl animate-pulse"
              style={{ 
                background: type === 'streak' ? 'rgba(245, 158, 11, 0.3)' : 
                           type === 'milestone' ? 'rgba(250, 204, 21, 0.3)' : 
                           'rgba(16, 185, 129, 0.3)' 
              }}
            />
            
            {/* Icon container */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.4, times: [0, 0.6, 1] }}
              className={cn(
                "relative flex h-20 w-20 items-center justify-center rounded-full",
                type === 'streak' && "bg-amber-500/20 border-2 border-amber-500/40",
                type === 'milestone' && "bg-yellow-500/20 border-2 border-yellow-500/40",
                "bg-emerald-500/20 border-2 border-emerald-500/40"
              )}
            >
              {getIcon()}
            </motion.div>

            {/* Particles */}
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0, 
                  opacity: 1,
                  rotate: 0 
                }}
                animate={{ 
                  x: particle.x, 
                  y: particle.y, 
                  scale: particle.scale, 
                  opacity: 0,
                  rotate: particle.rotation 
                }}
                transition={{ 
                  duration: 1, 
                  delay: particle.delay,
                  ease: "easeOut" 
                }}
                className="absolute"
              >
                <Sparkles 
                  className="w-4 h-4" 
                  style={{ color: particle.color }}
                />
              </motion.div>
            ))}
          </div>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.3 }}
            className="absolute mt-28 text-lg font-bold text-white"
          >
            {message}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Confetti effect for major milestones
interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  delay: number;
  size: number;
}

export function ConfettiExplosion({ show, onComplete }: { show: boolean; onComplete?: () => void }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < 50; i++) {
        newPieces.push({
          id: Date.now() + i,
          x: (Math.random() - 0.5) * 300,
          y: -Math.random() * 200 - 50,
          rotation: Math.random() * 720 - 360,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          delay: Math.random() * 0.3,
          size: 6 + Math.random() * 8,
        });
      }
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => {
          setPieces([]);
          onComplete?.();
        }, 1000);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[200] overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{ 
                x: 0, 
                y: 0, 
                opacity: 1,
                rotate: 0,
                scale: 1 
              }}
              animate={{ 
                x: piece.x, 
                y: piece.y + 400, 
                opacity: 0,
                rotate: piece.rotation,
                scale: 0.5
              }}
              transition={{ 
                duration: 2, 
                delay: piece.delay,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              className="absolute rounded-sm"
              style={{
                width: piece.size,
                height: piece.size * 0.6,
                backgroundColor: piece.color,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}