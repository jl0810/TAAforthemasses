import React from "react";
import { ShieldCheck } from "lucide-react";
import { AllocationCalculator } from "@/components/dashboard/allocation-calculator";
import { getMarketSignals } from "@/app/actions/market";
import { requireAuth } from "@/lib/auth";

export default async function CommandPage() {
  await requireAuth();
  const signals = await getMarketSignals();

  return (
    <div className="space-y-10 pb-20">
      <section>
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-4xl font-black font-outfit tracking-tighter text-white">
            Personal Command
          </h1>
        </div>
        <p className="text-white/40 max-w-xl text-sm leading-relaxed">
          Map your actual capital to high-conviction signals. Execute rebalances
          with precision and maintain your psychological safety buffer.
        </p>
      </section>

      <AllocationCalculator signals={signals} />
    </div>
  );
}
