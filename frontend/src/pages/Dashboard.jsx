import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Shield, Activity, Users, AlertOctagon, Terminal, Cpu, Database, Network, Server, Globe } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh stats every 8 seconds
    const interval = setInterval(fetchStats, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
        </div>
        <p className="text-xs font-mono text-gray-400">Syncing live operations dashboard...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center glass-card border border-dark-border max-w-md mx-auto">
        <AlertOctagon className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
        <h2 className="text-lg font-bold text-white mb-2">Sync Connection Error</h2>
        <p className="text-xs text-gray-400 font-mono leading-relaxed mb-4">{error || 'Could not map database metrics.'}</p>
        <button
          onClick={fetchStats}
          className="bg-primary text-black font-semibold text-xs py-2 px-4 rounded hover:bg-primary-hover transition cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">SOC Command Center</h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">Central Security Operations Platform Live Threat Feeds</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0 bg-slate-900/40 p-2 rounded-lg border border-dark-border text-xs font-mono">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-gray-400">Last Synced:</span>
          <span className="text-white">{new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Logs */}
        <div className="glass-card p-6 border border-dark-border flex items-center justify-between hover:shadow-lg hover:shadow-primary/5 transition duration-150">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Total Logs</span>
            <h3 className="text-3xl font-extrabold text-white tracking-wide font-sans">{stats.totalLogs}</h3>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">LIVE DATASTREAM</span>
          </div>
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-dark-border text-primary">
            <Terminal className="w-6 h-6" />
          </div>
        </div>

        {/* Active Alerts */}
        <div className="glass-card p-6 border border-dark-border flex items-center justify-between hover:shadow-lg hover:shadow-primary/5 transition duration-150">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Active Alerts</span>
            <h3 className="text-3xl font-extrabold text-white tracking-wide font-sans">{stats.activeAlerts}</h3>
            <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">AWAITING TRIAGE</span>
          </div>
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-dark-border text-secondary">
            <Shield className="w-6 h-6" />
          </div>
        </div>

        {/* Active Incidents */}
        <div className="glass-card p-6 border border-dark-border flex items-center justify-between hover:shadow-lg hover:shadow-primary/5 transition duration-150">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">Active Incidents</span>
            <h3 className="text-3xl font-extrabold text-white tracking-wide font-sans">{stats.activeIncidents}</h3>
            <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">UNDER TRIAGE</span>
          </div>
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-dark-border text-warning">
            <Network className="w-6 h-6" />
          </div>
        </div>

        {/* AI Risk Level */}
        <div className="glass-card p-6 border border-dark-border flex items-center justify-between hover:shadow-lg hover:shadow-primary/5 transition duration-150">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">AI Risk Score</span>
            <h3 className="text-3xl font-extrabold text-white tracking-wide font-sans">{Math.round(stats.aiRiskScore * 100)}%</h3>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
              stats.aiRiskScore >= 0.7 
                ? 'bg-red-500/15 text-red-400 border-red-500/20' 
                : stats.aiRiskScore >= 0.4 
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
            }`}>
              {stats.aiRiskScore >= 0.7 ? 'CRITICAL RISK' : stats.aiRiskScore >= 0.4 ? 'HIGH RISK' : 'STABLE RISK'}
            </span>
          </div>
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-dark-border text-red-400">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Threat Timeline & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart */}
        <div className="glass-card p-6 border border-dark-border lg:col-span-2">
          <h2 className="text-md font-bold text-white mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-primary" />
            <span>Attack volume timeline (Last 6 Hours)</span>
          </h2>
          <div className="h-64 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.threatTimeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAttacks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="time" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.08)', color: '#fff' }} />
                <Area type="monotone" dataKey="attacks" stroke="#10b981" fillOpacity={1} fill="url(#colorAttacks)" strokeWidth={2} />
                <Area type="monotone" dataKey="anomalies" stroke="#6366f1" fillOpacity={1} fill="url(#colorAnomalies)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health */}
        <div className="glass-card p-6 border border-dark-border lg:col-span-1 flex flex-col justify-between">
          <div>
            <h2 className="text-md font-bold text-white mb-4 flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-secondary" />
              <span>SOC platform health</span>
            </h2>
            <div className="space-y-4 text-xs font-mono">
              <div className="flex justify-between items-center py-2 border-b border-dark-border/40">
                <span className="text-gray-400">SOC Service Gateway</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">ONLINE</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dark-border/40">
                <span className="text-gray-400">Database Connection</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{stats.systemHealth.dbConnection}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dark-border/40">
                <span className="text-gray-400">AI Outlier engine</span>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{stats.systemHealth.aiService}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Total SOC Analysts</span>
                <span className="text-white font-bold">{stats.totalUsers} Active</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-6 border-t border-dark-border/40 text-center font-mono text-[10px] text-gray-400">
            <div>
              <div className="text-xs font-bold text-white mb-1">{stats.systemHealth.cpuUsage}</div>
              <span>CPU Usage</span>
            </div>
            <div>
              <div className="text-xs font-bold text-white mb-1">{stats.systemHealth.memoryUsage}</div>
              <span>Memory</span>
            </div>
            <div>
              <div className="text-xs font-bold text-white mb-1">{stats.systemHealth.diskUsage}</div>
              <span>Disk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attack Map & Top Attacked Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attack Map Simulation */}
        <div className="glass-card p-6 border border-dark-border lg:col-span-1">
          <h2 className="text-md font-bold text-white mb-4 flex items-center space-x-2">
            <Globe className="w-5 h-5 text-sky-400" />
            <span>Attack origin coordinator</span>
          </h2>
          <div className="space-y-3 font-mono text-xs">
            {stats.attackMap.map((item) => (
              <div key={item.id} className="p-3 bg-slate-900/40 border border-dark-border/30 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-bold text-white flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    <span>{item.country}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">Lat: {item.lat}, Lng: {item.lng}</span>
                </div>
                <div className="text-right">
                  <div className="text-red-400 font-bold">{item.count} Attacks</div>
                  <span className="text-[8px] bg-red-500/10 text-red-400 px-1 py-0.5 rounded font-bold border border-red-500/20">{item.severity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Attacked Assets */}
        <div className="glass-card p-6 border border-dark-border lg:col-span-2">
          <h2 className="text-md font-bold text-white mb-4 flex items-center space-x-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <span>Top targeted network assets</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-dark-border bg-slate-900/35 text-[9px] uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-4">Asset Node</th>
                  <th className="py-3 px-4">IP address</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Attack Volume</th>
                  <th className="py-3 px-4 text-right">Criticality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-gray-300">
                {stats.topAttackedAssets.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{item.asset}</td>
                    <td className="py-3 px-4">{item.ip}</td>
                    <td className="py-3 px-4 text-[10px] text-gray-400">{item.type}</td>
                    <td className="py-3 px-4 font-bold text-red-400">{item.attacks} hits</td>
                    <td className="py-3 px-4 text-right">
                      <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[9px] font-bold">
                        {item.criticality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
