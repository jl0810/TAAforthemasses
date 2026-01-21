import { betterAuthSchema } from "@jl0810/db-client";
export const {
  betterAuthUser,
  betterAuthSession,
  betterAuthAccount,
  betterAuthVerification,
} = betterAuthSchema;

export { userProfiles } from "@jl0810/db-client";

export * from "./schema-base";
export * from "./tables";
