import React, { useRef, useState } from 'react';
import {
  AlertOctagon,
  Ban,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
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

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_ALERT_RULES = [
  { id: 'ar-1', name: 'Brute Force Login',         condition: 'Failed logins > 10 in 5 min from same IP',  severity: 'CRITICAL' },
  { id: 'ar-2', name: 'Outbound DNS Tunneling',    condition: 'DNS query volume > 500/min to external',     severity: 'HIGH'     },
  { id: 'ar-3', name: 'Lateral Movement',          condition: 'Process spawn anomaly on workstation',       severity: 'HIGH'     },
  { id: 'ar-4', name: 'Config File Modified',      condition: 'Critical file write outside change window',  severity: 'MEDIUM'   },
  { id: 'ar-5', name: 'Suspicious PowerShell',     condition: 'Encoded PS1 execution on any endpoint',      severity: 'HIGH'     },
  { id: 'ar-6', name: 'Internal Port Scan',        condition: 'Internal host scanning 3+ /24 subnets',      severity: 'MEDIUM'   },
  { id: 'ar-7', name: 'Admin Group Modification',  condition: 'User added to privileged group',             severity: 'CRITICAL' },
  { id: 'ar-8', name: 'SSL Certificate Expiry',    condition: 'TLS cert < 7 days to expiry',               severity: 'LOW'      },
];

const MOCK_PLAYBOOKS = [
  {
    id: 'pb-1',
    name: 'Brute Force Response',
    description: 'Automated response for brute force login attempts — block source, alert team, open ticket.',
    triggerType: 'ALERT_RULE',
    linkedAlertRuleId: 'ar-1',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    steps: [
      { id: 's1', type: 'INVESTIGATE', title: 'Gather Login Context',      description: 'Pull last 100 auth events for source IP from log explorer.' },
      { id: 's2', type: 'BLOCK',       title: 'Block Source IP',           description: 'Add source IP to firewall block-list via API.' },
      { id: 's3', type: 'NOTIFY',      title: 'Notify SOC Team',           description: 'Send Slack alert to #soc-alerts with IP and event summary.' },
      { id: 's4', type: 'TICKET',      title: 'Open Incident Ticket',      description: 'Auto-create P1 incident with pre-filled context.' },
      { id: 's5', type: 'ESCALATE',    title: 'Escalate if Unresolved 2h', description: 'If ticket not resolved in 2h, escalate to team lead.' },
    ],
  },
  {
    id: 'pb-2',
    name: 'Ransomware Containment',
    description: 'Isolate infected endpoint, snapshot disk, notify IR team and preserve evidence.',
    triggerType: 'MANUAL',
    linkedAlertRuleId: null,
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    steps: [
      { id: 's1', type: 'INVESTIGATE', title: 'Identify Affected Assets',  description: 'Check lateral movement logs and file modification events.' },
      { id: 's2', type: 'CONTAIN',     title: 'Isolate Endpoint',          description: 'Trigger EDR isolation API for affected workstation.' },
      { id: 's3', type: 'INVESTIGATE', title: 'Snapshot Disk Image',       description: 'Initiate forensic disk snapshot for evidence preservation.' },
      { id: 's4', type: 'NOTIFY',      title: 'Notify IR Team',            description: 'Page on-call IR analyst via PagerDuty integration.' },
      { id: 's5', type: 'REMEDIATE',   title: 'Restore from Clean Backup', description: 'Restore endpoint from last known-good backup snapshot.' },
      { id: 's6', type: 'TICKET',      title: 'Post-Incident Report',      description: 'Create follow-up ticket for PIR within 48h.' },
    ],
  },
  {
    id: 'pb-3',
    name: 'Phishing Email Triage',
    description: 'Automated triage for reported phishing emails — extract IOCs, scan mailboxes, block sender.',
    triggerType: 'ALERT_RULE',
    linkedAlertRuleId: 'ar-7',
    status: 'DRAFT',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    steps: [
      { id: 's1', type: 'INVESTIGATE', title: 'Extract Email IOCs',        description: 'Parse headers, links, and attachments for IOC indicators.' },
      { id: 's2', type: 'BLOCK',       title: 'Block Sender Domain',       description: 'Add sender domain to email gateway block-list.' },
      { id: 's3', type: 'REMEDIATE',   title: 'Sweep All Mailboxes',       description: 'Search and delete matching emails across all mailboxes.' },
      { id: 's4', type: 'NOTIFY',      title: 'User Awareness Alert',      description: 'Send security awareness notice to all users in affected dept.' },
    ],
  },
];

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

  const [playbooks, setPlaybooks] = useState(MOCK_PLAYBOOKS);
  const [selectedPbId, setSelectedPbId] = useState(MOCK_PLAYBOOKS[0].id);
  const [steps, setSteps] = useState(MOCK_PLAYBOOKS[0].steps);
  const [pbMeta, setPbMeta] = useState({ name: MOCK_PLAYBOOKS[0].name, description: MOCK_PLAYBOOKS[0].description, status: MOCK_PLAYBOOKS[0].status, linkedAlertRuleId: MOCK_PLAYBOOKS[0].linkedAlertRuleId });
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [editingStep, setEditingStep] = useState(null); // null = new
  const [stepForm, setStepForm] = useState({ ...emptyStep });
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isMock] = useState(true);

  const selectedPb = playbooks.find((p) => p.id === selectedPbId);
  const linkedRule = MOCK_ALERT_RULES.find((r) => r.id === pbMeta.linkedAlertRuleId);

  // ── Playbook selection ────────────────────────────────────────────────────
  const selectPlaybook = (pb) => {
    setSelectedPbId(pb.id);
    setSteps([...pb.steps]);
    setPbMeta({ name: pb.name, description: pb.description, status: pb.status, linkedAlertRuleId: pb.linkedAlertRuleId });
  };

  // ── Save playbook ─────────────────────────────────────────────────────────
  const handleSave = () => {
    setPlaybooks((prev) =>
      prev.map((p) => p.id === selectedPbId ? { ...p, ...pbMeta, steps } : p)
    );
    showToast({ type: 'success', message: 'Playbook saved. (Preview — backend pending)' });
  };

  // ── New playbook ──────────────────────────────────────────────────────────
  const handleNewPlaybook = () => {
    const newPb = {
      id: `pb-${Date.now()}`,
      name: 'New Playbook',
      description: 'Describe this playbook response flow...',
      triggerType: 'MANUAL',
      linkedAlertRuleId: null,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      steps: [],
    };
    setPlaybooks((prev) => [newPb, ...prev]);
    selectPlaybook(newPb);
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
      setSteps((prev) => prev.map((s) => s.id === editingStep ? { ...stepForm } : s));
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

  // ─────────────────────────────────────────────────────────────────────────
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
            {isMock && (
              <span className="sc-badge border-amber-500/20 bg-amber-500/10 text-amber-300">
                ⚠ Preview — Backend Pending
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">Playbook Automation</h1>
          <p className="mt-1 text-sm text-slate-400">
            Build drag-and-drop response playbooks. Link to alert rules for automatic triggering.
          </p>
        </div>
        <button
          onClick={handleNewPlaybook}
          className="c-p sc-button-primary px-5 py-2.5 text-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" /> New Playbook
        </button>
      </div>

      {/* ── Two-panel layout ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* Left panel — playbook list */}
        <div className="sc-panel flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/8 p-4">
            <p className="sc-text-kicker">Playbooks ({playbooks.length})</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {playbooks.map((pb) => {
              const rule = MOCK_ALERT_RULES.find((r) => r.id === pb.linkedAlertRuleId);
              const isActive = pb.id === selectedPbId;
              return (
                <button
                  key={pb.id}
                  onClick={() => selectPlaybook(pb)}
                  className={`c-p w-full p-4 text-left transition hover:bg-white/3 ${isActive ? 'bg-blue-500/8 border-l-2 border-sky-400' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                        {pb.name}
                      </p>
                      <p className="mt-0.5 text-[10px] font-mono text-slate-500 truncate">{pb.description}</p>
                    </div>
                    <StatusBadge status={pb.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-500">{pb.steps.length} steps</span>
                    {rule && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-sky-400 truncate">
                        <Link2 className="h-2.5 w-2.5" /> {rule.name}
                      </span>
                    )}
                  </div>
                </button>
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
              <div className="flex-1 overflow-y-auto p-5">
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
                        <div key={step.id}>
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
                    onClick={() => showToast({ type: 'info', message: 'Simulation run logged to audit trail. (Preview)' })}
                    className="c-p sc-button-secondary px-4 py-2.5 text-xs font-semibold"
                  >
                    <Play className="h-3.5 w-3.5 text-emerald-300" /> Run Simulation
                  </button>
                  <button onClick={handleSave} className="c-p sc-button-primary px-4 py-2.5 text-xs font-semibold">
                    <Save className="h-3.5 w-3.5" /> Save Changes
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
              {MOCK_ALERT_RULES.map((rule) => {
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
    </div>
  );
}
