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
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketSignal } from "@/app/actions/market";

export function AllocationCalculator({ signals }: { signals: MarketSignal[] }) {
  const [allocation, setAllocation] = useState(100000);

  const legs = signals.map((s) => ({
    ticker: s.symbol,
    name: s.name,
    signal: s.status === "Risk-On" ? "ON" : "OFF",
    price: s.price,
    trend: s.trend,
    buffer: s.buffer,
    target: "20%",
    amount: allocation * 0.2,
  }));

  const totalInvested = legs
    .filter((l) => l.signal === "ON")
    .reduce((acc, l) => acc + l.amount, 0);
  const totalInCash = legs
    .filter((l) => l.signal === "OFF")
    .reduce((acc, l) => acc + l.amount, 0);

  return (
    <div className="space-y-8">
      {/* Top Bar: Portfolio Controls */}
      <div className="flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 w-full glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Target size={20} />
            </div>
            <h3 className="font-black text-white text-sm uppercase tracking-tighter">
              Trading Capital (USD)
            </h3>
          </div>
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 text-3xl font-black transition-colors group-focus-within:text-emerald-500">
              $
            </div>
            <input
              type="number"
              value={allocation}
              onChange={(e) => setAllocation(Number(e.target.value))}
              className="w-full bg-black/40 border-2 border-white/5 hover:border-white/10 focus:border-emerald-500/50 transition-all rounded-[1.5rem] py-8 pl-14 pr-8 text-5xl font-black font-outfit text-white focus:outline-none placeholder:text-white/10"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="glass-card px-8 py-6 rounded-[2rem] bg-emerald-500/5 border-emerald-500/10 flex flex-col justify-center min-w-[180px]">
            <div className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest mb-1">
              Invested (Risk-On)
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              ${totalInvested.toLocaleString()}
            </div>
          </div>
          <div className="glass-card px-8 py-6 rounded-[2rem] bg-indigo-500/5 border-indigo-500/10 flex flex-col justify-center min-w-[180px]">
            <div className="text-[10px] font-black text-indigo-500/50 uppercase tracking-widest mb-1">
              Cash (Risk-Off)
            </div>
            <div className="text-2xl font-black text-indigo-400 font-mono">
              ${totalInCash.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Blotter */}
      <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 text-white/60">
              <Calculator size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Active Trade Blotter
              </h2>
              <p className="text-xs text-white/30 font-medium">
                Ivy 5 Strategy • 20% Equal Weight Rebalance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
              Live Signals
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest">
                  Execution Date
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest">
                  Asset / Ticker
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">
                  Quantity (Shares)
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest text-center">
                  Action
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">
                  Total Principal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {legs.map((leg) => (
                <tr
                  key={leg.ticker}
                  className="group hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="text-xs font-mono text-white/60">
                      {new Date().toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-10 h-10 flex items-center justify-center rounded-xl font-black text-[10px] transition-transform group-hover:scale-110",
                          leg.signal === "ON"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-white/5 text-white/40 border border-white/5",
                        )}
                      >
                        {leg.ticker}
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">
                          {leg.name}
                        </div>
                        <div className="text-[10px] text-white/40 font-mono tracking-tighter uppercase">
                          Market Price: ${leg.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="text-sm font-black text-white font-mono">
                      {leg.signal === "ON"
                        ? (leg.amount / leg.price).toFixed(2).toLocaleString()
                        : "0.00"}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg inline-block",
                        leg.signal === "ON"
                          ? "text-emerald-400 bg-emerald-400/5"
                          : "text-white/20 bg-white/5",
                      )}
                    >
                      {leg.signal === "ON" ? "BUY" : "HOLD CASH"}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div
                      className={cn(
                        "text-xl font-black font-outfit tracking-tighter",
                        leg.signal === "ON"
                          ? "text-emerald-400"
                          : "text-indigo-400/50",
                      )}
                    >
                      $
                      {leg.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-white/5 bg-white/[0.01] flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 text-white/30">
            <Info size={16} />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Rebalance logic calculated at month-end based on SMA10 crossover.
            </p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-tighter hover:bg-white/10 transition-all">
              <FileText size={18} />
              Export PDF
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-tighter hover:bg-white/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <ShieldCheck size={18} />
              Execute rebalance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
