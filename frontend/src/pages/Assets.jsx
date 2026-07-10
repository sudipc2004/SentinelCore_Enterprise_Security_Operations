import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Server, Monitor, ShieldAlert, Cpu, HardDrive, ToggleLeft, ToggleRight, X, AlertCircle } from 'lucide-react';

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'SERVER',
    ipAddress: '',
    macAddress: '',
    os: 'Linux (Ubuntu 22.04)',
    criticality: 'CRITICAL',
    status: 'ONLINE'
  });
  const [formError, setFormError] = useState('');

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/assets');
      setAssets(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch corporate assets registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name.trim() || !formData.ipAddress.trim() || !formData.macAddress.trim()) {
      setFormError('Asset Name, IP Address, and MAC Address are required.');
      return;
    }
    try {
      await axios.post('/api/assets', formData);
      setFormData({
        name: '',
        type: 'SERVER',
        ipAddress: '',
        macAddress: '',
        os: 'Linux (Ubuntu 22.04)',
        criticality: 'CRITICAL',
        status: 'ONLINE'
      });
      setShowAddForm(false);
      fetchAssets();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to register asset.');
    }
  };

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    try {
      await axios.post('/api/assets', { ...item, status: newStatus });
      fetchAssets();
    } catch (err) {
      alert('Failed to update asset status.');
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm('Delete this asset from registry? Logs matching this asset IP will continue to process.')) return;
    try {
      await axios.delete(`/api/assets/${id}`);
      fetchAssets();
    } catch (err) {
      alert('Failed to remove asset.');
    }
  };

  const getAssetIcon = (type) => {
    switch (type) {
      case 'SERVER': return <Server className="w-6 h-6 text-primary" />;
      case 'FIREWALL': return <ShieldAlert className="w-6 h-6 text-red-400" />;
      case 'DATABASE': return <HardDrive className="w-6 h-6 text-indigo-400" />;
      default: return <Monitor className="w-6 h-6 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide">Asset Management</h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">Store, update, and audit network servers, firewalls, routers, databases, and client devices</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-primary text-black font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-primary-hover transition shadow-md shadow-primary/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Asset</span>
        </button>
      </div>

      {/* Grid: Assets register */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-mono text-gray-400">Syncing asset registries...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="col-span-full py-24 text-center glass-card border border-dark-border">
            <Server className="w-10 h-10 text-gray-500 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-mono text-gray-400 mb-1">Corporate asset registry empty.</p>
            <p className="text-xs text-gray-500 font-mono">Register servers, firewalls, and routers to associate incoming logs with critical items.</p>
          </div>
        ) : (
          assets.map((item) => (
            <div
              key={item.id}
              className="glass-card p-6 border border-dark-border hover:border-dark-border/100 duration-200 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-950/40 rounded-xl border border-dark-border">
                    {getAssetIcon(item.type)}
                  </div>
                  <div className="flex flex-col items-end space-y-1.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-bold font-mono border ${
                      item.criticality === 'CRITICAL'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : item.criticality === 'HIGH'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {item.criticality}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`inline-flex items-center text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border transition cursor-pointer ${
                        item.status === 'ONLINE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                      {item.status}
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mb-2">{item.name}</h3>
                <div className="space-y-1 text-xs font-mono text-gray-400">
                  <div className="flex justify-between"><span className="text-gray-600">IP address:</span> <span className="text-white">{item.ipAddress}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">MAC address:</span> <span>{item.macAddress}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">OS version:</span> <span className="truncate max-w-[120px]">{item.os}</span></div>
                </div>
              </div>

              <div className="border-t border-dark-border/40 pt-4 mt-4 flex justify-between items-center text-[10px] font-mono text-gray-500">
                <span>Last Scan: {new Date(item.lastSeen).toLocaleDateString()}</span>
                <button
                  onClick={() => handleDeleteAsset(item.id)}
                  className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded cursor-pointer"
                  title="Remove Asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Asset Modal Form */}
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
              <span>Register Corporate Asset</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {formError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Asset Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Domain Controller (Internal)"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Asset Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
                  >
                    <option value="SERVER">Server</option>
                    <option value="ROUTER">Router</option>
                    <option value="FIREWALL">Firewall</option>
                    <option value="ENDPOINT">Client Endpoint</option>
                    <option value="APPLICATION">Web Application</option>
                    <option value="CLOUD_SERVER">Cloud Server</option>
                    <option value="DATABASE">Database Instance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">Criticality</label>
                  <select
                    value={formData.criticality}
                    onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">IP Address</label>
                  <input
                    type="text"
                    value={formData.ipAddress}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    placeholder="10.0.1.10"
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">MAC Address</label>
                  <input
                    type="text"
                    value={formData.macAddress}
                    onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                    placeholder="00:1A:2B:3C:4D:5E"
                    className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1">OS / Platform</label>
                <input
                  type="text"
                  value={formData.os}
                  onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                  placeholder="Windows Server 2022 / Linux (Debian 12)"
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs"
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
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
