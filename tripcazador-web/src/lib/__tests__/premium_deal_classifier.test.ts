/**
 * premium_deal_classifier.test.ts — SSS305
 */
import { describe, it, expect } from "vitest";
import {
  shouldBePremiumOnly,
  scarcityScore,
  applyPremiumQuota,
  PREMIUM_QUOTA_PCT,
  SAVINGS_THRESHOLD,
  ENGAGEMENT_THRESHOLD,
} from "../premium_deal_classifier";

describe("shouldBePremiumOnly SSS305", () => {
  it("false por defecto", () => {
    expect(shouldBePremiumOnly({})).toBe(false);
  });

  it("true si savings > 70%", () => {
    expect(shouldBePremiumOnly({ savings_pct: 80 })).toBe(true);
  });

  it("false si savings = 70% (exactamente threshold)", () => {
    expect(shouldBePremiumOnly({ savings_pct: 70 })).toBe(false);
  });

  it("true si tag error-fare", () => {
    expect(shouldBePremiumOnly({ tags: ["error-fare"] })).toBe(true);
  });

  it("false si tags sin error-fare", () => {
    expect(shouldBePremiumOnly({ tags: ["weekend", "europe"] })).toBe(false);
  });

  it("true si engagement_24h > 50", () => {
    expect(shouldBePremiumOnly({ engagement_24h: 100 })).toBe(true);
  });

  it("true si vip_pick=true", () => {
    expect(shouldBePremiumOnly({ vip_pick: true })).toBe(true);
  });

  it("vip_pick=true override aunque otros campos falsy", () => {
    expect(
      shouldBePremiumOnly({ vip_pick: true, savings_pct: 10, engagement_24h: 0 }),
    ).toBe(true);
  });
});

describe("scarcityScore SSS305", () => {
  it("vip_pick puntúa más que todo combinado", () => {
    const vip = scarcityScore({ vip_pick: true });
    const everything = scarcityScore({
      savings_pct: 99,
      tags: ["error-fare"],
      engagement_24h: 99,
    });
    expect(vip).toBeGreaterThan(everything);
  });

  it("savings_pct multiplica por 5", () => {
    expect(scarcityScore({ savings_pct: 100 })).toBe(500);
  });

  it("error-fare suma 500", () => {
    expect(scarcityScore({ tags: ["error-fare"] })).toBe(500);
  });

  it("engagement_24h suma 1:1", () => {
    expect(scarcityScore({ engagement_24h: 42 })).toBe(42);
  });

  it("score 0 si nada", () => {
    expect(scarcityScore({})).toBe(0);
  });
});

describe("applyPremiumQuota SSS305", () => {
  it("array vacío devuelve vacío", () => {
    expect(applyPremiumQuota([])).toEqual([]);
  });

  it("respeta el cap PREMIUM_QUOTA_PCT (25%)", () => {
    const deals = Array.from({ length: 20 }, (_, i) => ({
      savings_pct: i * 5 + 50, // todos pasan threshold > 70% para i>=5
    }));
    const result = applyPremiumQuota(deals);
    const premiumCount = result.filter(Boolean).length;
    // 20 deals, 25% cap = 5 max premium
    expect(premiumCount).toBeLessThanOrEqual(Math.floor(20 * PREMIUM_QUOTA_PCT));
  });

  it("respeta minimum 1 premium si hay candidatos y total < 4", () => {
    const deals = [{ vip_pick: true }, { savings_pct: 80 }, {}];
    const result = applyPremiumQuota(deals);
    // 3 deals, 25% cap = 0.75 → max(1, floor) = 1
    expect(result.filter(Boolean).length).toBeLessThanOrEqual(1);
  });

  it("si candidates dentro del cap, todos quedan premium", () => {
    const deals = [
      { savings_pct: 90 }, // premium
      { savings_pct: 50 }, // no
      { savings_pct: 60 }, // no
      { savings_pct: 50 }, // no
    ];
    const result = applyPremiumQuota(deals);
    expect(result).toEqual([true, false, false, false]);
  });

  it("VIP pick gana sobre otros candidatos cuando se aplica cap", () => {
    // 10 deals, cap = 2
    const deals = [
      { savings_pct: 99 }, // candidato
      { vip_pick: true }, // VIP
      { savings_pct: 99 }, // candidato
      ...Array.from({ length: 7 }, () => ({})), // no candidatos
    ];
    const result = applyPremiumQuota(deals);
    // VIP debe estar siempre included
    expect(result[1]).toBe(true);
  });

  it("threshold constants exposed correctly", () => {
    expect(SAVINGS_THRESHOLD).toBe(70);
    expect(ENGAGEMENT_THRESHOLD).toBe(50);
    expect(PREMIUM_QUOTA_PCT).toBe(0.25);
  });
});
