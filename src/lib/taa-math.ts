/**
 * Quantitative Logic and Mathematics for Tactical Asset Allocation
 * Based on Meb Faber's white paper
 */

/**
 * Simple Moving Average (SMA)
 * The arithmetic mean of the last n monthly closing prices.
 */
/**
 * Checks if there are enough prices to calculate the moving average.
 */
function hasEnoughData(prices: number[], n: number): boolean {
  return prices.length >= n;
}

/**
 * Calculates the Unified Moving Average (SMA or EMA).
 *
 * @rules BR-001 Signal Generation Logic
 * @userStory US-003 SMA/EMA Strategy Toggle
 *
 * @param prices - Array of prices (sorted oldest to newest)
 * @param type - "SMA" or "EMA"
 * @param n - Period (default: 10)
 * @returns The calculated moving average value
 */
export function calculateMovingAverage(
  prices: number[],
  type: "SMA" | "EMA",
  n: number = 10,
): number {
  if (!hasEnoughData(prices, n)) return 0;

  if (type === "SMA") {
    return calculateSMA(prices, n);
  } else {
    return calculateEMA(prices, n);
  }
}

/**
 * Calculates the Simple Moving Average (SMA).
 *
 * @rules BR-001 Signal Generation Logic (SMA)
 * @param prices - Array of prices
 * @param n - Period (default: 10)
 */
export function calculateSMA(prices: number[], n: number = 10): number {
  if (!hasEnoughData(prices, n)) return 0;
  const window = prices.slice(-n);
  return window.reduce((a, b) => a + b, 0) / n;
}

/**
 * Calculates the Exponential Moving Average (EMA).
 *
 * @rules BR-001 Signal Generation Logic (EMA)
 * @param prices - Array of prices
 * @param n - Period (default: 10)
 */
