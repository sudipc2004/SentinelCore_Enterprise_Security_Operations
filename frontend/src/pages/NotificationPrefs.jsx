import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Bell, Mail, MessageSquare, Phone, Webhook, Shield, Bug, Siren,
  AlertTriangle, CheckCircle2, X, Plus, Trash2, GripVertical,
  Clock, Users, ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
  Moon, Save, RefreshCw, Info, Loader2
} from 'lucide-react';
import { useToast } from '../components/Toast';

// ─── Channel definitions ──────────────────────────────────────────────────────
const CHANNELS = [
  {
    id: 'email',
    label: 'Email',
    icon: Mail,
    color: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    desc: 'Send HTML alert emails to individual addresses or distribution groups.',
    fields: [
      { key: 'address',   label: 'To Address(es)',  placeholder: 'soc@company.com, team@company.com', type: 'text' },
      { key: 'subject',   label: 'Subject Prefix',  placeholder: '[SentinelCore Alert]',              type: 'text' },
      { key: 'cc',        label: 'CC (optional)',    placeholder: 'manager@company.com',               type: 'text' },
    ],
  },
  {
    id: 'slack',
    label: 'Slack',
    icon: MessageSquare,
    color: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
    desc: 'Post alerts to Slack via an incoming webhook URL.',
    fields: [
      { key: 'webhook',  label: 'Incoming Webhook URL', placeholder: 'https://hooks.slack.com/services/…', type: 'text'     },
      { key: 'channel',  label: 'Channel',               placeholder: '#soc-alerts',                       type: 'text'     },
      { key: 'username', label: 'Bot Username',           placeholder: 'SentinelCore',                      type: 'text'     },
    ],
  },
  {
    id: 'pagerduty',
    label: 'PagerDuty',
    icon: Bell,
    color: 'border-green-500/30 bg-green-500/10 text-green-300',
    desc: 'Create PagerDuty incidents via Events API v2.',
    fields: [
      { key: 'routingKey', label: 'Routing Key (Integration Key)', placeholder: 'a1b2c3d4e5f6g7h8…', type: 'text'     },
      { key: 'severity',   label: 'Default Severity',               placeholder: 'critical',           type: 'select',
        options: ['critical', 'error', 'warning', 'info'] },
    ],
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: Phone,
    color: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    desc: 'Send SMS via Twilio or AWS SNS for critical-only alerts.',
    fields: [
      { key: 'apiKey',   label: 'Twilio Account SID',  placeholder: 'AC…',          type: 'text'     },
      { key: 'authToken',label: 'Auth Token',            placeholder: '••••••••',     type: 'password' },
      { key: 'from',     label: 'From Number',           placeholder: '+12025551234', type: 'text'     },
      { key: 'to',       label: 'To Number(s)',          placeholder: '+919876543210',type: 'text'     },
    ],
  },
  {
    id: 'webhook',
    label: 'Webhook',
    icon: Webhook,
    color: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    desc: 'HTTP POST alert payload to any endpoint (SIEM, custom integrations).',
    fields: [
      { key: 'url',       label: 'Endpoint URL',       placeholder: 'https://api.yoursiem.com/ingest', type: 'text'   },
      { key: 'method',    label: 'Method',              placeholder: 'POST',                           type: 'select',
        options: ['POST', 'PUT', 'PATCH'] },
      { key: 'authHeader',label: 'Auth Header (optional)',placeholder: 'Bearer your-token',           type: 'text'   },
      { key: 'secret',    label: 'Signing Secret',      placeholder: 'hmac-secret',                   type: 'password'},
    ],
  },
];

