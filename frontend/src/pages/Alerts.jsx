import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  BellRing,
  Check,
  ChevronDown,
  Clock,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Siren,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

const SEVERITY_STYLES = {
  CRITICAL: { text: 'text-red-300',     border: 'border-red-500/25',     bg: 'bg-red-500/10'     },
  HIGH:     { text: 'text-orange-300',  border: 'border-orange-500/25',  bg: 'bg-orange-500/10'  },
  MEDIUM:   { text: 'text-amber-300',   border: 'border-amber-500/25',   bg: 'bg-amber-500/10'   },
  LOW:      { text: 'text-sky-300',     border: 'border-sky-500/25',     bg: 'bg-sky-500/10'     },
  INFO:     { text: 'text-slate-300',   border: 'border-white/10',       bg: 'bg-white/5'        },
};

const STATUS_STYLES = {
  OPEN:         { text: 'text-red-300',     border: 'border-red-500/25',     bg: 'bg-red-500/10',     dot: 'bg-red-400'     },
  ACKNOWLEDGED: { text: 'text-amber-300',   border: 'border-amber-500/25',   bg: 'bg-amber-500/10',   dot: 'bg-amber-400'   },
  DISMISSED:    { text: 'text-slate-400',   border: 'border-white/10',       bg: 'bg-white/5',        dot: 'bg-slate-600'   },
  RESOLVED:     { text: 'text-emerald-300', border: 'border-emerald-500/25', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
};

const STATUS_FILTERS = ['ALL', 'OPEN', 'ACKNOWLEDGED', 'DISMISSED', 'RESOLVED'];

const emptyIncidentForm = {
  title: '',
  description: '',
  priority: 'P2',
  category: 'Network Anomaly',
  source: 'Alert Engine',
  status: 'OPEN',
  assignedTo: '',
  assignedTeam: '',
  dueAt: '',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const style = SEVERITY_STYLES[severity?.toUpperCase()] ?? SEVERITY_STYLES.INFO;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-bold font-mono tracking-[0.15em] uppercase ${style.text} ${style.border} ${style.bg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLES[severity?.toUpperCase()]?.dot ?? 'bg-slate-500'}`} />
      {severity ?? 'INFO'}
    </span>
  );
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status?.toUpperCase()] ?? STATUS_STYLES.OPEN;
  const labels = {
    OPEN: 'Open', ACKNOWLEDGED: 'Ack\'d', DISMISSED: 'Dismissed', RESOLVED: 'Resolved',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-bold font-mono tracking-[0.15em] uppercase ${style.text} ${style.border} ${style.bg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {labels[status?.toUpperCase()] ?? status}
    </span>
  );
}

// ─── Mock data (used when backend has no alerts yet) ─────────────────────────
const MOCK_ALERTS = [
  { id: 'mock-1', title: 'Brute Force Login Attempt', severity: 'CRITICAL', status: 'OPEN',         source: 'SIEM',        message: '47 failed login attempts from 198.51.100.1 in 5 minutes.',       createdAt: new Date(Date.now() - 120000).toISOString() },
  { id: 'mock-2', title: 'Outbound DNS Tunneling',   severity: 'HIGH',     status: 'ACKNOWLEDGED', source: 'Firewall',    message: 'Unusual DNS query volume to external resolver detected.',          createdAt: new Date(Date.now() - 600000).toISOString() },
  { id: 'mock-3', title: 'Lateral Movement Detected',severity: 'HIGH',     status: 'OPEN',         source: 'EDR',         message: 'Process spawning anomaly on WKSTN-014 indicating pivot attempt.',  createdAt: new Date(Date.now() - 900000).toISOString() },
  { id: 'mock-4', title: 'Config File Modified',     severity: 'MEDIUM',   status: 'OPEN',         source: 'FIM',         message: '/etc/sudoers modified outside change window on PROD-DB-01.',      createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 'mock-5', title: 'Suspicious Powershell',    severity: 'HIGH',     status: 'OPEN',         source: 'SIEM',        message: 'Encoded PowerShell execution detected on WKSTN-022.',             createdAt: new Date(Date.now() - 2400000).toISOString() },
  { id: 'mock-6', title: 'Port Scan from Internal',  severity: 'MEDIUM',   status: 'DISMISSED',    source: 'IDS',         message: 'Internal host 10.0.0.45 scanning subnet 10.0.1.0/24.',           createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'mock-7', title: 'SSL Cert Expiry (3 days)', severity: 'LOW',      status: 'OPEN',         source: 'Monitor',     message: 'TLS certificate for api.internal expires in 3 days.',            createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'mock-8', title: 'User Added to Admin Group',severity: 'CRITICAL', status: 'RESOLVED',     source: 'AD Watcher',  message: 'jdoe@corp.internal added to Domain Admins by svc-account.',      createdAt: new Date(Date.now() - 14400000).toISOString() },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Alerts() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const isAdmin   = currentUser?.role === 'ADMIN';
  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'ANALYST';

  const [alerts, setAlerts]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [isMock, setIsMock]     = useState(false);
  const [error, setError]       = useState('');

  // Filters
  const [search, setSearch]               = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter]   = useState('ALL');

  // Selected alert drawer
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Create incident modal
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentForm, setIncidentForm]           = useState(emptyIncidentForm);
  const [incidentError, setIncidentError]         = useState('');
  const [incidentLoading, setIncidentLoading]     = useState(false);
  const [usersList, setUsersList]                 = useState([]);
  const [teamsList, setTeamsList]                 = useState([]);

  // Action loading states
  const [actionLoading, setActionLoading] = useState({});

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/alerts');
      const data = response.data?.content ?? response.data ?? [];
      if (Array.isArray(data) && data.length >= 0) {
        setAlerts(data);
        setIsMock(false);
      } else {
        throw new Error('unexpected shape');
      }
    } catch {
      // Backend alert endpoint not ready yet — show mock data
      setAlerts(MOCK_ALERTS);
      setIsMock(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportData = async () => {
    try {
      const [usersRes, teamsRes] = await Promise.all([
        axios.get('/api/users?size=100'),
        axios.get('/api/teams'),
      ]);
      setUsersList(usersRes.data.content || []);
      setTeamsList(teamsRes.data || []);
    } catch {
      // non-blocking
    }
  };

  useEffect(() => {
    fetchAlerts();
    if (canManage) fetchSupportData();
  }, [canManage]);

  // ── Derived list ──────────────────────────────────────────────────────────
  const displayedAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const q              = search.toLowerCase();
      const searchMatch    = !q || alert.title?.toLowerCase().includes(q) || alert.message?.toLowerCase().includes(q) || alert.source?.toLowerCase().includes(q);
      const severityMatch  = !severityFilter || alert.severity?.toUpperCase() === severityFilter;
      const statusMatch    = statusFilter === 'ALL' || alert.status?.toUpperCase() === statusFilter;
      return searchMatch && severityMatch && statusMatch;
    });
  }, [alerts, search, severityFilter, statusFilter]);

  // ── Counts ────────────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts = { ALL: alerts.length };
    alerts.forEach((a) => { const s = a.status?.toUpperCase(); counts[s] = (counts[s] || 0) + 1; });
    return counts;
  }, [alerts]);

  const openCount = statusCounts['OPEN'] ?? 0;

  // ── Action helpers ────────────────────────────────────────────────────────
  const setLoaderFor = (id, state) =>
    setActionLoading((prev) => ({ ...prev, [id]: state }));

  const patchAlert = async (id, endpoint, successMsg) => {
    if (isMock) {
      // Optimistic update on mock data
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: endpoint === 'acknowledge' ? 'ACKNOWLEDGED' : 'DISMISSED' }
            : a
        )
      );
      showToast({ type: 'success', message: successMsg + ' (preview — backend pending)' });
      return;
    }
    setLoaderFor(id, true);
    try {
      await axios.put(`/api/alerts/${id}/${endpoint}`);
      showToast({ type: 'success', message: successMsg });
      fetchAlerts();
      if (selectedAlert?.id === id) setSelectedAlert(null);
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Action failed.' });
    } finally {
      setLoaderFor(id, false);
    }
  };

  const handleAcknowledge = (id) => patchAlert(id, 'acknowledge', 'Alert acknowledged.');
  const handleDismiss     = (id) => patchAlert(id, 'dismiss',     'Alert dismissed.');

  // ── Create incident from alert ────────────────────────────────────────────
  const openCreateIncident = (alert) => {
    setIncidentForm({
      ...emptyIncidentForm,
      title: `[Alert] ${alert.title}`,
      description: alert.message || '',
      source: alert.source || 'Alert Engine',
      priority: alert.severity === 'CRITICAL' ? 'P1'
               : alert.severity === 'HIGH'     ? 'P2'
               : alert.severity === 'MEDIUM'   ? 'P3' : 'P4',
    });
    setIncidentError('');
    setShowIncidentModal(true);
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    setIncidentError('');
    if (!incidentForm.title.trim()) {
      setIncidentError('Title is required.');
      return;
    }
    setIncidentLoading(true);
    try {
      await axios.post('/api/incidents', { ...incidentForm, dueAt: incidentForm.dueAt || null });
      showToast({ type: 'success', message: 'Incident created from alert.' });
      setShowIncidentModal(false);
    } catch (err) {
      setIncidentError(err.response?.data?.message || 'Failed to create incident.');
    } finally {
      setIncidentLoading(false);
    }
  };

  const assignableUsers = usersList.filter((u) => u.role === 'ADMIN' || u.role === 'ANALYST');

  // ── Relative time helper ─────────────────────────────────────────────────
  const relativeTime = (iso) => {
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 sc-fade-in">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="sc-panel flex flex-col gap-4 p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="sc-badge border-orange-500/20 bg-orange-500/10 text-orange-300">Alert Management</span>
            <span className="sc-badge border-white/10 bg-white/5 text-slate-300">Real-time Queue</span>
            {isMock && (
              <span className="sc-badge border-amber-500/20 bg-amber-500/10 text-amber-300">
                ⚠ Preview — Backend Pending
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">Alert Queue</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor, acknowledge, and escalate security alerts to incident tickets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {openCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              {openCount} Open
            </span>
          )}
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="c-p sc-button-secondary px-4 py-2.5 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stat mini-cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total',       count: alerts.length,               color: 'text-white',        bg: 'bg-white/5',        border: 'border-white/8'        },
          { label: 'Open',        count: statusCounts['OPEN'] ?? 0,   color: 'text-red-300',      bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
          { label: 'Acknowledged',count: statusCounts['ACKNOWLEDGED'] ?? 0, color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20'  },
          { label: 'Resolved',    count: statusCounts['RESOLVED'] ?? 0, color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20'},
        ].map(({ label, count, color, bg, border }) => (
          <div key={label} className={`sc-card flex items-center justify-between p-4 ${bg} ${border}`}>
            <div>
              <p className="sc-text-kicker">{label}</p>
              <h3 className={`mt-1 text-2xl font-bold ${color}`}>{count}</h3>
            </div>
            <BellRing className={`h-6 w-6 ${color} opacity-40`} />
          </div>
        ))}
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div className="sc-panel p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full px-4 py-2.5 pl-10 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="c-p absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status chips */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`c-p rounded-xl border px-3 py-2 text-[10px] font-bold font-mono tracking-[0.15em] transition-all ${
                  statusFilter === s
                    ? 'border-sky-400/40 bg-sky-500/15 text-sky-300'
                    : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15'
                }`}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()} {statusCounts[s] != null ? `(${statusCounts[s]})` : ''}
              </button>
            ))}
          </div>

          {/* Severity chips */}
          <div className="flex flex-wrap items-center gap-2">
            {['', ...SEVERITIES].map((sev) => (
              <button
                key={sev || 'all-sev'}
                onClick={() => setSeverityFilter(sev)}
                className={`c-p rounded-xl border px-3 py-2 text-[10px] font-bold font-mono tracking-[0.15em] transition-all ${
                  severityFilter === sev
                    ? 'border-red-400/40 bg-red-500/15 text-red-300'
                    : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15'
                }`}
              >
                {sev || 'All Sev'}
              </button>
            ))}
          </div>

          <span className="shrink-0 text-[10px] font-mono text-slate-500">
            {displayedAlerts.length} / {alerts.length}
          </span>
        </div>
      </div>

      {/* ── Alert table ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="sc-panel flex flex-col items-center justify-center py-24">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-xs font-mono text-slate-400">Loading alert queue...</p>
        </div>
      ) : displayedAlerts.length === 0 ? (
        <div className="sc-panel flex flex-col items-center justify-center py-24 text-center">
          <Zap className="mb-3 h-10 w-10 text-slate-700" />
          <p className="text-sm font-mono text-slate-400">No alerts match your filters.</p>
          <p className="text-xs font-mono text-slate-600 mt-1">Try clearing filters or refreshing the queue.</p>
        </div>
      ) : (
        <div className="sc-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-white/3 text-[10px] uppercase font-mono tracking-[0.15em] text-slate-500">
                  <th className="py-3.5 px-5">Severity</th>
                  <th className="py-3.5 px-5">Title / Message</th>
                  <th className="py-3.5 px-5">Source</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Time</th>
                  {canManage && <th className="py-3.5 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono">
                {displayedAlerts.map((alert) => {
                  const isLoading = !!actionLoading[alert.id];
                  const isOpen    = alert.status?.toUpperCase() === 'OPEN';
                  const isAcknowledged = alert.status?.toUpperCase() === 'ACKNOWLEDGED';
                  return (
                    <tr
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className="cursor-pointer transition-colors hover:bg-white/3"
                    >
                      <td className="py-4 px-5">
                        <SeverityBadge severity={alert.severity} />
                      </td>
                      <td className="py-4 px-5 max-w-[280px]">
                        <p className="font-semibold text-white truncate">{alert.title}</p>
                        <p className="mt-0.5 text-slate-500 truncate text-[10px]">{alert.message}</p>
                      </td>
                      <td className="py-4 px-5 text-slate-400">{alert.source}</td>
                      <td className="py-4 px-5">
                        <StatusBadge status={alert.status} />
                      </td>
                      <td className="py-4 px-5 text-slate-500">
                        {relativeTime(alert.createdAt)}
                      </td>
                      {canManage && (
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {isOpen && (
                              <button
                                onClick={() => handleAcknowledge(alert.id)}
                                disabled={isLoading}
                                title="Acknowledge"
                                className="c-p flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[10px] text-amber-300 transition hover:bg-amber-500/25 disabled:opacity-40"
                              >
                                <Check className="h-3 w-3" /> Ack
                              </button>
                            )}
                            {(isOpen || isAcknowledged) && (
                              <button
                                onClick={() => handleDismiss(alert.id)}
                                disabled={isLoading}
                                title="Dismiss"
                                className="c-p flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] text-slate-400 transition hover:border-white/20 hover:text-white disabled:opacity-40"
                              >
                                <X className="h-3 w-3" /> Dismiss
                              </button>
                            )}
                            <button
                              onClick={() => openCreateIncident(alert)}
                              title="Escalate to Incident"
                              className="c-p flex items-center gap-1 rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1.5 text-[10px] text-sky-300 transition hover:bg-sky-500/25"
                            >
                              <Siren className="h-3 w-3" /> Escalate
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Alert Detail Drawer ───────────────────────────────────────────── */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedAlert(null)} />
          <div
            className="w-full max-w-md overflow-y-auto border-l border-white/8 bg-[#0b1220] sc-scale-in"
            style={{ boxShadow: '-24px 0 60px rgba(0,0,0,0.4)' }}
          >
            {/* Top accent bar */}
            <div
              className="h-1 w-full"
              style={{
                background: `linear-gradient(90deg, ${
                  selectedAlert.severity === 'CRITICAL' ? '#ef4444'
                  : selectedAlert.severity === 'HIGH'    ? '#f97316'
                  : selectedAlert.severity === 'MEDIUM'  ? '#f59e0b'
                  : selectedAlert.severity === 'LOW'     ? '#38bdf8'
                  : '#94a3b8'
                }, transparent)`,
              }}
            />
            <div className="space-y-5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={selectedAlert.severity} />
                    <StatusBadge   status={selectedAlert.status} />
                  </div>
                  <h2 className="text-lg font-bold leading-snug text-white">{selectedAlert.title}</h2>
                </div>
                <button onClick={() => setSelectedAlert(null)} className="c-p mt-1 text-slate-400 transition hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {selectedAlert.message && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Message</p>
                  <p className="rounded-xl border border-white/8 bg-white/5 p-3 text-xs leading-relaxed text-slate-300">
                    {selectedAlert.message}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Source',   value: selectedAlert.source    || 'Unknown' },
                  { label: 'Received', value: relativeTime(selectedAlert.createdAt) },
                  { label: 'Full Time',value: new Date(selectedAlert.createdAt).toLocaleString() },
                  { label: 'Alert ID', value: selectedAlert.id?.slice(0, 12) + '...' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-white/8 bg-white/5 p-3">
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
                    <p className="text-xs font-mono font-semibold text-slate-200 break-all">{value}</p>
                  </div>
                ))}
              </div>

              {canManage && (
                <div className="flex flex-col gap-2 border-t border-white/8 pt-3">
                  {selectedAlert.status?.toUpperCase() === 'OPEN' && (
                    <button
                      onClick={() => { handleAcknowledge(selectedAlert.id); setSelectedAlert(null); }}
                      className="c-p sc-button-secondary w-full px-4 py-2.5 text-xs font-semibold"
                    >
                      <Check className="h-3.5 w-3.5 text-amber-300" /> Acknowledge Alert
                    </button>
                  )}
                  {['OPEN','ACKNOWLEDGED'].includes(selectedAlert.status?.toUpperCase()) && (
                    <button
                      onClick={() => { handleDismiss(selectedAlert.id); setSelectedAlert(null); }}
                      className="c-p sc-button-secondary w-full px-4 py-2.5 text-xs font-semibold"
                    >
                      <X className="h-3.5 w-3.5" /> Dismiss Alert
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedAlert(null); openCreateIncident(selectedAlert); }}
                    className="c-p sc-button-primary w-full px-4 py-2.5 text-xs font-semibold"
                  >
                    <Siren className="h-3.5 w-3.5" /> Escalate to Incident
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Incident Modal ──────────────────────────────────────────── */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal relative max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 sc-scale-in">
            <button onClick={() => setShowIncidentModal(false)} className="c-p absolute right-4 top-4 text-slate-400 transition hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-white">
              <Siren className="h-5 w-5 text-sky-300" /> Escalate to Incident
            </h3>

            <form onSubmit={handleCreateIncident} className="space-y-4">
              {incidentError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                  <AlertTriangle className="h-4 w-4" />{incidentError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Title *</label>
                <input
                  value={incidentForm.title}
                  onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                  className="glass-input w-full px-4 py-3 text-xs"
                  placeholder="Incident title..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Priority</label>
                  <select value={incidentForm.priority} onChange={(e) => setIncidentForm({ ...incidentForm, priority: e.target.value })} className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                    {['P1','P2','P3','P4'].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Category</label>
                  <select value={incidentForm.category} onChange={(e) => setIncidentForm({ ...incidentForm, category: e.target.value })} className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                    {['Malware','Phishing','Unauthorized Access','Data Exposure','Network Anomaly','Policy Violation'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Due At (SLA)</label>
                  <input type="datetime-local" value={incidentForm.dueAt} onChange={(e) => setIncidentForm({ ...incidentForm, dueAt: e.target.value })} className="glass-input w-full px-4 py-3 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Assignee</label>
                  <select value={incidentForm.assignedTo} onChange={(e) => setIncidentForm({ ...incidentForm, assignedTo: e.target.value })} className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                    <option value="">Unassigned</option>
                    {assignableUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Routing Team</label>
                  <select value={incidentForm.assignedTeam} onChange={(e) => setIncidentForm({ ...incidentForm, assignedTeam: e.target.value })} className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                    <option value="">No team</option>
                    {teamsList.map((t) => <option key={t.id} value={t.id}>{t.teamName}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Description</label>
                <textarea
                  value={incidentForm.description}
                  onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  rows="4"
                  className="glass-input w-full px-4 py-3 text-xs"
                  placeholder="Alert evidence, impact, and initial response notes..."
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowIncidentModal(false)} className="c-p sc-button-secondary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]">
                  Cancel
                </button>
                <button type="submit" disabled={incidentLoading} className="c-p sc-button-primary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] disabled:opacity-50">
                  {incidentLoading ? 'Creating...' : 'Create Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}