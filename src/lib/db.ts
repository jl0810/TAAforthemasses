import { publicSchema } from "@jl0810/db-client";
import { createDb } from "@jl0810/db-client/client";
import * as schema from "@/db/schema";

import { PostgresJsDatabase } from "drizzle-orm/postgres-js";

const fullSchema = { ...publicSchema, ...schema };

export const db = (
  process.env.DATABASE_URL ? createDb(undefined, fullSchema) : {}
) as PostgresJsDatabase<typeof fullSchema>;

export { schema };
