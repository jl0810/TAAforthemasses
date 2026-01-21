import { text, timestamp, pgTable } from "@jl0810/db-client";
import { taa } from "./schema-base";
import { userProfiles } from "@jl0810/db-client";

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
