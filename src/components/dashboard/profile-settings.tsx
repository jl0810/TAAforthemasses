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

  // Group ETFs by category for the dropdown
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              setConfig({
                ...config,
                tickers: { ...config.tickers, bonds: v },
              })
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

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
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
  // Order categories logically
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
          className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono font-medium cursor-pointer hover:bg-white/10"
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
