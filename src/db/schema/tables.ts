import { text, timestamp, pgTable } from "@jl0810/db-client";
import { taa } from "./schema-base";
import { userProfiles } from "@jl0810/db-client";

import { doublePrecision, integer, uniqueIndex } from "drizzle-orm/pg-core";

export const userSignals = taa.table("user_signals", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userProfiles.userId, { onDelete: "cascade" }),

  config: text("config"), // JSON string of custom ticker mappings
  lastCalculated: timestamp("last_calculated"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const marketPrices = taa.table(
  "market_prices",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    symbol: text("symbol").notNull(),
    date: timestamp("date").notNull(),
    open: doublePrecision("open"),
    high: doublePrecision("high"),
    low: doublePrecision("low"),
    close: doublePrecision("close"),
    adjClose: doublePrecision("adj_close").notNull(),
    volume: integer("volume"),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    unq: uniqueIndex("market_prices_symbol_date_idx").on(t.symbol, t.date),
  }),
);
