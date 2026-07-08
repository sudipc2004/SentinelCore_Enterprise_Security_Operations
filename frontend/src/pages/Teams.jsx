import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Network, Plus, Edit2, Trash2, Users, Info, Search, X, AlertTriangle, Check } from 'lucide-react';

export default function Teams() {
  const { user: currentUser } = useAuth();
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
      } else {
        await axios.put(`/api/teams/${selectedTeam.id}`, formData);
        setFormSuccess('Security Team details updated!');
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
      fetchTeams();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete team.');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">Teams</h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">Create teams, assign leads, and manage members</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 bg-primary text-black font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-primary-hover transition shadow-md shadow-primary/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        )}
      </div>

      {/* Search Toolbar */}
      <div className="glass-card p-6 border border-dark-border">
        <form onSubmit={handleSearchSubmit} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search teams by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg glass-input text-xs"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-800 text-white border border-dark-border hover:bg-slate-700 text-xs py-2 px-6 rounded-lg transition font-mono uppercase tracking-wider cursor-pointer"
          >
            Query
          </button>
        </form>
      </div>

      {/* Main Grid: Team list on left, details on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Team Cards */}
        <div className="lg:col-span-1 space-y-4">
          {loading ? (
            <div className="glass-card p-12 text-center border border-dark-border">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs font-mono text-gray-500">Syncing teams...</p>
            </div>
          ) : error ? (
            <div className="glass-card p-8 text-center border border-red-500/25 bg-red-500/10">
              <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-xs font-mono text-red-300">{error}</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="glass-card p-8 text-center border border-dark-border">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-xs font-mono text-gray-400">No operational teams found.</p>
            </div>
          ) : (
            teams.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveTeamId(t.id)}
                className={`p-5 rounded-lg border transition-all duration-150 cursor-pointer ${
                  activeTeamId === t.id
                    ? 'bg-primary/5 border-primary/45 shadow-md shadow-primary/5'
                    : 'glass-card hover:bg-slate-900/10 border-dark-border'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-white tracking-wide truncate">{t.teamName}</h3>
                  <span className="text-[9px] bg-slate-800 border border-dark-border text-gray-400 font-mono px-2 py-0.5 rounded">
                    {t.department}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">{t.description || 'No description provided'}</p>
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-4 pt-3 border-t border-dark-border/20">
                  <span className="flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {t.members?.length || 0} Members
                  </span>
                  <span>Lead: {t.teamLead?.name || 'Unassigned'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Active Team Details */}
        <div className="lg:col-span-2">
          {activeTeam ? (
            <div className="glass-card border border-dark-border p-6 space-y-6">
              <div className="flex justify-between items-start border-b border-dark-border pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-wide">{activeTeam.teamName}</h2>
                  <p className="text-xs text-gray-400 font-mono mt-1">Department: <span className="text-gray-200">{activeTeam.department}</span></p>
                </div>
                {isAdmin && (
                  <div className="space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(activeTeam)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 text-gray-300 border border-dark-border hover:bg-slate-700 hover:text-white text-xs font-mono transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setTeamToDelete(activeTeam)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs font-mono transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Description</h4>
                <p className="text-xs text-gray-300 bg-slate-900/30 border border-dark-border/40 p-3 rounded-lg leading-relaxed">
                  {activeTeam.description || 'No description details logged.'}
                </p>
              </div>

              {/* Team Lead Info */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3">Team Lead</h4>
                {activeTeam.teamLead ? (
                  <div className="flex items-center space-x-3 p-3 bg-slate-900/30 border border-dark-border rounded-lg max-w-sm">
                    <div className="w-9 h-9 rounded-full bg-secondary/15 border border-secondary/25 flex items-center justify-center font-bold text-secondary text-sm">
                      {activeTeam.teamLead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{activeTeam.teamLead.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{activeTeam.teamLead.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 font-mono italic">No team lead assigned.</p>
                )}
              </div>

              {/* Members List */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3">Members ({activeTeam.members?.length || 0})</h4>
                {activeTeam.members && activeTeam.members.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeTeam.members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-3 bg-slate-900/35 border border-dark-border/60 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-dark-border flex items-center justify-center font-bold text-gray-400 text-xs">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-white truncate">{member.name}</p>
                          <p className="text-[9px] text-gray-400 font-mono truncate">{member.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 font-mono italic">No members are assigned to this team.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card border border-dark-border p-12 text-center">
              <Info className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <p className="text-sm font-mono text-gray-400">Select a team card to retrieve operational profiles.</p>
            </div>
          )}
        </div>

      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-card p-6 border border-dark-border relative animate-scale-up max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Network className="w-5 h-5 text-primary" />
              <span>{modalType === 'ADD' ? 'Create Team' : 'Edit Team'}</span>
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {formError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Team Name</label>
                  <input
                    type="text"
                    value={formData.teamName}
                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                    placeholder="Red Team Alpha"
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Cyber Intel"
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Assign Team Lead</label>
                <select
                  value={formData.teamLead}
                  onChange={(e) => setFormData({ ...formData, teamLead: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
                >
                  <option value="">Select Team Lead</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Team purpose and notes..."
                  rows="3"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              {/* Members Selection checkboxes */}
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2">Team Members</label>
                <div className="h-44 overflow-y-auto border border-dark-border bg-slate-950/40 p-3 rounded-lg space-y-2">
                  {usersList.length === 0 ? (
                    <p className="text-[10px] text-gray-500 font-mono italic">No users available.</p>
                  ) : (
                    usersList.map((usr) => (
                      <label key={usr.id} className="flex items-center space-x-2.5 text-xs text-gray-300 hover:text-white cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.members.includes(usr.id)}
                          onChange={() => handleMemberCheckboxChange(usr.id)}
                          className="rounded border-gray-600 bg-slate-800 text-primary focus:ring-primary w-3.5 h-3.5"
                        />
                        <span className="truncate">{usr.name} <span className="text-[9px] text-gray-500 font-mono">({usr.department || 'No Dept'} - {usr.role})</span></span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs font-mono bg-slate-800 text-gray-400 border border-dark-border hover:bg-slate-700 hover:text-white rounded-lg transition uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-mono bg-primary text-black font-bold rounded-lg hover:bg-primary-hover transition uppercase tracking-wider cursor-pointer"
                >
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-card p-6 border border-dark-border relative animate-scale-up">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Delete Team?</h3>
              <p className="text-xs text-gray-400 mb-6 font-mono leading-relaxed">
                Confirm deletion of team <span className="text-white font-semibold">{teamToDelete.teamName}</span>. This removes members immediately. Action is irreversible.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTeamToDelete(null)}
                  className="flex-1 py-2 text-xs font-mono uppercase bg-slate-800 text-gray-400 border border-dark-border hover:bg-slate-700 hover:text-white rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTeam}
                  className="flex-1 py-2 text-xs font-mono uppercase bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition cursor-pointer"
                >
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
