"use server";

import { db } from "@/lib/db";
import { marketPrices } from "@/db/schema/tables";
import { eq, gte, desc, and } from "drizzle-orm";
import { fetchHistoricalPrices } from "@/lib/integrations/tiingo-client";
import {
  calculateMovingAverage,
  calculateSafetyBuffer,
  getSignalAction,
} from "@/lib/taa-math";
import { getUserPreferences } from "@/app/actions/user";

export interface SignalHistory {
  month: string;
  price: number;
  trend: number;
  status: "Risk-On" | "Risk-Off";
  action: "Buy" | "Sell" | "Hold" | "Stay Cash";
}

export interface MarketSignal {
  symbol: string;
  name: string;
  price: number;
  trend: number;
  buffer: number;
  status: "Risk-On" | "Risk-Off";
  lastUpdated: string;
  history: SignalHistory[];
}

// Official Ivy Portfolio from Advisor Perspectives
// https://www.advisorperspectives.com/dshort/updates/
const DEFAULT_IVY_5 = [
  { id: "usStocks", symbol: "VTI", name: "US Stocks" }, // Vanguard Total Stock Market
  { id: "intlStocks", symbol: "VEU", name: "Intl Stocks" }, // Vanguard FTSE All-World ex-US
  { id: "bonds", symbol: "IEF", name: "Bonds" }, // iShares 7-10 Year Treasury
  { id: "realEstate", symbol: "VNQ", name: "Real Estate" }, // Vanguard Real Estate
  { id: "commodities", symbol: "DBC", name: "Commodities" }, // Invesco DB Commodity Index
];

/**
 * Get month-end prices from daily data
 */
function getMonthEndPrices(prices: Array<{ date: Date; adjClose: number }>) {
  const monthlyMap = new Map<string, { date: Date; adjClose: number }>();

  prices.forEach((p) => {
    const monthKey = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthlyMap.get(monthKey);
    if (!existing || p.date > existing.date) {
      monthlyMap.set(monthKey, p);
    }
  });

  return Array.from(monthlyMap.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
}

export async function getMarketSignals(
  maType: "SMA" | "EMA" = "SMA",
): Promise<MarketSignal[]> {
  const preferences = await getUserPreferences();

  // Map preferences to asset list
  const assets = DEFAULT_IVY_5.map((asset) => ({
    ...asset,
    symbol:
      preferences.tickers[asset.id as keyof typeof preferences.tickers] ||
      asset.symbol,
  }));

  const signals = await Promise.all(
    assets.map(async (asset) => {
      try {
        // 1. Query historical data from database (26 months back for MA seeding + 12 month history)
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 26);

        console.log(
          `[getMarketSignals] Querying ${asset.symbol} from ${startDate.toISOString()}`,
        );

        const historicalData = await db
          .select({
            date: marketPrices.date,
            adjClose: marketPrices.adjClose,
          })
          .from(marketPrices)
          .where(
            and(
              eq(marketPrices.symbol, asset.symbol),
              gte(marketPrices.date, startDate),
            ),
          )
          .orderBy(desc(marketPrices.date));

        console.log(
          `[getMarketSignals] Found ${historicalData.length} records for ${asset.symbol}`,
        );

        if (historicalData.length < 11) {
          throw new Error(
            `Insufficient historical data for ${asset.symbol}. Found ${historicalData.length} records, need at least 11.`,
          );
        }

        // Reverse to chronological order
        const rawPrices = historicalData.reverse();

        // 2. Fetch today's spot price from Tiingo (just 1 day)
        const today = new Date().toISOString().split("T")[0];
        const spotData = await fetchHistoricalPrices(asset.symbol, {
          startDate: today,
        });

        const currentPrice =
          spotData.length > 0
            ? spotData[spotData.length - 1].adjClose
            : rawPrices[rawPrices.length - 1].adjClose;

        // 3. Calculate month-end prices
        const monthEnds = getMonthEndPrices(rawPrices);

        if (monthEnds.length < 11) {
          throw new Error(`Insufficient month-end data for ${asset.symbol}`);
        }

        const history: SignalHistory[] = [];

        // Generate 12 months of history
        for (let i = 0; i < 12; i++) {
          const index = monthEnds.length - 1 - (11 - i);
          if (index < 9) continue; // Need at least 10 preceding months for first MA

          const sliceForMA = monthEnds.slice(0, index + 1);
          const monthPrice = monthEnds[index].adjClose;
          const monthTrend = calculateMovingAverage(
            sliceForMA.map((p) => p.adjClose),
            maType,
            10,
          );

          // Get prev for action logic
          const prevPrice = monthEnds[index - 1].adjClose;
          const prevTrend = calculateMovingAverage(
            monthEnds.slice(0, index).map((p) => p.adjClose),
            maType,
            10,
          );

          history.push({
            month: new Date(monthEnds[index].date).toLocaleDateString("en-US", {
              month: "short",
              year: "2-digit",
            }),
            price: monthPrice,
            trend: monthTrend,
            status: monthPrice > monthTrend ? "Risk-On" : "Risk-Off",
            action: getSignalAction(
              monthPrice,
              monthTrend,
              prevPrice,
              prevTrend,
            ),
          });
        }

        // Current Metrics
        const currentTrend = calculateMovingAverage(
          monthEnds.map((p) => p.adjClose),
          maType,
          10,
        );
        const buffer = calculateSafetyBuffer(currentPrice, currentTrend);

        return {
          symbol: asset.symbol,
          name: asset.name,
          price: currentPrice,
          trend: currentTrend,
          buffer: buffer,
          status: buffer > 0 ? "Risk-On" : "Risk-Off",
          lastUpdated: new Date().toISOString(),
          history: history,
        } as MarketSignal;
      } catch (error) {
        console.error(
          `[getMarketSignals] Error processing ${asset.symbol}:`,
          error,
        );
        throw error;
      }
    }),
  );

  return signals;
}
