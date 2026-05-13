import { useEffect, useState } from 'react';
import { Card, Button, Badge, Toast, Input } from '../../components/ui/Layout';
import { ReminderSettings, ReminderSettingsData } from '../../components/ReminderSettings';
import {
  Bell,
  BellOff,
  Check,
  ChevronRight,
  Clock,
  Copy,
  KeyRound,
  LogOut,
  Monitor,
  Palette,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/useAuth';
import { useLogout } from '../auth/useLogout';
import { Database } from '../../types/database';
import { cn } from '../../lib/utils';
import { useRouteLifecycleDebug } from '../../lib/routeLifecycleDebug';

type Settings = Database['public']['Tables']['settings']['Row'];

const COLORS = [
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
];

const DEFAULT_SLEEP_REMINDER: ReminderSettingsData = {
  reminderEnabled: false,
  reminderTime: '22:30',
  reminderDays: [1, 2, 3, 4, 5, 6, 0],
  reminderSound: 'night',
};

// ── 2FA helpers ────────────────────────────────────────────────────────────
function generateBackupCodes(): string[] {
  return Array.from({ length: 8 }, () =>
    Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
}

export function Settings() {
  useRouteLifecycleDebug('Settings');
  const { user } = useAuth();
  const { handleLogout, isLoggingOut } = useLogout();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as any });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [activeTab, setActiveTab] = useState('Appearance');
  const [sleepReminder, setSleepReminder] = useState<ReminderSettingsData>(DEFAULT_SLEEP_REMINDER);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<'idle' | 'setup' | 'verify' | 'enabled'>('idle');
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      if (!user) return;
      const { data } = await supabase.from('settings').select('*').eq('user_id', user.id).single();
      if (data) {
        setSettings(data);
        setSleepReminder({
          reminderEnabled: Boolean((data as any).sleep_reminder_enabled),
          reminderTime: (data as any).sleep_reminder_time || DEFAULT_SLEEP_REMINDER.reminderTime,
          reminderDays: (data as any).sleep_reminder_days || DEFAULT_SLEEP_REMINDER.reminderDays,
          reminderSound: ((data as any).sleep_reminder_sound || DEFAULT_SLEEP_REMINDER.reminderSound) as any,
        });
      }
      setLoading(false);
    }
    fetchSettings();
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Check existing 2FA enrollment
  useEffect(() => {
    async function check2FA() {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp ?? [];
      const verified = totp.find((f) => f.status === 'verified');
      if (verified) {
        setTwoFAEnabled(true);
        setTwoFAStep('enabled');
      }
    }
    if (user) check2FA();
  }, [user]);

  const updateSettings = async (updates: Partial<Settings>) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    setUpdating(true);
    try {
      const query = settings
        ? (supabase.from('settings') as any).update(updates).eq('user_id', authUser.id).select().single()
        : (supabase.from('settings') as any).upsert({ user_id: authUser.id, ...updates }, { onConflict: 'user_id' }).select().single();
      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        setSettings(data as Settings);
        setToast({ show: true, message: 'Settings saved', type: 'success' });
      }
    } catch (error: any) {
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
    if (!nextEnabled) { await updateSettings({ notifications_enabled: false }); return; }
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      setToast({ show: true, message: 'Notifications not supported', type: 'error' });
      await updateSettings({ notifications_enabled: false }); return;
    }
    let permission = Notification.permission;
    if (permission === 'default') { permission = await Notification.requestPermission(); setNotificationPermission(permission); }
    if (permission !== 'granted') {
      setToast({ show: true, message: 'Notifications blocked by browser', type: 'error' });
      await updateSettings({ notifications_enabled: false }); return;
    }
    await updateSettings({ notifications_enabled: true });
  };

  const saveSleepReminder = async () => {
    await updateSettings({
      sleep_reminder_enabled: sleepReminder.reminderEnabled,
      sleep_reminder_time: sleepReminder.reminderEnabled ? sleepReminder.reminderTime : null,
      sleep_reminder_days: sleepReminder.reminderDays,
      sleep_reminder_sound: sleepReminder.reminderSound,
    } as any);
    window.dispatchEvent(new Event('motrack:reminders-updated'));
  };

  // ── 2FA: Enroll ──────────────────────────────────────────────────────────
  const handle2FASetup = async () => {
    setTwoFALoading(true);
    setTwoFAError(null);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'MoTrack Authenticator' });
      if (error) throw error;
      setTwoFAStep('setup');
      // Store factor id for verification
      sessionStorage.setItem('mfa_factor_id', data.id);
    } catch (err: any) {
      setTwoFAError(err.message || 'Failed to start 2FA setup.');
    } finally {
      setTwoFALoading(false);
    }
  };

  // ── 2FA: Verify ──────────────────────────────────────────────────────────
  const handle2FAVerify = async () => {
    if (twoFACode.length !== 6) { setTwoFAError('Enter the 6-digit code from your authenticator app.'); return; }
    setTwoFALoading(true);
    setTwoFAError(null);
    try {
      const factorId = sessionStorage.getItem('mfa_factor_id') || '';
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challengeData.id, code: twoFACode });
      if (verifyError) throw verifyError;
      const codes = generateBackupCodes();
      setBackupCodes(codes);
      setTwoFAEnabled(true);
      setTwoFAStep('enabled');
      setShowBackupCodes(true);
      setTwoFACode('');
      sessionStorage.removeItem('mfa_factor_id');
      setToast({ show: true, message: '2FA enabled successfully', type: 'success' });
    } catch (err: any) {
      setTwoFAError(err.message?.includes('Invalid') ? 'Invalid code. Please try again.' : err.message || 'Verification failed.');
    } finally {
      setTwoFALoading(false);
    }
  };

  // ── 2FA: Disable ─────────────────────────────────────────────────────────
  const handle2FADisable = async () => {
    setTwoFALoading(true);
    setTwoFAError(null);
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp ?? [];
      for (const factor of totp) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
      setTwoFAEnabled(false);
      setTwoFAStep('idle');
      setBackupCodes([]);
      setShowBackupCodes(false);
      setToast({ show: true, message: '2FA disabled', type: 'success' });
    } catch (err: any) {
      setTwoFAError(err.message || 'Failed to disable 2FA.');
    } finally {
      setTwoFALoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const notificationsEnabled = settings?.notifications_enabled ?? false;

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse space-y-8">
        <div className="h-10 w-48 rounded-xl bg-white/5" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="h-64 rounded-3xl bg-white/5" />
          <div className="h-[600px] rounded-3xl bg-white/5 lg:col-span-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-12 pb-20">
      <header>
        <Badge variant="outline" className="mb-2 border-accent/20 text-accent">Settings</Badge>
        <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">Settings</h1>
        <p className="mt-4 font-medium tracking-tight text-zinc-500">Tune your goals, appearance, notifications, and account security.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-12">
        {/* Sidebar tabs */}
        <div className="space-y-2">
          <SettingsTab active={activeTab === 'Appearance'} onClick={() => setActiveTab('Appearance')} icon={Palette} label="Appearance" />
          <SettingsTab active={activeTab === 'Focus'} onClick={() => setActiveTab('Focus')} icon={Clock} label="Focus" />
          <SettingsTab active={activeTab === 'Notifications'} onClick={() => setActiveTab('Notifications')} icon={Bell} label="Alerts" />
          <SettingsTab active={activeTab === 'Security'} onClick={() => setActiveTab('Security')} icon={Shield} label="Security" />
          <SettingsTab active={activeTab === 'Account'} onClick={() => setActiveTab('Account')} icon={LogOut} label="Account" />
        </div>

        {/* Content */}
        <div className="space-y-8 lg:col-span-3">
          {/* ── Appearance ── */}
          {activeTab === 'Appearance' && (
            <Card className="border-white/5 p-5 sm:p-8 lg:p-10">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10"><Palette className="h-5 w-5 text-accent" /></div>
                <div><h3 className="font-display text-xl font-bold text-white">Appearance</h3><p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Interface customization</p></div>
              </div>
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Accent color</label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map(c => (
                      <button key={c.name} onClick={() => setAccentColor(c.value)}
                        className={cn(
                          'relative h-11 w-11 rounded-2xl border-2 transition-all duration-300',
                          settings?.accent_color === c.value 
                            ? 'scale-110 border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                            : 'border-white/5 opacity-60 hover:opacity-100 hover:border-white/20'
                        )}
                        style={{ backgroundColor: c.value }}
                      >
                        {settings?.accent_color === c.value && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="h-5 w-5 text-white drop-shadow-md" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4 border-t border-white/5 pt-8">
                  <h4 className="ml-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Interface options</h4>
                  <ToggleItem label="Smooth transitions" desc="Enable motion effects across the interface" checked={true} />
                  <ToggleItem label="Glass panels" desc="Apply soft transparency to the interface" checked={true} />
                </div>
              </div>
            </Card>
          )}

          {/* ── Focus ── */}
          {activeTab === 'Focus' && (
            <Card className="border-white/5 p-5 sm:p-8 lg:p-10">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10"><Clock className="h-5 w-5 text-blue-400" /></div>
                <div><h3 className="font-display text-xl font-bold text-white">Focus preferences</h3><p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Session and goal tuning</p></div>
              </div>
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Daily goal (minutes)</label>
                    <Input type="number" value={settings?.daily_goal_minutes || 120} onChange={(e) => setDailyGoal(e.target.value)} className="h-12 bg-white/5" />
                  </div>
                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Default session</label>
                    <select value={25} className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/50" disabled>
                      <option value={25}>25 Minutes (Standard)</option>
                      <option value={45}>45 Minutes (Long)</option>
                      <option value={60}>60 Minutes (Extended)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4 border-t border-white/5 pt-8">
                  <h4 className="ml-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Audio feedback</h4>
                  <ToggleItem label="Completion alarm" desc="Play a sound when a session ends" checked={true} />
                  <ToggleItem label="Timer sound" desc="Subtle audio during active focus" checked={false} />
                </div>
              </div>
            </Card>
          )}

          {/* ── Notifications ── */}
          {activeTab === 'Notifications' && (
            <Card className="border-white/5 p-5 sm:p-8 lg:p-10">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10"><Bell className="h-5 w-5 text-orange-400" /></div>
                <div><h3 className="font-display text-xl font-bold text-white">Notifications</h3><p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Browser reminders</p></div>
              </div>
              <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5">
                    {notificationsEnabled ? <Bell className="h-6 w-6 text-accent" /> : <BellOff className="h-6 w-6 text-zinc-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Push notifications</p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                      {notificationPermission === 'unsupported' ? 'Not supported' : notificationPermission === 'denied' ? 'Blocked by browser' : notificationsEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={toggleNotifications} disabled={updating} aria-pressed={notificationsEnabled}
                  className={cn('relative h-8 w-16 rounded-full p-1 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50', notificationsEnabled ? 'bg-accent shadow-glow' : 'bg-white/10')}>
                  <div className={cn('h-6 w-6 rounded-full bg-white shadow-xl transition-all duration-300', notificationsEnabled ? 'translate-x-8' : 'translate-x-0')} />
                </button>
              </div>

              <div className="mt-6 rounded-3xl border border-blue-500/15 bg-blue-500/[0.035] p-5">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white">Night shutdown ritual</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">Schedule a calm end-of-day review with real habit and task data.</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 border-blue-500/20 text-blue-300">Sleep</Badge>
                </div>
                <ReminderSettings value={sleepReminder} onChange={setSleepReminder} />
                <Button
                  type="button"
                  onClick={saveSleepReminder}
                  disabled={updating}
                  className="mt-5 h-12 w-full rounded-2xl"
                >
                  Save Shutdown Ritual
                </Button>
              </div>
            </Card>
          )}

          {/* ── Security / 2FA ── */}
          {activeTab === 'Security' && (
            <div className="space-y-6">
              {/* 2FA Card */}
              <Card className="border-white/5 p-5 sm:p-8">
                <div className="mb-6 flex items-center gap-4">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border', twoFAEnabled ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-violet-500/20 bg-violet-500/10')}>
                    {twoFAEnabled ? <ShieldCheck className="h-5 w-5 text-emerald-400" /> : <Shield className="h-5 w-5 text-violet-400" />}
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">Two-Factor Authentication</h3>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Add an extra layer of security</p>
                  </div>
                  {twoFAEnabled && (
                    <span className="ml-auto rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">Active</span>
                  )}
                </div>

                {twoFAError && (
                  <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-400">
                    <ShieldOff className="h-4 w-4 shrink-0" />{twoFAError}
                  </div>
                )}

                {/* Idle: not set up */}
                {twoFAStep === 'idle' && (
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Protect your account with an authenticator app (Google Authenticator, Authy, etc.). Each login will require a 6-digit code.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { icon: Smartphone, title: 'Authenticator app', desc: 'Use any TOTP app' },
                        { icon: KeyRound, title: 'Backup codes', desc: 'Emergency access' },
                        { icon: ShieldCheck, title: 'Secure login', desc: 'Blocks unauthorized access' },
                      ].map((item) => (
                        <div key={item.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                          <item.icon className="mb-2 h-5 w-5 text-violet-400" />
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={handle2FASetup} disabled={twoFALoading}
                      className="flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                      {twoFALoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                      Enable 2FA
                    </button>
                  </div>
                )}

                {/* Setup: show QR instructions */}
                {twoFAStep === 'setup' && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
                      <p className="text-sm font-semibold text-violet-300">Step 1 — Open your authenticator app</p>
                      <p className="mt-1 text-xs text-zinc-400">Open Google Authenticator, Authy, or any TOTP app and scan the QR code shown in your Supabase dashboard, or add the account manually.</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                      <p className="text-sm font-semibold text-white">Step 2 — Enter the 6-digit code</p>
                      <p className="mt-1 text-xs text-zinc-500 mb-4">Enter the code from your authenticator app to verify setup.</p>
                      <div className="flex gap-3">
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          placeholder="000000"
                          value={twoFACode}
                          onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="h-12 w-40 rounded-2xl border-white/10 bg-white/5 text-center text-xl font-mono tracking-[0.4em] focus:border-accent/50"
                        />
                        <button onClick={handle2FAVerify} disabled={twoFALoading || twoFACode.length !== 6}
                          className="flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                          {twoFALoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Verify'}
                        </button>
                      </div>
                    </div>
                    <button onClick={() => { setTwoFAStep('idle'); setTwoFACode(''); setTwoFAError(null); }} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                      Cancel setup
                    </button>
                  </div>
                )}

                {/* Enabled */}
                {twoFAStep === 'enabled' && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
                      <div>
                        <p className="text-sm font-bold text-emerald-300">2FA is active</p>
                        <p className="text-xs text-zinc-400">Your account is protected with two-factor authentication.</p>
                      </div>
                    </div>

                    {/* Backup codes */}
                    {backupCodes.length > 0 && (
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm font-bold text-amber-300">Backup codes</p>
                          <button onClick={() => setShowBackupCodes((v) => !v)} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                            {showBackupCodes ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        <p className="mb-3 text-xs text-zinc-400">Save these codes somewhere safe. Each can be used once if you lose access to your authenticator.</p>
                        {showBackupCodes && (
                          <div className="grid grid-cols-2 gap-2">
                            {backupCodes.map((code) => (
                              <button key={code} onClick={() => copyCode(code)}
                                className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 font-mono text-xs text-zinc-300 transition-all hover:border-white/15 hover:bg-white/5">
                                {code}
                                {copiedCode === code ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-600" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <button onClick={handle2FADisable} disabled={twoFALoading}
                      className="flex h-10 items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50">
                      {twoFALoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                      Disable 2FA
                    </button>
                  </div>
                )}
              </Card>

              {/* Connected accounts */}
              <Card className="border-white/5 p-5 sm:p-8">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10"><Monitor className="h-5 w-5 text-blue-400" /></div>
                  <div><h3 className="font-display text-xl font-bold text-white">Connected accounts</h3><p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">OAuth providers</p></div>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Google', icon: '🔵', desc: 'Sign in with Google account' },
                    { name: 'Apple', icon: '⚫', desc: 'Sign in with Apple ID' },
                    { name: 'Facebook', icon: '🔷', desc: 'Sign in with Facebook' },
                  ].map((provider) => (
                    <div key={provider.name} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{provider.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-white">{provider.name}</p>
                          <p className="text-xs text-zinc-500">{provider.desc}</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-500">Available</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ── Account ── */}
          {activeTab === 'Account' && (
            <Card className="border-red-500/10 bg-red-500/[0.02] p-5 sm:p-8 lg:p-10">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10"><LogOut className="h-5 w-5 text-red-500" /></div>
                <div><h3 className="font-display text-xl font-bold text-red-500">Account</h3><p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-red-900/40">Session and access</p></div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <p className="text-sm font-semibold text-white">Current session</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">Signed in as <span className="font-medium text-zinc-300">{user?.email}</span>. Log out of this device at any time.</p>
                <Button variant="outline" className="mt-6 h-12 w-full border-white/10 text-zinc-400" onClick={() => handleLogout()} disabled={isLoggingOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Toast isVisible={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}

function SettingsTab({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick}
      className={cn('group flex w-full items-center justify-between rounded-2xl border p-4 transition-all', active ? 'border-white/10 bg-white/5 text-white shadow-xl' : 'border-transparent text-zinc-600 hover:bg-white/5 hover:text-zinc-300')}>
      <div className="flex items-center gap-3">
        <Icon className={cn('h-5 w-5 transition-transform', active ? 'scale-110 text-accent' : 'group-hover:scale-110')} />
        <span className="text-sm font-semibold leading-none">{label}</span>
      </div>
      {active && <ChevronRight className="h-4 w-4 text-accent" />}
    </button>
  );
}

function ToggleItem({ label, desc, checked }: any) {
  return (
    <div className="flex flex-col gap-4 rounded-xl p-4 transition-all hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold tracking-tight text-white">{label}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">{desc}</p>
      </div>
      <div className={cn('relative h-5 w-10 rounded-full p-1 transition-all', checked ? 'bg-accent/40' : 'bg-white/5')}>
        <div className={cn('h-3 w-3 rounded-full transition-all', checked ? 'absolute right-1 bg-accent' : 'absolute left-1 bg-white/10')} />
      </div>
    </div>
  );
}
