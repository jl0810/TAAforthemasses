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
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Left: Configuration */}
      <div className="space-y-8">
        <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers size={20} className="text-indigo-400" />
              Asset Universe
            </h2>
            <button className="text-[10px] uppercase font-black tracking-widest text-white/20">
              Ivy 5 Core
            </button>
          </div>

          <div className="space-y-3 opacity-80">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5"
              >
                <div>
                  <div className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                    {asset.category}
                  </div>
                  <div className="text-sm font-bold text-white/80">
                    {asset.customTicker}
                  </div>
                </div>
                <div className="text-[10px] text-white/20 font-mono italic">
                  Primary Mapping
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings2 size={20} className="text-indigo-400" />
              Strategy Engine
            </h2>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                  Trend Logic
                </label>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                  {(["SMA", "EMA"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setMaType(type)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                        maType === type
                          ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                          : "text-white/40 hover:text-white/60",
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                  Time Window
                </label>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                  {([10, 12] as const).map((val) => (
                    <button
                      key={val}
                      onClick={() => setMaLength(val)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                        maLength === val
                          ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                          : "text-white/40 hover:text-white/60",
                      )}
                    >
                      {val}M
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                  Momentum Concentration
                </label>
                <div className="text-xs font-mono text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-full">
                  TOP {concentration}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setConcentration(val)}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-black text-sm transition-all border",
                      concentration === val
                        ? "bg-indigo-500 text-white border-indigo-400 shadow-xl shadow-indigo-500/20"
                        : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10",
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                Comparison Benchmark
              </label>
              <select
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white/80 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 appearance-none cursor-pointer"
              >
                <option value="AOK">Conservative (AOK)</option>
                <option value="AOM">Moderate (AOM)</option>
                <option value="AOR">Growth (AOR)</option>
                <option value="AOA">Aggressive (AOA)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Instant Backtester Results */}
      <div className="space-y-8">
        <div className="glass-card p-8 rounded-[2.5rem] bg-indigo-600/5 border-indigo-500/10 relative h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tighter">
                Backtest Deck
              </h2>
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                10-Year Simulation Engine
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
              <Zap size={24} className="text-white" fill="white" />
            </div>
          </div>

          <div className="flex-1 min-h-[350px] w-full bg-black/20 rounded-3xl p-8 relative">
            {calculating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-indigo-400" size={32} />
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                  Crunching Numbers...
                </span>
              </div>
            ) : results ? (
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
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 px-3 py-1.5 rounded-lg text-[10px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 font-mono shadow-2xl border border-white/10">
                      <div className="text-white/40 mb-1">{point.date}</div>
                      <div className="flex justify-between gap-4">
                        <span>Strategy:</span>
                        <span className="text-indigo-400 font-black">
                          ${point.value.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Bench:</span>
                        <span className="text-white/60">
                          $
                          {results.benchmarkCurve
                            .slice(-60)
                            [i]?.value.toFixed(1)}
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
                      Benchmark
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
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
                results
                  ? `-${results.performance.maxDrawdown.toFixed(1)}%`
                  : "--"
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
              value={
                results ? results.performance.sharpeRatio.toFixed(2) : "--"
              }
              benchValue={
                results
                  ? results.benchmarkPerformance.sharpeRatio.toFixed(2)
                  : "--"
              }
              isSharpe
            />
            <StatCard
              label="Sortino"
              value={
                results ? results.performance.sortinoRatio.toFixed(2) : "--"
              }
              benchValue={
                results
                  ? results.benchmarkPerformance.sortinoRatio.toFixed(2)
                  : "--"
              }
              isSortino
            />
          </div>
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
