import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, Network, ShieldAlert, UserCheck, Users } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get('/api/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        setError('Could not retrieve dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
        <p className="text-sm font-mono text-slate-400">Loading dashboard metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sc-panel flex items-center space-x-2 border border-red-500/25 bg-red-500/10 p-4 text-red-300">
        <AlertTriangle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 sc-fade-in">
      <div className="sc-panel p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="sc-badge border-sky-500/20 bg-sky-500/10 text-sky-300">Dashboard</span>
          <span className="sc-badge border-amber-500/20 bg-amber-500/10 text-amber-300">Core metrics only</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">Security Operations Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Platform-level user and team counts from the backend.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="sc-card flex min-h-36 items-center justify-between p-6">
          <div>
            <p className="sc-text-kicker">Total operators</p>
            <h3 className="mt-2 text-3xl font-bold text-white">{stats?.totalUsers ?? 0}</h3>
          </div>
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-sky-300">
            <Users className="h-6 w-6" />
          </div>
        </div>
        <div className="sc-card flex min-h-36 items-center justify-between p-6">
          <div>
            <p className="sc-text-kicker">Total Active Users</p>
            <h3 className="mt-2 text-3xl font-bold text-fuchsia-600">{stats?.activeUsers ?? 0}</h3>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="sc-card flex min-h-36 items-center justify-between p-6">
          <div>
            <p className="sc-text-kicker">Security teams</p>
            <h3 className="mt-2 text-3xl font-bold text-white">{stats?.totalTeams ?? 0}</h3>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-300">
            <Network className="h-6 w-6" />
          </div>
        </div>

        <div className="sc-card flex min-h-36 items-center justify-between p-6">
          <div>
            <p className="sc-text-kicker">System threat level</p>
            <h3 className="mt-2">
              <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">
                Under maintenance
              </span>
            </h3>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-300">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
