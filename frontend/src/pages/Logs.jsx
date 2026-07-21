import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Activity,
  AlertTriangle,
  Bookmark,
  BookmarkPlus,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Filter,
  Globe,
  Hash,
  Network,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { useToast } from '../components/Toast';

// ─── System type config ───────────────────────────────────────────────────────
const SYSTEM_TYPES = ['WINDOWS', 'LINUX', 'APACHE', 'NGINX', 'FIREWALL', 'ROUTER', 'IDS', 'ENDPOINT'];

const SYSTEM_STYLES = {
  WINDOWS:  { text: 'text-sky-300',     border: 'border-sky-500/25',     bg: 'bg-sky-500/10'     },
  LINUX:    { text: 'text-amber-300',   border: 'border-amber-500/25',   bg: 'bg-amber-500/10'   },
  APACHE:   { text: 'text-orange-300',  border: 'border-orange-500/25',  bg: 'bg-orange-500/10'  },
  NGINX:    { text: 'text-emerald-300', border: 'border-emerald-500/25', bg: 'bg-emerald-500/10' },
  FIREWALL: { text: 'text-red-300',     border: 'border-red-500/25',     bg: 'bg-red-500/10'     },
  ROUTER:   { text: 'text-purple-300',  border: 'border-purple-500/25',  bg: 'bg-purple-500/10'  },
  IDS:      { text: 'text-pink-300',    border: 'border-pink-500/25',    bg: 'bg-pink-500/10'    },
  ENDPOINT: { text: 'text-slate-300',   border: 'border-white/15',       bg: 'bg-white/8'        },
};

