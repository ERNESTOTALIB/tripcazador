/**
 * deal_scoring_v3.test.ts — SSS374
 *
 * Verifica que el wrapper v3 ajuste confidence basado en histórico:
 *  - sin samples → no ajuste
 *  - high booking_rate → boost
 *  - high false_positive → penalty
 *  - cambio de label cuando ajuste cruza umbral
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  scoreDealV3,
  recordOutcome,
  lookupRouteHistory,
  buildRouteKey,
  __resetForTests,
} from "../deal_scoring_v3";

beforeEach(() => __resetForTests());

describe("buildRouteKey", () => {
  it("normaliza a uppercase", () => {
    expect(
      buildRouteKey({ origin: "mad", destination: "nrt", airline_code: "nh", price_eur: 500 }),
    ).toBe("MAD-NRT-NH");
  });

  it("fallback XXX/XX cuando faltan", () => {
    expect(buildRouteKey({ price_eur: 100 })).toBe("XXX-XXX-XX");
  });
});

describe("scoreDealV3 sin histórico", () => {
  it("sin samples → no ajuste, hereda label v2", () => {
    const r = scoreDealV3({
      origin: "MAD",
      destination: "NRT",
      airline_code: "NH",
      price_eur: 499,
      savings_pct: 60,
      cabin: "economy",
    });
    expect(r.v3_adjustment).toBe(0);
    expect(r.v3_reason).toHaveLength(0);
    expect(r.route_stats).toBeUndefined();
  });
});

describe("scoreDealV3 con histórico positivo", () => {
  it("aplica boost +10 cuando booking_rate > 40%", () => {
    // 3 booked de 3 = 100% booking_rate
    recordOutcome("d1", "MAD-NRT-NH", "booked");
    recordOutcome("d2", "MAD-NRT-NH", "booked");
    recordOutcome("d3", "MAD-NRT-NH", "booked");

    const r = scoreDealV3({
      origin: "MAD",
      destination: "NRT",
      airline_code: "NH",
      price_eur: 499,
      savings_pct: 50,
    });
    expect(r.v3_adjustment).toBeGreaterThanOrEqual(10);
    expect(r.v3_reason.some((x) => x.includes("Histórico positivo"))).toBe(true);
  });
});

describe("scoreDealV3 con histórico negativo", () => {
  it("aplica penalty cuando false_positive_rate > 30%", () => {
    recordOutcome("d1", "MAD-LHR-BA", "false_positive");
    recordOutcome("d2", "MAD-LHR-BA", "false_positive");
    recordOutcome("d3", "MAD-LHR-BA", "false_positive");
    recordOutcome("d4", "MAD-LHR-BA", "booked");

    const r = scoreDealV3({
      origin: "MAD",
      destination: "LHR",
      airline_code: "BA",
      price_eur: 99,
      savings_pct: 70,
    });
    expect(r.v3_adjustment).toBeLessThan(0);
    expect(r.v3_reason.some((x) => x.includes("falsos positivos"))).toBe(true);
  });
});

describe("lookupRouteHistory", () => {
  it("computa rates correctamente", () => {
    recordOutcome("d1", "BCN-JFK-IB", "booked");
    recordOutcome("d2", "BCN-JFK-IB", "booked");
    recordOutcome("d3", "BCN-JFK-IB", "expired_no_takers");
    recordOutcome("d4", "BCN-JFK-IB", "false_positive");

    const s = lookupRouteHistory("BCN-JFK-IB");
    expect(s.total_samples).toBe(4);
    expect(s.booking_rate).toBe(0.5);
    expect(s.expired_rate).toBe(0.25);
    expect(s.false_positive_rate).toBe(0.25);
    expect(s.is_significant).toBe(true);
  });

  it("not significant si <3 samples", () => {
    recordOutcome("d1", "X-Y-Z", "booked");
    expect(lookupRouteHistory("X-Y-Z").is_significant).toBe(false);
  });

  it("route_key inexistente → zeros", () => {
    const s = lookupRouteHistory("AAA-BBB-CC");
    expect(s.total_samples).toBe(0);
    expect(s.booking_rate).toBe(0);
  });
});
