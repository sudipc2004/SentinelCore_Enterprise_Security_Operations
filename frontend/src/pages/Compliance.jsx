import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ShieldCheck, ShieldAlert, Upload, ChevronDown, ChevronUp, CheckCircle2,
  XCircle, FileText, AlertTriangle, BarChart2, Layers, Lock,
  Server, Globe, Users, RefreshCw, Edit3, Save, Download, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pctColor(p) {
  return p >= 90 ? '#22c55e' : p >= 70 ? '#f59e0b' : p >= 40 ? '#f97316' : '#ef4444';
}

function StatusBadge({ pct }) {
  const label = pct >= 90 ? 'COMPLIANT' : pct >= 70 ? 'IN REVIEW' : pct >= 40 ? 'PARTIAL' : 'NON-COMPLIANT';
  const cls   = pct >= 90
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
    : pct >= 70 ? 'border-amber-500/25 bg-amber-500/10 text-amber-300'
    : pct >= 40 ? 'border-orange-500/25 bg-orange-500/10 text-orange-300'
    : 'border-red-500/25 bg-red-500/10 text-red-300';
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-[0.14em] ${cls}`}>{label}</span>;
}

function ProgressBar({ pct, thin = false }) {
  const color = pctColor(pct);
  return (
    <div className={`w-full rounded-full bg-white/6 ${thin ? 'h-1.5' : 'h-2.5'}`}>
      <div
        className="rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', background: color, boxShadow: `0 0 8px ${color}50` }}
      />
    </div>
  );
}

const ICON_MAP = {
  Layers, Globe, AlertTriangle, BarChart2, Lock, Server, RefreshCw, ShieldCheck, Users, FileText
};

function getIcon(name) {
  const Icon = ICON_MAP[name] || ShieldCheck;
  return <Icon className="h-4 w-4" />;
}

// ─── Evidence Upload ──────────────────────────────────────────────────────────
function EvidenceUpload({ frameworkId, domainId, onUploadSuccess }) {
  const { showToast } = useToast();
  const [file, setFile] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const payload = { fileName: file.name, note };
      const res = await axios.post(`/api/compliance/${frameworkId}/domains/${domainId}/evidence`, payload);
      onUploadSuccess(domainId, res.data);
      setFile(null);
      setNote('');
      showToast({ type: 'success', message: `Evidence "${file.name}" attached successfully` });
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Failed to attach evidence' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 rounded-2xl border border-white/8 bg-white/3 p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Attach Evidence / Document</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-[10px] font-mono text-slate-500">File (.pdf, .png, .docx, .csv…)</label>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.docx,.xlsx,.csv,.txt"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full cursor-pointer text-xs text-slate-400 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white/8 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-300 hover:file:bg-white/12"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-[10px] font-mono text-slate-500">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Penetration test report Q3-2026"
            className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-sky-500/40 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!file || busy}
          className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy
            ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-300/30 border-t-sky-300" />
            : <Upload className="h-3.5 w-3.5" />}
          {busy ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </form>
  );
}

// ─── Domain Row ───────────────────────────────────────────────────────────────
function DomainRow({ frameworkId, domain, canEdit, onDomainUpdate, onUploadSuccess }) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [controls, setControls]   = useState(domain.controls);
  const [compliant, setCompliant] = useState(domain.compliant);
  const [inReview, setInReview]   = useState(domain.inReview);
  const [openGaps, setOpenGaps]   = useState(domain.open);

  const pct = domain.controls > 0 ? Math.round((domain.compliant / domain.controls) * 100) : 100;
  const uploads = domain.evidence || [];

  const handleSaveDomain = async (e) => {
    e.preventDefault();
    if (compliant + inReview + openGaps > controls) {
      showToast({ type: 'error', message: 'Compliant + In Review + Open Gaps cannot exceed Total Controls' });
      return;
    }
    setSaving(true);
    try {
      const payload = { controls, compliant, inReview, open: openGaps };
      await axios.put(`/api/compliance/${frameworkId}/domains/${domain.id}`, payload);
      onDomainUpdate(frameworkId, domain.id, payload);
      setEditing(false);
      showToast({ type: 'success', message: `Domain "${domain.name}" controls updated` });
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Failed to update domain controls' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/8 bg-[#0b1220]/60 transition hover:border-white/12">
      <div className="flex w-full items-center gap-4 p-4">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex flex-1 items-center gap-4 text-left">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-slate-400">
            {getIcon(domain.icon)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-white">{domain.name}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-xs text-slate-400">{domain.compliant}/{domain.controls}</span>
                <StatusBadge pct={pct} />
              </div>
            </div>
            <div className="mt-2"><ProgressBar pct={pct} /></div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => { setEditing((v) => !v); setOpen(true); }}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white transition"
              title="Edit domain controls"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          )}
          <button type="button" onClick={() => setOpen((v) => !v)} className="p-1 text-slate-500">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/8 px-4 pb-4 pt-4">
          {/* Edit form */}
          {editing ? (
            <form onSubmit={handleSaveDomain} className="mb-4 rounded-xl border border-sky-500/30 bg-sky-500/5 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-sky-300">Edit Domain Controls — {domain.name}</p>
                <button type="button" onClick={() => setEditing(false)} className="text-slate-500 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[10px] font-mono text-slate-400">Total Controls</label>
                  <input
                    type="number" min="0"
                    value={controls}
                    onChange={(e) => setControls(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-mono text-emerald-400">Compliant</label>
                  <input
                    type="number" min="0"
                    value={compliant}
                    onChange={(e) => setCompliant(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-mono text-amber-400">In Review</label>
                  <input
                    type="number" min="0"
                    value={inReview}
                    onChange={(e) => setInReview(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-mono text-red-400">Open Gaps</label>
                  <input
                    type="number" min="0"
                    value={openGaps}
                    onChange={(e) => setOpenGaps(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-white/10 bg-[#0b1220] px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-white/10 px-3 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-300 hover:bg-sky-500/30 disabled:opacity-40"
                >
                  {saving ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-sky-300/30 border-t-sky-300" /> : <Save className="h-3 w-3" />}
                  Save Controls
                </button>
              </div>
            </form>
          ) : (
            /* Control breakdown */
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3 text-center">
                <p className="text-xl font-bold text-emerald-400">{domain.compliant}</p>
                <p className="mt-0.5 text-[10px] font-mono text-emerald-600">Compliant</p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-3 text-center">
                <p className="text-xl font-bold text-amber-400">{domain.inReview}</p>
                <p className="mt-0.5 text-[10px] font-mono text-amber-600">In Review</p>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/8 p-3 text-center">
                <p className="text-xl font-bold text-red-400">{domain.open}</p>
                <p className="mt-0.5 text-[10px] font-mono text-red-600">Open Gaps</p>
              </div>
            </div>
          )}

          {/* Uploaded evidence list */}
          {uploads.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Attached Evidence ({uploads.length})</p>
              {uploads.map((u, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/3 px-3 py-2">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                  <span className="flex-1 truncate font-mono text-xs text-slate-300">{u.fileName}</span>
                  {u.note && <span className="truncate text-[10px] italic text-slate-500">{u.note}</span>}
                  {u.uploadedBy && <span className="text-[10px] text-slate-600">{u.uploadedBy}</span>}
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                </div>
              ))}
            </div>
          )}

          <EvidenceUpload frameworkId={frameworkId} domainId={domain.id} onUploadSuccess={onUploadSuccess} />
        </div>
      )}
    </div>
  );
}

// ─── Compliance Score Gauge ───────────────────────────────────────────────────
function ComplianceGauge({ pct }) {
  const r     = 46;
  const circ  = 2 * Math.PI * r;
  const fill  = (pct / 100) * circ;
  const color = pctColor(pct);
  return (
    <div className="relative">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dasharray 1s ease, stroke 0.4s ease', filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold" style={{ color }}>{pct}%</span>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
          {pct >= 90 ? 'Compliant' : pct >= 70 ? 'In Review' : 'Partial'}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Compliance() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [frameworks, setFrameworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [frameworkId, setFid] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');

  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'ANALYST';

  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await axios.get('/api/compliance');
      setFrameworks(res.data);
      if (res.data.length > 0 && !frameworkId) {
        setFid(res.data[0].frameworkId);
      }
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to fetch compliance frameworks' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [frameworkId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const framework = frameworks.find((f) => f.frameworkId === frameworkId);

  const overallPct = useMemo(() => {
    if (!framework) return 100;
    const tot  = framework.domains.reduce((s, d) => s + d.controls,  0);
    const comp = framework.domains.reduce((s, d) => s + d.compliant, 0);
    return tot > 0 ? Math.round((comp / tot) * 100) : 100;
  }, [framework]);

  const totalGaps = useMemo(() => {
    if (!framework) return 0;
    return framework.domains.reduce((s, d) => s + d.open, 0);
  }, [framework]);

  const filteredDomains = useMemo(() => {
    if (!framework) return [];
    if (domainFilter === 'GAPS') return framework.domains.filter((d) => d.open > 0);
    if (domainFilter === 'FULL') return framework.domains.filter((d) => d.compliant === d.controls);
    return framework.domains;
  }, [framework, domainFilter]);

  const handleUploadSuccess = (domainId, evidence) => {
    setFrameworks((prev) =>
      prev.map((fw) => {
        if (fw.frameworkId !== frameworkId) return fw;
        return {
          ...fw,
          domains: fw.domains.map((d) => {
            if (d.id !== domainId) return d;
            return {
              ...d,
              evidence: [...(d.evidence || []), evidence],
            };
          }),
        };
      })
    );
  };

  const handleDomainUpdate = (fwId, domainId, payload) => {
    setFrameworks((prev) =>
      prev.map((fw) => {
        if (fw.frameworkId !== fwId) return fw;
        return {
          ...fw,
          domains: fw.domains.map((d) => {
            if (d.id !== domainId) return d;
            return {
              ...d,
              controls: payload.controls,
              compliant: payload.compliant,
              inReview: payload.inReview,
              open: payload.open,
            };
          }),
        };
      })
    );
  };

  const handleExportReport = () => {
    if (!framework) return;
    const reportData = {
      framework: framework.label,
      description: framework.description,
      generatedAt: new Date().toISOString(),
      overallScorePercent: overallPct,
      totalControls: framework.domains.reduce((s, d) => s + d.controls, 0),
      compliantControls: framework.domains.reduce((s, d) => s + d.compliant, 0),
      openGaps: totalGaps,
      domains: framework.domains,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Compliance_Attestation_${framework.frameworkId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ type: 'success', message: 'Attestation report downloaded' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!framework) return null;

  return (
    <div className="space-y-6 sc-fade-in">
      {/* Page header */}
      <div className="sc-panel p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="sc-badge border-sky-500/20 bg-sky-500/10 text-sky-300">Compliance</span>
            <span className="sc-badge border-white/10 bg-white/5 text-slate-400">Module 11</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">Compliance Manager</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Track regulatory framework adherence, manage control domains, and attach supporting evidence for audit readiness.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-white/20 hover:text-white transition disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExportReport}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
          >
            <Download className="h-3.5 w-3.5" />
            Export Attestation
          </button>
        </div>
      </div>

      {/* Framework selector */}
      <div className="sc-panel p-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Select Framework</p>
        <div className="flex flex-wrap gap-2">
          {frameworks.map((fw) => (
            <button
              key={fw.frameworkId}
              onClick={() => setFid(fw.frameworkId)}
              className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                frameworkId === fw.frameworkId
                  ? `${fw.badge} ring-1 ring-white/20`
                  : 'border-white/8 bg-white/3 text-slate-400 hover:bg-white/6 hover:text-white'
              }`}
            >
              {fw.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">{framework.description}</p>
      </div>

      {/* Score summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="sc-card flex flex-col items-center justify-center gap-3 p-6">
          <ComplianceGauge pct={overallPct} />
          <div className="text-center">
            <p className="sc-text-kicker">Overall Score</p>
            <p className="mt-1 text-xs text-slate-500">{framework.label}</p>
          </div>
        </div>
        <div className="sc-card flex items-center justify-between p-5">
          <div>
            <p className="sc-text-kicker">Total Controls</p>
            <h3 className="mt-2 text-3xl font-extrabold text-white">
              {framework.domains.reduce((s, d) => s + d.controls, 0)}
            </h3>
            <p className="mt-1 text-xs text-slate-500">across {framework.domains.length} domains</p>
          </div>
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-sky-300"><Layers className="h-6 w-6" /></div>
        </div>
        <div className="sc-card flex items-center justify-between p-5">
          <div>
            <p className="sc-text-kicker">Compliant Controls</p>
            <h3 className="mt-2 text-3xl font-extrabold text-emerald-400">
              {framework.domains.reduce((s, d) => s + d.compliant, 0)}
            </h3>
            <p className="mt-1 text-xs text-slate-500">passing attestation</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300"><CheckCircle2 className="h-6 w-6" /></div>
        </div>
        <div className="sc-card flex items-center justify-between p-5">
          <div>
            <p className="sc-text-kicker">Open Gaps</p>
            <h3 className={`mt-2 text-3xl font-extrabold ${totalGaps > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{totalGaps}</h3>
            <p className="mt-1 text-xs text-slate-500">require remediation</p>
          </div>
          <div className={`rounded-2xl border p-3 ${totalGaps > 0 ? 'border-red-500/20 bg-red-500/10 text-red-300' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'}`}>
            {totalGaps > 0 ? <XCircle className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
        </div>
      </div>

      {/* Domain breakdown */}
      <div className="sc-panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="sc-text-kicker">Control Domains</p>
            <h2 className="mt-1 text-base font-bold text-white">{framework.label} — Domain Breakdown</h2>
          </div>
          <div className="flex items-center gap-2">
            {[
              { val: 'ALL',  label: 'All Domains' },
              { val: 'GAPS', label: 'Has Gaps' },
              { val: 'FULL', label: 'Fully Compliant' },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setDomainFilter(val)}
                className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                  domainFilter === val
                    ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                    : 'border-white/8 bg-white/3 text-slate-500 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {filteredDomains.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-center">
              <div>
                <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                <p className="text-sm font-mono text-slate-500">No domains match the selected filter.</p>
              </div>
            </div>
          ) : (
            filteredDomains.map((domain) => (
              <DomainRow
                key={domain.id}
                frameworkId={framework.frameworkId}
                domain={domain}
                canEdit={canEdit}
                onDomainUpdate={handleDomainUpdate}
                onUploadSuccess={handleUploadSuccess}
              />
            ))
          )}
        </div>
      </div>

      {/* All frameworks comparison table */}
      <div className="sc-panel p-5">
        <p className="sc-text-kicker mb-4">All Frameworks — Compliance Overview</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/8 text-[10px] uppercase tracking-widest text-slate-500">
                <th className="pb-3 pr-6">Framework</th>
                <th className="pb-3 pr-6">Controls</th>
                <th className="pb-3 pr-6">Compliant</th>
                <th className="pb-3 pr-6">Open Gaps</th>
                <th className="pb-3 pr-6 w-40">Score</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {frameworks.map((fw) => {
                const tot  = fw.domains.reduce((s, d) => s + d.controls, 0);
                const comp = fw.domains.reduce((s, d) => s + d.compliant, 0);
                const gaps = fw.domains.reduce((s, d) => s + d.open, 0);
                const p    = tot > 0 ? Math.round((comp / tot) * 100) : 100;
                return (
                  <tr key={fw.frameworkId} className="cursor-pointer transition hover:bg-white/3" onClick={() => setFid(fw.frameworkId)}>
                    <td className="py-3 pr-6">
                      <span className={`sc-badge ${fw.badge}`}>{fw.label}</span>
                    </td>
                    <td className="py-3 pr-6 font-mono text-slate-300">{tot}</td>
                    <td className="py-3 pr-6 font-mono text-emerald-400">{comp}</td>
                    <td className={`py-3 pr-6 font-mono ${gaps > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{gaps}</td>
                    <td className="py-3 pr-6">
                      <div className="flex items-center gap-2">
                        <div className="w-24"><ProgressBar pct={p} thin /></div>
                        <span className="w-8 shrink-0 font-mono text-white">{p}%</span>
                      </div>
                    </td>
                    <td className="py-3"><StatusBadge pct={p} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
