import { Outlet } from 'react-router-dom';
import { Sidebar, MobileNav } from './Navigation';
import { CommandCenter } from './CommandCenter';

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg-dark)] text-zinc-100 overflow-x-hidden selection:bg-accent/40">
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-50 z-0" />
      
      <div className="fixed top-1/4 -right-1/4 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="fixed bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none animate-pulse delay-1000" />
      
      <Sidebar />
      <CommandCenter />
      
      <main className="flex-1 pb-20 md:pb-0 relative z-10">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
          <Outlet />
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
