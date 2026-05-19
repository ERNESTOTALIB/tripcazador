/**
 * watchlist_observation.test.ts — SSS314 (19 may 2026)
 *
 * Tests para pickCurrentPrice() — heurística que el cron usa para
 * elegir el precio actual de un deal vigilado.
 */
import { describe, it, expect } from "vitest";
import {
  pickCurrentPrice,
  type DealLite,
} from "../watchlist_observation";
import type { WatchlistEntry } from "../watchlist_store";

const baseEntry: WatchlistEntry = {
  id: "wl_x",
  customerId: "cus_X",
  email: "x@y.com",
  deal_id: "deal_abc",
  origin: "BCN",
  destination: "JFK",
  price_when_added: 400,
  target_drop_pct: 10,
  created_at: 0,
  last_checked_at: null,
  last_seen_price: null,
  triggered_at: null,
  active: true,
};

describe("pickCurrentPrice SSS314", () => {
  it("match exacto por deal_id preferido", () => {
    const deals: DealLite[] = [
      { id: "other", origin: "BCN", destination: "JFK", price_eur: 200 },
      { id: "deal_abc", origin: "BCN", destination: "JFK", price_eur: 350 },
    ];
    const r = pickCurrentPrice(baseEntry, deals);
    expect(r?.price).toBe(350); // exact match aunque "other" sea más barato
    expect(r?.deal.id).toBe("deal_abc");
  });

  it("fallback a misma ruta más barata si no hay match exacto", () => {
    const deals: DealLite[] = [
      { id: "x1", origin: "BCN", destination: "JFK", price_eur: 380 },
      { id: "x2", origin: "BCN", destination: "JFK", price_eur: 310 },
      { id: "x3", origin: "BCN", destination: "JFK", price_eur: 350 },
    ];
    const r = pickCurrentPrice(baseEntry, deals);
    expect(r?.price).toBe(310);
  });

  it("null si no hay deals de la ruta", () => {
    const deals: DealLite[] = [
      { id: "x1", origin: "MAD", destination: "JFK", price_eur: 200 },
      { id: "x2", origin: "BCN", destination: "LAX", price_eur: 300 },
    ];
    expect(pickCurrentPrice(baseEntry, deals)).toBeNull();
  });

  it("ignora deals con price_eur <= 0 (sucio)", () => {
    const deals: DealLite[] = [
      { id: "x1", origin: "BCN", destination: "JFK", price_eur: 0 },
      { id: "x2", origin: "BCN", destination: "JFK", price_eur: -5 },
    ];
    expect(pickCurrentPrice(baseEntry, deals)).toBeNull();
  });

  it("ignora match exacto si su precio es 0/missing y cae a fallback", () => {
    const deals: DealLite[] = [
      { id: "deal_abc", origin: "BCN", destination: "JFK", price_eur: 0 },
      { id: "x2", origin: "BCN", destination: "JFK", price_eur: 320 },
    ];
    const r = pickCurrentPrice(baseEntry, deals);
    expect(r?.price).toBe(320);
  });

  it("array vacío → null", () => {
    expect(pickCurrentPrice(baseEntry, [])).toBeNull();
  });
});
