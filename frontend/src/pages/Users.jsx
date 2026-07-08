import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Search, UserPlus, Edit2, Trash2, Briefcase, Filter, X, ArrowLeft, ArrowRight, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Users() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  // Table Data States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter States
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  
  // Pagination States
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('ADD'); // ADD or EDIT
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'VIEWER',
    department: '',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Delete Confirmation State
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: pageSize,
        sortBy: 'createdAt',
        direction: 'desc'
      };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (deptFilter) params.department = deptFilter;

      const response = await axios.get('/api/users', { params });
      setUsers(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, deptFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setDeptFilter('');
    setPage(0);
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'VIEWER',
      department: '',
    });
    setFormError('');
    setFormSuccess('');
    setModalType('ADD');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Leave blank unless changing
      role: user.role,
      department: user.department || '',
    });
    setSelectedUser(user);
    setFormError('');
    setFormSuccess('');
    setModalType('EDIT');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.name || !formData.email || !formData.department) {
      setFormError('All fields except password are required');
      return;
    }

    try {
      if (modalType === 'ADD') {
        if (!formData.password) {
        setFormError('Password is required for new users');
          return;
        }
        await axios.post('/api/users', formData);
        setFormSuccess('User created successfully!');
      } else {
        await axios.put(`/api/users/${selectedUser.id}`, formData);
        setFormSuccess('User profile updated successfully!');
      }
      setTimeout(() => {
        setIsModalOpen(false);
        fetchUsers();
      }, 1000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed. Verify parameters.');
    }
  };

  const handleToggleStatus = async (user) => {
    if (!isAdmin) return;
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await axios.put(`/api/users/${user.id}/status`, { status: newStatus });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await axios.delete(`/api/users/${userToDelete.id}`);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">User Directory</h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">Manage users, roles, status, and departments</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 bg-primary text-black font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-primary-hover transition shadow-md shadow-primary/10 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* Filters Panel */}
      <div className="glass-card p-6 border border-dark-border">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Search Users</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg glass-input text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Access Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="ANALYST">ANALYST</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Department</label>
            <input
              type="text"
              placeholder="e.g. Operations"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg glass-input text-xs"
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 bg-slate-800 text-white border border-dark-border hover:bg-slate-700 text-xs py-2 px-4 rounded-lg transition font-mono uppercase tracking-wider cursor-pointer"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs py-2 px-3 rounded-lg transition font-mono uppercase tracking-wider cursor-pointer"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Directory Table */}
      <div className="glass-card border border-dark-border overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-mono text-gray-400">Syncing database directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <p className="text-sm font-mono text-gray-400">No users match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border bg-slate-900/35 text-[10px] uppercase font-mono tracking-wider text-gray-400">
                  <th className="py-4 px-6">User Name</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Last Login</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-xs">
                {users.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/15 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{item.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5">{item.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                        item.role === 'ADMIN' 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : item.role === 'ANALYST'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {item.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-300 font-mono">{item.department}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        disabled={!isAdmin}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border transition ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                        } ${!isAdmin ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                        {item.status}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-gray-400 font-mono">
                      {item.lastLogin ? new Date(item.lastLogin).toLocaleString() : 'NEVER'}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 bg-slate-800 text-gray-400 border border-dark-border rounded hover:text-primary hover:border-primary/20 transition cursor-pointer inline-block"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setUserToDelete(item)}
                            className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/20 transition cursor-pointer inline-block"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-mono text-gray-500 italic">Read-Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        {!loading && totalPages > 0 && (
          <div className="p-4 border-t border-dark-border/40 bg-slate-900/10 flex justify-between items-center text-xs font-mono text-gray-400">
            <span>Total Listings: {totalElements}</span>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 0))}
                disabled={page === 0}
                className="p-1 rounded bg-slate-800 border border-dark-border hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span>Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))}
                disabled={page === totalPages - 1}
                className="p-1 rounded bg-slate-800 border border-dark-border hover:bg-slate-700 hover:text-white transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit / Add Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 border border-dark-border relative animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>{modalType === 'ADD' ? 'Add User' : 'Edit User'}</span>
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

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@sentinelcore.io"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="SOC Operations"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
                >
                  <option value="VIEWER">VIEWER (Read-Only)</option>
                  <option value="ANALYST">ANALYST (Reviewer)</option>
                  <option value="ADMIN">ADMIN (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">
                  {modalType === 'ADD' ? 'Password' : 'Change Password (Optional)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs font-mono uppercase bg-slate-800 text-gray-400 border border-dark-border hover:bg-slate-700 hover:text-white rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-mono uppercase bg-primary text-black font-bold rounded-lg hover:bg-primary-hover transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm glass-card p-6 border border-dark-border relative animate-scale-up">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Delete User?</h3>
              <p className="text-xs text-gray-400 mb-6 font-mono leading-relaxed">
                Confirm deletion of <span className="text-white font-semibold">{userToDelete.name}</span> ({userToDelete.email}). This action cannot be undone.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-2 text-xs font-mono uppercase bg-slate-800 text-gray-400 border border-dark-border hover:bg-slate-700 hover:text-white rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
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
