import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, AlertCircle, Loader2, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, authModalMode, setAuthModalMode, login, register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authModalMode === 'login') {
        await login(email, password);
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        await register({ name, email, password, confirmPassword, phone });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click demo logins
  const fillDemoAccount = async (role: 'customer' | 'admin') => {
    setError(null);
    setLoading(true);
    try {
      if (role === 'admin') {
        await login('admin@imovies.com', 'AdminPass123!');
      } else {
        await login('user@imovies.com', 'UserPass123!');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="p-6 bg-neutral-950 border-b border-neutral-800 text-center">
          <h3 className="text-xl font-extrabold text-white tracking-tight">
            {authModalMode === 'login' ? 'Welcome Back to IMovies' : 'Create Your Account'}
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            {authModalMode === 'login'
              ? 'Sign in to access your cinema bookings and profile'
              : 'Join IMovies to book seats, access premium formats, and track passes'}
          </p>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900 rounded-xl mt-4 border border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                authModalMode === 'login' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('register');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                authModalMode === 'register' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Quick Demo Logins Bar */}
        <div className="px-6 pt-4 pb-2 bg-neutral-900/40 border-b border-neutral-850">
          <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider block mb-2">
            One-Click Demo Credentials
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => fillDemoAccount('customer')}
              className="px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-[11px] font-semibold text-neutral-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserIcon className="w-3 h-3 text-red-400" />
              <span>Customer Demo</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => fillDemoAccount('admin')}
              className="px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-3 h-3 text-amber-400" />
              <span>Admin Demo</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alexander Scott"
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>

          {authModalMode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white text-xs focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-950 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : authModalMode === 'login' ? (
              'Sign In to IMovies'
            ) : (
              'Create IMovies Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
