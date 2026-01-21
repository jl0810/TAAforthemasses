import postgres from "postgres";
import * as dotenv from "dotenv";

// Load envs from .env.local if present
dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

async function main() {
  if (!connectionString) {
    console.error("DATABASE_URL not set in environment or .env.local");
    process.exit(1);
  }

  const sql = postgres(connectionString);

  console.log("Starting manual migration for 'taa.user_signals'...");

  try {
    // 1. Create Schema
    await sql`CREATE SCHEMA IF NOT EXISTS "taa";`;
    console.log("Schema 'taa' verified.");

    // 2. Create Table
    // Matches definition in src/db/schema/tables.ts
    // config is nullable
    // lastCalculated -> last_calculated
    await sql`
      CREATE TABLE IF NOT EXISTS "taa"."user_signals" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "config" text,
        "last_calculated" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("Table 'taa.user_signals' verified.");

    // 3. Add Foreign Key
    // Tries to link to public.user_profiles (default)
    // If user_profiles is in another schema, this might fail, but checking constraint existence first is safe.
    try {
      await sql`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_signals_user_id_fk') THEN
                    ALTER TABLE "taa"."user_signals" 
                    ADD CONSTRAINT "user_signals_user_id_fk" 
                    FOREIGN KEY ("user_id") 
                    REFERENCES "user_profiles"("user_id") 
                    ON DELETE CASCADE;
                END IF;
            END $$;
        `;
      console.log("Foreign Key 'user_signals_user_id_fk' verified.");
    } catch (fkError) {
      console.warn(
        "Could not add FK constraint. 'user_profiles' might be in a different schema or not found.",
        fkError,
      );
      // Fallback: Try referencing public.user_profiles specifically if generic fails
      /*
            try {
                 await sql`ALTER TABLE "taa"."user_signals" ADD CONSTRAINT ... REFERENCES "public"."user_profiles"...`
            } catch (e) { ... }
            */
    }

    console.log("✅ Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
