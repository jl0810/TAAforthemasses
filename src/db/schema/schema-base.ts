import { pgSchema } from "@jl0810/db-client";

// One-off schema for TAA per-tenant isolation if needed,
// though following the 95% separate tables / 5% shared pattern.
export const taa = pgSchema("taa");
