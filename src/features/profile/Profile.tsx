import { useEffect, useState } from 'react';
import { Card, Button, Input, Badge, TextArea, Toast } from '../../components/ui/Layout';
import { 
  User as UserIcon, 
  Mail, 
  Camera, 
  Shield, 
  Globe,
  Loader2,
  Check,
  Star,
  Zap,
  Calendar,
  Lock,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { Database } from '../../types/database';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

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
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as any });

  useEffect(() => {
    async function checkBucket() {
      if (!user) return;
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const exists = buckets?.some(b => b.name === 'avatars');
        setBucketExists(!!exists);
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
            avatar_url: (data as any).avatar_url || ''
        });
      }
      setLoading(false);
    }
    fetchProfile();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setForm(prev => ({ ...prev, avatar_url: publicUrl }));
      setToast({ show: true, message: 'Identity image synchronized', type: 'success' });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      let message = 'Upload failed';
      if (error.message?.includes('Bucket not found')) {
        message = 'Storage Error: Please create the "avatars" bucket in Supabase Storage and set it to Public.';
      } else {
        message = error.message || 'Check your connection or file size.';
      }
      setToast({ show: true, message, type: 'error' });
      setPreviewUrl(null); // Reset preview on error
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setToast({ show: true, message: 'Please login first', type: 'error' });
      return;
    }
    setUpdating(true);

    try {
      const { data, error } = await (supabase.from('profiles') as any)
        .update({ 
            full_name: form.fullName,
            bio: form.bio,
            avatar_url: form.avatar_url,
            updated_at: new Date().toISOString()
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
            avatar_url: (data as any).avatar_url || ''
        });
        setToast({ show: true, message: 'Identity parameters synchronized', type: 'success' });
        refreshProfile();
      }
    } catch (error: any) {
        console.error('Update profile error:', error);
        setToast({ show: true, message: error.message, type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-pulse">
            <div className="h-10 w-48 bg-white/5 rounded-xl" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 h-[400px] bg-white/5 rounded-3xl" />
                <div className="lg:col-span-8 h-[600px] bg-white/5 rounded-3xl" />
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <header>
        <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 bg-accent rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Identity Protocol 04</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
          Operator <span className="text-accent underline decoration-4 underline-offset-8 decoration-accent/20">Profile</span>
        </h1>
        <p className="text-zinc-500 mt-4 font-medium tracking-tight max-w-xl">Configure your identifiers and operational presence within the MoTrack ecosystem.</p>
        
        {!bucketExists && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-500 mb-1">Bucket Missing: "avatars"</p>
              <p className="text-[13px] text-zinc-400 leading-relaxed max-w-2xl">
                 Profile images need the <span className="text-white font-mono font-medium">avatars</span> storage bucket. Create it in <span className="p-0.5 bg-white/5 rounded">Supabase → Storage → New bucket → avatars → Public bucket ON</span>.
              </p>
            </div>
          </motion.div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Profile Info Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="text-center p-12 relative overflow-hidden group border-white/5 bg-[#0a0a0a]">
            <div className="absolute top-0 right-0 p-8">
                <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center">
                    <span className="text-[10px] font-mono font-bold text-zinc-700">MT-P</span>
                </div>
            </div>
            
            <div className="relative inline-block mb-8">
              <div className="w-44 h-44 rounded-full p-1 bg-gradient-to-br from-accent/40 to-transparent shadow-2xl relative">
                  <div className="w-full h-full rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden relative">
                    {(previewUrl || form.avatar_url) ? (
                      <img src={previewUrl || form.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                        <span className="text-6xl font-display font-medium text-white">{form.fullName?.[0] || user?.email?.[0]}</span>
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
              </div>
              <label 
                className="absolute bottom-2 right-2 p-3.5 bg-accent text-white rounded-full shadow-2xl z-10 cursor-pointer hover:scale-110 active:scale-95 transition-all"
              >
                <Camera className="w-5 h-5" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>

            <div className="space-y-4">
                <h3 className="text-2xl font-display font-bold text-white tracking-tight">{form.fullName || 'New Operator'}</h3>
                <div className="flex items-center justify-center gap-2 text-zinc-500 text-[11px] font-mono bg-white/5 px-3 py-1.5 rounded-full border border-white/5 mx-auto w-fit">
                    <Mail className="w-3.5 h-3.5" />
                    {user?.email}
                </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-8">
              <Badge className="bg-accent/10 text-accent border border-accent/20 px-4 py-1.5 text-[10px] font-semibold">
                {profile?.role === 'admin' ? 'SYSTEM ADMIN' : 'ELITE OPERATOR'}
              </Badge>
            </div>
          </Card>

          <Card className="p-8 border-white/5 bg-[#0a0a0a]">
            <h4 className="text-[11px] font-bold uppercase tracking-[.2em] text-zinc-600 mb-8 px-2">Operational Metrics</h4>
            <div className="space-y-8">
              <StatRow icon={Zap} label="Momentum Score" value="A-Grade" color="text-accent" />
              <StatRow icon={MessageSquare} label="Synapse Nodes" value="42 Active" />
              <StatRow icon={Calendar} label="Access Granted" value={new Date(profile?.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} />
            </div>
          </Card>
        </div>

        {/* Profile Forms */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="p-10 border-white/5">
            <div className="flex items-center gap-4 mb-10">
                <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20">
                    <UserIcon className="w-5 h-5 text-accent" />
                </div>
                <div>
                     <h3 className="text-xl font-display font-bold text-white tracking-tight leading-none">Identity Parameters</h3>
                     <p className="text-[11px] font-bold uppercase text-zinc-600 mt-2 tracking-widest leading-none">Primary Authentication Data</p>
                </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Full Name</label>
                    <Input 
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        className="bg-zinc-900 border-white/5 h-14 text-[15px] font-medium focus:bg-zinc-800 transition-colors"
                        placeholder="John Doe"
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 ml-1">System Identifier</label>
                    <Input 
                        value={user?.email || ''} 
                        disabled 
                        className="bg-zinc-900 border-white/5 h-14 text-[15px] font-medium opacity-50 cursor-not-allowed border-dashed select-none"
                    />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Objective Summary & Bio</label>
                <TextArea 
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    className="bg-zinc-900 border-white/5 min-h-[160px] text-[15px] font-medium leading-relaxed focus:bg-zinc-800 transition-colors"
                    placeholder="Define your mission statement and personal bio..."
                />
              </div>

              <div className="pt-6 flex justify-end">
                <Button onClick={handleUpdate} disabled={updating} className="px-10 h-14 text-sm font-semibold shadow-xl shadow-accent/20">
                  {updating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> SYNCHRONIZING</>
                  ) : (
                    <><Check className="w-4 h-4 mr-3" /> UPDATE IDENTITY</>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-10 border-white/5">
             <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                    <Shield className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                     <h3 className="text-xl font-black text-white uppercase italic leading-none">Security Ops</h3>
                     <p className="text-[10px] font-black uppercase text-zinc-600 mt-1 tracking-widest">Account Encryption & Safeguards</p>
                </div>
            </div>
            
            <div className="space-y-6">
              <SecuritySetting 
                icon={Lock} 
                title="Two-Factor Authentication" 
                desc="Add an extra layer of structural security"
                status="inactive"
              />
              <SecuritySetting 
                icon={Globe} 
                title="Public Telemetry" 
                desc="Allow other operators to view your analytics"
                status="active"
              />
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
    <div className="flex items-center justify-between group px-2">
      <div className="flex items-center gap-3">
        <Icon className={cn("w-4 h-4 text-zinc-600 group-hover:text-accent transition-colors", color)} />
        <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
      </div>
      <span className="text-[11px] font-mono font-bold text-white uppercase">{value}</span>
    </div>
  );
}

function SecuritySetting({ icon: Icon, title, desc, status }: any) {
  return (
    <div className="flex items-center justify-between p-6 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-accent/30 transition-all group cursor-pointer hover:bg-accent/[0.02]">
        <div className="flex items-center gap-5">
            <div className="p-3.5 rounded-2xl bg-zinc-800/50 border border-white/5 group-hover:bg-accent/10 group-hover:border-accent/20 transition-all">
                <Icon className="w-5 h-5 text-zinc-400 group-hover:text-accent transition-colors" />
            </div>
            <div>
                <p className="text-sm font-bold text-white tracking-tight">{title}</p>
                <p className="text-[11px] text-zinc-500 font-medium mt-1 uppercase tracking-widest">{desc}</p>
            </div>
        </div>
        <div className={cn(
            "w-11 h-6 rounded-full relative p-1 transition-all",
            status === 'active' ? "bg-accent/20" : "bg-zinc-800"
        )}>
            <div className={cn(
                "w-4 h-4 rounded-full transition-all",
                status === 'active' ? "bg-accent translate-x-5" : "bg-zinc-600"
            )} />
        </div>
    </div>
  );
}
