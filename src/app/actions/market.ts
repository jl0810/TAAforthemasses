"use server";

import { db } from "@/lib/db";
import { marketPrices } from "@/db/schema/tables";
import { eq, gte, desc, asc, and, inArray } from "drizzle-orm";
import { getSpotPrice } from "@/lib/integrations/yahoo-client";
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

export interface CalculationAudit {
  price: number;
  trend: number;
  buffer: number;
  formula: string;
}

export interface SignalHistory {
  date: string;
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
  audit?: CalculationAudit;
}

export interface BacktestAudit {
  date: string;
  symbol: string;
  weight: number;
  price: number;
  trend: number;
  reason: string;
}

export interface BacktestResult {
  symbol: string;
  equityCurve: { date: string; value: number }[];
  benchmarkCurve: { date: string; value: number }[];
  monthlyReturns: number[];
  performance: MarketPerformance;
  benchmarkPerformance: MarketPerformance;
  auditLog: BacktestAudit[];
  error?: string;
}

const DEFAULT_IVY_5 = [
  { id: "usStocks", symbol: "VTI", name: "US Stocks" },
  { id: "intlStocks", symbol: "VEU", name: "Intl Stocks" },
  { id: "bonds", symbol: "IEF", name: "Bonds" },
  { id: "realEstate", symbol: "VNQ", name: "Real Estate" },
  { id: "commodities", symbol: "DBC", name: "Commodities" },
];

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

  const assets = DEFAULT_IVY_5.map((asset) => ({
    ...asset,
    symbol:
      preferences.tickers[asset.id as keyof typeof preferences.tickers] ||
      asset.symbol,
  }));

  const signals = await Promise.all(
    assets.map(async (asset) => {
      try {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - (maLength + 16));

        const historicalData = await db
          .select({ date: marketPrices.date, adjClose: marketPrices.adjClose })
          .from(marketPrices)
          .where(
            and(
              eq(marketPrices.symbol, asset.symbol),
              gte(marketPrices.date, startDate),
            ),
          )
          .orderBy(desc(marketPrices.date));

        if (historicalData.length < maLength + 1) {
          throw new Error(`Insufficient historical data for ${asset.symbol}.`);
        }

        const rawPrices = historicalData.reverse();

        // Try to get live/spot price from Yahoo
        const yahooPrice = await getSpotPrice(asset.symbol);

        // Fallback checks:
        // 1. Yahoo Spot
        // 2. Database last close
        // (Removed Tiingo daily check to save calls)

        const currentPrice =
          yahooPrice !== null
            ? yahooPrice
            : rawPrices[rawPrices.length - 1].adjClose;

        const monthEnds = getMonthEndPrices(rawPrices);

        if (monthEnds.length < maLength + 1)
          throw new Error(`Insufficient month-end data for ${asset.symbol}`);

        const history: SignalHistory[] = [];
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
            date: monthEnds[index].date.toISOString(),
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

        const currentTrend = calculateMovingAverage(
          monthEnds.map((p) => p.adjClose),
          maType,
          maLength,
        );
        const buffer = calculateSafetyBuffer(currentPrice, currentTrend);
        const returns = monthEnds
          .map((p, i) =>
            i === 0
              ? 0
              : ((p.adjClose - monthEnds[i - 1].adjClose) /
                  monthEnds[i - 1].adjClose) *
                100,
          )
          .slice(1);

        return {
          symbol: asset.symbol,
          name: asset.name,
          price: currentPrice,
          trend: currentTrend,
          buffer: buffer,
          status: buffer > 0 ? "Risk-On" : "Risk-Off",
          lastUpdated: new Date().toISOString(),
          history,
          performance: {
            sharpeRatio: calculateSharpeRatio(returns),
            sortinoRatio: calculateSortinoRatio(returns),
            cagr: calculateAnnualizedReturn(returns),
            maxDrawdown: calculateMaxDrawdown(monthEnds.map((p) => p.adjClose)),
            volatility:
              calculateStandardDeviation(returns.map((r) => r / 100)) *
              Math.sqrt(12) *
              100,
          },
          audit: {
            price: currentPrice,
            trend: currentTrend,
            buffer: buffer,
            formula: "(Price / Trend) - 1",
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
  rebalanceFrequency?: "Monthly" | "Yearly";
}): Promise<BacktestResult> {
  try {
    const preferences = await getUserPreferences();
    const maType = params?.maType || preferences.maType;
    const maLength = params?.maLength || preferences.maLength;
    const concentration = params?.concentration || preferences.concentration;
    const rebalanceFrequency =
      params?.rebalanceFrequency || preferences.rebalanceFrequency || "Monthly";
    const lookbackYears = params?.lookbackYears || 10;

    const assets = DEFAULT_IVY_5.map(
      (asset) =>
        preferences.tickers[asset.id as keyof typeof preferences.tickers] ||
        asset.symbol,
    );
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

    const assetData = new Map<
      string,
      Array<{ date: Date; adjClose: number }>
    >();
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

    if (commonMonthKeys.length < maLength + 2)
      throw new Error(
        "Insufficient common history for backtest. Please try a shorter lookback or contact support.",
      );

    const portfolioReturns: number[] = [];
    const benchmarkReturns: number[] = [];
    const equityCurve = [{ date: "Start", value: 100 }];
    const benchmarkCurve = [{ date: "Start", value: 100 }];
    let currentEquity = 100;
    let currentBenchEquity = 100;

    // Simulation Loop
    // We track relative weights if Yearly rebalancing is enabled
    const currentWeights = new Map<string, number>();
    const auditLog: BacktestAudit[] = [];

    for (let i = maLength; i < commonMonthKeys.length; i++) {
      const currentMonthKey = commonMonthKeys[i];
      const prevMonthKey = commonMonthKeys[i - 1];
      let monthlyReturn = 0;

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
          return {
            symbol,
            isRiskOn: signalPrice > trend,
            assetReturn:
              (months[currentIndex].adjClose - months[prevIndex].adjClose) /
              months[prevIndex].adjClose,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);

      // Rebalancing Logic
      const shouldResetWeights =
        rebalanceFrequency === "Monthly" ||
        (rebalanceFrequency === "Yearly" && (i - maLength) % 12 === 0);

      const targetWeight = 1 / concentration;

      if (shouldResetWeights) {
        // Full reset: Every "Risk-On" asset gets 20%
        currentWeights.clear();
        candidates.forEach((c) => {
          if (c.isRiskOn) {
            currentWeights.set(c.symbol, targetWeight);
          }
        });
      } else {
        // Drift + Signal Check:
        // 1. Update existing weights by their return (Drift)
        const totalWeight = 0;
        currentWeights.forEach((weight, symbol) => {
          const c = candidates.find((cand) => cand.symbol === symbol);
          if (c) {
            const nextWeight = weight * (1 + c.assetReturn);
            currentWeights.set(symbol, nextWeight);
          }
        });

        // 2. Check for signal flips
        candidates.forEach((c) => {
          const hasPosition = currentWeights.has(c.symbol);
          if (c.isRiskOn && !hasPosition) {
            // New Entry: Enter at target weight
            currentWeights.set(c.symbol, targetWeight);
          } else if (!c.isRiskOn && hasPosition) {
            // Exit: Sell to cash
            currentWeights.delete(c.symbol);
          }
        });
      }

      // Calculate Total Monthly Return from Weights
      // For Yearly drift, we need to be careful with the denominator
      // But standard way: Sum (Returns * InitialWeights of the month)
      currentWeights.forEach((weight, symbol) => {
        const c = candidates.find((cand) => cand.symbol === symbol);
        if (c) {
          // Note: In drift mode, we divide by the sum of weights at START of month to get the month's %
          // But here, currentWeights is already the drifted weight.
          // Correct return calculation for drifted weights:
          // Month's contribution = (WeightEnd - WeightStart) / PortfolioValueStart
          // Actually, simpler: portfolioReturn = Sum(c.assetReturn * weightAtStartOfMonth)
          // To get weightAtStartOfMonth, we can just look at what it was BEFORE our drift application
          // Let's refine this to be more precise:
        }
      });

      // Restarting the return calc logic for clarity:
      monthlyReturn = 0;
      const totalPortfolioValueStart = 1; // Normalized base

      // Let's re-calculate monthlyReturn based on state at start of month
      const weightsAtStart = new Map<string, number>();
      const shouldReset =
        rebalanceFrequency === "Monthly" || (i - maLength) % 12 === 0;

      if (shouldReset) {
        candidates.forEach((c) => {
          if (c.isRiskOn) weightsAtStart.set(c.symbol, targetWeight);
        });
      } else {
        // Copy current weights BEFORE drift
        currentWeights.forEach((w, s) => weightsAtStart.set(s, w));
        // Add new entries
        candidates.forEach((c) => {
          if (c.isRiskOn && !weightsAtStart.has(c.symbol))
            weightsAtStart.set(c.symbol, targetWeight);
          if (!c.isRiskOn && weightsAtStart.has(c.symbol))
            weightsAtStart.delete(c.symbol);
        });
      }

      // Add to audit log
      candidates.forEach((c) => {
        const w = weightsAtStart.get(c.symbol) || 0;
        if (w > 0 || c.isRiskOn) {
          auditLog.push({
            date: currentMonthKey,
            symbol: c.symbol,
            weight: w,
            price: c.assetReturn, // This is relative return, maybe store actual price if needed, but return is better for math
            trend: 0, // Not stored in backtest loop easily without re-calc
            reason: w > 0 ? "Target Weight" : "Stay Cash (Risk-Off)",
          });
        }
      });

      let startValue = 0;
      weightsAtStart.forEach((w) => (startValue += w));
      // Handling Cash: Remaining weight is in cash (return = 0)
      // Actually, we define "Total Portfolio" as the sum of target slots even if cash.
      // So if only 2 assets are ON, 60% is cash.

      weightsAtStart.forEach((w, symbol) => {
        const c = candidates.find((cand) => cand.symbol === symbol);
        if (c) {
          monthlyReturn += c.assetReturn * w;
        }
      });

      // Update currentWeights for next month (Drift)
      currentWeights.clear();
      weightsAtStart.forEach((w, symbol) => {
        const c = candidates.find((cand) => cand.symbol === symbol);
        if (c) {
          currentWeights.set(symbol, w * (1 + c.assetReturn));
        }
      });

      portfolioReturns.push(monthlyReturn * 100);
      currentEquity *= 1 + monthlyReturn;
      equityCurve.push({ date: currentMonthKey, value: currentEquity });

      const benchMonths = monthlyAssetData.get(benchmarkTicker)!;
      const bIdx = benchMonths.findIndex(
        (m) =>
          `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, "0")}` ===
          currentMonthKey,
      );
      const bPrev = benchMonths.findIndex(
        (m) =>
          `${m.date.getFullYear()}-${String(m.date.getMonth() + 1).padStart(2, "0")}` ===
          prevMonthKey,
      );

      if (bIdx > 0 && bPrev >= 0) {
        const benchRet =
          (benchMonths[bIdx].adjClose - benchMonths[bPrev].adjClose) /
          benchMonths[bPrev].adjClose;
        benchmarkReturns.push(benchRet * 100);
        currentBenchEquity *= 1 + benchRet;
        benchmarkCurve.push({
          date: currentMonthKey,
          value: currentBenchEquity,
        });
      }
    }

    // SLICE RESULTS TO EXACT LOOKBACK PERIOD
    // The simulation runs on extra data (lookback + 4 vars) to warm up MAs.
    // We must trim the output to show ONLY the requested timeframe.
    // Generate a cutoff key in YYYY-MM format for strict monthly comparison
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - lookbackYears * 12);
    const cutoffKey = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, "0")}`;

    const filterCurve = (curve: { date: string; value: number }[]) => {
      // "Start" label is lexicographically > "202X-XX", so we must explicitly exclude it
      const sliced = curve.filter(
        (p) => p.date !== "Start" && p.date >= cutoffKey,
      );
      if (sliced.length === 0) return curve; // Fallback
      // Re-base to 100
      const startVal = sliced[0].value;
      return sliced.map((p) => ({
        date: p.date,
        value: (p.value / startVal) * 100,
      }));
    };

    const finalEquityCurve = filterCurve(equityCurve);
    const finalBenchmarkCurve = filterCurve(benchmarkCurve);

    // Filter returns corresponding to the sliced period
    // Returns array aligns with curve index 1..N (since curve[0] is start)
    // We can just filter returns based on the dates in the pruned curve (excluding the very first "Start" point date check if needed, but simplest is to keep count)
    const finalPortfolioReturns: number[] = [];
    const finalBenchmarkReturns: number[] = [];

    // Re-build returns arrays based on the sliced curves to ensure alignment
    // (Simpler than mapping dates back to the returns array indices)
    for (let i = 1; i < finalEquityCurve.length; i++) {
      const ret =
        (finalEquityCurve[i].value - finalEquityCurve[i - 1].value) /
        finalEquityCurve[i - 1].value;
      finalPortfolioReturns.push(ret * 100);
    }
    for (let i = 1; i < finalBenchmarkCurve.length; i++) {
      const ret =
        (finalBenchmarkCurve[i].value - finalBenchmarkCurve[i - 1].value) /
        finalBenchmarkCurve[i - 1].value;
      finalBenchmarkReturns.push(ret * 100);
    }

    // Safety check if empty (e.g. lookback > history)
    const safePortReturns =
      finalPortfolioReturns.length > 0
        ? finalPortfolioReturns
        : portfolioReturns;
    const safeBenchReturns =
      finalBenchmarkReturns.length > 0
        ? finalBenchmarkReturns
        : benchmarkReturns;

    return {
      symbol: "Strategy Portfolio",
      equityCurve: finalEquityCurve,
      benchmarkCurve: finalBenchmarkCurve,
      monthlyReturns: safePortReturns,
      performance: {
        sharpeRatio: calculateSharpeRatio(safePortReturns),
        sortinoRatio: calculateSortinoRatio(safePortReturns),
        cagr: calculateAnnualizedReturn(safePortReturns),
        maxDrawdown: calculateMaxDrawdown(finalEquityCurve.map((e) => e.value)),
        volatility:
          calculateStandardDeviation(safePortReturns.map((r) => r / 100)) *
          Math.sqrt(12) *
          100,
      },
      benchmarkPerformance: {
        sharpeRatio: calculateSharpeRatio(safeBenchReturns),
        sortinoRatio: calculateSortinoRatio(safeBenchReturns),
        cagr: calculateAnnualizedReturn(safeBenchReturns),
        maxDrawdown: calculateMaxDrawdown(
          finalBenchmarkCurve.map((e) => e.value),
        ),
        volatility:
          calculateStandardDeviation(safeBenchReturns.map((r) => r / 100)) *
          Math.sqrt(12) *
          100,
      },
      auditLog: auditLog.filter((a) => a.date >= cutoffKey),
    };
  } catch (error) {
    console.error("[runBacktest] Crash:", error);
    return {
      symbol: "Error",
      equityCurve: [],
      benchmarkCurve: [],
      monthlyReturns: [],
      performance: {
        sharpeRatio: 0,
        sortinoRatio: 0,
        cagr: 0,
        maxDrawdown: 0,
        volatility: 0,
      },
      benchmarkPerformance: {
        sharpeRatio: 0,
        sortinoRatio: 0,
        cagr: 0,
        maxDrawdown: 0,
        volatility: 0,
      },
      auditLog: [],
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
