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
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center space-x-2 bg-red-950/70 border border-red-500/70 text-red-200 p-3 rounded-lg text-sm shadow-lg shadow-red-950/30">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@sentinelcore.in"
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-sm ${
                error ? 'border-red-500/70 focus:border-red-500 focus:shadow-red-500/20' : ''
              }`}
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400">Password</label>
            <button
              type="button"
              onClick={() => alert("Password reset is currently placeholder. Please ask your administrator to reset it.")}
              className="text-xs text-primary hover:underline hover:text-primary-hover font-mono"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full pl-10 pr-10 py-2.5 rounded-lg glass-input text-sm ${
                error ? 'border-red-500/70 focus:border-red-500 focus:shadow-red-500/20' : ''
              }`}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-primary text-black font-semibold text-sm hover:bg-primary-hover transition-all duration-150 cursor-pointer shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
              <span>Logging in...</span>
            </>
          ) : (
            <span>Log In</span>
          )}
        </button>

        <div className="text-center mt-4">
          <p className="text-xs text-gray-400">
            New here?{' '}
            <Link to="/register" className="text-primary hover:underline font-semibold font-mono">
              Create Account
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