// ─── Event types ──────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { id: 'CRITICAL_ALERT',       label: 'Critical Alert',         icon: AlertTriangle, color: 'text-red-400',    defaultOn: true  },
  { id: 'HIGH_ALERT',           label: 'High Severity Alert',    icon: Bell,          color: 'text-orange-400', defaultOn: true  },
  { id: 'INCIDENT_CREATED',     label: 'Incident Created',       icon: Siren,         color: 'text-amber-400',  defaultOn: true  },
  { id: 'INCIDENT_ESCALATED',   label: 'Incident Escalated',     icon: Shield,        color: 'text-red-400',    defaultOn: true  },
  { id: 'VULNERABILITY_FOUND',  label: 'Critical CVE Found',     icon: Bug,           color: 'text-orange-400', defaultOn: false },
  { id: 'IOC_DETECTED',         label: 'IOC / Threat Detected',  icon: Shield,        color: 'text-purple-400', defaultOn: false },
  { id: 'COMPLIANCE_GAP',       label: 'Compliance Gap Opened',  icon: CheckCircle2,  color: 'text-amber-400',  defaultOn: false },
  { id: 'USER_LOGIN_FAILED',    label: 'Failed Login (×5)',      icon: X,             color: 'text-red-400',    defaultOn: true  },
  { id: 'ASSET_OFFLINE',        label: 'Critical Asset Offline', icon: AlertTriangle, color: 'text-orange-400', defaultOn: false },
  { id: 'REPORT_READY',         label: 'Report Ready',           icon: CheckCircle2,  color: 'text-emerald-400',defaultOn: false },
];

// ─── Escalation chain builder ──────────────────────────────────────────────────
const ESCALATION_ROLES = ['Analyst', 'Team Lead', 'Administrator', 'All SOC Members'];

