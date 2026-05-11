import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  Input,
  TextArea,
  Toast,
} from '../../components/ui/Layout';
import {
  Briefcase,
  Calendar,
  Camera,
  Check,
  FileText,
  Globe,
  Loader2,
  Lock,
  Mail,
  Shield,
  Target,
  Timer,
  User as UserIcon,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { Database } from '../../types/database';
import { cn } from '../../lib/utils';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function Profile() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [form, setForm] = useState({ fullName: '', bio: '', avatar_url: '' });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bucketExists, setBucketExists] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' | 'info' | 'warning' });
  const [productivityStats, setProductivityStats] = useState({
    habits: 0,
    notes: 0,
    projects: 0,
    focusMinutes: 0,
    dailyGoal: 45,
    weeklyHabitGoal: 5,
  });

  useEffect(() => {
    async function checkBucket() {
      if (!user) return;
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        setBucketExists(!!buckets?.some((bucket) => bucket.name === 'avatars'));
      } catch (err) {
        console.error('Check bucket error:', err);
      }
    }
    checkBucket();
  }, [user]);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile(data as Profile);
        setForm({
          fullName: (data as any).full_name || '',
          bio: (data as any).bio || '',
          avatar_url: (data as any).avatar_url || '',
        });
      }
      setLoading(false);
    }
    fetchProfile();
  }, [user]);

  useEffect(() => {
    async function fetchProductivityStats() {
      if (!user) return;
      try {
        const [{ data: habits }, { data: notes }, { data: projects }, { data: focusSessions }, { data: settings }] = await Promise.all([
          supabase.from('habits').select('id').eq('user_id', user.id),
          supabase.from('notes').select('id').eq('user_id', user.id),
          supabase.from('projects').select('id,status').eq('user_id', user.id),
          supabase.from('focus_sessions').select('completed_minutes').eq('user_id', user.id),
          supabase.from('settings').select('daily_goal_minutes,weekly_goal_habits').eq('user_id', user.id).single(),
        ]);

        setProductivityStats({
          habits: habits?.length || 0,
          notes: notes?.length || 0,
          projects: projects?.filter((project: any) => project.status === 'active').length || 0,
          focusMinutes: (focusSessions || []).reduce((sum: number, session: any) => sum + (session.completed_minutes || 0), 0),
          dailyGoal: (settings as any)?.daily_goal_minutes || 45,
          weeklyHabitGoal: (settings as any)?.weekly_goal_habits || 5,
        });
      } catch (err) {
        console.error('Fetch profile stats error:', err);
      }
    }

    fetchProductivityStats();
  }, [user]);

  const profileCompletion = useMemo(() => {
    const completed = [form.fullName, form.bio, form.avatar_url || previewUrl, user?.email].filter(Boolean).length;
    return Math.round((completed / 4) * 100);
  }, [form.avatar_url, form.bio, form.fullName, previewUrl, user?.email]);

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setForm((prev) => ({ ...prev, avatar_url: publicUrl }));
      setToast({ show: true, message: 'Profile image updated', type: 'success' });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      const message = error.message?.includes('Bucket not found')
        ? 'Create the public "avatars" bucket in Supabase Storage before uploading.'
        : error.message || 'Upload failed. Check your connection or file size.';
      setToast({ show: true, message, type: 'error' });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setToast({ show: true, message: 'Please log in first', type: 'error' });
      return;
    }

    setUpdating(true);

    try {
      const { data, error } = await (supabase.from('profiles') as any)
        .update({
          full_name: form.fullName,
          bio: form.bio,
          avatar_url: form.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', authUser.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data as Profile);
        setForm({
          fullName: (data as any).full_name || '',
          bio: (data as any).bio || '',
          avatar_url: (data as any).avatar_url || '',
        });
        setToast({ show: true, message: 'Profile saved', type: 'success' });
        await refreshProfile();
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      setToast({ show: true, message: 'Something went wrong', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="h-12 w-48 animate-pulse rounded-xl bg-white/5" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="h-[520px] animate-pulse rounded-3xl bg-white/5 lg:col-span-4" />
          <div className="h-[600px] animate-pulse rounded-3xl bg-white/5 lg:col-span-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20 sm:space-y-10">
      <header>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-6 w-1.5 rounded-full bg-accent" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-500">Account</span>
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight tracking-normal text-white md:text-6xl">
          Profile
        </h1>
        <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-zinc-500">
          Keep your workspace personal, complete your profile, and review the goals shaping your momentum.
        </p>

        {!bucketExists && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex items-start gap-4 rounded-3xl border border-amber-500/10 bg-amber-500/5 p-6"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="mb-1 text-sm font-bold text-amber-500">Storage bucket missing: avatars</p>
              <p className="max-w-2xl text-[13px] leading-relaxed text-zinc-400">
                Profile images need a public <span className="font-mono font-medium text-white">avatars</span> bucket in Supabase Storage.
              </p>
            </div>
          </motion.div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <Card className="relative overflow-hidden border-white/10 bg-[#080b13]/75 p-5 text-center sm:p-8">
            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 -translate-y-1/2 translate-x-1/3 rounded-full bg-accent/15 blur-3xl" />

            <div className="relative mb-8 inline-block">
              <div className="relative h-36 w-36 rounded-full bg-gradient-to-br from-accent/50 to-blue-500/20 p-1 shadow-2xl shadow-accent/10 sm:h-44 sm:w-44">
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-900">
                  {previewUrl || form.avatar_url ? (
                    <img src={previewUrl || form.avatar_url} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="font-display text-5xl font-semibold text-white sm:text-6xl">{form.fullName?.[0] || user?.email?.[0]}</span>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
              </div>
              <label className="absolute bottom-2 right-2 z-10 cursor-pointer rounded-full bg-accent p-3 text-white shadow-2xl transition-all hover:scale-110 active:scale-95 sm:p-3.5">
                <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>

            <h3 className="font-display text-2xl font-bold tracking-normal text-white">{form.fullName || 'New profile'}</h3>
            <div className="mx-auto mt-4 flex w-fit items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-zinc-500">
              <Mail className="h-3.5 w-3.5" />
              {user?.email}
            </div>

            <div className="mt-6 flex justify-center">
              <Badge className="border border-accent/20 bg-accent/10 px-4 py-1.5 text-accent">
                {profile?.role === 'admin' ? 'Admin' : 'Member'}
              </Badge>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-left">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Profile completion</span>
                <span className="font-mono text-sm font-semibold text-white">{profileCompletion}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div initial={{ width: 0 }} animate={{ width: `${profileCompletion}%` }} className="h-full rounded-full momentum-gradient" />
              </div>
            </div>
          </Card>

          <Card className="border-white/10 bg-[#080b13]/72 p-5 sm:p-6">
            <h4 className="mb-6 px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">Productivity stats</h4>
            <div className="space-y-6">
              <StatRow icon={Zap} label="Focus logged" value={`${Math.round(productivityStats.focusMinutes / 60)}h`} color="text-accent" />
              <StatRow icon={FileText} label="Notes captured" value={`${productivityStats.notes}`} />
              <StatRow icon={Check} label="Habits tracked" value={`${productivityStats.habits}`} />
              <StatRow icon={Calendar} label="Member since" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'New'} />
            </div>
          </Card>

          <Card className="border-white/10 bg-[#080b13]/72 p-5 sm:p-6">
            <h4 className="mb-6 px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">Goals</h4>
            <div className="space-y-4">
              <GoalRow icon={Timer} label="Daily focus" value={`${productivityStats.dailyGoal}m`} />
              <GoalRow icon={Target} label="Weekly habits" value={`${productivityStats.weeklyHabitGoal}`} />
              <GoalRow icon={Briefcase} label="Active projects" value={`${productivityStats.projects}`} />
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-8">
          <Card className="border-white/10 bg-[#080b13]/72 p-5 sm:p-8 md:p-10">
            <div className="mb-10 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10">
                <UserIcon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold leading-none tracking-normal text-white">Personal details</h3>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">Name, bio, and account email</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <label className="ml-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Full name</label>
                  <Input
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="h-14 border-white/5 bg-zinc-900 text-[15px] font-medium transition-colors focus:bg-zinc-800"
                    placeholder="Mohamed"
                  />
                </div>
                <div className="space-y-3">
                  <label className="ml-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Account email</label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="h-14 cursor-not-allowed select-none border-dashed border-white/5 bg-zinc-900 text-[15px] font-medium opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="ml-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Bio</label>
                <TextArea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="min-h-[160px] border-white/5 bg-zinc-900 text-[15px] font-medium leading-relaxed transition-colors focus:bg-zinc-800"
                  placeholder="Write a short bio or current focus..."
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleUpdate} disabled={updating} className="h-14 px-10 text-sm font-semibold shadow-xl shadow-accent/20">
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-3 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="border-white/10 bg-[#080b13]/72 p-5 sm:p-8 md:p-10">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10">
                <Shield className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold leading-none text-white">Account settings</h3>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Privacy and access preferences</p>
              </div>
            </div>

            <div className="space-y-4">
              <SecuritySetting icon={Lock} title="Two-factor authentication" desc="Add another layer of account protection" status="inactive" />
              <SecuritySetting icon={Globe} title="Profile visibility" desc="Control whether profile details are visible" status="active" />
            </div>
          </Card>
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

function StatRow({ icon: Icon, label, value, color }: any) {
  return (
    <div className="group flex items-center justify-between px-1">
      <div className="flex items-center gap-3">
        <Icon className={cn('h-4 w-4 text-zinc-600 transition-colors group-hover:text-accent', color)} />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 transition-colors group-hover:text-zinc-300">{label}</span>
      </div>
      <span className="font-mono text-[11px] font-bold uppercase text-white">{value}</span>
    </div>
  );
}

function GoalRow({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-zinc-300">{label}</span>
      </div>
      <span className="font-mono text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function SecuritySetting({ icon: Icon, title, desc, status }: any) {
  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-5 transition-all hover:border-accent/30 hover:bg-accent/[0.02] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl border border-white/10 bg-zinc-800/50 p-3 transition-all group-hover:border-accent/20 group-hover:bg-accent/10">
          <Icon className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-normal text-white">{title}</p>
          <p className="mt-1 text-[11px] font-medium text-zinc-500">{desc}</p>
        </div>
      </div>
      <div className={cn('relative h-6 w-11 rounded-full p-1 transition-all', status === 'active' ? 'bg-accent/20' : 'bg-zinc-800')}>
        <div className={cn('h-4 w-4 rounded-full transition-all', status === 'active' ? 'translate-x-5 bg-accent' : 'bg-zinc-600')} />
      </div>
    </div>
  );
}
