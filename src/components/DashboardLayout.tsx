import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sidebar, MobileNav } from './Navigation';
import { CommandCenter } from './CommandCenter';
import { QuickAdd } from './QuickAdd';
import { ReminderRuntime } from './ReminderRuntime';
import { useModalContext } from './ui/ModalContext';
import { SoundService } from '../lib/SoundService';
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
  const [{ isMobile }, setLayoutMotion] = useState(getLayoutMotionState);

  useEffect(() => {
    SoundService.unlockAudio();
    closeAllModals();
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
      <div className="pointer-events-none fixed inset-0 z-0 grid-bg opacity-70" aria-hidden />
      {!isMobile && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%,transparent_82%,rgba(0,0,0,0.35))]"
          aria-hidden
        />
      )}

      <Sidebar />
      <CommandCenter />
      <ReminderRuntime />

      <main
        className={cn(
          'mobile-safe-main relative z-10 min-w-0 flex-1 pb-32 md:pb-0 transition-opacity duration-200',
          isAnyModalOpen && 'pointer-events-none'
        )}
      >
        <div className="mx-auto w-full max-w-[430px] px-5 py-6 md:max-w-7xl md:p-8 lg:p-12">
          <div className="min-h-[calc(100vh-120px)]">
            <Outlet />
          </div>
        </div>
      </main>

      {!isAnyModalOpen && <MobileNav />}

      <QuickAdd isHidden={isAnyModalOpen} />
    </div>
  );
}