// ─── Severity chip config ─────────────────────────────────────────────────────
const SEVERITY_CHIPS = [
  { label: 'All',      value: '' },
  { label: 'Critical', value: 'CRITICAL', min: 0.85, text: 'text-red-300',     border: 'border-red-500/30',     bg: 'bg-red-500/10'     },
  { label: 'High',     value: 'HIGH',     min: 0.65, max: 0.85, text: 'text-amber-300',  border: 'border-amber-500/30',  bg: 'bg-amber-500/10'  },
  { label: 'Medium',   value: 'MEDIUM',   min: 0.35, max: 0.65, text: 'text-sky-300',    border: 'border-sky-500/30',    bg: 'bg-sky-500/10'    },
  { label: 'Low',      value: 'LOW',      max: 0.35, text: 'text-emerald-300', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
];

const SAVED_QUERIES_KEY = 'sc_saved_log_queries';

function loadSavedQueries() {
  try { return JSON.parse(localStorage.getItem(SAVED_QUERIES_KEY) || '[]'); }
  catch { return []; }
}
function persistSavedQueries(queries) {
  localStorage.setItem(SAVED_QUERIES_KEY, JSON.stringify(queries));
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SystemTypeBadge({ type }) {
  const style = SYSTEM_STYLES[type] || SYSTEM_STYLES.ENDPOINT;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold font-mono tracking-[0.15em] uppercase ${style.text} ${style.border} ${style.bg}`}>
      {type}
    </span>
  );
}

function RiskBar({ score }) {
  const pct = Math.round((score ?? 0) * 100);
  const color = score >= 0.85 ? '#ef4444' : score >= 0.65 ? '#f59e0b' : score >= 0.35 ? '#38bdf8' : '#22c55e';
  const textColor = score >= 0.85 ? 'text-red-400' : score >= 0.65 ? 'text-amber-400' : score >= 0.35 ? 'text-sky-400' : 'text-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className={`text-[10px] font-bold font-mono ${textColor}`}>{pct}%</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Logs() {
  const { showToast } = useToast();

  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search, setSearch]           = useState('');
  const [systemType, setSystemType]   = useState('');
  const [isAnomaly, setIsAnomaly]     = useState('');
  const [severity, setSeverity]       = useState('');
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [showDatePanel, setShowDatePanel] = useState(false);

  // ── Upload ────────────────────────────────────────────────────────────────
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [selectedFile, setSelectedFile]       = useState(null);
  const [uploadType, setUploadType]           = useState('WINDOWS');
  const [uploading, setUploading]             = useState(false);

  // ── Log detail drawer ─────────────────────────────────────────────────────
  const [selectedLog, setSelectedLog] = useState(null);

  // ── Delete confirm ────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  // ── Saved queries ─────────────────────────────────────────────────────────
  const [savedQueries, setSavedQueries]   = useState(loadSavedQueries);
  const [queryName, setQueryName]         = useState('');
  const [showSavedPanel, setShowSavedPanel] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (systemType) params.systemType = systemType;
      if (isAnomaly)  params.isAnomaly  = isAnomaly === 'true';
      if (search)     params.search     = search;
      if (startDate)  params.startDate  = new Date(startDate).toISOString();
      if (endDate)    params.endDate    = new Date(endDate).toISOString();
      const response = await axios.get('/api/logs', { params });
      setLogs(response.data || []);
    } catch {
      setError('Failed to fetch security logs database.');
    } finally {
      setLoading(false);
    }
  }, [systemType, isAnomaly, search, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, [systemType, isAnomaly]);

  // ── Derived: severity filter client-side ──────────────────────────────────
  const displayedLogs = useMemo(() => {
    if (!severity) return logs;
    const chip = SEVERITY_CHIPS.find((c) => c.value === severity);
    if (!chip) return logs;
    return logs.filter((log) => {
      const rs = log.riskScore ?? 0;
      if (chip.min !== undefined && rs < chip.min) return false;
      if (chip.max !== undefined && rs >= chip.max) return false;
      return true;
    });
  }, [logs, severity]);

  // ── Summary stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const anomalyCount = logs.filter((l) => l.anomaly).length;
    return {
      total: logs.length,
      anomalies: anomalyCount,
      normal: logs.length - anomalyCount,
      anomalyPct: logs.length ? Math.round((anomalyCount / logs.length) * 100) : 0,
    };
  }, [logs]);

  // ── System type counts ────────────────────────────────────────────────────
  const systemCounts = useMemo(() => {
    const counts = {};
    logs.forEach((l) => { counts[l.systemType] = (counts[l.systemType] || 0) + 1; });
    return counts;
  }, [logs]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleResetFilters = () => {
    setSearch(''); setSystemType(''); setIsAnomaly('');
    setSeverity(''); setStartDate(''); setEndDate('');
  };

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) { showToast({ type: 'error', message: 'Please select a file to ingest.' }); return; }
    const fd = new FormData();
    fd.append('file', selectedFile);
    fd.append('systemType', uploadType);
    setUploading(true);
    try {
      const response = await axios.post('/api/logs/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast({ type: 'success', message: response.data.message || 'Log file ingested.' });
      setSelectedFile(null);
      document.getElementById('log-file-input').value = '';
      setShowUploadPanel(false);
      fetchLogs();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/logs/${deleteTarget.id}`);
      showToast({ type: 'success', message: 'Log record deleted.' });
      setDeleteTarget(null);
      if (selectedLog?.id === deleteTarget.id) setSelectedLog(null);
      fetchLogs();
    } catch {
      showToast({ type: 'error', message: 'Failed to delete log.' });
    } finally {
      setDeleting(false);
    }
  };

  // ── Saved queries ─────────────────────────────────────────────────────────
  const activeFilterCount = [search, systemType, isAnomaly, severity, startDate, endDate].filter(Boolean).length;

  const handleSaveQuery = () => {
    const name = queryName.trim() || `Query ${savedQueries.length + 1}`;
    const newQ = { id: Date.now(), name, filters: { search, systemType, isAnomaly, severity, startDate, endDate } };
    const updated = [newQ, ...savedQueries].slice(0, 20);
    setSavedQueries(updated);
    persistSavedQueries(updated);
    setQueryName('');
  };

  const handleLoadQuery = (q) => {
    const { search: s, systemType: st, isAnomaly: ia, severity: sv, startDate: sd, endDate: ed } = q.filters;
    setSearch(s ?? ''); setSystemType(st ?? ''); setIsAnomaly(ia ?? '');
    setSeverity(sv ?? ''); setStartDate(sd ?? ''); setEndDate(ed ?? '');
    setShowSavedPanel(false);
  };

  const handleDeleteQuery = (id) => {
    const updated = savedQueries.filter((q) => q.id !== id);
    setSavedQueries(updated);
    persistSavedQueries(updated);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 sc-fade-in">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="sc-panel flex flex-col gap-4 p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="sc-badge border-sky-500/20 bg-sky-500/10 text-sky-300">Log Explorer</span>
            <span className="sc-badge border-white/10 bg-white/5 text-slate-300">Security Logs</span>
            {isAnomaly === 'true' && (
              <span className="sc-badge border-red-500/20 bg-red-500/10 text-red-300">Anomaly Filter Active</span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">Log Management</h1>
          <p className="mt-1 text-sm text-slate-400">
            Ingest, search, and analyze security logs from Windows, Linux, firewalls, and network devices.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSavedPanel((v) => !v)}
            className={`c-p flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
              showSavedPanel
                ? 'border-sky-400/40 bg-sky-500/15 text-sky-300'
                : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15 hover:text-white'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
            Saved Queries
            {savedQueries.length > 0 && (
              <span className="rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[9px] text-sky-300 font-bold">
                {savedQueries.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowUploadPanel((v) => !v)}
            className={`c-p flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
              showUploadPanel
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15 hover:text-white'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            Ingest Logs
          </button>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="c-p sc-button-secondary px-4 py-2.5 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Mini stat cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Logs',  value: stats.total,        icon: FileText,    color: 'text-white',        bg: 'bg-white/5',        border: 'border-white/8'        },
          { label: 'Anomalies',   value: stats.anomalies,    icon: AlertTriangle,color:'text-red-300',       bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
          { label: 'Normal',      value: stats.normal,       icon: ShieldCheck, color: 'text-emerald-300',  bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'Anomaly Rate',value: `${stats.anomalyPct}%`, icon: Activity, color: stats.anomalyPct > 30 ? 'text-red-300' : stats.anomalyPct > 10 ? 'text-amber-300' : 'text-emerald-300', bg: 'bg-white/5', border: 'border-white/8' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`sc-card flex items-center justify-between p-4 ${bg} ${border}`}>
            <div>
              <p className="sc-text-kicker">{label}</p>
              <h3 className={`mt-1 text-2xl font-bold ${color}`}>{value}</h3>
            </div>
            <Icon className={`h-6 w-6 ${color} opacity-40`} />
          </div>
        ))}
      </div>

      {/* ── Saved Queries Panel ───────────────────────────────────────────── */}
      {showSavedPanel && (
        <div className="sc-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <BookmarkPlus className="h-4 w-4 text-sky-400" />
              Saved Filter Presets
            </h2>
            <button onClick={() => setShowSavedPanel(false)} className="c-p text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              placeholder="Query name (optional)"
              className="glass-input flex-1 px-4 py-2.5 text-xs"
            />
            <button
              onClick={handleSaveQuery}
              disabled={activeFilterCount === 0}
              className="c-p sc-button-primary px-4 py-2.5 text-xs font-semibold disabled:opacity-40"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              Save Current
            </button>
          </div>
          {savedQueries.length === 0 ? (
            <p className="py-4 text-center text-xs font-mono text-slate-500">
              No saved queries yet. Apply filters then click Save Current.
            </p>
          ) : (
            <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
              {savedQueries.map((q) => (
                <div key={q.id} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 px-3 py-2">
                  <button
                    onClick={() => handleLoadQuery(q)}
                    className="c-p flex-1 truncate text-left text-xs font-mono text-slate-200 transition hover:text-sky-300"
                  >
                    {q.name}
                    <span className="ml-2 text-[10px] text-slate-600">
                      {Object.values(q.filters).filter(Boolean).length} filters
                    </span>
                  </button>
                  <button onClick={() => handleDeleteQuery(q.id)} className="c-p ml-2 rounded p-1 text-red-400 hover:bg-red-500/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Upload Panel ──────────────────────────────────────────────────── */}
      {showUploadPanel && (
        <div className="sc-panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <Upload className="h-4 w-4 text-emerald-400" />
              Ingest Log File
            </h2>
            <button onClick={() => setShowUploadPanel(false)} className="c-p text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Log Origin System
              </label>
              <div className="flex flex-wrap gap-2">
                {SYSTEM_TYPES.map((type) => {
                  const style = SYSTEM_STYLES[type];
                  const active = uploadType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUploadType(type)}
                      className={`c-p rounded-xl border px-3 py-2 text-[10px] font-bold font-mono tracking-[0.15em] transition ${
                        active ? `${style.border} ${style.bg} ${style.text}` : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Log File (.log, .txt)
                </label>
                <input
                  id="log-file-input"
                  type="file"
                  accept=".log,.txt"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white/8 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-300 hover:file:bg-white/12 file:cursor-pointer cursor-pointer"
                />
              </div>
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="c-p sc-button-primary px-5 py-2.5 text-xs font-semibold disabled:opacity-40"
              >
                {uploading ? (
                  <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" /><span>Uploading...</span></>
                ) : (
                  <><Upload className="h-3.5 w-3.5" /><span>Ingest Records</span></>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div className="sc-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Filter className="h-4 w-4 text-slate-400" />
            Search & Filter
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-300">
                {activeFilterCount} active
              </span>
            )}
          </h2>
          {activeFilterCount > 0 && (
            <button onClick={handleResetFilters} className="c-p text-[10px] font-mono text-red-400 hover:text-red-300 transition">
              Clear all
            </button>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); fetchLogs(); }} className="space-y-4">
          {/* Row 1: Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search logs (IP, user, payload, device...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full px-4 py-2.5 pl-10 text-sm"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="c-p absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Row 2: System type chips */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">System Type</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSystemType('')}
                className={`c-p rounded-xl border px-3 py-2 text-[10px] font-bold font-mono tracking-[0.15em] transition ${
                  systemType === ''
                    ? 'border-sky-400/40 bg-sky-500/15 text-sky-300'
                    : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15'
                }`}
              >
                All {systemCounts && Object.values(systemCounts).reduce((a, b) => a + b, 0) > 0 ? `(${logs.length})` : ''}
              </button>
              {SYSTEM_TYPES.map((type) => {
                const style = SYSTEM_STYLES[type];
                const active = systemType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSystemType(type)}
                    className={`c-p flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold font-mono tracking-[0.15em] transition ${
                      active ? `${style.border} ${style.bg} ${style.text}` : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15'
                    }`}
                  >
                    {type}
                    {systemCounts[type] && (
                      <span className={`rounded-full px-1 py-0.5 text-[9px] ${active ? `${style.bg} ${style.text}` : 'bg-white/8 text-slate-500'}`}>
                        {systemCounts[type]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Anomaly + Date Range */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Anomaly toggle chips */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Anomaly:</span>
              {[
                { label: 'All', value: '' },
                { label: 'Anomalies Only', value: 'true' },
                { label: 'Normal Only',    value: 'false' },
              ].map(({ label, value }) => (
                <button
                  key={value || 'all'}
                  type="button"
                  onClick={() => setIsAnomaly(value)}
                  className={`c-p rounded-xl border px-3 py-2 text-[10px] font-bold font-mono tracking-[0.12em] transition ${
                    isAnomaly === value
                      ? value === 'true'  ? 'border-red-400/40 bg-red-500/15 text-red-300'
                      : value === 'false' ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                      : 'border-sky-400/40 bg-sky-500/15 text-sky-300'
                      : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Date range toggle */}
            <button
              type="button"
              onClick={() => setShowDatePanel((v) => !v)}
              className={`c-p flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-mono font-bold tracking-[0.12em] transition ${
                startDate || endDate
                  ? 'border-sky-400/40 bg-sky-500/15 text-sky-300'
                  : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              {startDate || endDate
                ? `${startDate ? new Date(startDate).toLocaleDateString() : '—'} → ${endDate ? new Date(endDate).toLocaleDateString() : '—'}`
                : 'Date Range'}
              {showDatePanel ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {/* Date range inputs */}
          {showDatePanel && (
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-white/8 bg-white/3 p-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">From</label>
                <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="glass-input w-full px-4 py-2.5 text-xs text-slate-300" />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">To</label>
                <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="glass-input w-full px-4 py-2.5 text-xs text-slate-300" />
              </div>
            </div>
          )}

          {/* Severity chips */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Risk Severity</p>
            <div className="flex flex-wrap gap-2">
              {SEVERITY_CHIPS.map((chip) => (
                <button
                  key={chip.value || 'all'}
                  type="button"
                  onClick={() => setSeverity(chip.value)}
                  className={`c-p rounded-xl border px-3 py-2 text-[10px] font-bold font-mono tracking-[0.15em] transition ${
                    severity === chip.value
                      ? chip.border && chip.bg && chip.text
                        ? `${chip.border} ${chip.bg} ${chip.text}`
                        : 'border-sky-400/40 bg-sky-500/15 text-sky-300'
                      : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" className="c-p sc-button-secondary flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em]">
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* ── Logs Table ────────────────────────────────────────────────────── */}
      <div className="sc-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/8 bg-white/3 px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-slate-300">
              Security Log Records ({displayedLogs.length}{displayedLogs.length !== logs.length ? ` / ${logs.length}` : ''})
            </span>
            {severity && (
              <span className={`sc-badge ${SEVERITY_CHIPS.find((c) => c.value === severity)?.border ?? ''} ${SEVERITY_CHIPS.find((c) => c.value === severity)?.bg ?? ''} ${SEVERITY_CHIPS.find((c) => c.value === severity)?.text ?? ''}`}>
                {SEVERITY_CHIPS.find((c) => c.value === severity)?.label} severity
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <p className="text-xs font-mono text-slate-400">Syncing log database...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="mb-3 h-8 w-8 text-red-300" />
            <p className="text-sm font-mono text-red-300">{error}</p>
          </div>
        ) : displayedLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Zap className="mb-3 h-10 w-10 text-slate-700" />
            <p className="text-sm font-mono text-slate-400">No log records match your filters.</p>
            <p className="text-xs font-mono text-slate-600 mt-1">Upload a log file or adjust your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-white/3 text-[10px] uppercase font-mono tracking-[0.15em] text-slate-500">
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-5">System</th>
                  <th className="py-3.5 px-5">Source IP</th>
                  <th className="py-3.5 px-5">Identity</th>
                  <th className="py-3.5 px-5">AI Status</th>
                  <th className="py-3.5 px-5">Risk</th>
                  <th className="py-3.5 px-5">Raw Payload</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono">
                {displayedLogs.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedLog(item)}
                    className="cursor-pointer transition-colors hover:bg-white/3"
                  >
                    <td className="py-4 px-5 text-slate-400 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-5">
                      <SystemTypeBadge type={item.systemType} />
                    </td>
                    <td className="py-4 px-5 text-slate-300">{item.ipAddress}</td>
                    <td className="py-4 px-5 text-slate-400 max-w-[120px] truncate" title={item.userEmail}>
                      {item.userEmail}
                    </td>
                    <td className="py-4 px-5">
                      {item.anomaly ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-300">
                          <AlertTriangle className="h-2.5 w-2.5" /> ANOMALY
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                          <ShieldCheck className="h-2.5 w-2.5" /> NORMAL
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <RiskBar score={item.riskScore} />
                    </td>
                    <td className="py-4 px-5 text-slate-400 max-w-[200px] truncate" title={item.rawMessage}>
                      {item.rawMessage}
                    </td>
                    <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="c-p rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 transition hover:bg-red-500/25"
                        title="Delete log"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Log Detail Drawer ─────────────────────────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div
            className="w-full max-w-md overflow-y-auto border-l border-white/8 bg-[#0b1220] sc-scale-in"
            style={{ boxShadow: '-24px 0 60px rgba(0,0,0,0.4)' }}
          >
            {/* Accent bar */}
            <div
              className="h-1 w-full"
              style={{
                background: `linear-gradient(90deg, ${
                  selectedLog.anomaly ? '#ef4444' : '#22c55e'
                }, transparent)`,
              }}
            />
            <div className="space-y-5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <SystemTypeBadge type={selectedLog.systemType} />
                    {selectedLog.anomaly ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-300">
                        <AlertTriangle className="h-2.5 w-2.5" /> ANOMALY
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                        <ShieldCheck className="h-2.5 w-2.5" /> NORMAL
                      </span>
                    )}
                  </div>
                  <h2 className="font-bold text-white text-sm">Security Log Details</h2>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5 break-all">{selectedLog.id}</p>
                </div>
                <button onClick={() => setSelectedLog(null)} className="c-p mt-1 text-slate-400 transition hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Clock,   label: 'Timestamp', value: new Date(selectedLog.timestamp).toLocaleString() },
                  { icon: Network, label: 'IP : Port',  value: `${selectedLog.ipAddress} : ${selectedLog.port}` },
                  { icon: Shield,  label: 'Protocol',  value: selectedLog.protocol || '—' },
                  { icon: Globe,   label: 'Country',   value: selectedLog.country   || 'Unknown' },
                  { icon: Hash,    label: 'Bytes',     value: selectedLog.bytes != null ? `${selectedLog.bytes.toLocaleString()} B` : '—' },
                  { icon: FileText,label: 'Device',    value: selectedLog.device    || '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-xl border border-white/8 bg-white/5 p-3">
                    <div className="mb-1 flex items-center gap-1.5">
                      <Icon className="h-3 w-3 text-slate-500" />
                      <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
                    </div>
                    <p className="text-xs font-mono font-semibold text-slate-200 break-all">{value}</p>
                  </div>
                ))}
              </div>

              {/* Identity */}
              <div className="rounded-xl border border-white/8 bg-white/5 p-3">
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">Identity</p>
                <p className="text-xs font-mono font-semibold text-slate-200">{selectedLog.userEmail}</p>
              </div>

              {/* AI Analysis */}
              <div className={`rounded-xl border p-3 ${selectedLog.anomaly ? 'border-red-500/20 bg-red-500/8' : 'border-emerald-500/20 bg-emerald-500/8'}`}>
                <p className={`mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] ${selectedLog.anomaly ? 'text-red-400' : 'text-emerald-400'}`}>
                  AI Analysis
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-500">Risk Score: </span>
                    <span className={`font-bold ${selectedLog.riskScore >= 0.85 ? 'text-red-400' : selectedLog.riskScore >= 0.65 ? 'text-amber-400' : selectedLog.riskScore >= 0.35 ? 'text-sky-400' : 'text-emerald-400'}`}>
                      {Math.round(selectedLog.riskScore * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Confidence: </span>
                    <span className="font-bold text-slate-200">{Math.round(selectedLog.confidenceScore * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Raw message */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Raw Message</p>
                <pre className="max-h-40 overflow-y-auto rounded-xl border border-white/8 bg-black/40 p-3 text-[10px] text-slate-300 whitespace-pre-wrap break-all">
                  {selectedLog.rawMessage}
                </pre>
              </div>

              {/* Delete from drawer */}
              <div className="border-t border-white/8 pt-3">
                <button
                  onClick={() => { setSelectedLog(null); setDeleteTarget(selectedLog); }}
                  className="c-p sc-button-danger w-full px-4 py-2.5 text-xs font-semibold"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Log Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal w-full max-w-sm p-6 text-center sc-scale-in">
            <Trash2 className="mx-auto mb-4 h-12 w-12 text-red-300" />
            <h3 className="mb-2 text-lg font-bold text-white">Delete Log Record?</h3>
            <p className="mb-1 text-xs font-mono text-slate-400">This will permanently remove:</p>
            <p className="mb-6 font-mono text-xs font-bold text-slate-200 break-all">
              {deleteTarget.ipAddress} · {deleteTarget.systemType} · {new Date(deleteTarget.timestamp).toLocaleString()}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="c-p sc-button-secondary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="c-p sc-button-danger flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
