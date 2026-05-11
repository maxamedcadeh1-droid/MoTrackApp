import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  FileText, 
  Briefcase, 
  Timer, 
  BarChart3, 
  User, 
  Settings, 
  LogOut,
  Moon,
  Search
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: CheckCircle2, label: 'Habits', path: '/habits' },
  { icon: FileText, label: 'Notes', path: '/notes' },
  { icon: Briefcase, label: 'Projects', path: '/projects' },
  { icon: Timer, label: 'Focus', path: '/focus' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
];

const secondaryNavItems = [
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  const { signOut, user, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url;

  return (
    <aside className="hidden md:flex flex-col w-64 glass border-r border-white/5 h-screen sticky top-0 z-50">
      <div className="p-8 flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-xl shadow-purple-500/20">
          <Moon className="text-white w-6 h-6 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-display font-bold tracking-tight text-white leading-none whitespace-nowrap">
            MoTrack<span className="text-accent">OS</span>
          </span>
          <span className="text-[10px] font-bold text-zinc-600 tracking-[0.2em] uppercase mt-1">
            System v2.0.4
          </span>
        </div>
      </div>
      
      <div className="mx-4 mb-8 p-4 rounded-3xl bg-zinc-900/50 border border-white/5 flex items-center gap-4 group hover:border-accent/30 transition-all cursor-pointer hover:bg-accent/[0.02]" onClick={() => navigate('/profile')}>
        <div className="w-11 h-11 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                <User className="w-6 h-6 text-accent" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-white truncate tracking-tight">{displayName}</p>
          <p className="text-[10px] font-bold uppercase text-zinc-600 tracking-widest truncate mt-0.5">Operator Access</p>
        </div>
      </div>

      <div className="px-4 mb-6">
        <button 
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-zinc-900/50 border border-white/5 text-zinc-500 hover:text-white transition-all hover:bg-accent/[0.03] hover:border-accent/30 group"
        >
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4 text-zinc-600 group-hover:text-accent transition-colors" />
            <span className="text-sm font-medium tracking-tight">Quick Action</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded-lg border border-white/5 items-center">
              <span className="text-[9px] font-mono opacity-50 group-hover:opacity-100 uppercase tracking-tighter">Ctrl K</span>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
        <div className="px-4 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
          Operational Core
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
              isActive 
                ? "bg-accent/10 text-white border border-accent/20" 
                : "text-zinc-500 hover:text-white hover:bg-white/[0.03]"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5 transition-all group-hover:scale-110", isActive ? "text-accent" : "group-hover:text-zinc-300")} />
                <span className={cn("font-medium text-[15px] tracking-tight transition-colors", isActive ? "text-white" : "group-hover:text-zinc-200")}>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute -left-1 w-1 h-6 bg-accent rounded-full shadow-[0_0_20px_rgba(139,92,246,0.6)]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-8 border-t border-white/5 space-y-2">
        <div className="px-4 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
          Identity Hub
        </div>
        {secondaryNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
              isActive ? "bg-white/5 text-white border border-white/10" : "text-zinc-500 hover:text-white hover:bg-white/[0.03]"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5", isActive ? "text-accent" : "")} />
                <span className="font-medium text-[15px] tracking-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300 w-full text-left mt-4"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold text-[15px] tracking-tight">System Logout</span>
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 glass rounded-2xl h-16 flex items-center justify-between px-6">
      {navItems.slice(0, 5).map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center gap-1 min-w-[56px] transition-colors",
            isActive ? "text-accent" : "text-zinc-500"
          )}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-wider font-bold">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
