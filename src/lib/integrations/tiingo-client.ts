// Server-side Tiingo API client
// This module is used exclusively by Server Actions to fetch market data
// DO NOT add 'use client' directive - this must remain server-side only

const TIINGO_BASE_URL = "https://api.tiingo.com";

function getTiingoApiKey(): string | undefined {
  return process.env.TIINGO_API_KEY;
}

export interface TiingoPrice {
  date: string;
  close: number;
  adjClose: number;
  volume: number;
}

/**
 * Fetch historical End-of-Day prices from Tiingo
 * Returns adjusted close prices (accounts for splits & dividends)
 */
export async function fetchHistoricalPrices(
  ticker: string,
  options?: {
    startDate?: string; // YYYY-MM-DD
    endDate?: string;
  },
): Promise<TiingoPrice[]> {
  const apiKey = getTiingoApiKey();
  if (!apiKey) {
    console.warn("TIINGO_API_KEY not set. Falling back to mock data or error.");
    throw new Error("TIINGO_API_KEY not set.");
  }

  const startDate = options?.startDate || "2000-01-01";
  const endDate = options?.endDate || new Date().toISOString().split("T")[0];

  const url = `${TIINGO_BASE_URL}/tiingo/daily/${ticker}/prices?startDate=${startDate}&endDate=${endDate}&token=${apiKey}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Tiingo API error for ${ticker}: ${response.status} - ${text}`,
    );
  }

  const data = (await response.json()) as Array<{
    date: string;
    close: number;
    adjClose: number;
    volume: number;
  }>;

  return data.map((d) => ({
    date: d.date,
    close: d.close,
    adjClose: d.adjClose,
    volume: d.volume,
  }));
}

/**
 * Sampling logic: Filters a daily series into month-end points
 */
export function getMonthEndPrices(prices: TiingoPrice[]): TiingoPrice[] {
  if (prices.length === 0) return [];

  const monthEnds: TiingoPrice[] = [];

  // Sort chronological
  const sorted = [...prices].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (!next) {
      monthEnds.push(current);
      break;
    }

    const currentMonth = new Date(current.date).getMonth();
    const nextMonth = new Date(next.date).getMonth();

    if (currentMonth !== nextMonth) {
      monthEnds.push(current);
    }
  }

  return monthEnds;
}
