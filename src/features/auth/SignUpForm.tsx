import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button, Input } from '../../components/ui/Layout';
import { Moon, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

// ── OAuth providers (shared with LoginForm) ────────────────────────────────
const OAUTH_PROVIDERS = [
  {
    id: 'google' as const,
    label: 'Google',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: 'apple' as const,
    label: 'Apple',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden="true">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    ),
  },
  {
    id: 'facebook' as const,
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
      </svg>
    ),
  },
] as const;

type OAuthProvider = typeof OAUTH_PROVIDERS[number]['id'];

// ── Password strength helper ───────────────────────────────────────────────
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (pw.length === 0) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 3) return { score, label: 'Fair', color: 'bg-amber-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
}

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const pwStrength = getPasswordStrength(password);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: { full_name: fullName.trim() },
        },
      });

      if (error) throw error;
      if (data.user) setShowSuccess(true);
    } catch (err: any) {
      if (err.message === 'User already registered') {
        setError('An account with this email already exists.');
      } else {
        setError(err.message || 'An error occurred during sign up.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: OAuthProvider) => {
    setOauthLoading(provider);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : undefined,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || `${provider} sign-in failed.`);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden selection:bg-accent/40">
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
      <div className="absolute top-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="absolute bottom-1/4 -left-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]" />

      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="relative z-10 w-full max-w-md text-center">
            <Card className="rounded-3xl border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-2xl">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white">Check your email</h2>
              <p className="mt-3 text-sm text-zinc-400">
                We sent a verification link to <span className="font-semibold text-white">{email}</span>
              </p>
              <button onClick={() => navigate('/login')}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5">
                Back to sign in <ArrowRight className="h-4 w-4" />
              </button>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="relative z-10 w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/20">
                <Moon className="h-8 w-8 text-white" />
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-white">Create your account</h1>
              <p className="mt-2 text-sm text-zinc-400">Start building momentum today.</p>
            </div>

            <Card className="rounded-3xl border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">
              {/* OAuth */}
              <div className="space-y-3">
                {OAUTH_PROVIDERS.map((provider) => (
                  <button key={provider.id} type="button" onClick={() => handleOAuth(provider.id)}
                    disabled={!!oauthLoading || loading}
                    className="flex h-12 w-full touch-manipulation items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                    {oauthLoading === provider.id ? <Loader2 className="h-4 w-4 animate-spin" /> : provider.icon}
                    Continue with {provider.label}
                  </button>
                ))}
              </div>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/8" />
                <span className="text-xs font-medium text-zinc-600">or sign up with email</span>
                <div className="h-px flex-1 bg-white/8" />
              </div>

              <form onSubmit={handleSignUp} className="space-y-4" noValidate>
                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm font-medium text-red-400">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Full name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                    <Input type="text" placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      className="h-12 rounded-2xl border-white/10 bg-white/5 pl-10 text-sm focus:border-accent/50" required autoComplete="name" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                    <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-2xl border-white/10 bg-white/5 pl-10 text-sm focus:border-accent/50" required autoComplete="email" inputMode="email" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                    <Input type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-2xl border-white/10 bg-white/5 pl-10 pr-10 text-sm focus:border-accent/50" required autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300" aria-label={showPassword ? 'Hide' : 'Show'}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Password strength */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map((i) => (
                          <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300', i <= pwStrength.score ? pwStrength.color : 'bg-white/8')} />
                        ))}
                      </div>
                      <p className={cn('text-xs font-semibold', pwStrength.score <= 1 ? 'text-red-400' : pwStrength.score <= 3 ? 'text-amber-400' : 'text-emerald-400')}>
                        {pwStrength.label} password
                      </p>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading || !!oauthLoading}
                  className="flex h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-violet-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-zinc-500">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-accent hover:text-accent/80 transition-colors">Sign in</Link>
              </p>
            </Card>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-600">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secured by Supabase · End-to-end encrypted
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

