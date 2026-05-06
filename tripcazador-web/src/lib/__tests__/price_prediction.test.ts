import { describe, it, expect } from "vitest";
import { predictPrice, computeHistoricalAvg } from "../price_prediction";

describe("price_prediction", () => {
  it("recommends compra_ya for very cheap deals far in advance", () => {
    const today = new Date();
    today.setMonth(today.getMonth() + 3);
    const date = today.toISOString().slice(0, 10);
    const r = predictPrice(
      { price: 79, date_out: date, origin: "MAD", destination: "BCN" },
      { historicalAvg: 200, sampleSize: 10 },
    );
    expect(r.recommendation).toBe("compra_ya");
    expect(r.likelihood_drop_pct).toBeLessThan(30);
  });

  it("recommends esperar for high price far in advance", () => {
    const today = new Date();
    today.setMonth(today.getMonth() + 3);
    const date = today.toISOString().slice(0, 10);
    const r = predictPrice(
      { price: 280, date_out: date, origin: "MAD", destination: "BCN" },
      { historicalAvg: 200, sampleSize: 10 },
    );
    expect(["espera", "compra"]).toContain(r.recommendation);
  });

  it("returns conservative espera with no data", () => {
    const r = predictPrice({ price: 0, date_out: "" });
    expect(r.recommendation).toBe("espera");
    expect(r.confidence).toBe("baja");
  });

  it("computeHistoricalAvg filters by route + month", () => {
    const deals = [
      { price: 100, origin: "MAD", destination: "BCN", date_out: "2026-07-15" },
      { price: 200, origin: "MAD", destination: "BCN", date_out: "2026-07-20" },
      { price: 999, origin: "MAD", destination: "OTHER", date_out: "2026-07-15" },
      { price: 50, origin: "MAD", destination: "BCN", date_out: "2026-08-01" },
    ];
    const r = computeHistoricalAvg(deals, "MAD", "BCN", "2026-07");
    expect(r.n).toBe(2);
    expect(r.avg).toBe(150);
  });
});
