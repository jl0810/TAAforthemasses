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
import { StrategyComparison } from "@/components/dashboard/strategy-comparison";
import { getUserPreferences, UserPreferenceConfig } from "@/app/actions/user";

export default function HomePage() {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [universe, setUniverse] = useState<"ivy" | "sectors">("ivy");
  const [initialConfig, setInitialConfig] =
    useState<UserPreferenceConfig | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const config = await getUserPreferences();
        setInitialConfig(config);
      } catch (e) {
        console.error("Failed to load user preferences:", e);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!initialConfig) return;

    async function loadSignals() {
      if (!initialConfig) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getMarketSignals(
          initialConfig.global.maType,
          initialConfig.global.maLength,
          universe,
        );
        setSignals(data);
      } catch (err) {
        console.error("Error loading signals:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load market data",
        );
      } finally {
        setLoading(false);
      }
    }
    loadSignals();
  }, [initialConfig, universe]);

  const { data: session, isPending: isAuthPending } = useSession();

  const riskOnCount = signals.filter((s) => s.status === "Risk-On").length;
  const isMarketStrong = riskOnCount >= 3;

  if (!isAuthPending && !session) {
    return <LandingHero />;
  }

  return (
    <div className="space-y-10 pb-10">
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

        <div className="flex flex-col gap-4">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 self-end">
            <button
              onClick={() => setUniverse("ivy")}
              className={cn(
                "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-tighter",
                universe === "ivy"
                  ? "bg-white/10 text-white shadow-xl"
                  : "text-white/30 hover:text-white/60",
              )}
            >
              Global AA
            </button>
            <button
              onClick={() => setUniverse("sectors")}
              className={cn(
                "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all tracking-tighter",
                universe === "sectors"
                  ? "bg-white/10 text-white shadow-xl"
                  : "text-white/30 hover:text-white/60",
              )}
            >
              Sectors
            </button>
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "glass-card p-6 rounded-[2rem] flex items-center gap-6 border-2 min-w-[300px]",
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
                {universe === "ivy" ? "Ivy 5" : "Sector"} Coverage:{" "}
                {riskOnCount}/{universe === "ivy" ? 5 : 9} Leg Active
              </div>
            </div>
          </motion.div>
        </div>
      </section>

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

      <section className="relative">
        <SignalMatrix
          signals={signals}
          loading={loading}
          maType={initialConfig?.global.maType || "SMA"}
          onToggleMA={() => {}}
        />
      </section>

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
            Current regime monitoring in{" "}
            {signals
              .filter((s) => s.status === "Risk-On")
              .slice(0, 2)
              .map((s) => s.name)
              .join(" and ") || "Cash"}
            . Trend shifts are tracked via{" "}
            {initialConfig?.global.maType || "SMA"} filters for timely defensive
            rotation.
          </p>
          <a
            href="/playground"
            className="block w-full py-4 text-center rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm transition-all shadow-xl shadow-indigo-500/20 tracking-tighter uppercase"
          >
            Optimization Lab
          </a>
        </div>
      </section>

      <section>
        {initialConfig && (
          <StrategyComparison
            initialConfig={initialConfig}
            universe={universe}
          />
        )}
      </section>
    </div>
  );
}
