/**
 * /api/premium/weekly-digest-cron route.test.ts — SSS316
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { createAlert, _clearStore as clearAlerts } from "@/lib/price_alerts_store";
import { _clearStore as clearSaved } from "@/lib/saved_searches_store";

function getReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/weekly-digest-cron${qs}`);
}

describe("GET /api/premium/weekly-digest-cron SSS316 auth", () => {
  const ORIG = process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM;
  beforeEach(() => {
    clearAlerts();
    clearSaved();
    process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM = "test_digest_token";
  });
  afterEach(() => {
    if (ORIG === undefined) {
      delete process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM;
    } else {
      process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM = ORIG;
    }
    vi.restoreAllMocks();
  });

  it("503 si no hay token configurado", async () => {
    delete process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM;
    delete process.env.PRICE_ALERT_CRON_TOKEN;
    const res = await GET(getReq("?token=anything"));
    expect(res.status).toBe(503);
  });

  it("401 con token incorrecto", async () => {
    const res = await GET(getReq("?token=wrong"));
    expect(res.status).toBe(401);
  });

  it("200 con token correcto, 0 users eligibles", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ deals: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const res = await GET(getReq("?token=test_digest_token"));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(d.users_eligible).toBe(0);
    expect(d.sent).toBe(0);
  });
});

describe("GET /api/premium/weekly-digest-cron SSS316 flujo", () => {
  beforeEach(() => {
    clearAlerts();
    clearSaved();
    process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM = "test_digest_token";
  });
  afterEach(() => vi.restoreAllMocks());

  it("recolecta Premium users via alertas (dedupe por customerId)", async () => {
    await createAlert({
      email: "user1@example.com",
      origin: "BCN",
      destination: "JFK",
      max_price: 500,
      tier: "premium",
      customerId: "cus_USER1AAA",
    });
    await createAlert({
      email: "user1@example.com",
      origin: "MAD",
      destination: "LAX",
      max_price: 600,
      tier: "premium",
      customerId: "cus_USER1AAA", // misma cust → dedupe
    });
    await createAlert({
      email: "user2@example.com",
      origin: "BCN",
      destination: "JFK",
      max_price: 400,
      tier: "premium",
      customerId: "cus_USER2BBB",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ deals: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const res = await GET(getReq("?token=test_digest_token"));
    const d = await res.json();
    expect(d.users_eligible).toBe(2); // user1 + user2
  });

  it("skip si user no tiene scored deals (sin deals coincidentes)", async () => {
    await createAlert({
      email: "user1@example.com",
      origin: "BCN",
      destination: "JFK",
      max_price: 300,
      tier: "premium",
      customerId: "cus_USER1AAA",
    });
    // Deals que NO matchean (precio demasiado alto)
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            deals: [
              { id: "d1", origin: "BCN", destination: "JFK", price_eur: 999 },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    const res = await GET(getReq("?token=test_digest_token"));
    const d = await res.json();
    expect(d.users_eligible).toBe(1);
    expect(d.skipped).toBe(1);
    expect(d.sent).toBe(0);
  });

  it("skip si RESEND_API_KEY no configurado (no envía pero responde 200)", async () => {
    delete process.env.RESEND_API_KEY;
    await createAlert({
      email: "user1@example.com",
      origin: "BCN",
      destination: "JFK",
      max_price: 500,
      tier: "premium",
      customerId: "cus_USER1AAA",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            deals: [
              { id: "d1", origin: "BCN", destination: "JFK", price_eur: 300, savings_pct: 30 },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    const res = await GET(getReq("?token=test_digest_token"));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.sent).toBe(0);
    expect(d.resend_active).toBe(false);
  });
});
