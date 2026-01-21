"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketSignal } from "@/app/actions/market";

interface SignalMatrixProps {
  signals: MarketSignal[];
  loading?: boolean;
}

export function SignalMatrix({ signals, loading }: SignalMatrixProps) {
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold font-outfit text-white">
          Ivy 5 Signal Matrix
        </h2>
        <div className="flex items-center gap-2 text-xs text-white/40 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-widest">
          <ShieldCheck size={14} />
          <span>
            {signals[0]?.lastUpdated === "DEMO"
              ? "Demo Mode"
              : `Last Rebalance: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {signals.map((signal, idx) => (
          <motion.div
            key={signal.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-5 rounded-3xl"
          >
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
                  "px-2 px-1 rounded-lg text-[10px] font-black uppercase tracking-tighter",
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
                <span className="text-xs text-white/40">10M SMA</span>
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
                <div className="mt-2 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(Math.max(Math.abs(signal.buffer) * 5, 5), 100)}%`,
                    }}
                    className={cn(
                      "h-full rounded-full",
                      signal.buffer > 0 ? "bg-emerald-500" : "bg-rose-500",
                    )}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
