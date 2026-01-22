"use client";

import React, { useState } from "react";
import {
  UserPreferenceConfig,
  updateUserPreferences,
  AvailableETF,
} from "@/app/actions/user";
import { Loader2, Save, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Props {
  initialConfig: UserPreferenceConfig;
  availableETFs: AvailableETF[];
}

export function ProfileSettings({ initialConfig, availableETFs }: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserPreferences(config);
      toast.success("Preferences saved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  }

  const etfsByCategory = availableETFs.reduce(
    (acc, etf) => {
      if (!acc[etf.category]) {
        acc[etf.category] = [];
      }
      acc[etf.category].push(etf);
      return acc;
    },
    {} as Record<string, AvailableETF[]>,
  );

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Portfolio Settings */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 bg-white/[0.02]">
        <div className="mb-8">
          <h2 className="text-2xl font-black font-outfit text-white tracking-tighter mb-2">
            My TAA Portfolio
          </h2>
          <p className="text-white/40 text-sm">
            Configure your official tracking tokens and rebalance schedule.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-white/5">
          <SelectGroup
            label="US Stocks"
            value={config.portfolio.tickers.usStocks}
            etfsByCategory={etfsByCategory}
            onChange={(v) =>
              setConfig({
                ...config,
                portfolio: {
                  ...config.portfolio,
                  tickers: { ...config.portfolio.tickers, usStocks: v },
                },
              })
            }
          />
          <SelectGroup
            label="Intl Stocks"
            value={config.portfolio.tickers.intlStocks}
            etfsByCategory={etfsByCategory}
            onChange={(v) =>
              setConfig({
                ...config,
                portfolio: {
                  ...config.portfolio,
                  tickers: { ...config.portfolio.tickers, intlStocks: v },
                },
              })
            }
          />
          <SelectGroup
            label="Bonds"
            value={config.portfolio.tickers.bonds}
            etfsByCategory={etfsByCategory}
            onChange={(v) =>
              setConfig({
                ...config,
                portfolio: {
                  ...config.portfolio,
                  tickers: { ...config.portfolio.tickers, bonds: v },
                },
              })
            }
          />
          <SelectGroup
            label="Real Estate"
            value={config.portfolio.tickers.realEstate}
            etfsByCategory={etfsByCategory}
            onChange={(v) =>
              setConfig({
                ...config,
                portfolio: {
                  ...config.portfolio,
                  tickers: { ...config.portfolio.tickers, realEstate: v },
                },
              })
            }
          />
          <SelectGroup
            label="Commodities"
            value={config.portfolio.tickers.commodities}
            etfsByCategory={etfsByCategory}
            onChange={(v) =>
              setConfig({
                ...config,
                portfolio: {
                  ...config.portfolio,
                  tickers: { ...config.portfolio.tickers, commodities: v },
                },
              })
            }
          />
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">
              Portfolio Rebalance
            </label>
            <select
              value={config.portfolio.rebalanceFrequency || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  portfolio: {
                    ...config.portfolio,
                    rebalanceFrequency: e.target.value as
                      | "Monthly"
                      | "Yearly"
                      | undefined,
                  },
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            >
              <option value="">
                Global Default ({config.global.rebalanceFrequency})
              </option>
              <option value="Monthly">Monthly Reset</option>
              <option value="Yearly">Yearly (Drift)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">
              Portfolio Trend Logic
            </label>
            <select
              value={config.portfolio.maType || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  portfolio: {
                    ...config.portfolio,
                    maType: (e.target.value as "SMA" | "EMA") || undefined,
                  },
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            >
              <option value="">Global Default ({config.global.maType})</option>
              <option value="SMA">SMA (Simple)</option>
              <option value="EMA">EMA (Exponential)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">
              Portfolio Lookback
            </label>
            <select
              value={config.portfolio.maLength || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  portfolio: {
                    ...config.portfolio,
                    maLength: e.target.value
                      ? (parseInt(e.target.value) as 10 | 12)
                      : undefined,
                  },
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            >
              <option value="">
                Global Default ({config.global.maLength}M)
              </option>
              <option value={10}>10 Months</option>
              <option value={12}>12 Months</option>
            </select>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">
              Strategy Start Date
            </label>
            <input
              type="date"
              value={config.portfolio.strategyStartDate || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  portfolio: {
                    ...config.portfolio,
                    strategyStartDate: e.target.value,
                  },
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            />
          </div>
          <SelectGroup
            label="Portfolio Benchmark"
            value={config.portfolio.tickers.benchmark}
            etfsByCategory={etfsByCategory}
            onChange={(v) =>
              setConfig({
                ...config,
                portfolio: {
                  ...config.portfolio,
                  tickers: { ...config.portfolio.tickers, benchmark: v },
                },
              })
            }
          />
        </div>
      </div>

      {/* Global Research Settings */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-white/10 bg-indigo-500/[0.02]">
        <div className="mb-8">
          <h2 className="text-2xl font-black font-outfit text-white tracking-tighter mb-2">
            Global Research Defaults
          </h2>
          <p className="text-white/40 text-sm">
            Default parameters used across the site for signals and research
            simulation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">
              MA Methodology
            </label>
            <select
              value={config.global.maType}
              onChange={(e) =>
                setConfig({
                  ...config,
                  global: {
                    ...config.global,
                    maType: e.target.value as "SMA" | "EMA",
                  },
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            >
              <option value="SMA">SMA (Simple)</option>
              <option value="EMA">EMA (Exponential)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">
              Lookback
            </label>
            <select
              value={config.global.maLength}
              onChange={(e) =>
                setConfig({
                  ...config,
                  global: {
                    ...config.global,
                    maLength: parseInt(e.target.value) as 10 | 12,
                  },
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            >
              <option value={10}>10 Months</option>
              <option value={12}>12 Months</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">
              Concentration
            </label>
            <select
              value={config.global.concentration}
              onChange={(e) =>
                setConfig({
                  ...config,
                  global: {
                    ...config.global,
                    concentration: parseInt(e.target.value),
                  },
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            >
              <option value={1}>Top 1 Asset</option>
              <option value={2}>Top 2 Assets</option>
              <option value={3}>Top 3 Assets</option>
              <option value={5}>Top 5 (Equal)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">
              Simulation Rebalance
            </label>
            <select
              value={config.global.rebalanceFrequency}
              onChange={(e) =>
                setConfig({
                  ...config,
                  global: {
                    ...config.global,
                    rebalanceFrequency: e.target.value as "Monthly" | "Yearly",
                  },
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
            >
              <option value="Monthly">Monthly Reset</option>
              <option value="Yearly">Yearly (Drift)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-3 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-sm uppercase tracking-tighter py-4 px-10 rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-indigo-500/20"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Save All Preferences
        </button>
      </div>
    </form>
  );
}

function SelectGroup({
  label,
  value,
  etfsByCategory,
  onChange,
}: {
  label: string;
  value: string;
  etfsByCategory: Record<string, AvailableETF[]>;
  onChange: (val: string) => void;
}) {
  const categoryOrder = [
    "US Stocks",
    "Intl Stocks",
    "Bonds",
    "Real Estate",
    "Commodities",
    "Cash",
    "Sector",
    "Factor",
    "Other",
  ];
  const sortedCategories = Object.keys(etfsByCategory).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b),
  );

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white transition-all font-mono font-medium cursor-pointer hover:bg-white/10"
        >
          {sortedCategories.map((category) => (
            <optgroup
              key={category}
              label={category}
              className="bg-slate-900 text-white"
            >
              {etfsByCategory[category].map((etf) => (
                <option
                  key={etf.symbol}
                  value={etf.symbol}
                  className="bg-slate-900 text-white py-2"
                >
                  {etf.symbol} - {etf.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
          <ChevronDown size={18} />
        </div>
      </div>
    </div>
  );
}
