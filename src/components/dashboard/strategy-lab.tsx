"use client";

import React, { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { FlaskConical, Plus, Search, Zap, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssetMap {
  id: string;
  category: string;
  defaultTicker: string;
  customTicker: string;
}

const DEFAULT_ASSETS: AssetMap[] = [
  { id: "1", category: "US Stocks", defaultTicker: "VTI", customTicker: "VTI" },
  {
    id: "2",
    category: "Foreign Stocks",
    defaultTicker: "VEA",
    customTicker: "VEA",
  },
  { id: "3", category: "Bonds", defaultTicker: "BND", customTicker: "BND" },
  {
    id: "4",
    category: "Real Estate",
    defaultTicker: "VNQ",
    customTicker: "VNQ",
  },
  {
    id: "5",
    category: "Commodities",
    defaultTicker: "GSG",
    customTicker: "GSG",
  },
];

export function StrategyLab() {
  const [assets, setAssets] = useState<AssetMap[]>(DEFAULT_ASSETS);
  const [concentration, setConcentration] = useState(5); // Equal weight vs Top N

  const updateTicker = (id: string, value: string) => {
    setAssets(
      assets.map((a) =>
        a.id === id ? { ...a, customTicker: value.toUpperCase() } : a,
      ),
    );
  };

  const mockBars = useMemo(() => {
    return Array.from({ length: 40 }).map(
      (_, i) => Math.sin(i * 0.2) * 50 + 40 + (i % 5) * 4,
    );
  }, []);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Left: Ticker Mapping & Concentration */}
      <div className="space-y-8">
        <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers size={20} className="text-indigo-400" />
              Asset Mapping
            </h2>
            <button className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white/80 transition-all">
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5"
              >
                <div className="flex-1">
                  <div className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-1">
                    {asset.category}
                  </div>
                  <div className="text-sm font-bold text-white/80">
                    Default: {asset.defaultTicker}
                  </div>
                </div>
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
                    size={16}
                  />
                  <input
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-white"
                    value={asset.customTicker}
                    onChange={(e) => updateTicker(asset.id, e.target.value)}
                    placeholder="Enter Ticker..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              Concentration Controls
            </h2>
            <div className="text-xs font-mono text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-full uppercase">
              Current: Top {concentration}
            </div>
          </div>
          <p className="text-xs text-white/40 mb-8 leading-relaxed">
            Filter for only the highest-conviction momentum leaders. Focusing on
            the Top 3 instead of the full Ivy 5 often yields higher Sharpe
            ratios during bull phases.
          </p>

          <div className="flex items-center gap-4">
            {[1, 2, 3, 5].map((val) => (
              <button
                key={val}
                onClick={() => setConcentration(val)}
                className={cn(
                  "flex-1 py-4 rounded-2xl font-black text-sm transition-all border",
                  concentration === val
                    ? "bg-indigo-500 text-white border-indigo-400 shadow-xl shadow-indigo-500/20 scale-105"
                    : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10",
                )}
              >
                Top {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Instant Backtester Results */}
      <div className="space-y-8">
        <div className="glass-card p-8 rounded-[2.5rem] bg-indigo-600/5 border-indigo-500/10 relative h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Backtest Engine</h2>
              <span className="text-xs text-white/30 font-medium">
                Simulation against 15Y historical data
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
              <Zap size={24} className="text-white" fill="white" />
            </div>
          </div>

          {/* Chart Visualization */}
          <div className="flex-1 min-h-[300px] w-full bg-black/20 rounded-3xl p-6 relative flex items-end gap-1">
            {mockBars.map((barHeight, i) => (
              <div
                key={i}
                className="flex-1 bg-indigo-500/40 rounded-t-sm"
                style={{ height: `${barHeight}%` }}
              />
            ))}
            <div className="absolute inset-x-6 bottom-6 h-[2px] bg-white/10" />
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-indigo-500/20 border-t border-dashed border-indigo-500/30" />
            <div className="absolute top-1/4 right-8 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
              <div className="text-[8px] text-white/40 uppercase font-black tracking-widest">
                Covid Crash
              </div>
              <div className="text-[10px] text-emerald-400 font-bold">
                Stayed in Cash ✅
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center">
              <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">
                CAGR
              </div>
              <div className="text-xl font-black text-white">12.8%</div>
            </div>
            <div className="text-center border-x border-white/5">
              <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">
                Max DD
              </div>
              <div className="text-xl font-black text-rose-400">-8.2%</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1">
                Sharpe
              </div>
              <div className="text-xl font-black text-indigo-400">1.42</div>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence />
    </div>
  );
}
