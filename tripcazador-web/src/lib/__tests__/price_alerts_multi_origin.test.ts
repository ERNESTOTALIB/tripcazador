/**
 * price_alerts_multi_origin.test.ts — SSS303
 *
 * Tests para feature Premium "multi-origin alerts" (origins[]).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createAlert, _clearStore } from "../price_alerts_store";
import { dealMatchesAlert } from "../../app/api/price-alerts/match-cron-premium/route";

describe("multi-origin alerts SSS303", () => {
  beforeEach(() => _clearStore());

  it("Premium puede crear alert con origins[]", async () => {
    const a = await createAlert({
      email: "x@y.com",
      max_price: 200,
      tier: "premium",
      customerId: "cs_live_multi001",
      origins: ["BCN", "MAD", "VLC"],
    });
    expect(a.origins).toEqual(["BCN", "MAD", "VLC"]);
  });

  it("origins[] IATA filtradas + dedupe + cap 5", async () => {
    const a = await createAlert({
      email: "x@y.com",
      max_price: 200,
      tier: "premium",
      customerId: "cs_live_multi002",
      origins: ["BCN", "MAD", "garbage", "BCN", "VLC", "BIO", "SVQ", "AGP"],
    });
    expect(a.origins?.length).toBeLessThanOrEqual(5);
    expect(a.origins).not.toContain("garbage");
    // dedupe
    expect(a.origins?.filter((o) => o === "BCN").length).toBe(1);
  });

  it("free tier NO puede setear origins[] (ignorado)", async () => {
    const a = await createAlert({
      email: "x@y.com",
      max_price: 200,
      tier: "free",
      origins: ["BCN", "MAD"],
    });
    expect(a.origins).toBeUndefined();
  });

  it("dealMatchesAlert: origins match cualquiera del array", () => {
    const alert = {
      id: "pa_x",
      email: "x@y.com",
      max_price: 300,
      created_at: 0,
      triggered_at: null,
      active: true,
      tier: "premium" as const,
      origins: ["BCN", "MAD", "VLC"],
    };
    expect(dealMatchesAlert({ origin: "BCN", destination: "JFK", price_eur: 250 }, alert)).toBe(true);
    expect(dealMatchesAlert({ origin: "MAD", destination: "JFK", price_eur: 250 }, alert)).toBe(true);
    expect(dealMatchesAlert({ origin: "VLC", destination: "JFK", price_eur: 250 }, alert)).toBe(true);
  });

  it("dealMatchesAlert: origins NO match si origin del deal no está en la lista", () => {
    const alert = {
      id: "pa_x",
      email: "x@y.com",
      max_price: 300,
      created_at: 0,
      triggered_at: null,
      active: true,
      tier: "premium" as const,
      origins: ["BCN", "MAD"],
    };
    expect(dealMatchesAlert({ origin: "ZRH", destination: "JFK", price_eur: 250 }, alert)).toBe(false);
  });

  it("dealMatchesAlert: origins prevalece sobre origin", () => {
    const alert = {
      id: "pa_x",
      email: "x@y.com",
      origin: "BCN",
      max_price: 300,
      created_at: 0,
      triggered_at: null,
      active: true,
      tier: "premium" as const,
      origins: ["MAD", "VLC"], // distinto a origin
    };
    expect(dealMatchesAlert({ origin: "BCN", price_eur: 250 }, alert)).toBe(false);
    expect(dealMatchesAlert({ origin: "MAD", price_eur: 250 }, alert)).toBe(true);
  });

  it("dealMatchesAlert: origins=[] (vacío) ignora multi y usa origin", () => {
    const alert = {
      id: "pa_x",
      email: "x@y.com",
      origin: "BCN",
      max_price: 300,
      created_at: 0,
      triggered_at: null,
      active: true,
      tier: "premium" as const,
      origins: [] as string[],
    };
    expect(dealMatchesAlert({ origin: "BCN", price_eur: 250 }, alert)).toBe(true);
    expect(dealMatchesAlert({ origin: "MAD", price_eur: 250 }, alert)).toBe(false);
  });

  it("dealMatchesAlert: deal sin origin no match con origins[]", () => {
    const alert = {
      id: "pa_x",
      email: "x@y.com",
      max_price: 300,
      created_at: 0,
      triggered_at: null,
      active: true,
      tier: "premium" as const,
      origins: ["BCN"],
    };
    expect(dealMatchesAlert({ price_eur: 250 }, alert)).toBe(false);
  });
});
