import { db } from "@/lib/db";
import { marketPrices } from "@/db/schema/tables";
import { fetchHistoricalPrices } from "@/lib/integrations/tiingo-client";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// 30 ETF Universe (Broad Assets + Sectors)
const UNIVERSE = [
  // Broad Asset Classes (Ivy 5 + Variants)
  "VTI",
  "VEA",
  "VWO",
  "BND",
  "VNQ",
  "GSG",
  "GLD",
  "BIL",

  // US Sectors (SPDR)
  "XLE",
  "XLU",
  "XLK",
  "XLV",
  "XLF",
  "XLI",
  "XLP",
  "XLY",
  "XLB",
  "XLC",
  "XLR",

  // Factors / Styles
  "MTUM",
  "VTV",
  "VUG",
  "USMV",
  "QUAL",

  // Bonds/Credit
  "LQD",
  "HYG",
  "TLT",
  "IEF",
  "SHY",
];

// Allow 5 minute execution time (Vercel/Next.js default is often 10s-60s)
export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log(
    `🚀 Starting scheduled price update for ${UNIVERSE.length} assets...`,
  );

  const apiKey = process.env.TIINGO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TIINGO_API_KEY missing" },
      { status: 500 },
    );
  }

  let successCount = 0;
  let failCount = 0;
  const errors: Array<{ ticker: string; error: string }> = [];

  for (const ticker of UNIVERSE) {
    try {
      // Fetch last 30 years (or available)
      // Ideally we only fetch new data, but for now we fetch full history to ensure backfill.
      const prices = await fetchHistoricalPrices(ticker, {
        startDate: "1995-01-01",
      });

      if (prices.length === 0) {
        failCount++;
        continue;
      }

      // Batch insert/upsert
      await db.transaction(async (tx) => {
        const chunkSize = 1000;
        for (let i = 0; i < prices.length; i += chunkSize) {
          const chunk = prices.slice(i, i + chunkSize);

          const values = chunk.map((p) => ({
            id: crypto.randomUUID(),
            symbol: ticker,
            date: new Date(p.date),
            open: 0,
            high: 0,
            low: 0,
            close: p.close,
            adjClose: p.adjClose,
            volume: p.volume,
            updatedAt: new Date(),
          }));

          await tx
            .insert(marketPrices)
            .values(values)
            .onConflictDoUpdate({
              target: [marketPrices.symbol, marketPrices.date],
              set: {
                close: sql`excluded.close`,
                adjClose: sql`excluded.adj_close`,
                volume: sql`excluded.volume`,
                updatedAt: new Date(),
              },
            });
        }
      });

      successCount++;
    } catch (err) {
      console.error(`❌ Failed to process ${ticker}:`, err);
      failCount++;
      errors.push({
        ticker,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    success: true,
    stats: { success: successCount, failed: failCount },
    errors,
  });
}
