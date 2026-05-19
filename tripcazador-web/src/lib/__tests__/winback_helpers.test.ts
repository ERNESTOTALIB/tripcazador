/**
 * winback_helpers.test.ts — SSS322
 */
import { describe, it, expect } from "vitest";
import { pickFavoriteRoute, pickTopDealsForRoute } from "../winback_helpers";
import type { PriceAlert } from "../price_alerts_store";

function mkAlert(
  origin: string | undefined,
  destination: string | undefined,
  created_at: number,
): PriceAlert {
  return {
    id: `pa_${created_at}`,
    email: "x@y.com",
    origin,
    destination,
    max_price: 500,
    created_at,
    triggered_at: null,
    active: true,
    tier: "premium",
  };
}

describe("pickFavoriteRoute SSS322", () => {
  it("ruta más frecuente gana", () => {
    const alerts: PriceAlert[] = [
      mkAlert("BCN", "JFK", 1000),
      mkAlert("BCN", "JFK", 2000),
      mkAlert("MAD", "LHR", 3000),
    ];
    expect(pickFavoriteRoute(alerts)).toEqual({ origin: "BCN", destination: "JFK" });
  });

  it("empate de count → tiebreak por más antigua", () => {
    const alerts: PriceAlert[] = [
      mkAlert("MAD", "JFK", 1000), // más antigua
      mkAlert("BCN", "JFK", 2000),
    ];
    expect(pickFavoriteRoute(alerts)).toEqual({ origin: "MAD", destination: "JFK" });
  });

  it("null si ninguna alerta tiene ruta completa", () => {
    const alerts: PriceAlert[] = [
      mkAlert(undefined, "JFK", 1000),
      mkAlert("BCN", undefined, 2000),
    ];
    expect(pickFavoriteRoute(alerts)).toBeNull();
  });

  it("null si lista vacía", () => {
    expect(pickFavoriteRoute([])).toBeNull();
  });
});

describe("pickTopDealsForRoute SSS322", () => {
  const deals = [
    { id: "a", origin: "BCN", destination: "JFK", price_eur: 500, savings_pct: 30 },
    { id: "b", origin: "BCN", destination: "JFK", price_eur: 400, savings_pct: 50 },
    { id: "c", origin: "MAD", destination: "LHR", price_eur: 200, savings_pct: 70 },
    { id: "d", origin: "BCN", destination: "JFK", price_eur: 350, savings_pct: 10 },
  ];

  it("filtra por ruta favorita + ordena por savings_pct desc", () => {
    const result = pickTopDealsForRoute(deals, { origin: "BCN", destination: "JFK" }, 2);
    expect(result.map((d) => d.id)).toEqual(["b", "a"]);
  });

  it("fallback a top global si no hay deals en la ruta", () => {
    const result = pickTopDealsForRoute(deals, { origin: "BCN", destination: "TXL" }, 2);
    // c tiene mayor savings_pct globalmente
    expect(result[0].id).toBe("c");
  });

  it("fallback si route es null", () => {
    const result = pickTopDealsForRoute(deals, null, 1);
    expect(result[0].id).toBe("c"); // 70%
  });

  it("respeta limit", () => {
    expect(pickTopDealsForRoute(deals, null, 100).length).toBeLessThanOrEqual(deals.length);
    expect(pickTopDealsForRoute(deals, null, 2).length).toBe(2);
  });

  it("excluye deals con price_eur <= 0 en fallback", () => {
    const dirty = [
      { id: "bad", origin: "ZZZ", destination: "YYY", price_eur: 0, savings_pct: 99 },
      ...deals,
    ];
    const result = pickTopDealsForRoute(dirty, null, 1);
    expect(result[0].id).not.toBe("bad");
  });
});
