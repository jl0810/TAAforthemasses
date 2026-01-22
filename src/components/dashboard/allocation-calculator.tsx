"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Target,
  Calculator,
  DollarSign,
  Target as TargetIcon,
  FileText,
  TrendingUp,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketSignal } from "@/app/actions/market";

export function AllocationCalculator({
  signals,
  strategyStartDate,
  rebalanceFrequency,
}: {
  signals: MarketSignal[];
  strategyStartDate?: string;
  rebalanceFrequency?: "Monthly" | "Yearly";
}) {
  const [allocation, setAllocation] = useState(100000);

  // Filter history based on strategy start date and zip signals together
  const ledger = React.useMemo(() => {
    const allTrades: {
      dateLabel: string;
      ticker: string;
      name: string;
      price: number;
      trend: number;
      instruction: string;
      rationale: string;
      actionColor: string;
      status: string;
      amount: number;
      audit?: Record<string, unknown>;
    }[] = [];
    const cutoffDate = strategyStartDate
      ? new Date(strategyStartDate)
      : new Date(0);

    // Group assets by month to show a chronological rebalance log
    // We assume all assets have a common monthly history array
    const months = signals[0]?.history || [];

    // Iterate from newest to oldest
    for (let i = months.length - 1; i >= 0; i--) {
      const monthData = months[i];
      const monthDate = new Date(monthData.date);

      if (monthDate < cutoffDate) continue;

      signals.forEach((s) => {
        const hist = s.history[i];
        if (!hist) return;

        const prevHist = s.history[i - 1]; // Signal from previous month
        const isMonthlyRebalance = rebalanceFrequency === "Monthly";

        // Logic for "Instruction" & "Rationale"
        let instruction = "";
        let rationale = "";
        let actionColor = "";

        if (hist.status === "Risk-On") {
          if (!prevHist || prevHist.status === "Risk-Off") {
            instruction = "NEW BUY (ENTRY)";
            rationale = "10M Moving Average Crossover (Bullish)";
            actionColor = "text-emerald-400 bg-emerald-400/10";
          } else {
            // Check for monthly rebalance (Trim vs Add)
            if (isMonthlyRebalance) {
              const pricePerf = prevHist
                ? (hist.price - prevHist.price) / prevHist.price
                : 0;
              if (pricePerf > 0.02) {
                instruction = "SELL (TRIM WINNER)";
                rationale = `Portfolio Rebalance (+${(pricePerf * 100).toFixed(1)}% gain)`;
                actionColor = "text-rose-400 bg-rose-400/10";
              } else if (pricePerf < -0.02) {
                instruction = "BUY (TOP UP)";
                rationale = `Portfolio Rebalance (${(pricePerf * 100).toFixed(1)}% dip)`;
                actionColor = "text-emerald-400 bg-emerald-400/10";
              } else {
                instruction = "HOLD (BALANCED)";
                rationale = "Weight within tolerance bands";
                actionColor = "text-indigo-400 bg-indigo-400/10";
              }
            } else {
              instruction = "HOLD (NO RESET)";
              rationale = "Yearly tax-efficient drift active";
              actionColor = "text-white/40 bg-white/5";
            }
          }
        } else {
          if (prevHist?.status === "Risk-On") {
            instruction = "SELL (LIQUIDATE)";
            rationale = "10M Moving Average Crossover (Bearish)";
            actionColor = "text-rose-400 bg-rose-400/10";
          } else {
            instruction = "STAY CASH";
            rationale = "Asset remains below Trendline";
            actionColor = "text-white/20 bg-white/5";
          }
        }

        allTrades.push({
          dateLabel: hist.month,
          ticker: s.symbol,
          name: s.name,
          price: hist.price,
          trend: hist.trend,
          instruction,
          rationale,
          actionColor,
          status: hist.status,
          amount: allocation * 0.2, // Fixed 20% slice
          audit: s.audit
            ? { ...s.audit, price: hist.price, trend: hist.trend }
            : undefined,
        });
      });
    }

    return allTrades;
  }, [signals, allocation, strategyStartDate, rebalanceFrequency]);

  const currentMonthLegs = signals.map((s) => ({
    ticker: s.symbol,
    signal: s.status === "Risk-On" ? "ON" : "OFF",
    amount: allocation * 0.2,
  }));

  const totalInvested = currentMonthLegs
    .filter((l) => l.signal === "ON")
    .reduce((acc, l) => acc + l.amount, 0);
  const totalInCash = currentMonthLegs
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
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                Rebalance
              </span>
              <span className="text-xs font-mono text-emerald-400">
                {rebalanceFrequency || "Monthly"}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                Start Date
              </span>
              <span className="text-xs font-mono text-emerald-400">
                {strategyStartDate || "2026-01-01"}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                Live Signals
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest">
                  Date
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest">
                  Ticker
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">
                  Qty (Shares)
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest text-center">
                  Action
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest">
                  Rationale
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">
                  Total $ Principal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ledger.map((trade, idx) => (
                <React.Fragment
                  key={`${trade.dateLabel}-${trade.ticker}-${idx}`}
                >
                  <tr className="group hover:bg-white/[0.03] transition-colors border-l-4 border-l-transparent hover:border-l-emerald-500/50">
                    <td className="px-8 py-6">
                      <div className="text-xs font-mono text-white/60 uppercase">
                        {trade.dateLabel}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-xl font-black text-[10px] transition-transform group-hover:scale-110",
                            trade.status === "Risk-On"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-white/5 text-white/40 border border-white/5",
                          )}
                        >
                          {trade.ticker}
                        </div>
                        <div>
                          <div className="text-xs font-black text-white">
                            {trade.name}
                          </div>
                          <div className="text-[10px] text-white/40 font-mono tracking-tighter uppercase">
                            Price: ${trade.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="text-sm font-black text-white font-mono">
                        {trade.status === "Risk-On"
                          ? (trade.amount / trade.price).toFixed(2)
                          : "0.00"}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div
                        className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg inline-block whitespace-nowrap",
                          trade.actionColor,
                        )}
                      >
                        {trade.instruction}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="text-[10px] font-bold text-white/40 italic">
                        {trade.rationale}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div
                        className={cn(
                          "text-xl font-black font-outfit tracking-tighter leading-none",
                          trade.status === "Risk-On"
                            ? "text-emerald-400"
                            : "text-indigo-400/50",
                        )}
                      >
                        $
                        {trade.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-white/[0.01]">
                    <td colSpan={6} className="px-8 py-0">
                      <div className="flex items-center gap-6 py-4 border-t border-white/[0.02]">
                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2">
                          <Calculator size={10} />
                          Math Trace
                        </div>
                        <div className="flex gap-4">
                          <div className="text-[10px] text-white/40">
                            Price:{" "}
                            <span className="font-mono text-white">
                              ${trade.price.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-[10px] text-white/40">
                            Trend:{" "}
                            <span className="font-mono text-white">
                              ${trade.trend.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-[10px] text-white/40">
                            Buffer:{" "}
                            <span
                              className={cn(
                                "font-black font-mono",
                                trade.price > trade.trend
                                  ? "text-emerald-400"
                                  : "text-rose-400",
                              )}
                            >
                              {((trade.price / trade.trend - 1) * 100).toFixed(
                                2,
                              )}
                              %
                            </span>
                          </div>
                          <div className="text-[10px] text-white/20 font-mono italic">
                            (P / T) - 1 = Buffer
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-white/5 bg-white/[0.01] flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 text-white/30">
            <Info size={16} />
            <div className="flex flex-col">
              <p className="text-[10px] font-bold uppercase tracking-widest">
                Rebalance logic: Price vs SMA10 crossover computed at month-end.
              </p>
              <p className="text-[10px] text-white/20 font-medium">
                {rebalanceFrequency === "Yearly"
                  ? "Positions run for 1 year (drift) unless a signal flips. Yearly reset to equal-weight."
                  : "Per Ivy Portfolio rules, components are reset to equal weight (20%) monthly if signals remain Risk-On."}
              </p>
            </div>
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
