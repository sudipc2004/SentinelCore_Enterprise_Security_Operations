import React, { useRef, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  AlertOctagon,
  Ban,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  GripVertical,
  Link2,
  Link2Off,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldOff,
  Siren,
  Terminal,
  Trash2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useToast } from '../components/Toast';

// ─── Step types ───────────────────────────────────────────────────────────────
const STEP_TYPES = [
  { type: 'NOTIFY',      label: 'Notify Team',    Icon: Bell,         color: 'sky'    },
  { type: 'CONTAIN',     label: 'Contain Asset',  Icon: ShieldOff,    color: 'orange' },
  { type: 'INVESTIGATE', label: 'Investigate',    Icon: Search,       color: 'purple' },
  { type: 'ESCALATE',    label: 'Escalate',       Icon: AlertOctagon, color: 'red'    },
  { type: 'REMEDIATE',   label: 'Remediate',      Icon: Wrench,       color: 'emerald'},
  { type: 'BLOCK',       label: 'Block IP/Domain',Icon: Ban,          color: 'red'    },
  { type: 'TICKET',      label: 'Create Ticket',  Icon: FileText,     color: 'blue'   },
];

const STEP_TYPE_STYLES = {
  sky:     { text: 'text-sky-300',     border: 'border-sky-500/30',     bg: 'bg-sky-500/10'    },
  orange:  { text: 'text-orange-300',  border: 'border-orange-500/30',  bg: 'bg-orange-500/10' },
  purple:  { text: 'text-purple-300',  border: 'border-purple-500/30',  bg: 'bg-purple-500/10' },
  red:     { text: 'text-red-300',     border: 'border-red-500/30',     bg: 'bg-red-500/10'    },
  emerald: { text: 'text-emerald-300', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10'},
  blue:    { text: 'text-blue-300',    border: 'border-blue-500/30',    bg: 'bg-blue-500/10'   },
};

const PLAYBOOK_STATUS_STYLES = {
  ACTIVE:   { text: 'text-emerald-300', border: 'border-emerald-500/25', bg: 'bg-emerald-500/10' },
  DRAFT:    { text: 'text-amber-300',   border: 'border-amber-500/25',   bg: 'bg-amber-500/10'   },
  ARCHIVED: { text: 'text-slate-400',   border: 'border-white/10',       bg: 'bg-white/5'        },
};

const SEVERITY_STYLES = {
  CRITICAL: { text: 'text-red-300',    border: 'border-red-500/25',    bg: 'bg-red-500/10'    },
  HIGH:     { text: 'text-orange-300', border: 'border-orange-500/25', bg: 'bg-orange-500/10' },
  MEDIUM:   { text: 'text-amber-300',  border: 'border-amber-500/25',  bg: 'bg-amber-500/10'  },
  LOW:      { text: 'text-sky-300',    border: 'border-sky-500/25',    bg: 'bg-sky-500/10'    },
};

const emptyStep = { id: '', type: 'NOTIFY', title: '', description: '', actionNotes: '' };

// ─── Sub-components ───────────────────────────────────────────────────────────
function StepTypeBadge({ type }) {
  const def = STEP_TYPES.find((s) => s.type === type) ?? STEP_TYPES[0];
  const style = STEP_TYPE_STYLES[def.color];
  const { Icon } = def;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold font-mono tracking-[0.14em] uppercase ${style.text} ${style.border} ${style.bg}`}>
      <Icon className="h-2.5 w-2.5" />
      {def.label}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const style = SEVERITY_STYLES[severity?.toUpperCase()] ?? SEVERITY_STYLES.LOW;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold font-mono tracking-[0.14em] uppercase ${style.text} ${style.border} ${style.bg}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }) {
  const style = PLAYBOOK_STATUS_STYLES[status] ?? PLAYBOOK_STATUS_STYLES.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-bold font-mono tracking-widest uppercase ${style.text} ${style.border} ${style.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : status === 'DRAFT' ? 'bg-amber-400' : 'bg-slate-600'}`} />
      {status}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Playbooks() {
  const { showToast } = useToast();
  const dragRef = useRef(null);

  const [playbooks, setPlaybooks] = useState([]);
  const [alertRules, setAlertRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPbId, setSelectedPbId] = useState('');
  const [steps, setSteps] = useState([]);
  const [pbMeta, setPbMeta] = useState({ name: '', description: '', status: 'DRAFT', linkedAlertRuleId: null });

  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [stepForm, setStepForm] = useState({ ...emptyStep });
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Simulation state
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simVisibleSteps, setSimVisibleSteps] = useState(0);

  // ── Load playbooks & rules ────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [pbRes, rulesRes] = await Promise.all([
        axios.get('/api/playbooks'),
        axios.get('/api/playbooks/alert-rules'),
      ]);
      setPlaybooks(pbRes.data);
      setAlertRules(rulesRes.data);

      if (pbRes.data.length > 0) {
        const current = pbRes.data.find(p => p.id === selectedPbId) || pbRes.data[0];
        setSelectedPbId(current.id);
        setSteps([...(current.steps || [])]);
        setPbMeta({
          name: current.name,
          description: current.description,
          status: current.status,
          linkedAlertRuleId: current.linkedAlertRuleId,
        });
      }
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to fetch playbooks from server' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPbId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedPb = playbooks.find((p) => p.id === selectedPbId);
  const linkedRule = alertRules.find((r) => r.id === pbMeta.linkedAlertRuleId);

  // ── Select playbook ─────────────────────────────────────────────────────────
  const selectPlaybook = (pb) => {
    setSelectedPbId(pb.id);
    setSteps([...(pb.steps || [])]);
    setPbMeta({
      name: pb.name,
      description: pb.description,
      status: pb.status,
      linkedAlertRuleId: pb.linkedAlertRuleId,
    });
  };

  // ── Save playbook ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selectedPbId) return;
    setSaving(true);
    try {
      const payload = {
        name: pbMeta.name,
        description: pbMeta.description,
        status: pbMeta.status,
        linkedAlertRuleId: pbMeta.linkedAlertRuleId,
        steps,
      };
      const res = await axios.put(`/api/playbooks/${selectedPbId}`, payload);
      setPlaybooks((prev) => prev.map((p) => (p.id === selectedPbId ? res.data : p)));
      showToast({ type: 'success', message: `Playbook "${res.data.name}" saved to database.` });
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Failed to save playbook' });
    } finally {
      setSaving(false);
    }
  };

  // ── New playbook ──────────────────────────────────────────────────────────
  const handleNewPlaybook = async () => {
    try {
      const payload = {
        name: 'New Custom Playbook',
        description: 'Describe this response automation workflow...',
        status: 'DRAFT',
        linkedAlertRuleId: null,
        steps: [],
      };
      const res = await axios.post('/api/playbooks', payload);
      setPlaybooks((prev) => [res.data, ...prev]);
      selectPlaybook(res.data);
      showToast({ type: 'success', message: 'New playbook created' });
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to create new playbook' });
    }
  };

  // ── Delete playbook ───────────────────────────────────────────────────────
  const handleDeletePlaybook = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this playbook?')) return;
    try {
      await axios.delete(`/api/playbooks/${id}`);
      const remaining = playbooks.filter((p) => p.id !== id);
      setPlaybooks(remaining);
      if (remaining.length > 0) {
        selectPlaybook(remaining[0]);
      } else {
        setSelectedPbId('');
        setSteps([]);
      }
      showToast({ type: 'success', message: 'Playbook deleted' });
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to delete playbook' });
    }
  };

  // ── Run simulation ────────────────────────────────────────────────────────
  const handleRunSimulation = async () => {
    if (!selectedPbId) return;
    setSimulating(true);
    setSimResult(null);
    setSimVisibleSteps(0);
    try {
      const res = await axios.post(`/api/playbooks/${selectedPbId}/simulate`);
      setSimResult(res.data);
      // Animate execution steps sequentially
      const total = res.data.executedSteps?.length || 0;
      for (let i = 1; i <= total; i++) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        setSimVisibleSteps(i);
      }
      showToast({ type: 'success', message: `Simulation completed successfully for "${res.data.playbookName}"` });
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to execute simulation' });
    } finally {
      setSimulating(false);
    }
  };

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const onDragStart = (idx) => { dragRef.current = idx; };
  const onDragOver = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
  const onDrop = (e, idx) => {
    e.preventDefault();
    const from = dragRef.current;
    if (from === null || from === idx) { setDragOverIdx(null); return; }
    const arr = [...steps];
    const [moved] = arr.splice(from, 1);
    arr.splice(idx, 0, moved);
    setSteps(arr);
    dragRef.current = null;
    setDragOverIdx(null);
  };
  const onDragEnd = () => { dragRef.current = null; setDragOverIdx(null); };

  // ── Step editor ───────────────────────────────────────────────────────────
  const openAddStep = () => {
    setEditingStep(null);
    setStepForm({ ...emptyStep, id: `s-${Date.now()}` });
    setShowStepEditor(true);
  };
  const openEditStep = (step) => {
    setEditingStep(step.id);
    setStepForm({ ...step });
    setShowStepEditor(true);
  };
  const handleSaveStep = () => {
    if (!stepForm.title.trim()) {
      showToast({ type: 'error', message: 'Step title is required.' });
      return;
    }
    if (editingStep) {
      setSteps((prev) => prev.map((s) => (s.id === editingStep ? { ...stepForm } : s)));
    } else {
      setSteps((prev) => [...prev, { ...stepForm }]);
    }
    setShowStepEditor(false);
  };
  const handleDeleteStep = (id) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  // ── Link alert rule ───────────────────────────────────────────────────────
  const handleLinkRule = (ruleId) => {
    setPbMeta((prev) => ({ ...prev, linkedAlertRuleId: ruleId }));
    setShowLinkModal(false);
    showToast({ type: 'success', message: ruleId ? 'Alert rule linked.' : 'Alert rule unlinked.' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sc-fade-in">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="sc-panel flex flex-col gap-4 p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="sc-badge border-purple-500/20 bg-purple-500/10 text-purple-300">
              <BookOpen className="h-2.5 w-2.5" /> Playbook Builder
            </span>
            <span className="sc-badge border-white/10 bg-white/5 text-slate-300">Module 10</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">Playbook Automation</h1>
          <p className="mt-1 text-sm text-slate-400">
            Build drag-and-drop response playbooks. Link to alert rules for automatic triggering and run live response simulations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="c-p flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-300 hover:border-white/20 hover:text-white transition disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleNewPlaybook}
            className="c-p sc-button-primary px-5 py-2.5 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" /> New Playbook
          </button>
        </div>
      </div>

      {/* ── Two-panel layout ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* Left panel — playbook list */}
        <div className="sc-panel flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/8 p-4">
            <p className="sc-text-kicker">Playbooks ({playbooks.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 max-h-[600px]">
            {playbooks.map((pb) => {
              const rule = alertRules.find((r) => r.id === pb.linkedAlertRuleId);
              const isActive = pb.id === selectedPbId;
              return (
                <div
                  key={pb.id}
                  onClick={() => selectPlaybook(pb)}
                  className={`c-p group w-full p-4 text-left transition hover:bg-white/3 ${isActive ? 'bg-blue-500/8 border-l-2 border-sky-400' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                        {pb.name}
                      </p>
                      <p className="mt-0.5 text-[10px] font-mono text-slate-500 truncate">{pb.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={pb.status} />
                      <button
                        onClick={(e) => handleDeletePlaybook(pb.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition"
                        title="Delete playbook"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-500">{(pb.steps || []).length} steps</span>
                    {rule && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-sky-400 truncate">
                        <Link2 className="h-2.5 w-2.5" /> {rule.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel — step canvas */}
        <div className="sc-panel flex flex-col xl:col-span-2">

          {/* Playbook header */}
          {selectedPb ? (
            <>
              <div className="border-b border-white/8 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <StatusBadge status={pbMeta.status} />
                      <select
                        value={pbMeta.status}
                        onChange={(e) => setPbMeta((p) => ({ ...p, status: e.target.value }))}
                        className="glass-input rounded-lg px-2 py-1 text-[10px] font-mono bg-transparent text-slate-300 cursor-pointer"
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </div>
                    <input
                      value={pbMeta.name}
                      onChange={(e) => setPbMeta((p) => ({ ...p, name: e.target.value }))}
                      className="w-full bg-transparent text-lg font-extrabold text-white focus:outline-none focus:border-b focus:border-sky-400/40 pb-0.5"
                      placeholder="Playbook name..."
                    />
                    <input
                      value={pbMeta.description}
                      onChange={(e) => setPbMeta((p) => ({ ...p, description: e.target.value }))}
                      className="mt-1 w-full bg-transparent text-xs text-slate-400 focus:outline-none"
                      placeholder="Brief description of this response flow..."
                    />
                  </div>
                </div>

                {/* Linked alert rule chip */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {linkedRule ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-mono text-sky-300">
                      <Link2 className="h-3 w-3" />
                      Linked: {linkedRule.name}
                      <SeverityBadge severity={linkedRule.severity} />
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-600">No alert rule linked</span>
                  )}
                  <button
                    onClick={() => setShowLinkModal(true)}
                    className="c-p sc-button-secondary px-3 py-1.5 text-[10px] font-semibold"
                  >
                    <Link2 className="h-3 w-3" />
                    {linkedRule ? 'Change Rule' : 'Link Alert Rule'}
                  </button>
                </div>
              </div>

              {/* Step canvas */}
              <div className="flex-1 overflow-y-auto p-5 min-h-[300px]">
                {steps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Zap className="mb-3 h-10 w-10 text-slate-700" />
                    <p className="text-sm font-mono text-slate-400">No steps yet.</p>
                    <p className="text-xs font-mono text-slate-600 mt-1">Add your first step to start building the response flow.</p>
                  </div>
                ) : (
                  <div className="relative flex flex-col gap-0">
                    {steps.map((step, idx) => {
                      const def = STEP_TYPES.find((s) => s.type === step.type) ?? STEP_TYPES[0];
                      const style = STEP_TYPE_STYLES[def.color];
                      const { Icon } = def;
                      const isDragOver = dragOverIdx === idx;
                      return (
                        <div key={step.id || idx}>
                          {/* Drop indicator */}
                          {isDragOver && dragRef.current !== idx && (
                            <div className="h-1 rounded-full bg-sky-400/60 mx-4 mb-2 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                          )}
                          {/* Connector line */}
                          {idx > 0 && (
                            <div className="flex justify-center">
                              <div className="w-px h-4 bg-white/10" />
                            </div>
                          )}
                          {/* Step card */}
                          <div
                            draggable
                            onDragStart={() => onDragStart(idx)}
                            onDragOver={(e) => onDragOver(e, idx)}
                            onDrop={(e) => onDrop(e, idx)}
                            onDragEnd={onDragEnd}
                            className={`group flex items-start gap-3 rounded-2xl border p-4 transition-all ${
                              dragRef.current === idx ? 'opacity-40 scale-95' : ''
                            } border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/12`}
                          >
                            {/* Grab handle */}
                            <div className="mt-1 cursor-grab text-slate-700 hover:text-slate-400 transition active:cursor-grabbing">
                              <GripVertical className="h-4 w-4" />
                            </div>

                            {/* Step number */}
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border text-[10px] font-extrabold font-mono ${style.text} ${style.border} ${style.bg}`}>
                              {idx + 1}
                            </div>

                            {/* Icon */}
                            <div className={`mt-0.5 rounded-xl border p-1.5 ${style.border} ${style.bg}`}>
                              <Icon className={`h-4 w-4 ${style.text}`} />
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <StepTypeBadge type={step.type} />
                              </div>
                              <p className="text-sm font-semibold text-white">{step.title}</p>
                              {step.description && (
                                <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{step.description}</p>
                              )}
                              {step.actionNotes && (
                                <p className="mt-1 font-mono text-[10px] text-sky-400/80 bg-sky-500/5 px-2 py-0.5 rounded border border-sky-500/10 inline-block">
                                  {step.actionNotes}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => openEditStep(step)}
                                className="c-p rounded-lg border border-white/8 bg-white/5 p-1.5 text-slate-400 hover:text-white transition"
                                title="Edit step"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteStep(step.id)}
                                className="c-p rounded-lg border border-red-500/15 bg-red-500/5 p-1.5 text-red-400 hover:text-red-300 transition"
                                title="Delete step"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Bottom drop zone */}
                    {dragOverIdx === steps.length && (
                      <div
                        onDragOver={(e) => onDragOver(e, steps.length)}
                        onDrop={(e) => onDrop(e, steps.length)}
                        className="h-1 rounded-full bg-sky-400/60 mx-4 mt-2 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                      />
                    )}
                  </div>
                )}

                {/* Add step button */}
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={openAddStep}
                    className="c-p flex items-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/3 px-6 py-3 text-xs font-mono text-slate-400 hover:border-sky-400/30 hover:text-sky-300 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Step
                  </button>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between gap-3 border-t border-white/8 p-4">
                <span className="text-[10px] font-mono text-slate-600">{steps.length} steps · {pbMeta.status}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunSimulation}
                    disabled={simulating || steps.length === 0}
                    className="c-p sc-button-secondary px-4 py-2.5 text-xs font-semibold disabled:opacity-40"
                  >
                    {simulating ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-300/30 border-t-emerald-300" />
                    ) : (
                      <Play className="h-3.5 w-3.5 text-emerald-300" />
                    )}
                    {simulating ? 'Simulating...' : 'Run Simulation'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="c-p sc-button-primary px-4 py-2.5 text-xs font-semibold disabled:opacity-40"
                  >
                    {saving ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save Changes
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24">
              <BookOpen className="mb-3 h-10 w-10 text-slate-700" />
              <p className="text-sm font-mono text-slate-400">Select a playbook from the left panel.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Step Editor Modal ──────────────────────────────────────────────── */}
      {showStepEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal relative w-full max-w-lg p-6 sc-scale-in">
            <button onClick={() => setShowStepEditor(false)} className="c-p absolute right-4 top-4 text-slate-400 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-white">
              {editingStep ? <Pencil className="h-4 w-4 text-sky-300" /> : <Plus className="h-4 w-4 text-sky-300" />}
              {editingStep ? 'Edit Step' : 'Add Step'}
            </h3>

            <div className="space-y-4">
              {/* Step type chips */}
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Step Type</p>
                <div className="flex flex-wrap gap-2">
                  {STEP_TYPES.map(({ type, label, Icon, color }) => {
                    const style = STEP_TYPE_STYLES[color];
                    const isSelected = stepForm.type === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setStepForm((f) => ({ ...f, type }))}
                        className={`c-p flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold font-mono transition ${
                          isSelected
                            ? `${style.text} ${style.border} ${style.bg}`
                            : 'border-white/8 bg-white/3 text-slate-500 hover:border-white/15 hover:text-slate-300'
                        }`}
                      >
                        <Icon className="h-3 w-3" /> {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Title *</label>
                <input
                  value={stepForm.title}
                  onChange={(e) => setStepForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Block Source IP"
                  className="glass-input w-full px-4 py-2.5 text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Description</label>
                <textarea
                  value={stepForm.description}
                  onChange={(e) => setStepForm((f) => ({ ...f, description: e.target.value }))}
                  rows="3"
                  placeholder="What does this step do?"
                  className="glass-input w-full px-4 py-2.5 text-sm"
                />
              </div>

              {/* Action notes */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Action Notes (optional)</label>
                <textarea
                  value={stepForm.actionNotes || ''}
                  onChange={(e) => setStepForm((f) => ({ ...f, actionNotes: e.target.value }))}
                  rows="2"
                  placeholder="API endpoint, Slack channel, runbook link..."
                  className="glass-input w-full px-4 py-2.5 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowStepEditor(false)} className="c-p sc-button-secondary flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest">
                  Cancel
                </button>
                <button onClick={handleSaveStep} className="c-p sc-button-primary flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest">
                  <Check className="h-3.5 w-3.5" /> {editingStep ? 'Update Step' : 'Add Step'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Alert Rule Link Modal ──────────────────────────────────────────── */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal relative max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6 sc-scale-in">
            <button onClick={() => setShowLinkModal(false)} className="c-p absolute right-4 top-4 text-slate-400 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-white">
              <Link2 className="h-4 w-4 text-sky-300" /> Link to Alert Rule
            </h3>
            <p className="mb-5 text-xs font-mono text-slate-500">
              This playbook will auto-trigger when the selected alert rule fires.
            </p>

            {/* Unlink option */}
            {pbMeta.linkedAlertRuleId && (
              <button
                onClick={() => handleLinkRule(null)}
                className="c-p mb-4 flex w-full items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-xs font-mono text-red-400 hover:bg-red-500/15 transition"
              >
                <Link2Off className="h-3.5 w-3.5" /> Unlink current rule ({linkedRule?.name})
              </button>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {alertRules.map((rule) => {
                const isLinked = pbMeta.linkedAlertRuleId === rule.id;
                return (
                  <button
                    key={rule.id}
                    onClick={() => handleLinkRule(rule.id)}
                    className={`c-p flex flex-col gap-2 rounded-2xl border p-4 text-left transition hover:bg-white/5 ${
                      isLinked
                        ? 'border-sky-500/40 bg-sky-500/8 ring-1 ring-sky-400/20'
                        : 'border-white/8 bg-white/3'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <SeverityBadge severity={rule.severity} />
                      {isLinked && <Check className="h-3.5 w-3.5 text-sky-400" />}
                    </div>
                    <p className="text-sm font-semibold text-white">{rule.name}</p>
                    <p className="text-[10px] font-mono text-slate-500 leading-relaxed">{rule.condition}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-white/8">
              <button onClick={() => setShowLinkModal(false)} className="c-p sc-button-secondary w-full px-4 py-2.5 text-xs font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Live Simulation Execution Engine Modal ──────────────────────────── */}
      {simResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="sc-modal relative w-full max-w-3xl overflow-hidden p-6 sc-scale-in space-y-4">
            <button
              onClick={() => setSimResult(null)}
              className="c-p absolute right-4 top-4 text-slate-400 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <Play className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="sc-badge border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> Simulation Execution Report
                  </span>
                  <span className="font-mono text-xs text-slate-400">{simResult.executionTimeMs} ms</span>
                </div>
                <h3 className="mt-1 text-lg font-extrabold text-white">{simResult.playbookName}</h3>
              </div>
            </div>

            {/* Trigger info */}
            <div className="flex flex-wrap items-center justify-between rounded-xl border border-white/8 bg-white/3 px-4 py-2.5 text-xs font-mono text-slate-400">
              <span>Triggered By: <strong className="text-white">{simResult.triggeredBy}</strong></span>
              <span>Total Steps: <strong className="text-emerald-400">{simResult.totalSteps}</strong></span>
              <span>Status: <strong className="text-emerald-400">COMPLETED</strong></span>
            </div>

            {/* Step execution checklist */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Step Execution Stream</p>
              {(simResult.executedSteps || []).slice(0, simVisibleSteps).map((step) => {
                const def = STEP_TYPES.find((s) => s.type === step.type) ?? STEP_TYPES[0];
                return (
                  <div
                    key={step.stepId || step.stepIndex}
                    className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2 text-xs sc-fade-in"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span className="font-mono font-bold text-slate-300">Step {step.stepIndex}:</span>
                      <span className="font-semibold text-white">{step.title}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[10px]">
                      <span className="text-emerald-400 font-bold">SUCCESS</span>
                      <span className="text-slate-500">{step.durationMs}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simulation Console Log Box */}
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Terminal className="h-3.5 w-3.5 text-sky-400" /> Automation Console Output
              </p>
              <div className="rounded-xl border border-white/10 bg-[#050a14] p-3 font-mono text-xs text-sky-300 space-y-1.5 max-h-[160px] overflow-y-auto">
                {(simResult.executedSteps || []).slice(0, simVisibleSteps).map((step) => (
                  <div key={step.stepId || step.stepIndex} className="leading-relaxed">
                    <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>{' '}
                    <span className="text-emerald-400 font-bold">{step.type}</span> — {step.logOutput}
                  </div>
                ))}
                {simVisibleSteps < (simResult.executedSteps?.length || 0) && (
                  <div className="animate-pulse text-slate-500 italic">Executing next step...</div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSimResult(null)}
                className="sc-button-primary px-5 py-2 text-xs font-semibold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
