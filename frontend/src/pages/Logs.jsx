import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Upload, Trash2, Filter, AlertTriangle, ShieldCheck, FileText, CheckCircle2, X } from 'lucide-react';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search / Filters
  const [search, setSearch] = useState('');
  const [systemType, setSystemType] = useState('');
  const [isAnomaly, setIsAnomaly] = useState('');
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState('WINDOWS');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Selected Log Modal Detail
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (systemType) params.systemType = systemType;
      if (isAnomaly) params.isAnomaly = isAnomaly === 'true';
      if (search) params.search = search;

      const response = await axios.get('/api/logs', { params });
      setLogs(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch security logs database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [systemType, isAnomaly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSystemType('');
    setIsAnomaly('');
    fetchLogs();
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadSuccess('');
    setUploadError('');
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to ingest.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('systemType', uploadType);

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const response = await axios.post('/api/logs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSuccess(response.data.message || 'Log file ingested successfully.');
      setSelectedFile(null);
      // Reset input element
      document.getElementById('log-file-input').value = '';
      fetchLogs();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload log file.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLog = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this log entry?')) return;
    try {
      await axios.delete(`/api/logs/${id}`);
      fetchLogs();
    } catch (err) {
      alert('Failed to delete log.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">Log Management</h1>
        <p className="text-sm text-gray-400 mt-1 font-mono">Collect, ingest, search, and analyze log files from Windows, Linux, network firewalls, and servers</p>
      </div>

      {/* Main Grid: Upload & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingest Panel */}
        <div className="glass-card p-6 border border-dark-border lg:col-span-1 h-fit">
          <h2 className="text-md font-bold text-white mb-4 flex items-center space-x-2">
            <Upload className="w-5 h-5 text-primary" />
            <span>Ingest Log File</span>
          </h2>
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {uploadError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="truncate">{uploadError}</span>
              </div>
            )}
            {uploadSuccess && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate">{uploadSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2">Log Origin System</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
              >
                <option value="WINDOWS">WINDOWS</option>
                <option value="LINUX">LINUX</option>
                <option value="APACHE">APACHE</option>
                <option value="NGINX">NGINX</option>
                <option value="FIREWALL">FIREWALL</option>
                <option value="ROUTER">ROUTER</option>
                <option value="IDS">IDS</option>
                <option value="ENDPOINT">ENDPOINT</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2">Select Log File (.log, .txt)</label>
              <input
                id="log-file-input"
                type="file"
                accept=".log,.txt"
                onChange={handleFileChange}
                className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full bg-primary text-black font-semibold text-xs py-2.5 rounded-lg hover:bg-primary-hover transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-primary/10"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/25 border-t-black rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ingest Records</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Filter Panel */}
        <div className="glass-card p-6 border border-dark-border lg:col-span-2">
          <h2 className="text-md font-bold text-white mb-4 flex items-center space-x-2">
            <Filter className="w-5 h-5 text-secondary" />
            <span>Search & Filter</span>
          </h2>
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2">Raw Data Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search logs (IP, User, Payload...)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg glass-input text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2">System Type</label>
                <select
                  value={systemType}
                  onChange={(e) => setSystemType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
                >
                  <option value="">All Systems</option>
                  <option value="WINDOWS">WINDOWS</option>
                  <option value="LINUX">LINUX</option>
                  <option value="APACHE">APACHE</option>
                  <option value="NGINX">NGINX</option>
                  <option value="FIREWALL">FIREWALL</option>
                  <option value="ROUTER">ROUTER</option>
                  <option value="IDS">IDS</option>
                  <option value="ENDPOINT">ENDPOINT</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2">AI Anomaly Status</label>
                <select
                  value={isAnomaly}
                  onChange={(e) => setIsAnomaly(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
                >
                  <option value="">All Logs</option>
                  <option value="true">Detected Anomalies Only</option>
                  <option value="false">Normal Logs Only</option>
                </select>
              </div>
              <div className="flex items-end space-x-2 pt-2 md:pt-0">
                <button
                  type="submit"
                  className="flex-1 bg-slate-800 text-white border border-dark-border hover:bg-slate-700 text-xs py-2.5 px-4 rounded-lg transition font-mono uppercase tracking-wider cursor-pointer"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs py-2.5 px-3 rounded-lg transition font-mono uppercase tracking-wider cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Logs Table / Ingestion Console */}
      <div className="glass-card border border-dark-border overflow-hidden">
        <div className="p-4 border-b border-dark-border bg-slate-900/35 flex justify-between items-center">
          <span className="text-xs font-mono font-semibold text-white">Ingested Security Logs ({logs.length})</span>
          <button
            onClick={fetchLogs}
            className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-gray-300 px-3 py-1.5 rounded border border-dark-border transition cursor-pointer"
          >
            Refresh Logs
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-mono text-gray-400">Syncing database directory...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-24 text-center">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-mono text-gray-400 mb-1">No logs found in this query.</p>
            <p className="text-xs text-gray-500 font-mono">Upload a log file or send requests to trigger ingestion.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border bg-slate-900/50 text-[10px] uppercase font-mono tracking-wider text-gray-400">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">System</th>
                  <th className="py-4 px-6">Source IP</th>
                  <th className="py-4 px-6">Identity</th>
                  <th className="py-4 px-6">AI Status</th>
                  <th className="py-4 px-6">Risk Score</th>
                  <th className="py-4 px-6">Raw Log Payload</th>
                  <th className="py-4 px-6 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-xs font-mono">
                {logs.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedLog(item)}
                    className="hover:bg-slate-900/25 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="py-4 px-6 text-gray-400 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-slate-800 text-gray-200 border border-dark-border px-2 py-0.5 rounded text-[10px] font-bold">
                        {item.systemType}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-300">{item.ipAddress}</td>
                    <td className="py-4 px-6 text-gray-400 text-[11px] truncate max-w-[120px]" title={item.userEmail}>
                      {item.userEmail}
                    </td>
                    <td className="py-4 px-6">
                      {item.anomaly ? (
                        <span className="inline-flex items-center text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          ANOMALY
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          NORMAL
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-bold">
                      <span className={item.riskScore >= 0.75 ? 'text-red-400' : item.riskScore >= 0.45 ? 'text-amber-400' : 'text-emerald-400'}>
                        {Math.round(item.riskScore * 100)}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-400 max-w-xs truncate">{item.rawMessage}</td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDeleteLog(item.id, e)}
                        className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/25 transition cursor-pointer"
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

      {/* Log Detail Dialog Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-card p-6 border border-dark-border relative animate-scale-up">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Security Log Details</span>
            </h3>

            <div className="space-y-3 font-mono text-xs text-gray-300">
              <div className="flex border-b border-dark-border/40 py-2">
                <span className="w-32 text-gray-500 uppercase">Log ID:</span>
                <span className="text-white select-all">{selectedLog.id}</span>
              </div>
              <div className="flex border-b border-dark-border/40 py-2">
                <span className="w-32 text-gray-500 uppercase">Timestamp:</span>
                <span>{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex border-b border-dark-border/40 py-2">
                <span className="w-32 text-gray-500 uppercase">System Type:</span>
                <span className="font-bold text-primary">{selectedLog.systemType}</span>
              </div>
              <div className="flex border-b border-dark-border/40 py-2">
                <span className="w-32 text-gray-500 uppercase">IP & Port:</span>
                <span>{selectedLog.ipAddress} : {selectedLog.port} ({selectedLog.protocol})</span>
              </div>
              <div className="flex border-b border-dark-border/40 py-2">
                <span className="w-32 text-gray-500 uppercase">Identity:</span>
                <span>{selectedLog.userEmail} / {selectedLog.device}</span>
              </div>
              <div className="flex border-b border-dark-border/40 py-2">
                <span className="w-32 text-gray-500 uppercase">Country:</span>
                <span>{selectedLog.country}</span>
              </div>
              <div className="flex border-b border-dark-border/40 py-2">
                <span className="w-32 text-gray-500 uppercase">Bandwidth:</span>
                <span>{selectedLog.bytes} Bytes</span>
              </div>
              <div className="flex border-b border-dark-border/40 py-2">
                <span className="w-32 text-gray-500 uppercase">AI Score:</span>
                <span className="flex items-center space-x-2">
                  <span className={`font-bold ${selectedLog.anomaly ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedLog.anomaly ? 'ANOMALY' : 'NORMAL'}
                  </span>
                  <span className="text-gray-500">|</span>
                  <span>Confidence: {Math.round(selectedLog.confidenceScore * 100)}%</span>
                  <span className="text-gray-500">|</span>
                  <span>Risk Score: {Math.round(selectedLog.riskScore * 100)}%</span>
                </span>
              </div>
              <div className="flex flex-col py-2">
                <span className="text-gray-500 uppercase mb-2">Raw Message:</span>
                <pre className="p-3 bg-black/40 rounded-lg text-[10px] text-gray-300 whitespace-pre-wrap break-all max-h-40 overflow-y-auto border border-dark-border/40">
                  {selectedLog.rawMessage}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 bg-slate-800 text-gray-400 border border-dark-border hover:bg-slate-700 hover:text-white rounded-lg text-xs font-mono uppercase transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
