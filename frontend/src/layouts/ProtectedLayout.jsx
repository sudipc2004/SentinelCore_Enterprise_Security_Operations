import React from 'react';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Network, LogOut, Terminal } from 'lucide-react';

export default function ProtectedLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
        </div>
        <div className="flex items-center space-x-2 text-gray-400 font-mono text-sm">
          <Terminal className="w-4 h-4 text-primary animate-pulse" />
          <span>Loading your session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const menuItems = [
    { name: 'User Management', path: '/users', icon: Users },
    { name: 'Team Management', path: '/teams', icon: Network },
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-gray-200 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-dark-border bg-slate-900/40 backdrop-blur-md flex flex-col z-20">
        <div className="p-6 border-b border-dark-border flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-wide text-white">SENTINEL<span className="text-primary font-light">CORE</span></h2>
            <span className="text-xs text-gray-500 font-mono">v1.0.0-SPRINT1</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-dark-border bg-slate-900/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-secondary/20 border border-secondary/35 flex items-center justify-center text-secondary font-bold text-lg uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <div className="flex items-center space-x-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs text-gray-400 font-mono truncate">{user.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/15 text-primary border-l-2 border-primary'
                    : 'text-gray-400 hover:bg-slate-800/40 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-dark-border">
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-dark-border bg-slate-900/20 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400 font-mono">Status:</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25 font-mono">ONLINE</span>
          </div>
          <div className="text-xs text-gray-400 font-mono">
            Active: {user.email}
          </div>
        </header>

        {/* Page Content wrapper */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
