import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  AlertTriangle, Check, ChevronRight, Edit2, GripVertical,
  Plus, Search, Siren, Trash2, X, Calendar, User, Users,
  Tag, Layers, Clock, ArrowUpRight, Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import '../index.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];
const STATUSES   = ['OPEN', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const CATEGORIES = ['Malware', 'Phishing', 'Unauthorized Access', 'Data Exposure', 'Network Anomaly', 'Policy Violation'];

const COLUMNS = [
  { id: 'OPEN',        label: 'Open',        color: '#ef4444', glow: 'rgba(239,68,68,0.18)',   borderColor: 'rgba(239,68,68,0.25)'   },
  { id: 'TRIAGED',     label: 'Triaged',     color: '#f59e0b', glow: 'rgba(245,158,11,0.18)',  borderColor: 'rgba(245,158,11,0.25)'  },
  { id: 'IN_PROGRESS', label: 'In Progress', color: '#38bdf8', glow: 'rgba(56,189,248,0.18)',  borderColor: 'rgba(56,189,248,0.25)'  },
  { id: 'RESOLVED',    label: 'Resolved',    color: '#22c55e', glow: 'rgba(34,197,94,0.18)',   borderColor: 'rgba(34,197,94,0.25)'   },
  { id: 'CLOSED',      label: 'Closed',      color: '#6b7280', glow: 'rgba(107,114,128,0.18)', borderColor: 'rgba(107,114,128,0.25)' },
];

const PRIORITY_STYLES = {
  P1: { text: 'text-red-300',     border: 'border-red-500/25',    bg: 'bg-red-500/10'     },
  P2: { text: 'text-orange-300',  border: 'border-orange-500/25', bg: 'bg-orange-500/10'  },
  P3: { text: 'text-sky-300',     border: 'border-sky-500/25',    bg: 'bg-sky-500/10'     },
  P4: { text: 'text-emerald-300', border: 'border-emerald-500/25',bg: 'bg-emerald-500/10' },
};

const emptyForm = {
  title: '', description: '', priority: 'P3', status: 'OPEN',
  category: 'Network Anomaly', source: 'Manual',
  assignedTo: '', assignedTeam: '', dueAt: '',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const s = PRIORITY_STYLES[priority] || PRIORITY_STYLES.P4;
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold font-mono tracking-[0.18em] ${s.text} ${s.border} ${s.bg}`}>
      {priority}
    </span>
  );
}

function IncidentCard({ incident, onDragStart, onClick, canManage, onEdit, onDelete }) {
  const col = COLUMNS.find(c => c.id === incident.status) || COLUMNS[0];
  const isOverdue = incident.dueAt && new Date(incident.dueAt) < new Date() && !['RESOLVED','CLOSED'].includes(incident.status);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, incident)}
      onClick={() => onClick(incident)}
      className="group relative cursor-grab active:cursor-grabbing rounded-2xl border border-white/8 bg-[#0f1623]/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-[0_12px_28px_rgba(0,0,0,0.35)] select-none"
      style={{ borderLeft: `3px solid ${col.color}` }}
    >
      {/* drag handle */}
      <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-40 transition-opacity">
        <GripVertical className="h-4 w-4 text-slate-400" />
      </div>

      <div className="flex items-start justify-between gap-2 pr-5">
        <p className="text-xs font-semibold text-white leading-snug line-clamp-2">{incident.title}</p>
        <PriorityBadge priority={incident.priority} />
      </div>

      <p className="mt-1.5 text-[10px] font-mono text-slate-500 line-clamp-1">
        {incident.category} · {incident.source}
      </p>

      <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {incident.assignedTo?.name || 'Unassigned'}
        </span>
        {incident.dueAt && (
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
            <Clock className="h-3 w-3" />
            {new Date(incident.dueAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {incident.assignedTeam?.teamName && (
        <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-sky-400/70">
          <Users className="h-3 w-3" />
          {incident.assignedTeam.teamName}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ col, incidents, onDragStart, onDragOver, onDrop, onDragLeave, isDragOver, onCardClick, canManage, onEdit, onDelete }) {
  return (
    <div
      className="flex flex-col min-w-[260px] w-[260px] flex-shrink-0"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, col.id)}
      onDragLeave={onDragLeave}
    >
      {/* Column Header */}
      <div
        className="mb-3 flex items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-200"
        style={{
          borderColor: isDragOver ? col.color : col.borderColor,
          background: isDragOver ? col.glow : 'rgba(22,27,34,0.85)',
          boxShadow: isDragOver ? `0 0 18px ${col.glow}` : 'none',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color, boxShadow: `0 0 6px ${col.color}` }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">{col.label}</span>
        </div>
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
          style={{ backgroundColor: col.glow, color: col.color }}
        >
          {incidents.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        className={`flex-1 space-y-3 rounded-2xl p-2 min-h-[120px] transition-all duration-200 ${isDragOver ? 'ring-2 ring-inset' : ''}`}
        style={{
          ringColor: isDragOver ? col.color : 'transparent',
          background: isDragOver ? `${col.glow}` : 'transparent',
        }}
      >
        {incidents.length === 0 && !isDragOver && (
          <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-white/10">
            <p className="text-[10px] font-mono text-slate-600">Drop here</p>
          </div>
        )}
        {incidents.map(inc => (
          <IncidentCard
            key={inc.id}
            incident={inc}
            onDragStart={onDragStart}
            onClick={onCardClick}
            canManage={canManage}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Detail Drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ incident, onClose, onEdit, onDelete, canManage, isAdmin }) {
  if (!incident) return null;
  const col = COLUMNS.find(c => c.id === incident.status) || COLUMNS[0];
  const isOverdue = incident.dueAt && new Date(incident.dueAt) < new Date() && !['RESOLVED','CLOSED'].includes(incident.status);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-md bg-[#0b1220] border-l border-white/8 overflow-y-auto sc-scale-in"
        style={{ boxShadow: '-24px 0 60px rgba(0,0,0,0.4)' }}>

        {/* Top strip */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${col.color}, transparent)` }} />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <PriorityBadge priority={incident.priority} />
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border"
                  style={{ color: col.color, borderColor: col.borderColor, background: col.glow }}>
                  {incident.status.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white leading-snug">{incident.title}</h2>
            </div>
            <button onClick={onClose} className="c-p text-slate-400 hover:text-white transition mt-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Description */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Description</p>
            <p className="text-xs leading-relaxed text-slate-300 rounded-xl border border-white/8 bg-white/5 p-3">
              {incident.description || 'No description provided.'}
            </p>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Tag,       label: 'Category',  value: incident.category || '—'  },
              { icon: ArrowUpRight, label: 'Source',  value: incident.source   || '—'  },
              { icon: User,      label: 'Assignee',  value: incident.assignedTo?.name || 'Unassigned' },
              { icon: Users,     label: 'Team',      value: incident.assignedTeam?.teamName || 'No team' },
              { icon: Calendar,  label: 'Created',   value: new Date(incident.createdAt).toLocaleDateString() },
              { icon: Clock,     label: 'Due',       value: incident.dueAt ? new Date(incident.dueAt).toLocaleString() : 'No SLA', highlight: isOverdue },
            ].map(({ icon: Icon, label, value, highlight }) => (
              <div key={label} className="rounded-xl border border-white/8 bg-white/5 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-3 w-3 text-slate-500" />
                  <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-semibold">{label}</span>
                </div>
                <p className={`text-xs font-mono font-semibold ${highlight ? 'text-red-400' : 'text-slate-200'}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Resolved at */}
          {incident.resolvedAt && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3">
              <Check className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] text-emerald-400 font-semibold">Resolved at</p>
                <p className="text-xs font-mono text-emerald-300">{new Date(incident.resolvedAt).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          {canManage && (
            <div className="flex gap-2 pt-2 border-t border-white/8">
              <button onClick={() => { onClose(); onEdit(incident); }}
                className="c-p sc-button-secondary flex-1 px-4 py-2.5 text-xs font-semibold">
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
              {isAdmin && (
                <button onClick={() => { onClose(); onDelete(incident); }}
                  className="c-p sc-button-danger px-4 py-2.5 text-xs font-semibold">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
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
  assignedTeam: '',
  dueAt: '',
};

export default function Incidents() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'ANALYST';
  const isAdmin = currentUser?.role === 'ADMIN';

  const [incidents, setIncidents] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
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

  const fetchTeamsList = async () => {
    try {
      const response = await axios.get('/api/teams');
      setTeamsList(response.data || []);
    } catch (err) {
      showToast({ type: 'error', message: 'Could not load team routing list.' });
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [page, statusFilter, priorityFilter]);

  useEffect(() => {
    if (canManage) {
      fetchUsersList();
      fetchTeamsList();
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
      assignedTeam: incident.assignedTeam?.id || '',
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
                  <th className="px-6 py-4">Team / Assignee</th>
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
                    <td className="px-6 py-4 font-mono text-slate-400">
                      <div>{incident.assignedTeam?.teamName || 'No team'}</div>
                      <div className="mt-1 text-[10px] text-slate-500">{incident.assignedTo?.name || 'Unassigned'}</div>
                    </td>
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
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Routing Team</label>
                <select value={formData.assignedTeam} onChange={(e) => setFormData({ ...formData, assignedTeam: e.target.value })} className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                  <option value="">No team queue</option>
                  {teamsList.map((team) => <option key={team.id} value={team.id}>{team.teamName} ({team.department || 'Security'})</option>)}
                </select>
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

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Incidents() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'ANALYST';
  const isAdmin   = currentUser?.role === 'ADMIN';

  const [incidents,      setIncidents]      = useState([]);
  const [usersList,      setUsersList]      = useState([]);
  const [teamsList,      setTeamsList]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [search,         setSearch]         = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Drawer
  const [drawerIncident, setDrawerIncident] = useState(null);

  // Modal (create / edit)
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [formData,       setFormData]       = useState(emptyForm);
  const [formError,      setFormError]      = useState('');
  const [formSuccess,    setFormSuccess]    = useState('');

  // Delete confirm
  const [incidentToDelete, setIncidentToDelete] = useState(null);

  // Drag state
  const dragRef = useRef(null); // { incident }
  const [dragOverCol, setDragOverCol] = useState(null);

  // ── Data fetching ───────────────────────────────────────────────────────────
  const fetchIncidents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: 0, size: 200, sortBy: 'createdAt', direction: 'desc' };
      if (search)         params.search   = search;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await axios.get('/api/incidents', { params });
      setIncidents(res.data.content || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load incidents.');
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
    } catch { /* non-critical */ }
  };

  useEffect(() => { fetchIncidents(); }, []);
  useEffect(() => { if (canManage) fetchSupportData(); }, [canManage]);

  // ── Kanban grouping ─────────────────────────────────────────────────────────
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = incidents.filter(inc => {
      const statusMatch = inc.status === col.id;
      const priorityMatch = !priorityFilter || inc.priority === priorityFilter;
      const searchMatch = !search ||
        inc.title.toLowerCase().includes(search.toLowerCase()) ||
        (inc.category || '').toLowerCase().includes(search.toLowerCase());
      return statusMatch && priorityMatch && searchMatch;
    });
    return acc;
  }, {});

  // ── Drag handlers ───────────────────────────────────────────────────────────
  const handleDragStart = (e, incident) => {
    dragRef.current = incident;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  };

  const handleDragLeave = () => setDragOverCol(null);

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const inc = dragRef.current;
    if (!inc || inc.status === newStatus) return;

    // Optimistic update
    setIncidents(prev => prev.map(i => i.id === inc.id ? { ...i, status: newStatus } : i));

    try {
      await axios.put(`/api/incidents/${inc.id}`, {
        title:        inc.title,
        description:  inc.description || '',
        priority:     inc.priority,
        status:       newStatus,
        category:     inc.category     || 'Network Anomaly',
        source:       inc.source       || 'Manual',
        assignedTo:   inc.assignedTo?.id   || '',
        assignedTeam: inc.assignedTeam?.id || '',
        dueAt:        inc.dueAt || null,
      });
      showToast({ type: 'success', message: `Moved to ${newStatus.replace('_', ' ')}` });
    } catch (err) {
      // Revert on failure
      setIncidents(prev => prev.map(i => i.id === inc.id ? { ...i, status: inc.status } : i));
      showToast({ type: 'error', message: err.response?.data?.message || 'Failed to update status.' });
    }
    dragRef.current = null;
  };

  // ── Modal handlers ──────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setSelectedIncident(null);
    setFormData(emptyForm);
    setFormError(''); setFormSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (incident) => {
    setSelectedIncident(incident);
    setFormData({
      title:        incident.title || '',
      description:  incident.description || '',
      priority:     incident.priority || 'P3',
      status:       incident.status   || 'OPEN',
      category:     incident.category || 'Network Anomaly',
      source:       incident.source   || 'Manual',
      assignedTo:   incident.assignedTo?.id   || '',
      assignedTeam: incident.assignedTeam?.id || '',
      dueAt:        incident.dueAt ? incident.dueAt.slice(0, 16) : '',
    });
    setFormError(''); setFormSuccess('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!formData.title.trim()) { setFormError('Title is required.'); return; }

    try {
      if (selectedIncident) {
        await axios.put(`/api/incidents/${selectedIncident.id}`, { ...formData, dueAt: formData.dueAt || null });
        setFormSuccess('Incident updated.');
        showToast({ type: 'success', message: 'Incident updated.' });
      } else {
        await axios.post('/api/incidents', { ...formData, dueAt: formData.dueAt || null });
        setFormSuccess('Incident created.');
        showToast({ type: 'success', message: 'Incident created.' });
      }
      setTimeout(() => { setIsModalOpen(false); fetchIncidents(); }, 700);
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed.';
      setFormError(msg);
    }
  };

  const handleDeleteIncident = async () => {
    if (!incidentToDelete) return;
    try {
      await axios.delete(`/api/incidents/${incidentToDelete.id}`);
      setIncidentToDelete(null);
      showToast({ type: 'success', message: 'Incident deleted.' });
      fetchIncidents();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Delete failed.' });
    }
  };

  const assignableUsers = usersList.filter(u => u.role === 'ADMIN' || u.role === 'ANALYST');

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 sc-fade-in">

      {/* ── Header ── */}
      <div className="sc-panel flex flex-col gap-4 p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="sc-badge border-sky-500/20 bg-sky-500/10 text-sky-300">Incident response</span>
            <span className="sc-badge border-white/10 bg-white/5 text-slate-300">Kanban workflow</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">Incident Management</h1>
          <p className="mt-1 text-sm text-slate-400">Drag cards between columns to update status. Click a card for full details.</p>
        </div>
        {canManage && (
          <button onClick={openCreateModal} className="c-p sc-button-primary px-4 py-3 text-sm font-semibold">
            <Plus className="h-4 w-4" /><span>Create Incident</span>
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="sc-panel p-4">
        <form onSubmit={(e) => { e.preventDefault(); fetchIncidents(); }}
          className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text" placeholder="Search title, category..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="glass-input w-full px-4 py-2.5 pl-10 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Priority</span>
          </div>
          {['', ...PRIORITIES].map(p => (
            <button key={p} type="button"
              onClick={() => setPriorityFilter(p)}
              className={`c-p rounded-xl border px-3 py-2 text-[10px] font-bold font-mono tracking-[0.18em] transition-all ${
                priorityFilter === p
                  ? 'border-sky-400/40 bg-sky-500/15 text-sky-300'
                  : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15'
              }`}>
              {p || 'All'}
            </button>
          ))}
          <button type="submit" className="c-p sc-button-secondary px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em]">
            Apply
          </button>
        </form>
      </div>

      {/* ── Board ── */}
      {loading ? (
        <div className="sc-panel flex flex-col items-center justify-center py-24">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-xs font-mono text-slate-400">Loading incident queue...</p>
        </div>
      ) : error ? (
        <div className="sc-panel flex flex-col items-center justify-center py-16">
          <AlertTriangle className="mb-3 h-8 w-8 text-red-300" />
          <p className="text-sm font-mono text-red-200">{error}</p>
        </div>
      ) : (
        <div className="sc-panel p-5 overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-2">
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                col={col}
                incidents={grouped[col.id] || []}
                onDragStart={handleDragStart}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={handleDrop}
                onDragLeave={handleDragLeave}
                isDragOver={dragOverCol === col.id}
                onCardClick={setDrawerIncident}
                canManage={canManage}
                onEdit={openEditModal}
                onDelete={(inc) => setIncidentToDelete(inc)}
              />
            ))}
          </div>

          {/* Board footer */}
          <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4 text-[10px] font-mono text-slate-500">
            <span>Total: {incidents.length} incidents</span>
            <span className="flex items-center gap-3">
              {COLUMNS.map(col => (
                <span key={col.id} className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: col.color }} />
                  {col.label}: {(grouped[col.id] || []).length}
                </span>
              ))}
            </span>
          </div>
        </div>
      )}

      {/* ── Detail Drawer ── */}
      {drawerIncident && (
        <DetailDrawer
          incident={drawerIncident}
          onClose={() => setDrawerIncident(null)}
          onEdit={openEditModal}
          onDelete={(inc) => setIncidentToDelete(inc)}
          canManage={canManage}
          isAdmin={isAdmin}
        />
      )}

      {/* ── Create/Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal sc-scale-in relative max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
            <button onClick={() => setIsModalOpen(false)} className="c-p absolute right-4 top-4 text-slate-400 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-white">
              <Siren className="h-5 w-5 text-sky-300" />
              {selectedIncident ? 'Edit Incident' : 'Create Incident'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {formError   && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300"><AlertTriangle className="h-4 w-4" />{formError}</div>}
              {formSuccess && <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300"><Check className="h-4 w-4" />{formSuccess}</div>}

              {/* Title */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Title *</label>
                <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="Suspicious authentication spike"
                  className="glass-input w-full px-4 py-3 text-xs" />
              </div>

              {/* Priority / Status / Due */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
                    className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                    className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Due At (SLA)</label>
                  <input type="datetime-local" value={formData.dueAt} onChange={e => setFormData({...formData, dueAt: e.target.value})}
                    className="glass-input w-full px-4 py-3 text-xs" />
                </div>
              </div>

              {/* Category / Source / Assignee */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Source</label>
                  <input value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}
                    placeholder="Manual, SIEM..." className="glass-input w-full px-4 py-3 text-xs" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Assignee</label>
                  <select value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                    className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                    <option value="">Unassigned</option>
                    {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>
              </div>

              {/* Team routing */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Routing Team</label>
                <select value={formData.assignedTeam} onChange={e => setFormData({...formData, assignedTeam: e.target.value})}
                  className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                  <option value="">No team queue</option>
                  {teamsList.map(t => <option key={t.id} value={t.id}>{t.teamName} ({t.department || 'Security'})</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  rows="4" placeholder="Incident evidence, impact, and immediate response notes..."
                  className="glass-input w-full px-4 py-3 text-xs" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="c-p sc-button-secondary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]">
                  Cancel
                </button>
                <button type="submit"
                  className="c-p sc-button-primary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]">
                  Save Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {incidentToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal sc-scale-in w-full max-w-sm p-6 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-300" />
            <h3 className="mb-2 text-lg font-bold text-white">Delete Incident?</h3>
            <p className="mb-6 text-xs font-mono text-slate-400 leading-relaxed">
              Confirm deletion of <span className="font-semibold text-white">{incidentToDelete.title}</span>. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setIncidentToDelete(null)}
                className="c-p sc-button-secondary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]">
                Cancel
              </button>
              <button onClick={handleDeleteIncident}
                className="c-p sc-button-danger flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
