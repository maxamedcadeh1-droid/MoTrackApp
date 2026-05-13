 /**
 * WakeUpMode - Cinematic wake-up experience
 * Fullscreen wake screen with calming animations and morning ritual
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Bell, CheckCircle2, X, Zap, Target } from 'lucide-react';
import { cn } from '../lib/utils';
import { SoundService } from '../lib/SoundService';

export interface WakeUpData {
  userName: string;
  habitTitle: string;
  habitColor?: string;
  momentumScore?: number;
  triggeredAt: string;
}

interface WakeUpModeProps {
  data: WakeUpData | null;
  onDismiss: () => void;
  onSnooze: () => void;
  onComplete: () => void;
}

export function WakeUpMode({ data, onDismiss, onSnooze, onComplete }: WakeUpModeProps) {
  const [phase, setPhase] = useState<'rising' | 'active'>('rising');
  const [time, setTime] = useState(new Date());
  const audioIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (data) {
      setPhase('rising');
      const timer = setTimeout(() => setPhase('active'), 1500);
      return () => clearTimeout(timer);
    }
  }, [data]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (phase === 'active' && data) {
      // Play gentle wake sound on loop
      const playWakeSound = async () => {
        await SoundService.play('nature');
      };
      playWakeSound();
      audioIntervalRef.current = window.setInterval(playWakeSound, 4000);
    }

    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    };
  }, [phase, data]);

  if (!data) return null;

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleDismiss = () => {
    setPhase('rising');
    setTimeout(onDismiss, 500);
  };

  const handleComplete = () => {
    setPhase('rising');
    setTimeout(onComplete, 500);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="safe-area-top safe-area-bottom fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto"
        style={{
          background: phase === 'rising' 
            ? 'linear-gradient(180deg, #0a0e1a 0%, #1a1040 50%, #2a1560 100%)'
            : 'linear-gradient(180deg, #0a0e1a 0%, #1a1040 30%, #2a1560 60%, #1a2040 100%)',
        }}
      >
        {/* Animated background glow */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: phase === 'active' ? 1.5 : 0.8, 
              opacity: phase === 'active' ? 0.3 : 0.1 
            }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full"
            style={{
              background: `radial-gradient(circle, ${data.habitColor || '#f59e0b'} 0%, transparent 70%)`,
              filter: 'blur(80px)',
            }}
          />
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ 
              scale: phase === 'active' ? 1.2 : 0.5, 
              opacity: phase === 'active' ? 0.2 : 0.05 
            }}
            transition={{ duration: 2.5, delay: 0.3, ease: "easeOut" }}
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
              filter: 'blur(100px)',
            }}
          />
        </div>

        {/* Floating particles */}
        {phase === 'active' && (
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: window.innerHeight + 50,
                  opacity: 0 
                }}
                animate={{ 
                  y: -50,
                  opacity: [0, 0.5, 0],
                }}
                transition={{
                  duration: 8 + Math.random() * 12,
                  delay: Math.random() * 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  backgroundColor: i % 2 === 0 ? '#f59e0b' : '#8b5cf6',
                  boxShadow: `0 0 10px ${i % 2 === 0 ? '#f59e0b' : '#8b5cf6'}`,
                }}
              />
            ))}
          </div>
        )}

        {/* Main content */}
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ 
            y: 0, 
            opacity: 1, 
            scale: phase === 'active' ? 1 : 0.95 
          }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="relative z-10 flex flex-col items-center justify-center px-6 max-w-lg w-full"
        >
          {/* Time display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-8"
          >
            <p className="font-mono text-6xl sm:text-7xl font-bold text-white tracking-tight">
              {formatTime(time)}
            </p>
            <p className="text-zinc-400 text-sm mt-2 font-medium tracking-wide uppercase">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>

          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center mb-10"
          >
            <p className="text-zinc-400 text-lg mb-2 font-medium">
              {getGreeting()}
            </p>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white">
              {data.userName}
            </h1>
          </motion.div>

          {/* Mission card */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="w-full mb-10"
          >
            <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 overflow-hidden">
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
                style={{ backgroundColor: data.habitColor || '#f59e0b' }}
              />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ 
                      backgroundColor: `${data.habitColor || '#f59e0b'}20`,
                      color: data.habitColor || '#f59e0b',
                      boxShadow: `0 0 20px ${data.habitColor || '#f59e0b'}30`,
                    }}
                  >
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500">
                      Today's Mission
                    </p>
                    <p className="text-lg font-bold text-white mt-0.5">
                      {data.habitTitle}
                    </p>
                  </div>
                </div>

                {data.momentumScore !== undefined && (
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-accent" />
                      <span className="text-sm text-zinc-400">Momentum</span>
                      <span className="font-mono text-lg font-bold text-accent">
                        {data.momentumScore}%
                      </span>
                    </div>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${data.momentumScore}%` }}
                        transition={{ duration: 1.5, delay: 1.2, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
                          boxShadow: '0 0 10px rgba(139,92,246,0.5)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex gap-4 w-full"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSnooze}
              className="flex-1 py-4 rounded-2xl border border-white/10 bg-white/5 text-white font-semibold transition-all hover:bg-white/10 hover:border-white/20"
            >
              Snooze
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleComplete}
              className="flex-[2] py-4 rounded-2xl font-semibold text-white transition-all flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${data.habitColor || '#f59e0b'}, #8b5cf6)`,
                boxShadow: `0 0 30px ${data.habitColor || '#f59e0b'}40`,
              }}
            >
              <CheckCircle2 className="h-5 w-5" />
              Start Morning Routine
            </motion.button>
          </motion.div>

          {/* Dismiss button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            onClick={handleDismiss}
            className="mt-6 p-3 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
