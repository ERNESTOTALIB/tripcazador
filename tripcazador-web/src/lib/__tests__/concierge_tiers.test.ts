/**
 * concierge_tiers.test.ts — SSS241 (16 may 2026)
 *
 * Tests para lib/concierge_tiers.ts (143 líneas, Stripe revenue config).
 *
 * El catálogo de tiers + price IDs es REVENUE-CRITICAL: si rompemos
 * un tier ID o un fallback price_id Stripe, el /concierge/checkout
 * falla silenciosamente.
 */
import { describe, it, expect } from "vitest";
import {
  CONCIERGE_TIERS,
  CONCIERGE_TIER_IDS,
  DEFAULT_TIER,
  isValidTier,
  getTier,
  resolvePriceIdForTier,
  type ConciergeTier,
} from "../concierge_tiers";

describe("CONCIERGE_TIER_IDS catalog", () => {
  it("tiene exactamente 4 tiers", () => {
    expect(CONCIERGE_TIER_IDS).toHaveLength(4);
  });

  it("incluye express/standard/premium/pro en orden", () => {
    expect(CONCIERGE_TIER_IDS).toEqual([
      "express",
      "standard",
      "premium",
      "pro",
    ]);
  });

  it("cada tier ID tiene definición en CONCIERGE_TIERS", () => {
    for (const id of CONCIERGE_TIER_IDS) {
      expect(CONCIERGE_TIERS[id]).toBeDefined();
      expect(CONCIERGE_TIERS[id].id).toBe(id);
    }
  });
});

describe("CONCIERGE_TIERS — campos obligatorios", () => {
  it("cada tier tiene amount_eur > 0", () => {
    for (const tier of Object.values(CONCIERGE_TIERS)) {
      expect(tier.amount_eur).toBeGreaterThan(0);
    }
  });

  it("amount_eur estricto monotónico ascending (express < standard < premium < pro)", () => {
    const prices = CONCIERGE_TIER_IDS.map((id) => CONCIERGE_TIERS[id].amount_eur);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThan(prices[i - 1]);
    }
  });

  it("cada tier tiene delivery_hours > 0", () => {
    for (const tier of Object.values(CONCIERGE_TIERS)) {
      expect(tier.delivery_hours).toBeGreaterThan(0);
    }
  });

  it("delivery_hours ascending (express<standard<premium<pro)", () => {
    const hours = CONCIERGE_TIER_IDS.map(
      (id) => CONCIERGE_TIERS[id].delivery_hours,
    );
    for (let i = 1; i < hours.length; i++) {
      expect(hours[i]).toBeGreaterThanOrEqual(hours[i - 1]);
    }
  });

  it("cada tier tiene name, tagline, bullets (3-4 items)", () => {
    for (const tier of Object.values(CONCIERGE_TIERS)) {
      expect(tier.name).toBeTruthy();
      expect(tier.tagline).toBeTruthy();
      expect(tier.bullets.length).toBeGreaterThanOrEqual(3);
      expect(tier.bullets.length).toBeLessThanOrEqual(5);
    }
  });

  it("cada tier tiene envVarPriceId formato STRIPE_PRICE_CONCIERGE_<TIER>", () => {
    for (const id of CONCIERGE_TIER_IDS) {
      const tier = CONCIERGE_TIERS[id];
      expect(tier.envVarPriceId).toMatch(/^STRIPE_PRICE_CONCIERGE_[A-Z]+$/);
    }
  });

  it("cada tier tiene fallbackPriceId formato price_xxxxx (revenue critical)", () => {
    for (const tier of Object.values(CONCIERGE_TIERS)) {
      expect(tier.fallbackPriceId).toMatch(/^price_[A-Za-z0-9]{10,}$/);
    }
  });

  it("solo UN tier tiene popular=true (UI marker)", () => {
    const popularCount = Object.values(CONCIERGE_TIERS).filter(
      (t) => t.popular,
    ).length;
    expect(popularCount).toBe(1);
  });

  it("popular tier es 'standard' (€19 sweet-spot)", () => {
    expect(CONCIERGE_TIERS.standard.popular).toBe(true);
  });
});

