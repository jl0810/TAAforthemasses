import React from "react";
import { FlaskConical } from "lucide-react";
import { StrategyLab } from "@/components/dashboard/strategy-lab";
import { requireAuth } from "@/lib/auth";

export default async function LabPage() {
  await requireAuth();
  return (
    <div className="space-y-10 pb-20">
      {/* Hero Header */}
      <section>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
            <FlaskConical size={32} />
          </div>
          <h1 className="text-4xl font-black font-outfit tracking-tighter text-white">
            Strategy Lab
          </h1>
        </div>
        <p className="text-white/40 max-w-xl text-sm leading-relaxed">
          The playground for your &quot;What If&quot; scenarios. Swap tickers,
          adjust concentration, and run instant backtests against historical
          fat-tail events.
        </p>
      </section>

      <StrategyLab />
    </div>
  );
}
