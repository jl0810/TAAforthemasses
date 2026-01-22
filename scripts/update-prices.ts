import "dotenv/config";
import { db } from "@/lib/db";
import { marketPrices } from "@/db/schema/tables";
import { fetchHistoricalPrices } from "@/lib/integrations/tiingo-client";
import { sql } from "drizzle-orm";

// 30 ETF Universe (Broad Assets + Sectors)
const UNIVERSE = [
  // Broad Asset Classes (Ivy Portfolio + Variants)
  "VTI", // Vanguard Total Stock Market
  "SPY", // SPDR S&P 500 ETF Trust
  "VEA", // Vanguard FTSE Developed Markets
  "VEU", // Vanguard FTSE All-World ex-US (Official Ivy)
  "VWO", // Vanguard FTSE Emerging Markets
  "BND", // Vanguard Total Bond Market
  "IEF", // iShares 7-10 Year Treasury (Official Ivy)
  "VNQ", // Vanguard Real Estate
  "GSG", // iShares S&P GSCI Commodity
  "DBC", // Invesco DB Commodity Index (Official Ivy)
  "GLD", // SPDR Gold Shares
  "BIL", // SPDR 1-3 Month T-Bill (Cash proxy)

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
  "XLRE", // Fixed: was XLR

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

  // Benchmarks (Risk-Profiled Core Series)
  "AOK", // Conservative
  "AOM", // Moderate
  "AOR", // Growth
  "AOA", // Aggressive
];

async function main() {
  console.log(
    `🚀 Starting nightly price update for ${UNIVERSE.length} assets...`,
  );
  if (!process.env.TIINGO_API_KEY && !process.env.TIINGO_API_KEY2) {
    console.error("❌ No TIINGO_API_KEYs found. Aborting.");
    process.exit(1);
  }

  let successCount = 0;
  let failCount = 0;

  for (const ticker of UNIVERSE) {
    try {
      console.log(`fetching ${ticker}...`);
      // Fetch last 30 years (or available)
      const prices = await fetchHistoricalPrices(ticker, {
        startDate: "1995-01-01",
      });

      if (prices.length === 0) {
        console.warn(`⚠️ No data found for ${ticker}`);
        failCount++;
        continue;
      }

      console.log(`stores ${prices.length} records for ${ticker}...`);

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
    }
  }

  console.log(`\n✅ Completed. Success: ${successCount}, Failed: ${failCount}`);
  process.exit(0);
}

main();
