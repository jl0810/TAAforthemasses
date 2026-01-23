"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Target,
  Calculator,
  FileText,
  Info,
  ArrowRightLeft,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketSignal } from "@/app/actions/market";

import {
  calculateSafetyBuffer,
  calculateRebalanceDrift,
  calculateEqualWeightAllocation,
} from "@/lib/taa-math";

export function AllocationCalculator({
  signals,
  strategyStartDate,
  rebalanceFrequency,
  concentration = 5,
}: {
  signals: MarketSignal[];
  strategyStartDate?: string;
  rebalanceFrequency?: "Monthly" | "Yearly";
  concentration?: number;
}) {
  const [allocation, setAllocation] = useState(100000);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter history based on strategy start date and zip signals together
  const ledger = React.useMemo(() => {
    const allTrades: {
      dateLabel: string;
      ticker: string;
      name: string;
      price: number;
      trend: number;
      side: "BUY" | "SELL" | "HOLD" | "-";
      qty: number;
      notional: number;
      rationale: string;
      status: string;
      actionColor: string;
      audit?: Record<string, unknown>;
    }[] = [];

    const cutoffDate = strategyStartDate
      ? new Date(strategyStartDate)
      : new Date(0);

    // Group assets by month to show a chronological rebalance log
    const months = signals[0]?.history || [];

    // Find the first month chronologically that meets the cutoff
    const startIdx = months.findIndex((m) => new Date(m.date) >= cutoffDate);
    if (startIdx === -1) return [];

    // Iterate from newest to oldest
    for (let i = months.length - 1; i >= startIdx; i--) {
      const monthData = months[i];
      const monthDate = new Date(monthData.date);

      signals.forEach((s) => {
        const hist = s.history[i];
        if (!hist) return;

        const isCurrentMonth = i === months.length - 1;
        const isStartMonth = i === startIdx;

        // In the blotter, for the current month, we only show what's Top-N OR result of a signal change
        if (isCurrentMonth && !s.isTopN && s.status === "Risk-On") return;

        // Force a fresh start for the very first month of the strategy
        const prevHist = isStartMonth ? null : s.history[i - 1];
        const isMonthlyRebalance = rebalanceFrequency === "Monthly";

        let side: "BUY" | "SELL" | "HOLD" | "-" = "-";
        let rationale = "";
        let actionColor = "";
        let targetNotional = 0;

        // TARGET ALLOCATION per slot
        const targetSlotSize = calculateEqualWeightAllocation(
          allocation,
          concentration,
        );

        if (hist.status === "Risk-On") {
          const isWinner = s.isTopN;

          if (!prevHist || prevHist.status === "Risk-Off") {
            // ENTRY SIGNAL
            if (isWinner) {
              side = "BUY";
              rationale = `Strategy Entry: Rank #${s.rank} (Top ${concentration})`;
              actionColor = "text-emerald-400 bg-emerald-400/10";
              targetNotional = targetSlotSize;
            } else {
              side = "-"; // Stay Cash / Monitor
              rationale = `Monitor: Rank #${s.rank} (Outside Top ${concentration})`;
              actionColor = "text-white/20 bg-white/5";
              targetNotional = 0;
            }
          } else {
            // ALREADY LONG
            if (!isWinner) {
              side = "SELL";
              rationale = `Exit: Rank #${s.rank} (Dropped from Top ${concentration})`;
              actionColor = "text-rose-400 bg-rose-400/10";
              targetNotional = 0; // Liquidate
            } else if (isMonthlyRebalance) {
              // REBALANCE / DRIFT CHECK
              const drift = prevHist
                ? calculateRebalanceDrift(hist.price, prevHist.price)
                : 0;

              if (Math.abs(drift) > 5.0) {
                // Trim or Top Up
                side = drift > 0 ? "SELL" : "BUY";
                rationale = `Rebalance: ${Math.abs(drift).toFixed(1)}% Drift vs Target`;
                actionColor =
                  drift > 0
                    ? "text-amber-400 bg-amber-400/10"
                    : "text-emerald-400 bg-emerald-400/10";
                targetNotional = targetSlotSize;
              } else {
                side = "HOLD";
                rationale = `Hold: Rank #${s.rank} • Drift (${
                  drift > 0 ? "+" : ""
                }${drift.toFixed(1)}%) < 5%`;
                actionColor = "text-indigo-400 bg-indigo-400/10";
                targetNotional = targetSlotSize;
              }
            } else {
              side = "HOLD";
              rationale = "Yearly Strategy • Ignore Mthly Drift";
              actionColor = "text-white/30 bg-white/5";
              targetNotional = targetSlotSize; // Implicitly holding previous value, but showing ideal target helps?
              // Actually for 'Yearly', we usually don't trade monthly.
            }
          }
        } else {
          // RISK OFF
          if (prevHist?.status === "Risk-On") {
            // EXIT SIGNAL
            side = "SELL";
            rationale = "Exit: Momentum Trend Break";
            actionColor =
              "text-rose-500 bg-rose-500/10 border border-rose-500/20";
            targetNotional = 0;
          } else {
            // STAY CASH
            side = "-";
            rationale = "Risk-Off Mode";
            actionColor = "text-white/20 bg-white/5";
            targetNotional = 0;
          }
        }

        // Filter logic: Only add actionable items (BUY or SELL)
        if (side === "BUY" || side === "SELL") {
          allTrades.push({
            dateLabel: hist.month,
            ticker: s.symbol,
            name: s.name,
            price: hist.price,
            trend: hist.trend,
            side,
            qty: targetNotional > 0 ? targetNotional / hist.price : 0,
            notional: targetNotional,
            rationale,
            actionColor,
            status: hist.status,
            audit: s.audit
              ? { ...s.audit, price: hist.price, trend: hist.trend }
              : undefined,
          });
        }
      });
    }

    const fullLedger = allTrades;

    if (!searchTerm) return fullLedger;
    return fullLedger.filter(
      (t) =>
        t.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [
    signals,
    allocation,
    strategyStartDate,
    rebalanceFrequency,
    concentration,
    searchTerm,
  ]);

  // Always calculate totals from the full unfiltered history to keep metrics accurate
  const totalInvested = React.useMemo(() => {
    // We need the full list of current month's active holdings
    const latestMonth =
      signals[0]?.history[signals[0].history.length - 1]?.month;
    return signals
      .filter((s) => s.isTopN && s.status === "Risk-On")
      .reduce((acc) => acc + allocation / concentration, 0);
  }, [signals, allocation, concentration]);
  // Calculate cash based on what ISN'T allocated
  const totalInCash = allocation - totalInvested;

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
              type="text"
              value={allocation.toLocaleString()}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                if (val === "") {
                  setAllocation(0);
                } else {
                  setAllocation(Math.min(Number(val), 1000000000)); // Cap at 1B for safety
                }
              }}
              className="w-full bg-black/40 border-2 border-white/5 hover:border-white/10 focus:border-emerald-500/50 transition-all rounded-[1.5rem] py-8 pl-14 pr-8 text-5xl font-black font-outfit text-white focus:outline-none placeholder:text-white/10"
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="glass-card px-8 py-6 rounded-[2rem] bg-emerald-500/5 border-emerald-500/10 flex flex-col justify-center min-w-[200px]">
            <div className="text-[11px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-2">
              risk-on allocation
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono">
              $
              {totalInvested.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
          <div className="glass-card px-8 py-6 rounded-[2rem] bg-indigo-500/5 border-indigo-500/10 flex flex-col justify-center min-w-[200px]">
            <div className="text-[11px] font-black text-indigo-500/60 uppercase tracking-[0.2em] mb-2">
              risk-off cash
            </div>
            <div className="text-3xl font-black text-indigo-400 font-mono">
              $
              {totalInCash.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Blotter */}
      <div className="glass-card rounded-[2.5rem] overflow-hidden border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-2xl bg-white/5 text-white/60 border border-white/10">
              <Calculator size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight leading-none mb-1">
                Personal Portfolio Blotter
              </h2>
              <p className="text-[11px] text-white/30 font-bold uppercase tracking-wider">
                Target: Top {concentration} Momentum
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full group">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors"
              />
              <input
                type="text"
                placeholder="Search ticker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/40 border border-white/5 hover:border-white/10 focus:border-indigo-500/30 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none transition-all placeholder:text-white/10 font-medium"
              />
            </div>
            <div className="hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 whitespace-nowrap">
              <ArrowRightLeft size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.15em]">
                {rebalanceFrequency}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-5 text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">
                  Time
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">
                  Symbol
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-white/40 uppercase tracking-[0.25em] text-center">
                  Side
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-white/40 uppercase tracking-[0.25em] text-right">
                  Qty
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-white/40 uppercase tracking-[0.25em] text-right">
                  Price
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-white/40 uppercase tracking-[0.25em] text-right">
                  Notional
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-white/40 uppercase tracking-[0.25em] text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {ledger.map((trade, idx) => (
                <React.Fragment
                  key={`${trade.dateLabel}-${trade.ticker}-${idx}`}
                >
                  <tr className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-6">
                      <div className="text-xs font-mono text-white/40 group-hover:text-white/60 transition-colors">
                        {trade.dateLabel}
                      </div>
                    </td>
                    <td className="px-6 py-6 font-black text-base text-white tracking-tight">
                      {trade.ticker}
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span
                        className={cn(
                          "inline-block px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border transition-all shadow-sm",
                          trade.side === "BUY"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5 group-hover:bg-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5 group-hover:bg-rose-500/20",
                        )}
                      >
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="font-mono text-sm text-white/80 tabular-nums">
                        {trade.qty.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="font-mono text-sm text-white/80 tabular-nums">
                        $
                        {trade.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="font-mono text-sm font-black text-white tabular-nums tracking-tighter">
                        $
                        {trade.notional.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex justify-center gap-2">
                        {/* Subtle Action placeholders or mini-indicators */}
                        <div className="w-2 h-2 rounded-full bg-white/10 group-hover:bg-indigo-500/40 transition-colors" />
                      </div>
                    </td>
                  </tr>
                  {/* Math Trace Row (Expandable or always visible for audit?) - Kept subtle */}
                  <tr className="bg-white/[0.02]">
                    <td colSpan={7} className="px-8 py-4">
                      <div className="flex flex-wrap gap-y-3 gap-x-12 items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                            Logic Origin:
                          </span>
                          <span className="text-[10px] font-bold text-white/50 uppercase tracking-tight">
                            {trade.rationale}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                            Safety Buffer:
                          </span>
                          <span
                            className={cn(
                              "text-xs font-mono font-black",
                              calculateSafetyBuffer(trade.price, trade.trend) >
                                0
                                ? "text-emerald-500/60"
                                : "text-rose-500/60",
                            )}
                          >
                            {calculateSafetyBuffer(
                              trade.price,
                              trade.trend,
                            ).toFixed(2)}
                            %
                          </span>
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
        <div className="p-6 border-t border-white/5 bg-white/[0.01] flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col gap-1 items-start text-white/30">
            <div className="flex items-center gap-2">
              <Info size={12} />
              <p className="text-[10px] font-medium uppercase tracking-tighter">
                Portfolio Audit Trace
              </p>
            </div>
            <p className="text-[9px] font-medium leading-tight max-w-sm">
              Simulation assumes T+0 execution.{" "}
              <span className="text-amber-500/50 font-bold">
                NOT FINANCIAL ADVICE:
              </span>{" "}
              Indicators are for backtesting research only. Quantitative
              strategies involve market risk.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
              <FileText size={14} />
              Export CSV
            </button>
            <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-white/90 transition-all shadow-lg shadow-white/10">
              <ShieldCheck size={14} />
              Commit Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
