"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Target,
  Calculator,
  FileText,
  Info,
  ArrowRightLeft,
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

    // Iterate from newest to oldest
    for (let i = months.length - 1; i >= 0; i--) {
      const monthData = months[i];
      const monthDate = new Date(monthData.date);

      if (monthDate < cutoffDate) continue;

      signals.forEach((s) => {
        const hist = s.history[i];
        if (!hist) return;

        const isCurrentMonth = i === months.length - 1;
        // In the blotter, for the current month, we only show what's Top-N OR result of a signal change
        if (isCurrentMonth && !s.isTopN && s.status === "Risk-On") return;

        const prevHist = s.history[i - 1]; // Signal from previous month
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
              rationale = `Entry: Rank #${s.rank} (Top ${concentration})`;
              actionColor = "text-emerald-400 bg-emerald-400/10";
              targetNotional = targetSlotSize;
            } else {
              side = "-"; // Stay Cash / Monitor
              rationale = "Momentum positive but outside Top N";
              actionColor = "text-white/20 bg-white/5";
              targetNotional = 0;
            }
          } else {
            // ALREADY LONG
            if (!isWinner) {
              side = "SELL";
              rationale = `Exit: Dropped from Top ${concentration} (Rank #${s.rank})`;
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
                rationale = `Rebal: ${Math.abs(drift).toFixed(1)}% Drift`;
                actionColor =
                  drift > 0
                    ? "text-amber-400 bg-amber-400/10" // Sell trim is warning/amber
                    : "text-emerald-400 bg-emerald-400/10";
                targetNotional = targetSlotSize;
              } else {
                side = "HOLD";
                rationale = `Trend #${s.rank} • Drift < 5%`;
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

        // Only add actionable items or active Top-N holds
        const isActionable = side !== "-" && side !== "HOLD";
        const isHolding = side === "HOLD" || (side === "BUY" && !prevHist);

        // Filter logic: Show if actionable OR it's a current holding we care about
        if (isActionable || (isHolding && s.isTopN)) {
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

    return allTrades;
  }, [
    signals,
    allocation,
    strategyStartDate,
    rebalanceFrequency,
    concentration,
  ]);

  const totalInvested = ledger
    .filter(
      (t) =>
        t.dateLabel ===
          signals[0]?.history[signals[0].history.length - 1]?.month &&
        (t.side === "BUY" || t.side === "HOLD"),
    )
    .reduce((acc, t) => acc + t.notional, 0);

  // Calculate cash based on what ISN'T allocated
  // Ideally this equals allocation - totalInvested
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
              risk-on allocation
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              $
              {totalInvested.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
          <div className="glass-card px-8 py-6 rounded-[2rem] bg-indigo-500/5 border-indigo-500/10 flex flex-col justify-center min-w-[180px]">
            <div className="text-[10px] font-black text-indigo-500/50 uppercase tracking-widest mb-1">
              risk-off cash
            </div>
            <div className="text-2xl font-black text-indigo-400 font-mono">
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
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 text-white/60">
              <Calculator size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Institutional Trade Blotter
              </h2>
              <p className="text-xs text-white/30 font-medium">
                Generated based on Top {concentration} Momentum Rank
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <ArrowRightLeft size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                {rebalanceFrequency} Rebalance
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-widest">
                  Date
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-widest">
                  Side
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-widest">
                  Asset
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-widest text-right">
                  Qty
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-widest text-right">
                  Price
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-widest text-right">
                  Notional
                </th>
                <th className="px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-widest">
                  Rationale
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ledger.map((trade, idx) => (
                <React.Fragment
                  key={`${trade.dateLabel}-${trade.ticker}-${idx}`}
                >
                  <tr className="group hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-xs font-mono text-white/60">
                        {trade.dateLabel}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded",
                          trade.side === "BUY" && "bg-emerald-500 text-black",
                          trade.side === "SELL" && "bg-rose-500 text-white",
                          trade.side === "HOLD" && "bg-white/10 text-white/50",
                        )}
                      >
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="font-black text-xs text-white">
                          {trade.ticker}
                        </div>
                        <div className="text-[10px] text-white/30 truncate max-w-[100px]">
                          {trade.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono text-xs text-white/70">
                        {trade.qty.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono text-xs text-white/70">
                        ${trade.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div
                        className={cn(
                          "font-mono text-xs font-bold",
                          trade.side === "SELL"
                            ? "text-rose-400"
                            : "text-emerald-400",
                        )}
                      >
                        $
                        {trade.notional.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[10px] font-medium text-white/40 italic">
                        {trade.rationale}
                      </div>
                    </td>
                  </tr>
                  {/* Math Trace Row (Expandable or always visible for audit?) - Kept subtle */}
                  <tr className="bg-black/20">
                    <td
                      colSpan={7}
                      className="px-6 py-2 border-b border-white/[0.03]"
                    >
                      <div className="flex gap-6 items-center opacity-50 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-white/20 uppercase">
                            Trend Math:
                          </span>
                          <span className="text-[10px] font-mono text-white/60">
                            MA: ${trade.trend.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-white/20 uppercase">
                            Safety Buffer:
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-mono",
                              calculateSafetyBuffer(trade.price, trade.trend) >
                                0
                                ? "text-emerald-500"
                                : "text-rose-500",
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
          <div className="flex items-center gap-3 text-white/30">
            <Info size={14} />
            <p className="text-[10px] font-medium">
              Simulation assumes T+0 execution at Month-End Adjusted Close.
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
