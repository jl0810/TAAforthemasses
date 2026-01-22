"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { runBacktest, BacktestResult } from "@/app/actions/market";
import { UserPreferenceConfig } from "@/app/actions/user";

export function StrategyComparison({
  initialConfig,
}: {
  initialConfig: UserPreferenceConfig;
}) {
  const [lookback, setLookback] = useState<1 | 3 | 10>(10);
  const [results, setResults] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runBacktest({
        lookbackYears: lookback,
        rebalanceFrequency: initialConfig.rebalanceFrequency,
      });
      if (data.error) {
        setError(data.error);
        setResults(null);
      } else {
        setResults(data);
      }
    } catch (err) {
      console.error("Failed to load comparison data:", err);
      setError("Unable to connect to simulation engine.");
    } finally {
      setLoading(false);
    }
  }, [lookback, initialConfig.rebalanceFrequency]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const equityMax = useMemo(() => {
    if (!results) return 0;
    const stratMax = Math.max(...results.equityCurve.map((e) => e.value));
    const benchMax = Math.max(...results.benchmarkCurve.map((e) => e.value));
    return Math.max(stratMax, benchMax);
  }, [results]);

  const deltaCAGR = results
    ? results.performance.cagr - results.benchmarkPerformance.cagr
    : 0;
  const deltaDD = results
    ? results.performance.maxDrawdown - results.benchmarkPerformance.maxDrawdown
    : 0;

  return (
    <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
            <TrendingUp className="text-indigo-400" />
            Performance Delta
          </h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
            Strategy vs {initialConfig.tickers.benchmark || "AOR"} Benchmark
          </p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          {([1, 3, 10] as const).map((yr) => (
            <button
              key={yr}
              onClick={() => setLookback(yr)}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black transition-all",
                lookback === yr
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                  : "text-white/30 hover:text-white/60",
              )}
            >
              {yr}Y
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        {/* Comparison Metrics */}
        <div className="space-y-4">
          <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">
              Net Outperformance
            </div>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-xl",
                  deltaCAGR >= 0
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/20 text-rose-400",
                )}
              >
                {deltaCAGR >= 0 ? (
                  <ArrowUpRight size={20} />
                ) : (
                  <ArrowDownRight size={20} />
                )}
              </div>
              <div>
                <div className="text-3xl font-black text-white">
                  {deltaCAGR >= 0 ? "+" : ""}
                  {deltaCAGR.toFixed(1)}%
                </div>
                <div className="text-[10px] font-bold text-white/20 uppercase">
                  Annualized Delta
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">
              Risk Protection
            </div>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-xl",
                  deltaDD <= 0
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/20 text-rose-400",
                )}
              >
                {deltaDD <= 0 ? (
                  <ArrowUpRight size={20} />
                ) : (
                  <ArrowDownRight size={20} />
                )}
              </div>
              <div>
                <div className="text-3xl font-black text-white">
                  {deltaDD > 0 ? "+" : ""}
                  {deltaDD.toFixed(1)}%
                </div>
                <div className="text-[10px] font-bold text-white/20 uppercase">
                  Drawdown Reduction
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mini Comparison Chart */}
        <div className="lg:col-span-2 relative h-[240px] bg-black/20 rounded-3xl p-6 flex items-end gap-[2px]">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-400" size={24} />
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
              <AlertCircle className="text-indigo-400 mb-3" size={32} />
              <div className="text-white font-bold mb-1">Sim Data Syncing</div>
              <p className="text-[10px] text-white/40 uppercase font-black leading-relaxed max-w-[240px]">
                {error.includes("Insufficient")
                  ? "Historical data for this benchmark is still processing. Expected online shortly."
                  : error}
              </p>
            </div>
          ) : results ? (
            <div className="relative w-full h-full flex items-end gap-[1px]">
              {/* Benchmark Curve */}
              <div className="absolute inset-0 flex items-end gap-[1px] opacity-10">
                {results.benchmarkCurve.map((point, i) => (
                  <div
                    key={`b-${i}`}
                    className="flex-1 bg-white"
                    style={{ height: `${(point.value / equityMax) * 100}%` }}
                  />
                ))}
              </div>
              {/* Strategy Curve */}
              {results.equityCurve.map((point, i) => (
                <div
                  key={`s-${i}`}
                  className="flex-1 bg-indigo-500/40 hover:bg-indigo-400 transition-colors group relative"
                  style={{ height: `${(point.value / equityMax) * 100}%` }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 px-3 py-1.5 rounded-lg text-[10px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 font-mono shadow-2xl border border-white/10">
                    <div className="text-white/40 mb-1">{point.date}</div>
                    <div className="flex justify-between gap-4">
                      <span>TAA:</span>
                      <span className="text-indigo-400 font-black">
                        ${point.value.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="absolute top-0 right-0 flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">
                    Strategy
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">
                    Bench
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
