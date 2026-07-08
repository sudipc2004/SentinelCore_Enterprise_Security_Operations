import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  FileSearch,
  Lock,
  Mail,
  ShieldAlert,
  User,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedLayout from './layouts/ProtectedLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Teams from './pages/Teams';
import Users from './pages/Users';

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : children;
}

function ProtectedRoute({ children }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}

function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get('/api/audit-logs', {
          params: { page, size: 15, sortBy: 'timestamp', direction: 'desc' },
        });
        setLogs(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
      } catch (err) {
        console.error(err);
        setError('Unable to retrieve audit trail records.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">Audit Logs</h1>
        <p className="text-sm text-gray-400 mt-1 font-mono">Review authentication and administrative activity</p>
      </div>

      <div className="glass-card border border-dark-border overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-mono text-gray-400">Loading immutable event stream...</p>
          </div>
        ) : error ? (
          <div className="m-6 p-4 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <FileSearch className="w-8 h-8 text-gray-500 mx-auto mb-3" />
            <p className="text-sm font-mono text-gray-400">No audit events recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border bg-slate-900/35 text-[10px] uppercase font-mono tracking-wider text-gray-400">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Actor</th>
                  <th className="py-4 px-6">Action</th>
                  <th className="py-4 px-6">Area</th>
                  <th className="py-4 px-6">Origin</th>
                  <th className="py-4 px-6">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-xs">
                {logs.map((log) => {
                  const isFailedLogin = log.action === 'LOGIN_FAILED';

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/15 transition-colors duration-150">
                      <td className="py-4 px-6 text-gray-400 font-mono whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'UNKNOWN'}
                      </td>
                      <td className="py-4 px-6 text-gray-300 font-mono">{log.userEmail || 'SYSTEM'}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
                            isFailedLogin
                              ? 'bg-red-500/15 text-red-300 border-red-500/40'
                              : 'bg-primary/10 text-primary border-primary/20'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-300 font-mono">{log.module || 'CORE'}</td>
                      <td className="py-4 px-6 text-gray-400 font-mono">{log.ipAddress || 'N/A'}</td>
                      <td className="py-4 px-6 text-gray-300 max-w-lg">{log.description || 'No description provided.'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && totalPages > 0 && (
          <div className="p-4 border-t border-dark-border/40 bg-slate-900/10 flex justify-between items-center text-xs font-mono text-gray-400">
            <span>Total Events: {totalElements}</span>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={page === 0}
                className="p-1 rounded bg-slate-800 border border-dark-border hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span>Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                disabled={page === totalPages - 1}
                className="p-1 rounded bg-slate-800 border border-dark-border hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Profile() {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.email || !formData.department || !formData.password) {
      setError('Name, email, department, and password are required.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: formData.name,
        email: formData.email,
        department: formData.department,
        password: formData.password,
        role: user.role,
      });
      setFormData((prev) => ({ ...prev, password: '' }));
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Profile update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">My Profile</h1>
        <p className="text-sm text-gray-400 mt-1 font-mono">Update your account details and department</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 border border-dark-border space-y-5">
        {error && (
          <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-sm"
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-sm"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg glass-input text-sm"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Current Role</label>
            <div className="px-4 py-2.5 rounded-lg bg-slate-900/40 border border-dark-border text-sm font-mono text-primary">
              {user?.role}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter at least 6 characters to confirm updates"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg glass-input text-sm"
              disabled={saving}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-primary text-black font-semibold text-sm hover:bg-primary-hover transition-all duration-150 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {saving ? 'Updating profile...' : 'Update profile'}
        </button>
      </form>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="glass-card p-8 border border-dark-border text-center max-w-md">
        <ShieldAlert className="w-10 h-10 text-warning mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Route Not Found</h1>
        <p className="text-sm text-gray-400 font-mono">The page you requested does not exist.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <Teams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN', 'ANALYST']}>
                  <AuditLogs />
                </RoleRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <NotFound />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
