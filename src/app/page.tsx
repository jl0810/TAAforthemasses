"use client";

import React, { useEffect, useState } from "react";
import { SignalMatrix } from "@/components/dashboard/signal-matrix";
import { motion } from "framer-motion";
import {
  Rocket,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMarketSignals, MarketSignal } from "@/app/actions/market";
import { useSession } from "@/lib/auth-client";
import { LandingHero } from "@/components/dashboard/landing-hero";

export default function HomePage() {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maType, setMaType] = useState<"SMA" | "EMA">("SMA");

  useEffect(() => {
    async function loadSignals() {
      setLoading(true);
      setError(null);
      try {
        const data = await getMarketSignals(maType);
        setSignals(data);
      } catch (error) {
        console.error("Error loading signals:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load market data",
        );
      } finally {
        setLoading(false);
      }
    }
    loadSignals();
  }, [maType]);

  // Auth State
  const { data: session, isPending: isAuthPending } = useSession();

  // Aggregate Risk Level
  const riskOnCount = signals.filter((s) => s.status === "Risk-On").length;
  const isMarketStrong = riskOnCount >= 3;

  // Show Marketing Page if not logged in
  if (!isAuthPending && !session) {
    return <LandingHero />;
  }

  return (
    <div className="space-y-10 pb-10">
      {/* 🚀 COMEBACK ANNOUNCEMENT */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] p-8 bg-gradient-to-br from-emerald-500/20 via-indigo-500/20 to-purple-500/20 border-2 border-emerald-500/30"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.1),transparent)]" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center ring-2 ring-emerald-500/50">
              <Rocket className="text-emerald-400" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black font-outfit text-white tracking-tight">
                We&apos;re Back! 🎉
              </h3>
              <p className="text-white/60 text-sm mt-1">
                TAA for the Masses has been rebuilt from the ground up with
                real-time data, faster signals, and a sleek new interface.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold text-sm uppercase tracking-wider">
              Live Now
            </span>
          </div>
        </div>
      </motion.div>

      {/* Header / Hero */}
      <section className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-black font-outfit tracking-tighter text-white">
            Market Pulse
          </h1>
          <p className="text-white/40 mt-2 max-w-md text-sm md:text-base leading-relaxed">
            Quantitative regime detection based on the Meb Faber TAA framework.
            Protect your capital, harvest the trend.
          </p>
        </div>

        {/* Global Regime Indicator */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "glass-card p-6 rounded-[2rem] flex items-center gap-6 border-2",
            loading
              ? "border-white/10"
              : isMarketStrong
                ? "border-emerald-500/40"
                : "border-rose-500/40",
          )}
        >
          <div
            className={cn(
              "p-4 rounded-2xl",
              loading
                ? "bg-white/5 text-white/20"
                : isMarketStrong
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/20 text-rose-400",
            )}
          >
            {loading ? (
              <ShieldCheck className="animate-spin" />
            ) : isMarketStrong ? (
              <Rocket size={40} strokeWidth={2.5} />
            ) : (
              <AlertTriangle size={40} strokeWidth={2.5} />
            )}
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
              Current Regime
            </div>
            <div
              className={cn(
                "text-3xl font-black font-outfit tracking-tighter",
                loading
                  ? "text-white/10"
                  : isMarketStrong
                    ? "text-emerald-400"
                    : "text-rose-400",
              )}
            >
              {loading
                ? "FETCHING..."
                : isMarketStrong
                  ? "RISK ON"
                  : "RISK OFF"}
            </div>
            <div className="text-xs text-white/40 font-medium">
              Ivy 5 Coverage: {riskOnCount}/5 Leg Active
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Quickbar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Portfolio Survival",
            value: "99.4%",
            change: "+0.2%",
            icon: ShieldCheck,
          },
          {
            label: "Trend Strength",
            value: loading
              ? "..."
              : riskOnCount > 3
                ? "Very Strong"
                : "Moderate",
            change: "+12.4%",
            icon: TrendingUp,
          },
          {
            label: "Volatility",
            value: "Low",
            change: "-2.1%",
            icon: TrendingUp,
          },
          {
            label: "Rebalance Date",
            value: "6 Days",
            change: "Feb 1",
            icon: ShieldCheck,
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="glass-card p-4 rounded-3xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-white/5 text-white/60">
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">
                  {stat.value}
                </span>
                {stat.change && (
                  <span className="text-[10px] font-bold text-emerald-400">
                    {stat.change}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Main Signal Matrix */}
      <section>
        <SignalMatrix
          signals={signals}
          loading={loading}
          maType={maType}
          onToggleMA={setMaType}
        />
      </section>

      {/* Momentum Leaderboard */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <TrendingUp size={200} strokeWidth={1} />
          </div>
          <h3 className="text-2xl font-bold font-outfit text-white mb-6">
            Momentum Leaderboard
          </h3>
          <div className="space-y-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-white/5 rounded-2xl animate-pulse"
                  />
                ))
              : signals
                  .sort((a, b) => b.buffer - a.buffer)
                  .map((signal, i) => (
                    <div
                      key={signal.symbol}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs ring-1 ring-indigo-500/30">
                          {i + 1}
                        </div>
                        <span className="font-bold text-white">
                          {signal.symbol}
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="hidden md:block text-right">
                          <div className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">
                            Safety
                          </div>
                          <div className="text-white/80 font-mono text-xs">
                            {signal.buffer.toFixed(1)}%
                          </div>
                        </div>
                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500"
                            style={{
                              width: `${Math.min(Math.max(signal.buffer * 5, 0), 100)}%`,
                            }}
                          />
                        </div>
                        <ArrowUpRight
                          className="text-emerald-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                          size={20}
                        />
                      </div>
                    </div>
                  ))}
          </div>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] bg-indigo-600/10 border-indigo-500/20">
          <h3 className="text-xl font-bold text-white mb-4">
            Strategic Insight
          </h3>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            The current regime is dominant in{" "}
            {signals
              .filter((s) => s.status === "Risk-On")
              .slice(0, 2)
              .map((s) => s.name)
              .join(" and ")}
            . Fixed income components are monitored for trend shifts to pivot
            into safety assets.
          </p>
          <button className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm transition-all shadow-xl shadow-indigo-500/20 tracking-tighter uppercase">
            Optimization Lab
          </button>
        </div>
      </section>
    </div>
  );
}
