import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldAlert, User, Edit3, CheckSquare, Trash2, Filter, X, Calendar, UserCheck, AlertTriangle } from 'lucide-react';

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  
  // Triage / Edit Modal state
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [triageStatus, setTriageStatus] = useState('NEW');
  const [analystEmail, setAnalystEmail] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;

      const response = await axios.get('/api/incidents', { params });
      setIncidents(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load active security incidents database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter]);

  const handleOpenTriage = (inc) => {
    setSelectedIncident(inc);
    setResolutionNotes(inc.resolutionNotes || '');
    setTriageStatus(inc.status);
    setAnalystEmail(inc.analystEmail || '');
    setModalSuccess('');
    setModalError('');
  };

  const handleSaveTriage = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    try {
      await axios.put(`/api/incidents/${selectedIncident.id}`, {
        status: triageStatus,
        analystEmail: analystEmail,
        resolutionNotes: resolutionNotes
      });
      setModalSuccess('Incident details updated successfully.');
      setTimeout(() => {
        setSelectedIncident(null);
        fetchIncidents();
      }, 1000);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to update incident details.');
    }
  };

  const handleDeleteIncident = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this incident?')) return;
    try {
      await axios.delete(`/api/incidents/${id}`);
      fetchIncidents();
    } catch (err) {
      alert('Failed to delete incident.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">Incident Manager</h1>
        <p className="text-sm text-gray-400 mt-1 font-mono">Investigate, track assignments, write resolution reports, and audit the lifecycle of security incidents</p>
      </div>

      {/* Filter panel */}
      <div className="glass-card p-6 border border-dark-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Filter Workflow Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
            >
              <option value="">All Incidents</option>
              <option value="NEW">NEW</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
          <div>
            <button
              onClick={() => setStatusFilter('')}
              className="w-full bg-slate-800 text-white border border-dark-border hover:bg-slate-700 text-xs py-2 px-4 rounded-lg transition font-mono uppercase tracking-wider cursor-pointer"
            >
              Clear Filter
            </button>
          </div>
        </div>
      </div>

      {/* Incidents List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-mono text-gray-400">Syncing active incident registers...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="col-span-2 py-24 text-center glass-card border border-dark-border">
            <CheckSquare className="w-10 h-10 text-emerald-400 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-mono text-gray-400">System Secure: No active incidents found.</p>
          </div>
        ) : (
          incidents.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenTriage(item)}
              className="glass-card p-6 border border-dark-border/80 hover:border-primary/20 transition-all cursor-pointer flex flex-col justify-between hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 duration-200"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono font-bold text-gray-500">{item.incidentId}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    item.status === 'NEW'
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/15'
                      : item.status === 'ASSIGNED'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                      : item.status === 'INVESTIGATING'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-2 truncate">{item.title}</h3>
                <p className="text-xs text-gray-400 font-mono line-clamp-3 mb-4 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="border-t border-dark-border/40 pt-4 flex justify-between items-center text-[10px] font-mono text-gray-500">
                <div className="flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-secondary" />
                  <span className="truncate max-w-[120px] text-gray-400">
                    {item.analystEmail ? item.analystEmail : 'UNASSIGNED'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`font-bold ${item.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                    {item.severity}
                  </span>
                  <button
                    onClick={(e) => handleDeleteIncident(item.id, e)}
                    className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded cursor-pointer"
                    title="Delete Incident"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Triage / Update Incident Dialog Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-card p-6 border border-dark-border relative animate-scale-up">
            <button
              onClick={() => setSelectedIncident(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              <span>Incident Investigation Room</span>
            </h3>

            <div className="bg-slate-950/40 p-4 border border-dark-border/30 rounded-lg mb-4 text-[11px] font-mono text-gray-400 space-y-1">
              <div><span className="text-gray-600">ID:</span> {selectedIncident.incidentId}</div>
              <div><span className="text-gray-600">Title:</span> <span className="text-white">{selectedIncident.title}</span></div>
              <div className="mt-2 text-gray-300">{selectedIncident.description}</div>
            </div>

            <form onSubmit={handleSaveTriage} className="space-y-4">
              {modalError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{modalError}</span>
                </div>
              )}
              {modalSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Workflow Status</label>
                  <select
                    value={triageStatus}
                    onChange={(e) => setTriageStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
                  >
                    <option value="NEW">NEW</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Assignee Analyst</label>
                  <input
                    type="email"
                    value={analystEmail}
                    onChange={(e) => setAnalystEmail(e.target.value)}
                    placeholder="analyst@sentinelcore.in"
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Resolution & Investigation Notes</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs h-24 font-mono"
                  placeholder="Describe resolution steps, roots, and actions taken..."
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="flex-1 py-2 text-xs font-mono uppercase bg-slate-800 text-gray-400 border border-dark-border hover:bg-slate-700 hover:text-white rounded-lg transition cursor-pointer"
                >
                  Close Room
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-mono uppercase bg-primary text-black font-bold rounded-lg hover:bg-primary-hover transition cursor-pointer"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
