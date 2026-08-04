import React, { useState, useMemo } from 'react';
import {
  BookOpen, Search, Plus, Tag, Clock, FileText, User, Edit3, Trash2,
  CheckCircle2, AlertTriangle, Eye, Layers, ExternalLink, ChevronRight,
  History, Sparkles, X, Folder, Code, Terminal, Shield, Save,
} from 'lucide-react';
import { useToast } from '../components/Toast';

// ─── Article categories ───────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'ALL',              label: 'All Articles',       badge: 'border-white/10 bg-white/5 text-slate-300' },
  { id: 'RUNBOOK',          label: 'SOP Runbooks',       badge: 'border-sky-500/30 bg-sky-500/10 text-sky-300' },
  { id: 'POST_MORTEM',      label: 'Post-Mortems',       badge: 'border-red-500/30 bg-red-500/10 text-red-300' },
  { id: 'DETECTION_RULE',   label: 'Detection Rules',    badge: 'border-purple-500/30 bg-purple-500/10 text-purple-300' },
  { id: 'ARCHITECTURE',     label: 'System Guides',      badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' },
  { id: 'COMPLIANCE_GUIDE', label: 'Compliance Specs',   badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
];

// ─── Mock KB Articles ─────────────────────────────────────────────────────────
const MOCK_ARTICLES = [
  {
    id: 'kb-101',
    title: 'Ransomware Containment & Host Isolation SOP',
    category: 'RUNBOOK',
    author: 'Subhasish Nath',
    version: 'v2.1',
    updatedAt: '2026-07-24T14:20:00Z',
    views: 142,
    tags: ['ransomware', 'containment', 'isolation', 'p1'],
    summary: 'Standard operating procedure for isolating endpoint hosts during an active ransomware or lateral movement event.',
    content: `# Ransomware Containment & Host Isolation SOP

## 1. Trigger Conditions
- High-confidence ransomware indicator from Endpoint Detection (EDR).
- Mass file modification / shadow copy deletion detected via Syslog.

## 2. Immediate Isolation Steps
1. Navigate to **Assets Inventory** in SentinelCore.
2. Locate host IP address and switch status to \`OFFLINE\`.
3. Trigger **Playbook #PB-CONTAIN-01** (Host Quarantine).
4. Verify firewall rule block via **Log Explorer**.

## 3. Evidence Preservation
- Capture volatile RAM dump using \`winpmem\` or vendor agent.
- Extract Master File Table ($MFT) and Security Event Log.

## 4. Remediation Checklist
- [x] Revoke Active Directory user tokens
- [x] Rotate local administrator passwords
- [x] Initiate full offline vulnerability scan`,
    revisions: [
      { version: 'v2.1', date: '2026-07-24', author: 'Subhasish Nath', note: 'Added winpmem memory capture step' },
      { version: 'v2.0', date: '2026-06-10', author: 'Arpit Singh', note: 'Updated with EDR quarantine integration' },
      { version: 'v1.0', date: '2026-04-15', author: 'Sudip C.', note: 'Initial SOP creation' },
    ],
  },
  {
    id: 'kb-102',
    title: 'Q2 2026 Critical Database Exfiltration Incident Post-Mortem',
    category: 'POST_MORTEM',
    author: 'Arpit Singh',
    version: 'v1.0',
    updatedAt: '2026-07-18T09:45:00Z',
    views: 98,
    tags: ['post-mortem', 'sql-injection', 'database', 'p1'],
    summary: 'Detailed root-cause analysis, timeline, and preventive actions following the SQL injection attempt on customer DB staging.',
    content: `# Q2 2026 Database Incident Post-Mortem

## Executive Summary
On July 12, 2026, an unauthorized SQL injection query was executed against the staging web application database interface.

## Incident Timeline
- **14:02 UTC**: Anomalous payload detected in web application access logs.
- **14:05 UTC**: WAF automatically blocked IP \`198.51.100.42\`.
- **14:15 UTC**: SOC Analyst assigned P1 incident #INC-2026-88.
- **14:40 UTC**: Remediation patch applied to input validation layer.

## Key Learnings & Preventative Actions
- Implement parameterized prepared statements in DB DAO layers.
- Upgrade WAF inspection rules to detect obfuscated hex payloads.`,
    revisions: [
      { version: 'v1.0', date: '2026-07-18', author: 'Arpit Singh', note: 'Final approved post-mortem' },
    ],
  },
  {
    id: 'kb-103',
    title: 'Detecting DNS Tunneling & Exfiltration (Rule SIG-DNS-09)',
    category: 'DETECTION_RULE',
    author: 'Priyanshu Ojha',
    version: 'v1.2',
    updatedAt: '2026-07-20T11:10:00Z',
    views: 65,
    tags: ['dns-tunneling', 'detection-rule', 'suricata', 'zeek'],
    summary: 'Technical overview and tuning guide for detecting high-entropy DNS query patterns indicating data exfiltration.',
    content: `# Detection Rule: DNS Tunneling (SIG-DNS-09)

## Overview
Detects abnormally long subdomains (high Shannon entropy) queried at rapid frequencies.

## Logic / Signature
\`\`\`yaml
rule:
  name: High Entropy DNS Subdomain Query
  threshold:
    length: > 50 chars
    entropy: > 4.2
    rate: 20 queries / 10 sec
  action: Alert + Auto-Escalate to P2 Incident
\`\`\`

## Tuning Guidance
Exclude internal dev domains matching \`*.staging.internal\` to eliminate false positives.`,
    revisions: [
      { version: 'v1.2', date: '2026-07-20', author: 'Priyanshu Ojha', note: 'Added staging domain exclusion' },
      { version: 'v1.0', date: '2026-05-02', author: 'Priyanshu Ojha', note: 'Initial rule specification' },
    ],
  },
  {
    id: 'kb-104',
    title: 'SOC 2 Type II Control Mapping & Evidence Retention Guide',
    category: 'COMPLIANCE_GUIDE',
    author: 'Sudip Chakrabarty',
    version: 'v3.0',
    updatedAt: '2026-07-22T16:00:00Z',
    views: 210,
    tags: ['soc2', 'compliance', 'audit', 'cc6', 'cc7'],
    summary: 'Cross-walk mapping SentinelCore security controls against AICPA SOC 2 trust service criteria.',
    content: `# SOC 2 Type II Control Mapping Guide

## Scope
Covers Trust Services Criteria: Security (CC6), Change Management (CC7), and Risk Mitigation (CC8).

## Evidence Collection Protocol
1. Export monthly audit trail log from **Audit Logs** module.
2. Upload vulnerability scan PDF reports to **Compliance Manager**.
3. Perform bi-weekly access matrix review for all ADMIN accounts.`,
    revisions: [
      { version: 'v3.0', date: '2026-07-22', author: 'Sudip C.', note: 'Updated for Q3 audit preparation' },
    ],
  },
];

// ─── Category Badge Helper ─────────────────────────────────────────────────────
function CategoryBadge({ categoryId }) {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  return <span className={`sc-badge ${cat?.badge || 'border-white/10 bg-white/5 text-slate-300'}`}>{cat?.label || categoryId}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function KnowledgeBase() {
  const { showToast } = useToast();

  const [articles, setArticles]     = useState(MOCK_ARTICLES);
  const [selectedCategory, setCat]  = useState('ALL');
  const [search, setSearch]         = useState('');
  const [selectedTag, setTag]       = useState('');
  const [activeArticle, setActive]  = useState(null);
  
  // Editor / Create state
  const [showEditor, setShowEditor] = useState(false);
  const [editorData, setEditorData] = useState({
    title: '', category: 'RUNBOOK', summary: '', content: '', tags: '',
  });
  const [showRevisions, setShowRevisions] = useState(false);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set();
    articles.forEach((a) => a.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [articles]);

  // Filtered article list
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchCat    = selectedCategory === 'ALL' || a.category === selectedCategory;
      const matchTag    = !selectedTag || a.tags?.includes(selectedTag);
      const matchSearch = !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.summary.toLowerCase().includes(search.toLowerCase()) ||
        a.author.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchTag && matchSearch;
    });
  }, [articles, selectedCategory, selectedTag, search]);

  // Handlers
  const handleOpenCreate = () => {
    setEditorData({ title: '', category: 'RUNBOOK', summary: '', content: '', tags: '' });
    setShowEditor(true);
  };

  const handleSaveArticle = (e) => {
    e.preventDefault();
    if (!editorData.title.trim() || !editorData.content.trim()) {
      showToast({ type: 'error', message: 'Article title and body content are required.' });
      return;
    }

    const tagList = editorData.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    const newArt = {
      id: `kb-${Date.now()}`,
      title: editorData.title,
      category: editorData.category,
      author: 'You (Current User)',
      version: 'v1.0',
      updatedAt: new Date().toISOString(),
      views: 0,
      tags: tagList,
      summary: editorData.summary || editorData.content.slice(0, 120) + '...',
      content: editorData.content,
      revisions: [{ version: 'v1.0', date: new Date().toISOString().split('T')[0], author: 'You', note: 'Initial creation' }],
    };

    setArticles([newArt, ...articles]);
    setShowEditor(false);
    setActive(newArt);
    showToast({ type: 'success', message: `Knowledge Base article "${newArt.title}" published!` });
  };

  return (
    <div className="space-y-6 sc-fade-in">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="sc-panel p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="sc-badge border-purple-500/20 bg-purple-500/10 text-purple-300">Knowledge Base</span>
              <span className="sc-badge border-white/10 bg-white/5 text-slate-400">Module 16</span>
              <span className="sc-badge border-white/10 bg-white/5 text-slate-400">{articles.length} Articles</span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">Security Knowledge Base & Runbooks</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Central repository for Incident SOPs, post-incident reviews, detection rule specs, and compliance specs.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="sc-button-primary px-4 py-2.5 text-sm font-semibold self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create Article</span>
          </button>
        </div>
      </div>

      {/* ── Search & Category Toolbar ────────────────────────────────────── */}
      <div className="sc-panel p-5 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SOPs, post-mortems, tags, authors..."
              className="w-full rounded-xl border border-white/8 bg-white/5 py-2.5 pl-10 pr-9 text-xs text-white placeholder-slate-500 focus:border-sky-500/40 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Active filter counters */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Showing {filteredArticles.length} of {articles.length}</span>
            {selectedTag && (
              <span className="sc-badge border-sky-500/30 bg-sky-500/10 text-sky-300">
                Tag: #{selectedTag}
                <button onClick={() => setTag('')} className="ml-1 hover:text-white"><X className="h-3 w-3 inline" /></button>
              </span>
            )}
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCat(cat.id)}
              className={`rounded-2xl border px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedCategory === cat.id
                  ? `${cat.badge} ring-1 ring-white/20`
                  : 'border-white/8 bg-white/3 text-slate-400 hover:bg-white/6 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Popular Tags strip */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/6 flex-wrap text-xs font-mono">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider">Popular Tags:</span>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setTag(selectedTag === t ? '' : t)}
                className={`rounded-lg border px-2 py-0.5 text-[10px] transition ${
                  selectedTag === t
                    ? 'border-sky-500/40 bg-sky-500/20 text-sky-300 font-bold'
                    : 'border-white/6 bg-white/3 text-slate-400 hover:text-white'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main Layout: Article Grid / Reader ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Article Cards List (1 col if reading, 3 cols if no active selection) */}
        <div className={`space-y-4 ${activeArticle ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
          <div className={`grid gap-4 ${activeArticle ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {filteredArticles.length === 0 ? (
              <div className="col-span-full sc-panel flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="mb-3 h-10 w-10 text-slate-600" />
                <p className="text-sm font-semibold text-white">No knowledge base articles found</p>
                <p className="mt-1 text-xs text-slate-500 font-mono">Try clearing search terms or selecting a different category.</p>
              </div>
            ) : (
              filteredArticles.map((art) => {
                const isActive = activeArticle?.id === art.id;
                return (
                  <div
                    key={art.id}
                    onClick={() => setActive(art)}
                    className={`sc-card p-5 cursor-pointer transition flex flex-col justify-between ${
                      isActive ? 'border-sky-500/40 bg-sky-500/8 ring-1 ring-sky-500/20' : 'hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <CategoryBadge categoryId={art.category} />
                        <span className="font-mono text-[10px] text-slate-500">{art.version}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-2 line-clamp-2">{art.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-3 mb-4">{art.summary}</p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-white/6">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {art.tags?.map((t) => (
                          <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                            #{t}
                          </span>
                        ))}
                      </div>
                      {/* Meta info */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {art.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(art.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Reader / Inspection Panel */}
        {activeArticle && (
          <div className="lg:col-span-2 space-y-4 sc-fade-in">
            <div className="sc-panel p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge categoryId={activeArticle.category} />
                    <span className="sc-badge border-white/10 bg-white/5 text-slate-300 font-mono">{activeArticle.version}</span>
                    <span className="text-xs font-mono text-slate-500">
                      Updated {new Date(activeArticle.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white">{activeArticle.title}</h2>
                  <p className="text-xs font-mono text-slate-400">Author: <span className="text-slate-200">{activeArticle.author}</span> · {activeArticle.views} views</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRevisions((v) => !v)}
                    className="sc-button-secondary p-2 text-slate-400 hover:text-white"
                    title="Revision History"
                  >
                    <History className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActive(null)}
                    className="sc-button-secondary p-2 text-slate-400 hover:text-white"
                    title="Close Reader"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Revision History Drawer */}
              {showRevisions && (
                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/8 p-4 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-sky-300 font-bold">
                    <span className="flex items-center gap-1.5"><History className="h-4 w-4" /> Revision History</span>
                    <button onClick={() => setShowRevisions(false)} className="text-slate-400 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="space-y-2">
                    {activeArticle.revisions?.map((rev, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-white/6 bg-white/3 p-2.5">
                        <div>
                          <span className="font-bold text-white mr-2">{rev.version}</span>
                          <span className="text-slate-400">{rev.note}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {rev.author} · {rev.date}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Markdown Rendered Content */}
              <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed font-sans space-y-4">
                <div className="rounded-xl border border-white/6 bg-white/3 p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                  {activeArticle.content}
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between border-t border-white/8 pt-4">
                <div className="flex flex-wrap gap-1.5">
                  {activeArticle.tags?.map((t) => (
                    <span key={t} className="rounded-lg border border-white/8 bg-white/3 px-2 py-1 text-[10px] font-mono text-slate-400">
                      #{t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => showToast({ type: 'info', message: 'Article copied to clipboard' })}
                  className="sc-button-secondary px-3 py-1.5 text-xs font-semibold"
                >
                  Share Article
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Create / Edit Article Modal ─────────────────────────────────── */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl sc-panel p-6 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-white/8 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sky-400" />
                <h3 className="text-lg font-bold text-white">Create KB Article / SOP</h3>
              </div>
              <button onClick={() => setShowEditor(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4">
              <div>
                <label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-slate-400">Article Title</label>
                <input
                  type="text"
                  value={editorData.title}
                  onChange={(e) => setEditorData({ ...editorData, title: e.target.value })}
                  placeholder="e.g. Incident Response SOP for Phishing Campaign"
                  className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-sky-500/40 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-slate-400">Category</label>
                  <select
                    value={editorData.category}
                    onChange={(e) => setEditorData({ ...editorData, category: e.target.value })}
                    className="w-full rounded-xl border border-white/8 bg-[#0b1220] px-3 py-2 text-xs text-white focus:border-sky-500/40 focus:outline-none cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'ALL').map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-slate-400">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editorData.tags}
                    onChange={(e) => setEditorData({ ...editorData, tags: e.target.value })}
                    placeholder="phishing, sop, email, p2"
                    className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-sky-500/40 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-slate-400">Executive Summary</label>
                <input
                  type="text"
                  value={editorData.summary}
                  onChange={(e) => setEditorData({ ...editorData, summary: e.target.value })}
                  placeholder="Brief 1-2 sentence overview of the runbook or post-mortem..."
                  className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-sky-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-slate-400">Markdown Content</label>
                <textarea
                  rows={8}
                  value={editorData.content}
                  onChange={(e) => setEditorData({ ...editorData, content: e.target.value })}
                  placeholder="# Article Heading&#10;&#10;## 1. Overview&#10;Describe procedure..."
                  className="w-full rounded-xl border border-white/8 bg-[#060c18] p-3 font-mono text-xs text-white placeholder-slate-600 focus:border-sky-500/40 focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="sc-button-secondary flex-1 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sc-button-primary flex-1 py-2.5 text-xs font-semibold"
                >
                  <Save className="h-4 w-4" /> Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
