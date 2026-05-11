import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button, Input } from '../../components/ui/Layout';
import { Moon, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('Please confirm your email address. Check your inbox for verification.');
        }
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error('Invalid email or password. Trace failed.');
        }
        throw error;
      }
      
      if (data.session) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden selection:bg-accent/40">
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
      
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse delay-1000" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-[2rem] items-center justify-center shadow-2xl shadow-purple-500/20 mb-8 border border-white/10"
          >
            <Moon className="text-white w-10 h-10 animate-pulse" />
          </motion.div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
            MoTrack<span className="text-accent underline decoration-4 underline-offset-8 decoration-accent/30 ml-2">OS</span>
          </h1>
          <p className="text-zinc-500 mt-6 font-bold uppercase tracking-[.2em] text-[10px]">Authorization Required to Enter System</p>
        </div>

        <Card className="p-10 border-white/5 bg-white/[0.02] backdrop-blur-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest italic"
              >
                Error: {error}
              </motion.div>
            )}
            
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[.3em] text-zinc-600 ml-1">Universal Identifier</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors group-focus-within:text-accent" />
                <Input
                  type="email"
                  placeholder="operator@motrack.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 bg-white/5 border-white/5 h-12 focus:border-accent/40 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-[.3em] text-zinc-600">Access Key</label>
                <Link to="#" className="text-[9px] font-black uppercase tracking-widest text-zinc-700 hover:text-accent transition-colors">Forgot Key?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 transition-colors group-focus-within:text-accent" />
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 bg-white/5 border-white/5 h-12 focus:border-accent/40 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-sm font-black uppercase tracking-[.2em] relative overflow-hidden group" 
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-accent via-white/20 to-accent opacity-0 group-hover:opacity-100 transition-opacity animate-shimmer" />
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="relative z-10 flex items-center justify-center italic">
                  Authorize & Enter
                  <ArrowRight className="ml-3 w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-600">
              Inaccurate permissions?{' '}
              <Link to="/signup" className="text-accent hover:text-white transition-colors">
                Request System Access
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-center mt-12 text-[10px] font-black text-zinc-700 uppercase tracking-[.5em]">
          &copy; 2024 MOTRACK PREMIUM OPERATING SYSTEM
        </p>
      </motion.div>
    </div>
  );
}
