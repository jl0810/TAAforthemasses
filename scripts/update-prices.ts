import { db } from "@/lib/db";
import { marketPrices } from "@/db/schema/tables";
import { fetchHistoricalPrices } from "@/lib/integrations/tiingo-client";
import { sql } from "drizzle-orm";

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
  "XLE", // Energy
  "XLU", // Utilities
  "XLK", // Tech
  "XLV", // Health
  "XLF", // Financials
  "XLI", // Industrials
  "XLP", // Consumer Staples
  "XLY", // Consumer Discretionary
  "XLB", // Materials
  "XLC", // Comm Services
  "XLR", // Real Estate (Legacy)

  // Factors / Styles
  "MTUM", // Momentum
  "VTV", // Value
  "VUG", // Growth
  "USMV", // Low Vol
  "QUAL", // Quality

  // Bonds/Credit
  "LQD", // Corporate
  "HYG", // High Yield
  "TLT", // long treasuries
  "IEF", // mid treasuries
  "SHY", // short treasuries
];

async function main() {
  console.log(
    `🚀 Starting nightly price update for ${UNIVERSE.length} assets...`,
  );
  const apiKey = process.env.TIINGO_API_KEY;
  if (!apiKey) {
    console.error("❌ TIINGO_API_KEY is missing. Aborting.");
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  for (const ticker of UNIVERSE) {
    try {
      console.log(`fetching ${ticker}...`);
      // Fetch last 30 years (or available)
      // Ideally we only fetch new data, but for now we fetch full history to ensure backfill.
      // Optimization: In production, check max date in DB and fetch forward.
      const prices = await fetchHistoricalPrices(ticker, {
        startDate: "1995-01-01",
      });

      if (prices.length === 0) {
        console.warn(`⚠️ No data found for ${ticker}`);
        failCount++;
        continue;
      }

      console.log(`stores ${prices.length} records for ${ticker}...`);

      // Batch insert/upsert
      // Drizzle 'onConflictDoUpdate' is cleaner
      await db.transaction(async (tx) => {
        // We'll chunk the inserts to avoid massive query size (Tiingo returns ~5000 rows for 20 years)
        const chunkSize = 1000;
        for (let i = 0; i < prices.length; i += chunkSize) {
          const chunk = prices.slice(i, i + chunkSize);

          const values = chunk.map((p) => ({
            id: crypto.randomUUID(),
            symbol: ticker,
            date: new Date(p.date), // Ensure Date object
            open: 0, // Tiingo EOD often simplifies, we focus on adjClose
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
                adjClose: sql`excluded.adj_close`, // Map to snake_case column if needed, or drizzle handles it?
                // Drizzle handles camelCase -> snake_case map if defined in schema.
                // But let's check schema definition. `adjClose` maps to `adj_close`.
                // In onConflictDoUpdate `set`, we refer to the column helpers.
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
    }
  }

  console.log(`\n✅ Completed. Success: ${successCount}, Failed: ${failCount}`);
  process.exit(0);
}

main();
