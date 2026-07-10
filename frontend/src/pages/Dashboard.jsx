import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Shield,
  Network,
  UserCheck,
  Activity,
  AlertTriangle,
  ShieldAlert,
  Cpu,
  HardDrive,
  Zap,
  RefreshCw,
  Terminal,
  Server,
  Globe,
  AlertOctagon
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch initial database statistics from backend
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
      setError('');
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Could not retrieve system dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh stats every 8 seconds for real-time diagnostics
    const interval = setInterval(fetchStats, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
        <p className="text-sm font-mono text-slate-400">Loading system metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="sc-panel flex flex-col items-center justify-center border border-red-500/25 bg-red-500/10 p-8 text-center max-w-md mx-auto rounded-2xl">
        <AlertTriangle className="h-10 w-10 text-red-400 mb-3 animate-bounce" />
        <h3 className="text-md font-bold text-white mb-1">Sync Connection Error</h3>
        <p className="text-xs font-mono text-red-300 leading-relaxed mb-4">{error || 'Could not map database metrics.'}</p>
        <button
          onClick={fetchStats}
          className="sc-button-secondary px-4 py-2 text-xs font-semibold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Determine threat level color
  const getThreatColor = (score) => {
    if (score < 0.3) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score < 0.6) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="space-y-6 sc-fade-in">
      {/* SOC Header Panel */}
      <div className="sc-panel flex flex-col gap-4 p-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="sc-badge border-sky-500/20 bg-sky-500/10 text-sky-300">SOC Command Center</span>
            <span className="sc-badge border-emerald-500/20 bg-emerald-500/10 text-emerald-300">Live telemetry</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Security Operations Overview</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Real-time threat monitoring, live telemetry feeds, and audit streams presented in a low-noise enterprise cockpit.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Feed online</span>
        </div>
      </div>

      {/* Grid of Key Statistics Card */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Total Logs */}
        <div className="sc-card flex items-center justify-between p-6 transition duration-200 hover:-translate-y-0.5 hover:border-sky-400/30">
          <div>
            <p className="sc-text-kicker">Total logs</p>
            <h3 className="mt-1 text-3xl font-bold text-white">{stats.totalLogs}</h3>
            <span className="mt-2 inline-block text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">LIVE STREAM</span>
          </div>
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-sky-300">
            <Terminal className="h-6 w-6" />
          </div>
        </div>

        {/* Active Alerts */}
        <div className="sc-card flex items-center justify-between p-6 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-400/30">
          <div>
            <p className="sc-text-kicker">Active alerts</p>
            <h3 className="mt-1 text-3xl font-bold text-indigo-300">{stats.activeAlerts}</h3>
            <span className="mt-2 inline-block text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">AWAITING TRIAGE</span>
          </div>
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-indigo-300">
            <Shield className="h-6 w-6" />
          </div>
        </div>

        {/* Active Incidents */}
        <div className="sc-card flex items-center justify-between p-6 transition duration-200 hover:-translate-y-0.5 hover:border-amber-400/30">
          <div>
            <p className="sc-text-kicker">Active Incidents</p>
            <h3 className="mt-1 text-3xl font-bold text-amber-300">{stats.activeIncidents}</h3>
            <span className="mt-2 inline-block text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">UNDER INVESTIGATION</span>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-300">
            <Network className="h-6 w-6" />
          </div>
        </div>

        {/* Risk Status */}
        <div className="sc-card flex items-center justify-between p-6 transition duration-200 hover:-translate-y-0.5 hover:border-red-400/30">
          <div>
            <p className="sc-text-kicker">AI Threat level</p>
            <h3 className="mt-1 text-3xl font-bold text-white">{Math.round(stats.aiRiskScore * 100)}%</h3>
            <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold border ${getThreatColor(stats.aiRiskScore)}`}>
              {stats.aiRiskScore < 0.3 ? 'NORMAL' : stats.aiRiskScore < 0.6 ? 'ELEVATED' : 'CRITICAL'}
            </span>
          </div>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-300">
            <ShieldAlert className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Threat Timeline and diagnostics details */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Area Chart: Attack Volume Timeline */}
        <div className="sc-panel flex h-[540px] flex-col p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between border-b border-white/8 pb-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 animate-pulse text-sky-300" />
              <h4 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Attack volume timeline (Last 6 Hours)</h4>
            </div>
            <span className="sc-badge border-sky-500/20 bg-sky-500/10 text-sky-300 font-mono">
              Volume Analytics
            </span>
          </div>

          <div className="flex-1 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.threatTimeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#090a11', borderColor: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="attacks" stroke="#38bdf8" fillOpacity={1} fill="url(#colorAttacks)" strokeWidth={2} />
                <Area type="monotone" dataKey="anomalies" stroke="#f43f5e" fillOpacity={1} fill="url(#colorAnomalies)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Sidebar: Threat Scoring and Diagnostics */}
        <div className="flex h-[540px] flex-col space-y-6">
          
          {/* Threat Statistics (ML Anomaly Scoring) */}
          <div className="sc-panel flex flex-1 flex-col justify-between p-6">
            <div>
              <div className="mb-3 flex items-center space-x-2 border-b border-white/8 pb-3">
                <Zap className="h-5 w-5 text-sky-300" />
                <h4 className="text-sm font-bold uppercase tracking-[0.24em] text-white">AI Outlier engine</h4>
              </div>
              <p className="mb-4 text-[10px] font-mono text-slate-400">ML engine anomaly risk scale</p>
              
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs text-slate-400">
                  <span>Anomaly Risk Rating</span>
                  <span className={stats.aiRiskScore >= 0.6 ? 'font-bold text-red-300' : 'text-emerald-300'}>
                    {Math.round(stats.aiRiskScore * 100)}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/8">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      stats.aiRiskScore < 0.3 ? 'bg-emerald-400' : stats.aiRiskScore < 0.6 ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${stats.aiRiskScore * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-slate-500">Security Operators</span>
              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="rounded-xl border border-white/8 bg-white/5 p-2">
                  <span className="block text-[10px] text-slate-400">TOTAL</span>
                  <span className="text-sm font-bold text-white">{stats.totalUsers}</span>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/5 p-2">
                  <span className="block text-[10px] text-emerald-400">ACTIVE</span>
                  <span className="text-sm font-bold text-emerald-300">{stats.activeUsers}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic System Health Dials */}
          <div className="sc-panel flex flex-1 flex-col justify-between p-6">
            <div>
              <div className="mb-3 flex items-center space-x-2 border-b border-white/8 pb-3">
                <Cpu className="h-5 w-5 text-sky-300" />
                <h4 className="text-sm font-bold uppercase tracking-[0.24em] text-white">System diagnostics</h4>
              </div>
              <p className="mb-4 text-[10px] font-mono text-slate-400">Real-time health telemetry</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-3.5 w-3.5 text-slate-500" />
                  <span>Server CPU Load</span>
                </div>
                <span className="text-white font-semibold">{stats.systemHealth.cpuUsage}</span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-3.5 w-3.5 text-slate-500" />
                  <span>DB RAM Pool</span>
                </div>
                <span className="text-white font-semibold">{stats.systemHealth.memoryUsage}</span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <div className="flex items-center space-x-2">
                  <Zap className="h-3.5 w-3.5 text-slate-500" />
                  <span>AI service Status</span>
                </div>
                <span className="font-semibold text-emerald-300">{stats.systemHealth.aiService}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-2 text-[10px] font-mono text-slate-500">
              <span>H2 Conn Pool: {stats.systemHealth.dbConnection}</span>
              <span className="text-emerald-300">HEALTHY</span>
            </div>
          </div>

        </div>

      </div>

      {/* Attack origin coordinator and recent operator logins */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Vector list of attacks */}
        <div className="sc-panel p-6">
          <div className="mb-4 flex items-center space-x-2 border-b border-white/8 pb-4">
            <Globe className="h-5 w-5 text-sky-300 animate-spin-slow" />
            <h4 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Attack origin coordinator</h4>
          </div>
          <div className="space-y-3 font-mono text-xs max-h-[300px] overflow-y-auto pr-1">
            {stats.attackMap.map((item) => (
              <div key={item.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-bold text-white flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                    <span>{item.country}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Lat: {item.lat}, Lng: {item.lng}</span>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-bold">{item.count} Attacks</div>
                  <span className="text-[8px] bg-red-500/10 text-red-400 px-1 py-0.5 rounded font-bold border border-red-500/20">{item.severity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logins table */}
        <div className="sc-table-shell overflow-hidden border border-white/8 xl:col-span-2">
          <div className="flex items-center justify-between border-b border-white/8 bg-[#0b1220]/70 p-6">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Recent operator sign-ins</h4>
              <p className="mt-0.5 text-xs font-mono text-slate-400">Immutable identity login log events from backend</p>
            </div>
            <button 
              onClick={fetchStats}
              className="sc-button-secondary p-2 bg-transparent border-none"
            >
              <RefreshCw className="h-3.5 w-3.5 text-sky-300" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/8 text-[10px] uppercase font-mono tracking-[0.24em] text-slate-400">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User Email</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Origin IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8 text-xs font-mono">
                {stats.recentLogins && stats.recentLogins.length > 0 ? (
                  stats.recentLogins.map((log) => {
                    const isSuccess = log.action === 'LOGIN_SUCCESS';
                    return (
                      <tr key={log.id} className="transition hover:bg-white/5">
                        <td className="whitespace-nowrap px-6 py-4 text-slate-400">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-slate-300">{log.userEmail}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] ${
                            isSuccess 
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-300 border-red-500/20'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{log.ipAddress}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-xs text-slate-500">
                      No sign-in records logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
