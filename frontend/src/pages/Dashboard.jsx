import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, Network, UserCheck, Activity, AlertTriangle, ShieldAlert, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        console.error("Error fetching stats", err);
        setError("Could not retrieve system dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-mono text-gray-400">Loading system metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg flex items-center space-x-2">
        <AlertTriangle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  const { totalUsers, activeUsers, totalTeams, recentUsers, recentTeams, recentLogins } = stats;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1 font-mono">Overview of user identities, operational groups, and audit trails</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="glass-card p-6 border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Total Users</p>
            <h3 className="text-3xl font-bold text-white mt-1">{totalUsers}</h3>
          </div>
          <div className="p-3 bg-secondary/15 rounded-lg border border-secondary/25">
            <Users className="w-6 h-6 text-secondary" />
          </div>
        </div>

        {/* Active Users */}
        <div className="glass-card p-6 border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Active Users</p>
            <h3 className="text-3xl font-bold text-emerald-400 mt-1">{activeUsers}</h3>
          </div>
          <div className="p-3 bg-emerald-500/15 rounded-lg border border-emerald-500/25">
            <UserCheck className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        {/* Total Teams */}
        <div className="glass-card p-6 border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Security Teams</p>
            <h3 className="text-3xl font-bold text-white mt-1">{totalTeams}</h3>
          </div>
          <div className="p-3 bg-primary/15 rounded-lg border border-primary/25">
            <Network className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* User Profile */}
        <div className="glass-card p-6 border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Role</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide font-mono ${
              user?.role === 'ADMIN' 
                ? 'bg-red-500/15 text-red-400 border border-red-500/35 shadow-[0_0_10px_rgba(239,68,68,0.25)]'
                : user?.role === 'ANALYST'
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/35'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/35'
            }`}>
              {user?.role}
            </span>
          </div>
          <div className="p-3 bg-slate-800/50 rounded-lg border border-dark-border">
            <Shield className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Registrations */}
        <div className="glass-card p-6 border border-dark-border flex flex-col h-[400px]">
          <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-dark-border">
            <Users className="w-5 h-5 text-secondary" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Recent Registrations</h4>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {recentUsers && recentUsers.length > 0 ? (
              recentUsers.map((regUser) => (
                <div key={regUser.id} className="p-3 bg-slate-900/40 border border-dark-border rounded-lg flex flex-col space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-white truncate max-w-[150px]">{regUser.name}</span>
                    <span className="text-[9px] font-mono bg-slate-800 text-gray-400 px-1.5 py-0.5 rounded border border-dark-border">
                      {regUser.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 truncate">{regUser.email}</span>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-1 pt-1 border-t border-dark-border/20">
                    <span>{regUser.department}</span>
                    <span>{new Date(regUser.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs font-mono text-gray-500 text-center mt-12">No recent registrations.</p>
            )}
          </div>
        </div>

        {/* Recently Created Teams */}
        <div className="glass-card p-6 border border-dark-border flex flex-col h-[400px]">
          <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-dark-border">
            <Network className="w-5 h-5 text-primary" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Recently Formed Teams</h4>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {recentTeams && recentTeams.length > 0 ? (
              recentTeams.map((team) => (
                <div key={team.id} className="p-3 bg-slate-900/40 border border-dark-border rounded-lg flex flex-col space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-white truncate">{team.teamName}</span>
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">
                      {team.department}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate mt-1">{team.description || 'No description provided'}</p>
                  <div className="text-[10px] text-gray-500 font-mono mt-1 pt-1 border-t border-dark-border/20">
                    Created: {new Date(team.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs font-mono text-gray-500 text-center mt-12">No recent teams.</p>
            )}
          </div>
        </div>

        {/* Latest Login Activity */}
        <div className="glass-card p-6 border border-dark-border flex flex-col h-[400px]">
          <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-dark-border">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Latest Login Activity</h4>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {recentLogins && recentLogins.length > 0 ? (
              recentLogins.map((log) => {
                const isSuccess = log.action === 'LOGIN_SUCCESS';
                return (
                  <div key={log.id} className="p-3 bg-slate-900/40 border border-dark-border rounded-lg flex flex-col space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-gray-300 font-mono truncate max-w-[155px]">
                        {log.userEmail || 'Unknown Account'}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center ${
                        isSuccess ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {isSuccess ? <CheckCircle className="w-2.5 h-2.5 mr-0.5 inline" /> : <ShieldAlert className="w-2.5 h-2.5 mr-0.5 inline" />}
                        {isSuccess ? 'OK' : 'FAIL'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
                      <span>IP: {log.ipAddress}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs font-mono text-gray-500 text-center mt-12">No login logs recorded.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
