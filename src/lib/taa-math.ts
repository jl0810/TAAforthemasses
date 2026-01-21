/**
 * Quantitative Logic and Mathematics for Tactical Asset Allocation
 * Based on Meb Faber's white paper
 */

/**
 * Simple Moving Average (SMA)
 * The arithmetic mean of the last n monthly closing prices.
 */
export function calculateSMA(prices: number[]): number {
  if (prices.length === 0) return 0;
  const sum = prices.reduce((a, b) => a + b, 0);
  return sum / prices.length;
}

/**
 * Exponential Moving Average (EMA)
 * A weighted average that applies more weight to recent prices.
 */
export function calculateEMA(prices: number[], n: number = 10): number {
  if (prices.length === 0) return 0;
  const k = 2 / (n + 1);
  let ema = prices[0]; // Start with the first price

  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

/**
 * Safety Buffer Calculation
 * Derived from the percentage distance between current price and trend line.
 */
export function calculateSafetyBuffer(
  currentPrice: number,
  movingAverage: number,
): number {
  if (movingAverage === 0) return 0;
  return (currentPrice / movingAverage - 1) * 100;
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
