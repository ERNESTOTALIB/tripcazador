/**
 * /api/premium/watchlist-cron route.test.ts — SSS314
 *
 * Tests del cron diario: auth por token, response shape, sin tocar
 * el flujo de email (que depende de RESEND_PROXY_TOKEN y un endpoint
 * remoto). El email integration se prueba manualmente en staging.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";
import { createWatch, _clearStore } from "@/lib/watchlist_store";

const CUSTOMER = "cs_live_user314AAA";

function getReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/premium/watchlist-cron${qs}`);
}

describe("GET /api/premium/watchlist-cron SSS314 auth", () => {
  const ORIG_ENV = process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM;

  beforeEach(() => {
    _clearStore();
    process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM = "test_token_x";
  });
  afterEach(() => {
    if (ORIG_ENV === undefined) {
      delete process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM;
    } else {
      process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM = ORIG_ENV;
    }
    vi.restoreAllMocks();
  });

  // AUDIT-FULL-3: post verifyCronToken, sin token configurado devuelve 401
  // (no 503) para no distinguir entre "no config" y "token wrong" — info disclosure fix.
  it("401 si no hay token configurado", async () => {
    delete process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM;
    delete process.env.PRICE_ALERT_CRON_TOKEN;
    delete process.env.CRON_TOKEN_WATCHLIST;
    const res = await GET(getReq("?token=test_token_x"));
    expect(res.status).toBe(401);
  });

  it("401 sin token correcto", async () => {
    const res = await GET(getReq("?token=wrong"));
    expect(res.status).toBe(401);
  });

  it("401 sin parametro token", async () => {
    const res = await GET(getReq(""));
    expect(res.status).toBe(401);
  });

  it("200 con token correcto", async () => {
    // Mock fetch para /api/deals
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ deals: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const res = await GET(getReq("?token=test_token_x"));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(d.watches_active).toBe(0);
    expect(d.triggered).toBe(0);
  });

  it("constant-time compare: tokens distintos largos diferentes → 401", async () => {
    const res = await GET(getReq("?token=short"));
    expect(res.status).toBe(401);
  });
});

describe("GET /api/premium/watchlist-cron SSS314 flujo trigger", () => {
  beforeEach(() => {
    _clearStore();
    process.env.PRICE_ALERT_CRON_TOKEN_PREMIUM = "test_token_x";
  });
  afterEach(() => vi.restoreAllMocks());

  it("dispara trigger cuando precio baja por debajo del threshold", async () => {
    const watch = await createWatch({
      customerId: CUSTOMER,
      email: "x@y.com",
      deal_id: "deal_xyz",
      origin: "BCN",
      destination: "JFK",
      price_when_added: 400,
      target_drop_pct: 10, // 360
    });

    // Mock /api/deals con el deal a 320 (-20%) y /api/notify-alert con éxito
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const urlStr = String(url);
        if (urlStr.includes("/api/deals")) {
          return new Response(
            JSON.stringify({
              deals: [
                {
                  id: "deal_xyz",
                  origin: "BCN",
                  destination: "JFK",
                  price_eur: 320,
                  airline_name: "Iberia",
                },
              ],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        if (urlStr.includes("/api/notify-alert")) {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
        return new Response("[]", { status: 200 });
      }),
    );
    process.env.RESEND_PROXY_TOKEN = "fake_resend";

    const res = await GET(getReq("?token=test_token_x"));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.watches_active).toBe(1);
    expect(d.checked).toBe(1);
    expect(d.triggered).toBe(1);
    expect(d.sent).toBe(1);

    delete process.env.RESEND_PROXY_TOKEN;
  });

  it("no dispara si bajada < threshold", async () => {
    await createWatch({
      customerId: CUSTOMER,
      email: "x@y.com",
      deal_id: "deal_n",
      origin: "BCN",
      destination: "JFK",
      price_when_added: 400,
      target_drop_pct: 10, // 360
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            deals: [
              {
                id: "deal_n",
                origin: "BCN",
                destination: "JFK",
                price_eur: 380, // solo -5%
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    const res = await GET(getReq("?token=test_token_x"));
    const d = await res.json();
    expect(d.checked).toBe(1);
    expect(d.triggered).toBe(0);
    expect(d.sent).toBe(0);
  });

  it("skip si no hay deal para la ruta", async () => {
    await createWatch({
      customerId: CUSTOMER,
      email: "x@y.com",
      deal_id: "deal_nodeal",
      origin: "BCN",
      destination: "JFK",
      price_when_added: 400,
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

    const res = await GET(getReq("?token=test_token_x"));
    const d = await res.json();
    expect(d.skipped).toBe(1);
    expect(d.triggered).toBe(0);
  });
});
