"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Zap, Layers, Loader2, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { runBacktest, BacktestResult } from "@/app/actions/market";
import { UserPreferenceConfig } from "@/app/actions/user";

interface AssetMap {
  id: string;
  category: string;
  defaultTicker: string;
  customTicker: string;
}

export function StrategyLab({
  initialConfig,
}: {
  initialConfig: UserPreferenceConfig;
}) {
  const [concentration, setConcentration] = useState(
    initialConfig.global.concentration,
  );
  const [maType, setMaType] = useState<"SMA" | "EMA">(
    initialConfig.global.maType,
  );
  const [maLength, setMaLength] = useState<10 | 12>(
    initialConfig.global.maLength,
  );
  const [benchmark, setBenchmark] = useState(
    initialConfig.portfolio.tickers.benchmark || "AOR",
  );

  const assets: AssetMap[] = [
    {
      id: "usStocks",
      category: "US Stocks",
      defaultTicker: "VTI",
      customTicker: initialConfig.portfolio.tickers.usStocks,
    },
    {
      id: "intlStocks",
      category: "Intl Stocks",
      defaultTicker: "VEU",
      customTicker: initialConfig.portfolio.tickers.intlStocks,
    },
    {
      id: "bonds",
      category: "Bonds",
      defaultTicker: "IEF",
      customTicker: initialConfig.portfolio.tickers.bonds,
    },
    {
      id: "realEstate",
      category: "Real Estate",
      defaultTicker: "VNQ",
      customTicker: initialConfig.portfolio.tickers.realEstate,
    },
    {
      id: "commodities",
      category: "Commodities",
      defaultTicker: "DBC",
      customTicker: initialConfig.portfolio.tickers.commodities,
    },
  ];

  const [results, setResults] = useState<BacktestResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const loadBacktest = useCallback(async () => {
    setCalculating(true);
    try {
      const data = await runBacktest({
        maType,
        maLength,
        concentration,
        benchmark,
        lookbackYears: 10,
      });
      setResults(data);
    } catch (error) {
      console.error("Backtest failed:", error);
    } finally {
      setCalculating(false);
    }
  }, [maType, maLength, concentration, benchmark]);

  useEffect(() => {
    loadBacktest();
  }, [loadBacktest]);

  const equityMax = useMemo(() => {
    if (!results) return 0;
    const stratMax = Math.max(...results.equityCurve.map((e) => e.value));
    const benchMax = Math.max(...results.benchmarkCurve.map((e) => e.value));
    return Math.max(stratMax, benchMax);
  }, [results]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar: Configuration Controls */}
      <div className="lg:col-span-3 space-y-6">
        <div className="glass-card p-6 rounded-[2rem] bg-indigo-500/5 border-indigo-500/10">
          <h2 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Settings2 size={16} /> Strategy Config
          </h2>

          <div className="space-y-6">
            {/* Trend Logic */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                Trend Logic
              </label>
              <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                {(["SMA", "EMA"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setMaType(type)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-[10px] font-black transition-all",
                      maType === type
                        ? "bg-indigo-500 text-white shadow-lg"
                        : "text-white/40 hover:text-white/60",
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Lookback */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                Lookback
              </label>
              <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                {([10, 12] as const).map((val) => (
                  <button
                    key={val}
                    onClick={() => setMaLength(val)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-[10px] font-black transition-all",
                      maLength === val
                        ? "bg-indigo-500 text-white shadow-lg"
                        : "text-white/40 hover:text-white/60",
                    )}
                  >
                    {val}M
                  </button>
                ))}
              </div>
            </div>

            {/* Concentration */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest flex justify-between">
                <span>Concentration</span>
                <span className="text-indigo-400">Top {concentration}</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[1, 2, 3, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setConcentration(val)}
                    className={cn(
                      "py-2 rounded-xl font-black text-xs transition-all border",
                      concentration === val
                        ? "bg-indigo-500 text-white border-indigo-400"
                        : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10",
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Benchmark */}
            <div className="space-y-2 pt-2 border-t border-indigo-500/10">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                Benchmark
              </label>
              <select
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-xs font-bold text-white/80 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer"
              >
                <option value="AOK">Conservative (AOK)</option>
                <option value="AOM">Moderate (AOM)</option>
                <option value="AOR">Growth (AOR)</option>
                <option value="AOA">Aggressive (AOA)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Asset Universe (Compact) */}
        <div className="glass-card p-6 rounded-[2rem]">
          <h2 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Layers size={16} /> Universe Map
          </h2>
          <div className="space-y-2">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                  {asset.category}
                </span>
                <span className="text-xs font-bold font-mono text-white/80">
                  {asset.customTicker}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content: Backtest Visuals */}
      <div className="lg:col-span-9 space-y-6">
        <div className="glass-card p-8 rounded-[2.5rem] bg-indigo-600/5 border-indigo-500/10 relative h-[500px] flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter">
                Strategy Performance
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <Zap size={14} className="text-indigo-400" />
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                  Live Simulation Engine
                </span>
              </div>
            </div>
            {calculating && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 text-indigo-300">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Updating...
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 w-full bg-black/20 rounded-3xl p-8 relative overflow-hidden mt-6">
            {results ? (
              <div className="relative w-full h-full flex items-end gap-[1px]">
                <div className="absolute inset-0 flex items-end gap-[1px] opacity-20">
                  {results.benchmarkCurve.slice(-60).map((point, i) => (
                    <div
                      key={`bench-${i}`}
                      className="flex-1 bg-white"
                      style={{ height: `${(point.value / equityMax) * 100}%` }}
                    />
                  ))}
                </div>
                {results.equityCurve.slice(-60).map((point, i) => (
                  <div
                    key={`strat-${i}`}
                    className="flex-1 bg-indigo-500/60 hover:bg-indigo-400 transition-colors group relative"
                    style={{ height: `${(point.value / equityMax) * 100}%` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 px-3 py-1.5 rounded-lg text-[10px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 font-mono shadow-2xl border border-white/10 pointer-events-none">
                      <span className="font-bold text-indigo-300">
                        ${point.value.toFixed(0)}
                      </span>
                      <span className="text-white/40 mx-2">vs</span>
                      <span className="text-white/60">
                        $
                        {results.benchmarkCurve.slice(-60)[i]?.value.toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            label="CAGR"
            value={results ? `${results.performance.cagr.toFixed(1)}%` : "--"}
            benchValue={
              results
                ? `${results.benchmarkPerformance.cagr.toFixed(1)}%`
                : "--"
            }
          />
          <StatCard
            label="Max DD"
            value={
              results ? `-${results.performance.maxDrawdown.toFixed(1)}%` : "--"
            }
            benchValue={
              results
                ? `-${results.benchmarkPerformance.maxDrawdown.toFixed(1)}%`
                : "--"
            }
            isNegative
          />
          <StatCard
            label="Vol"
            value={
              results ? `${results.performance.volatility.toFixed(1)}%` : "--"
            }
            benchValue={
              results
                ? `${results.benchmarkPerformance.volatility.toFixed(1)}%`
                : "--"
            }
            isVol
          />
          <StatCard
            label="Sharpe"
            value={results ? results.performance.sharpeRatio.toFixed(2) : "--"}
            benchValue={
              results
                ? results.benchmarkPerformance.sharpeRatio.toFixed(2)
                : "--"
            }
            isSharpe
          />
          <StatCard
            label="Sortino"
            value={results ? results.performance.sortinoRatio.toFixed(2) : "--"}
            benchValue={
              results
                ? results.benchmarkPerformance.sortinoRatio.toFixed(2)
                : "--"
            }
            isSortino
          />
        </div>
      </div>

      <AnimatePresence />
    </div>
  );
}

function StatCard({
  label,
  value,
  benchValue,
  isNegative,
  isSharpe,
  isSortino,
  isVol,
}: {
  label: string;
  value: string;
  benchValue: string;
  isNegative?: boolean;
  isSharpe?: boolean;
  isSortino?: boolean;
  isVol?: boolean;
}) {
  return (
    <div className="text-center bg-white/5 p-4 rounded-3xl border border-white/5 flex flex-col justify-between">
      <div className="text-[8px] text-white/30 uppercase font-black tracking-[0.2em] mb-2">
        {label}
      </div>
      <div
        className={cn(
          "text-lg font-black mb-1",
          isNegative
            ? "text-rose-400"
            : isSharpe
              ? "text-indigo-400"
              : isSortino
                ? "text-emerald-400"
                : isVol
                  ? "text-amber-400"
                  : "text-white",
        )}
      >
        {value}
      </div>
      <div className="text-[8px] font-bold text-white/20 uppercase">
        Bench: {benchValue}
      </div>
    </div>
  );
}
