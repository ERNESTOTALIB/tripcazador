/**
 * /api/price-alerts/match-cron GET route.test.ts — SSS269 (17 may 2026)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/price_alerts_store", () => ({
  listActiveAlerts: vi.fn(() => Promise.resolve([])),
  markTriggered: vi.fn(() => Promise.resolve()),
}));

const mockFetch = vi.fn();
beforeEach(() => {
  delete process.env.PRICE_ALERT_CRON_TOKEN;
  delete process.env.RESEND_PROXY_TOKEN;
  mockFetch.mockReset();
  mockFetch.mockResolvedValue(
    new Response(JSON.stringify({ deals: [] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  global.fetch = mockFetch;
  vi.resetModules();
});

async function importGet() {
  const mod = await import("../route");
  return mod.GET;
}

function buildReq(query: string = ""): NextRequest {
  return new NextRequest(
    `http://localhost/api/price-alerts/match-cron${query}`,
    { method: "GET" },
  );
}

describe("/api/price-alerts/match-cron GET — auth", () => {
  it("503 si PRICE_ALERT_CRON_TOKEN no configurado", async () => {
    const GET = await importGet();
    const res = await GET(buildReq("?token=any"));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("not_configured");
  });

  it("401 con token incorrecto (constant-time)", async () => {
    process.env.PRICE_ALERT_CRON_TOKEN = "valid_secret";
    const GET = await importGet();
    const res = await GET(buildReq("?token=wrong"));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("unauthorized");
  });

  it("401 sin token (longitud distinta)", async () => {
    process.env.PRICE_ALERT_CRON_TOKEN = "valid_secret";
    const GET = await importGet();
    const res = await GET(buildReq(""));
    expect(res.status).toBe(401);
  });
});

describe("/api/price-alerts/match-cron GET — happy path", () => {
  it("200 con token válido + shape correcto", async () => {
    process.env.PRICE_ALERT_CRON_TOKEN = "valid_secret";
    const GET = await importGet();
    const res = await GET(buildReq("?token=valid_secret"));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(typeof j.deals_total).toBe("number");
    expect(typeof j.alerts_active).toBe("number");
    expect(typeof j.matched).toBe("number");
    expect(typeof j.sent).toBe("number");
    expect(typeof j.skipped).toBe("number");
    expect(typeof j.resend_active).toBe("boolean");
  });

  it("resend_active=true si RESEND_PROXY_TOKEN seteado", async () => {
    process.env.PRICE_ALERT_CRON_TOKEN = "valid_secret";
    process.env.RESEND_PROXY_TOKEN = "proxy_dummy";
    const GET = await importGet();
    const res = await GET(buildReq("?token=valid_secret"));
    const j = await res.json();
    expect(j.resend_active).toBe(true);
  });

  it("resend_active=false sin RESEND_PROXY_TOKEN", async () => {
    process.env.PRICE_ALERT_CRON_TOKEN = "valid_secret";
    const GET = await importGet();
    const res = await GET(buildReq("?token=valid_secret"));
    const j = await res.json();
    expect(j.resend_active).toBe(false);
  });
});
