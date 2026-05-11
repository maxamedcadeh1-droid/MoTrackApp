import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sidebar, MobileNav } from './Navigation';
import { CommandCenter } from './CommandCenter';
import { QuickAdd } from './QuickAdd';

export function DashboardLayout() {
  const location = useLocation();
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 768px)');
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return (
    <div className="premium-bg flex min-h-screen overflow-x-hidden text-zinc-100 selection:bg-accent/40">
      <div className="pointer-events-none fixed inset-0 z-0 grid-bg opacity-70" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%,transparent_82%,rgba(0,0,0,0.35))]" />

      <Sidebar />
      <CommandCenter />
      <QuickAdd />
      
      <main className="relative z-10 min-w-0 flex-1 pb-32 md:pb-0">
        <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-5 md:p-8 lg:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-[calc(100vh-120px)]"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
