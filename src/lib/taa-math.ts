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
 * Sharpe Ratio
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = 0.04,
): number {
  if (returns.length === 0) return 0;
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = calculateStandardDeviation(returns);
  if (stdDev === 0) return 0;
  return (avgReturn - riskFreeRate / 12) / stdDev;
}

/**
 * Standard Deviation
 */
function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Sortino Ratio
 */
export function calculateSortinoRatio(
  returns: number[],
  riskFreeRate: number = 0.04,
): number {
  if (returns.length === 0) return 0;
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const negativeReturns = returns.filter((r) => r < 0);
  if (negativeReturns.length === 0) return 0;
  const downsideDev = calculateStandardDeviation(negativeReturns);
  if (downsideDev === 0) return 0;
  return (avgReturn - riskFreeRate / 12) / downsideDev;
}
