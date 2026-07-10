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
      <div className="flex h-96 flex-col items-center justify-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
        <p className="text-sm font-mono text-slate-400">Loading system metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sc-panel flex items-center space-x-2 border border-red-500/25 bg-red-500/10 p-4 text-red-300">
        <AlertTriangle className="h-5 w-5" />
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
    <div className="space-y-6 sc-fade-in">
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Total Users */}
        <div className="sc-card flex items-center justify-between p-6 transition duration-200 hover:-translate-y-0.5 hover:border-sky-400/30">
          <div>
            <p className="sc-text-kicker">Total operators</p>
            <h3 className="mt-1 text-3xl font-bold text-white">{totalUsers}</h3>
          </div>
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-sky-300">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Active Operators */}
        <div className="sc-card flex items-center justify-between p-6 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-400/30">
          <div>
            <p className="sc-text-kicker">Active sessions</p>
            <h3 className="mt-1 text-3xl font-bold text-emerald-300">{activeUsers}</h3>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Total Teams */}
        <div className="sc-card flex items-center justify-between p-6 transition duration-200 hover:-translate-y-0.5 hover:border-blue-400/30">
          <div>
            <p className="sc-text-kicker">Security teams</p>
            <h3 className="mt-1 text-3xl font-bold text-white">{totalTeams}</h3>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-300">
            <Network className="h-6 w-6" />
          </div>
        </div>

        {/* Risk Status */}
        <div className="sc-card flex items-center justify-between p-6 transition duration-200 hover:-translate-y-0.5 hover:border-red-400/30">
          <div>
            <p className="sc-text-kicker">System threat level</p>
            <h3 className="mt-1 flex items-center space-x-2 text-2xl font-bold text-white">
              <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold border ${getThreatColor(telemetry.riskScore)}`}>
                {telemetry.riskScore < 30 ? 'NORMAL' : telemetry.riskScore < 60 ? 'ELEVATED' : 'CRITICAL'}
              </span>
            </h3>
          </div>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-red-300">
            <ShieldAlert className="h-6 w-6 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        
        {/* Left Column: Live Alerts Stream */}
        <div className="sc-panel flex h-[560px] flex-col p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between border-b border-white/8 pb-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 animate-pulse text-red-300" />
              <h4 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Live threat alerts stream</h4>
            </div>
            <span className="sc-badge border-red-500/20 bg-red-500/10 text-red-300">
              {alerts.filter(a => a.status === 'ACTIVE').length} Active
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {alerts.length > 0 ? (
              alerts.map((alertItem) => {
                const isCritical = alertItem.severity === 'CRITICAL';
                const isHigh = alertItem.severity === 'HIGH';
                const isMedium = alertItem.severity === 'MEDIUM';
                
                let sevBg = 'bg-white/5 text-slate-300 border-white/8';
                if (isCritical) sevBg = 'bg-red-500/10 text-red-300 border-red-500/20';
                else if (isHigh) sevBg = 'bg-orange-500/10 text-orange-300 border-orange-500/20';
                else if (isMedium) sevBg = 'bg-amber-500/10 text-amber-300 border-amber-500/20';

                return (
                  <div key={alertItem.id} className={`flex flex-col space-y-2 rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-white/5 ${
                    alertItem.status === 'INVESTIGATING' ? 'border-sky-400/35 border-dashed bg-sky-500/5' : 'border-white/8 bg-[#0b1220]/50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-[0.16em] ${sevBg}`}>
                          {alertItem.severity}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">{alertItem.timestamp}</span>
                      </div>
                      <span className="font-mono text-[10px] text-sky-300">{alertItem.source}</span>
                    </div>

                    <p className="text-xs font-semibold text-white">{alertItem.message}</p>

                    <div className="flex items-center justify-between border-t border-white/8 pt-2 text-[10px]">
                      <span className="font-mono text-slate-500">
                        Status: <span className={alertItem.status === 'ACTIVE' ? 'font-bold text-red-300' : 'text-sky-300'}>{alertItem.status}</span>
                      </span>
                      <div className="flex space-x-2">
                        {alertItem.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleInvestigateAlert(alertItem.id)}
                            className="sc-button-secondary px-3 py-1.5 text-[10px] font-semibold text-sky-300"
                          >
                            Investigate
                          </button>
                        )}
                        <button
                          onClick={() => handleDismissAlert(alertItem.id)}
                          className="sc-button-secondary px-3 py-1.5 text-[10px] font-semibold"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="mt-24 text-center text-xs font-mono text-slate-500">All threats resolved. Operations normal.</p>
            )}
          </div>
        </div>

        {/* Right Column: Threat Stats & System Health */}
        <div className="flex h-[560px] flex-col space-y-6">
          
          {/* Threat Statistics (ML Anomaly Scoring) */}
          <div className="sc-panel flex flex-1 flex-col justify-between p-6">
            <div>
              <div className="mb-3 flex items-center space-x-2 border-b border-white/8 pb-3">
                <Zap className="h-5 w-5 text-sky-300" />
                <h4 className="text-sm font-bold uppercase tracking-[0.24em] text-white">AI threat scoring</h4>
              </div>
              <p className="mb-4 text-xs font-mono text-slate-400">ML engine anomaly confidence scale</p>
              
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs text-slate-400">
                  <span>Anomaly Risk Rating</span>
                  <span className={telemetry.riskScore > 50 ? 'font-bold text-red-300' : 'text-emerald-300'}>
                    {telemetry.riskScore}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/8">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      telemetry.riskScore < 30 ? 'bg-emerald-400' : telemetry.riskScore < 60 ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${telemetry.riskScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-slate-500">Severity distribution</span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-xl border border-white/8 bg-white/5 p-2">
                  <span className="block text-[10px] font-mono font-bold text-red-300">CRIT</span>
                  <span className="text-xs font-mono font-semibold text-white">
                    {alerts.filter(a => a.severity === 'CRITICAL').length}
                  </span>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/5 p-2">
                  <span className="block text-[10px] font-mono text-orange-300">HIGH</span>
                  <span className="text-xs font-mono font-semibold text-white">
                    {alerts.filter(a => a.severity === 'HIGH').length}
                  </span>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/5 p-2">
                  <span className="block text-[10px] font-mono text-amber-300">MED</span>
                  <span className="text-xs font-mono font-semibold text-white">
                    {alerts.filter(a => a.severity === 'MEDIUM').length}
                  </span>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/5 p-2">
                  <span className="block text-[10px] font-mono text-slate-400">LOW</span>
                  <span className="text-xs font-mono font-semibold text-white">
                    {alerts.filter(a => a.severity === 'LOW').length}
                  </span>
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
              <p className="mb-4 text-xs font-mono text-slate-400">Real-time health telemetry</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-3.5 w-3.5 text-slate-500" />
                  <span>Server CPU Load</span>
                </div>
                <span className="text-white font-semibold">{telemetry.cpu}%</span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-3.5 w-3.5 text-slate-500" />
                  <span>DB RAM Pool</span>
                </div>
                <span className="text-white font-semibold">{telemetry.memory}%</span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <div className="flex items-center space-x-2">
                  <Zap className="h-3.5 w-3.5 text-slate-500" />
                  <span>API Latency</span>
                </div>
                <span className="font-semibold text-emerald-300">{telemetry.latency} ms</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-2 text-[10px] font-mono text-slate-500">
              <span>H2 Conn Pool: ACTIVE</span>
              <span className="text-emerald-300">HEALTHY</span>
            </div>
          </div>

        </div>

      </div>

      <div className="sc-table-shell overflow-hidden border border-white/8">
        <div className="flex items-center justify-between border-b border-white/8 bg-[#0b1220]/70 p-6">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.24em] text-white">Recent operator sign-ins</h4>
            <p className="mt-0.5 text-xs font-mono text-slate-400">Immutable identity login log events from backend</p>
          </div>
          <button 
            onClick={fetchStats}
            className="sc-button-secondary p-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
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
            <tbody className="divide-y divide-white/8 text-xs">
              {recentLogins && recentLogins.length > 0 ? (
                recentLogins.map((log) => {
                  const isSuccess = log.action === 'LOGIN_SUCCESS';
                  return (
                    <tr key={log.id} className="transition hover:bg-white/5">
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-slate-400">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">{log.userEmail}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.16em] ${
                          isSuccess 
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-300 border-red-500/20'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400">{log.ipAddress}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-xs font-mono text-slate-500">
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
