/**
 * /api/premium/weekly-digest route.test.ts — SSS304
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, scoreDeal } from "../route";
import { createAlert, _clearStore as clearAlerts } from "@/lib/price_alerts_store";
import { createSavedSearch, _clearStore as clearSearches } from "@/lib/saved_searches_store";

function req(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/weekly-digest${qs}`);
}

describe("scoreDeal SSS304", () => {
  it("puntúa +5 por alerta match", () => {
    const d = scoreDeal(
      { origin: "BCN", destination: "JFK", price_eur: 300 },
      [{ origin: "BCN", destination: "JFK", max_price: 400 }],
      [],
    );
    expect(d.match_score).toBeGreaterThanOrEqual(5);
    expect(d.why_matched[0]).toContain("alerta");
  });

  it("no puntúa alerta si price > max_price", () => {
    const d = scoreDeal(
      { origin: "BCN", destination: "JFK", price_eur: 500 },
      [{ origin: "BCN", destination: "JFK", max_price: 400 }],
      [],
    );
    expect(d.match_score).toBe(0);
  });

  it("alerta con origins[] (multi)", () => {
    const d = scoreDeal(
      { origin: "MAD", destination: "JFK", price_eur: 300 },
      [{ origins: ["BCN", "MAD"], max_price: 400 }],
      [],
    );
    expect(d.match_score).toBeGreaterThanOrEqual(5);
  });

  it("alerta con origins[] no match si origen no listed", () => {
    const d = scoreDeal(
      { origin: "ZRH", destination: "JFK", price_eur: 300 },
      [{ origins: ["BCN", "MAD"], max_price: 400 }],
      [],
    );
    expect(d.match_score).toBe(0);
  });

  it("puntúa por saved_search origin", () => {
    const d = scoreDeal(
      { origin: "BCN", price_eur: 100 },
      [],
      [{ origin: "BCN", destination: undefined, airlines: [], cabin: "any" }],
    );
    expect(d.match_score).toBeGreaterThanOrEqual(3);
    expect(d.why_matched.some((r) => r.includes("BCN"))).toBe(true);
  });

  it("puntúa por airline en saved_search", () => {
    const d = scoreDeal(
      { airline: "FR", price_eur: 100 },
      [],
      [{ origin: undefined, destination: undefined, airlines: ["FR", "IB"], cabin: "any" }],
    );
    expect(d.match_score).toBeGreaterThanOrEqual(2);
  });

  it("puntúa por cabin business en saved_search", () => {
    const d = scoreDeal(
      { cabin: "business", price_eur: 1500 },
      [],
      [{ origin: undefined, destination: undefined, airlines: [], cabin: "business" }],
    );
    expect(d.match_score).toBeGreaterThanOrEqual(1);
  });

  it("0 score si nada matchea", () => {
    const d = scoreDeal(
      { origin: "ZRH", destination: "LAX", price_eur: 800 },
      [],
      [],
    );
    expect(d.match_score).toBe(0);
  });
});

describe("GET /api/premium/weekly-digest", () => {
  beforeEach(() => {
    clearAlerts();
    clearSearches();
  });

  it("400 customer_id inválido", async () => {
    const res = await GET(req("?customer_id=garbage"));
    expect(res.status).toBe(400);
  });

  it("200 con customer sin alertas ni searches devuelve fallback message", async () => {
    const res = await GET(req("?customer_id=cus_validNothing12"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.digest_week).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.reasoning).toBeTruthy();
  });

  it("200 con customer + searches retorna formato correcto", async () => {
    await createSavedSearch({ customerId: "cus_withSearches12", name: "BCN" });
    const res = await GET(req("?customer_id=cus_withSearches12"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.top_deals)).toBe(true);
  });

  it("200 ambos cus_ y cs_ ID format aceptados", async () => {
    const r1 = await GET(req("?customer_id=cus_validOwner999"));
    const r2 = await GET(req("?customer_id=cs_live_validSess99"));
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
  });
});
