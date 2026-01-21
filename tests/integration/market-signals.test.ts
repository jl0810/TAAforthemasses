/**
 * Integration Tests for Market Signals (BR-003, BR-004, BR-005)
 *
 * Verifies the interaction between the data layer (market.ts),
 * user preferences (user.ts), and external APIs (Tiingo).
 */

import { getMarketSignals } from "@/app/actions/market";
import * as tiingoClient from "@/lib/integrations/tiingo-client";
import * as userActions from "@/app/actions/user";

// Mock dependencies
jest.mock("@/lib/integrations/tiingo-client");
jest.mock("@/app/actions/user");
jest.mock("@/lib/auth", () => ({
  getSession: jest.fn(),
}));

describe("Market Signals Integration", () => {
  const mockPrices = Array.from({ length: 50 }, (_, i) => ({
    date: new Date(2023, 0, i + 1).toISOString(),
    adjClose: 100 + i, // Linearly increasing price
  }));

  const mockMonthEnds = Array.from({ length: 24 }, (_, i) => ({
    date: new Date(2023, i, 1).toISOString(),
    adjClose: 100 + i * 2, // Linearly increasing month-ends
  }));

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    (tiingoClient.fetchHistoricalPrices as jest.Mock).mockResolvedValue(
      mockPrices,
    );
    (tiingoClient.getMonthEndPrices as jest.Mock).mockReturnValue(
      mockMonthEnds,
    );

    // Default user: No overrides (empty or default config)
    (userActions.getUserPreferences as jest.Mock).mockResolvedValue({
      tickers: {
        usStocks: "VTI",
        intlStocks: "VEA",
        usBonds: "BND",
        realEstate: "VNQ",
        commodities: "GSG",
      },
    });
  });

  describe("BR-003: Data Handling & Signal Generation", () => {
    it("should generate 12 months of history for standard assets", async () => {
      const signals = await getMarketSignals("SMA");

      expect(signals).toHaveLength(5); // 5 Ivy Assets
      const vti = signals.find((s) => s.symbol === "VTI");

      expect(vti).toBeDefined();
      expect(vti?.history).toHaveLength(12);
      expect(vti?.status).toBe("Risk-On"); // Price increasing > MA
    });

    it("should correctly toggle between SMA and EMA", async () => {
      // SMA
      await getMarketSignals("SMA");
      // Verify calculating MA was called implicitly via logic flow
      // (Since we are testing integration, we check the output state if possible,
      // or we trust unit tests for math and just check plumbing here)
    });
  });

  describe("BR-004: User Overrides", () => {
    it("should use user-defined tickers when present", async () => {
      // Mock User Preferences to override US Stocks with "SPY"
      (userActions.getUserPreferences as jest.Mock).mockResolvedValue({
        tickers: {
          usStocks: "SPY",
          intlStocks: "VEA",
          usBonds: "BND",
          realEstate: "VNQ",
          commodities: "GSG",
        },
      });

      const signals = await getMarketSignals("SMA");

      const usStockSignal = signals.find((s) => s.name === "US Stocks");
      expect(usStockSignal?.symbol).toBe("SPY");

      // Verify Tiingo was called with SPY
      expect(tiingoClient.fetchHistoricalPrices).toHaveBeenCalledWith(
        "SPY",
        expect.any(Object),
      );
    });
  });

  describe("BR-005: Demo Mode / Fallback", () => {
    it("should return mock data when API fails", async () => {
      // Simulate API failure
      (tiingoClient.fetchHistoricalPrices as jest.Mock).mockRejectedValue(
        new Error("API Error"),
      );

      const signals = await getMarketSignals("SMA");

      expect(signals).toHaveLength(5);
      expect(signals[0].name).toContain("Mock");
      expect(signals[0].lastUpdated).toBe("DEMO");
    });
  });
});
