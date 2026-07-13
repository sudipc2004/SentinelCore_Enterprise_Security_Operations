import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { Search, UserPlus, Edit2, Trash2, Briefcase, Filter, X, ArrowLeft, ArrowRight, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import "../index.css"

export default function Users() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const isAdmin = currentUser?.role === 'ADMIN';

  // Table Data States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedRole, setAppliedRole] = useState('');
  const [appliedDept, setAppliedDept] = useState('');

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
      if (appliedSearch) params.search = appliedSearch;
      if (appliedRole) params.role = appliedRole;
      if (appliedDept) params.department = appliedDept;

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
  }, [page, appliedSearch, appliedRole, appliedDept]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    setAppliedSearch(search);
    setAppliedRole(roleFilter);
    setAppliedDept(deptFilter);
  };

  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setDeptFilter('');
    setAppliedSearch('');
    setAppliedRole('');
    setAppliedDept('');
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
    setSelectedUser(null);
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
        showToast({ type: 'success', message: 'User created successfully.' });
      } else {
        await axios.put(`/api/users/${selectedUser.id}`, formData);
        setFormSuccess('User profile updated successfully!');
        showToast({ type: 'success', message: 'User profile updated successfully.' });
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
      showToast({ type: 'success', message: `User status updated to ${newStatus}.` });
      fetchUsers();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Failed to update status.' });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await axios.delete(`/api/users/${userToDelete.id}`);
      setUserToDelete(null);
      showToast({ type: 'success', message: 'User deleted successfully.' });
      fetchUsers();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Failed to delete user.' });
    }
  };

  return (
    <div className="space-y-6 sc-fade-in">
      <div className="sc-panel flex flex-col gap-4 p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="sc-badge border-sky-500/20 bg-sky-500/10 text-sky-300">User directory</span>
            <span className="sc-badge border-white/10 bg-white/5 text-slate-300">RBAC managed</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-2xl">User Management</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">Manage users, roles, status, and departments without changing the underlying workflow.</p>
        </div>
        {isAdmin && (
          <button onClick={handleOpenAddModal} className="c-p sc-button-primary px-4 py-3 text-sm font-semibold">
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        )}
      </div>

      <div className="sc-panel p-6">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Search users</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input w-full px-4 py-3 pl-11 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Access role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="glass-input w-full cursor-pointer bg-[#0b1220] px-4 py-3 text-sm text-white"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="ANALYST">ANALYST</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Department</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="glass-input w-full cursor-pointer bg-[#0b1220] px-4 py-3 text-sm text-white"
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
          <div className="flex gap-2">
            <button type="submit" className="c-p applyFilter sc-button-secondary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em]">
              Apply Filter
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
            <p className="text-xs font-mono text-slate-400">Syncing database directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-300" />
            <p className="text-sm font-mono text-slate-400">No users match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.24em] text-slate-400">
                  <th className="px-6 py-4">User Name</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Login</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8 text-xs">
                {users.map((item) => (
                  <tr key={item.id} className="transition hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{item.name}</span>
                        <span className="mt-0.5 text-[10px] font-mono text-slate-400">{item.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold font-mono tracking-[0.16em] ${item.role === 'ADMIN'
                        ? 'border-red-500/20 bg-red-500/10 text-red-300'
                        : item.role === 'ANALYST'
                          ? 'border-sky-500/20 bg-sky-500/10 text-sky-300'
                          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                        }`}>
                        {item.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">{item.department}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        disabled={!isAdmin}
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold font-mono tracking-[0.16em] transition ${item.status === 'ACTIVE'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                          : 'border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                          } ${!isAdmin ? 'cursor-default opacity-70' : 'cursor-pointer'}`}
                      >
                        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${item.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                        {item.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">{item.lastLogin ? new Date(item.lastLogin).toLocaleString() : 'NEVER'}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {isAdmin ? (
                        <>
                          <button onClick={() => handleOpenEditModal(item)} className="c-p sc-button-secondary p-2" title="Edit User">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setUserToDelete(item)} className="c-p sc-button-danger p-2" title="Delete User">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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
            <span>Total Listings: {totalElements}</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 0))}
                disabled={page === 0}
                className="sc-button-secondary p-2 disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span>Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))}
                disabled={page === totalPages - 1}
                className="sc-button-secondary p-2 disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal sc-scale-in relative max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-slate-400 transition hover:text-white">
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-4 flex items-center space-x-2 text-lg font-bold text-white">
              <ShieldCheck className="h-5 w-5 text-sky-300" />
              <span>{modalType === 'ADD' ? 'Add User' : 'Edit User'}</span>
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
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter Name"
                  className="glass-input w-full px-4 py-3 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@sentinelcore.in"
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

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="glass-input w-full cursor-pointer bg-[#0b1220] px-4 py-3 text-xs text-white"
                >
                  <option value="VIEWER">VIEWER (Read-Only)</option>
                  <option value="ANALYST">ANALYST (Reviewer)</option>
                  {modalType === 'EDIT' && selectedUser?.role === 'ADMIN' && (
                    <option value="ADMIN">ADMIN (Primary Account)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {modalType === 'ADD' ? 'Password' : 'Change Password (Optional)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password"
                  className="glass-input w-full px-4 py-3 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="sc-button-secondary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em]">
                  Cancel
                </button>
                <button type="submit" className="sc-button-primary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em]">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal sc-scale-in w-full max-w-sm p-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-300" />
              <h3 className="mb-2 text-lg font-bold text-white">Delete User?</h3>
              <p className="mb-6 text-xs leading-relaxed text-slate-400 font-mono">
                Confirm deletion of <span className="font-semibold text-white">{userToDelete.name}</span> ({userToDelete.email}). This action can't be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setUserToDelete(null)} className="sc-button-secondary flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em]">
                  Cancel
                </button>
                <button onClick={handleDeleteUser} className="sc-button-danger flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em]">
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
