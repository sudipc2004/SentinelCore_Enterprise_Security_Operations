import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedLayout from './layouts/ProtectedLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Teams from './pages/Teams';
import Users from './pages/Users';
import Dashboard from './pages/Dashboard';
import AuditLogs from './pages/AuditLogs';
import Alerts from './pages/Alerts';
import Incidents from './pages/Incidents';
import Threats from './pages/Threats';
import Vulnerabilities from './pages/Vulnerabilities';
import Assets from './pages/Assets';
import Logs from './pages/Logs';
import ThreatIntel from './pages/ThreatIntel';
import Reports from './pages/Reports';
import Playbooks from './pages/Playbooks';

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen sc-shell flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : children;
}

function ProtectedRoute({ children }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="glass-card sc-scale-in max-w-md border border-dark-border p-8 text-center">
        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-warning" />
        <h1 className="mb-2 text-xl font-bold text-white">Route Not Found</h1>
        <p className="font-mono text-sm text-slate-400">The page you requested does not exist.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
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
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
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
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            <Route
              path="/incidents"
              element={
                <ProtectedRoute>
                  <Incidents />
                </ProtectedRoute>
              }
            />

            <Route
              path="/threats"
              element={
                <ProtectedRoute>
                  <Threats />
                </ProtectedRoute>
              }
            />

            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <Alerts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vulnerabilities"
              element={
                <ProtectedRoute>
                  <Vulnerabilities />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets"
              element={
                <ProtectedRoute>
                  <Assets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <ProtectedRoute>
                  <Logs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/threat-intel"
              element={
                <ProtectedRoute>
                  <ThreatIntel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/playbooks"
              element={
                <ProtectedRoute>
                  <Playbooks />
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
    </ToastProvider>
  );
}

export default App;
