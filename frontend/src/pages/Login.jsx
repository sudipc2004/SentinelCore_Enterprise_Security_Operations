import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../layouts/AuthLayout';
import { Eye, EyeOff, Lock, Mail, AlertTriangle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email) {
      setError('Email address is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-5 sc-fade-in">
        {error && (
          <div className="flex items-center space-x-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200 shadow-lg shadow-red-950/30">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Operator ID</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@sentinelcore.in"
              className={`glass-input w-full px-4 py-3 pl-11 text-sm ${
                error ? 'border-red-500/70 focus:border-red-500 focus:shadow-red-500/20' : ''
              }`}
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Security Key</label>
            <button
              type="button"
              onClick={() => alert("Please ask your administrator to reset the Password.")}
              className="text-xs font-semibold text-sky-300 transition hover:text-sky-200"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`glass-input w-full px-4 py-3 pl-11 pr-11 text-sm ${
                error ? 'border-red-500/70 focus:border-red-500 focus:shadow-red-500/20' : ''
              }`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="sc-button-primary w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              <span>Logging in...</span>
            </>
          ) : (
            <span>Sign In to Dashboard</span>
          )}
        </button>

        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400">
            New here?{' '}
            <Link to="/register" className="font-semibold text-sky-300 transition hover:text-sky-200">
              Create Account
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
