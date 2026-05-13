import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sidebar, MobileNav } from './Navigation';
import { CommandCenter } from './CommandCenter';
import { QuickAdd } from './QuickAdd';
import { ReminderRuntime } from './ReminderRuntime';
import { useModalContext } from './ui/ModalContext';
import { cn } from '../lib/utils';

function getLayoutMotionState() {
  if (typeof window === 'undefined') {
    return { isMobile: false, reduceMotion: true };
  }

  const isMobile = window.matchMedia('(max-width: 767px)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return {
    isMobile,
    reduceMotion: prefersReducedMotion,
  };
}

export function DashboardLayout() {
  const location = useLocation();
  const { isAnyModalOpen, closeAllModals } = useModalContext();
  const [{ isMobile, reduceMotion }, setLayoutMotion] = useState(getLayoutMotionState);

  // 1. Auto-close all modals and reset body locks on navigation
  useEffect(() => {
    closeAllModals();
    // Force reset body styles to prevent stuck scroll locks from sheets/modals
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, [location.pathname, closeAllModals]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      setLayoutMotion({
        isMobile: mobileQuery.matches,
        reduceMotion: motionQuery.matches,
      });
    };

    updateMotion();
    mobileQuery.addEventListener('change', updateMotion);
    motionQuery.addEventListener('change', updateMotion);

    return () => {
      mobileQuery.removeEventListener('change', updateMotion);
      motionQuery.removeEventListener('change', updateMotion);
    };
  }, []);

  return (
    <div className="premium-bg flex min-h-screen overflow-x-hidden text-zinc-100 selection:bg-accent/40">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none fixed inset-0 z-0 grid-bg"
      />
      {!isMobile && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%,transparent_82%,rgba(0,0,0,0.35))]"
        />
      )}

      <Sidebar />
      <CommandCenter />
      <ReminderRuntime />
      
      <main className={cn('mobile-safe-main relative z-10 min-w-0 flex-1 pb-32 md:pb-0 transition-opacity duration-200', isAnyModalOpen && 'pointer-events-none')}>
        <div className="mx-auto w-full max-w-[430px] px-5 py-6 md:max-w-7xl md:p-8 lg:p-12">
          {reduceMotion ? (
            <div key={location.pathname} className="min-h-[calc(100vh-120px)]">
              <Outlet />
            </div>
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="min-h-[calc(100vh-120px)]"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
      
      {!isAnyModalOpen && <MobileNav />}
      
      <QuickAdd isHidden={isAnyModalOpen} />
    </div>
  );
}
