// Load environment in development
if (process.env.NODE_ENV !== "production") {
  import("dotenv")
    .then((d) => d.config({ path: ".env.local" }))
    .catch(() => {});
}

import { db } from "../src/lib/db";
import { userProfiles } from "@jl0810/db-client";
import { count } from "drizzle-orm";

async function main() {
  console.log("🔍 Querying User Database...");

  const allUsers = await db.select().from(userProfiles);

  console.log(`\n📊 Total Users: ${allUsers.length}\n`);

  if (allUsers.length > 0) {
    console.table(
      allUsers.map((u) => ({
        ID: u.userId.slice(0, 8) + "...",
        Email: u.email,
        Name: u.name,
        Created: u.createdAt?.toISOString().split("T")[0],
      })),
    );
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
