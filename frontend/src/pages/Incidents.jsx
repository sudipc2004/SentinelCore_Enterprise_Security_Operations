import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Edit2, Plus, Search, Siren, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import "../index.css"
const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];
const STATUSES = ['OPEN', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const CATEGORIES = ['Malware', 'Phishing', 'Unauthorized Access', 'Data Exposure', 'Network Anomaly', 'Policy Violation'];

const emptyForm = {
  title: '',
  description: '',
  priority: 'P3',
  status: 'OPEN',
  category: 'Network Anomaly',
  source: 'Manual',
  assignedTo: '',
  dueAt: '',
};

export default function Incidents() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'ANALYST';
  const isAdmin = currentUser?.role === 'ADMIN';

  const [incidents, setIncidents] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentToDelete, setIncidentToDelete] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const assignableUsers = usersList.filter((user) => user.role === 'ADMIN' || user.role === 'ANALYST');

  const fetchIncidents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        size: pageSize,
        sortBy: 'createdAt',
        direction: 'desc',
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const response = await axios.get('/api/incidents', { params });
      setIncidents(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve incidents.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersList = async () => {
    try {
      const response = await axios.get('/api/users?size=100');
      setUsersList(response.data.content);
    } catch (err) {
      showToast({ type: 'error', message: 'Could not load assignee list.' });
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [page, statusFilter, priorityFilter]);

  useEffect(() => {
    if (canManage) {
      fetchUsersList();
    }
  }, [canManage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchIncidents();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setPage(0);
  };

  const openCreateModal = () => {
    setSelectedIncident(null);
    setFormData(emptyForm);
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (incident) => {
    setSelectedIncident(incident);
    setFormData({
      title: incident.title || '',
      description: incident.description || '',
      priority: incident.priority || 'P3',
      status: incident.status || 'OPEN',
      category: incident.category || 'Network Anomaly',
      source: incident.source || 'Manual',
      assignedTo: incident.assignedTo?.id || '',
      dueAt: incident.dueAt ? incident.dueAt.slice(0, 16) : '',
    });
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.title.trim()) {
      setFormError('Incident title is required.');
      return;
    }

    const payload = {
      ...formData,
      dueAt: formData.dueAt ? formData.dueAt : null,
    };

    try {
      if (selectedIncident) {
        await axios.put(`/api/incidents/${selectedIncident.id}`, payload);
        setFormSuccess('Incident updated successfully.');
        showToast({ type: 'success', message: 'Incident updated successfully.' });
      } else {
        await axios.post('/api/incidents', payload);
        setFormSuccess('Incident created successfully.');
        showToast({ type: 'success', message: 'Incident created successfully.' });
      }

      window.setTimeout(() => {
        setIsModalOpen(false);
        fetchIncidents();
      }, 700);
    } catch (err) {
      const message = err.response?.data?.message || 'Incident operation failed.';
      setFormError(message);
      showToast({ type: 'error', message });
    }
  };

  const handleDeleteIncident = async () => {
    if (!incidentToDelete) return;

    try {
      await axios.delete(`/api/incidents/${incidentToDelete.id}`);
      setIncidentToDelete(null);
      showToast({ type: 'success', message: 'Incident deleted successfully.' });
      fetchIncidents();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Failed to delete incident.' });
    }
  };

  return (
    <div className="space-y-6 sc-fade-in">
      <div className="sc-panel flex flex-col gap-4 p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="sc-badge border-sky-500/20 bg-sky-500/10 text-sky-300">Incident response</span>
            <span className="sc-badge border-white/10 bg-white/5 text-slate-300">Kanban-ready workflow</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">Incident Management</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Create, assign, prioritize, and resolve security incidents with audit-backed workflow tracking.
          </p>
        </div>
        {canManage && (
          <button onClick={openCreateModal} className="sc-button-primary px-4 py-3 text-sm font-semibold c-p">
            <Plus className="h-4 w-4" />
            <span>Create Incident</span>
          </button>
        )}
      </div>

      <div className="sc-panel p-6">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-5 md:items-end">
          <div className="md:col-span-2">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Search incidents</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Title, source, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input w-full px-4 py-3 pl-11 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="glass-input w-full bg-[#0b1220] px-4 py-3 text-sm text-white">
              <option value="">All Statuses</option>
              {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Priority</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="glass-input w-full bg-[#0b1220] px-4 py-3 text-sm text-white">
              <option value="">All Priorities</option>
              {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="c-p sc-button-secondary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]">
              Query
            </button>
            <button type="button" onClick={handleResetFilters} className="c-p sc-button-danger px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]">
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="sc-table-shell overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
            <p className="text-xs font-mono text-slate-400">Loading incident queue...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-300" />
            <p className="text-sm font-mono text-red-200">{error}</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="py-16 text-center">
            <Siren className="mx-auto mb-3 h-8 w-8 text-slate-500" />
            <p className="text-sm font-mono text-slate-400">No incidents match the current view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.24em] text-slate-400">
                  <th className="px-6 py-4">Incident</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Assignee</th>
                  <th className="px-6 py-4">Due</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8 text-xs">
                {incidents.map((incident) => (
                  <tr key={incident.id} className="transition hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="font-semibold text-white">{incident.title}</p>
                        <p className="mt-1 line-clamp-1 text-[10px] font-mono text-slate-400">
                          {incident.category || 'Uncategorized'} / {incident.source || 'Manual'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold font-mono tracking-[0.16em] ${
                        incident.priority === 'P1' ? 'border-red-500/20 bg-red-500/10 text-red-300'
                          : incident.priority === 'P2' ? 'border-orange-500/20 bg-orange-500/10 text-orange-300'
                            : incident.priority === 'P3' ? 'border-sky-500/20 bg-sky-500/10 text-sky-300'
                              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                      }`}>
                        {incident.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">{incident.status}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{incident.assignedTo?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4 font-mono text-slate-400">{incident.dueAt ? new Date(incident.dueAt).toLocaleString() : 'No SLA'}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {canManage ? (
                        <>
                          <button onClick={() => openEditModal(incident)} className="c-p sc-button-secondary p-2" title="Edit Incident">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {isAdmin && (
                            <button onClick={() => setIncidentToDelete(incident)} className="c-p sc-button-danger p-2" title="Delete Incident">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] font-mono italic text-slate-500">Read-Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 0 && (
          <div className="flex flex-col gap-3 border-t border-white/8 bg-[#0b1220]/70 p-4 text-xs font-mono text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>Total Incidents: {totalElements}</span>
            <div className="flex items-center gap-4">
              <button onClick={() => setPage(prev => Math.max(prev - 1, 0))} disabled={page === 0} className="c-p sc-button-secondary p-2 disabled:pointer-events-none disabled:opacity-30">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span>Page {page + 1} of {totalPages}</span>
              <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))} disabled={page === totalPages - 1} className="c-p sc-button-secondary p-2 disabled:pointer-events-none disabled:opacity-30">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal sc-scale-in relative max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-slate-400 transition hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-4 flex items-center space-x-2 text-lg font-bold text-white">
              <Siren className="h-5 w-5 text-sky-300" />
              <span>{selectedIncident ? 'Edit Incident' : 'Create Incident'}</span>
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {formError && (
                <div className="flex items-center space-x-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="flex items-center space-x-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  <Check className="h-4 w-4" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Title</label>
                <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Suspicious authentication spike" className="glass-input w-full px-4 py-3 text-xs" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                    {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                    {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Due At</label>
                  <input type="datetime-local" value={formData.dueAt} onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })} className="glass-input w-full px-4 py-3 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                    {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Source</label>
                  <input value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} placeholder="Manual, SIEM, Email" className="glass-input w-full px-4 py-3 text-xs" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Assignee</label>
                  <select value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })} className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                    <option value="">Unassigned</option>
                    {assignableUsers.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.role})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="4" placeholder="Incident evidence, impact, and immediate response notes..." className="glass-input w-full px-4 py-3 text-xs" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="sc-button-secondary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em]">
                  Cancel
                </button>
                <button type="submit" className="c-p sc-button-primary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em]">
                  Save Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {incidentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal sc-scale-in w-full max-w-sm p-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-300" />
              <h3 className="mb-2 text-lg font-bold text-white">Delete Incident?</h3>
              <p className="mb-6 text-xs leading-relaxed text-slate-400 font-mono">
                Confirm deletion of <span className="font-semibold text-white">{incidentToDelete.title}</span>. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setIncidentToDelete(null)} className="c-p sc-button-secondary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em]">
                  Cancel
                </button>
                <button onClick={handleDeleteIncident} className="sc-button-danger flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em]">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
