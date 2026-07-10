import React from 'react';
import { ArrowRight, Shield, ShieldCheck, Activity, LayoutDashboard, Sparkles } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen sc-shell px-4 py-6 sm:px-6 lg:px-8 flex items-stretch">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[1.05fr_minmax(420px,0.8fr)] lg:gap-8 items-stretch">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-[#0b1220]/90 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.16),transparent_30%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-70" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div className="max-w-xl space-y-8">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 backdrop-blur">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 shadow-[0_10px_24px_rgba(37,99,235,0.35)]">
                  <Shield className="h-5 w-5  text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-[0.24em] text-white">SENTINEL<span className="text-sky-300">CORE</span></div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Enterprise Security Operations Platform</p>
                </div>
              </div>

              <div className="space-y-5">
                <p className="sc-text-kicker text-sky-300">Security command center</p>
                <h1 className="sc-title max-w-2xl text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
                  Enterprise
                  <br />
                  Security
                  <br />
                  <span className="sc-title-accent">Operations</span>
                  <br />
                  <span className="sc-title-accent">Platform</span>
                </h1>
                <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                  Unified threat monitoring, identity controls, and operational telemetry for teams that need a secure command plane without the visual noise.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-[#161b22]/90 p-4 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Threat Detection</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400">AI-assisted visibility across the control plane.</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#161b22]/90 p-4 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                    <Activity className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Incident Response</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Priority workflows and fast operational triage.</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#161b22]/90 p-4 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">RBAC Visibility</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Enterprise access surfaced with clarity.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                System status nominal
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                Low-noise enterprise UI
              </span>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-[30rem] rounded-[2rem] border border-white/8 bg-[#161b22]/96 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="sc-text-kicker text-sky-300">System access</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Authenticate to enter the command center</h2>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-300 sm:flex">
                <Shield className="h-6 w-20" />
              </div>
            </div>

            <div className="sc-scale-in">{children}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
