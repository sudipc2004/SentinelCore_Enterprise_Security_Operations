import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  Network,
  ShieldAlert,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
  Activity,
  Clock,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useWebSocket } from '../hooks/useWebSocket';

// ─── Chart colour tokens (aligned with design system) ───────────────────────
const CHART_COLORS = {
  blue: '#2563eb',
  sky: '#38bdf8',
  emerald: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#a855f7',
};

const SEVERITY_COLORS = [
  CHART_COLORS.red,
  CHART_COLORS.amber,
  CHART_COLORS.sky,
  CHART_COLORS.emerald,
];

// ─── Fallback / mock data (shown when backend is offline) ────────────────────
const MOCK_TREND = [
  { day: 'Mon', incidents: 4, alerts: 9 },
  { day: 'Tue', incidents: 7, alerts: 14 },
  { day: 'Wed', incidents: 3, alerts: 6 },
  { day: 'Thu', incidents: 9, alerts: 21 },
  { day: 'Fri', incidents: 5, alerts: 11 },
  { day: 'Sat', incidents: 2, alerts: 4 },
  { day: 'Sun', incidents: 6, alerts: 13 },
];

const MOCK_SEVERITY = [
  { name: 'P1 Critical', value: 3 },
  { name: 'P2 High', value: 8 },
  { name: 'P3 Medium', value: 14 },
  { name: 'P4 Low', value: 21 },
];

const MOCK_ALERT_STATUS = [
  { status: 'Open', count: 12 },
  { status: 'Triaged', count: 7 },
  { status: 'In Progress', count: 5 },
  { status: 'Resolved', count: 31 },
];

