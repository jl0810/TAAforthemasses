"use server";

import { db } from "@/lib/db";
import { marketPrices } from "@/db/schema/tables";
import { eq, gte, desc, asc, and, inArray } from "drizzle-orm";
import { fetchHistoricalPrices } from "@/lib/integrations/tiingo-client";
import {
  calculateMovingAverage,
  calculateSafetyBuffer,
  getSignalAction,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateMaxDrawdown,
  calculateAnnualizedReturn,
  calculateStandardDeviation,
} from "@/lib/taa-math";
import { getUserPreferences } from "@/app/actions/user";

export interface MarketPerformance {
  sharpeRatio: number;
  sortinoRatio: number;
  cagr: number;
  maxDrawdown: number;
  volatility: number;
}

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
  performance?: MarketPerformance;
}

export interface BacktestResult {
  symbol: string;
  equityCurve: { date: string; value: number }[];
  benchmarkCurve: { date: string; value: number }[];
  monthlyReturns: number[];
  performance: MarketPerformance;
  benchmarkPerformance: MarketPerformance;
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
  maTypeArg?: "SMA" | "EMA",
  maLengthArg?: number,
): Promise<MarketSignal[]> {
  const preferences = await getUserPreferences();
  const maType = maTypeArg || preferences.maType;
  const maLength = maLengthArg || preferences.maLength;

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
        // 1. Query historical data from database (Need enough for maLength + 12 month history + seating)
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - (maLength + 16));

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

        if (historicalData.length < maLength + 1) {
          throw new Error(
            `Insufficient historical data for ${asset.symbol}. Found ${historicalData.length} records, need at least ${maLength + 1}.`,
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

        if (monthEnds.length < maLength + 1) {
          throw new Error(`Insufficient month-end data for ${asset.symbol}`);
        }

        const history: SignalHistory[] = [];

        // Generate 12 months of history
        const historyCount = 12;
        for (let i = 0; i < historyCount; i++) {
          const index = monthEnds.length - 1 - (historyCount - 1 - i);
          if (index < maLength - 1) continue;

          const sliceForMA = monthEnds.slice(0, index + 1);
          const monthPrice = monthEnds[index].adjClose;
          const monthTrend = calculateMovingAverage(
            sliceForMA.map((p) => p.adjClose),
            maType,
            maLength,
          );

          // Get prev for action logic
          const prevPrice =
            index > 0 ? monthEnds[index - 1].adjClose : monthPrice;
          const prevTrend =
            index > 0
              ? calculateMovingAverage(
                  monthEnds.slice(0, index).map((p) => p.adjClose),
                  maType,
                  maLength,
                )
              : monthTrend;

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
          maLength,
        );
        const buffer = calculateSafetyBuffer(currentPrice, currentTrend);

        // calculate performance
        const returns = monthEnds
          .map((p, i) => {
            if (i === 0) return 0;
            return (
              ((p.adjClose - monthEnds[i - 1].adjClose) /
                monthEnds[i - 1].adjClose) *
              100
            );
          })
          .slice(1);

        const sharpe = calculateSharpeRatio(returns);
        const sortino = calculateSortinoRatio(returns);
        const cagr = calculateAnnualizedReturn(returns);
        const maxDd = calculateMaxDrawdown(monthEnds.map((p) => p.adjClose));
        const vol =
          calculateStandardDeviation(returns.map((r) => r / 100)) *
          Math.sqrt(12) *
          100;

        return {
          symbol: asset.symbol,
          name: asset.name,
          price: currentPrice,
          trend: currentTrend,
          buffer: buffer,
          status: buffer > 0 ? "Risk-On" : "Risk-Off",
          lastUpdated: new Date().toISOString(),
          history: history,
          performance: {
            sharpeRatio: sharpe,
            sortinoRatio: sortino,
            cagr: cagr,
            maxDrawdown: maxDd,
            volatility: vol,
          },
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

export async function runBacktest(params?: {
  maType?: "SMA" | "EMA";
  maLength?: number;
  concentration?: number;
  benchmark?: string;
  lookbackYears?: number;
}): Promise<BacktestResult> {
  const preferences = await getUserPreferences();
  const maType = params?.maType || preferences.maType;
  const maLength = params?.maLength || preferences.maLength;
  const concentration = params?.concentration || preferences.concentration;
  const lookbackYears = params?.lookbackYears || 10;

  const assets = DEFAULT_IVY_5.map(
    (asset) =>
      preferences.tickers[asset.id as keyof typeof preferences.tickers] ||
      asset.symbol,
  );

  // 1. Get historical data for all assets + benchmark
  const benchmarkTicker =
    params?.benchmark || preferences.tickers.benchmark || "AOR";
  const allTickers = [...assets, benchmarkTicker];
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - (lookbackYears + 4));

  const historicalData = await db
    .select({
      symbol: marketPrices.symbol,
      date: marketPrices.date,
      adjClose: marketPrices.adjClose,
    })
    .from(marketPrices)
    .where(
      and(
        inArray(marketPrices.symbol, allTickers),
        gte(marketPrices.date, startDate),
      ),
    )
    .orderBy(asc(marketPrices.date));

  // 2. Group by symbol and calculate month-ends
  const assetData = new Map<string, Array<{ date: Date; adjClose: number }>>();
  historicalData.forEach((row) => {
    if (!assetData.has(row.symbol)) assetData.set(row.symbol, []);
    assetData.get(row.symbol)!.push(row);
  });

  const monthlyAssetData = new Map<
    string,
    Array<{ date: Date; adjClose: number }>
  >();
  allTickers.forEach((symbol) => {
    const raw = assetData.get(symbol) || [];
    monthlyAssetData.set(symbol, getMonthEndPrices(raw));
  });

  // 3. Find common date range
  const allMonths = Array.from(monthlyAssetData.values());
  if (allMonths.length === 0) throw new Error("No data found for backtest");

  const monthKeysPerAsset = allTickers.map((symbol) => {
    const months = monthlyAssetData.get(symbol) || [];
    return new Set(
      months.map(
        (m) =>
          `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, "0")}`,
      ),
    );
  });

  const commonMonthKeys = [...monthKeysPerAsset[0]]
    .filter((key) => monthKeysPerAsset.every((set) => set.has(key)))
    .sort();

  if (commonMonthKeys.length < maLength + 2) {
    throw new Error("Insufficient common history for backtest");
  }

  // 4. Run Strategy Simulation
  const portfolioReturns: number[] = [];
  const benchmarkReturns: number[] = [];
  const equityCurve: { date: string; value: number }[] = [
    { date: "Start", value: 100 },
  ];
  const benchmarkCurve: { date: string; value: number }[] = [
    { date: "Start", value: 100 },
  ];
  let currentEquity = 100;
  let currentBenchEquity = 100;

  // We need at least 'maLength' months of data before we can start the strategy
  for (let i = maLength; i < commonMonthKeys.length; i++) {
    const currentMonthKey = commonMonthKeys[i];
    const prevMonthKey = commonMonthKeys[i - 1];

    let monthlyReturn = 0;

    // A. Strategy Simulation logic
    const candidates = assets
      .map((symbol) => {
        const months = monthlyAssetData.get(symbol)!;
        const prevIndex = months.findIndex(
          (m) =>
            `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, "0")}` ===
            prevMonthKey,
        );
        const currentIndex = months.findIndex(
          (m) =>
            `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, "0")}` ===
            currentMonthKey,
        );

        if (prevIndex < maLength - 1 || currentIndex < 0) return null;

        const sliceForMA = months.slice(0, prevIndex + 1);
        const trend = calculateMovingAverage(
          sliceForMA.map((m) => m.adjClose),
          maType,
          maLength,
        );
        const signalPrice = months[prevIndex].adjClose;
        const buffer = ((signalPrice - trend) / trend) * 100;

        return {
          symbol,
          buffer,
          isRiskOn: signalPrice > trend,
          assetReturn:
            (months[currentIndex].adjClose - months[prevIndex].adjClose) /
            months[prevIndex].adjClose,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    candidates.sort((a, b) => b.buffer - a.buffer);
    const topN = candidates.slice(0, concentration);
    const weightPerSlot = 1 / concentration;

    topN.forEach((c) => {
      if (c.isRiskOn) {
        monthlyReturn += c.assetReturn * weightPerSlot;
      } else {
        monthlyReturn += 0;
      }
    });

    if (topN.length < concentration) monthlyReturn += 0;

    portfolioReturns.push(monthlyReturn * 100);
    currentEquity *= 1 + monthlyReturn;
    equityCurve.push({ date: currentMonthKey, value: currentEquity });

    // B. Benchmark Simulation (Buy & Hold)
    const benchMonths = monthlyAssetData.get(benchmarkTicker)!;
    const benchCurrentIndex = benchMonths.findIndex(
      (m) =>
        `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, "0")}` ===
        currentMonthKey,
    );
    const benchPrevIndex = benchMonths.findIndex(
      (m) =>
        `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, "0")}` ===
        prevMonthKey,
    );

    if (benchCurrentIndex > 0 && benchPrevIndex >= 0) {
      const benchRet =
        (benchMonths[benchCurrentIndex].adjClose -
          benchMonths[benchPrevIndex].adjClose) /
        benchMonths[benchPrevIndex].adjClose;
      benchmarkReturns.push(benchRet * 100);
      currentBenchEquity *= 1 + benchRet;
      benchmarkCurve.push({ date: currentMonthKey, value: currentBenchEquity });
    }
  }

  const sharpe = calculateSharpeRatio(portfolioReturns);
  const sortino = calculateSortinoRatio(portfolioReturns);
  const cagr = calculateAnnualizedReturn(portfolioReturns);
  const maxDd = calculateMaxDrawdown(equityCurve.map((e) => e.value));
  const vol =
    calculateStandardDeviation(portfolioReturns.map((r) => r / 100)) *
    Math.sqrt(12) *
    100;

  const bSharpe = calculateSharpeRatio(benchmarkReturns);
  const bSortino = calculateSortinoRatio(benchmarkReturns);
  const bCagr = calculateAnnualizedReturn(benchmarkReturns);
  const bMaxDd = calculateMaxDrawdown(benchmarkCurve.map((e) => e.value));
  const bVol =
    calculateStandardDeviation(benchmarkReturns.map((r) => r / 100)) *
    Math.sqrt(12) *
    100;

  return {
    symbol: "Strategy Portfolio",
    equityCurve,
    benchmarkCurve,
    monthlyReturns: portfolioReturns,
    performance: {
      sharpeRatio: sharpe,
      sortinoRatio: sortino,
      cagr: cagr,
      maxDrawdown: maxDd,
      volatility: vol,
    },
    benchmarkPerformance: {
      sharpeRatio: bSharpe,
      sortinoRatio: bSortino,
      cagr: bCagr,
      maxDrawdown: bMaxDd,
      volatility: bVol,
    },
  };
}
