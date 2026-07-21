import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  X,
  Zap,
} from 'lucide-react';
import { useToast } from '../components/Toast';

// ─── Severity config ──────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  CRITICAL: { label: 'Critical', text: 'text-red-300',     border: 'border-red-500/25',     bg: 'bg-red-500/10',     dot: 'bg-red-400',     score: 4 },
  HIGH:     { label: 'High',     text: 'text-orange-300',  border: 'border-orange-500/25',  bg: 'bg-orange-500/10',  dot: 'bg-orange-400',  score: 3 },
  MEDIUM:   { label: 'Medium',   text: 'text-amber-300',   border: 'border-amber-500/25',   bg: 'bg-amber-500/10',   dot: 'bg-amber-400',   score: 2 },
  LOW:      { label: 'Low',      text: 'text-sky-300',     border: 'border-sky-500/25',     bg: 'bg-sky-500/10',     dot: 'bg-sky-400',     score: 1 },
  INFO:     { label: 'Info',     text: 'text-slate-300',   border: 'border-white/10',       bg: 'bg-white/5',        dot: 'bg-slate-500',   score: 0 },
};

const STATUS_CONFIG = {
  OPEN:        { label: 'Open',        text: 'text-red-300',     border: 'border-red-500/25',     bg: 'bg-red-500/10'     },
  IN_PROGRESS: { label: 'In Progress', text: 'text-amber-300',   border: 'border-amber-500/25',   bg: 'bg-amber-500/10'   },
  MITIGATED:   { label: 'Mitigated',   text: 'text-emerald-300', border: 'border-emerald-500/25', bg: 'bg-emerald-500/10' },
  ACCEPTED:    { label: 'Accepted',    text: 'text-slate-300',   border: 'border-white/10',       bg: 'bg-white/5'        },
};

// ─── Realistic mock data ──────────────────────────────────────────────────────
const MOCK_ASSETS = [
  { id: 'a1', name: 'PROD-DB-01',    type: 'DATABASE',   criticality: 'CRITICAL', ipAddress: '10.0.1.10' },
  { id: 'a2', name: 'PROD-WEB-01',   type: 'SERVER',     criticality: 'HIGH',     ipAddress: '10.0.1.11' },
  { id: 'a3', name: 'CORP-FW-01',    type: 'FIREWALL',   criticality: 'CRITICAL', ipAddress: '10.0.0.1'  },
  { id: 'a4', name: 'WKSTN-014',     type: 'ENDPOINT',   criticality: 'MEDIUM',   ipAddress: '10.0.2.14' },
  { id: 'a5', name: 'MGMT-SERVER',   type: 'SERVER',     criticality: 'HIGH',     ipAddress: '10.0.1.20' },
  { id: 'a6', name: 'CORP-ROUTER-01',type: 'ROUTER',     criticality: 'HIGH',     ipAddress: '10.0.0.2'  },
];

