/**
 * /api/premium/winback-cron route.test.ts — SSS322
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { createAlert, _clearStore as clearAlerts } from "@/lib/price_alerts_store";
import { recordLastSeen, _clearStore as clearLastSeen } from "@/lib/last_seen_store";
import { _clearStore as clearSavings } from "@/lib/savings_log_store";

function getReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/winback-cron${qs}`);
}

describe("GET /api/premium/winback-cron SSS322 auth", () => {
  const ORIG = process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM;
  beforeEach(() => {
    clearAlerts();
    clearLastSeen();
    clearSavings();
    process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM = "test_wb_token";
  });
  afterEach(() => {
    if (ORIG === undefined) delete process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM;
    else process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM = ORIG;
    vi.restoreAllMocks();
  });

  it("503 sin token configurado", async () => {
    delete process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM;
    delete process.env.PRICE_ALERT_CRON_TOKEN;
    const res = await GET(getReq("?token=anything"));
    expect(res.status).toBe(503);
  });

  it("401 token incorrecto", async () => {
    const res = await GET(getReq("?token=wrong"));
    expect(res.status).toBe(401);
  });

  it("200 sin candidatos", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ deals: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const res = await GET(getReq("?token=test_wb_token"));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.users_total).toBe(0);
    expect(d.eligible).toBe(0);
  });
});

describe("GET /api/premium/winback-cron SSS322 flujo", () => {
  beforeEach(() => {
    clearAlerts();
    clearLastSeen();
    clearSavings();
    process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM = "test_wb_token";
  });
  afterEach(() => vi.restoreAllMocks());

  it("Premium con alert antigua y sin heartbeat → eligible", async () => {
    // Alert creada hace 30 días, sin heartbeat
    await createAlert({
      email: "lapsed@example.com",
      origin: "BCN",
      destination: "JFK",
      max_price: 500,
      tier: "premium",
      customerId: "cus_LAPSED000001",
    });
    // Sobrescribimos created_at vía hack: simulate antigüedad
    const { listActiveAlertsByTier } = await import("@/lib/price_alerts_store");
    const all = await listActiveAlertsByTier("premium");
    all[0].created_at = Date.now() - 30 * 86_400_000;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ deals: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const res = await GET(getReq("?token=test_wb_token"));
    const d = await res.json();
    expect(d.users_total).toBe(1);
    expect(d.eligible).toBe(1);
  });

  it("Premium con heartbeat reciente → NO eligible", async () => {
    await createAlert({
      email: "active@example.com",
      origin: "BCN",
      destination: "JFK",
      max_price: 500,
      tier: "premium",
      customerId: "cus_ACTIVE000001",
    });
    await recordLastSeen("cus_ACTIVE000001", Date.now() - 2 * 86_400_000); // 2d ago

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ deals: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const res = await GET(getReq("?token=test_wb_token"));
    const d = await res.json();
    expect(d.eligible).toBe(0);
    expect(d.skipped).toBe(1);
  });

  it("RESEND_API_KEY no set → skip + resend_active=false", async () => {
    delete process.env.RESEND_API_KEY;
    await createAlert({
      email: "lapsed@example.com",
      origin: "BCN",
      destination: "JFK",
      max_price: 500,
      tier: "premium",
      customerId: "cus_LAPSED000002",
    });
    const { listActiveAlertsByTier } = await import("@/lib/price_alerts_store");
    const all = await listActiveAlertsByTier("premium");
    all[0].created_at = Date.now() - 30 * 86_400_000;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ deals: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    const res = await GET(getReq("?token=test_wb_token"));
    const d = await res.json();
    expect(d.sent).toBe(0);
    expect(d.resend_active).toBe(false);
  });
});
