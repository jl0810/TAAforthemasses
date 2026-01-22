"use server";

import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { userSignals } from "@/db/schema/tables";
import { revalidatePath } from "next/cache";

export interface UserPreferenceConfig {
  tickers: {
    usStocks: string;
    intlStocks: string;
    bonds: string;
    realEstate: string;
    commodities: string;
    benchmark: string;
  };
  maType: "SMA" | "EMA";
  maLength: 10 | 12;
  concentration: number;
  strategyStartDate?: string;
  rebalanceFrequency: "Monthly" | "Yearly";
}

// Official Ivy Portfolio from Advisor Perspectives
const DEFAULT_CONFIG: UserPreferenceConfig = {
  tickers: {
    usStocks: "VTI", // Vanguard Total Stock Market
    intlStocks: "VEU", // Vanguard FTSE All-World ex-US
    bonds: "IEF", // iShares 7-10 Year Treasury
    realEstate: "VNQ", // Vanguard Real Estate
    commodities: "DBC", // Invesco DB Commodity Index
    benchmark: "AOR", // Default to Growth (60/40 approx)
  },
  maType: "SMA",
  maLength: 10,
  concentration: 5,
  strategyStartDate: "2026-01-01",
  rebalanceFrequency: "Monthly",
};

export async function getUserPreferences(): Promise<UserPreferenceConfig> {
  const session = await getSession();
  if (!session?.user) return DEFAULT_CONFIG;

  const userSignal = await db.query.userSignals.findFirst({
    where: eq(userSignals.userId, session.user.id),
  });

  if (!userSignal?.config) return DEFAULT_CONFIG;

  try {
    return JSON.parse(userSignal.config) as UserPreferenceConfig;
  } catch (e) {
    console.error("Failed to parse user config", e);
    return DEFAULT_CONFIG;
  }
}

export async function updateUserPreferences(config: UserPreferenceConfig) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const existing = await db.query.userSignals.findFirst({
    where: eq(userSignals.userId, session.user.id),
  });

  if (existing) {
    await db
      .update(userSignals)
      .set({
        config: JSON.stringify(config),
        updatedAt: new Date(),
      })
      .where(eq(userSignals.id, existing.id));
  } else {
    await db.insert(userSignals).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      config: JSON.stringify(config),
    });
  }

  revalidatePath("/");
  revalidatePath("/profile");
}

// ETF metadata for display in UI
const ETF_METADATA: Record<string, { name: string; category: string }> = {
  // Ivy Portfolio Core
  VTI: { name: "Vanguard Total Stock Market", category: "US Stocks" },
  SPY: { name: "SPDR S&P 500 ETF Trust", category: "US Stocks" },
  VEU: { name: "Vanguard FTSE All-World ex-US", category: "Intl Stocks" },
  VEA: { name: "Vanguard FTSE Developed Markets", category: "Intl Stocks" },
  VWO: { name: "Vanguard FTSE Emerging Markets", category: "Intl Stocks" },
  IEF: { name: "iShares 7-10 Year Treasury", category: "Bonds" },
  BND: { name: "Vanguard Total Bond Market", category: "Bonds" },
  TLT: { name: "iShares 20+ Year Treasury", category: "Bonds" },
  SHY: { name: "iShares 1-3 Year Treasury", category: "Bonds" },
  LQD: { name: "iShares Investment Grade Corp", category: "Bonds" },
  HYG: { name: "iShares High Yield Corp", category: "Bonds" },
  VNQ: { name: "Vanguard Real Estate", category: "Real Estate" },
  DBC: { name: "Invesco DB Commodity Index", category: "Commodities" },
  GSG: { name: "iShares S&P GSCI Commodity", category: "Commodities" },
  GLD: { name: "SPDR Gold Shares", category: "Commodities" },
  BIL: { name: "SPDR 1-3 Month T-Bill", category: "Cash" },
  // Sectors
  XLE: { name: "Energy Select Sector", category: "Sector" },
  XLU: { name: "Utilities Select Sector", category: "Sector" },
  XLK: { name: "Technology Select Sector", category: "Sector" },
  XLV: { name: "Health Care Select Sector", category: "Sector" },
  XLF: { name: "Financial Select Sector", category: "Sector" },
  XLI: { name: "Industrial Select Sector", category: "Sector" },
  XLP: { name: "Consumer Staples Select", category: "Sector" },
  XLY: { name: "Consumer Discretionary", category: "Sector" },
  XLB: { name: "Materials Select Sector", category: "Sector" },
  XLC: { name: "Communication Services", category: "Sector" },
  XLRE: { name: "Real Estate Select Sector", category: "Sector" },
  // Factors
  MTUM: { name: "iShares MSCI USA Momentum", category: "Factor" },
  VTV: { name: "Vanguard Value", category: "Factor" },
  VUG: { name: "Vanguard Growth", category: "Factor" },
  USMV: { name: "iShares Min Vol USA", category: "Factor" },
  QUAL: { name: "iShares MSCI USA Quality", category: "Factor" },
  // Benchmarks
  AOK: { name: "iShares Conservative Allocation", category: "Benchmark" },
  AOM: { name: "iShares Moderate Allocation", category: "Benchmark" },
  AOR: { name: "iShares Growth Allocation", category: "Benchmark" },
  AOA: { name: "iShares Aggressive Allocation", category: "Benchmark" },
};

export interface AvailableETF {
  symbol: string;
  name: string;
  category: string;
  dataPoints: number;
}

/**
 * Get list of ETFs available in the data warehouse
 */
export async function getAvailableETFs(): Promise<AvailableETF[]> {
  const { marketPrices } = await import("@/db/schema/tables");
  const { sql } = await import("drizzle-orm");

  const results = await db
    .select({
      symbol: marketPrices.symbol,
      count: sql<number>`count(*)::int`,
    })
    .from(marketPrices)
    .groupBy(marketPrices.symbol)
    .orderBy(marketPrices.symbol);

  return results.map((r) => ({
    symbol: r.symbol,
    name: ETF_METADATA[r.symbol]?.name || r.symbol,
    category: ETF_METADATA[r.symbol]?.category || "Other",
    dataPoints: r.count,
  }));
}
