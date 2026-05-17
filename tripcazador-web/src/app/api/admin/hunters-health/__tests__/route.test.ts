/**
 * /api/admin/hunters-health GET route.test.ts — SSS271 (17 may 2026)
 *
 * Tests cubren SECURITY FIX de SSS265: auth requiere cookie válida
 * con COOKIE_KEY o header Bearer ADMIN_TOKEN.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mockCookieGet })),
}));

vi.mock("@/lib/panel_auth", () => ({
  COOKIE_KEY: "tc_panel_session",
  verifyToken: vi.fn((v: string | undefined) => {
    if (v === "valid_session_token") return { ok: true, email: "owner" };
    return null;
  }),
}));

beforeEach(() => {
  delete process.env.ADMIN_TOKEN;
  mockCookieGet.mockReset();
  mockCookieGet.mockReturnValue(undefined);
  vi.resetModules();
  // Mock global fetch para evitar llamadas reales a backend FastAPI
  global.fetch = vi.fn(() =>
    Promise.resolve(new Response("{}", { status: 500 })),
  ) as unknown as typeof fetch;
});

async function importGet() {
  const mod = await import("../route");
  return mod.GET;
}

function buildReq(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/admin/hunters-health", {
    method: "GET",
    headers,
  });
}

describe("/api/admin/hunters-health GET — auth (SSS265 fix)", () => {
  it("401 sin cookie ni Bearer", async () => {
    const GET = await importGet();
    const res = await GET(buildReq());
    expect(res.status).toBe(401);
  });

  it("401 con cookie name distinto a COOKIE_KEY (regression test SSS265)", async () => {
    mockCookieGet.mockImplementation((key: string) => {
      if (key === "panel_session") return { value: "valid_session_token" };
      return undefined;
    });
    const GET = await importGet();
    const res = await GET(buildReq());
    expect(res.status).toBe(401);
  });

  it("200 con cookie COOKIE_KEY válida", async () => {
    mockCookieGet.mockImplementation((key: string) => {
      if (key === "tc_panel_session") return { value: "valid_session_token" };
      return undefined;
    });
    const GET = await importGet();
    const res = await GET(buildReq());
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.templates).toBeTruthy();
    expect(typeof j.templates.total).toBe("number");
  });

  it("401 con Bearer header sin ADMIN_TOKEN env", async () => {
    const GET = await importGet();
    const res = await GET(buildReq({ Authorization: "Bearer anything" }));
    expect(res.status).toBe(401);
  });

  it("401 con Bearer header incorrecto", async () => {
    process.env.ADMIN_TOKEN = "real_admin_token";
    const GET = await importGet();
    const res = await GET(buildReq({ Authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("200 con Bearer header correcto", async () => {
    process.env.ADMIN_TOKEN = "real_admin_token";
    const GET = await importGet();
    const res = await GET(
      buildReq({ Authorization: "Bearer real_admin_token" }),
    );
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.templates).toBeTruthy();
  });

  it("401 (regression SSS265) — ADMIN_TOKEN env set pero NO header: NO bypass", async () => {
    process.env.ADMIN_TOKEN = "real_admin_token";
    const GET = await importGet();
    // Antes del fix, esto retornaba 200 (bypass). Ahora 401.
    const res = await GET(buildReq());
    expect(res.status).toBe(401);
  });
});

describe("/api/admin/hunters-health GET — shape", () => {
  beforeEach(() => {
    mockCookieGet.mockImplementation((key: string) => {
      if (key === "tc_panel_session") return { value: "valid_session_token" };
      return undefined;
    });
  });

  it("Cache-Control private no-cache (admin)", async () => {
    const GET = await importGet();
    const res = await GET(buildReq());
    expect(res.headers.get("cache-control")).toContain("private");
  });

  it("response tiene templates+worker+alerts shape", async () => {
    const GET = await importGet();
    const res = await GET(buildReq());
    const j = await res.json();
    expect(j.templates.by_region).toBeTypeOf("object");
    expect(j.templates.by_month).toBeTypeOf("object");
    expect(j.worker.last_run_status).toBeTruthy();
    expect(Array.isArray(j.alerts)).toBe(true);
  });
});
