import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText, Download, Play, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Selection
  const [reportType, setReportType] = useState('DAILY');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/reports');
      setReports(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch generated reports log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await axios.post('/api/reports/generate', { type: reportType });
      setSuccessMsg(`Generated ${reportType} report successfully: ${response.data.title}`);
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to trigger report compilation.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (path) => {
    // Navigate window to download the file directly
    window.open(`http://localhost:8080${path}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">Report Center</h1>
        <p className="text-sm text-gray-400 mt-1 font-mono">Compile compliance checklists, daily activity logs, threat level changes, and resolved incidents</p>
      </div>

      {/* Generator & Reports log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Form */}
        <div className="glass-card p-6 border border-dark-border lg:col-span-1 h-fit">
          <h2 className="text-md font-bold text-white mb-4 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>Generate Security Report</span>
          </h2>
          <form onSubmit={handleGenerateReport} className="space-y-4">
            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2">Report Template</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg glass-input text-xs bg-slate-900 text-white cursor-pointer"
              >
                <option value="DAILY">DAILY ACTIVITY LOGS</option>
                <option value="WEEKLY">WEEKLY INCIDENTS SUMMARY</option>
                <option value="MONTHLY">MONTHLY COMPLIANCE REPORT</option>
                <option value="COMPLIANCE">SOC REGULATORY COMPLIANCE</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full bg-primary text-black font-semibold text-xs py-2.5 rounded-lg hover:bg-primary-hover transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-primary/10"
            >
              {generating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/25 border-t-black rounded-full animate-spin"></div>
                  <span>Compiling metrics...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History Log List */}
        <div className="glass-card border border-dark-border lg:col-span-2">
          <div className="p-4 border-b border-dark-border bg-slate-900/35 flex justify-between items-center">
            <span className="text-xs font-mono font-semibold text-white">Generated Report History</span>
            <button
              onClick={fetchReports}
              className="text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-gray-300 px-3 py-1.5 rounded border border-dark-border transition cursor-pointer"
            >
              Refresh Logs
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-xs font-mono text-gray-400">Syncing file listings...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-20 text-center text-gray-500 font-mono text-xs">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-700 animate-pulse" />
              <span>No reports have been compiled yet.</span>
            </div>
          ) : (
            <div className="divide-y divide-dark-border/40 text-xs font-mono">
              {reports.map((item) => (
                <div key={item.id} className="p-5 hover:bg-slate-900/10 transition flex items-center justify-between">
                  <div className="space-y-1.5 max-w-[70%]">
                    <div className="flex items-center space-x-2">
                      <span className="bg-slate-800 text-gray-200 border border-dark-border px-2 py-0.5 rounded text-[9px] font-bold">
                        {item.type}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white truncate">{item.title}</h3>
                    <p className="text-[10px] text-gray-400">Compiled by: {item.generatedBy}</p>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(item.csvPath)}
                      className="flex items-center space-x-2 bg-slate-800 text-white border border-dark-border px-3 py-2 rounded hover:bg-slate-700 hover:text-white transition text-xs font-semibold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </button>
                    <button
                      onClick={() => handleDownload(item.csvPath)} // Use CSV download for both since we generate CSV representation
                      className="flex items-center space-x-2 bg-primary/10 text-primary border border-primary/20 px-3 py-2 rounded hover:bg-primary/20 transition text-xs font-semibold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
