import { Outlet } from 'react-router-dom';
import { Sidebar, MobileNav } from './Navigation';
import { CommandCenter } from './CommandCenter';
import { QuickAdd } from './QuickAdd';

export function DashboardLayout() {
  return (
    <div className="premium-bg flex min-h-screen overflow-x-hidden text-zinc-100 selection:bg-accent/40">
      <div className="pointer-events-none fixed inset-0 z-0 grid-bg opacity-70" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%,transparent_82%,rgba(0,0,0,0.35))]" />

      <Sidebar />
      <CommandCenter />
      <QuickAdd />
      
      <main className="relative z-10 min-w-0 flex-1 pb-32 md:pb-0">
        <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-5 md:p-8 lg:p-12">
          <Outlet />
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
