import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button, Input } from '../../components/ui/Layout';
import { Moon, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
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
                <h2 className="font-display text-2xl font-bold text-white tracking-tight">Check your email</h2>
                <p className="text-zinc-400 font-sans text-sm leading-relaxed">
                  We've sent a password reset link to <span className="text-white font-medium">{email}</span>
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
                Reset password
              </h1>
              <p className="text-zinc-400 font-sans text-sm leading-relaxed">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="p-8 border-white/10 bg-white/[0.03] backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/20">
                <form onSubmit={handleForgotPassword} className="space-y-6">
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
                    <label className="text-sm font-medium text-zinc-300 font-sans">Email address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 transition-colors group-focus-within:text-accent" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        'Send reset link'
                      )}
                    </Button>
                  </motion.div>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                  <Link to="/login" className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors font-sans">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to sign in
                  </Link>
                </div>
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
