import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Plus, Trash2, Globe, Server, Link2, Key, AlertCircle, X } from 'lucide-react';

export default function ThreatIntel() {
  const [iocs, setIocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'IP',
    value: '',
    description: '',
    source: 'AlienVault OTX'
  });
  const [formError, setFormError] = useState('');

  const fetchIocs = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/threat-intel');
      setIocs(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch indicators of compromise database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIocs();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.value.trim() || !formData.description.trim()) {
      setFormError('Indicator Value and Description are required.');
      return;
    }
    try {
      await axios.post('/api/threat-intel', formData);
      setFormData({
        type: 'IP',
        value: '',
        description: '',
        source: 'AlienVault OTX'
      });
      setShowAddForm(false);
      fetchIocs();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to register IOC threat block.');
    }
  };

  const handleDeleteIoc = async (id) => {
    if (!window.confirm('Delete this Indicator of Compromise? This will stop rule triggers against it.')) return;
    try {
      await axios.delete(`/api/threat-intel/${id}`);
      fetchIocs();
    } catch (err) {
      alert('Failed to remove IOC indicator.');
    }
  };

  const getIocIcon = (type) => {
    switch (type) {
      case 'IP': return <Server className="w-4 h-4 text-emerald-400" />;
      case 'DOMAIN': return <Globe className="w-4 h-4 text-indigo-400" />;
      case 'URL': return <Link2 className="w-4 h-4 text-sky-400" />;
      default: return <Key className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">Threat Intelligence</h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">Manage blocklists and Indicators of Compromise (IOC) to filter out malicious sources</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-primary text-black font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-primary-hover transition shadow-md shadow-primary/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add IOC</span>
        </button>
      </div>

      {/* Grid: IOC database list */}
      <div className="glass-card border border-dark-border overflow-hidden">
        <div className="p-4 border-b border-dark-border bg-slate-900/35 flex justify-between items-center">
          <span className="text-xs font-mono font-semibold text-white">Active Blocked Indicators ({iocs.length})</span>
          <button
            onClick={fetchIocs}
            className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-gray-300 px-3 py-1.5 rounded border border-dark-border transition cursor-pointer"
          >
            Refresh IOC List
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-mono text-gray-400">Syncing database registers...</p>
          </div>
        ) : iocs.length === 0 ? (
          <div className="py-24 text-center">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-mono text-gray-400 mb-1">No indicators of compromise active.</p>
            <p className="text-xs text-gray-500 font-mono">Add malicious IPs, domains, or hashes to start checking logs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border bg-slate-900/50 text-[10px] uppercase font-mono tracking-wider text-gray-400">
                  <th className="py-4 px-6">IOC Type</th>
                  <th className="py-4 px-6">Indicator Block Value</th>
                  <th className="py-4 px-6">Source / Provider</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6">Added Time</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-xs font-mono">
                {iocs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {getIocIcon(item.type)}
                        <span className="font-bold text-white">{item.type}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-white font-semibold select-all">
                      {item.value}
                    </td>
                    <td className="py-4 px-6 text-gray-400">{item.source}</td>
                    <td className="py-4 px-6 text-gray-300 max-w-xs truncate" title={item.description}>
                      {item.description}
                    </td>
                    <td className="py-4 px-6 text-gray-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDeleteIoc(item.id)}
                        className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/25 transition cursor-pointer"
                        title="Remove Indicator"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add IOC Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md glass-card p-6 border border-dark-border relative animate-scale-up">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-primary" />
              <span>Register Indicators (IOC)</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {formError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Indicator Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
                >
                  <option value="IP">IP Address</option>
                  <option value="DOMAIN">Domain Name</option>
                  <option value="MALWARE_HASH">Malware Hash (MD5/SHA)</option>
                  <option value="URL">Blacklisted URL</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Indicator Value</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="e.g. 198.51.100.12 or malware-payload.exe"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Source / Threat Feed</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g. AlienVault OTX, Custom Log Check"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs h-20"
                  placeholder="Reason for blocking, threat type, etc..."
                  required
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2 text-xs font-mono uppercase bg-slate-800 text-gray-400 border border-dark-border hover:bg-slate-700 hover:text-white rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-mono uppercase bg-primary text-black font-bold rounded-lg hover:bg-primary-hover transition cursor-pointer"
                >
                  Save block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