const MOCK_VULNERABILITIES = [
  {
    id: 'v001', cveId: 'CVE-2024-21413', title: 'Microsoft Outlook RCE via RTF Attachment',
    severity: 'CRITICAL', status: 'OPEN', cvssScore: 9.8,
    assetId: 'a1', assetName: 'PROD-DB-01',
    description: 'A remote code execution vulnerability exists in Microsoft Outlook when it fails to properly handle RTF files containing embedded OLE objects.',
    affectedComponent: 'Microsoft Outlook 2016-2021', discoveredAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    remediationUrl: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-21413',
    remediation: 'Apply Microsoft Security Update KB5034763 or later. Disable automatic RTF preview in Outlook settings.',
    dueAt: new Date(Date.now() + 86400000 * 2).toISOString(),
  },
  {
    id: 'v002', cveId: 'CVE-2024-38063', title: 'Windows TCP/IP Remote Code Execution',
    severity: 'CRITICAL', status: 'OPEN', cvssScore: 9.8,
    assetId: 'a2', assetName: 'PROD-WEB-01',
    description: 'An unauthenticated attacker could exploit a vulnerability in the Windows TCP/IP stack by sending specially crafted IPv6 packets.',
    affectedComponent: 'Windows Server 2019/2022 TCP/IP Stack', discoveredAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    remediationUrl: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-38063',
    remediation: 'Apply Windows August 2024 Patch Tuesday updates. Alternatively, disable IPv6 if not required.',
    dueAt: new Date(Date.now() + 86400000 * 1).toISOString(),
  },
  {
    id: 'v003', cveId: 'CVE-2024-3400', title: 'PAN-OS OS Command Injection (CISA KEV)',
    severity: 'CRITICAL', status: 'IN_PROGRESS', cvssScore: 10.0,
    assetId: 'a3', assetName: 'CORP-FW-01',
    description: 'A command injection vulnerability in the GlobalProtect feature of Palo Alto Networks PAN-OS allows an unauthenticated attacker to execute arbitrary OS commands.',
    affectedComponent: 'PAN-OS 10.2, 11.0, 11.1 — GlobalProtect Gateway', discoveredAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    remediationUrl: 'https://security.paloaltonetworks.com/CVE-2024-3400',
    remediation: 'Upgrade to PAN-OS 10.2.9-h1, 11.0.4-h1, or 11.1.2-h3 or later. Apply hotfix and enable Threat Prevention signatures.',
    dueAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'v004', cveId: 'CVE-2023-44487', title: 'HTTP/2 Rapid Reset DoS Attack',
    severity: 'HIGH', status: 'MITIGATED', cvssScore: 7.5,
    assetId: 'a2', assetName: 'PROD-WEB-01',
    description: 'The HTTP/2 protocol allows a denial of service because request cancellation can reset many streams quickly.',
    affectedComponent: 'Nginx 1.25.2 and below, Apache 2.4.57 and below', discoveredAt: new Date(Date.now() - 86400000 * 21).toISOString(),
    remediationUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2023-44487',
    remediation: 'Upgrade nginx to 1.25.3+ or Apache to 2.4.58+. Configure HTTP/2 connection and stream limits.',
    dueAt: new Date(Date.now() + 86400000 * 30).toISOString(),
  },
  {
    id: 'v005', cveId: 'CVE-2024-27198', title: 'JetBrains TeamCity Auth Bypass',
    severity: 'HIGH', status: 'OPEN', cvssScore: 9.8,
    assetId: 'a5', assetName: 'MGMT-SERVER',
    description: 'Authentication bypass vulnerability in JetBrains TeamCity allows unauthenticated attackers to gain admin access via specific REST API endpoints.',
    affectedComponent: 'JetBrains TeamCity before 2023.11.4', discoveredAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    remediationUrl: 'https://www.jetbrains.com/privacy-security/issues-fixed/CVE-2024-27198/',
    remediation: 'Upgrade to TeamCity 2023.11.4 or later. Apply security patch plugin if upgrade is not immediately possible.',
    dueAt: new Date(Date.now() + 86400000 * 3).toISOString(),
  },
  {
    id: 'v006', cveId: 'CVE-2024-1709', title: 'ConnectWise ScreenConnect Auth Bypass',
    severity: 'CRITICAL', status: 'OPEN', cvssScore: 10.0,
    assetId: 'a5', assetName: 'MGMT-SERVER',
    description: 'An authentication bypass vulnerability in ConnectWise ScreenConnect allows unauthenticated users to access ScreenConnect instances.',
    affectedComponent: 'ScreenConnect 23.9.7 and below', discoveredAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    remediationUrl: 'https://www.connectwise.com/company/trust/security-bulletins/connectwise-screenconnect-23.9.8',
    remediation: 'Upgrade to ScreenConnect 23.9.8 or later immediately. This is a CISA KEV tracked vulnerability.',
    dueAt: new Date(Date.now() + 86400000 * 1).toISOString(),
  },
  {
    id: 'v007', cveId: 'CVE-2024-21887', title: 'Ivanti Connect Secure Command Injection',
    severity: 'HIGH', status: 'IN_PROGRESS', cvssScore: 9.1,
    assetId: 'a6', assetName: 'CORP-ROUTER-01',
    description: 'A command injection vulnerability in web components of Ivanti Connect Secure allows authenticated admins to run arbitrary commands.',
    affectedComponent: 'Ivanti Connect Secure 9.x, 22.x', discoveredAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    remediationUrl: 'https://forums.ivanti.com/s/article/CVE-2024-21887',
    remediation: 'Apply Ivanti security patches for affected versions. Implement workaround mitigation XML file until patch is applied.',
    dueAt: new Date(Date.now() + 86400000 * 5).toISOString(),
  },
  {
    id: 'v008', cveId: 'CVE-2023-35078', title: 'Ivanti MobileIron Auth Bypass',
    severity: 'CRITICAL', status: 'MITIGATED', cvssScore: 10.0,
    assetId: 'a4', assetName: 'WKSTN-014',
    description: 'An authentication bypass vulnerability in Ivanti MobileIron (EPMM) allows unauthenticated remote actors to access specific restricted endpoints.',
    affectedComponent: 'Ivanti EPMM before 11.10.0.2', discoveredAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    remediationUrl: 'https://forums.ivanti.com/s/article/CVE-2023-35078-Remote-Unauthenticated-API-Access-Vulnerability',
    remediation: 'Upgrade EPMM to version 11.10.0.2 or later. Apply available patches and review access logs for exploitation indicators.',
    dueAt: new Date(Date.now() + 86400000 * 60).toISOString(),
  },
  {
    id: 'v009', cveId: 'CVE-2024-23897', title: 'Jenkins CLI Arbitrary File Read',
    severity: 'MEDIUM', status: 'OPEN', cvssScore: 6.5,
    assetId: 'a2', assetName: 'PROD-WEB-01',
    description: 'Jenkins CLI feature allows unauthenticated attackers to read arbitrary files on the Jenkins controller file system.',
    affectedComponent: 'Jenkins 2.441 and earlier, LTS 2.426.2 and earlier', discoveredAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    remediationUrl: 'https://www.jenkins.io/security/advisory/2024-01-24/',
    remediation: 'Upgrade Jenkins to 2.442 or LTS 2.426.3. Disable CLI access if not required.',
    dueAt: new Date(Date.now() + 86400000 * 14).toISOString(),
  },
  {
    id: 'v010', cveId: 'CVE-2024-30078', title: 'Windows WiFi Driver RCE',
    severity: 'HIGH', status: 'ACCEPTED', cvssScore: 8.8,
    assetId: 'a4', assetName: 'WKSTN-014',
    description: 'A remote code execution vulnerability in Windows WiFi Driver that allows an unauthenticated attacker to execute code on an affected system that has a WiFi adapter.',
    affectedComponent: 'Windows 10/11, Windows Server 2019/2022 — WiFi Driver', discoveredAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    remediationUrl: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-30078',
    remediation: 'Apply June 2024 Patch Tuesday update. Disable WiFi adapter if system only uses wired connections.',
    dueAt: new Date(Date.now() + 86400000 * 20).toISOString(),
  },
];

