import { useEffect, useState } from 'react';
import { Card, Button, Badge, Toast, Input } from '../../components/ui/Layout';
import { 
  Bell, 
  BellOff,
  Monitor, 
  LogOut,
  ChevronRight,
  Check,
  Palette,
  Clock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { useLogout } from '../auth/useLogout';
import { Database } from '../../types/database';
import { cn } from '../../lib/utils';

type Settings = Database['public']['Tables']['settings']['Row'];

const COLORS = [
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
];

export function Settings() {
  const { user } = useAuth();
  const { handleLogout, isLoggingOut } = useLogout();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as any });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');

  const [activeTab, setActiveTab] = useState('Appearance');

  useEffect(() => {
    async function fetchSettings() {
      if (!user) return;
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) setSettings(data);
      setLoading(false);
    }
    fetchSettings();
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const updateSettings = async (updates: Partial<Settings>) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    setUpdating(true);
    try {
      const query = settings
        ? (supabase.from('settings') as any)
          .update(updates)
          .eq('user_id', authUser.id)
          .select()
          .single()
        : (supabase.from('settings') as any)
          .upsert({ user_id: authUser.id, ...updates }, { onConflict: 'user_id' })
          .select()
          .single();

      const { data, error } = await query;
      
      if (error) throw error;

      if (data) {
        setSettings(data as Settings);
        setToast({ show: true, message: 'Settings saved', type: 'success' });
      }
    } catch (error: any) {
      console.error('Update settings error:', error);
      setToast({ show: true, message: 'Something went wrong', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const setAccentColor = (color: string) => {
      document.documentElement.style.setProperty('--color-accent', color);
      updateSettings({ accent_color: color } as any);
  };

  const setDailyGoal = (value: string) => {
    const minutes = Number.parseInt(value, 10);
    if (Number.isNaN(minutes)) return;
    updateSettings({ daily_goal_minutes: Math.max(minutes, 1) });
  };

  const toggleNotifications = async () => {
    const nextEnabled = !(settings?.notifications_enabled ?? false);

    if (!nextEnabled) {
      await updateSettings({ notifications_enabled: false });
      return;
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      setToast({ show: true, message: 'Notifications are not supported in this browser', type: 'error' });
      await updateSettings({ notifications_enabled: false });
      return;
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }

    if (permission !== 'granted') {
      setToast({ show: true, message: 'Notifications are blocked in your browser', type: 'error' });
      await updateSettings({ notifications_enabled: false });
      return;
    }

    await updateSettings({ notifications_enabled: true });
  };

  const notificationsEnabled = settings?.notifications_enabled ?? false;

  if (loading) {
      return (
          <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
              <div className="h-10 w-48 bg-white/5 rounded-xl" />
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="h-64 bg-white/5 rounded-3xl" />
                  <div className="lg:col-span-3 h-[600px] bg-white/5 rounded-3xl" />
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <header>
        <Badge variant="outline" className="mb-2 text-accent border-accent/20">Settings</Badge>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
          Settings
        </h1>
        <p className="text-zinc-500 mt-4 font-medium tracking-tight">Tune your goals, appearance, notifications, and account preferences.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-12">
        {/* Navigation Tabs */}
        <div className="space-y-2">
          <SettingsTab active={activeTab === 'Appearance'} onClick={() => setActiveTab('Appearance')} icon={Palette} label="Appearance" />
          <SettingsTab active={activeTab === 'Focus'} onClick={() => setActiveTab('Focus')} icon={Clock} label="Focus" />
          <SettingsTab active={activeTab === 'Notifications'} onClick={() => setActiveTab('Notifications')} icon={Bell} label="Alerts" />
          <SettingsTab active={activeTab === 'Account'} onClick={() => setActiveTab('Account')} icon={LogOut} label="Account" />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'Appearance' && (
            <Card className="border-white/5 p-5 sm:p-8 lg:p-10">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                        <Palette className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h3 className="text-xl font-display font-bold text-white leading-none">Appearance</h3>
                        <p className="text-[10px] font-display font-semibold uppercase text-zinc-600 mt-1 tracking-widest">Interface customization</p>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 ml-1">Accent color</label>
                        <div className="flex gap-4">
                            {COLORS.map(c => (
                                <button
                                    key={c.name}
                                    onClick={() => setAccentColor(c.value)}
                                    className={cn(
                                        "w-12 h-12 rounded-2xl transition-all border-4 shadow-2xl relative",
                                        settings?.accent_color === c.value ? "border-white scale-110" : "border-transparent opacity-40 hover:opacity-100"
                                    )}
                                    style={{ backgroundColor: c.value }}
                                >
                                    {settings?.accent_color === c.value && <Check className="w-5 h-5 text-white absolute inset-0 m-auto" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-10 border-t border-white/5 space-y-6">
                        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 ml-1">Interface options</h4>
                        <div className="space-y-4">
                            <ToggleItem 
                                label="Smooth transitions" 
                                desc="Enable motion effects across the interface" 
                                checked={true} 
                            />
                            <ToggleItem 
                                label="High contrast mode" 
                                desc="Increase visibility of key dashboard data" 
                                checked={false} 
                            />
                            <ToggleItem 
                                label="Glass panels" 
                                desc="Apply soft transparency to the interface" 
                                checked={true} 
                            />
                        </div>
                    </div>
                </div>
            </Card>
          )}

          {activeTab === 'Focus' && (
            <Card className="border-white/5 p-5 sm:p-8 lg:p-10">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-display font-bold text-white leading-none">Focus preferences</h3>
                        <p className="text-[10px] font-semibold uppercase text-zinc-600 mt-1 tracking-widest">Session and goal tuning</p>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 ml-1">Daily goal (minutes)</label>
                            <Input 
                                type="number" 
                                value={settings?.daily_goal_minutes || 120} 
                                onChange={(e) => setDailyGoal(e.target.value)}
                                className="bg-white/5 h-12"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 ml-1">Default session</label>
                            <select 
                                value={25}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 appearance-none h-12"
                                disabled
                            >
                                <option value={25}>25 Minutes (Standard)</option>
                                <option value={45}>45 Minutes (Long session)</option>
                                <option value={60}>60 Minutes (Extended session)</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-white/5 space-y-6">
                        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 ml-1">Audio feedback</h4>
                        <div className="space-y-4">
                            <ToggleItem 
                                label="Completion alarm" 
                                desc="Play a sound when a session ends" 
                                checked={true} 
                            />
                            <ToggleItem 
                                label="Timer sound" 
                                desc="Subtle audio during active focus" 
                                checked={false} 
                            />
                        </div>
                    </div>
                </div>
            </Card>
          )}

          {activeTab === 'Notifications' && (
            <Card className="border-white/5 p-5 sm:p-8 lg:p-10">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                        <Bell className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-display font-bold text-white leading-none">Notifications</h3>
                        <p className="text-[10px] font-semibold uppercase text-zinc-600 mt-1 tracking-widest">Browser reminders and updates</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col gap-5 rounded-2xl border border-white/5 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5">
                                {notificationsEnabled ? <Bell className="h-6 w-6 text-accent" /> : <BellOff className="h-6 w-6 text-zinc-600" />}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white tracking-tight">Push notifications</p>
                                <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-widest">
                                  {notificationPermission === 'unsupported'
                                    ? 'Not supported in this browser'
                                    : notificationPermission === 'denied'
                                      ? 'Blocked by browser'
                                      : notificationsEnabled
                                        ? 'Enabled'
                                        : 'Disabled'}
                                </p>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={toggleNotifications}
                            disabled={updating}
                            aria-pressed={notificationsEnabled}
                            className={cn(
                                "relative h-8 w-16 rounded-full p-1 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
                                notificationsEnabled ? "bg-accent shadow-glow" : "bg-white/10"
                            )}
                        >
                            <div className={cn(
                                "h-6 w-6 rounded-full bg-white shadow-xl transition-all duration-300",
                                notificationsEnabled ? "translate-x-8" : "translate-x-0"
                            )} />
                        </button>
                    </div>
                </div>
            </Card>
          )}

          {activeTab === 'Account' && (
          <Card className="border-red-500/10 bg-red-500/[0.02] p-5 sm:p-8 lg:p-10">
            <div className="mb-8 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <LogOut className="w-5 h-5 text-red-500" />
                </div>
                <div>
                     <h3 className="text-xl font-display font-bold text-red-500 leading-none">Account</h3>
                     <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-red-900/40">Session and access</p>
                </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <p className="text-sm font-semibold text-white">Current session</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Log out of this device. You can sign back in any time with your email and password.
              </p>
              <Button variant="outline" className="mt-6 h-12 w-full border-white/10 text-zinc-400" onClick={() => handleLogout()} disabled={isLoggingOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
          </Card>
          )}
        </div>
      </div>

      <Toast 
        isVisible={toast.show} 
        message={toast.message} 
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
}

function SettingsTab({ icon: Icon, label, active, onClick }: any) {
  return (
    <button 
        onClick={onClick}
        className={cn(
            "w-full flex items-center justify-between p-4 rounded-2xl transition-all group border",
            active ? "bg-white/5 text-white border-white/10 shadow-xl" : "text-zinc-600 hover:text-zinc-300 hover:bg-white/5 border-transparent"
        )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("w-5 h-5 transition-transform", active ? "text-accent scale-110" : "group-hover:scale-110")} />
        <span className="text-sm font-semibold leading-none">{label}</span>
      </div>
      {active && <ChevronRight className="w-4 h-4 text-accent" />}
    </button>
  );
}

function ToggleItem({ label, desc, checked }: any) {
    return (
        <div className="flex flex-col gap-4 rounded-xl p-4 transition-all hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="text-sm font-semibold text-white tracking-tight">{label}</p>
                <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-widest mt-1">{desc}</p>
            </div>
            <div className={cn(
                "w-10 h-5 rounded-full relative p-1 transition-all",
                checked ? "bg-accent/40" : "bg-white/5"
            )}>
                <div className={cn(
                    "w-3 h-3 rounded-full transition-all",
                    checked ? "bg-accent absolute right-1" : "bg-white/10 absolute left-1"
                )} />
            </div>
        </div>
    );
}
