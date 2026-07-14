import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Plus,
  Trash2,
  Server,
  Monitor,
  ShieldAlert,
  HardDrive,
  X,
  AlertCircle,
  Upload,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

// ─── Sort options ────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { label: 'Name (A–Z)', key: 'name', dir: 'asc' },
  { label: 'Name (Z–A)', key: 'name', dir: 'desc' },
  { label: 'Criticality ↑', key: 'criticality', dir: 'asc' },
  { label: 'Criticality ↓', key: 'criticality', dir: 'desc' },
  { label: 'Last Seen ↑', key: 'lastSeen', dir: 'asc' },
  { label: 'Last Seen ↓', key: 'lastSeen', dir: 'desc' },
];

const CRITICALITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const TYPE_FILTERS = ['ALL', 'SERVER', 'FIREWALL', 'DATABASE', 'ROUTER', 'ENDPOINT', 'APPLICATION', 'CLOUD_SERVER'];
const STATUS_FILTERS = ['ALL', 'ONLINE', 'OFFLINE'];

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ─── Add asset form states ─────────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'SERVER',
    ipAddress: '',
    macAddress: '',
    os: 'Linux (Ubuntu 22.04)',
    criticality: 'CRITICAL',
    status: 'ONLINE',
    ownerTeamId: '',
  });
  const [formError, setFormError] = useState('');

  // ─── CSV import states ─────────────────────────────────────────────────
  const [showCsvPanel, setShowCsvPanel] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvSuccess, setCsvSuccess] = useState('');
  const [csvError, setCsvError] = useState('');

  // ─── Sort & filter states ──────────────────────────────────────────────
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // ─── Fetch ─────────────────────────────────────────────────────────────
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/assets');
      setAssets(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch corporate assets registry.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/teams');
      setTeams(response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchTeams();
  }, []);

  const getTeamName = (teamId) => teams.find((team) => team.id === teamId)?.teamName || 'Unassigned';

  // ─── Derived: sorted & filtered list ──────────────────────────────────
  const displayedAssets = useMemo(() => {
    let list = [...assets];

    // Filter by type
    if (typeFilter !== 'ALL') list = list.filter((a) => a.type === typeFilter);
    // Filter by status
    if (statusFilter !== 'ALL') list = list.filter((a) => a.status === statusFilter);

    // Sort
    list.sort((a, b) => {
      const { key, dir } = sortOption;
      let valA = a[key];
      let valB = b[key];

      if (key === 'criticality') {
        valA = CRITICALITY_ORDER[valA] ?? 99;
        valB = CRITICALITY_ORDER[valB] ?? 99;
      } else if (key === 'lastSeen') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = String(valA ?? '').toLowerCase();
        valB = String(valB ?? '').toLowerCase();
      }

      if (valA < valB) return dir === 'asc' ? -1 : 1;
      if (valA > valB) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [assets, typeFilter, statusFilter, sortOption]);

  // ─── Add asset ─────────────────────────────────────────────────────────
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name.trim() || !formData.ipAddress.trim() || !formData.macAddress.trim()) {
      setFormError('Asset Name, IP Address, and MAC Address are required.');
      return;
    }
    try {
      await axios.post('/api/assets', formData);
      setFormData({
        name: '',
        type: 'SERVER',
        ipAddress: '',
        macAddress: '',
        os: 'Linux (Ubuntu 22.04)',
        criticality: 'CRITICAL',
        status: 'ONLINE',
        ownerTeamId: '',
      });
      setShowAddForm(false);
      fetchAssets();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to register asset.');
    }
  };

  // ─── Toggle status ─────────────────────────────────────────────────────
  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    try {
      await axios.post('/api/assets', { ...item, status: newStatus });
      fetchAssets();
    } catch {
      alert('Failed to update asset status.');
    }
  };

  // ─── Delete asset ──────────────────────────────────────────────────────
  const handleDeleteAsset = async (id) => {
    if (!window.confirm('Delete this asset from registry? Logs matching this asset IP will continue to process.'))
      return;
    try {
      await axios.delete(`/api/assets/${id}`);
      fetchAssets();
    } catch {
      alert('Failed to remove asset.');
    }
  };

  // ─── CSV upload ────────────────────────────────────────────────────────
  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setCsvError('Please select a CSV file first.');
      return;
    }
    const fd = new FormData();
    fd.append('file', csvFile);
    setCsvUploading(true);
    setCsvError('');
    setCsvSuccess('');
    try {
      const res = await axios.post('/api/assets/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCsvSuccess(res.data?.message || `Imported successfully.`);
      setCsvFile(null);
      document.getElementById('asset-csv-input').value = '';
      fetchAssets();
    } catch (err) {
      setCsvError(err.response?.data?.message || 'CSV import failed. Check file format.');
    } finally {
      setCsvUploading(false);
    }
  };

  // ─── Icon helper ───────────────────────────────────────────────────────
  const getAssetIcon = (type) => {
    switch (type) {
      case 'SERVER':      return <Server className="w-6 h-6 text-primary" />;
      case 'FIREWALL':    return <ShieldAlert className="w-6 h-6 text-red-400" />;
      case 'DATABASE':    return <HardDrive className="w-6 h-6 text-indigo-400" />;
      default:            return <Monitor className="w-6 h-6 text-sky-400" />;
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">Asset Management</h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">
            Store, update, and audit network servers, firewalls, routers, databases, and client devices
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setShowCsvPanel((v) => !v); setCsvSuccess(''); setCsvError(''); }}
            className="flex items-center space-x-2 bg-slate-800 text-gray-300 border border-dark-border font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>CSV Import</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-primary text-black font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-primary-hover transition shadow-md shadow-primary/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* CSV Import Panel (collapsible) */}
      {showCsvPanel && (
        <div className="glass-card p-6 border border-dark-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              Bulk CSV Import
            </h2>
            <button
              onClick={() => setShowCsvPanel(false)}
              className="text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {csvError && (
            <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{csvError}</span>
            </div>
          )}
          {csvSuccess && (
            <div className="mb-3 p-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{csvSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCsvUpload} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2">
                CSV File (name, type, ipAddress, macAddress, os, criticality, status)
              </label>
              <input
                id="asset-csv-input"
                type="file"
                accept=".csv"
                onChange={(e) => { setCsvFile(e.target.files[0]); setCsvSuccess(''); setCsvError(''); }}
                className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
              />
            </div>
            <button
              type="submit"
              disabled={csvUploading || !csvFile}
              className="flex items-center gap-2 bg-primary text-black font-semibold text-xs py-2.5 px-5 rounded-lg hover:bg-primary-hover transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {csvUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/25 border-t-black rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Import Assets
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Sort & Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu((v) => !v)}
            className="flex items-center gap-2 rounded-lg border border-dark-border bg-slate-800 px-3 py-2 text-xs font-mono text-gray-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortOption.label}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showSortMenu && (
            <div className="absolute left-0 top-full z-20 mt-1 w-48 glass-card border border-dark-border py-1 shadow-xl">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => { setSortOption(opt); setShowSortMenu(false); }}
                  className={`w-full px-4 py-2 text-left text-xs font-mono hover:bg-white/5 transition cursor-pointer ${
                    sortOption.label === opt.label ? 'text-sky-300' : 'text-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type filter chips */}
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-bold font-mono uppercase tracking-wider transition cursor-pointer ${
                typeFilter === t
                  ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                  : 'border-dark-border bg-white/3 text-gray-500 hover:border-white/15 hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-2.5 py-1 text-[10px] font-bold font-mono uppercase tracking-wider transition cursor-pointer ${
                statusFilter === s
                  ? s === 'ONLINE'
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                    : s === 'OFFLINE'
                    ? 'border-red-500/40 bg-red-500/15 text-red-300'
                    : 'border-blue-500/40 bg-blue-500/15 text-blue-300'
                  : 'border-dark-border bg-white/3 text-gray-500 hover:border-white/15 hover:text-gray-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Active results count */}
        <span className="ml-auto text-xs font-mono text-gray-500">
          {displayedAssets.length} / {assets.length} assets
        </span>
      </div>

      {/* Asset card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-xs font-mono text-gray-400">Syncing asset registries...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="col-span-full py-24 text-center glass-card border border-dark-border">
            <Server className="w-10 h-10 text-gray-500 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-mono text-gray-400 mb-1">Corporate asset registry empty.</p>
            <p className="text-xs text-gray-500 font-mono">
              Register servers, firewalls, and routers to associate incoming logs with critical items.
            </p>
          </div>
        ) : displayedAssets.length === 0 ? (
          <div className="col-span-full py-16 text-center glass-card border border-dark-border">
            <Filter className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-mono text-gray-400">No assets match the selected filters.</p>
          </div>
        ) : (
          displayedAssets.map((item) => (
            <div
              key={item.id}
              className="glass-card p-6 border border-dark-border hover:border-dark-border/100 duration-200 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-950/40 rounded-xl border border-dark-border">
                    {getAssetIcon(item.type)}
                  </div>
                  <div className="flex flex-col items-end space-y-1.5">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-bold font-mono border ${
                        item.criticality === 'CRITICAL'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : item.criticality === 'HIGH'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {item.criticality}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`inline-flex items-center text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border transition cursor-pointer ${
                        item.status === 'ONLINE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          item.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-red-400'
                        }`}
                      />
                      {item.status}
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mb-2">{item.name}</h3>
                <div className="space-y-1 text-xs font-mono text-gray-400">
                  <div className="flex justify-between">
                    <span className="text-gray-600">IP address:</span>
                    <span className="text-white">{item.ipAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">MAC address:</span>
                    <span>{item.macAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">OS version:</span>
                    <span className="truncate max-w-[120px]">{item.os}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Owner team:</span>
                    <span className="text-emerald-400">{getTeamName(item.ownerTeamId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="text-sky-400">{item.type}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-dark-border/40 pt-4 mt-4 flex justify-between items-center text-[10px] font-mono text-gray-500">
                <span>Last Scan: {new Date(item.lastSeen).toLocaleDateString()}</span>
                <button
                  onClick={() => handleDeleteAsset(item.id)}
                  className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded cursor-pointer"
                  title="Remove Asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Asset Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 border border-dark-border relative animate-scale-up">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-primary" />
              <span>Register Corporate Asset</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {formError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Domain Controller (Internal)"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">
                    Asset Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
                  >
                    <option value="SERVER">Server</option>
                    <option value="ROUTER">Router</option>
                    <option value="FIREWALL">Firewall</option>
                    <option value="ENDPOINT">Client Endpoint</option>
                    <option value="APPLICATION">Web Application</option>
                    <option value="CLOUD_SERVER">Cloud Server</option>
                    <option value="DATABASE">Database Instance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">
                    Criticality
                  </label>
                  <select
                    value={formData.criticality}
                    onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    placeholder="10.0.1.10"
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">
                    MAC Address
                  </label>
                  <input
                    type="text"
                    value={formData.macAddress}
                    onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                    placeholder="00:1A:2B:3C:4D:5E"
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">
                  OS / Platform
                </label>
                <input
                  type="text"
                  value={formData.os}
                  onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                  placeholder="Windows Server 2022 / Linux (Debian 12)"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">
                  Owner Team
                </label>
                <select
                  value={formData.ownerTeamId}
                  onChange={(e) => setFormData({ ...formData, ownerTeamId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.teamName}</option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2 text-xs font-mono uppercase bg-slate-800 text-gray-400 border border-dark-border hover:bg-slate-700 hover:text-white rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-mono uppercase bg-primary text-black font-bold rounded-lg hover:bg-primary-hover transition cursor-pointer"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
