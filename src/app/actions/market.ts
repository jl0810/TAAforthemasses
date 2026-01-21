"use server";

import {
  fetchHistoricalPrices,
  getMonthEndPrices,
} from "@/lib/integrations/tiingo-client";
import {
  calculateMovingAverage,
  calculateSafetyBuffer,
  getSignalAction,
} from "@/lib/taa-math";

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

const IVY_5 = [
  { symbol: "VTI", name: "US Stocks" },
  { symbol: "VEA", name: "Intl Stocks" },
  { symbol: "BND", name: "US Bonds" },
  { symbol: "VNQ", name: "Real Estate" },
  { symbol: "GSG", name: "Commodities" },
];

export async function getMarketSignals(
  maType: "SMA" | "EMA" = "SMA",
): Promise<MarketSignal[]> {
  try {
    const signals = await Promise.all(
      IVY_5.map(async (asset) => {
        // Fetch ~26 months of daily data to ensure we have 10 months for MA seeding + 12 months of history
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 26);

        const rawPrices = await fetchHistoricalPrices(asset.symbol, {
          startDate: startDate.toISOString().split("T")[0],
        });

        const monthEnds = getMonthEndPrices(rawPrices);

        if (monthEnds.length < 11) {
          throw new Error(`Insufficient data for ${asset.symbol}`);
        }

        const currentPrice = rawPrices[rawPrices.length - 1].adjClose;
        const history: SignalHistory[] = [];

        // Generate 12 months of history
        // We start from 12 months back and go up to current
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
      }),
    );

    return signals;
  } catch (error) {
    console.error("Failed to fetch market signals:", error);
    // Return mock data for demo if API fails or key is missing
    return IVY_5.map((asset) => ({
      symbol: asset.symbol,
      name: `Mock ${asset.name}`,
      price: 100,
      trend: 95,
      buffer: 5,
      status: "Risk-On",
      lastUpdated: "DEMO",
      history: Array.from({ length: 12 }).map((_, i) => ({
        month: "Jan 24",
        price: 100,
        trend: 95,
        status: "Risk-On",
        action: "Hold",
      })),
    })) as MarketSignal[];
  }
}
