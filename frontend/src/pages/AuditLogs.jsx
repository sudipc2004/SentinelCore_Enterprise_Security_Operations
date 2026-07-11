import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, ArrowLeft, ArrowRight, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const actionStyles = {
  LOGIN_SUCCESS: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  LOGIN_FAILED: 'border-red-500/20 bg-red-500/10 text-red-300',
  USER_CREATED: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
  USER_UPDATED: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
  USER_DELETED: 'border-red-500/20 bg-red-500/10 text-red-300',
  ROLE_ASSIGNED: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  TEAM_CREATED: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
  TEAM_UPDATED: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
  TEAM_DELETED: 'border-red-500/20 bg-red-500/10 text-red-300',
  LOGOUT: 'border-slate-500/20 bg-slate-500/10 text-slate-300',
};

function formatDate(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
}

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pageSize = 15;

  const canReadAuditLogs = user?.role === 'ADMIN' || user?.role === 'ANALYST';

  const fetchLogs = async () => {
    if (!canReadAuditLogs) {
      setLoading(false);
      setError('Audit logs are available to admins and analysts only.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/audit-logs', {
        params: {
          page,
          size: pageSize,
          sortBy: 'timestamp',
          direction: 'desc',
        },
      });
      setLogs(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalElements(response.data.totalElements || 0);
    } catch (err) {
      setError(err.response?.status === 403 ? 'You do not have access to audit logs.' : 'Failed to retrieve audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, canReadAuditLogs]);

  return (
    <div className="space-y-6 sc-fade-in">
      <div className="sc-panel flex flex-col gap-4 p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="sc-badge border-sky-500/20 bg-sky-500/10 text-sky-300">Audit trail</span>
            <span className="sc-badge border-white/10 bg-white/5 text-slate-300">{user?.role} scope</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">Audit Logs</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Review authentication, user, and team activity recorded by the backend audit service.
          </p>
        </div>
        <button onClick={fetchLogs} className="sc-button-secondary px-4 py-3 text-sm font-semibold">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="sc-table-shell overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
            <p className="text-xs font-mono text-slate-400">Loading audit trail...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="mb-3 h-8 w-8 text-red-300" />
            <p className="text-sm font-mono text-red-200">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Clock className="mb-3 h-8 w-8 text-slate-500" />
            <p className="text-sm font-mono text-slate-400">No audit events have been recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/8 text-[10px] uppercase tracking-[0.24em] text-slate-400">
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8 text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-white/5">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-slate-400">{formatDate(log.timestamp)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{log.userEmail || 'System'}</span>
                        <span className="mt-0.5 font-mono text-[10px] text-slate-500">{log.userId || 'No user id'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.16em] ${actionStyles[log.action] || 'border-white/10 bg-white/5 text-slate-300'}`}>
                        {log.action || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">{log.module || 'UNKNOWN'}</td>
                    <td className="max-w-xl px-6 py-4 text-slate-300">{log.description || 'No description supplied.'}</td>
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-slate-400">{log.ipAddress || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && totalPages > 0 && (
          <div className="flex flex-col gap-3 border-t border-white/8 bg-[#0b1220]/70 p-4 text-xs font-mono text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>Total Events: {totalElements}</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPage((value) => Math.max(value - 1, 0))}
                disabled={page === 0}
                className="sc-button-secondary p-2 disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span>Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage((value) => Math.min(value + 1, totalPages - 1))}
                disabled={page === totalPages - 1}
                className="sc-button-secondary p-2 disabled:pointer-events-none disabled:opacity-30"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
