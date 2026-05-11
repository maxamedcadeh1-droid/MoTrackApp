import { useEffect, useState } from 'react';
import { Card, Button, Badge, Toast, Input } from '../../components/ui/Layout';
import { 
  Bell, 
  Moon, 
  Cloud, 
  Monitor, 
  Smartphone,
  CreditCard,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Check,
  Palette,
  Volume2,
  Clock,
  Target,
  Zap,
  Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
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
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as any });

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

  const updateSettings = async (updates: Partial<Settings>) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser || !settings) return;
    setUpdating(true);
    try {
      const { data, error } = await (supabase.from('settings') as any)
        .update(updates)
        .eq('user_id', authUser.id)
        .select()
        .single();
      
      if (error) throw error;

      if (data) {
        setSettings(data as Settings);
        setToast({ show: true, message: 'System parameters synchronized', type: 'success' });
      }
    } catch (error: any) {
      console.error('Update settings error:', error);
      setToast({ show: true, message: error.message, type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const setAccentColor = (color: string) => {
      document.documentElement.style.setProperty('--color-accent', color);
      updateSettings({ accent_color: color } as any);
  };

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
        <Badge variant="outline" className="mb-2 text-accent border-accent/20">System Configuration</Badge>
        <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tighter uppercase leading-[0.9]">
          Control<span className="text-accent underline decoration-4 underline-offset-8 decoration-accent/30 ml-2">Panel</span>
        </h1>
        <p className="text-zinc-500 mt-4 font-medium tracking-tight">Fine-tune your personal MoTrack operating system environment.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Navigation Tabs */}
        <div className="space-y-2">
          <SettingsTab active={activeTab === 'Appearance'} onClick={() => setActiveTab('Appearance')} icon={Palette} label="Appearance" />
          <SettingsTab active={activeTab === 'Focus'} onClick={() => setActiveTab('Focus')} icon={Clock} label="Focus Logic" />
          <SettingsTab active={activeTab === 'Notifications'} onClick={() => setActiveTab('Notifications')} icon={Bell} label="Telemetry" />
          <SettingsTab active={activeTab === 'Subscription'} onClick={() => setActiveTab('Subscription')} icon={CreditCard} label="Billing" />
          <SettingsTab active={activeTab === 'Access'} onClick={() => setActiveTab('Access')} icon={ShieldAlert} label="Security" />
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'Appearance' && (
            <Card className="p-10 border-white/5">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                        <Palette className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h3 className="text-xl font-display font-black text-white uppercase italic leading-none">Visual OS</h3>
                        <p className="text-[10px] font-display font-black uppercase text-zinc-600 mt-1 tracking-widest">Interface Customization</p>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 italic">Accent Signature</label>
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
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 italic">UI Toggles</h4>
                        <div className="space-y-4">
                            <ToggleItem 
                                label="Smooth Transitions" 
                                desc="Enable cinematic motion effects across the interface" 
                                checked={true} 
                            />
                            <ToggleItem 
                                label="High Contrast Mode" 
                                desc="Increase visibility of critical telemetry data" 
                                checked={false} 
                            />
                            <ToggleItem 
                                label="Glassmorphism" 
                                desc="Apply acrylic transparency to all control panels" 
                                checked={true} 
                            />
                        </div>
                    </div>
                </div>
            </Card>
          )}

          {activeTab === 'Focus' && (
            <Card className="p-10 border-white/5">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase italic leading-none">Focus Logic</h3>
                        <p className="text-[10px] font-black uppercase text-zinc-600 mt-1 tracking-widest">Temporal Parameter Tuning</p>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 italic">Daily Quota (Minutes)</label>
                            <Input 
                                type="number" 
                                value={settings?.daily_goal_minutes || 120} 
                                onChange={(e) => updateSettings({ daily_goal_minutes: parseInt(e.target.value) })}
                                className="bg-white/5 h-12"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 italic">Default Session</label>
                            <select 
                                value={25}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50 appearance-none h-12"
                                disabled
                            >
                                <option value={25}>25 Minutes (Standard)</option>
                                <option value={45}>45 Minutes (Deep Work)</option>
                                <option value={60}>60 Minutes (Marathon)</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-white/5 space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 italic">Audio Feedback</h4>
                        <div className="space-y-4">
                            <ToggleItem 
                                label="Completion Alarm" 
                                desc="Execute sound on session termination" 
                                checked={true} 
                            />
                            <ToggleItem 
                                label="Tick Tock" 
                                desc="Subtle auditory pulse during active focus" 
                                checked={false} 
                            />
                        </div>
                    </div>
                </div>
            </Card>
          )}

          {activeTab === 'Notifications' && (
            <Card className="p-10 border-white/5">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                        <Bell className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase italic leading-none">Telemetry Alerts</h3>
                        <p className="text-[10px] font-black uppercase text-zinc-600 mt-1 tracking-widest">Global Communication Protocol</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                <Monitor className="w-6 h-6 text-zinc-600" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-white uppercase italic tracking-tight">Push Notifications</p>
                                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Browser-level signal transmission</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => updateSettings({ notifications_enabled: !settings?.notifications_enabled })}
                            className={cn(
                                "w-14 h-7 rounded-full relative transition-all duration-500 p-1",
                                settings?.notifications_enabled ? "bg-accent shadow-glow" : "bg-white/10"
                            )}
                        >
                            <div className={cn(
                                "w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-xl",
                                settings?.notifications_enabled ? "translate-x-7" : "translate-x-0"
                            )} />
                        </button>
                    </div>
                </div>
            </Card>
          )}

          {/* Sign Out Section (Persistent at bottom for now or inside Access) */}
          <Card className="border-red-500/10 bg-red-500/[0.02] p-10 mt-12">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <LogOut className="w-5 h-5 text-red-500" />
                </div>
                <div>
                     <h3 className="text-xl font-black text-red-500 uppercase italic leading-none">Danger Zone</h3>
                     <p className="text-[10px] font-black uppercase text-red-900/40 mt-1 tracking-widest font-mono">CRITICAL SYSTEM ACCESS</p>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
                <Button variant="danger" className="flex-1 py-4 border-red-500/20">
                    <Trash2 className="w-4 h-4 mr-2" /> 
                    Terminate Account
                </Button>
                <Button variant="outline" className="flex-1 py-4 border-white/10 text-zinc-400" onClick={() => signOut()}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Deauthorize Session
                </Button>
            </div>
          </Card>
        </div>
      </div>

      <Toast 
        isVisible={toast.show} 
        message={toast.message} 
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
        <span className="text-sm font-black uppercase tracking-widest italic leading-none">{label}</span>
      </div>
      {active && <ChevronRight className="w-4 h-4 text-accent" />}
    </button>
  );
}

function ToggleItem({ label, desc, checked }: any) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.02] transition-all">
            <div>
                <p className="text-sm font-bold text-white uppercase italic tracking-tight">{label}</p>
                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-1">{desc}</p>
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