const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
const STATUSES   = ['ALL', 'OPEN', 'IN_PROGRESS', 'MITIGATED', 'ACCEPTED'];

// ─── Heatmap cell color based on severity count ───────────────────────────────
function heatColor(count, severity) {
  if (count === 0) return 'bg-white/3 text-slate-700';
  const colors = {
    CRITICAL: count >= 3 ? 'bg-red-500/80 text-white'    : count >= 2 ? 'bg-red-500/50 text-red-200'    : 'bg-red-500/25 text-red-300',
    HIGH:     count >= 3 ? 'bg-orange-500/70 text-white' : count >= 2 ? 'bg-orange-500/45 text-orange-200' : 'bg-orange-500/20 text-orange-300',
    MEDIUM:   count >= 3 ? 'bg-amber-500/60 text-white'  : count >= 2 ? 'bg-amber-500/40 text-amber-200'  : 'bg-amber-500/20 text-amber-300',
    LOW:      count >= 2 ? 'bg-sky-500/40 text-sky-200'  : 'bg-sky-500/20 text-sky-300',
    INFO:     'bg-white/8 text-slate-400',
  };
  return colors[severity] || 'bg-white/5 text-slate-500';
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const s = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.INFO;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-bold font-mono tracking-[0.15em] uppercase ${s.text} ${s.border} ${s.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold font-mono tracking-[0.15em] uppercase ${s.text} ${s.border} ${s.bg}`}>
      {s.label}
    </span>
  );
}

function CvssScore({ score }) {
  const color = score >= 9 ? 'text-red-400' : score >= 7 ? 'text-orange-400' : score >= 4 ? 'text-amber-400' : 'text-sky-400';
  return <span className={`font-mono font-bold text-sm ${color}`}>{score.toFixed(1)}</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Vulnerabilities() {
  const { showToast } = useToast();

  // In real deployment: fetch from GET /api/vulnerabilities
  // For now: use mock data (backend Vulnerability model + controller not yet built)
  const [vulns]  = useState(MOCK_VULNERABILITIES);
  const [assets] = useState(MOCK_ASSETS);

  // Filters
  const [search, setSearch]             = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [assetFilter, setAssetFilter]   = useState('');

  // Detail drawer
  const [selectedVuln, setSelectedVuln] = useState(null);

  // Heatmap expand
  const [heatmapExpanded, setHeatmapExpanded] = useState(true);

  // ── Derived data ────────────────────────────────────────────────────────
  const displayed = useMemo(() => {
    return vulns.filter((v) => {
      const q = search.toLowerCase();
      const searchMatch = !q
        || v.title?.toLowerCase().includes(q)
        || v.cveId?.toLowerCase().includes(q)
        || v.assetName?.toLowerCase().includes(q)
        || v.affectedComponent?.toLowerCase().includes(q);
      const sevMatch    = !severityFilter || v.severity === severityFilter;
      const statusMatch = statusFilter === 'ALL' || v.status === statusFilter;
      const assetMatch  = !assetFilter || v.assetId === assetFilter;
      return searchMatch && sevMatch && statusMatch && assetMatch;
    });
  }, [vulns, search, severityFilter, statusFilter, assetFilter]);

  // Summary stats
  const stats = useMemo(() => ({
    total:    vulns.length,
    open:     vulns.filter((v) => v.status === 'OPEN').length,
    critical: vulns.filter((v) => v.severity === 'CRITICAL').length,
    overdue:  vulns.filter((v) => v.dueAt && new Date(v.dueAt) < new Date() && v.status !== 'MITIGATED' && v.status !== 'ACCEPTED').length,
  }), [vulns]);

  // Heatmap: asset × severity → count
  const heatmapData = useMemo(() => {
    const map = {};
    assets.forEach((a) => { map[a.id] = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0, asset: a }; });
    vulns.forEach((v) => {
      if (map[v.assetId] && v.status !== 'MITIGATED' && v.status !== 'ACCEPTED') {
        map[v.assetId][v.severity] = (map[v.assetId][v.severity] || 0) + 1;
      }
    });
    return Object.values(map);
  }, [vulns, assets]);

  // Relative time / overdue helper
  const isOverdue = (dueAt, status) =>
    dueAt && new Date(dueAt) < new Date() && !['MITIGATED', 'ACCEPTED'].includes(status);

  const dueLabel = (dueAt) => {
    if (!dueAt) return '—';
    const diff = Math.floor((new Date(dueAt) - Date.now()) / 86400000);
    if (diff < 0)  return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Due today';
    return `Due in ${diff}d`;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 sc-fade-in">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="sc-panel p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="sc-badge border-pink-500/20 bg-pink-500/10 text-pink-300">Vulnerability Management</span>
          <span className="sc-badge border-white/10 bg-white/5 text-slate-300">CVE Findings</span>
          <span className="sc-badge border-amber-500/20 bg-amber-500/10 text-amber-300">⚠ Preview — Backend Pending</span>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white">Vulnerability Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Track CVE findings across your asset inventory, monitor severity heatmaps, and manage remediation timelines.
        </p>
      </div>

      {/* ── Summary stat cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Findings', value: stats.total,    icon: Bug,          color: 'text-white',        bg: 'bg-white/5',        border: 'border-white/8'        },
          { label: 'Open',           value: stats.open,     icon: ShieldAlert,  color: 'text-red-300',      bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
          { label: 'Critical',       value: stats.critical, icon: Zap,          color: 'text-red-300',      bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
          { label: 'Overdue',        value: stats.overdue,  icon: AlertTriangle,color: stats.overdue > 0 ? 'text-orange-300' : 'text-emerald-300', bg: stats.overdue > 0 ? 'bg-orange-500/10' : 'bg-emerald-500/10', border: stats.overdue > 0 ? 'border-orange-500/20' : 'border-emerald-500/20' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`sc-card flex items-center justify-between p-5 ${bg} ${border}`}>
            <div>
              <p className="sc-text-kicker">{label}</p>
              <h3 className={`mt-1 text-2xl font-bold ${color}`}>{value}</h3>
            </div>
            <Icon className={`h-6 w-6 ${color} opacity-40`} />
          </div>
        ))}
      </div>

      {/* ── Severity Heatmap ──────────────────────────────────────────────── */}
      <div className="sc-panel overflow-hidden">
        <button
          onClick={() => setHeatmapExpanded((v) => !v)}
          className="c-p flex w-full items-center justify-between border-b border-white/8 bg-white/3 px-6 py-4"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-orange-300" />
            <span className="text-sm font-bold text-white">Severity Heatmap per Asset</span>
            <span className="text-[10px] font-mono text-slate-500">(open + in-progress only)</span>
          </div>
          {heatmapExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {heatmapExpanded && (
          <div className="overflow-x-auto p-5">
            <table className="w-full border-collapse text-xs font-mono">
              <thead>
                <tr>
                  <th className="py-3 pr-6 text-left text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Asset</th>
                  <th className="py-3 pr-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Criticality</th>
                  {SEVERITIES.map((sev) => {
                    const s = SEVERITY_CONFIG[sev];
                    return (
                      <th key={sev} className={`py-3 px-4 text-center text-[10px] uppercase tracking-[0.15em] font-bold ${s.text}`}>
                        {s.label}
                      </th>
                    );
                  })}
                  <th className="py-3 pl-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {heatmapData.map(({ asset, ...counts }) => {
                  const total = SEVERITIES.reduce((sum, s) => sum + (counts[s] || 0), 0);
                  return (
                    <tr key={asset.id} className="transition-colors hover:bg-white/3">
                      <td className="py-3.5 pr-6">
                        <div>
                          <p className="font-semibold text-white">{asset.name}</p>
                          <p className="text-[10px] text-slate-500">{asset.type} · {asset.ipAddress}</p>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <SeverityBadge severity={asset.criticality} />
                      </td>
                      {SEVERITIES.map((sev) => {
                        const cnt = counts[sev] || 0;
                        return (
                          <td key={sev} className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => {
                                setSeverityFilter(sev);
                                setAssetFilter(asset.id);
                                setStatusFilter('ALL');
                              }}
                              className={`c-p h-9 w-12 rounded-xl text-xs font-bold transition hover:scale-110 hover:shadow-lg ${heatColor(cnt, sev)}`}
                              title={cnt > 0 ? `${cnt} ${sev} vuln${cnt > 1 ? 's' : ''} on ${asset.name} — click to filter` : '—'}
                            >
                              {cnt > 0 ? cnt : '—'}
                            </button>
                          </td>
                        );
                      })}
                      <td className="py-3.5 pl-4 text-right">
                        <span className={`font-bold ${total > 0 ? 'text-white' : 'text-slate-700'}`}>{total || '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-[10px] font-mono text-slate-600">
              💡 Click any cell to filter the findings list below by that asset + severity.
            </p>
          </div>
        )}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="sc-panel p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search CVE ID, title, asset, component..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full px-4 py-2.5 pl-10 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="c-p absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status chips */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`c-p rounded-xl border px-3 py-2 text-[10px] font-bold font-mono tracking-[0.15em] transition ${
                  statusFilter === s
                    ? 'border-sky-400/40 bg-sky-500/15 text-sky-300'
                    : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15'
                }`}
              >
                {s === 'ALL' ? 'All Status' : STATUS_CONFIG[s]?.label || s}
              </button>
            ))}
          </div>

          {/* Severity chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSeverityFilter('')}
              className={`c-p rounded-xl border px-3 py-2 text-[10px] font-bold font-mono tracking-[0.15em] transition ${
                !severityFilter ? 'border-sky-400/40 bg-sky-500/15 text-sky-300' : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15'
              }`}
            >
              All Sev
            </button>
            {SEVERITIES.map((sev) => {
              const s = SEVERITY_CONFIG[sev];
              return (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`c-p rounded-xl border px-3 py-2 text-[10px] font-bold font-mono tracking-[0.15em] transition ${
                    severityFilter === sev ? `${s.border} ${s.bg} ${s.text}` : 'border-white/8 bg-white/5 text-slate-400 hover:border-white/15'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Asset filter */}
          {assetFilter && (
            <button
              onClick={() => setAssetFilter('')}
              className="c-p flex items-center gap-1.5 rounded-xl border border-purple-500/25 bg-purple-500/10 px-3 py-2 text-[10px] font-bold font-mono text-purple-300 transition hover:bg-purple-500/20"
            >
              <X className="h-3 w-3" />
              {assets.find((a) => a.id === assetFilter)?.name || 'Asset'} filter
            </button>
          )}

          <span className="shrink-0 text-[10px] font-mono text-slate-500">
            {displayed.length} / {vulns.length}
          </span>
        </div>
      </div>

      {/* ── Findings Table ────────────────────────────────────────────────── */}
      <div className="sc-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/8 bg-white/3 px-6 py-3">
          <span className="text-xs font-mono font-semibold text-slate-300">
            CVE Findings ({displayed.length})
          </span>
        </div>

        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShieldCheck className="mb-3 h-10 w-10 text-emerald-400 animate-pulse" />
            <p className="text-sm font-mono text-slate-400">No vulnerabilities match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-white/3 text-[10px] uppercase font-mono tracking-[0.15em] text-slate-500">
                  <th className="py-3.5 px-5">CVE ID</th>
                  <th className="py-3.5 px-5">Title</th>
                  <th className="py-3.5 px-5">Severity</th>
                  <th className="py-3.5 px-5">CVSS</th>
                  <th className="py-3.5 px-5">Asset</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Due</th>
                  <th className="py-3.5 px-5 text-right">Remediation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono">
                {displayed
                  .sort((a, b) => (SEVERITY_CONFIG[b.severity]?.score || 0) - (SEVERITY_CONFIG[a.severity]?.score || 0))
                  .map((vuln) => {
                    const overdue = isOverdue(vuln.dueAt, vuln.status);
                    return (
                      <tr
                        key={vuln.id}
                        onClick={() => setSelectedVuln(vuln)}
                        className="cursor-pointer transition-colors hover:bg-white/3"
                        style={vuln.severity === 'CRITICAL' && vuln.status === 'OPEN' ? { borderLeft: '2px solid rgba(239,68,68,0.4)' } : {}}
                      >
                        <td className="py-4 px-5">
                          <span className="font-semibold text-sky-300">{vuln.cveId}</span>
                        </td>
                        <td className="py-4 px-5 max-w-[220px]">
                          <p className="font-semibold text-white truncate">{vuln.title}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{vuln.affectedComponent}</p>
                        </td>
                        <td className="py-4 px-5">
                          <SeverityBadge severity={vuln.severity} />
                        </td>
                        <td className="py-4 px-5">
                          <CvssScore score={vuln.cvssScore} />
                        </td>
                        <td className="py-4 px-5">
                          <p className="font-semibold text-slate-200">{vuln.assetName}</p>
                        </td>
                        <td className="py-4 px-5">
                          <StatusBadge status={vuln.status} />
                        </td>
                        <td className="py-4 px-5">
                          <span className={`text-[10px] font-bold ${overdue ? 'text-red-400' : 'text-slate-400'}`}>
                            {dueLabel(vuln.dueAt)}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={vuln.remediationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="c-p inline-flex items-center gap-1 rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1.5 text-[10px] font-bold text-sky-300 transition hover:bg-sky-500/25"
                            title="Open NVD / vendor advisory"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Advisory
                          </a>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail Drawer ─────────────────────────────────────────────────── */}
      {selectedVuln && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedVuln(null)} />
          <div
            className="w-full max-w-lg overflow-y-auto border-l border-white/8 bg-[#0b1220] sc-scale-in"
            style={{ boxShadow: '-24px 0 60px rgba(0,0,0,0.4)' }}
          >
            {/* Accent bar — coloured by severity */}
            <div
              className="h-1 w-full"
              style={{
                background: `linear-gradient(90deg, ${
                  selectedVuln.severity === 'CRITICAL' ? '#ef4444'
                  : selectedVuln.severity === 'HIGH'   ? '#f97316'
                  : selectedVuln.severity === 'MEDIUM' ? '#f59e0b'
                  : '#38bdf8'
                }, transparent)`,
              }}
            />

            <div className="space-y-5 p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={selectedVuln.severity} />
                    <StatusBadge status={selectedVuln.status} />
                    {isOverdue(selectedVuln.dueAt, selectedVuln.status) && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-300">
                        <AlertTriangle className="h-2.5 w-2.5" /> OVERDUE
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold leading-snug text-white">{selectedVuln.title}</h2>
                  <a
                    href={selectedVuln.remediationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono text-sky-400 hover:text-sky-300 transition"
                  >
                    {selectedVuln.cveId} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <button onClick={() => setSelectedVuln(null)} className="c-p mt-1 text-slate-400 transition hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* CVSS + meta */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'CVSS Score',    value: <CvssScore score={selectedVuln.cvssScore} /> },
                  { label: 'Asset',         value: <span className="font-semibold text-slate-200">{selectedVuln.assetName}</span> },
                  { label: 'Discovered',    value: new Date(selectedVuln.discoveredAt).toLocaleDateString() },
                  { label: 'Due Date',      value: <span className={isOverdue(selectedVuln.dueAt, selectedVuln.status) ? 'text-red-400 font-bold' : 'text-slate-200'}>{dueLabel(selectedVuln.dueAt)}</span> },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-white/8 bg-white/5 p-3">
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
                    <div className="text-xs font-mono">{value}</div>
                  </div>
                ))}
              </div>

              {/* Affected component */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Affected Component</p>
                <p className="rounded-xl border border-white/8 bg-white/5 p-3 text-xs font-mono text-slate-300">{selectedVuln.affectedComponent}</p>
              </div>

              {/* Description */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Description</p>
                <p className="rounded-xl border border-white/8 bg-white/5 p-3 text-xs leading-relaxed text-slate-300">{selectedVuln.description}</p>
              </div>

              {/* Remediation */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-400">Remediation Steps</p>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">{selectedVuln.remediation}</p>
                <a
                  href={selectedVuln.remediationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="c-p mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Official Advisory / Patch Notes
                </a>
              </div>

              {/* Escalate to incident */}
              <div className="border-t border-white/8 pt-3">
                <button
                  onClick={() => {
                    showToast({ type: 'success', message: `Vulnerability ${selectedVuln.cveId} escalated to Incident queue.` });
                    setSelectedVuln(null);
                  }}
                  className="c-p sc-button-primary w-full px-4 py-2.5 text-xs font-semibold"
                >
                  <Siren className="h-3.5 w-3.5" />
                  Escalate to Incident Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}