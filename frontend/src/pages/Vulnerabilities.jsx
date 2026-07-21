import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Bug, ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Plus, Trash2, Edit2,
  FolderOpen, Upload, Calendar, Clock, User, Users, Check, Layers, ChevronRight, X, ArrowUpRight,
  TrendingUp, Download, Eye, ExternalLink, ShieldAlert as AlarmIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

const COLUMNS = [
  { id: 'NEW', label: 'New', color: '#ef4444', glow: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.25)' },
  { id: 'ASSIGNED', label: 'Assigned', color: '#f59e0b', glow: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.25)' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: '#38bdf8', glow: 'rgba(56,189,248,0.15)', borderColor: 'rgba(56,189,248,0.25)' },
  { id: 'UNDER_REVIEW', label: 'Under Review', color: '#a855f7', glow: 'rgba(168,85,247,0.15)', borderColor: 'rgba(168,85,247,0.25)' },
  { id: 'RESOLVED', label: 'Resolved', color: '#22c55e', glow: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.25)' },
  { id: 'CLOSED', label: 'Closed', color: '#6b7280', glow: 'rgba(107,114,128,0.15)', borderColor: 'rgba(107,114,128,0.25)' }
];

export default function Vulnerabilities() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('board');
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [assets, setAssets] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  const [patches, setPatches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ totalAssets: 0, totalVulnerabilities: 0, criticalCVEs: 0, patchCompliance: 100 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Detail Modal
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);

  // Ingestion drag drop
  const [importText, setImportText] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Create Manual Vulnerability Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    cveId: '',
    assetId: '',
    cvssScore: 7.5,
    description: '',
    affectedSoftware: '',
    assignedToEmail: '',
    assignedTeamId: '',
    patchAvailability: true
  });
  const [formError, setFormError] = useState('');

  // Kanban Drag States
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const fetchVulnerabilities = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/vulnerabilities');
      setVulnerabilities(response.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch vulnerabilities.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportData = async () => {
    try {
      const [assetsRes, usersRes, teamsRes, patchesRes, notifRes, statsRes] = await Promise.all([
        axios.get('/api/assets'),
        axios.get('/api/users?size=100'),
        axios.get('/api/teams'),
        axios.get('/api/vulnerabilities/patches'),
        axios.get('/api/vulnerabilities/notifications'),
        axios.get('/api/vulnerabilities/dashboard/stats')
      ]);
      setAssets(assetsRes.data || []);
      setUsersList(usersRes.data.content || []);
      setTeamsList(teamsRes.data || []);
      setPatches(patchesRes.data || []);
      setNotifications(notifRes.data || []);
      setStats(statsRes.data || { totalAssets: 0, totalVulnerabilities: 0, criticalCVEs: 0, patchCompliance: 100 });
    } catch (err) {
      console.error('Failed to load support data', err);
    }
  };

  useEffect(() => {
    fetchVulnerabilities();
    fetchSupportData();
  }, []);

  const getAssetName = (assetId) => assets.find(a => a.id === assetId)?.name || 'Unknown host';
  const getAssetIp = (assetId) => assets.find(a => a.id === assetId)?.ipAddress || '0.0.0.0';
  const getUserName = (email) => usersList.find(u => u.email === email)?.name || email || 'Unassigned';
  const getTeamName = (teamId) => teamsList.find(t => t.id === teamId)?.teamName || 'Unassigned';

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.cveId || !formData.assetId) {
      setFormError('CVE ID and Asset are required.');
      return;
    }
    try {
      await axios.post('/api/vulnerabilities', formData);
      showToast({ type: 'success', message: 'Vulnerability logged and SLA created.' });
      setShowAddModal(false);
      setFormData({
        cveId: '',
        assetId: '',
        cvssScore: 7.5,
        description: '',
        affectedSoftware: '',
        assignedToEmail: '',
        assignedTeamId: '',
        patchAvailability: true
      });
      fetchVulnerabilities();
      fetchSupportData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save vulnerability.');
    }
  };

  const handleUpdateStatus = async (vulnId, newStatus) => {
    try {
      const vuln = vulnerabilities.find(v => v.id === vulnId);
      if (!vuln) return;
      await axios.put(`/api/vulnerabilities/${vulnId}`, {
        ...vuln,
        status: newStatus
      });
      showToast({ type: 'success', message: `Remediation status updated to ${newStatus}` });
      fetchVulnerabilities();
      fetchSupportData();
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to update vulnerability status.' });
    }
  };

  // Kanban Drag & Drop
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    setDragOverCol(colId);
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    if (id) {
      await handleUpdateStatus(id, targetStatus);
    }
    setDraggedId(null);
    setDragOverCol(null);
  };

  const handleSelectVuln = async (vuln) => {
    setSelectedVuln(vuln);
    setNotes([]);
    setNewNote('');
    
    // Fetch comments
    setNotesLoading(true);
    try {
      const res = await axios.get(`/api/vulnerabilities/${vuln.id}/notes`);
      setNotes(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const res = await axios.post(`/api/vulnerabilities/${selectedVuln.id}/notes`, { content: newNote });
      setNotes(prev => [...prev, res.data]);
      setNewNote('');
      showToast({ type: 'success', message: 'Remediation note appended.' });
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to save note.' });
    }
  };

  const handleImportScans = async (e) => {
    e.preventDefault();
    if (!importText.trim()) return;
    setUploading(true);
    try {
      const parsed = JSON.parse(importText);
      await axios.post('/api/vulnerabilities/import', parsed);
      showToast({ type: 'success', message: 'Ingested security scans successfully.' });
      setImportText('');
      setIsImportOpen(false);
      fetchVulnerabilities();
      fetchSupportData();
    } catch (err) {
      showToast({ type: 'error', message: 'Ingestion parsing failure. Verify JSON syntax matches scan schema.' });
    } finally {
      setUploading(false);
    }
  };

  const handleReadNotification = async (id) => {
    try {
      await axios.post(`/api/vulnerabilities/notifications/${id}/read`);
      fetchSupportData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVuln = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this vulnerability instance? This will remove all SLA tracking.')) return;
    try {
      await axios.delete(`/api/vulnerabilities/${id}`);
      showToast({ type: 'success', message: 'Vulnerability removed successfully.' });
      if (selectedVuln && selectedVuln.id === id) {
        setSelectedVuln(null);
      }
      fetchVulnerabilities();
      fetchSupportData();
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to delete record.' });
    }
  };

  const getSeverityColor = (sev) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL': return 'border-red-500/30 bg-red-500/10 text-red-400';
      case 'HIGH': return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
      case 'MEDIUM': return 'border-sky-500/30 bg-sky-500/10 text-sky-400';
      default: return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
    }
  };

  // Group vulnerabilities by status for Kanban Board
  const kanbanGroups = useMemo(() => {
    const groups = { NEW: [], ASSIGNED: [], IN_PROGRESS: [], UNDER_REVIEW: [], RESOLVED: [], CLOSED: [] };
    vulnerabilities.forEach(v => {
      if (groups[v.status]) {
        groups[v.status].push(v);
      }
    });
    return groups;
  }, [vulnerabilities]);

  return (
    <div className="space-y-6 sc-fade-in">
      {/* ── Stats Widget Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', value: stats.totalAssets, icon: Layers, color: 'text-primary' },
          { label: 'Unresolved Vulnerabilities', value: vulnerabilities.filter(v => v.status !== 'RESOLVED' && v.status !== 'CLOSED').length, icon: Bug, color: 'text-red-400' },
          { label: 'Critical CVEs', value: stats.criticalCVEs, icon: ShieldAlert, color: 'text-orange-400' },
          { label: 'Patch Compliance', value: `${stats.patchCompliance}%`, icon: CheckCircle2, color: 'text-emerald-400' }
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="sc-panel p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">{item.label}</p>
                <p className={`text-2xl font-bold font-mono ${item.color}`}>{item.value}</p>
              </div>
              <Icon className={`w-8 h-8 opacity-25 ${item.color}`} />
            </div>
          );
        })}
      </div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="sc-panel p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono uppercase">Vulnerability Control Center</h1>
          <p className="text-sm text-slate-400">Discover, remediate, and apply security patches to protect endpoints and critical systems.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportOpen(!isImportOpen)}
            className="flex items-center gap-2 border border-dark-border bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer font-mono"
          >
            <Upload className="w-4 h-4" /> scanner upload
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-black font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log Discovery
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation ───────────────────────────────────────────────── */}
      <div className="flex border-b border-dark-border pb-px gap-6">
        {[
          { id: 'board', label: 'Remediation Board', icon: Layers },
          { id: 'directory', label: 'Vulnerability Database', icon: Bug },
          { id: 'patches', label: 'Patch Management', icon: CheckCircle2 },
          { id: 'alarms', label: `Alarms & Alerts (${notifications.length})`, icon: AlarmIcon }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                active ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content: Remediation Kanban Board ────────────────────────── */}
      {activeTab === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-4 select-none">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className="flex min-w-[270px] w-[270px] flex-shrink-0 flex-col space-y-3"
            >
              {/* Column Header */}
              <div
                className="flex items-center justify-between rounded-xl border p-3 transition-all duration-200"
                style={{
                  borderColor: dragOverCol === col.id ? col.color : 'rgba(255, 255, 255, 0.06)',
                  background: dragOverCol === col.id ? col.glow : 'rgba(22, 27, 34, 0.75)'
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color, boxShadow: `0 0 6px ${col.color}` }} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">{col.label}</span>
                </div>
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold" style={{ backgroundColor: col.glow, color: col.color }}>
                  {kanbanGroups[col.id]?.length || 0}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-3 min-h-[400px]">
                {kanbanGroups[col.id]?.length === 0 ? (
                  <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-white/5 bg-slate-900/10">
                    <p className="text-[9px] font-mono text-slate-600">Drop cards here</p>
                  </div>
                ) : (
                  kanbanGroups[col.id].map((vuln) => (
                    <div
                      key={vuln.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, vuln.id)}
                      onClick={() => handleSelectVuln(vuln)}
                      className="glass-card hover:bg-slate-900/60 p-4 border border-dark-border rounded-xl cursor-grab active:cursor-grabbing hover:border-slate-500/20 transition-all duration-200 space-y-2.5"
                    >
                      <div className="flex justify-between items-start">
                        <span className={`sc-badge px-1.5 text-[9px] font-bold ${getSeverityColor(vuln.severity)}`}>
                          {vuln.cveId}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-500 font-mono">CVSS {vuln.cvssScore}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{getAssetName(vuln.assetId)}</h4>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{vuln.affectedSoftware}</p>
                      
                      <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-white/5 pt-2">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-600" />
                          <span>{getUserName(vuln.assignedToEmail)}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-600" />
                          <span className={new Date(vuln.dueDate) < new Date() && vuln.status !== 'RESOLVED' ? 'text-red-400 font-bold' : ''}>
                            {new Date(vuln.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab Content: Vulnerability Directory ────────────────────────── */}
      {activeTab === 'directory' && (
        <div className="sc-panel overflow-hidden">
          <div className="p-4 border-b border-dark-border bg-slate-900/40">
            <span className="text-xs font-bold text-slate-300 font-mono uppercase">Vulnerability Directory</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-300 text-xs">
              <thead>
                <tr className="border-b border-dark-border text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="p-4">CVE ID</th>
                  <th className="p-4">Affected Asset</th>
                  <th className="p-4">Software</th>
                  <th className="p-4 text-center">CVSS Score</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Remediation Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border font-mono">
                {vulnerabilities.map((vuln) => (
                  <tr
                    key={vuln.id}
                    onClick={() => handleSelectVuln(vuln)}
                    className="hover:bg-white/3 transition cursor-pointer"
                  >
                    <td className="p-4 font-bold text-primary">{vuln.cveId}</td>
                    <td className="p-4 text-white font-semibold">
                      <div>{getAssetName(vuln.assetId)}</div>
                      <div className="text-[10px] text-slate-500">{getAssetIp(vuln.assetId)}</div>
                    </td>
                    <td className="p-4 text-slate-400 font-medium">{vuln.affectedSoftware}</td>
                    <td className="p-4 text-center font-bold text-slate-200">{vuln.cvssScore}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${getSeverityColor(vuln.severity)}`}>
                        {vuln.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 uppercase">
                        {vuln.status}
                      </span>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDeleteVuln(vuln.id, e)}
                        className="p-1.5 rounded-lg border border-dark-border bg-slate-900 hover:border-red-500/30 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab Content: Patch Management ───────────────────────────────── */}
      {activeTab === 'patches' && (
        <div className="sc-panel overflow-hidden">
          <div className="p-4 border-b border-dark-border bg-slate-900/40">
            <span className="text-xs font-bold text-slate-300 font-mono uppercase">Missing Patches & Advisories</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-300 text-xs">
              <thead>
                <tr className="border-b border-dark-border text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="p-4">CVE ID</th>
                  <th className="p-4">Patch Ref</th>
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Target Product</th>
                  <th className="p-4">Fixed Version</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border font-mono">
                {patches.map((patch) => (
                  <tr key={patch.id} className="hover:bg-white/3 transition">
                    <td className="p-4 font-bold text-slate-200">{patch.cveId}</td>
                    <td className="p-4 text-white font-bold">{patch.patchId}</td>
                    <td className="p-4 text-slate-400">{patch.vendor}</td>
                    <td className="p-4 text-slate-300 font-semibold">{patch.affectedProduct}</td>
                    <td className="p-4 text-emerald-400 font-semibold">{patch.fixedVersion}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                        patch.status === 'DEPLOYED' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/25 bg-amber-500/10 text-amber-300'
                      }`}>
                        {patch.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <a
                        href={patch.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Source
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab Content: Alarms & Notifications ─────────────────────────── */}
      {activeTab === 'alarms' && (
        <div className="space-y-4">
          <div className="sc-panel p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">Unread Security Alarms</h3>
            <div className="divide-y divide-dark-border space-y-3 pt-2">
              {notifications.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400/60 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-mono">No critical security alarms pending review.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="flex justify-between items-start py-3 text-xs font-mono">
                    <div className="flex gap-3 items-start">
                      <AlarmIcon className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-white">{notif.title}</h4>
                        <p className="text-slate-400 text-[11px] mt-0.5">{notif.message}</p>
                        <span className="text-[9px] text-slate-500">{new Date(notif.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReadNotification(notif.id)}
                      className="sc-button-secondary py-1 px-2.5 font-bold text-[10px] cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Drawer ────────────────────────────────────────────────── */}
      {selectedVuln && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card sc-scale-in max-w-lg w-full border border-dark-border p-6 space-y-6">
            <div className="flex justify-between items-start border-b border-dark-border pb-4">
              <div>
                <span className={`sc-badge px-1.5 text-[9px] font-bold ${getSeverityColor(selectedVuln.severity)}`}>
                  {selectedVuln.cveId}
                </span>
                <h2 className="text-base font-bold text-white mt-1">Remediation Task Detail</h2>
                <p className="text-[10px] text-slate-500 font-mono">Target: {getAssetName(selectedVuln.assetId)} ({getAssetIp(selectedVuln.assetId)})</p>
              </div>
              <button onClick={() => setSelectedVuln(null)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl border border-white/5 bg-white/3 space-y-2">
                <h4 className="text-slate-400 uppercase text-[9px] tracking-wider">Description</h4>
                <p className="text-slate-200 leading-relaxed font-sans">{selectedVuln.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-500">CVSS Base Score:</span>
                  <span className="text-white font-bold block">{selectedVuln.cvssScore} / 10.0</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500">Remediation SLA:</span>
                  <span className="text-white font-bold block">{new Date(selectedVuln.dueDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                <div className="space-y-1">
                  <span className="text-slate-500 block">Assigned Analyst</span>
                  <span className="text-slate-200 font-bold block">{getUserName(selectedVuln.assignedToEmail)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 block">Responsible Team</span>
                  <span className="text-slate-200 font-bold block">{getTeamName(selectedVuln.assignedTeamId)}</span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="border-t border-dark-border pt-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">Remediation Log</h3>
              
              <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1">
                {notesLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-500 mx-auto" />
                ) : notes.length === 0 ? (
                  <p className="text-[10px] text-slate-600 font-mono text-center">No action comments registered.</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="p-2.5 rounded-xl border border-dark-border bg-slate-950/50 text-[11px] space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-slate-500">
                        <span className="font-semibold text-primary">{note.authorName}</span>
                        <span>{new Date(note.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-300 font-mono">{note.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddNote} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add status update note..."
                  className="sc-input text-xs flex-1"
                />
                <button type="submit" className="sc-button bg-primary text-black text-xs font-bold px-3 py-2.5">
                  Log
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Scanner Import Ingestion Modal ───────────────────────────────── */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card sc-scale-in max-w-lg w-full border border-dark-border p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-dark-border pb-3">
              <h2 className="text-base font-bold uppercase tracking-wider text-white">Scanner Report Ingest</h2>
              <button onClick={() => setIsImportOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportScans} className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-400">Scanner Ingestion JSON Payload</label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={'[\n  {\n    "cveId": "CVE-2023-38606",\n    "affectedSoftware": "macOS Ventura",\n    "assignedToEmail": "subhas@sentinelcore.in"\n  }\n]'}
                  rows={6}
                  className="sc-input w-full font-mono text-xs"
                />
              </div>

              <div className="flex gap-2 justify-end border-t border-dark-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="sc-button-secondary py-2 px-4 font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="sc-button bg-primary text-black font-semibold py-2 px-4 flex items-center gap-2 font-mono"
                >
                  {uploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Ingest Findings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Manual Discovery Modal ────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card sc-scale-in max-w-lg w-full border border-dark-border p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-dark-border pb-3">
              <h2 className="text-base font-bold uppercase tracking-wider text-white">Log Discovered Vulnerability</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/8 text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400">CVE ID</label>
                  <input
                    type="text"
                    value={formData.cveId}
                    onChange={(e) => setFormData({ ...formData, cveId: e.target.value })}
                    placeholder="CVE-2023-38606"
                    className="sc-input w-full font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400">Target Asset</label>
                  <select
                    value={formData.assetId}
                    onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                    className="sc-select w-full"
                  >
                    <option value="">Select Asset...</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.ipAddress})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400">CVSS Base Score</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.cvssScore}
                    onChange={(e) => setFormData({ ...formData, cvssScore: parseFloat(e.target.value) })}
                    className="sc-input w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400">Affected Software / Service</label>
                  <input
                    type="text"
                    value={formData.affectedSoftware}
                    onChange={(e) => setFormData({ ...formData, affectedSoftware: e.target.value })}
                    placeholder="Apache Web Server 2.4"
                    className="sc-input w-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400">Discovery Vulnerability Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain security risk matching vector..."
                  className="sc-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400">Assigned Analyst</label>
                  <select
                    value={formData.assignedToEmail}
                    onChange={(e) => setFormData({ ...formData, assignedToEmail: e.target.value })}
                    className="sc-select w-full"
                  >
                    <option value="">Unassigned</option>
                    {usersList.map(usr => (
                      <option key={usr.id} value={usr.email}>{usr.name} ({usr.email})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400">Responsible Team</label>
                  <select
                    value={formData.assignedTeamId}
                    onChange={(e) => setFormData({ ...formData, assignedTeamId: e.target.value })}
                    className="sc-select w-full"
                  >
                    <option value="">Select Team...</option>
                    {teamsList.map(t => (
                      <option key={t.id} value={t.id}>{t.teamName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t border-dark-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="sc-button-secondary py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sc-button bg-primary text-black font-semibold py-2 px-4"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}