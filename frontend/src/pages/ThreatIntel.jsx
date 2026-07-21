import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  ShieldAlert, ShieldCheck, Plus, Trash2, Globe, Server, Link2, Key, AlertCircle, X,
  RefreshCw, Layers, MapPin, Database, Award, Activity, CheckCircle2, AlertTriangle, FileText,
  Download, Upload, Tag, Search, ArrowRight, UserCheck, BarChart2, BookOpen, Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

export default function ThreatIntel() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('directory');
  const [iocs, setIocs] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination & Search
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 8;

  // Selected IOC / Enrichment drawer
  const [selectedIoc, setSelectedIoc] = useState(null);
  const [enrichment, setEnrichment] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);

  // Modals / Panels
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importText, setImportText] = useState('');
  const [importType, setImportType] = useState('JSON'); // JSON, CSV
  const [syncingFeedId, setSyncingFeedId] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    type: 'IP',
    value: '',
    description: '',
    source: 'Manual',
    reviewerTeamId: '',
    tags: ''
  });
  const [formError, setFormError] = useState('');

  const fetchIocs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size: pageSize
      };
      if (search) params.search = search;
      if (filterType) params.type = filterType;
      
      const response = await axios.get('/api/threat-intel', { params });
      
      // Handle page envelope or plain list
      if (response.data.content) {
        setIocs(response.data.content);
        setTotalPages(response.data.totalPages || 1);
        setTotalElements(response.data.totalElements || 0);
      } else {
        setIocs(response.data || []);
        setTotalPages(1);
        setTotalElements((response.data || []).length);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch indicators of compromise.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeds = async () => {
    try {
      const response = await axios.get('/api/threat-intel/feeds');
      setFeeds(response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/teams');
      setTeams(response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIocs();
  }, [page, filterType]);

  useEffect(() => {
    fetchFeeds();
    fetchTeams();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchIocs();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.value.trim() || !formData.description.trim()) {
      setFormError('Indicator Value and Description are required.');
      return;
    }
    try {
      const tagsArray = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
      await axios.post('/api/threat-intel', {
        ...formData,
        tags: tagsArray
      });
      showToast({ type: 'success', message: 'IOC added and automatically queued for enrichment.' });
      setFormData({
        type: 'IP',
        value: '',
        description: '',
        source: 'Manual',
        reviewerTeamId: '',
        tags: ''
      });
      setShowAddModal(false);
      setPage(0);
      fetchIocs();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to register IOC.');
    }
  };

  const handleDeleteIoc = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this Indicator of Compromise? This will stop matching alerts.')) return;
    try {
      await axios.delete(`/api/threat-intel/${id}`);
      showToast({ type: 'success', message: 'IOC deleted successfully.' });
      if (selectedIoc && selectedIoc.id === id) {
        setSelectedIoc(null);
      }
      fetchIocs();
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to remove IOC.' });
    }
  };

  const handleSelectIoc = async (ioc) => {
    setSelectedIoc(ioc);
    setEnrichment(null);
    setNotes([]);
    setNewNote('');
    
    // Fetch enrichment metadata
    try {
      const res = await axios.get(`/api/threat-intel/${ioc.id}/enrichment`);
      setEnrichment(res.data);
    } catch (err) {
      console.error(err);
    }

    // Fetch notes
    fetchNotes(ioc.id);
  };

  const fetchNotes = async (iocId) => {
    setNotesLoading(true);
    try {
      const res = await axios.get(`/api/threat-intel/${iocId}/notes`);
      setNotes(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setNotesLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const res = await axios.post(`/api/threat-intel/${selectedIoc.id}/notes`, { content: newNote });
      setNotes(prev => [...prev, res.data]);
      setNewNote('');
      showToast({ type: 'success', message: 'Analysis note added.' });
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to save note.' });
    }
  };

  const handleTriggerEnrich = async () => {
    if (!selectedIoc) return;
    try {
      showToast({ type: 'info', message: 'Querying feed providers for intelligence...' });
      const res = await axios.post(`/api/threat-intel/${selectedIoc.id}/enrich`);
      setEnrichment(res.data);
      showToast({ type: 'success', message: 'IOC metadata enriched successfully.' });
      fetchIocs(); // reload risk score changes if any
    } catch (err) {
      showToast({ type: 'error', message: 'Enrichment request failed.' });
    }
  };

  const handleToggleFeed = async (feedId) => {
    try {
      await axios.post(`/api/threat-intel/feeds/${feedId}/toggle`);
      fetchFeeds();
      showToast({ type: 'success', message: 'Feed status updated successfully.' });
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to toggle feed status.' });
    }
  };

  const handleSyncFeed = async (feedId) => {
    setSyncingFeedId(feedId);
    try {
      await axios.post(`/api/threat-intel/feeds/${feedId}/sync`);
      fetchFeeds();
      fetchIocs();
      showToast({ type: 'success', message: 'Feed synchronized successfully.' });
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to sync threat feed.' });
    } finally {
      setSyncingFeedId(null);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importText.trim()) return;
    try {
      let parsed = [];
      if (importType === 'JSON') {
        parsed = JSON.parse(importText);
      } else {
        // Simple CSV parser
        const lines = importText.split('\n');
        parsed = lines.map(line => {
          const [type, value, description, source] = line.split(',');
          if (!type || !value) return null;
          return { type: type.trim(), value: value.trim(), description: (description || '').trim(), source: (source || 'CSV Import').trim() };
        }).filter(Boolean);
      }
      
      await axios.post('/api/threat-intel/import', parsed);
      showToast({ type: 'success', message: 'IOC list imported successfully.' });
      setImportText('');
      setShowImportPanel(false);
      setPage(0);
      fetchIocs();
    } catch (err) {
      showToast({ type: 'error', message: 'Import failed. Check format syntax.' });
    }
  };

  const handleExport = (format) => {
    let dataStr = "";
    if (format === 'JSON') {
      dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(iocs, null, 2));
    } else {
      // CSV format
      const header = "Type,Value,Description,RiskScore,Source\n";
      const rows = iocs.map(i => `"${i.type}","${i.value}","${i.description}",${i.riskScore},"${i.source}"`).join('\n');
      dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(header + rows);
    }
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `threat_intel_export.${format.toLowerCase()}`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getTeamName = (teamId) => teams.find((team) => team.id === teamId)?.teamName || 'Unassigned';

  const getIocIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'IP': return <Server className="w-4 h-4 text-emerald-400" />;
      case 'DOMAIN': return <Globe className="w-4 h-4 text-indigo-400" />;
      case 'URL': return <Link2 className="w-4 h-4 text-sky-400" />;
      case 'EMAIL': return <Send className="w-4 h-4 text-amber-400" />;
      default: return <Key className="w-4 h-4 text-purple-400" />;
    }
  };

  const getRiskScoreBadge = (score) => {
    if (score >= 90) return 'border-red-500/30 bg-red-500/10 text-red-400';
    if (score >= 70) return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
    if (score >= 40) return 'border-sky-500/30 bg-sky-500/10 text-sky-400';
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
  };

  // Mock relationship visualization nodes & edges
  const mockGraph = useMemo(() => {
    const nodes = [
      { id: '1', label: 'APT29', type: 'ACTOR', color: '#ef4444' },
      { id: '2', label: 'Lazarus Group', type: 'ACTOR', color: '#ef4444' },
      { id: '3', label: 'CobaltStrike', type: 'MALWARE', color: '#a855f7' },
      { id: '4', label: 'Redline Stealer', type: 'MALWARE', color: '#a855f7' }
    ];
    iocs.slice(0, 5).forEach((ioc, i) => {
      nodes.push({ id: `ioc-${i}`, label: ioc.value, type: 'IOC', color: '#38bdf8' });
    });

    const links = [
      { source: '1', target: '3' },
      { source: '2', target: '4' },
      { source: '1', target: '4' }
    ];
    nodes.filter(n => n.type === 'IOC').forEach((n, i) => {
      links.push({ source: n.id, target: i % 2 === 0 ? '3' : '4' });
    });

    return { nodes, links };
  }, [iocs]);

  return (
    <div className="space-y-6 sc-fade-in">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="sc-panel p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="sc-badge border-red-500/20 bg-red-500/10 text-red-300">THREAT INTELLIGENCE</span>
            <span className="sc-badge border-white/10 bg-white/5 text-slate-300">Active Blocklists</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white font-mono uppercase">Threat Intelligence Hub</h1>
          <p className="text-sm text-slate-400">Enrich, block, and analyze Indicators of Compromise (IOC) and sync security intelligence feeds.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportPanel(!showImportPanel)}
            className="flex items-center gap-2 border border-dark-border bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Import
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add IOC
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation ───────────────────────────────────────────────── */}
      <div className="flex border-b border-dark-border pb-px gap-6">
        {[
          { id: 'directory', label: 'Indicators Directory', icon: Database },
          { id: 'feeds', label: 'Feed Integrations', icon: RefreshCw },
          { id: 'visualization', label: 'Threat Visualization', icon: BarChart2 }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                active ? 'border-b-2 border-primary text-primary' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content: Directory ────────────────────────────────────────── */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            {/* Search & Filter Bar */}
            <div className="sc-panel p-4">
              <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search blocklist value or description..."
                    className="sc-input pl-9 w-full"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="sc-select w-44"
                >
                  <option value="">All Types</option>
                  <option value="IP">IP Address</option>
                  <option value="DOMAIN">Domain</option>
                  <option value="URL">URL</option>
                  <option value="EMAIL">Email</option>
                  <option value="SHA256">SHA256 Hash</option>
                  <option value="CVE">CVE ID</option>
                </select>
                <button type="submit" className="sc-button-secondary py-2 px-4 cursor-pointer">
                  Search
                </button>
              </form>
            </div>

            {/* Ingestion Panel */}
            {showImportPanel && (
              <div className="sc-panel p-6 border-dashed border-primary/20 bg-slate-950/80 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Bulk Import Indicators</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setImportType('JSON')} className={`px-2 py-0.5 rounded text-[10px] ${importType === 'JSON' ? 'bg-primary text-black' : 'text-slate-400'}`}>JSON</button>
                    <button onClick={() => setImportType('CSV')} className={`px-2 py-0.5 rounded text-[10px] ${importType === 'CSV' ? 'bg-primary text-black' : 'text-slate-400'}`}>CSV</button>
                  </div>
                </div>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={importType === 'JSON' ? '[\n  { "type": "IP", "value": "1.2.3.4", "description": "Suspicious scan source" }\n]' : 'IP,1.2.3.4,Suspicious scanning source,OTXFeed'}
                  rows={4}
                  className="sc-input w-full font-mono text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowImportPanel(false)} className="sc-button-secondary py-1.5 px-3">Cancel</button>
                  <button onClick={handleImport} className="sc-button py-1.5 px-3 bg-primary text-black">Run Ingest</button>
                </div>
              </div>
            )}

            {/* Indicators Table */}
            <div className="sc-panel overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-dark-border bg-slate-900/40">
                <span className="text-xs font-semibold text-slate-300 font-mono">INDICATORS DB ({totalElements})</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleExport('JSON')} className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-200"><Download className="w-3 h-3" /> JSON</button>
                  <span className="text-slate-600">|</span>
                  <button onClick={() => handleExport('CSV')} className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-200"><Download className="w-3 h-3" /> CSV</button>
                </div>
              </div>
              
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-slate-500" />
                </div>
              ) : iocs.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <ShieldCheck className="h-10 w-10 text-emerald-400/60 mb-2" />
                  <p className="font-mono text-sm text-slate-400">No compromised indicators cataloged.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-slate-300 text-xs">
                    <thead>
                      <tr className="border-b border-dark-border text-slate-500 uppercase text-[10px] tracking-wider font-semibold">
                        <th className="p-4">Type</th>
                        <th className="p-4">Indicator Value</th>
                        <th className="p-4">Threat Risk</th>
                        <th className="p-4">Provider</th>
                        <th className="p-4">Reviewer Team</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border font-mono">
                      {iocs.map((ioc) => (
                        <tr
                          key={ioc.id}
                          onClick={() => handleSelectIoc(ioc)}
                          className={`hover:bg-white/3 transition cursor-pointer ${selectedIoc?.id === ioc.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                        >
                          <td className="p-4 font-bold flex items-center gap-2">
                            {getIocIcon(ioc.type)}
                            <span>{ioc.type}</span>
                          </td>
                          <td className="p-4 font-semibold text-white truncate max-w-[200px]" title={ioc.value}>{ioc.value}</td>
                          <td className="p-4">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${getRiskScoreBadge(ioc.riskScore)}`}>
                              {Math.round(ioc.riskScore)}/100
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">{ioc.source || 'Manual'}</td>
                          <td className="p-4 text-emerald-400">{getTeamName(ioc.reviewerTeamId)}</td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleDeleteIoc(ioc.id, e)}
                              className="p-1.5 rounded-lg border border-dark-border bg-slate-900 hover:border-red-500/30 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition cursor-pointer"
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-dark-border bg-slate-950/20 font-mono text-xs">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                    className="sc-button-secondary py-1 px-3 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-slate-400">Page {page + 1} of {totalPages}</span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                    className="sc-button-secondary py-1 px-3 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Enrichment & Notes Details Panel */}
          <div className="xl:col-span-1">
            {selectedIoc ? (
              <div className="sc-panel p-6 space-y-6 sticky top-6">
                <div className="flex justify-between items-start border-b border-dark-border pb-4">
                  <div>
                    <span className="sc-badge border-sky-500/25 bg-sky-500/10 text-sky-400 mb-1">{selectedIoc.type}</span>
                    <h2 className="text-lg font-bold text-white truncate max-w-[220px]" title={selectedIoc.value}>{selectedIoc.value}</h2>
                    <p className="text-[10px] text-slate-500 font-mono">ID: {selectedIoc.id}</p>
                  </div>
                  <button onClick={() => setSelectedIoc(null)} className="text-slate-500 hover:text-slate-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Enrichment Trigger */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-dark-border bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">External Enrichment</h4>
                      <p className="text-[10px] text-slate-400">Geo, ASN & Threat reputation</p>
                    </div>
                  </div>
                  <button
                    onClick={handleTriggerEnrich}
                    className="sc-button py-1 px-2.5 bg-primary text-black font-semibold text-[10px] uppercase cursor-pointer"
                  >
                    Refresh Intel
                  </button>
                </div>

                {/* Enrichment Data */}
                {enrichment ? (
                  <div className="space-y-4 text-xs font-mono">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 rounded-xl border border-white/8 bg-white/3">
                        <span className="text-[9px] text-slate-500 uppercase block mb-0.5">Geolocation</span>
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <MapPin className="w-3 h-3 text-red-400" />
                          <span className="font-semibold">{enrichment.country}</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl border border-white/8 bg-white/3">
                        <span className="text-[9px] text-slate-500 uppercase block mb-0.5">ISP / ASN</span>
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <Globe className="w-3 h-3 text-indigo-400" />
                          <span className="font-semibold text-slate-300">{enrichment.asn}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 p-3 rounded-xl border border-dark-border bg-slate-900/20">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Threat Family:</span>
                        <span className="text-red-400 font-bold">{enrichment.malwareFamily}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Threat Category:</span>
                        <span className="text-slate-200">{enrichment.threatCategory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Confidence Score:</span>
                        <span className="text-emerald-400 font-bold">{enrichment.confidenceScore}%</span>
                      </div>
                    </div>

                    {/* MITRE ATT&CK Matrix */}
                    {enrichment.mitreAttacks?.length > 0 && (
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block mb-1">MITRE ATT&CK Mapping</span>
                        <div className="flex flex-wrap gap-1.5">
                          {enrichment.mitreAttacks.map((att, i) => (
                            <span key={i} className="sc-badge border-purple-500/20 bg-purple-500/10 text-purple-300 text-[10px]">
                              {att}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-dark-border rounded-xl">
                    <p className="text-xs text-slate-500 font-mono">No enrichment fetched. Click "Refresh Intel" above.</p>
                  </div>
                )}

                {/* Notes Feed */}
                <div className="border-t border-dark-border pt-4 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Analyst Discussion</h3>
                  
                  <div className="max-h-[160px] overflow-y-auto space-y-2.5 pr-1">
                    {notesLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-500 mx-auto" />
                    ) : notes.length === 0 ? (
                      <p className="text-[10px] text-slate-600 font-mono text-center">No discussion logs yet.</p>
                    ) : (
                      notes.map((note) => (
                        <div key={note.id} className="p-2.5 rounded-xl border border-dark-border bg-slate-950/50 text-[11px] space-y-1">
                          <div className="flex justify-between text-[9px] font-mono text-slate-500">
                            <span className="font-semibold text-primary">{note.authorName}</span>
                            <span>{new Date(note.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-slate-300 font-mono">{note.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddNote} className="flex gap-1.5 pt-1.5">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Type note / audit detail..."
                      className="sc-input text-xs flex-1"
                    />
                    <button type="submit" className="sc-button bg-primary text-black text-xs font-bold p-2.5">
                      Add
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="sc-panel p-6 flex flex-col items-center justify-center text-center h-[400px] border-dashed">
                <Database className="w-12 h-12 text-slate-600 mb-2" />
                <h3 className="text-sm font-semibold text-slate-400 uppercase font-mono">Select Indicator</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Click any row in the directory list to examine real-time enrichment profiles and analyst notes.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab Content: Feeds ────────────────────────────────────────────── */}
      {activeTab === 'feeds' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {feeds.map((feed) => (
            <div key={feed.id} className="sc-panel p-6 flex flex-col justify-between h-52">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-white">{feed.name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">{feed.url}</p>
                  </div>
                  <span className={`sc-badge text-[9px] uppercase font-bold ${
                    feed.enabled ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/5 text-slate-400'
                  }`}>
                    {feed.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[10px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Sync Interval:</span>
                    <span>{feed.syncIntervalMinutes}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Synced:</span>
                    <span>{feed.lastSync ? new Date(feed.lastSync).toLocaleString() : 'Never'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t border-white/5 pt-4">
                <button
                  onClick={() => handleToggleFeed(feed.id)}
                  className={`flex-1 sc-button-secondary py-2 text-xs font-semibold uppercase tracking-wider cursor-pointer`}
                >
                  {feed.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  disabled={!feed.enabled || syncingFeedId === feed.id}
                  onClick={() => handleSyncFeed(feed.id)}
                  className="sc-button bg-primary text-black font-semibold text-xs px-4 py-2 flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  {syncingFeedId === feed.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Sync
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab Content: Visualizations ───────────────────────────────────── */}
      {activeTab === 'visualization' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <div className="sc-panel p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">Compromised Indicators Daily Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { day: 'Mon', active: 10, scans: 25 },
                  { day: 'Tue', active: 12, scans: 31 },
                  { day: 'Wed', active: 11, scans: 28 },
                  { day: 'Thu', active: 18, scans: 45 },
                  { day: 'Fri', active: iocs.length, scans: iocs.length * 3 },
                  { day: 'Sat', active: iocs.length + 1, scans: 12 },
                  { day: 'Sun', active: iocs.length + 2, scans: 15 }
                ]}>
                  <defs>
                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={10} fontClassName="font-mono" />
                  <YAxis stroke="#64748b" fontSize={10} fontClassName="font-mono" />
                  <Tooltip contentStyle={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Area type="monotone" dataKey="scans" stroke="#38bdf8" fillOpacity={1} fill="url(#colorScans)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* MITRE Matrix mapping */}
          <div className="sc-panel p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">MITRE ATT&CK Matrix Mapping</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { code: 'T1566', name: 'Phishing', category: 'Initial Access', count: 2, color: 'text-red-400 border-red-500/20 bg-red-500/5' },
                { code: 'T1110', name: 'Brute Force', category: 'Credential Access', count: 3, color: 'text-orange-400 border-orange-500/20 bg-orange-500/5' },
                { code: 'T1078', name: 'Valid Accounts', category: 'Defense Evasion', count: 2, color: 'text-sky-400 border-sky-500/20 bg-sky-500/5' },
                { code: 'T1204', name: 'User Execution', category: 'Execution', count: 1, color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
                { code: 'T1071', name: 'C2 Protocols', category: 'Command & Control', count: 4, color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
                { code: 'T1048', name: 'Exfiltration', category: 'Exfiltration', count: 1, color: 'text-pink-400 border-pink-500/20 bg-pink-500/5' }
              ].map((mitre) => (
                <div key={mitre.code} className={`p-3 rounded-xl border ${mitre.color} space-y-1`}>
                  <div className="flex justify-between font-mono">
                    <span className="text-[10px] font-bold">{mitre.code}</span>
                    <span className="text-[9px] font-semibold font-mono rounded-full px-1.5 bg-white/10">{mitre.count}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{mitre.name}</h4>
                  <p className="text-[8px] text-slate-500 uppercase font-mono">{mitre.category}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Node Graph */}
          <div className="sc-panel p-6 xl:col-span-2 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">Threat Actors & Malware Relationship Graph</h3>
            
            <div className="relative border border-dark-border rounded-2xl bg-slate-950/60 overflow-hidden h-72 flex items-center justify-center">
              <svg width="100%" height="100%" className="absolute inset-0">
                {/* Draw connections */}
                <line x1="150" y1="80" x2="250" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
                <line x1="500" y1="80" x2="400" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
                <line x1="150" y1="80" x2="400" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
                <line x1="250" y1="150" x2="200" y2="240" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                <line x1="250" y1="150" x2="300" y2="240" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                <line x1="400" y1="150" x2="450" y2="240" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                
                {/* Draw Actor Nodes */}
                <circle cx="150" cy="80" r="22" fill="#ef4444" fillOpacity={0.2} stroke="#ef4444" strokeWidth={2} />
                <text x="150" y="84" textAnchor="middle" fill="white" fontSize={9} fontWeight="bold" fontFamily="monospace">APT29</text>
                
                <circle cx="500" cy="80" r="22" fill="#ef4444" fillOpacity={0.2} stroke="#ef4444" strokeWidth={2} />
                <text x="500" y="84" textAnchor="middle" fill="white" fontSize={9} fontWeight="bold" fontFamily="monospace">LAZARUS</text>
                
                {/* Draw Malware Nodes */}
                <circle cx="250" cy="150" r="20" fill="#a855f7" fillOpacity={0.2} stroke="#a855f7" strokeWidth={2} />
                <text x="250" y="154" textAnchor="middle" fill="white" fontSize={8} fontWeight="bold" fontFamily="monospace">CobaltS.</text>
                
                <circle cx="400" cy="150" r="20" fill="#a855f7" fillOpacity={0.2} stroke="#a855f7" strokeWidth={2} />
                <text x="400" y="154" textAnchor="middle" fill="white" fontSize={8} fontWeight="bold" fontFamily="monospace">Redline</text>
                
                {/* Draw IOC child nodes */}
                <circle cx="200" cy="240" r="14" fill="#38bdf8" fillOpacity={0.2} stroke="#38bdf8" strokeWidth={1.5} />
                <text x="200" y="243" textAnchor="middle" fill="#38bdf8" fontSize={7} fontWeight="bold" fontFamily="monospace">IP</text>
                
                <circle cx="300" cy="240" r="14" fill="#38bdf8" fillOpacity={0.2} stroke="#38bdf8" strokeWidth={1.5} />
                <text x="300" y="243" textAnchor="middle" fill="#38bdf8" fontSize={7} fontWeight="bold" fontFamily="monospace">DOM</text>
                
                <circle cx="450" cy="240" r="14" fill="#38bdf8" fillOpacity={0.2} stroke="#38bdf8" strokeWidth={1.5} />
                <text x="450" y="243" textAnchor="middle" fill="#38bdf8" fontSize={7} fontWeight="bold" fontFamily="monospace">URL</text>
              </svg>

              <div className="absolute bottom-4 left-4 flex gap-4 font-mono text-[9px] bg-slate-900/90 border border-white/5 p-2 rounded-lg">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Threat Actor</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div> Malware Family</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-sky-500"></div> Active IOC</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add IOC Modal ────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card sc-scale-in max-w-lg w-full border border-dark-border p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-dark-border pb-3">
              <h2 className="text-base font-bold uppercase tracking-wider text-white">Add Threat Indicator</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/8 text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400">Indicator Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="sc-select w-full"
                  >
                    <option value="IP">IP Address</option>
                    <option value="DOMAIN">Domain</option>
                    <option value="URL">URL</option>
                    <option value="EMAIL">Email</option>
                    <option value="SHA256">SHA256 Hash</option>
                    <option value="CVE">CVE ID</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400">Threat Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="sc-select w-full"
                  >
                    <option value="Manual">Manual</option>
                    <option value="VirusTotal">VirusTotal Feed</option>
                    <option value="AlienVault OTX">AlienVault OTX</option>
                    <option value="PhishTank">PhishTank Feed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400">Indicator Value</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={formData.type === 'IP' ? '185.220.101.5' : formData.type === 'DOMAIN' ? 'spoof-bank-sso.org' : 'Value...'}
                  className="sc-input w-full font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400">Intel Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Associated threat campaign details..."
                  className="sc-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-400">Assigned Reviewer Team</label>
                  <select
                    value={formData.reviewerTeamId}
                    onChange={(e) => setFormData({ ...formData, reviewerTeamId: e.target.value })}
                    className="sc-select w-full"
                  >
                    <option value="">Unassigned</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.teamName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Tor, Phishing, Ransomware"
                    className="sc-input w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t border-dark-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="sc-button-secondary py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sc-button bg-primary text-black font-semibold py-2 px-4"
                >
                  Add Indicator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
