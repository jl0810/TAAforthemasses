/**
 * Quantitative Logic and Mathematics for Tactical Asset Allocation
 * Based on Meb Faber's white paper
 */

/**
 * Simple Moving Average (SMA)
 * The arithmetic mean of the last n monthly closing prices.
 */
/**
 * Moving Average calculation (SMA or EMA)
 */
export function calculateMovingAverage(
  prices: number[],
  type: "SMA" | "EMA",
  n: number = 10,
): number {
  if (prices.length < n) return 0;
  if (type === "SMA") {
    const window = prices.slice(-n);
    return window.reduce((a, b) => a + b, 0) / n;
  } else {
    // For EMA, we use the standard calculation
    // Note: For high accuracy, EMA usually needs more history than 'n' to stabilize
    const k = 2 / (n + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
  }
}

/**
 * Determines the action (Buy, Sell, Hold, Stay Cash) based on price/trend crossing
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
 * Safety Buffer Calculation
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
