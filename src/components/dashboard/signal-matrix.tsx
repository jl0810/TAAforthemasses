"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  History,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketSignal, SignalHistory } from "@/app/actions/market";

interface SignalMatrixProps {
  signals: MarketSignal[];
  loading?: boolean;
  maType: "SMA" | "EMA";
  onToggleMA: (type: "SMA" | "EMA") => void;
}

export function SignalMatrix({
  signals,
  loading,
  maType,
  onToggleMA,
}: SignalMatrixProps) {
  const [selectedAsset, setSelectedAsset] = React.useState<MarketSignal | null>(
    null,
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 opacity-50">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="glass-card p-5 rounded-3xl h-48 animate-pulse bg-white/5"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-semibold font-outfit text-white">
            Ivy 5 Signal Matrix
          </h2>
          <div className="flex items-center gap-2 mt-1 text-xs text-white/40 tracking-wider">
            <ShieldCheck size={12} />
            <span>
              {signals[0]?.lastUpdated === "DEMO"
                ? "Demo Mode"
                : `Last Rebalance: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            </span>
          </div>
        </div>

        {/* SMA/EMA Toggle */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => onToggleMA("SMA")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all tracking-widest",
              maType === "SMA"
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                : "text-white/40 hover:text-white/60",
            )}
          >
            SMA
          </button>
          <button
            onClick={() => onToggleMA("EMA")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all tracking-widest",
              maType === "EMA"
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                : "text-white/40 hover:text-white/60",
            )}
          >
            EMA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {signals.map((signal, idx) => (
          <motion.div
            key={signal.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => setSelectedAsset(signal)}
            className="glass-card p-5 rounded-3xl cursor-pointer hover:border-white/20 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-20 transition-opacity">
              <History size={16} />
            </div>

            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold text-white/30 tracking-tighter uppercase">
                  {signal.name}
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {signal.symbol}
                </h3>
              </div>
              <div
                className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter",
                  signal.status === "Risk-On"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30",
                )}
              >
                {signal.status}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs text-white/40">Price</span>
                <span className="text-lg font-mono font-medium">
                  ${signal.price.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs text-white/40">10M {maType}</span>
                <span className="text-sm font-mono text-white/60">
                  ${signal.trend.toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-white/40">
                    Buffer
                  </span>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-sm font-bold",
                      signal.buffer > 0 ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {signal.buffer > 0 ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    {signal.buffer > 0 ? "+" : ""}
                    {signal.buffer.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* History Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-2xl rounded-[2.5rem] p-8 relative max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-indigo-500/10"
          >
            <button
              onClick={() => setSelectedAsset(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-white/40 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="mb-8">
              <h3 className="text-3xl font-black font-outfit text-white tracking-tighter">
                {selectedAsset.symbol} History
              </h3>
              <p className="text-white/40 text-sm mt-1">
                Last 12 Monthly Trend Signals ({maType}-10)
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-white/30 border-b border-white/5">
                    <td className="py-4">Month</td>
                    <td className="py-4">Price</td>
                    <td className="py-4">{maType}</td>
                    <td className="py-4">Status</td>
                    <td className="py-4 text-right">Action</td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {selectedAsset.history.map((h, i) => (
                    <tr key={h.month} className="group hover:bg-white/[0.02]">
                      <td className="py-4 text-sm font-medium text-white/80">
                        {h.month}
                      </td>
                      <td className="py-4 text-sm font-mono text-white/60">
                        ${h.price.toFixed(2)}
                      </td>
                      <td className="py-4 text-sm font-mono text-white/40">
                        ${h.trend.toFixed(2)}
                      </td>
                      <td className="py-4">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-tight",
                            h.status === "Risk-On"
                              ? "text-emerald-400"
                              : "text-rose-400",
                          )}
                        >
                          {h.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter",
                            h.action === "Buy"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : h.action === "Sell"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : h.action === "Hold"
                                  ? "bg-indigo-500/10 text-indigo-400"
                                  : "text-white/20",
                          )}
                        >
                          {h.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/20">
              <span>Ivy 5 Quant Framework</span>
              <span>Proprietary Alpha Engine</span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