// ─── Custom tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card border border-white/10 px-3 py-2 text-xs font-mono">
      {label && <p className="mb-1 text-slate-400 uppercase tracking-wider">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

// ─── Severity badge helper for live feed ────────────────────────────────────
function SeverityBadge({ severity }) {
  const map = {
    CRITICAL: 'border-red-500/30 bg-red-500/10 text-red-300',
    HIGH: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    MEDIUM: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    LOW: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    INFO: 'border-white/10 bg-white/5 text-slate-300',
  };
  const cls = map[severity?.toUpperCase()] ?? map.INFO;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] uppercase ${cls}`}>
      {severity ?? 'INFO'}
    </span>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chart data — uses backend data when available, mock otherwise
  const [trendData, setTrendData] = useState(MOCK_TREND);
  const [severityData, setSeverityData] = useState(MOCK_SEVERITY);
  const [alertStatusData, setAlertStatusData] = useState(MOCK_ALERT_STATUS);

  // WebSocket live feed
  const { events: liveEvents, connected: wsConnected } = useWebSocket(
    'http://localhost:8080/ws',
    '/topic/events',
    30
  );

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get('/api/dashboard/stats');
        const data = response.data;
        setStats(data);

        // Populate chart data from backend if fields exist
        if (data.incidentTrend?.length) setTrendData(data.incidentTrend);
        if (data.severityDistribution?.length) setSeverityData(data.severityDistribution);
        if (data.alertStatusCounts?.length) setAlertStatusData(data.alertStatusCounts);
      } catch {
        setError('Could not retrieve dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="font-mono text-sm text-slate-400">Loading dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sc-fade-in">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="sc-panel p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="sc-badge border-sky-500/20 bg-sky-500/10 text-sky-300">Dashboard</span>
          <span className="sc-badge border-amber-500/20 bg-amber-500/10 text-amber-300">
            Live metrics
          </span>
          {wsConnected ? (
            <span className="sc-badge border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              <Wifi className="h-2.5 w-2.5" /> WS Live
            </span>
          ) : (
            <span className="sc-badge border-white/10 bg-white/5 text-slate-400">
              <WifiOff className="h-2.5 w-2.5" /> WS Offline
            </span>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
          Security Operations Dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Real-time platform metrics, incident trends, and live event feed from the security control plane.
        </p>
      </div>

      {error && (
        <div className="sc-panel flex items-center gap-2 border border-red-500/25 bg-red-500/10 p-4 text-red-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{error} Charts are showing sample data.</span>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total operators */}
        <div className="sc-card flex min-h-36 items-center justify-between p-6">
          <div>
            <p className="sc-text-kicker">Total Operators</p>
            <h3 className="mt-2 text-3xl font-bold text-white">{stats?.totalUsers ?? 0}</h3>
            <p className="mt-1 text-xs text-slate-500">registered accounts</p>
          </div>
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-sky-300">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Active users */}
        <div className="sc-card flex min-h-36 items-center justify-between p-6">
          <div>
            <p className="sc-text-kicker">Active Users</p>
            <h3 className="mt-2 text-3xl font-bold text-emerald-400">{stats?.activeUsers ?? 0}</h3>
            <p className="mt-1 text-xs text-slate-500">currently enabled</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Security teams */}
        <div className="sc-card flex min-h-36 items-center justify-between p-6">
          <div>
            <p className="sc-text-kicker">Security Teams</p>
            <h3 className="mt-2 text-3xl font-bold text-white">{stats?.totalTeams ?? 0}</h3>
            <p className="mt-1 text-xs text-slate-500">operational units</p>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-300">
            <Network className="h-6 w-6" />
          </div>
        </div>

        {/* MTTR */}
        <div className="sc-card flex min-h-36 items-center justify-between p-6">
          <div>
            <p className="sc-text-kicker">Avg MTTR</p>
            <h3 className="mt-2 text-3xl font-bold text-amber-400">
              {stats?.avgMttrHours != null ? `${stats.avgMttrHours}h` : '—'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">mean time to resolve</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-300">
            <Clock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* 7-day Incident & Alert Trend — Area chart */}
        <div className="sc-card col-span-1 p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="sc-text-kicker">7-Day Trend</p>
              <h2 className="mt-1 text-base font-bold text-white">Incidents &amp; Alerts</h2>
            </div>
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-2 text-sky-300">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradIncidents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAlerts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.sky} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={CHART_COLORS.sky} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '10px', color: '#94a3b8', paddingTop: '8px' }}
                iconType="circle"
                iconSize={8}
              />
              <Area
                type="monotone"
                dataKey="incidents"
                name="Incidents"
                stroke={CHART_COLORS.blue}
                strokeWidth={2}
                fill="url(#gradIncidents)"
                dot={{ fill: CHART_COLORS.blue, r: 3, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="alerts"
                name="Alerts"
                stroke={CHART_COLORS.sky}
                strokeWidth={2}
                fill="url(#gradAlerts)"
                dot={{ fill: CHART_COLORS.sky, r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution — Pie chart */}
        <div className="sc-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="sc-text-kicker">Severity Split</p>
              <h2 className="mt-1 text-base font-bold text-white">Distribution</h2>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-300">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {severityData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={SEVERITY_COLORS[index % SEVERITY_COLORS.length]}
                    stroke="rgba(0,0,0,0.3)"
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1">
            {severityData.map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: SEVERITY_COLORS[i % SEVERITY_COLORS.length] }}
                  />
                  <span className="text-slate-400">{entry.name}</span>
                </div>
                <span className="font-mono font-semibold text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Alert Status Bar + Live Feed ────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Alert Status Bar chart */}
        <div className="sc-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="sc-text-kicker">Alert Status</p>
              <h2 className="mt-1 text-base font-bold text-white">Open / Triaged / Resolved</h2>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-amber-300">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={alertStatusData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="status" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                {alertStatusData.map((entry, index) => {
                  const colors = [
                    CHART_COLORS.red,
                    CHART_COLORS.amber,
                    CHART_COLORS.blue,
                    CHART_COLORS.emerald,
                  ];
                  return <Cell key={index} fill={colors[index % colors.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* WebSocket Live Event Feed */}
        <div className="sc-card flex flex-col p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="sc-text-kicker">Real-Time Feed</p>
              <h2 className="mt-1 text-base font-bold text-white">Live Security Events</h2>
            </div>
            <div
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                wsConnected
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/10 bg-white/5 text-slate-500'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${wsConnected ? 'animate-pulse bg-emerald-400' : 'bg-slate-600'}`}
              />
              {wsConnected ? 'Live' : 'Offline'}
            </div>
          </div>

          {/* Feed body */}
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[200px] pr-1">
            {liveEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Zap className="mb-2 h-8 w-8 text-slate-700" />
                <p className="text-xs font-mono text-slate-500">
                  {wsConnected
                    ? 'Waiting for events...'
                    : 'WebSocket server not reachable. Events will appear here when connected.'}
                </p>
              </div>
            ) : (
              liveEvents.map((ev) => (
                <div
                  key={ev._id}
                  className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/3 px-3 py-2 text-xs font-mono"
                >
                  <SeverityBadge severity={ev.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-slate-200">{ev.message || ev.description || 'Event received'}</p>
                    <p className="mt-0.5 text-[10px] text-slate-600">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Feed footer */}
          <div className="mt-3 border-t border-white/8 pt-3 text-[10px] font-mono text-slate-600">
            {wsConnected
              ? `Connected · ${liveEvents.length} events received`
              : 'Connects to /ws · topic /topic/events'}
          </div>
        </div>
      </div>
    </div>
  );
}
