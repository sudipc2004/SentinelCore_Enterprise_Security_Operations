import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BellRing,
  BookOpen,
  Bug,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileBarChart,
  FileText,
  LockKeyhole,
  Network,
  Radar,
  ScrollText,
  Server,
  Shield,
  ShieldCheck,
  Siren,
  Users,
} from 'lucide-react';
import hero from '../assets/hero.png';

const navItems = [
  { label: 'Modules', href: '#modules' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Security', href: '#security' },
];

const modules = [
  {
    title: 'Security Dashboard',
    description: 'Live security posture, operational metrics, and command center overview.',
    icon: Activity,
    accent: 'text-sky-300 bg-sky-500/10 border-sky-400/20',
  },
  {
    title: 'Alerts Management',
    description: 'Prioritize alerts by severity, source, and response status.',
    icon: BellRing,
    accent: 'text-red-300 bg-red-500/10 border-red-400/20',
  },
  {
    title: 'Incident Response',
    description: 'Track investigation progress, ownership, and resolution workflows.',
    icon: Siren,
    accent: 'text-orange-300 bg-orange-500/10 border-orange-400/20',
  },
  {
    title: 'Vulnerabilities',
    description: 'Manage findings, affected assets, severity, and remediation state.',
    icon: Bug,
    accent: 'text-amber-300 bg-amber-500/10 border-amber-400/20',
  },
  {
    title: 'Asset Management',
    description: 'Maintain inventory for devices, services, ownership, and health.',
    icon: Server,
    accent: 'text-cyan-300 bg-cyan-500/10 border-cyan-400/20',
  },
  {
    title: 'Threat Intelligence',
    description: 'Organize indicators, intelligence feeds, and threat context.',
    icon: Radar,
    accent: 'text-purple-300 bg-purple-500/10 border-purple-400/20',
  },
  {
    title: 'Security Logs',
    description: 'Explore events and logs for monitoring, auditing, and investigation.',
    icon: FileText,
    accent: 'text-blue-300 bg-blue-500/10 border-blue-400/20',
  },
  {
    title: 'Compliance',
    description: 'Map controls, review frameworks, and monitor governance coverage.',
    icon: ShieldCheck,
    accent: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/20',
  },
  {
    title: 'Audit Trails',
    description: 'Keep traceable records of account, access, and system activity.',
    icon: ScrollText,
    accent: 'text-teal-300 bg-teal-500/10 border-teal-400/20',
  },
  {
    title: 'Reports',
    description: 'Generate operational reports for risk, compliance, and leadership review.',
    icon: FileBarChart,
    accent: 'text-indigo-300 bg-indigo-500/10 border-indigo-400/20',
  },
  {
    title: 'Playbooks',
    description: 'Standardize response actions with guided security procedures.',
    icon: BookOpen,
    accent: 'text-lime-300 bg-lime-500/10 border-lime-400/20',
  },
  {
    title: 'Teams & Users',
    description: 'Coordinate people, roles, departments, and access permissions.',
    icon: Users,
    accent: 'text-pink-300 bg-pink-500/10 border-pink-400/20',
  },
];

const stats = [
  { label: 'Core Modules', value: '12+' },
  { label: 'Access Roles', value: '3' },
  { label: 'Live Events', value: 'WS' },
];

const securityHighlights = [
  {
    title: 'JWT Authentication',
    description: 'Every protected request is backed by token-based session control.',
    icon: LockKeyhole,
  },
  {
    title: 'Role-Based Access',
    description: 'Admin, analyst, and viewer experiences are separated by permission level.',
    icon: Users,
  },
  {
    title: 'Audit Trail',
    description: 'Important user and system activity can be tracked for accountability.',
    icon: ScrollText,
  },
  {
    title: 'Live Notifications',
    description: 'Security updates can reach the command center through real-time events.',
    icon: BellRing,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen sc-shell text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#080b14]/88 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-sky-300 shadow-[0_12px_28px_rgba(37,99,235,0.32)]">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-[0.22em] text-white">
                SENTINEL<span className="text-sky-300">CORE</span>
              </div>
              <p className="hidden text-[10px] uppercase tracking-[0.26em] text-slate-500 sm:block">
                Security Operations Platform
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-medium text-slate-400 transition hover:text-white">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link to="/login" className="sc-button-secondary px-4 py-2 text-sm font-semibold">
              Login
            </Link>
            <Link to="/register" className="sc-button-primary px-4 py-2 text-sm font-semibold">
              Register
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-16">
          <div className="space-y-8 sc-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Intelligence monitoring system
            </div>
            <div className="space-y-5">
              <h1 className="sc-title max-w-3xl text-4xl font-extrabold sm:text-5xl lg:text-6xl">
                One command center for modern security operations.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                SentinelCore centralizes alerts, incidents, assets, vulnerabilities, logs, reports, compliance, and team workflows into a focused cybersecurity platform.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/login" className="sc-button-primary px-5 py-3 text-sm font-semibold">
                Open Command Center
                <ChevronRight className="h-4 w-4" />
              </Link>
              <a href="#modules" className="sc-button-secondary px-5 py-3 text-sm font-semibold">
                View Modules
              </a>
            </div>
            <div className="grid max-w-lg grid-cols-3 gap-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <p className="text-2xl font-extrabold text-white">{item.value}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[28rem] overflow-hidden rounded-[2rem] border border-white/8 bg-[#0b1220]/78 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sc-scale-in">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.07)_1px,transparent_1px)] bg-[size:2.6rem_2.6rem] opacity-60" />
            <div className="relative z-10 grid h-full gap-4">
              <div className="flex items-center justify-between rounded-2xl border border-sky-400/15 bg-[#080b14]/86 p-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-300">Live Operations</p>
                  <h2 className="mt-2 text-xl font-bold text-white">Security Overview</h2>
                </div>
                <img src={hero} alt="" className="h-20 w-20 object-contain opacity-90" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-red-400/15 bg-red-500/8 p-4">
                  <BellRing className="h-6 w-6 text-red-300" />
                  <p className="mt-4 text-3xl font-extrabold text-white">24</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-red-200/70">Open Alerts</p>
                </div>
                <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/8 p-4">
                  <ClipboardCheck className="h-6 w-6 text-emerald-300" />
                  <p className="mt-4 text-3xl font-extrabold text-white">91%</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/70">Control Coverage</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Risk Activity</p>
                    <Activity className="h-4 w-4 text-sky-300" />
                  </div>
                  <div className="mt-5 flex h-24 items-end gap-2">
                    {[42, 68, 54, 84, 61, 92, 73].map((height, index) => (
                      <div key={height + index} className="flex-1 rounded-t-lg bg-gradient-to-t from-blue-700 to-sky-300" style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">Protected Flow</p>
                  <div className="mt-5 space-y-3 text-xs text-slate-300">
                    {['Users', 'Secure APIs', 'Services', 'MongoDB'].map((item) => (
                      <div key={item} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-sky-300" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="modules" className="border-y border-white/8 bg-[#0b1220]/42 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="sc-text-kicker text-sky-300">Core modules</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white">Built around security team workflows</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-400">
                Each module maps to a real security operation, from detection and triage to governance and reporting.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {modules.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-2xl border border-white/8 bg-[#161b22]/82 p-5 transition duration-200 hover:-translate-y-1 hover:border-sky-400/25 hover:bg-[#172033]">
                    <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${item.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="architecture" className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="rounded-2xl border border-white/8 bg-white/5 p-6">
            <LockKeyhole className="h-8 w-8 text-sky-300" />
            <h3 className="mt-5 text-lg font-bold text-white">Secure Access</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">JWT authentication and role-aware navigation protect the operational workspace.</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/5 p-6">
            <Network className="h-8 w-8 text-emerald-300" />
            <h3 className="mt-5 text-lg font-bold text-white">Service Driven</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">REST APIs separate frontend experiences from business logic and persistent data.</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/5 p-6">
            <Database className="h-8 w-8 text-cyan-300" />
            <h3 className="mt-5 text-lg font-bold text-white">Central Data Layer</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">Assets, incidents, audit records, users, reports, and logs stay organized in MongoDB.</p>
          </div>
        </section>

        <section id="security" className="border-y border-white/8 bg-[#0b1220]/42 py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="sc-text-kicker text-sky-300">Security layer</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white">Built-in controls for protected operations</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-400">
                SentinelCore keeps access, activity, and operational updates visible without crowding the workspace.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {securityHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-2xl border border-white/8 bg-[#161b22]/82 p-5">
                    <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-sky-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 rounded-[2rem] border border-white/8 bg-gradient-to-r from-blue-600/16 via-sky-500/10 to-emerald-500/12 p-6 sm:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="sc-text-kicker text-sky-200">Ready for operations</p>
                  <h2 className="mt-3 text-2xl font-extrabold text-white">Access the dashboard or create an analyst account.</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link to="/login" className="sc-button-primary px-5 py-3 text-sm font-semibold">Login</Link>
                  <Link to="/register" className="sc-button-secondary px-5 py-3 text-sm font-semibold">Register</Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8 bg-[#080b14]/82">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold tracking-[0.18em] text-white">© All rights reserved at sentinelcore.in || 2026</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <a href="#modules" className="transition hover:text-white">Modules</a>
            <a href="#architecture" className="transition hover:text-white">Architecture</a>
            <a href="#security" className="transition hover:text-white">Security</a>
            <Link to="/login" className="transition hover:text-white">Login</Link>
            <Link to="/register" className="transition hover:text-white">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
