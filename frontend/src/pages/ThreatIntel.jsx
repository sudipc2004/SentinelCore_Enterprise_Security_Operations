import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  Globe,
  Key,
  Link2,
  Plus,
  Radar,
  Search,
  Server,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { useToast } from '../components/Toast';

// ─── IOC type config ─────────────────────────────────────────────────────────
const IOC_TYPES = [
  { value: 'ALL',          label: 'All Types' },
  { value: 'IP',           label: 'IP Address' },
  { value: 'DOMAIN',       label: 'Domain' },
  { value: 'URL',          label: 'URL' },
  { value: 'MALWARE_HASH', label: 'Hash' },
];

const TYPE_STYLES = {
  IP:           { text: 'text-emerald-300', border: 'border-emerald-500/25', bg: 'bg-emerald-500/10' },
  DOMAIN:       { text: 'text-purple-300',  border: 'border-purple-500/25',  bg: 'bg-purple-500/10'  },
  URL:          { text: 'text-sky-300',     border: 'border-sky-500/25',     bg: 'bg-sky-500/10'     },
  MALWARE_HASH: { text: 'text-red-300',     border: 'border-red-500/25',     bg: 'bg-red-500/10'     },
};

const IOC_SOURCES = [
  'AlienVault OTX',
  'VirusTotal',
  'Shodan',
  'Abuse.ch',
  'MISP',
  'Manual',
  'Custom Log Check',
];

