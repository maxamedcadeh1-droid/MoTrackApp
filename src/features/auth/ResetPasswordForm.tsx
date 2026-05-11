import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '../../components/ui/Layout';
import { Moon, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid reset token in the URL
    const hash = window.location.hash;
    if (!hash.includes('type=recovery')) {
      setTokenValid(false);
      setError('Invalid or expired reset link. Please request a new one.');
    }
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setShowSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden selection:bg-accent/40">
        <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
        
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse delay-1000" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10 text-center"
        >
          <Card className="p-8 space-y-6 bg-white/[0.03] border-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/20">
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-bold text-white tracking-tight">Link expired</h2>
              <p className="text-zinc-400 font-sans text-sm leading-relaxed">
                {error}
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={() => navigate('/login')}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200 font-sans"
              >
                Back to sign in
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden selection:bg-accent/40">
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
      
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse delay-1000" />

      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full max-w-md relative z-10 text-center"
          >
            <Card className="p-8 space-y-6 bg-white/[0.03] border-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/20">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/10"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <div className="space-y-3">
                <h2 className="font-display text-2xl font-bold text-white tracking-tight">Password reset successful</h2>
                <p className="text-zinc-400 font-sans text-sm leading-relaxed">
                  Your password has been updated. You'll be redirected to sign in shortly.
                </p>
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
              <h1 className="font-display text-4xl font-bold tracking-tight text-white mb-3">
                Create new password
              </h1>
              <p className="text-zinc-400 font-sans text-sm leading-relaxed">
                Enter a new password for your account.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="p-8 border-white/10 bg-white/[0.03] backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/20">
                <form onSubmit={handleResetPassword} className="space-y-6">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-medium"
                    >
                      {error}
                    </motion.div>
                  )}
                  
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-300 font-sans">New password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 transition-colors group-focus-within:text-accent" />
                      <Input
                        type="password"
                        placeholder="Create a new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl h-12 focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all font-sans text-white placeholder:text-zinc-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-300 font-sans">Confirm password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 transition-colors group-focus-within:text-accent" />
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl h-12 focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all font-sans text-white placeholder:text-zinc-500"
                        required
                      />
                    </div>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200 font-sans" 
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        <span className="flex items-center justify-center">
                          Reset password
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Card>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center mt-8 text-xs text-zinc-500 font-sans"
            >
              Protected by secure Supabase authentication.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
