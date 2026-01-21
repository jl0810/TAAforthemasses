"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Target,
  Calculator,
  DollarSign,
  Target as TargetIcon,
  FileText,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AllocationCalculator() {
  const [allocation, setAllocation] = useState(100000);

  const legs = [
    {
      ticker: "VTI",
      name: "US Total Stock Market",
      signal: "ON",
      target: "20%",
      amount: allocation * 0.2,
    },
    {
      ticker: "VEA",
      name: "Developed Markets",
      signal: "ON",
      target: "20%",
      amount: allocation * 0.2,
    },
    {
      ticker: "GSG",
      name: "Commodity Index",
      signal: "ON",
      target: "20%",
      amount: allocation * 0.2,
    },
    {
      ticker: "VNQ",
      name: "US Real Estate",
      signal: "ON",
      target: "20%",
      amount: allocation * 0.2,
    },
    {
      ticker: "BND",
      name: "Long-Term Treasury",
      signal: "OFF",
      target: "20%",
      amount: allocation * 0.2,
      cashEquivalent: true,
    },
  ];

  const totalInvested = legs
    .filter((l) => l.signal === "ON")
    .reduce((acc, l) => acc + l.amount, 0);
  const totalInCash = legs
    .filter((l) => l.signal === "OFF")
    .reduce((acc, l) => acc + l.amount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Allocation Setup */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-card p-6 rounded-[2rem]">
          <div className="flex items-center gap-2 mb-6">
            <Target size={18} className="text-emerald-400" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              Portfolio Size
            </h3>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-2xl font-black">
              $
            </div>
            <input
              type="number"
              value={allocation}
              onChange={(e) => setAllocation(Number(e.target.value))}
              className="w-full bg-black/30 border-2 border-white/5 hover:border-emerald-500/30 transition-all rounded-3xl py-6 pl-10 pr-6 text-3xl font-black font-outfit focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="mt-6 p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
            <div className="text-xs font-bold text-white/40 uppercase tracking-widest">
              Active Risk
            </div>
            <div className="text-sm font-black text-emerald-400">
              Moderate (80/20)
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-[2rem] bg-indigo-500/5">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <TargetIcon size={18} className="text-indigo-400" />
            Strategy Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/40">Total TAA Capital</span>
              <span className="text-white font-mono">
                ${allocation.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/40">Invested Capital</span>
              <span className="text-emerald-400 font-mono font-bold">
                ${totalInvested.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/40">Cash Buffer</span>
              <span className="text-indigo-400 font-mono font-bold">
                ${totalInCash.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Trade Instructions */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Calculator size={24} className="text-emerald-400" />
              Trade Instructions
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-white/30 bg-white/5 px-4 py-2 rounded-xl">
              <Target size={14} />
              Ivy 5 Equal Weight (Target 20%)
            </div>
          </div>

          <div className="space-y-3">
            {legs.map((leg) => (
              <div
                key={leg.ticker}
                className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white/5 hover:bg-white/10 transition-all border border-white/5"
              >
                <div className="flex items-center gap-6">
                  <div
                    className={cn(
                      "w-12 h-12 flex items-center justify-center rounded-2xl font-black text-sm",
                      leg.signal === "ON"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400",
                    )}
                  >
                    {leg.ticker}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase">
                      {leg.name}
                    </div>
                    <div className="text-[10px] text-white/30 font-medium">
                      Monthly Status: {leg.signal}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <div className="text-[10px] text-white/30 uppercase font-black tracking-widest">
                      Target Weight
                    </div>
                    <div className="text-sm font-bold text-white">
                      {leg.target}
                    </div>
                  </div>
                  <div className="text-right min-w-[120px]">
                    <div className="text-[10px] text-white/30 uppercase font-black tracking-widest">
                      Instruction
                    </div>
                    <div
                      className={cn(
                        "text-xl font-black font-outfit",
                        leg.signal === "ON"
                          ? "text-emerald-400"
                          : "text-rose-400",
                      )}
                    >
                      {leg.signal === "ON"
                        ? `BUY $${leg.amount.toLocaleString()}`
                        : `HOLD CASH`}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-white/20" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-4">
            <button className="flex-1 flex items-center justify-center gap-3 py-5 rounded-3xl bg-white text-black font-black text-sm uppercase tracking-tighter hover:bg-white/90 transition-all">
              <FileText size={18} />
              Download Execution PDF
            </button>
            <button className="flex-1 flex items-center justify-center gap-3 py-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-sm uppercase tracking-tighter hover:bg-emerald-500/20 transition-all">
              <DollarSign size={18} />
              Mark as Executed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
