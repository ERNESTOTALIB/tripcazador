/**
 * /api/notify-alert route.test.ts — SSS264 (16 may 2026)
 *
 * Tests para edge endpoint que envía emails de alerta de precio.
 * Auth: Bearer RESEND_PROXY_TOKEN (constant-time compare).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

beforeEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_PROXY_TOKEN;
  vi.resetModules();
});

async function importMod() {
  vi.resetModules();
  return import("../route");
}

function buildReq(body: unknown, auth?: string): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (auth) headers["authorization"] = auth;
  return new NextRequest("http://localhost/api/notify-alert", {
    method: "POST",
    body: JSON.stringify(body),
    headers,
  });
}

const validPayload = {
  to: "user@example.com",
  alert: { origin: "MAD", destination: "JFK", max_price: 300 },
  deal: {
    headline: "Madrid → Nueva York desde 289€",
    price_eur: 289,
    date_out: "2026-08-15",
    airline_name: "Iberia",
    booking_url: "https://www.kayak.es/flights/MAD-JFK/2026-08-15",
  },
};

describe("/api/notify-alert GET — readiness probe", () => {
  it("retorna shape { service, ready } sin auth", async () => {
    const mod = await importMod();
    const res = await mod.GET();
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.service).toBe("notify-alert");
    expect(typeof j.ready).toBe("boolean");
  });

  it("ready=false sin env vars", async () => {
    const mod = await importMod();
    const res = await mod.GET();
    const j = await res.json();
    expect(j.ready).toBe(false);
  });
});

describe("/api/notify-alert POST — auth", () => {
  it("503 si RESEND_PROXY_TOKEN no configured", async () => {
    const mod = await importMod();
    const res = await mod.POST(buildReq(validPayload, "Bearer anything"));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/RESEND_PROXY_TOKEN/);
  });

  it("401 si Authorization header missing", async () => {
    process.env.RESEND_PROXY_TOKEN = "secret_token_xyz";
    const mod = await importMod();
    const res = await mod.POST(buildReq(validPayload));
    expect(res.status).toBe(401);
  });

  it("401 si Bearer token incorrecto (constant-time mismatch)", async () => {
    process.env.RESEND_PROXY_TOKEN = "secret_token_xyz";
    const mod = await importMod();
    const res = await mod.POST(buildReq(validPayload, "Bearer wrong_token"));
    expect(res.status).toBe(401);
  });

  it("401 si Authorization sin 'Bearer ' prefix", async () => {
    process.env.RESEND_PROXY_TOKEN = "secret_token_xyz";
    const mod = await importMod();
    const res = await mod.POST(
      buildReq(validPayload, "Basic dXNlcjpwYXNz"),
    );
    expect(res.status).toBe(401);
  });
});

describe("/api/notify-alert POST — payload validation", () => {
  beforeEach(() => {
    process.env.RESEND_PROXY_TOKEN = "valid_token";
    delete process.env.RESEND_API_KEY;
  });

  it("400 si JSON inválido", async () => {
    const mod = await importMod();
    const req = new NextRequest("http://localhost/api/notify-alert", {
      method: "POST",
      body: "{broken",
      headers: {
        "content-type": "application/json",
        "authorization": "Bearer valid_token",
      },
    });
    const res = await mod.POST(req);
    expect(res.status).toBe(400);
  });

  it("400 si email inválido", async () => {
    const mod = await importMod();
    const res = await mod.POST(
      buildReq(
        { ...validPayload, to: "notanemail" },
        "Bearer valid_token",
      ),
    );
    expect(res.status).toBe(400);
  });

  it("400 si deal.price_eur no number", async () => {
    const mod = await importMod();
    const res = await mod.POST(
      buildReq(
        {
          ...validPayload,
          deal: { ...validPayload.deal, price_eur: "not-a-number" },
        },
        "Bearer valid_token",
      ),
    );
    expect(res.status).toBe(400);
  });

  it("400 si deal missing", async () => {
    const mod = await importMod();
    const { deal: _deal, ...without } = validPayload;
    void _deal;
    const res = await mod.POST(
      buildReq(without, "Bearer valid_token"),
    );
    expect(res.status).toBe(400);
  });
});

describe("/api/notify-alert POST — Resend config", () => {
  it("503 si RESEND_API_KEY missing tras auth + validation OK", async () => {
    process.env.RESEND_PROXY_TOKEN = "valid_token";
    delete process.env.RESEND_API_KEY;
    const mod = await importMod();
    const res = await mod.POST(
      buildReq(validPayload, "Bearer valid_token"),
    );
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/RESEND_API_KEY/);
  });
});
