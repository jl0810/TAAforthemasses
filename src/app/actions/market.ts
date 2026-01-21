"use server";

import {
  fetchHistoricalPrices,
  getMonthEndPrices,
} from "@/lib/integrations/tiingo-client";
import { calculateSMA, calculateSafetyBuffer } from "@/lib/taa-math";

export interface MarketSignal {
  symbol: string;
  name: string;
  price: number;
  trend: number;
  buffer: number;
  status: "Risk-On" | "Risk-Off";
  lastUpdated: string;
}

const IVY_5 = [
  { symbol: "VTI", name: "US Stocks" },
  { symbol: "VEA", name: "Intl Stocks" },
  { symbol: "BND", name: "US Bonds" },
  { symbol: "VNQ", name: "Real Estate" },
  { symbol: "GSG", name: "Commodities" },
];

export async function getMarketSignals(): Promise<MarketSignal[]> {
  try {
    const signals = await Promise.all(
      IVY_5.map(async (asset) => {
        // Fetch ~15 months of daily data to ensure we have 10 full month-ends plus current month
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 15);

        const rawPrices = await fetchHistoricalPrices(asset.symbol, {
          startDate: startDate.toISOString().split("T")[0],
        });

        const monthEnds = getMonthEndPrices(rawPrices);

        // We need at least 11 points (10 for SMA, 1 for current price comparison)
        if (monthEnds.length < 10) {
          throw new Error(`Insufficient data for ${asset.symbol}`);
        }

        // Current price is the latest month-end or recent daily adjClose
        const currentPrice = rawPrices[rawPrices.length - 1].adjClose;

        // SMA-10 uses the last 10 full months
        // If the current month is incomplete, we usually use the last 10 completed months
        const smaTen = calculateSMA(
          monthEnds.slice(-10).map((p) => p.adjClose),
        );
        const buffer = calculateSafetyBuffer(currentPrice, smaTen);

        return {
          symbol: asset.symbol,
          name: asset.name,
          price: currentPrice,
          trend: smaTen,
          buffer: buffer,
          status: buffer > 0 ? "Risk-On" : "Risk-Off",
          lastUpdated: new Date().toISOString(),
        } as MarketSignal;
      }),
    );

    return signals;
  } catch (error) {
    console.error("Failed to fetch market signals:", error);
    // Return mock data for demo if API fails or key is missing
    return [
      {
        symbol: "VTI",
        name: "Mock US Stocks",
        price: 295.42,
        trend: 282.15,
        buffer: 4.7,
        status: "Risk-On",
        lastUpdated: "DEMO",
      },
      {
        symbol: "VEA",
        name: "Mock Intl Stocks",
        price: 54.12,
        trend: 51.8,
        buffer: 4.4,
        status: "Risk-On",
        lastUpdated: "DEMO",
      },
      {
        symbol: "BND",
        name: "Mock US Bonds",
        price: 72.85,
        trend: 74.2,
        buffer: -1.8,
        status: "Risk-Off",
        lastUpdated: "DEMO",
      },
      {
        symbol: "GSG",
        name: "Mock Commodities",
        price: 21.05,
        trend: 20.15,
        buffer: 4.5,
        status: "Risk-On",
        lastUpdated: "DEMO",
      },
      {
        symbol: "VNQ",
        name: "Mock Real Estate",
        price: 98.6,
        trend: 92.4,
        buffer: 6.7,
        status: "Risk-On",
        lastUpdated: "DEMO",
      },
    ];
  }
}
