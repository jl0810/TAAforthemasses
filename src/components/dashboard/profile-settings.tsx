"use client";

import React, { useState } from "react";
import {
  UserPreferenceConfig,
  updateUserPreferences,
} from "@/app/actions/user";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface Props {
  initialConfig: UserPreferenceConfig;
}

export function ProfileSettings({ initialConfig }: Props) {
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

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="glass-card p-8 rounded-3xl border border-white/10">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-2">
            Strategy Configuration
          </h2>
          <p className="text-white/40 text-sm">
            Customize the ETFs used for each asset class in the Ivy 5 strategy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup
            label="US Stocks"
            value={config.tickers.usStocks}
            onChange={(v) =>
              setConfig({
                ...config,
                tickers: { ...config.tickers, usStocks: v },
              })
            }
          />
          <InputGroup
            label="Intl Stocks"
            value={config.tickers.intlStocks}
            onChange={(v) =>
              setConfig({
                ...config,
                tickers: { ...config.tickers, intlStocks: v },
              })
            }
          />
          <InputGroup
            label="US Bonds"
            value={config.tickers.usBonds}
            onChange={(v) =>
              setConfig({
                ...config,
                tickers: { ...config.tickers, usBonds: v },
              })
            }
          />
          <InputGroup
            label="Real Estate"
            value={config.tickers.realEstate}
            onChange={(v) =>
              setConfig({
                ...config,
                tickers: { ...config.tickers, realEstate: v },
              })
            }
          />
          <InputGroup
            label="Commodities"
            value={config.tickers.commodities}
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

function InputGroup({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono font-medium"
      />
    </div>
  );
}
