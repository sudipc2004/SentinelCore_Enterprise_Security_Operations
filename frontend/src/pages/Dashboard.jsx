import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Shield, Network, UserCheck, Activity, AlertTriangle, 
  ShieldAlert, CheckCircle, Cpu, HardDrive, Zap, RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Live Simulated Alerts State
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toLocaleTimeString(),
      severity: 'CRITICAL',
      message: 'SQL Injection attempt detected on Authentication API',
      source: 'AuthGateway-Prod',
      status: 'ACTIVE'
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toLocaleTimeString(),
      severity: 'HIGH',
      message: 'Brute-force SSH attack suspected from 198.51.100.42',
      source: 'FW-External-1',
      status: 'ACTIVE'
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString(),
      severity: 'MEDIUM',
      message: 'Unauthorized system file alteration detected',
      source: 'Endpoint-Agent-12',
      status: 'INVESTIGATING'
    }
  ]);

  // Live Telemetry States (Fluctuating)
  const [telemetry, setTelemetry] = useState({
    cpu: 18,
    memory: 42.4,
    latency: 14,
    riskScore: 23
  });

  // Fetch initial database statistics
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

  useEffect(() => {
    fetchStats();
  }, []);

  // Telemetry fluctuation loop
  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      setTelemetry(prev => ({
        cpu: Math.max(8, Math.min(85, prev.cpu + Math.floor(Math.random() * 9) - 4)),
        memory: Math.max(30, Math.min(95, Number((prev.memory + (Math.random() * 1.2 - 0.6)).toFixed(1)))),
        latency: Math.max(5, Math.min(60, prev.latency + Math.floor(Math.random() * 5) - 2)),
        riskScore: Math.max(10, Math.min(95, prev.riskScore + Math.floor(Math.random() * 3) - 1))
      }));
    }, 3000);

    return () => clearInterval(telemetryInterval);
  }, []);

  // Live alerts simulator stream loop
  useEffect(() => {
    const alertTemplates = [
      { severity: 'CRITICAL', message: 'DDoS traffic burst detected on corporate gateway', source: 'Core-Router-Edge' },
      { severity: 'HIGH', message: 'Multiple failed admin logins from suspicious location', source: 'AuthGateway-Prod' },
      { severity: 'MEDIUM', message: 'Outbound communication to known malicious IP', source: 'Proxy-Sec-02' },
      { severity: 'LOW', message: 'Internal port scan activity from host 10.0.4.55', source: 'Switch-Intra-10' },
      { severity: 'HIGH', message: 'Ransomware signature matched on storage volume B', source: 'Filer-Share-01' },
      { severity: 'CRITICAL', message: 'Privilege escalation alert for system daemon', source: 'Endpoint-Agent-08' },
      { severity: 'LOW', message: 'External address scan blocked on interface wan-0', source: 'FW-External-1' }
    ];

    const alertsInterval = setInterval(() => {
      const randomTemplate = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
      const newAlert = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        severity: randomTemplate.severity,
        message: randomTemplate.message,
        source: randomTemplate.source,
        status: 'ACTIVE'
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);
    }, 7000);

    return () => clearInterval(alertsInterval);
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

  const { totalUsers, activeUsers, totalTeams, recentLogins } = stats;

  const handleInvestigateAlert = (alertId) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'INVESTIGATING' } : a));
  };

  const handleDismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  // Determine threat level color
  const getThreatColor = (score) => {
    if (score < 30) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score < 60) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="space-y-8">
      {/* Header with live heartbeat */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">SOC Command Center</h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">Real-time threat monitoring, live telemetry feeds, and audit streams</p>
        </div>
        <div className="flex items-center space-x-3 bg-slate-900/60 border border-dark-border px-4 py-2 rounded-lg">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-semibold">FEED ONLINE</span>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="glass-card p-6 border border-dark-border flex items-center justify-between hover:border-secondary/40 transition-colors">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Total Operators</p>
            <h3 className="text-3xl font-bold text-white mt-1">{totalUsers}</h3>
          </div>
          <div className="p-3 bg-secondary/15 rounded-lg border border-secondary/25">
            <Users className="w-6 h-6 text-secondary" />
          </div>
        </div>

        {/* Active Operators */}
        <div className="glass-card p-6 border border-dark-border flex items-center justify-between hover:border-emerald-500/40 transition-colors">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Active Sessions</p>
            <h3 className="text-3xl font-bold text-emerald-400 mt-1">{activeUsers}</h3>
          </div>
          <div className="p-3 bg-emerald-500/15 rounded-lg border border-emerald-500/25">
            <UserCheck className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        {/* Total Teams */}
        <div className="glass-card p-6 border border-dark-border flex items-center justify-between hover:border-primary/40 transition-colors">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">Security Teams</p>
            <h3 className="text-3xl font-bold text-white mt-1">{totalTeams}</h3>
          </div>
          <div className="p-3 bg-primary/15 rounded-lg border border-primary/25">
            <Network className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Risk Status */}
        <div className="glass-card p-6 border border-dark-border flex items-center justify-between hover:border-red-500/40 transition-colors">
          <div>
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">System Threat Level</p>
            <h3 className="text-2xl font-bold text-white mt-1 flex items-center space-x-2">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono border ${getThreatColor(telemetry.riskScore)}`}>
                {telemetry.riskScore < 30 ? 'NORMAL' : telemetry.riskScore < 60 ? 'ELEVATED' : 'CRITICAL'}
              </span>
            </h3>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <ShieldAlert className="w-6 h-6 text-red-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Grid: Telemetry, Alerts, Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Live Alerts Stream */}
        <div className="lg:col-span-2 glass-card p-6 border border-dark-border flex flex-col h-[550px]">
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-dark-border">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-red-500 animate-pulse" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">Live Threat Alerts Stream</h4>
            </div>
            <span className="text-[10px] font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">
              {alerts.filter(a => a.status === 'ACTIVE').length} Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {alerts.length > 0 ? (
              alerts.map((alertItem) => {
                const isCritical = alertItem.severity === 'CRITICAL';
                const isHigh = alertItem.severity === 'HIGH';
                const isMedium = alertItem.severity === 'MEDIUM';
                
                let sevBg = 'bg-slate-800 text-gray-400 border-dark-border';
                if (isCritical) sevBg = 'bg-red-500/15 text-red-400 border-red-500/30';
                else if (isHigh) sevBg = 'bg-orange-500/15 text-orange-400 border-orange-500/30';
                else if (isMedium) sevBg = 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';

                return (
                  <div key={alertItem.id} className={`p-4 bg-slate-900/40 border rounded-lg flex flex-col space-y-2 transition-all hover:bg-slate-900/60 ${
                    alertItem.status === 'INVESTIGATING' ? 'border-indigo-500/35 border-dashed' : 'border-dark-border'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${sevBg}`}>
                          {alertItem.severity}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">{alertItem.timestamp}</span>
                      </div>
                      <span className="text-[10px] text-primary font-mono">{alertItem.source}</span>
                    </div>

                    <p className="text-xs font-semibold text-white">{alertItem.message}</p>

                    <div className="flex justify-between items-center pt-2 border-t border-dark-border/20 text-[10px]">
                      <span className="font-mono text-gray-500">
                        Status: <span className={alertItem.status === 'ACTIVE' ? 'text-red-400 font-bold' : 'text-indigo-400'}>{alertItem.status}</span>
                      </span>
                      <div className="flex space-x-2">
                        {alertItem.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleInvestigateAlert(alertItem.id)}
                            className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 px-2 py-1 rounded font-mono transition cursor-pointer"
                          >
                            Investigate
                          </button>
                        )}
                        <button
                          onClick={() => handleDismissAlert(alertItem.id)}
                          className="bg-slate-800 text-gray-400 hover:bg-slate-700 px-2 py-1 rounded font-mono transition cursor-pointer"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs font-mono text-gray-500 text-center mt-24">All threats resolved. Operations normal.</p>
            )}
          </div>
        </div>

        {/* Right Column: Threat Stats & System Health */}
        <div className="space-y-8 flex flex-col h-[550px]">
          
          {/* Threat Statistics (ML Anomaly Scoring) */}
          <div className="glass-card p-6 border border-dark-border flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-dark-border">
                <Zap className="w-5 h-5 text-primary" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">AI Threat Scoring</h4>
              </div>
              <p className="text-xs text-gray-400 font-mono mb-4">ML engine anomaly confidence scale</p>
              
              {/* Risk Level Bar Dial */}
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs text-gray-400">
                  <span>Anomaly Risk Rating</span>
                  <span className={telemetry.riskScore > 50 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                    {telemetry.riskScore}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      telemetry.riskScore < 30 ? 'bg-emerald-500' : telemetry.riskScore < 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${telemetry.riskScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Severity Distribution Dials */}
            <div className="space-y-2 mt-4">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Severity distribution</span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-900/40 p-2 border border-dark-border rounded">
                  <span className="block text-[10px] font-mono text-red-400 font-bold">CRIT</span>
                  <span className="text-xs font-mono text-white font-semibold">
                    {alerts.filter(a => a.severity === 'CRITICAL').length}
                  </span>
                </div>
                <div className="bg-slate-900/40 p-2 border border-dark-border rounded">
                  <span className="block text-[10px] font-mono text-orange-400">HIGH</span>
                  <span className="text-xs font-mono text-white font-semibold">
                    {alerts.filter(a => a.severity === 'HIGH').length}
                  </span>
                </div>
                <div className="bg-slate-900/40 p-2 border border-dark-border rounded">
                  <span className="block text-[10px] font-mono text-yellow-400">MED</span>
                  <span className="text-xs font-mono text-white font-semibold">
                    {alerts.filter(a => a.severity === 'MEDIUM').length}
                  </span>
                </div>
                <div className="bg-slate-900/40 p-2 border border-dark-border rounded">
                  <span className="block text-[10px] font-mono text-gray-400">LOW</span>
                  <span className="text-xs font-mono text-white font-semibold">
                    {alerts.filter(a => a.severity === 'LOW').length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Diagnostic System Health Dials */}
          <div className="glass-card p-6 border border-dark-border flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-dark-border">
                <Cpu className="w-5 h-5 text-secondary" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">System Diagnostics</h4>
              </div>
              <p className="text-xs text-gray-400 font-mono mb-4">Real-time health telemetry</p>
            </div>

            <div className="space-y-4">
              {/* CPU load */}
              <div className="flex items-center justify-between text-xs font-mono text-gray-300">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-3.5 h-3.5 text-gray-500" />
                  <span>Server CPU Load</span>
                </div>
                <span className="text-white font-semibold">{telemetry.cpu}%</span>
              </div>

              {/* Memory usage */}
              <div className="flex items-center justify-between text-xs font-mono text-gray-300">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-3.5 h-3.5 text-gray-500" />
                  <span>DB RAM Pool</span>
                </div>
                <span className="text-white font-semibold">{telemetry.memory}%</span>
              </div>

              {/* API response latency */}
              <div className="flex items-center justify-between text-xs font-mono text-gray-300">
                <div className="flex items-center space-x-2">
                  <Zap className="w-3.5 h-3.5 text-gray-500" />
                  <span>API Latency</span>
                </div>
                <span className="text-emerald-400 font-semibold">{telemetry.latency} ms</span>
              </div>
            </div>

            {/* Diagnostics status alert */}
            <div className="mt-4 pt-2 border-t border-dark-border/20 flex justify-between items-center text-[10px] font-mono text-gray-500">
              <span>H2 Conn Pool: ACTIVE</span>
              <span className="text-emerald-400">HEALTHY</span>
            </div>
          </div>

        </div>

      </div>

      {/* Audit logs & activity timeline */}
      <div className="glass-card border border-dark-border overflow-hidden">
        <div className="p-6 border-b border-dark-border bg-slate-900/20 flex justify-between items-center">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Recent Operator Signins</h4>
            <p className="text-xs text-gray-400 font-mono mt-0.5">Immutable identity login log events from backend</p>
          </div>
          <button 
            onClick={fetchStats}
            className="p-2 bg-slate-800 text-gray-400 hover:text-white rounded border border-dark-border hover:bg-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-border bg-slate-900/35 text-[10px] uppercase font-mono tracking-wider text-gray-400">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">User Email</th>
                <th className="py-4 px-6">Action</th>
                <th className="py-4 px-6">Origin IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/40 text-xs">
              {recentLogins && recentLogins.length > 0 ? (
                recentLogins.map((log) => {
                  const isSuccess = log.action === 'LOGIN_SUCCESS';
                  return (
                    <tr key={log.id} className="hover:bg-slate-900/15 transition">
                      <td className="py-4 px-6 text-gray-400 font-mono whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-gray-300 font-mono">{log.userEmail}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-2.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
                          isSuccess 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400 font-mono">{log.ipAddress}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-xs font-mono text-gray-500">
                    No sign-in records logged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