const emptyForm = {
  type: 'IP',
  value: '',
  description: '',
  source: 'AlienVault OTX',
  reviewerTeamId: '',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.IP;
  const labels = { IP: 'IP', DOMAIN: 'DOMAIN', URL: 'URL', MALWARE_HASH: 'HASH' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-bold font-mono tracking-[0.18em] uppercase ${style.text} ${style.border} ${style.bg}`}
    >
      <IocIcon type={type} size={10} />
      {labels[type] ?? type}
    </span>
  );
}

function IocIcon({ type, size = 14 }) {
  const cls = `text-current`;
  const s = { width: size, height: size };
  switch (type) {
    case 'IP':           return <Server   className={cls} style={s} />;
    case 'DOMAIN':       return <Globe    className={cls} style={s} />;
    case 'URL':          return <Link2    className={cls} style={s} />;
    case 'MALWARE_HASH': return <Key      className={cls} style={s} />;
    default:             return <Key      className={cls} style={s} />;
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ThreatIntel() {
  const { showToast } = useToast();

  const [iocs, setIocs]       = useState([]);
  const [teams, setTeams]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Filters
  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData]       = useState(emptyForm);
  const [formError, setFormError]     = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Data fetching ───────────────────────────────────────────────────────────
  const fetchIocs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/threat-intel');
      setIocs(response.data || []);
    } catch {
      setError('Failed to fetch indicators of compromise database.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/teams');
      setTeams(response.data || []);
    } catch {
      // non-blocking
    }
  };

  useEffect(() => {
    fetchIocs();
    fetchTeams();
  }, []);

  // ── Derived filtered list ───────────────────────────────────────────────────
  const displayedIocs = useMemo(() => {
    return iocs.filter((ioc) => {
      const typeMatch   = typeFilter === 'ALL' || ioc.type === typeFilter;
      const q           = search.toLowerCase();
      const searchMatch = !q
        || ioc.value?.toLowerCase().includes(q)
        || ioc.description?.toLowerCase().includes(q)
        || ioc.source?.toLowerCase().includes(q);
      return typeMatch && searchMatch;
    });
  }, [iocs, search, typeFilter]);

  const getTeamName = (teamId) =>
    teams.find((t) => t.id === teamId)?.teamName || 'Unassigned';

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.value.trim() || !formData.description.trim()) {
      setFormError('Indicator value and description are required.');
      return;
    }
    setFormLoading(true);
    try {
      await axios.post('/api/threat-intel', formData);
      showToast({ type: 'success', message: 'IOC indicator registered.' });
      setFormData(emptyForm);
      setShowAddForm(false);
      fetchIocs();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to register IOC threat block.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/threat-intel/${deleteTarget.id}`);
      showToast({ type: 'success', message: 'IOC indicator removed.' });
      setDeleteTarget(null);
      fetchIocs();
    } catch {
      showToast({ type: 'error', message: 'Failed to remove IOC indicator.' });
    }
  };

  // ── Type chip counts ────────────────────────────────────────────────────────
  const typeCounts = useMemo(() => {
    const counts = { ALL: iocs.length };
    iocs.forEach((ioc) => { counts[ioc.type] = (counts[ioc.type] || 0) + 1; });
    return counts;
  }, [iocs]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 sc-fade-in">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="sc-panel flex flex-col gap-4 p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="sc-badge border-red-500/20 bg-red-500/10 text-red-300">Threat Intelligence</span>
            <span className="sc-badge border-white/10 bg-white/5 text-slate-300">IOC Blocklist</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
            Threat Intelligence
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage blocklists and Indicators of Compromise (IOC) to filter malicious sources.
          </p>
        </div>
        <button
          onClick={() => { setFormData(emptyForm); setFormError(''); setShowAddForm(true); }}
          className="c-p sc-button-primary px-4 py-3 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          <span>Add IOC</span>
        </button>
      </div>

      {/* ── Search + filter toolbar ──────────────────────────────────────── */}
      <div className="sc-panel p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by value, description, source..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full px-4 py-2.5 pl-10 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="c-p absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Type filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            {IOC_TYPES.map(({ value, label }) => {
              const active = typeFilter === value;
              const count = typeCounts[value] ?? 0;
              return (
                <button
                  key={value}
                  onClick={() => setTypeFilter(value)}
                  className={`c-p flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold font-mono tracking-[0.15em] transition-all ${
                    active
                      ? 'border-sky-400/40 bg-sky-500/15 text-sky-300'
                      : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15 hover:text-white'
                  }`}
                >
                  {value !== 'ALL' && <IocIcon type={value} size={10} />}
                  {label}
                  <span
                    className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] ${
                      active ? 'bg-sky-500/30 text-sky-200' : 'bg-white/8 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Result count */}
          <span className="shrink-0 text-[10px] font-mono text-slate-500">
            {displayedIocs.length} / {iocs.length} IOCs
          </span>
        </div>
      </div>

      {/* ── IOC Table ───────────────────────────────────────────────────── */}
      <div className="sc-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/8 bg-white/3 px-6 py-3">
          <span className="text-xs font-mono font-semibold text-slate-300">
            Active Blocked Indicators
          </span>
          <button
            onClick={fetchIocs}
            className="c-p rounded-lg border border-white/8 bg-white/5 px-3 py-1.5 text-[10px] font-mono text-slate-400 transition hover:border-white/15 hover:text-white"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <p className="text-xs font-mono text-slate-400">Syncing IOC database registers...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="mb-3 h-8 w-8 text-red-300" />
            <p className="text-sm font-mono text-red-300">{error}</p>
          </div>
        ) : displayedIocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-400 animate-pulse" />
            <p className="text-sm font-mono text-slate-400 mb-1">
              {iocs.length === 0 ? 'No indicators of compromise active.' : 'No results match your filters.'}
            </p>
            <p className="text-xs text-slate-600 font-mono">
              {iocs.length === 0
                ? 'Add malicious IPs, domains, or hashes to start detecting threats.'
                : 'Try clearing the search or switching the type filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-white/3 text-[10px] uppercase font-mono tracking-[0.15em] text-slate-500">
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Indicator Value</th>
                  <th className="py-3.5 px-6">Source / Provider</th>
                  <th className="py-3.5 px-6">Reviewer Team</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6">Added</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono">
                {displayedIocs.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-white/3">
                    <td className="py-4 px-6">
                      <TypeBadge type={item.type} />
                    </td>
                    <td className="py-4 px-6 font-semibold text-white select-all max-w-[200px] truncate" title={item.value}>
                      {item.value}
                    </td>
                    <td className="py-4 px-6 text-slate-400">{item.source}</td>
                    <td className="py-4 px-6">
                      <span className="sc-badge border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                        {getTeamName(item.reviewerTeamId)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 max-w-[220px] truncate" title={item.description}>
                      {item.description}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="c-p rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 transition hover:bg-red-500/25"
                        title="Remove Indicator"
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

      {/* ── Add IOC Modal ─────────────────────────────────────────────────── */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal relative w-full max-w-lg p-6 sc-scale-in">
            <button
              onClick={() => setShowAddForm(false)}
              className="c-p absolute right-4 top-4 text-slate-400 transition hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-white">
              <Radar className="h-5 w-5 text-red-300" />
              Register IOC Indicator
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              {/* Type chips inside modal */}
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Indicator Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {IOC_TYPES.filter((t) => t.value !== 'ALL').map(({ value, label }) => {
                    const style = TYPE_STYLES[value];
                    const active = formData.type === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: value })}
                        className={`c-p flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold font-mono tracking-[0.15em] transition-all ${
                          active
                            ? `${style.border} ${style.bg} ${style.text}`
                            : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15'
                        }`}
                      >
                        <IocIcon type={value} size={10} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Indicator Value *
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="e.g. 198.51.100.12 or malware-payload.exe"
                  className="glass-input w-full px-4 py-3 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Source / Feed
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white"
                  >
                    {IOC_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Reviewer Team
                  </label>
                  <select
                    value={formData.reviewerTeamId}
                    onChange={(e) => setFormData({ ...formData, reviewerTeamId: e.target.value })}
                    className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white"
                  >
                    <option value="">Unassigned</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>{team.teamName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  placeholder="Reason for blocking, threat type, campaign attribution..."
                  className="glass-input w-full px-4 py-3 text-xs"
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="c-p sc-button-secondary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="c-p sc-button-primary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Save Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal w-full max-w-sm p-6 text-center sc-scale-in">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-300" />
            <h3 className="mb-2 text-lg font-bold text-white">Remove Indicator?</h3>
            <p className="mb-1 text-xs font-mono text-slate-400">
              This will stop rule triggers against:
            </p>
            <p className="mb-6 font-mono text-sm font-bold text-white break-all">
              {deleteTarget.value}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="c-p sc-button-secondary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="c-p sc-button-danger flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
