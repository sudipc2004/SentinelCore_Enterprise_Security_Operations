import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <section className="rounded-[2rem] border border-white/8 bg-[#161b22]/96 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:p-8">
          <Link to="/" className="mb-7 flex items-center justify-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-4 transition hover:border-sky-400/25">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-sky-300 shadow-[0_12px_28px_rgba(37,99,235,0.32)]">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold tracking-[0.22em] text-white">
                SENTINEL<span className="text-sky-300">CORE</span>
              </div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-slate-500">System Access</p>
            </div>
          </Link>

          <div className="mb-8 text-center">
            <p className="sc-text-kicker text-sky-300">Command center</p>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-white">Authenticate your session</h1>
          </div>
          <div className="sc-scale-in">{children}</div>
        </section>
      </div>
    </div>
  );
}
