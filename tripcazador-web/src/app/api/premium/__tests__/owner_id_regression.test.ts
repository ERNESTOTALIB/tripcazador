/**
 * owner_id_regression.test.ts — SSS304 (18 may 2026)
 *
 * Regression test: TODOS los endpoints Premium aceptan tanto cus_xxx
 * (Stripe Customer ID, lo que devuelve activate y se guarda en
 * localStorage) como cs_test/cs_live_xxx (Checkout Session ID).
 *
 * Antes de SSS304 los endpoints solo aceptaban cs_*, lo que rompía el
 * flujo para usuarios reales con cus_xxx en localStorage.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as alertsPost, GET as alertsGet } from "../alerts/route";
import { POST as searchesPost, GET as searchesGet } from "../saved-searches/route";
import { GET as statsGet } from "../stats/route";
import { POST as promoPost } from "../concierge-promo/route";
import { _clearStore as clearAlerts } from "@/lib/price_alerts_store";
import { _clearStore as clearSearches } from "@/lib/saved_searches_store";
import { _clearPromoStore } from "@/lib/premium_concierge_promo";

const CUS_ID = "cus_OdLMNOPQRSTUVWXYZ";
const CS_ID = "cs_live_abcdefgh12345";

describe("SSS304 BUG FIX: endpoints aceptan cus_xxx (real Stripe customer)", () => {
  beforeEach(() => {
    clearAlerts();
    clearSearches();
    _clearPromoStore();
  });

  describe("/api/premium/alerts", () => {
    it("POST acepta cus_xxx", async () => {
      const req = new NextRequest("http://localhost/api/premium/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: CUS_ID,
          email: "x@y.com",
          max_price: 100,
        }),
      });
      const res = await alertsPost(req);
      expect(res.status).toBe(201);
    });
    it("POST acepta cs_xxx", async () => {
      const req = new NextRequest("http://localhost/api/premium/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: CS_ID,
          email: "x@y.com",
          max_price: 100,
        }),
      });
      const res = await alertsPost(req);
      expect(res.status).toBe(201);
    });
    it("GET acepta cus_xxx", async () => {
      const req = new NextRequest(`http://localhost/api/premium/alerts?customer_id=${CUS_ID}`);
      const res = await alertsGet(req);
      expect(res.status).toBe(200);
    });
  });

  describe("/api/premium/saved-searches", () => {
    it("POST acepta cus_xxx", async () => {
      const req = new NextRequest("http://localhost/api/premium/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: CUS_ID, name: "Test" }),
      });
      const res = await searchesPost(req);
      expect(res.status).toBe(201);
    });
    it("GET acepta cus_xxx", async () => {
      const req = new NextRequest(`http://localhost/api/premium/saved-searches?customer_id=${CUS_ID}`);
      const res = await searchesGet(req);
      expect(res.status).toBe(200);
    });
  });

  describe("/api/premium/stats", () => {
    it("acepta cus_xxx", async () => {
      const req = new NextRequest(`http://localhost/api/premium/stats?customer_id=${CUS_ID}`);
      const res = await statsGet(req);
      expect(res.status).toBe(200);
    });
  });

  describe("/api/premium/concierge-promo", () => {
    it("POST acepta cus_xxx", async () => {
      const req = new NextRequest("http://localhost/api/premium/concierge-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: CUS_ID }),
      });
      const res = await promoPost(req);
      expect(res.status).toBe(201);
    });
  });
});
