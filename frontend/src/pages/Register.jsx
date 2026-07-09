import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../layouts/AuthLayout';
import { User, Mail, Lock, Briefcase, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!name) {
      setError('Full Name is required');
      return false;
    }
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
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!department) {
      setError('Department is required');
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
      await register(name, email, password, role, department);
      alert('Registration successful. Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Full Name"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-sm"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@sentinelcore.in"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-sm"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">Department</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Security Operations"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-sm"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">Role</label>
          <div className="relative">
            <ShieldAlert className="absolute left-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-sm appearance-none cursor-pointer bg-slate-950 text-white"
              disabled={loading}
            >
              <option value="VIEWER">VIEWER</option>
              <option value="ANALYST">ANALYST</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-sm"
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-primary text-black font-semibold text-sm hover:bg-primary-hover transition-all duration-150 cursor-pointer shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
              <span>Creating account...</span>
            </>
          ) : (
            <span>Register</span>
          )}
        </button>

        <div className="text-center mt-4">
          <p className="text-xs text-gray-400">
            Already registered?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold font-mono">
              Log In
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
