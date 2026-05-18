/**
 * premium_concierge_promo.test.ts — SSS303
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  hasUsedPromoThisMonth,
  markPromoUsed,
  _clearPromoStore,
} from "../premium_concierge_promo";

describe("premium_concierge_promo SSS303", () => {
  beforeEach(() => _clearPromoStore());

  it("hasUsedPromoThisMonth false al inicio", async () => {
    expect(await hasUsedPromoThisMonth("cs_live_a")).toBe(false);
  });

  it("markPromoUsed luego hasUsedPromoThisMonth true", async () => {
    await markPromoUsed("cs_live_a");
    expect(await hasUsedPromoThisMonth("cs_live_a")).toBe(true);
  });

  it("aislamiento per customer", async () => {
    await markPromoUsed("cs_live_alice");
    expect(await hasUsedPromoThisMonth("cs_live_alice")).toBe(true);
    expect(await hasUsedPromoThisMonth("cs_live_bob")).toBe(false);
  });

  it("customerId vacío devuelve true (no se concede)", async () => {
    expect(await hasUsedPromoThisMonth("")).toBe(true);
  });

  it("markPromoUsed sin customerId no-op", async () => {
    await markPromoUsed("");
    // No throw
    expect(await hasUsedPromoThisMonth("cs_live_random")).toBe(false);
  });
});
