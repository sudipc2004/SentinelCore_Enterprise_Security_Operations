import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Check,
  Clock,
  Edit2,
  Filter,
  GripVertical,
  Plus,
  Search,
  Siren,
  Tag,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import '../index.css';

const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];
const STATUSES = ['OPEN', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const CATEGORIES = ['Malware', 'Phishing', 'Unauthorized Access', 'Data Exposure', 'Network Anomaly', 'Policy Violation'];

const COLUMNS = [
  { id: 'OPEN', label: 'Open', color: '#ef4444', glow: 'rgba(239,68,68,0.18)', borderColor: 'rgba(239,68,68,0.25)' },
  { id: 'TRIAGED', label: 'Triaged', color: '#f59e0b', glow: 'rgba(245,158,11,0.18)', borderColor: 'rgba(245,158,11,0.25)' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: '#38bdf8', glow: 'rgba(56,189,248,0.18)', borderColor: 'rgba(56,189,248,0.25)' },
  { id: 'RESOLVED', label: 'Resolved', color: '#22c55e', glow: 'rgba(34,197,94,0.18)', borderColor: 'rgba(34,197,94,0.25)' },
  { id: 'CLOSED', label: 'Closed', color: '#6b7280', glow: 'rgba(107,114,128,0.18)', borderColor: 'rgba(107,114,128,0.25)' },
];

const PRIORITY_STYLES = {
  P1: { text: 'text-red-300', border: 'border-red-500/25', bg: 'bg-red-500/10' },
  P2: { text: 'text-orange-300', border: 'border-orange-500/25', bg: 'bg-orange-500/10' },
  P3: { text: 'text-sky-300', border: 'border-sky-500/25', bg: 'bg-sky-500/10' },
  P4: { text: 'text-emerald-300', border: 'border-emerald-500/25', bg: 'bg-emerald-500/10' },
};

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

function PriorityBadge({ priority }) {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.P4;

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold font-mono tracking-[0.18em] ${style.text} ${style.border} ${style.bg}`}>
      {priority}
    </span>
  );
}

function IncidentCard({ incident, onDragStart, onClick, canUpdate }) {
  const column = COLUMNS.find((item) => item.id === incident.status) || COLUMNS[0];
  const isOverdue = incident.dueAt && new Date(incident.dueAt) < new Date() && !['RESOLVED', 'CLOSED'].includes(incident.status);

  return (
    <div
      draggable={canUpdate}
      onDragStart={(event) => canUpdate && onDragStart(event, incident)}
      onClick={() => onClick(incident)}
      className={`group relative select-none rounded-2xl border border-white/8 bg-[#0f1623]/90 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-[0_12px_28px_rgba(0,0,0,0.35)] ${canUpdate ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      style={{ borderLeft: `3px solid ${column.color}` }}
    >
      {canUpdate && (
        <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-40">
          <GripVertical className="h-4 w-4 text-slate-400" />
        </div>
      )}

      <div className="flex items-start justify-between gap-2 pr-5">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-white">{incident.title}</p>
        <PriorityBadge priority={incident.priority} />
      </div>

      <p className="mt-1.5 line-clamp-1 text-[10px] font-mono text-slate-500">
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

function KanbanColumn({ col, incidents, onDragStart, onDragOver, onDrop, onDragLeave, isDragOver, onCardClick, canUpdateIncident }) {
  return (
    <div
      className="flex min-w-[260px] w-[260px] flex-shrink-0 flex-col"
      onDragOver={onDragOver}
      onDrop={(event) => onDrop(event, col.id)}
      onDragLeave={onDragLeave}
    >
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
        <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold" style={{ backgroundColor: col.glow, color: col.color }}>
          {incidents.length}
        </span>
      </div>

      <div
        className={`min-h-[120px] flex-1 space-y-3 rounded-2xl p-2 transition-all duration-200 ${isDragOver ? 'ring-2 ring-inset' : ''}`}
        style={{
          ringColor: isDragOver ? col.color : 'transparent',
          background: isDragOver ? col.glow : 'transparent',
        }}
      >
        {incidents.length === 0 && !isDragOver && (
          <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-white/10">
            <p className="text-[10px] font-mono text-slate-600">Drop here</p>
          </div>
        )}

        {incidents.map((incident) => (
          <IncidentCard
            key={incident.id}
            incident={incident}
            onDragStart={onDragStart}
            onClick={onCardClick}
            canUpdate={canUpdateIncident(incident)}
          />
        ))}
      </div>
    </div>
  );
}

function DetailDrawer({ incident, onClose, onEdit, onDelete, canUpdateIncident, isAdmin }) {
  if (!incident) {
    return null;
  }

  const column = COLUMNS.find((item) => item.id === incident.status) || COLUMNS[0];
  const isOverdue = incident.dueAt && new Date(incident.dueAt) < new Date() && !['RESOLVED', 'CLOSED'].includes(incident.status);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="w-full max-w-md overflow-y-auto border-l border-white/8 bg-[#0b1220] sc-scale-in" style={{ boxShadow: '-24px 0 60px rgba(0,0,0,0.4)' }}>
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${column.color}, transparent)` }} />

        <div className="space-y-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <PriorityBadge priority={incident.priority} />
                <span
                  className="rounded-full border px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.2em]"
                  style={{ color: column.color, borderColor: column.borderColor, background: column.glow }}
                >
                  {incident.status.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-lg font-bold leading-snug text-white">{incident.title}</h2>
            </div>
            <button onClick={onClose} className="c-p mt-1 text-slate-400 transition hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Description</p>
            <p className="rounded-xl border border-white/8 bg-white/5 p-3 text-xs leading-relaxed text-slate-300">
              {incident.description || 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Tag, label: 'Category', value: incident.category || '-' },
              { icon: ArrowUpRight, label: 'Source', value: incident.source || '-' },
              { icon: User, label: 'Assignee', value: incident.assignedTo?.name || 'Unassigned' },
              { icon: Users, label: 'Team', value: incident.assignedTeam?.teamName || 'No team' },
              { icon: Calendar, label: 'Created', value: new Date(incident.createdAt).toLocaleDateString() },
              { icon: Clock, label: 'Due', value: incident.dueAt ? new Date(incident.dueAt).toLocaleString() : 'No SLA', highlight: isOverdue },
            ].map(({ icon: Icon, label, value, highlight }) => (
              <div key={label} className="rounded-xl border border-white/8 bg-white/5 p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <Icon className="h-3 w-3 text-slate-500" />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
                </div>
                <p className={`text-xs font-mono font-semibold ${highlight ? 'text-red-400' : 'text-slate-200'}`}>{value}</p>
              </div>
            ))}
          </div>

          {incident.resolvedAt && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3">
              <Check className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-400">Resolved at</p>
                <p className="text-xs font-mono text-emerald-300">{new Date(incident.resolvedAt).toLocaleString()}</p>
              </div>
            </div>
          )}

          {canUpdateIncident && (
            <div className="flex gap-2 border-t border-white/8 pt-2">
              <button onClick={() => { onClose(); onEdit(incident); }} className="c-p sc-button-secondary flex-1 px-4 py-2.5 text-xs font-semibold">
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
              {isAdmin && (
                <button onClick={() => { onClose(); onDelete(incident); }} className="c-p sc-button-danger px-4 py-2.5 text-xs font-semibold">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [priorityFilter, setPriorityFilter] = useState('');
  const [drawerIncident, setDrawerIncident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [incidentToDelete, setIncidentToDelete] = useState(null);
  const dragRef = useRef(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const fetchIncidents = async () => {
    setLoading(true);
    setError('');

    try {
      const params = { page: 0, size: 200, sortBy: 'createdAt', direction: 'desc' };
      if (search) {
        params.search = search;
      }
      if (priorityFilter) {
        params.priority = priorityFilter;
      }

      const response = await axios.get('/api/incidents', { params });
      setIncidents(response.data.content || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load incidents.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportData = async () => {
    try {
      const [usersResponse, teamsResponse] = await Promise.all([
        axios.get('/api/users?size=100'),
        axios.get('/api/teams'),
      ]);
      setUsersList(usersResponse.data.content || []);
      setTeamsList(teamsResponse.data || []);
    } catch {
      // Support data failures should not block the board.
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  useEffect(() => {
    if (canManage) {
      fetchSupportData();
    }
  }, [canManage]);

  const canUpdateIncident = (incident) => {
    if (!currentUser || !incident) {
      return false;
    }

    if (currentUser.role === 'ADMIN') {
      return true;
    }

    if (incident.assignedTo?.id === currentUser.id) {
      return true;
    }

    const assignedTeam = teamsList.find((team) => team.id === incident.assignedTeam?.id);
    return assignedTeam?.teamLead?.id === currentUser.id;
  };

  const grouped = COLUMNS.reduce((accumulator, column) => {
    accumulator[column.id] = incidents.filter((incident) => {
      const statusMatch = incident.status === column.id;
      const priorityMatch = !priorityFilter || incident.priority === priorityFilter;
      const searchMatch = !search
        || incident.title.toLowerCase().includes(search.toLowerCase())
        || (incident.category || '').toLowerCase().includes(search.toLowerCase());

      return statusMatch && priorityMatch && searchMatch;
    });
    return accumulator;
  }, {});

  const handleDragStart = (event, incident) => {
    dragRef.current = incident;
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event, columnId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverCol(columnId);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (event, newStatus) => {
    event.preventDefault();
    setDragOverCol(null);
    const incident = dragRef.current;

    if (!incident || incident.status === newStatus) {
      dragRef.current = null;
      return;
    }

    if (!canUpdateIncident(incident)) {
      dragRef.current = null;
      showToast({ type: 'error', message: 'Only admins, the assignee, or the assigned team lead can update this incident.' });
      return;
    }

    setIncidents((current) => current.map((item) => (item.id === incident.id ? { ...item, status: newStatus } : item)));

    try {
      await axios.put(`/api/incidents/${incident.id}`, {
        title: incident.title,
        description: incident.description || '',
        priority: incident.priority,
        status: newStatus,
        category: incident.category || 'Network Anomaly',
        source: incident.source || 'Manual',
        assignedTo: incident.assignedTo?.id || '',
        assignedTeam: incident.assignedTeam?.id || '',
        dueAt: incident.dueAt || null,
      });
      showToast({ type: 'success', message: `Moved to ${newStatus.replace('_', ' ')}` });
    } catch (err) {
      setIncidents((current) => current.map((item) => (item.id === incident.id ? { ...item, status: incident.status } : item)));
      showToast({ type: 'error', message: err.response?.data?.message || 'Failed to update status.' });
    }

    dragRef.current = null;
  };

  const openCreateModal = () => {
    setSelectedIncident(null);
    setFormData(emptyForm);
    setFormError('');
    setFormSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (incident) => {
    if (!canUpdateIncident(incident)) {
      showToast({ type: 'error', message: 'Only admins, the assignee, or the assigned team lead can update this incident.' });
      return;
    }

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

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.title.trim()) {
      setFormError('Title is required.');
      return;
    }

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

      setTimeout(() => {
        setIsModalOpen(false);
        fetchIncidents();
      }, 700);
    } catch (err) {
      const message = err.response?.data?.message || 'Operation failed.';
      setFormError(message);
    }
  };

  const handleDeleteIncident = async () => {
    if (!incidentToDelete) {
      return;
    }

    try {
      await axios.delete(`/api/incidents/${incidentToDelete.id}`);
      setIncidentToDelete(null);
      showToast({ type: 'success', message: 'Incident deleted.' });
      fetchIncidents();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Delete failed.' });
    }
  };

  const assignableUsers = usersList.filter((user) => user.role === 'ADMIN' || user.role === 'ANALYST');

  return (
    <div className="space-y-5 sc-fade-in">
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
            <Plus className="h-4 w-4" />
            <span>Create Incident</span>
          </button>
        )}
      </div>

      <div className="sc-panel p-4">
        <form onSubmit={(event) => { event.preventDefault(); fetchIncidents(); }} className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search title, category..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="glass-input w-full px-4 py-2.5 pl-10 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Priority</span>
          </div>

          {['', ...PRIORITIES].map((priority) => (
            <button
              key={priority || 'all'}
              type="button"
              onClick={() => setPriorityFilter(priority)}
              className={`c-p rounded-xl border px-3 py-2 text-[10px] font-bold font-mono tracking-[0.18em] transition-all ${priorityFilter === priority
                ? 'border-sky-400/40 bg-sky-500/15 text-sky-300'
                : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15'
                }`}
            >
              {priority || 'All'}
            </button>
          ))}

          <button type="submit" className="c-p sc-button-secondary px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em]">
            Apply
          </button>
        </form>
      </div>

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
        <div className="sc-panel overflow-x-auto p-5">
          <div className="flex min-w-max gap-4 pb-2">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                col={column}
                incidents={grouped[column.id] || []}
                onDragStart={handleDragStart}
                onDragOver={(event) => handleDragOver(event, column.id)}
                onDrop={handleDrop}
                onDragLeave={handleDragLeave}
                isDragOver={dragOverCol === column.id}
                onCardClick={setDrawerIncident}
                canUpdateIncident={canUpdateIncident}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4 text-[10px] font-mono text-slate-500">
            <span>Total: {incidents.length} incidents</span>
            <span className="flex items-center gap-3">
              {COLUMNS.map((column) => (
                <span key={column.id} className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: column.color }} />
                  {column.label}: {(grouped[column.id] || []).length}
                </span>
              ))}
            </span>
          </div>
        </div>
      )}

      {drawerIncident && (
        <DetailDrawer
          incident={drawerIncident}
          onClose={() => setDrawerIncident(null)}
          onEdit={openEditModal}
          onDelete={(incident) => setIncidentToDelete(incident)}
          canUpdateIncident={canUpdateIncident(drawerIncident)}
          isAdmin={isAdmin}
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal relative max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 sc-scale-in">
            <button onClick={() => setIsModalOpen(false)} className="c-p absolute right-4 top-4 text-slate-400 transition hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-white">
              <Siren className="h-5 w-5 text-sky-300" />
              {selectedIncident ? 'Edit Incident' : 'Create Incident'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {formError && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300"><AlertTriangle className="h-4 w-4" />{formError}</div>}
              {formSuccess && <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300"><Check className="h-4 w-4" />{formSuccess}</div>}

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Title *</label>
                <input
                  value={formData.title}
                  onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                  placeholder="Suspicious authentication spike"
                  className="glass-input w-full px-4 py-3 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Priority</label>
                  <select value={formData.priority} onChange={(event) => setFormData({ ...formData, priority: event.target.value })} className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                    {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Status</label>
                  <select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })} className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                    {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Due At (SLA)</label>
                  <input type="datetime-local" value={formData.dueAt} onChange={(event) => setFormData({ ...formData, dueAt: event.target.value })} className="glass-input w-full px-4 py-3 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Category</label>
                  <select value={formData.category} onChange={(event) => setFormData({ ...formData, category: event.target.value })} className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                    {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Source</label>
                  <input value={formData.source} onChange={(event) => setFormData({ ...formData, source: event.target.value })} placeholder="Manual, SIEM..." className="glass-input w-full px-4 py-3 text-xs" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Assignee</label>
                  <select value={formData.assignedTo} onChange={(event) => setFormData({ ...formData, assignedTo: event.target.value })} className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                    <option value="">Unassigned</option>
                    {assignableUsers.map((user) => <option key={user.id} value={user.id}>{user.name} ({user.role})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Routing Team</label>
                <select value={formData.assignedTeam} onChange={(event) => setFormData({ ...formData, assignedTeam: event.target.value })} className="glass-input w-full bg-[#0b1220] px-4 py-3 text-xs text-white">
                  <option value="">No team queue</option>
                  {teamsList.map((team) => <option key={team.id} value={team.id}>{team.teamName} ({team.department || 'Security'})</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  rows="4"
                  placeholder="Incident evidence, impact, and immediate response notes..."
                  className="glass-input w-full px-4 py-3 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="c-p sc-button-secondary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]">
                  Cancel
                </button>
                <button type="submit" className="c-p sc-button-primary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]">
                  Save Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {incidentToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal w-full max-w-sm p-6 text-center sc-scale-in">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-300" />
            <h3 className="mb-2 text-lg font-bold text-white">Delete Incident?</h3>
            <p className="mb-6 text-xs font-mono leading-relaxed text-slate-400">
              Confirm deletion of <span className="font-semibold text-white">{incidentToDelete.title}</span>. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setIncidentToDelete(null)} className="c-p sc-button-secondary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]">
                Cancel
              </button>
              <button onClick={handleDeleteIncident} className="c-p sc-button-danger flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
