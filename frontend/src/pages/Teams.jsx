import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Network, Plus, Edit2, Trash2, Users, Info, Search, X, AlertTriangle, Check } from 'lucide-react';

export default function Teams() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const isAdmin = currentUser?.role === 'ADMIN';

  // Team lists
  const [teams, setTeams] = useState([]);
  const [usersList, setUsersList] = useState([]); // Pre-loaded for dropdown selections
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Selected Team Detail view state
  const [activeTeamId, setActiveTeamId] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('ADD'); // ADD or EDIT
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    teamName: '',
    department: '',
    teamLead: '',
    members: [],
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/teams', {
        params: search ? { search } : {}
      });
      setTeams(response.data);
      if (response.data.length > 0 && !activeTeamId) {
        setActiveTeamId(response.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Could not retrieve security teams.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersList = async () => {
    try {
      // Load first 100 users for selectors
      const response = await axios.get('/api/users?size=100');
      setUsersList(response.data.content);
    } catch (err) {
      console.error("Failed to load user directories", err);
    }
  };

  useEffect(() => {
    fetchTeams();
    if (isAdmin) {
      fetchUsersList();
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTeams();
  };

  const handleOpenAddModal = () => {
    fetchUsersList(); // Ensure fresh load
    setFormData({
      teamName: '',
      department: '',
      teamLead: '',
      members: [],
      description: '',
    });
    setFormError('');
    setFormSuccess('');
    setModalType('ADD');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (team) => {
    fetchUsersList();
    setFormData({
      teamName: team.teamName,
      department: team.department || '',
      teamLead: team.teamLead?.id || '',
      members: team.members?.map(m => m.id) || [],
      description: team.description || '',
    });
    setSelectedTeam(team);
    setFormError('');
    setFormSuccess('');
    setModalType('EDIT');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.teamName || !formData.department) {
      setFormError('Team Name and Department are required.');
      return;
    }

    try {
      if (modalType === 'ADD') {
        await axios.post('/api/teams', formData);
        setFormSuccess('Security Team created successfully!');
        showToast({ type: 'success', message: 'Security team created successfully.' });
      } else {
        await axios.put(`/api/teams/${selectedTeam.id}`, formData);
        setFormSuccess('Security Team details updated!');
        showToast({ type: 'success', message: 'Security team details updated.' });
      }
      setTimeout(() => {
        setIsModalOpen(false);
        fetchTeams();
      }, 1000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed. Verify parameters.');
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;
    try {
      await axios.delete(`/api/teams/${teamToDelete.id}`);
      if (activeTeamId === teamToDelete.id) {
        setActiveTeamId(null);
      }
      setTeamToDelete(null);
      showToast({ type: 'success', message: 'Security team deleted successfully.' });
      fetchTeams();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Failed to delete team.' });
    }
  };

  const handleMemberCheckboxChange = (userId) => {
    setFormData(prev => {
      const isChecked = prev.members.includes(userId);
      const newMembers = isChecked
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId];
      return { ...prev, members: newMembers };
    });
  };

  const activeTeam = teams.find(t => t.id === activeTeamId);

  return (
    <div className="space-y-6 sc-fade-in">
      <div className="sc-panel flex flex-col gap-4 p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="sc-badge border-sky-500/20 bg-sky-500/10 text-sky-300">Team operations</span>
            <span className="sc-badge border-white/10 bg-white/5 text-slate-300">Collaborative access</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-2xl">Teams</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">Create teams, assign leads, and manage members using the same enterprise styling as the rest of the platform.</p>
        </div>
        {isAdmin && (
          <button onClick={handleOpenAddModal} className="sc-button-primary px-4 py-3 text-sm font-semibold">
            <Plus className="h-4 w-4" />
            <span>Create Team</span>
          </button>
        )}
      </div>

      <div className="sc-panel p-6">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search teams by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full px-4 py-3 pl-11 text-sm"
            />
          </div>
          <button type="submit" className="sc-button-secondary px-6 py-3 text-xs font-semibold uppercase tracking-[0.24em]">
            Query
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-1">
          {loading ? (
            <div className="sc-panel p-12 text-center">
              <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
              <p className="text-xs font-mono text-slate-500">Syncing teams...</p>
            </div>
          ) : error ? (
            <div className="sc-panel border border-red-500/25 bg-red-500/10 p-8 text-center">
              <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-red-300" />
              <p className="text-xs font-mono text-red-200">{error}</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="sc-panel p-8 text-center">
              <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-amber-300" />
              <p className="text-xs font-mono text-slate-400">No operational teams found.</p>
            </div>
          ) : (
            teams.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveTeamId(t.id)}
                className={`cursor-pointer rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 ${activeTeamId === t.id
                    ? 'border-sky-400/30 bg-sky-500/8 shadow-[0_12px_30px_rgba(37,99,235,0.18)]'
                    : 'border-white/8 bg-[#161b22]/90 hover:border-sky-400/20 hover:bg-white/5'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="truncate text-sm font-bold tracking-wide text-white">{t.teamName}</h3>
                  <span className="sc-badge border-white/10 bg-white/5 text-slate-300">{t.department}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-400">{t.description || 'No description provided'}</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3 text-[10px] font-mono text-slate-500">
                  <span className="flex items-center">
                    <Users className="mr-1 h-3.5 w-3.5 text-slate-400" />
                    {t.members?.length || 0} Members
                  </span>
                  <span>Lead: {t.teamLead?.name || 'Unassigned'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="xl:col-span-2">
          {activeTeam ? (
            <div className="sc-panel space-y-6 p-6">
              <div className="flex flex-col gap-4 border-b border-white/8 pb-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">{activeTeam.teamName}</h2>
                  <p className="mt-1 text-xs font-mono text-slate-400">Department: <span className="text-slate-200">{activeTeam.department}</span></p>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenEditModal(activeTeam)} className="sc-button-secondary px-3 py-2 text-xs font-semibold">
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                    <button onClick={() => setTeamToDelete(activeTeam)} className="sc-button-danger px-3 py-2 text-xs font-semibold">
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Description</h4>
                <p className="rounded-2xl border border-white/8 bg-[#0b1220]/60 p-4 text-xs leading-relaxed text-slate-300">
                  {activeTeam.description || 'No description details logged.'}
                </p>
              </div>

              <div>
                <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Team Lead</h4>
                {activeTeam.teamLead ? (
                  <div className="flex max-w-sm items-center space-x-3 rounded-2xl border border-white/8 bg-white/5 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sm font-bold text-sky-300">
                      {activeTeam.teamLead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{activeTeam.teamLead.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">{activeTeam.teamLead.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-500 font-mono">No team lead assigned.</p>
                )}
              </div>

              <div>
                <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Members ({activeTeam.members?.length || 0})</h4>
                {activeTeam.members && activeTeam.members.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {activeTeam.members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 rounded-2xl border border-white/8 bg-white/5 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/8 bg-[#0b1220] text-xs font-bold text-slate-300">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="truncate text-xs font-semibold text-white">{member.name}</p>
                          <p className="truncate text-[9px] font-mono text-slate-400">{member.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-500 font-mono">No members are assigned to this team.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="sc-panel p-12 text-center">
              <Info className="mx-auto mb-3 h-8 w-8 text-slate-500" />
              <p className="text-sm font-mono text-slate-400">Select a team card to retrieve operational profiles.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal sc-scale-in relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-slate-400 transition hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-4 flex items-center space-x-2 text-lg font-bold text-white">
              <Network className="h-5 w-5 text-sky-300" />
              <span>{modalType === 'ADD' ? 'Create Team' : 'Edit Team'}</span>
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Team Name</label>
                  <input
                    type="text"
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    placeholder="Team Alpha"
                    className="glass-input w-full px-4 py-3 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="glass-input w-full px-4 py-3 text-xs"
                  >
                    <option value="">All Departments</option>
                    <option value="Developer">Developer</option>
                    <option value="IT Support">IT Support</option>
                    <option value="QA">QA</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Sales&Marketing">Sales & Marketing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Assign Team Lead</label>
                <select
                  value={formData.teamLead}
                  onChange={(e) => setFormData({ ...formData, teamLead: e.target.value })}
                  className="glass-input w-full cursor-pointer bg-[#0b1220] px-4 py-3 text-xs text-white"
                >
                  <option value="">Select Team Lead</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Team purpose and notes..."
                  rows="3"
                  className="glass-input w-full px-4 py-3 text-xs"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Team Members</label>
                <div className="h-44 space-y-2 overflow-y-auto rounded-2xl border border-white/8 bg-[#0b1220]/60 p-3">
                  {usersList.length === 0 ? (
                    <p className="text-[10px] italic text-slate-500 font-mono">No users available.</p>
                  ) : (
                    usersList.map((usr) => (
                      <label key={usr.id} className="flex cursor-pointer select-none items-center space-x-2.5 text-xs text-slate-300 transition hover:text-white">
                        <input
                          type="checkbox"
                          checked={formData.members.includes(usr.id)}
                          onChange={() => handleMemberCheckboxChange(usr.id)}
                          className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
                        />
                        <span className="truncate">{usr.name} <span className="text-[9px] font-mono text-slate-500">({usr.department || 'No Dept'} - {usr.role})</span></span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="sc-button-secondary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em]">
                  Cancel
                </button>
                <button type="submit" className="sc-button-primary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em]">
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal sc-scale-in w-full max-w-sm p-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-300" />
              <h3 className="mb-2 text-lg font-bold text-white">Delete Team?</h3>
              <p className="mb-6 text-xs leading-relaxed text-slate-400 font-mono">
                Confirm deletion of team <span className="font-semibold text-white">{teamToDelete.teamName}</span>. This removes members immediately. Action is irreversible.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setTeamToDelete(null)} className="sc-button-secondary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em]">
                  Cancel
                </button>
                <button onClick={handleDeleteTeam} className="sc-button-danger flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em]">
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
