import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Input } from '../../components/ui/Layout';
import { Moon, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';



export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // ── Email / password login ─────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        }
        throw error;
      }

      if (data.session) navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden selection:bg-accent/40">
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />

      {/* Background glows */}
      <div className="absolute top-1/4 -left-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="absolute bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/20">
            <Moon className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-zinc-400">Continue building momentum.</p>
        </div>

        <Card className="rounded-3xl border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">

          {/* ── Email form ── */}
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm font-medium text-red-400">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-2xl border-white/10 bg-white/5 pl-10 text-sm focus:border-accent/50"
                  required
                  autoComplete="email"
                  inputMode="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-2xl border-white/10 bg-white/5 pl-10 pr-10 text-sm focus:border-accent/50"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors hover:text-zinc-300"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-violet-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          {/* ── Footer ── */}
          <p className="mt-6 text-center text-sm text-zinc-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-accent transition-colors hover:text-accent/80">
              Sign up free
            </Link>
          </p>
        </Card>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-600">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secured by Supabase · End-to-end encrypted
        </div>
      </div>
    </div>
  );
}