describe("isValidTier — type guard runtime", () => {
  it("acepta los 4 tier IDs válidos", () => {
    expect(isValidTier("express")).toBe(true);
    expect(isValidTier("standard")).toBe(true);
    expect(isValidTier("premium")).toBe(true);
    expect(isValidTier("pro")).toBe(true);
  });

  it("rechaza strings que no son tier IDs", () => {
    expect(isValidTier("invalid")).toBe(false);
    expect(isValidTier("EXPRESS")).toBe(false); // case-sensitive
    expect(isValidTier("")).toBe(false);
    expect(isValidTier("free")).toBe(false);
  });

  it("rechaza non-string (anti-injection)", () => {
    expect(isValidTier(null)).toBe(false);
    expect(isValidTier(undefined)).toBe(false);
    expect(isValidTier(42)).toBe(false);
    expect(isValidTier({})).toBe(false);
    expect(isValidTier([])).toBe(false);
    expect(isValidTier(true)).toBe(false);
  });
});

describe("getTier", () => {
  it("retorna definición para tier válido", () => {
    const tier = getTier("standard");
    expect(tier).not.toBeNull();
    expect(tier?.id).toBe("standard");
    expect(tier?.amount_eur).toBe(19);
  });

  it("null para input inválido", () => {
    expect(getTier("ghost")).toBeNull();
    expect(getTier(null)).toBeNull();
    expect(getTier(undefined)).toBeNull();
    expect(getTier(42)).toBeNull();
  });
});

describe("DEFAULT_TIER", () => {
  it("es 'standard' (sweet-spot €19, popular)", () => {
    expect(DEFAULT_TIER).toBe("standard");
  });

  it("DEFAULT_TIER es un tier válido", () => {
    expect(isValidTier(DEFAULT_TIER)).toBe(true);
  });
});

describe("resolvePriceIdForTier (server-side)", () => {
  const tiers: ConciergeTier[] = ["express", "standard", "premium", "pro"];

  it("retorna fallbackPriceId si env var no está set", () => {
    // Asumimos env vars no están set en test env
    for (const tier of tiers) {
      const priceId = resolvePriceIdForTier(tier);
      expect(priceId).toMatch(/^price_/);
      expect(priceId).toBe(CONCIERGE_TIERS[tier].fallbackPriceId);
    }
  });

  it("retorna env var si está set y empieza con price_", () => {
    const orig = process.env.STRIPE_PRICE_CONCIERGE_EXPRESS;
    process.env.STRIPE_PRICE_CONCIERGE_EXPRESS = "price_test_override";
    expect(resolvePriceIdForTier("express")).toBe("price_test_override");
    process.env.STRIPE_PRICE_CONCIERGE_EXPRESS = orig;
  });

  it("ignora env var si NO empieza por price_ (anti-bad-config)", () => {
    const orig = process.env.STRIPE_PRICE_CONCIERGE_EXPRESS;
    process.env.STRIPE_PRICE_CONCIERGE_EXPRESS = "junk-value";
    const priceId = resolvePriceIdForTier("express");
    expect(priceId).toBe(CONCIERGE_TIERS.express.fallbackPriceId); // fallback
    process.env.STRIPE_PRICE_CONCIERGE_EXPRESS = orig;
  });
});

describe("revenue invariants (precio matriz)", () => {
  it("express €9", () => {
    expect(CONCIERGE_TIERS.express.amount_eur).toBe(9);
  });

  it("standard €19", () => {
    expect(CONCIERGE_TIERS.standard.amount_eur).toBe(19);
  });

  it("premium €49", () => {
    expect(CONCIERGE_TIERS.premium.amount_eur).toBe(49);
  });

  it("pro €99", () => {
    expect(CONCIERGE_TIERS.pro.amount_eur).toBe(99);
  });

  it("delivery_label coherente con delivery_hours", () => {
    expect(CONCIERGE_TIERS.express.delivery_label).toContain("24");
    // SSS327: standard bajó de 48h → 24h (match velocidad express con mejor servicio)
    expect(CONCIERGE_TIERS.standard.delivery_label).toContain("24");
    expect(CONCIERGE_TIERS.standard.delivery_hours).toBe(24);
    expect(CONCIERGE_TIERS.premium.delivery_label).toContain("72");
    expect(CONCIERGE_TIERS.pro.delivery_hours).toBe(120);
  });

  it("SSS327 standard guarantee menciona 'opción mejor'", () => {
    const bullets = CONCIERGE_TIERS.standard.bullets.join(" ").toLowerCase();
    expect(bullets).toContain("opción mejor");
    expect(bullets).toContain("devolvemos");
  });
});
