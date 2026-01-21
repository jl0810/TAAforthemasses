"use server";

import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { userSignals } from "@/db/schema/tables";
import { revalidatePath } from "next/cache";

export interface UserPreferenceConfig {
  tickers: {
    usStocks: string;
    intlStocks: string;
    usBonds: string;
    realEstate: string;
    commodities: string;
  };
}

const DEFAULT_CONFIG: UserPreferenceConfig = {
  tickers: {
    usStocks: "VTI",
    intlStocks: "VEA",
    usBonds: "BND",
    realEstate: "VNQ",
    commodities: "GSG",
  },
};

export async function getUserPreferences(): Promise<UserPreferenceConfig> {
  const session = await getSession();
  if (!session?.user) return DEFAULT_CONFIG;

  const userSignal = await db.query.userSignals.findFirst({
    where: eq(userSignals.userId, session.user.id),
  });

  if (!userSignal?.config) return DEFAULT_CONFIG;

  try {
    return JSON.parse(userSignal.config) as UserPreferenceConfig;
  } catch (e) {
    console.error("Failed to parse user config", e);
    return DEFAULT_CONFIG;
  }
}

export async function updateUserPreferences(config: UserPreferenceConfig) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const existing = await db.query.userSignals.findFirst({
    where: eq(userSignals.userId, session.user.id),
  });

  if (existing) {
    await db
      .update(userSignals)
      .set({
        config: JSON.stringify(config),
        updatedAt: new Date(),
      })
      .where(eq(userSignals.id, existing.id));
  } else {
    await db.insert(userSignals).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      config: JSON.stringify(config),
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");
}
