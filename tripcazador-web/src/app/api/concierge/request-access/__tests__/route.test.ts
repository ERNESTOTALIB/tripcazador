/**
 * /api/concierge/request-access route.test.ts — SSS328
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

function postReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/concierge/request-access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/concierge/request-access SSS328", () => {
  const ORIG_API = process.env.NEXT_PUBLIC_API_URL;
  const ORIG_ADMIN = process.env.ADMIN_TOKEN;
  const ORIG_RESEND = process.env.RESEND_API_KEY;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    process.env.ADMIN_TOKEN = "test_admin";
    delete process.env.RESEND_API_KEY; // explicit unset
  });
  afterEach(() => {
    if (ORIG_API === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = ORIG_API;
    if (ORIG_ADMIN === undefined) delete process.env.ADMIN_TOKEN;
    else process.env.ADMIN_TOKEN = ORIG_ADMIN;
    if (ORIG_RESEND === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = ORIG_RESEND;
    vi.restoreAllMocks();
  });

  it("400 body no-JSON", async () => {
    const req = new NextRequest(
      "http://localhost/api/concierge/request-access",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      },
    );
    expect((await POST(req)).status).toBe(400);
  });

  it("400 email inválido", async () => {
    const res = await POST(postReq({ email: "no_at" }));
    expect(res.status).toBe(400);
  });

  // SSS329 H1: la response SIEMPRE es {ok:true} sin "sent" field para
  // evitar email enumeration. Comprobamos shape uniforme.

  it("200 con shape uniforme {ok:true} sin sent — email no existe", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ orders: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    const res = await POST(postReq({ email: "no-orders@example.com" }));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d).toEqual({ ok: true });
    expect(d.sent).toBeUndefined();
    expect(d.rate_limited).toBeUndefined();
  });

  it("200 misma shape exacta cuando email SI tiene orders (anti-enum)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            orders: [
              {
                id: "ord_y",
                email: "user@example.com",
                status: "pending",
                createdAt: "2026-05-15T10:00:00Z",
                origin: "BCN",
                destination: "JFK",
                date_from: "2026-08-15",
                travelers: 2,
                amount_paid_eur: 19,
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const res = await POST(postReq({ email: "user@example.com" }));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d).toEqual({ ok: true }); // misma shape exacta
  });

  // Rate limit difícil de testear sin fugar estado entre tests
  // (el Map vive en module-scope). Lo dejamos como integración manual.
});