function EscalationChain({ chain, onChange }) {
  const addStep = () => {
    onChange([...chain, { id: Date.now(), role: 'Analyst', delayMinutes: 15, channel: 'email' }]);
  };
  const removeStep = (id) => onChange(chain.filter((s) => s.id !== id));
  const updateStep = (id, field, value) =>
    onChange(chain.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  return (
    <div className="space-y-3">
      {chain.length === 0 && (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/10 py-8">
          <p className="text-xs font-mono text-slate-500">No escalation steps — add one below</p>
        </div>
      )}
      {chain.map((step, idx) => (
        <div key={step.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 p-3">
          <GripVertical className="h-4 w-4 shrink-0 text-slate-600" />
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-sky-500/30 bg-sky-500/10 text-[10px] font-bold text-sky-300">
            {idx + 1}
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {/* Role */}
            <select
              value={step.role}
              onChange={(e) => updateStep(step.id, 'role', e.target.value)}
              className="rounded-xl border border-white/8 bg-[#0b1220] px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              {ESCALATION_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            {/* Channel */}
            <select
              value={step.channel}
              onChange={(e) => updateStep(step.id, 'channel', e.target.value)}
              className="rounded-xl border border-white/8 bg-[#0b1220] px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              {CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            {/* Delay */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-500">After</span>
              <input
                type="number"
                min="0" max="1440"
                value={step.delayMinutes}
                onChange={(e) => updateStep(step.id, 'delayMinutes', parseInt(e.target.value, 10))}
                className="w-16 rounded-xl border border-white/8 bg-[#0b1220] px-2 py-1.5 text-center text-xs text-white focus:outline-none"
              />
              <span className="text-[10px] font-mono text-slate-500">min</span>
            </div>
          </div>
          <button onClick={() => removeStep(step.id)} className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addStep}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 py-2.5 text-xs text-slate-500 transition hover:border-sky-500/30 hover:text-sky-300"
      >
        <Plus className="h-3.5 w-3.5" /> Add Escalation Step
      </button>
    </div>
  );
}

// ─── Channel Card ─────────────────────────────────────────────────────────────
function ChannelCard({ ch, config, onToggle, onFieldChange }) {
  const [expanded, setExpanded] = useState(false);
  const enabled  = config?.enabled ?? false;
  const Icon     = ch.icon;

  return (
    <div className={`rounded-2xl border transition ${enabled ? 'border-white/12 bg-[#0b1220]/80' : 'border-white/6 bg-white/2 opacity-70'}`}>
      <div className="flex items-center gap-4 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${enabled ? ch.color : 'border-white/8 bg-white/5 text-slate-500'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{ch.label}</p>
            {enabled && <span className="sc-badge border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-[9px]">ACTIVE</span>}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{ch.desc}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggle(!enabled)}
            className="flex items-center gap-1.5 text-xs font-semibold transition"
          >
            {enabled
              ? <ToggleRight className="h-6 w-6 text-sky-400" />
              : <ToggleLeft  className="h-6 w-6 text-slate-600" />}
          </button>
          {enabled && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-lg border border-white/8 p-1.5 text-slate-400 transition hover:text-white"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {enabled && expanded && (
        <div className="border-t border-white/8 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ch.fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-slate-500">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    value={config?.[field.key] ?? ''}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    className="w-full rounded-xl border border-white/8 bg-[#0b1220] px-3 py-2 text-xs text-white focus:border-sky-500/40 focus:outline-none"
                  >
                    {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={config?.[field.key] ?? ''}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-sky-500/40 focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NotificationPrefs() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Channel configs
  const [channelConfigs, setChannelConfigs] = useState(
    CHANNELS.reduce((acc, ch) => ({ ...acc, [ch.id]: { enabled: ch.id === 'email' } }), {})
  );

  // Event toggles
  const [eventToggles, setEventToggles] = useState(
    EVENT_TYPES.reduce((acc, et) => ({ ...acc, [et.id]: et.defaultOn }), {})
  );

  // Escalation chain
  const [chain, setChain] = useState([
    { id: 1, role: 'Analyst',       delayMinutes: 0,  channel: 'email'  },
    { id: 2, role: 'Team Lead',     delayMinutes: 15, channel: 'slack'  },
    { id: 3, role: 'Administrator', delayMinutes: 30, channel: 'pagerduty' },
  ]);

  // Quiet hours
  const [quietEnabled, setQuietEnabled] = useState(false);
  const [quietFrom,    setQuietFrom]    = useState('22:00');
  const [quietTo,      setQuietTo]      = useState('07:00');
  const [quietDays,    setQuietDays]    = useState(['SAT', 'SUN']);

  // Digest
  const [digestEnabled,   setDigestEnabled]   = useState(true);
  const [digestFrequency, setDigestFrequency] = useState('Daily');

  // Escalation status
  const [escalationSequence, setEscalationSequence] = useState(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const [prefRes, escRes] = await Promise.all([
          axios.get('/api/notifications/preferences'),
          axios.get('/api/notifications/escalation-sequence').catch(() => ({ data: null })),
        ]);

        const data = prefRes.data;
        if (data) {
          if (data.channels) setChannelConfigs((prev) => ({ ...prev, ...data.channels }));
          if (data.events) setEventToggles((prev) => ({ ...prev, ...data.events }));
          if (data.escalationChain && Array.isArray(data.escalationChain)) setChain(data.escalationChain);
          if (data.quietHours) {
            setQuietEnabled(data.quietHours.enabled ?? false);
            setQuietFrom(data.quietHours.from || '22:00');
            setQuietTo(data.quietHours.to || '07:00');
            if (Array.isArray(data.quietHours.days)) setQuietDays(data.quietHours.days);
          }
          if (data.digest) {
            setDigestEnabled(data.digest.enabled ?? true);
            setDigestFrequency(data.digest.frequency || 'Daily');
          }
        }
        if (escRes.data) {
          setEscalationSequence(escRes.data);
        }
      } catch (err) {
        console.error('Failed to load notification preferences', err);
        showToast({ type: 'error', message: 'Failed to load user notification preferences' });
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const toggleChannel    = (id, val)   => setChannelConfigs((prev) => ({ ...prev, [id]: { ...prev[id], enabled: val } }));
  const setChannelField  = (id, k, v) => setChannelConfigs((prev) => ({ ...prev, [id]: { ...prev[id], [k]: v } }));
  const toggleEvent      = (id)        => setEventToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleQuietDay   = (d)         => setQuietDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const enabledChannels = CHANNELS.filter((ch) => channelConfigs[ch.id]?.enabled).length;
  const enabledEvents   = Object.values(eventToggles).filter(Boolean).length;

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        channels: channelConfigs,
        events: eventToggles,
        escalationChain: chain,
        quietHours: {
          enabled: quietEnabled,
          from: quietFrom,
          to: quietTo,
          days: quietDays,
        },
        digest: {
          enabled: digestEnabled,
          frequency: digestFrequency,
        },
      };
      await axios.put('/api/notifications/preferences', payload);
      showToast({ type: 'success', message: 'Notification preferences saved successfully for your profile' });
    } catch (err) {
      console.error('Failed to save notification preferences', err);
      showToast({ type: 'error', message: 'Failed to save notification preferences' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (channelId) => {
    try {
      const channelLabel = CHANNELS.find((c) => c.id === channelId)?.label;
      const res = await axios.post(`/api/notifications/test-channel/${channelId}`, channelConfigs[channelId] || {});
      showToast({ type: 'success', message: res.data?.message || `Test alert sent successfully via ${channelLabel}` });
    } catch (err) {
      showToast({ type: 'error', message: `Failed to dispatch test notification for ${channelId}` });
    }
  };


  return (
    <div className="space-y-6 sc-fade-in">
      {/* Page header */}
      <div className="sc-panel p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="sc-badge border-amber-500/20 bg-amber-500/10 text-amber-300">Notifications</span>
              <span className="sc-badge border-white/10 bg-white/5 text-slate-400">Module 14</span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">Notification Preferences</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Configure delivery channels, event subscriptions, escalation chains, and quiet hours for all security alerts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="sc-badge border-sky-500/20 bg-sky-500/10 text-sky-300">{enabledChannels} channels active</span>
            <span className="sc-badge border-purple-500/20 bg-purple-500/10 text-purple-300">{enabledEvents} events subscribed</span>
          </div>
        </div>
      </div>

      {/* ── Channels ─────────────────────────────────────────────────────── */}
      <div className="sc-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="sc-text-kicker">Delivery Channels</p>
            <h2 className="mt-1 text-base font-bold text-white">Channel Configuration</h2>
          </div>
          <Info className="h-4 w-4 text-slate-500" title="Configure each channel independently" />
        </div>
        <div className="space-y-3">
          {CHANNELS.map((ch) => (
            <div key={ch.id} className="space-y-2">
              <ChannelCard
                ch={ch}
                config={channelConfigs[ch.id]}
                onToggle={(v) => toggleChannel(ch.id, v)}
                onFieldChange={(k, v) => setChannelField(ch.id, k, v)}
              />
              {channelConfigs[ch.id]?.enabled && (
                <div className="flex justify-end pr-1">
                  <button
                    onClick={() => handleTest(ch.id)}
                    className="text-[10px] font-mono text-slate-500 transition hover:text-sky-300"
                  >
                    Send test notification →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Event subscriptions ───────────────────────────────────────────── */}
      <div className="sc-panel p-5">
        <div className="mb-4">
          <p className="sc-text-kicker">Event Subscriptions</p>
          <h2 className="mt-1 text-base font-bold text-white">Alert me when…</h2>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {EVENT_TYPES.map((et) => {
            const Icon    = et.icon;
            const enabled = eventToggles[et.id];
            return (
              <button
                key={et.id}
                type="button"
                onClick={() => toggleEvent(et.id)}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  enabled
                    ? 'border-sky-500/25 bg-sky-500/8 ring-1 ring-sky-500/15'
                    : 'border-white/6 bg-white/2 opacity-60 hover:opacity-80'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${enabled ? et.color : 'text-slate-600'}`} />
                <span className={`flex-1 text-xs font-medium ${enabled ? 'text-white' : 'text-slate-500'}`}>
                  {et.label}
                </span>
                {enabled
                  ? <ToggleRight className="h-4 w-4 shrink-0 text-sky-400" />
                  : <ToggleLeft  className="h-4 w-4 shrink-0 text-slate-700" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Escalation chain + Quiet hours (side by side) ───────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Escalation chain */}
        <div className="sc-panel p-5 space-y-4">
          <div>
            <p className="sc-text-kicker">Escalation Chain</p>
            <h2 className="mt-1 text-base font-bold text-white">Auto-Escalation Sequence</h2>
            <p className="mt-1 text-xs text-slate-500">When a critical alert is unacknowledged, escalate through this chain.</p>
          </div>
          <EscalationChain chain={chain} onChange={setChain} />

          {/* Active Auto-Escalation Status Monitor */}
          <div className="mt-4 border-t border-white/8 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-bold flex items-center gap-1.5">
                <Siren className="h-3.5 w-3.5 animate-pulse text-amber-400" />
                Live Sequence Monitor
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {escalationSequence?.totalActive || 0} active unacknowledged security items
              </span>
            </div>
            {escalationSequence?.items && escalationSequence.items.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {escalationSequence.items.map((item) => {
                  const esc = item.escalation || {};
                  const assignedUsers = esc.assignedUsers || [];
                  const userNames = assignedUsers.map((u) => u.name || u.email).join(', ');
                  return (
                    <div key={item.id} className="rounded-xl border border-white/8 bg-white/3 p-2.5 text-xs flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white truncate">{item.title}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          Step {esc.currentStepNumber}/{esc.totalSteps}: <span className="text-sky-300 font-bold">{esc.currentRole}</span> via <span className="text-purple-300">{esc.currentChannel}</span>
                        </p>
                        {userNames && (
                          <p className="text-[10px] text-emerald-400 font-mono mt-0.5 truncate">
                            Target: {userNames}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {esc.isEscalated ? (
                          <span className="sc-badge border-red-500/30 bg-red-500/10 text-red-300 text-[9px]">ESCALATED</span>
                        ) : (
                          <span className="sc-badge border-amber-500/30 bg-amber-500/10 text-amber-300 text-[9px]">LEVEL 1</span>
                        )}
                        {esc.nextRole && esc.minutesUntilNextEscalation >= 0 && (
                          <p className="text-[9px] font-mono text-slate-500 mt-0.5">Next in {esc.minutesUntilNextEscalation}m ({esc.nextRole})</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/8 p-3 text-center text-xs font-mono text-slate-500">
                No active unacknowledged alerts currently in escalation sequence.
              </div>
            )}
          </div>
        </div>

        {/* Quiet hours + digest */}
        <div className="space-y-4">
          {/* Quiet hours */}
          <div className="sc-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="sc-text-kicker">Quiet Hours</p>
                <h2 className="mt-1 text-base font-bold text-white">Do Not Disturb</h2>
              </div>
              <button
                type="button"
                onClick={() => setQuietEnabled((v) => !v)}
              >
                {quietEnabled
                  ? <ToggleRight className="h-6 w-6 text-sky-400" />
                  : <ToggleLeft  className="h-6 w-6 text-slate-600" />}
              </button>
            </div>
            <div className={`space-y-4 transition-opacity ${quietEnabled ? 'opacity-100' : 'pointer-events-none opacity-30'}`}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    <Moon className="mr-1 inline h-3 w-3" />From
                  </label>
                  <input type="time" value={quietFrom} onChange={(e) => setQuietFrom(e.target.value)}
                    className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    <Clock className="mr-1 inline h-3 w-3" />Until
                  </label>
                  <input type="time" value={quietTo} onChange={(e) => setQuietTo(e.target.value)}
                    className="w-full rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none" />
                </div>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">Days</p>
                <div className="flex gap-1.5">
                  {['MON','TUE','WED','THU','FRI','SAT','SUN'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleQuietDay(d)}
                      className={`rounded-lg border px-2 py-1.5 text-[10px] font-bold font-mono transition ${
                        quietDays.includes(d)
                          ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                          : 'border-white/8 bg-white/3 text-slate-500 hover:text-white'
                      }`}
                    >
                      {d.slice(0, 2)}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-600">
                ⚠️ CRITICAL alerts will still be delivered during quiet hours. Only MEDIUM and LOW are suppressed.
              </p>
            </div>
          </div>

          {/* Digest */}
          <div className="sc-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="sc-text-kicker">Alert Digest</p>
                <h2 className="mt-1 text-base font-bold text-white">Batched Summary</h2>
                <p className="mt-1 text-xs text-slate-500">Bundle low-priority alerts into a single digest report.</p>
              </div>
              <button type="button" onClick={() => setDigestEnabled((v) => !v)}>
                {digestEnabled
                  ? <ToggleRight className="h-6 w-6 text-sky-400" />
                  : <ToggleLeft  className="h-6 w-6 text-slate-600" />}
              </button>
            </div>
            {digestEnabled && (
              <div className="flex gap-2">
                {['Daily', 'Weekly', 'Monthly'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setDigestFrequency(f)}
                    className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition ${
                      digestFrequency === f
                        ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                        : 'border-white/8 bg-white/3 text-slate-500 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#0b1220]/80 px-5 py-3">
        <p className="text-xs font-mono text-slate-500">
          {enabledChannels} channel{enabledChannels !== 1 ? 's' : ''} active · {enabledEvents} event{enabledEvents !== 1 ? 's' : ''} subscribed · {chain.length}-step escalation
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setChannelConfigs(CHANNELS.reduce((acc, ch) => ({ ...acc, [ch.id]: { enabled: ch.id === 'email' } }), {}));
              setEventToggles(EVENT_TYPES.reduce((acc, et) => ({ ...acc, [et.id]: et.defaultOn }), {}));
              showToast({ type: 'info', message: 'Settings reset to defaults' });
            }}
            className="sc-button-secondary px-4 py-2 text-sm font-semibold"
          >
            <RefreshCw className="h-4 w-4" /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="sc-button-primary px-5 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
