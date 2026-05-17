/**
 * /api/admin/concierge/generate-draft POST route.test.ts — SSS272 (17 may 2026)
 * Sync cookies + X-Admin-Token dual auth.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockCookieGet })),
}));

vi.mock("@/lib/panel_auth", () => ({
  COOKIE_KEY: "tc_panel_session",
  verifyToken: vi.fn((v: string | undefined) =>
    v === "valid_token" ? { ok: true } : null,
  ),
}));

beforeEach(() => {
  delete process.env.ADMIN_TOKEN;
  delete process.env.NEXT_PUBLIC_API_URL;
  mockCookieGet.mockReset();
  mockCookieGet.mockReturnValue(undefined);
  vi.resetModules();
  global.fetch = vi.fn(() =>
    Promise.resolve(new Response("{}", { status: 500 })),
  ) as unknown as typeof fetch;
});

async function importPost() {
  const mod = await import("../route");
  return mod.POST;
}

function buildReq(body: object, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/admin/concierge/generate-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("/api/admin/concierge/generate-draft POST — auth", () => {
  it("401 sin auth", async () => {
    const POST = await importPost();
    const res = await POST(buildReq({ order_id: "abc" }));
    expect(res.status).toBe(401);
  });

  it("401 con X-Admin-Token incorrecto", async () => {
    process.env.ADMIN_TOKEN = "real_token";
    const POST = await importPost();
    const res = await POST(buildReq({ order_id: "abc" }, { "x-admin-token": "wrong" }));
    expect(res.status).toBe(401);
  });

  it("acepta cookie sesión válida (puede fallar por backend null, no 401)", async () => {
    mockCookieGet.mockImplementation((key: string) =>
      key === "tc_panel_session" ? { value: "valid_token" } : undefined,
    );
    const POST = await importPost();
    const res = await POST(buildReq({ order_id: "abc" }));
    expect(res.status).not.toBe(401);
  });
});
