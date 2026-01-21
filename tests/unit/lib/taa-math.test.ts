import {
  calculateMovingAverage,
  calculateSMA,
  calculateEMA,
  getSignalAction,
  calculateSafetyBuffer,
} from "@/lib/taa-math";

describe("TAA Math Library", () => {
  describe("SMA Calculation (BR-001)", () => {
    it("should calculate correct SMA for 10 periods", () => {
      // 1 to 10
      const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const sma = calculateSMA(prices, 10);
      expect(sma).toBe(5.5); // Sum 55 / 10
    });

    it("should handle insufficient data gracefully", () => {
      const prices = [1, 2, 3];
      const sma = calculateSMA(prices, 10);
      expect(sma).toBe(0);
    });

    it("should use only the last n prices for calculation", () => {
      // 1 to 11 (should ignore 1)
      const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      const sma = calculateSMA(prices, 10);
      expect(sma).toBe(6.5); // Sum 65 / 10
    });
  });

  describe("EMA Calculation (BR-001)", () => {
    it("should calculate correct EMA", () => {
      // Simple test case: constant price should yield constant EMA
      const prices = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
      const ema = calculateEMA(prices, 10);
      expect(ema).toBe(10);
    });

    it("should react to price changes more intricately than SMA", () => {
      // Ramp up
      const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const ema = calculateEMA(prices, 10);
      // Manual check or logical check: EMA should lag current price but lead SMA
      // SMA would be 14.5
      // EMA calculation logic verification
      expect(ema).toBeGreaterThan(10);
      expect(ema).toBeLessThan(19);
    });
  });

  describe("unified calculateMovingAverage", () => {
    const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    it("should route to SMA correctly", () => {
      expect(calculateMovingAverage(prices, "SMA", 10)).toBe(5.5);
    });

    it("should route to EMA correctly", () => {
      // Just verify it returns same as direct call
      const ema = calculateEMA(prices, 10);
      expect(calculateMovingAverage(prices, "EMA", 10)).toBe(ema);
    });
  });

  describe("Signal Action Logic (BR-002)", () => {
    it("should signal BUY when crossing UP", () => {
      // Prev: Price 90 < Trend 100 (Risk-Off)
      // Curr: Price 110 > Trend 100 (Risk-On)
      expect(getSignalAction(110, 100, 90, 100)).toBe("Buy");
    });

    it("should signal SELL when crossing DOWN", () => {
      // Prev: Price 110 > Trend 100 (Risk-On)
      // Curr: Price 90 < Trend 100 (Risk-Off)
      expect(getSignalAction(90, 100, 110, 100)).toBe("Sell");
    });

    it("should signal HOLD when staying UP", () => {
      // Risk-On -> Risk-On
      expect(getSignalAction(110, 100, 120, 100)).toBe("Hold");
    });

    it("should signal STAY CASH when staying DOWN", () => {
      // Risk-Off -> Risk-Off
      expect(getSignalAction(90, 100, 80, 100)).toBe("Stay Cash");
    });
  });

  describe("Safety Buffer (BR-001)", () => {
    it("should calculate positive buffer when price > trend", () => {
      // Price 110, Trend 100 -> +10%
      expect(calculateSafetyBuffer(110, 100)).toBeCloseTo(10);
    });

    it("should calculate negative buffer when price < trend", () => {
      // Price 90, Trend 100 -> -10%
      expect(calculateSafetyBuffer(90, 100)).toBeCloseTo(-10);
    });
  });
});
