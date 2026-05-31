/**
 * /api/concierge/my-orders route.test.ts — SSS328
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// SSS332: my-orders ahora lee cookie via next/headers. Mock para tests.
const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mockCookieGet })),
}));

import { NextRequest } from "next/server";
import { GET } from "../route";
import { issueConciergeAccessToken } from "@/lib/concierge_access_token";

function getReq(qs = ""): NextRequest {
  return new NextRequest(`http://localhost/api/concierge/my-orders${qs}`);
}

describe("GET /api/concierge/my-orders SSS328", () => {
  const ORIG_SECRET = process.env.PANEL_SECRET;
  const ORIG_API = process.env.NEXT_PUBLIC_API_URL;
  const ORIG_ADMIN = process.env.ADMIN_TOKEN;

  beforeEach(() => {
    process.env.PANEL_SECRET = "test_secret_xxx";
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    process.env.ADMIN_TOKEN = "test_admin";
    mockCookieGet.mockReset();
    mockCookieGet.mockReturnValue(undefined); // sin cookie por default
  });
  afterEach(() => {
    if (ORIG_SECRET === undefined) delete process.env.PANEL_SECRET;
    else process.env.PANEL_SECRET = ORIG_SECRET;
    if (ORIG_API === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = ORIG_API;
    if (ORIG_ADMIN === undefined) delete process.env.ADMIN_TOKEN;
    else process.env.ADMIN_TOKEN = ORIG_ADMIN;
    vi.restoreAllMocks();
  });

  it("401 sin token (ni cookie ni query)", async () => {
    const res = await GET(getReq(""));
    expect(res.status).toBe(401);
  });

  it("SSS332: 200 con token en cookie httpOnly (preferido)", async () => {
    const cookieToken = issueConciergeAccessToken("user@example.com");
    mockCookieGet.mockReturnValue({ value: cookieToken });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ orders: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const res = await GET(getReq("")); // sin ?token=
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(d.email).toBe("user@example.com");
  });

  it("SSS332: cookie preferida sobre query token (defense)", async () => {
    const cookieToken = issueConciergeAccessToken("cookie@example.com");
    const queryToken = issueConciergeAccessToken("query@example.com");
    mockCookieGet.mockReturnValue({ value: cookieToken });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ orders: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const res = await GET(getReq(`?token=${encodeURIComponent(queryToken)}`));
    const d = await res.json();
    expect(d.email).toBe("cookie@example.com"); // cookie wins
  });

  it("SSS332: response incluye X-Frame-Options DENY + CSP frame-ancestors none", async () => {
    const cookieToken = issueConciergeAccessToken("x@y.com");
    mockCookieGet.mockReturnValue({ value: cookieToken });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ orders: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const res = await GET(getReq(""));
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("Content-Security-Policy")).toBe("frame-ancestors 'none'");
  });

  it("401 token inválido", async () => {
    const res = await GET(getReq("?token=junk:1234:badsig"));
    expect(res.status).toBe(401);
  });

  it("200 + lista vacía si email no tiene pedidos", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ orders: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const token = issueConciergeAccessToken("user@example.com");
    const res = await GET(getReq(`?token=${encodeURIComponent(token)}`));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.ok).toBe(true);
    expect(d.email).toBe("user@example.com");
    expect(d.orders).toEqual([]);
  });

  // AUDIT-WEB FIX-CQ-H2 (31 may 2026): post-refactor static-only el portal
  // lee de KV (concierge_orders_kv), no del backend FastAPI VPS.
  // Tests adaptados a saveConciergeOrderKv + __clearConciergeOrdersKvForTests.

  it("200 + filtra orders por email del token (KV-backed)", async () => {
    const {
      saveConciergeOrderKv,
      __clearConciergeOrdersKvForTests,
    } = await import("@/lib/concierge_orders_kv");
    await __clearConciergeOrdersKvForTests();
    await saveConciergeOrderKv({
      id: "ord_a",
      email: "user@example.com",
      status: "pending",
      createdAt: "2026-05-15T10:00:00Z",
      origin: "BCN",
      destination: "JFK",
      date_from: "2026-08-15",
      date_to: "2026-08-22",
      flex_days: 3,
      budget: 2000,
      travelers: 2,
      hotel_stars: 4,
      amount_paid_eur: 19,
      tier: "standard",
    });
    await saveConciergeOrderKv({
      id: "ord_b",
      email: "other@example.com",
      status: "pending",
      createdAt: "2026-05-14T10:00:00Z",
      origin: "MAD",
      destination: "LAX",
      date_from: "2026-09-01",
      date_to: "2026-09-15",
      flex_days: 5,
      budget: 1500,
      travelers: 1,
      hotel_stars: 3,
      amount_paid_eur: 9,
      tier: "express",
    });
    const token = issueConciergeAccessToken("user@example.com");
    const res = await GET(getReq(`?token=${encodeURIComponent(token)}`));
    const d = await res.json();
    expect(d.orders.length).toBe(1);
    expect(d.orders[0].id).toBe("ord_a");
  });

  it("sanitization: response NO incluye stripe_session_id, email, ni internos", async () => {
    const {
      saveConciergeOrderKv,
      __clearConciergeOrdersKvForTests,
    } = await import("@/lib/concierge_orders_kv");
    await __clearConciergeOrdersKvForTests();
    await saveConciergeOrderKv({
      id: "ord_x",
      email: "user@example.com",
      stripe_session_id: "cs_live_SECRET12345",
      notes: "internal notes",
      budget: 1000,
      flex_days: 3,
      hotel_stars: 4,
      status: "pending",
      createdAt: "2026-05-15T10:00:00Z",
      origin: "BCN",
      destination: "JFK",
      date_from: "2026-08-15",
      date_to: "2026-08-22",
      travelers: 2,
      amount_paid_eur: 19,
    });
    const token = issueConciergeAccessToken("user@example.com");
    const res = await GET(getReq(`?token=${encodeURIComponent(token)}`));
    const d = await res.json();
    const o = d.orders[0];
    expect(o.stripe_session_id).toBeUndefined();
    expect(o.notes).toBeUndefined();
    expect(o.email).toBeUndefined();
    expect(o.budget).toBeUndefined();
    expect(o.flex_days).toBeUndefined();
    expect(o.hotel_stars).toBeUndefined();
    expect(o.id).toBe("ord_x");
    expect(o.status_label).toBeDefined();
  });
});
