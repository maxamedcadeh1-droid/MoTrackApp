import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  CheckCircle2,
  Command,
  FileText,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  Settings,
  Timer,
  User,
  Wifi,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { useLogout } from '../features/auth/useLogout';
import { cn } from '../lib/utils';

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

function openCommandCenter() {
  window.dispatchEvent(new Event('motrack:open-command-center'));
}

export function Sidebar() {
  const { user, profile } = useAuth();
  const { handleLogout, isLoggingOut } = useLogout();
  const navigate = useNavigate();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Mohamed';
  const avatarUrl = profile?.avatar_url;

  return (
    <aside className="sticky top-0 z-50 hidden h-screen w-[17rem] shrink-0 flex-col border-r border-white/5 bg-[#070912]/70 px-4 py-5 backdrop-blur-2xl md:flex">
      <div className="flex items-center gap-4 px-3 pb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500 to-blue-500 shadow-xl shadow-purple-500/15">
          <Moon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <span className="block whitespace-nowrap font-display text-xl font-bold leading-none tracking-normal text-white">
            MoTrack
          </span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Productivity workspace
          </span>
        </div>
      </div>

      <button
        onClick={() => navigate('/profile')}
        className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left transition-all hover:border-accent/25 hover:bg-white/[0.055]"
      >
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <User className="h-5 w-5 text-accent" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">
            {user?.email || 'Account'}
          </p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/10 bg-emerald-500/5 px-2 py-1 text-[10px] font-semibold text-emerald-400">
            <Wifi className="h-3 w-3" />
            Synced
          </span>
        </div>
      </button>

      <button
        onClick={openCommandCenter}
        className="mb-6 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-zinc-500 transition-all hover:border-accent/30 hover:bg-accent/[0.04] hover:text-white"
      >
        <span className="flex items-center gap-3 text-sm font-medium">
          <Search className="h-4 w-4" />
          Quick search
        </span>
        <span className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-zinc-500">
          <Command className="h-3 w-3" />
          K
        </span>
      </button>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-hide">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Workspace</p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-300',
                isActive
                  ? 'border border-accent/20 bg-accent/10 text-white shadow-lg shadow-accent/5'
                  : 'text-zinc-500 hover:bg-white/[0.045] hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-5 w-5 transition-all group-hover:scale-110', isActive ? 'text-accent' : 'text-zinc-500')} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute -left-4 h-6 w-1 rounded-full bg-accent shadow-[0_0_18px_rgba(139,92,246,0.45)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-white/5 pt-5">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Account</p>
        {secondaryNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all',
                isActive ? 'bg-white/5 text-white' : 'text-zinc-500 hover:bg-white/[0.045] hover:text-white'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => handleLogout()}
          disabled={isLoggingOut}
          className="mt-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-zinc-500 transition-all hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-5 w-5" />
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { handleLogout, isLoggingOut } = useLogout();

  // 5 dock tabs: Dashboard, Habits, Projects, Focus, Profile
  const dockItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckCircle2, label: 'Habits', path: '/habits' },
    { icon: Briefcase, label: 'Projects', path: '/projects' },
    { icon: Timer, label: 'Focus', path: '/focus' },
  ];

  const moreItems = [
    { icon: FileText, label: 'Notes', path: '/notes' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Account';
  const avatarUrl = profile?.avatar_url;

  return (
    <>
      {/* Profile sheet backdrop */}
      {profileOpen && (
        <button
          type="button"
          aria-label="Close profile menu"
          onClick={() => setProfileOpen(false)}
          className="fixed inset-0 z-[65] bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Profile sheet */}
      {profileOpen && (
        <div className="mobile-account-sheet fixed bottom-24 left-3 right-3 z-[70] overflow-hidden rounded-3xl border border-white/10 bg-[#080b13]/96 shadow-2xl shadow-black/50 backdrop-blur-2xl md:hidden">
          {/* User info header */}
          <div className="border-b border-white/8 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="h-5 w-5 text-accent" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{displayName}</p>
                <p className="truncate text-xs text-zinc-500">{user?.email || 'Account'}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                <Wifi className="h-3 w-3" />
                Synced
              </span>
            </div>
          </div>

          {/* Nav items */}
          <div className="p-2">
            <button
              type="button"
              onClick={() => { navigate('/profile'); setProfileOpen(false); }}
              className="flex min-h-11 w-full touch-manipulation items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <User className="h-4 w-4 text-accent" />
              Profile
            </button>
            {moreItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => { navigate(item.path); setProfileOpen(false); }}
                className="flex min-h-11 w-full touch-manipulation items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                <item.icon className="h-4 w-4 text-accent" />
                {item.label}
              </button>
            ))}
            <div className="my-1 h-px bg-white/8" />
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={() => handleLogout(() => setProfileOpen(false))}
              className="flex min-h-11 w-full touch-manipulation items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      )}

      {/* ── FLOATING GLASS DOCK ── */}
      <nav className="mobile-bottom-nav fixed bottom-3 left-5 right-5 z-50 flex h-[4.75rem] items-center justify-between gap-1 overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#070a16]/88 px-2 shadow-2xl shadow-black/50 backdrop-blur-2xl md:hidden">
        {/* Subtle top highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {dockItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'relative flex min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition-all duration-200',
                isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <>
                    <span className="absolute inset-0 rounded-[1.45rem] bg-gradient-to-b from-violet-500/22 to-blue-500/8 shadow-[0_0_26px_rgba(139,92,246,0.18)]" />
                    <span className="absolute bottom-1 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_10px_rgba(139,92,246,0.9)]" />
                  </>
                )}
                <item.icon className={cn('relative z-10 h-5 w-5 transition-all duration-200', isActive ? 'text-accent scale-110' : '')} />
                <span className={cn('relative z-10 text-[10px] font-semibold leading-none transition-all', isActive ? 'text-white' : '')}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Profile tab */}
        <button
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          className={cn(
            'relative flex min-w-0 flex-1 touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition-all duration-200',
            profileOpen ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          {profileOpen && (
            <>
              <span className="absolute inset-0 rounded-[1.45rem] bg-gradient-to-b from-violet-500/22 to-blue-500/8 shadow-[0_0_26px_rgba(139,92,246,0.18)]" />
              <span className="absolute bottom-1 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_10px_rgba(139,92,246,0.9)]" />
            </>
          )}
          <div className={cn('relative z-10 flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border transition-all duration-200', profileOpen ? 'border-accent scale-110' : 'border-white/20')}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="h-3.5 w-3.5 text-zinc-400" />
            )}
          </div>
          <span className={cn('relative z-10 text-[10px] font-semibold leading-none transition-all', profileOpen ? 'text-white' : '')}>Profile</span>
        </button>
      </nav>
    </>
  );
}
