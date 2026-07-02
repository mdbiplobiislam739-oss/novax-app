import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { store } from '../lib/store';
import { auth } from '../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import novaxLogo from '../assets/images/novax_logo_1782982838843.jpg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMsg('');
    const cleanEmail = email.trim();
    
    // Attempt authentication via Firebase
    try {
      await login(cleanEmail, password);
      // Removed navigate from here, relying on useEffect
    } catch (e: any) {
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else {
        setError(e.message || 'Failed to login');
      }
    }
    setIsSubmitting(false);
  };

  const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setError('');
      setMsg('Password reset link sent to your email.');
    } catch (e: any) {
      setError(e.message || 'Error sending password reset email.');
      setMsg('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-0 md:p-4 bg-[var(--color-bg-base)]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-primary/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-gold/10 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full h-screen md:h-auto md:max-w-[400px] bg-[var(--color-bg-card)] md:glass-panel p-8 md:rounded-3xl relative z-10 flex flex-col justify-center"
      >
        <div className="flex flex-col items-center mb-8">
          <img src={novaxLogo} alt="NovaX" className="w-32 h-32 rounded-full mb-4 drop-shadow-[0_0_15px_rgba(255,90,0,0.6)]" />
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-text-muted mt-1 text-sm">Sign in to continue earning</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-xl mb-6 text-sm text-center border border-red-500/20">
            {error}
          </div>
        )}

        {msg && (
          <div className="bg-green-500/10 text-green-500 p-3 rounded-xl mb-6 text-sm text-center border border-green-500/20">
            {msg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted px-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
              <input
                type="email"
                placeholder="Enter email"
                className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted px-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
              <input
                type="password"
                placeholder="Enter password"
                className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-card)] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-cyan-400 to-yellow-500 text-black font-bold py-3.5 rounded-xl text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] mt-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-text-muted flex flex-col gap-3">
          <span>
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-primary font-medium hover:underline">
              Register now
            </Link>
          </span>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-text-muted hover:text-brand-primary transition-colors text-sm font-medium"
          >
            Forgot Password? Reset via Email
          </button>
          <a
            href={store.getState().supportLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-brand-primary transition-colors text-xs"
          >
            Or Contact Support
          </a>
        </p>
      </motion.div>
    </div>
  );
}
