import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Initializing database schema...");

  try {
    // strict check for taa schema existence
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS taa;`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS taa.market_prices (
        id text PRIMARY KEY,
        symbol text NOT NULL,
        date timestamp NOT NULL,
        open double precision,
        high double precision,
        low double precision,
        close double precision,
        adj_close double precision NOT NULL,
        volume integer,
        updated_at timestamp DEFAULT now(),
        CONSTRAINT market_prices_symbol_date_idx UNIQUE(symbol, date)
      );
    `);

    console.log("✅ taa.market_prices table created/verified.");
  } catch (error) {
    console.error("❌ Error initializing DB:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
