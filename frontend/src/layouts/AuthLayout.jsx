import React from 'react';
import { Shield } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="w-full max-w-md glass-card p-8 border border-dark-border relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-primary/15 rounded-lg border border-primary/25 mb-3">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-white">SENTINEL<span className="text-primary font-light">CORE</span></h1>
          <p className="text-sm text-gray-400 mt-1">Enterprise Security Platform</p>
        </div>
        {children}
      </div>
    </div>
  );
}
