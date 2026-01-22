import yahooFinance from "yahoo-finance2";

interface YahooQuote {
  regularMarketPrice?: number;
}

/**
 * Fetch the current spot price for a ticker using Yahoo Finance.
 * This provides near real-time (or 15m delayed) data compared to Tiingo's EOD.
 */
export async function getSpotPrice(ticker: string): Promise<number | null> {
  try {
    const quote = (await yahooFinance.quote(ticker)) as unknown as YahooQuote;
    return quote.regularMarketPrice || null;
  } catch (error) {
    console.warn(`[Yahoo] Failed to fetch spot price for ${ticker}:`, error);
    return null;
  }
}

/**
 * Bulk fetch spot prices for multiple tickers.
 * Returns a map of Ticker -> Price.
 */
export async function getSpotPrices(
  tickers: string[],
): Promise<Record<string, number>> {
  const results: Record<string, number> = {};

  // Process in chunks to avoid overwhelming the unofficial API
  const chunkSize = 5;
  for (let i = 0; i < tickers.length; i += chunkSize) {
    const chunk = tickers.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (ticker) => {
        const price = await getSpotPrice(ticker);
        if (price !== null) {
          results[ticker] = price;
        }
      }),
    );
  }

  return results;
}
