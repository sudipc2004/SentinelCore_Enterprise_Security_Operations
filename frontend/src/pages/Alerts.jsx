import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, ShieldCheck, Play, ArrowUpRight, Check, Trash2, Filter, X } from 'lucide-react';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Escalation Modal state
  const [escalateAlert, setEscalateAlert] = useState(null);
  const [escalateForm, setEscalateForm] = useState({
    title: '',
    description: '',
    analystEmail: ''
  });
  const [escalateSuccess, setEscalateSuccess] = useState('');
  const [escalateError, setEscalateError] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (severityFilter) params.severity = severityFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await axios.get('/api/alerts', { params });
      setAlerts(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch security alerts database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.put(`/api/alerts/${id}`, { status: newStatus });
      fetchAlerts();
    } catch (err) {
      alert('Failed to update alert status.');
    }
  };

  const handleDeleteAlert = async (id) => {
    if (!window.confirm('Delete this alert?')) return;
    try {
      await axios.delete(`/api/alerts/${id}`);
      fetchAlerts();
    } catch (err) {
      alert('Failed to delete alert.');
    }
  };

  const handleOpenEscalateModal = (alert) => {
    setEscalateAlert(alert);
    setEscalateForm({
      title: `Intrusion Alert: ${alert.alertId} - ${alert.severity} Severity`,
      description: alert.description,
      analystEmail: alert.userEmail !== 'system-logger@sentinelcore.in' ? alert.userEmail : 'analyst@sentinelcore.in'
    });
    setEscalateSuccess('');
    setEscalateError('');
  };

  const handleEscalateSubmit = async (e) => {
    e.preventDefault();
    setEscalateError('');
    setEscalateSuccess('');

    try {
      await axios.post('/api/incidents', {
        alertId: escalateAlert.id,
        title: escalateForm.title,
        description: escalateForm.description,
        analystEmail: escalateForm.analystEmail
      });

      setEscalateSuccess('Alert successfully escalated to incident!');
      setTimeout(() => {
        setEscalateAlert(null);
        fetchAlerts();
      }, 1000);
    } catch (err) {
      setEscalateError(err.response?.data?.message || 'Failed to escalate alert.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">Alert Center</h1>
        <p className="text-sm text-gray-400 mt-1 font-mono">Monitor and triage real-time alerts generated from rule matching and AI outlier detection</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-6 border border-dark-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Filter Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Filter Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => { setSeverityFilter(''); setStatusFilter(''); }}
              className="w-full bg-slate-800 text-white border border-dark-border hover:bg-slate-700 text-xs py-2 px-4 rounded-lg transition font-mono uppercase tracking-wider cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="glass-card border border-dark-border overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-mono text-gray-400">Syncing security alert channels...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-24 text-center bg-slate-900/10">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-mono text-gray-400">Clear Channels: No active alerts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border bg-slate-900/35 text-[10px] uppercase font-mono tracking-wider text-gray-400">
                  <th className="py-4 px-6">Alert ID</th>
                  <th className="py-4 px-6">Severity</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Risk Score</th>
                  <th className="py-4 px-6">Source IP</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-xs font-mono">
                {alerts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 px-6 font-bold text-white whitespace-nowrap">
                      {item.alertId}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded font-bold text-[10px] ${
                        item.severity === 'CRITICAL'
                          ? 'bg-red-600/15 text-red-400 border border-red-500/20'
                          : item.severity === 'HIGH'
                          ? 'bg-amber-600/15 text-amber-400 border border-amber-500/20'
                          : item.severity === 'MEDIUM'
                          ? 'bg-sky-600/15 text-sky-400 border border-sky-500/20'
                          : 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'NEW'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/10'
                          : item.status === 'INVESTIGATING'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-white">
                      {Math.round(item.riskScore * 100)}%
                    </td>
                    <td className="py-4 px-6 text-gray-300">{item.sourceIP}</td>
                    <td className="py-4 px-6 text-gray-400 max-w-sm truncate" title={item.description}>
                      {item.description}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                      {item.status === 'NEW' && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'INVESTIGATING')}
                          className="p-1.5 bg-slate-800 text-gray-400 border border-dark-border rounded hover:text-indigo-400 hover:border-indigo-400/20 transition cursor-pointer"
                          title="Triage Alert"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(item.status === 'NEW' || item.status === 'INVESTIGATING') && (
                        <>
                          <button
                            onClick={() => handleOpenEscalateModal(item)}
                            className="p-1.5 bg-primary/10 text-primary border border-primary/20 rounded hover:bg-primary/20 transition cursor-pointer"
                            title="Escalate to Incident"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'RESOLVED')}
                            className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition cursor-pointer"
                            title="Mark Resolved"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteAlert(item.id)}
                        className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/25 transition cursor-pointer"
                        title="Delete Alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Escalation Modal Dialog */}
      {escalateAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 border border-dark-border relative animate-scale-up">
            <button
              onClick={() => setEscalateAlert(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <ArrowUpRight className="w-5 h-5 text-primary" />
              <span>Escalate Alert to Incident</span>
            </h3>

            <form onSubmit={handleEscalateSubmit} className="space-y-4">
              {escalateError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{escalateError}</span>
                </div>
              )}
              {escalateSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>{escalateSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Incident Title</label>
                <input
                  type="text"
                  value={escalateForm.title}
                  onChange={(e) => setEscalateForm({ ...escalateForm, title: e.target.value })}
                  placeholder="e.g. Critical Brute Force on Server"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Description</label>
                <textarea
                  value={escalateForm.description}
                  onChange={(e) => setEscalateForm({ ...escalateForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs h-24 font-mono"
                  placeholder="Details of anomaly..."
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Assign SOC Analyst Email</label>
                <input
                  type="email"
                  value={escalateForm.analystEmail}
                  onChange={(e) => setEscalateForm({ ...escalateForm, analystEmail: e.target.value })}
                  placeholder="analyst@sentinelcore.in"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEscalateAlert(null)}
                  className="flex-1 py-2 text-xs font-mono uppercase bg-slate-800 text-gray-400 border border-dark-border hover:bg-slate-700 hover:text-white rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-mono uppercase bg-primary text-black font-bold rounded-lg hover:bg-primary-hover transition cursor-pointer"
                >
                  Create Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
