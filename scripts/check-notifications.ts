// Load environment in development (in production, variables are injected by the platform)
if (process.env.NODE_ENV !== "production") {
  import("dotenv")
    .then((d) => d.config({ path: ".env.local" }))
    .catch(() => {});
}

import { db } from "../src/lib/db";
import { userSignals, marketPrices } from "../src/db/schema/tables";
import { eq, desc } from "drizzle-orm";
import {
  calculateSafetyBuffer,
  calculateSMA,
  calculateEMA,
} from "../src/lib/taa-math";
import { UserPreferenceConfig } from "../src/app/actions/user";

async function main() {
  console.log("🔍 Starting Nightly Notification Check...");

  // 1. Fetch all users
  const users = await db.select().from(userSignals);
  console.log(`👤 Found ${users.length} users.`);

  for (const user of users) {
    if (!user.config) continue;

    let config: UserPreferenceConfig;
    try {
      config = JSON.parse(user.config) as UserPreferenceConfig;
    } catch (e) {
      console.error(`❌ Failed to parse config for user ${user.userId}`);
      continue;
    }

    // Skip if notifications disabled
    if (!config.notifications?.enabled) {
      console.log(
        `⏩ Skipping user ${user.userId.slice(0, 8)}: Notifications disabled.`,
      );
      continue;
    }

    console.log(`📉 Checking portfolio for user ${user.userId.slice(0, 8)}...`);

    // Get Tickers
    const tickers = Object.values(config.portfolio.tickers).filter(Boolean);
    if (tickers.length === 0) continue;

    const alerts: string[] = [];

    // Process each ticker
    for (const ticker of tickers) {
      // Fetch last 300 days for calculation
      const prices = await db.query.marketPrices.findMany({
        where: eq(marketPrices.symbol, ticker),
        orderBy: [desc(marketPrices.date)],
        limit: 300,
      });

      if (prices.length < 30) {
        console.warn(`⚠️ Insufficient data for ${ticker}`);
        continue;
      }

      // Group by month
      const monthlyPrices: { date: Date; price: number }[] = [];
      const seenMonths = new Set<string>();

      for (const p of prices) {
        const d = new Date(p.date);
        const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
        // Handle null close prices
        if (!seenMonths.has(monthKey) && p.close !== null) {
          monthlyPrices.push({ date: d, price: Number(p.close) });
          seenMonths.add(monthKey);
        }
      }

      // Sort ascending (Oldest first)
      monthlyPrices.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Need at least MA Length + 1
      const maLength = config.portfolio.maLength || 10;
      if (monthlyPrices.length < maLength + 1) continue;

      // Use last N months excluding current partial month for the Trend Line
      const historyForTrend = monthlyPrices.slice(-(maLength + 1), -1);

      // Calculate Trend
      const trendVal =
        config.portfolio.maType === "EMA"
          ? calculateEMA(
              historyForTrend.map((m) => m.price),
              maLength,
            )
          : calculateSMA(
              historyForTrend.map((m) => m.price),
              maLength,
            );

      // Current Price (Latest Daily Close)
      const currentPrice = Number(prices[0].close ?? 0);

      if (currentPrice === 0) continue;

      const bufferPct = calculateSafetyBuffer(currentPrice, trendVal); // (P-T)/T * 100

      // Check Triggers
      if (config.notifications.thresholdType === "HARD_CROSS") {
        // Risk-On to Risk-Off: Price drops below Trend
        if (currentPrice <= trendVal) {
          alerts.push(
            `🚨 **${ticker}** CROSSOVER ALERT: Price ($${currentPrice.toFixed(2)}) has dropped below the ${maLength}-Month ${config.portfolio.maType} ($${trendVal.toFixed(2)}).`,
          );
        }
      } else if (config.notifications.thresholdType === "BUFFER") {
        const threshold = config.notifications.bufferPercent || 2;
        // Abs buffer is less than threshold
        if (Math.abs(bufferPct) < threshold) {
          const direction = bufferPct > 0 ? "above" : "below";
          alerts.push(
            `⚠️ **${ticker}** BUFFER ALERT: Price ($${currentPrice.toFixed(2)}) is ${Math.abs(bufferPct).toFixed(2)}% ${direction} the trend line (Threshold: ${threshold}%).`,
          );
        }
      }
    }

    // Send Email if alerts exist
    if (alerts.length > 0) {
      console.log(`📧 Sending ${alerts.length} alerts to user (simulated)...`);
      console.log(`--- EMAIL BODY ---`);
      console.log(alerts.join("\n"));
      console.log(`------------------`);
      // Actual email sending would require user email lookup
    } else {
      console.log(`✅ No alerts for user ${user.userId.slice(0, 8)}`);
    }
  }

  console.log("✅ Nightly Check Complete.");
  process.exit(0);
}

main().catch((_e) => {
  console.error(_e);
  process.exit(1);
});
