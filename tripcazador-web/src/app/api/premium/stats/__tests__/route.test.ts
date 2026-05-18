/**
 * /api/premium/stats route.test.ts — SSS303
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { createAlert, markTriggered, _clearStore as clearAlerts } from "@/lib/price_alerts_store";
import { createSavedSearch, _clearStore as clearSearches } from "@/lib/saved_searches_store";

function req(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/stats${qs}`);
}

describe("GET /api/premium/stats SSS303", () => {
  beforeEach(() => {
    clearAlerts();
    clearSearches();
  });

  it("400 customer_id missing", async () => {
    const res = await GET(req());
    expect(res.status).toBe(400);
  });

  it("200 con stats vacías", async () => {
    const res = await GET(req("?customer_id=cs_live_empty999"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.alerts.active).toBe(0);
    expect(data.alerts.triggered).toBe(0);
    expect(data.saved_searches.count).toBe(0);
    expect(data.savings.estimated_eur).toBe(0);
  });

  it("alerts active counted", async () => {
    await createAlert({
      email: "x@y.com",
      max_price: 100,
      tier: "premium",
      customerId: "cs_live_statsone",
    });
    await createAlert({
      email: "x@y.com",
      max_price: 200,
      tier: "premium",
      customerId: "cs_live_statsone",
    });
    const res = await GET(req("?customer_id=cs_live_statsone"));
    const data = await res.json();
    expect(data.alerts.active).toBe(2);
    expect(data.alerts.total).toBe(2);
  });

  it("triggered + savings approx 15% de max_price", async () => {
    const a = await createAlert({
      email: "x@y.com",
      max_price: 100,
      tier: "premium",
      customerId: "cs_live_trig0001",
    });
    await markTriggered(a.id);
    const res = await GET(req("?customer_id=cs_live_trig0001"));
    const data = await res.json();
    expect(data.alerts.triggered).toBe(1);
    expect(data.alerts.active).toBe(0); // markTriggered desactiva
    expect(data.savings.estimated_eur).toBe(15); // 100 * 0.15
  });

  it("saved_searches counted", async () => {
    await createSavedSearch({ customerId: "cs_live_searchxAA", name: "x" });
    await createSavedSearch({ customerId: "cs_live_searchxAA", name: "y" });
    const res = await GET(req("?customer_id=cs_live_searchxAA"));
    const data = await res.json();
    expect(data.saved_searches.count).toBe(2);
  });

  it("concierge_promo siempre devuelto", async () => {
    const res = await GET(req("?customer_id=cs_live_promox1AA"));
    const data = await res.json();
    expect(data.concierge_promo.available).toBe(true);
    expect(data.concierge_promo.month).toMatch(/^\d{4}-\d{2}$/);
  });

  it("aislamiento por customer", async () => {
    await createAlert({
      email: "a@y.com",
      max_price: 100,
      tier: "premium",
      customerId: "cs_live_alc01AAAA",
    });
    const res = await GET(req("?customer_id=cs_live_bob01AAAA"));
    const data = await res.json();
    expect(data.alerts.active).toBe(0);
  });
});
