import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button, Input } from '../../components/ui/Layout';
import { Moon, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "https://aistudio.google.com",
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      
      if (data.user) {
        setShowSuccess(true);
      }
    } catch (err: any) {
      if (err.message === 'User already registered') {
        setError('An account with this email already exists.');
      } else {
        setError(err.message || 'An error occurred during sign up');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden selection:bg-accent/40">
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
      
      {/* Background Glows */}
      <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse delay-1000" />

      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full max-w-md relative z-10 text-center"
          >
            <Card className="p-12 space-y-8 bg-zinc-900/20 border-white/5 backdrop-blur-2xl">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10"
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </motion.div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">PROTOCOL INITIATED</h2>
                <p className="text-zinc-500 font-medium uppercase tracking-widest text-[10px] leading-relaxed">
                  Encryption verification required. Check <span className="text-white underline decoration-accent/40">{email}</span> for authorization link.
                </p>
              </div>
              <div className="pt-4">
                <Button 
                  onClick={() => navigate('/login')}
                  className="w-full h-14 font-black uppercase tracking-widest italic"
                >
                  Return to Port
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
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
                    Join<span className="text-accent underline decoration-4 underline-offset-8 decoration-accent/30 ml-2">MoTrack</span>
                </h1>
                <p className="text-zinc-500 mt-6 font-bold uppercase tracking-[.2em] text-[10px]">Initialize your productivity parameters</p>
            </div>

            <Card className="p-10 border-white/5 bg-white/[0.02] backdrop-blur-2xl">
              <form onSubmit={handleSignUp} className="space-y-6">
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
                  <label className="text-[10px] font-black uppercase tracking-[.3em] text-zinc-600 ml-1">Identity Manifest</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-accent transition-colors" />
                    <Input
                      type="text"
                      placeholder="Operator Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-12 bg-white/5 border-white/5 h-12 focus:border-accent/40"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[.3em] text-zinc-600 ml-1">Universal Identifier</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-accent transition-colors" />
                    <Input
                      type="email"
                      placeholder="operator@motrack.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 bg-white/5 border-white/5 h-12 focus:border-accent/40"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[.3em] text-zinc-600 ml-1">Secure Passkey</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-accent transition-colors" />
                    <Input
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 bg-white/5 border-white/5 h-12 focus:border-accent/40"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 font-black uppercase tracking-[.2em] relative overflow-hidden group" 
                  disabled={loading}
                >
                  <div className="absolute inset-0 bg-accent group-hover:scale-105 transition-transform" />
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                  ) : (
                    <span className="relative z-10 flex items-center justify-center italic">
                      Initialize Account
                      <ArrowRight className="ml-3 w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-10 pt-8 border-t border-white/5 text-center">
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-600">
                  Already authorized?{' '}
                  <Link to="/login" className="text-accent hover:text-white transition-colors">
                    Access System
                  </Link>
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