export function calculateEMA(prices: number[], n: number = 10): number {
  if (!hasEnoughData(prices, n)) return 0;

  // For EMA, we use the standard calculation
  const k = 2 / (n + 1);
  let ema = prices[0]; // Start with first available price

  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

/**
 * Determines the action (Buy, Sell, Hold, Stay Cash) based on price/trend crossing.
 *
 * @rules BR-002 Trading Actions
 * @userStory US-002 Historical Signal Analysis
 *
 * @param currentPrice - Current month's price
 * @param currentTrend - Current month's trend value
 * @param prevPrice - Previous month's price
 * @param prevTrend - Previous month's trend value
 * @returns "Buy" | "Sell" | "Hold" | "Stay Cash"
 */
export function getSignalAction(
  currentPrice: number,
  currentTrend: number,
  prevPrice: number,
  prevTrend: number,
): "Buy" | "Sell" | "Hold" | "Stay Cash" {
  const isCurrentlyUp = currentPrice > currentTrend;
  const wasPreviouslyUp = prevPrice > prevTrend;

  if (isCurrentlyUp && !wasPreviouslyUp) return "Buy";
  if (!isCurrentlyUp && wasPreviouslyUp) return "Sell";
  if (isCurrentlyUp && wasPreviouslyUp) return "Hold";
  return "Stay Cash";
}

/**
 * Safety Buffer Calculation.
 *
 * @rules BR-001 Signal Generation Logic (Safety Buffer)
 * @param currentPrice - The current asset price
 * @param movingAverage - The calculated trend (MA)
 * @returns Percentage buffer (positive = Risk-On, negative = Risk-Off)
 */
/**
 * Safety Buffer Calculation (Distance from Trend).
 * Standardized to: (Price - Trend) / Trend
 *
 * @rules BR-001 Signal Generation Logic (Safety Buffer)
 * @param currentPrice - The current asset price
 * @param movingAverage - The calculated trend (MA)
 * @returns Percentage buffer (positive = Risk-On, negative = Risk-Off)
 */
export function calculateSafetyBuffer(
  currentPrice: number,
  movingAverage: number,
): number {
  if (movingAverage === 0) return 0;
  return ((currentPrice - movingAverage) / movingAverage) * 100;
}

/**
 * Total Return (TR)
 * Accounts for price appreciation plus dividends.
 */
export function calculateTotalReturn(
  pStart: number,
  pEnd: number,
  dividends: number = 0,
): number {
  if (pStart === 0) return 0;
  return ((pEnd + dividends - pStart) / pStart) * 100;
}

/**
 * Calculates drift percentage for rebalancing.
 * Drift = |(Current Weight - Target Weight) / Target Weight|
 * But simply: Returns the absolute percentage change required to return to target.
 * Simple Drift Metric: (Current Value - Target Value) / Target Value
 */
export function calculateRebalanceDrift(
  currentValue: number,
  targetValue: number,
): number {
  if (targetValue === 0) return 0;
  return ((currentValue - targetValue) / targetValue) * 100;
}

/**
 * Equal Weight Position Sizing.
 * Simply: Capital * (1 / N)
 */
export function calculateEqualWeightAllocation(
  capital: number,
  concentration: number,
): number {
  if (concentration === 0) return 0;
  return capital * (1 / concentration);
}

/**
 * Standard Deviation (Sample).
 * Uses N-1 (Bessel's correction) for unbiased estimation of population variance.
 * CFA Level 3 Standard.
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length < 2) return 0; // Need at least 2 points for Sample SD
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
  // Sample SD: Divide by (N - 1)
  const avgSquareDiff =
    squareDiffs.reduce((a, b) => a + b, 0) / (values.length - 1);
  return Math.sqrt(avgSquareDiff);
}

/**
 * Sharpe Ratio (Annualized)
 * (Avg Monthly Return - Risk Free Rate / 12) / StdDev * sqrt(12)
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = 0.04,
): number {
  if (returns.length < 2) return 0;
  const monthlyRf = riskFreeRate / 12;
  const excessReturns = returns.map((r) => r / 100 - monthlyRf);
  const avgExcess = excessReturns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = calculateStandardDeviation(excessReturns);

  if (stdDev === 0) return 0;
  return (avgExcess / stdDev) * Math.sqrt(12);
}

/**
 * Sortino Ratio (Annualized)
 * (Avg Monthly Return - Risk Free Rate / 12) / DownsideDev * sqrt(12)
 */
export function calculateSortinoRatio(
  returns: number[],
  riskFreeRate: number = 0.04,
): number {
  if (returns.length === 0) return 0;
  const monthlyRf = riskFreeRate / 12;
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length / 100;

  const downsideDiffs = returns.map((r) => {
    const diff = r / 100 - monthlyRf;
    return diff < 0 ? Math.pow(diff, 2) : 0;
  });

  const downsideDev = Math.sqrt(
    downsideDiffs.reduce((a, b) => a + b, 0) / returns.length,
  );

  if (downsideDev === 0) return 0;
  return ((avgReturn - monthlyRf) / downsideDev) * Math.sqrt(12);
}

/**
 * Max Drawdown (%)
 */
export function calculateMaxDrawdown(prices: number[]): number {
  if (prices.length === 0) return 0;
  let maxDd = 0;
  let peak = -Infinity;

  for (const price of prices) {
    if (price > peak) peak = price;
    const dd = ((peak - price) / peak) * 100;
    if (dd > maxDd) maxDd = dd;
  }

  return maxDd;
}

/**
 * Annualized Return (CAGR/Geometric Mean)
 * Supports flexible periods per year (e.g. 12 for monthly, 252 for daily).
 */
export function calculateAnnualizedReturn(
  returns: number[],
  periodsPerYear: number = 12,
): number {
  if (returns.length === 0) return 0;
  // returns are in percentage (e.g. 1.5 for 1.5%)
  const growth = returns.reduce((acc, r) => acc * (1 + r / 100), 1);
  const years = returns.length / periodsPerYear;
  return (Math.pow(growth, 1 / years) - 1) * 100;
}
