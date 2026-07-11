import React from "react";
import { Radar } from "lucide-react";

const Threats = () => {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="glass-card border border-dark-border p-10 text-center max-w-lg">
        <Radar className="mx-auto h-14 w-14 text-red-500 mb-5" />

        <h1 className="text-3xl font-bold text-white mb-3">
          Threat Intelligence
        </h1>

        <p className="text-slate-400">
          This module is currently under development.
        </p>

        <div className="mt-6 inline-block rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-5 py-2 text-yellow-400 font-medium">
          🚧 Under Maintenance
        </div>
      </div>
    </div>
  );
};

export default Threats;