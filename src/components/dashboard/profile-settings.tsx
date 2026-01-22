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
      <div className="glass-card p-8 rounded-3xl border border-white/10">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">
            Strategy Configuration
          </h2>
          <p className="text-white/40 text-sm">
            Select the ETFs for each asset class in the Ivy 5 strategy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-white/5">
          <SelectGroup
            label="US Stocks"
            value={config.tickers.usStocks}
            etfsByCategory={etfsByCategory}
            onChange={(v) =>
              setConfig({
                ...config,
                tickers: { ...config.tickers, usStocks: v },
              })
            }
          />
          <SelectGroup
            label="Intl Stocks"
            value={config.tickers.intlStocks}
            etfsByCategory={etfsByCategory}
            onChange={(v) =>
              setConfig({
                ...config,
                tickers: { ...config.tickers, intlStocks: v },
              })
            }
          />
          <SelectGroup
            label="Bonds"
            value={config.tickers.bonds}
            etfsByCategory={etfsByCategory}
            onChange={(v) =>
              setConfig({ ...config, tickers: { ...config.tickers, bonds: v } })
            }
          />
          <SelectGroup
            label="Real Estate"
            value={config.tickers.realEstate}
            etfsByCategory={etfsByCategory}
            onChange={(v) =>
              setConfig({
                ...config,
                tickers: { ...config.tickers, realEstate: v },
              })
            }
          />
          <SelectGroup
            label="Commodities"
            value={config.tickers.commodities}
            etfsByCategory={etfsByCategory}
            onChange={(v) =>
              setConfig({
                ...config,
                tickers: { ...config.tickers, commodities: v },
              })
            }
          />
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Default Strategy Logic
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">
                Methodology
              </label>
              <select
                value={config.maType}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maType: e.target.value as "SMA" | "EMA",
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
                value={config.maLength}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maLength: parseInt(e.target.value) as 10 | 12,
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
                value={config.concentration}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    concentration: parseInt(e.target.value),
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
                Benchmark
              </label>
              <select
                value={config.tickers.benchmark}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    tickers: { ...config.tickers, benchmark: e.target.value },
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
              >
                <option value="AOK">Conservative (AOK)</option>
                <option value="AOM">Moderate (AOM)</option>
                <option value="AOR">Growth (AOR)</option>
                <option value="AOA">Aggressive (AOA)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">
                Rebalance
              </label>
              <select
                value={config.rebalanceFrequency}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    rebalanceFrequency: e.target.value as "Monthly" | "Yearly",
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

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Save Changes
          </button>
        </div>
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
