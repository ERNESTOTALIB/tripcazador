/**
 * /api/email/weekly-digest POST route.test.ts — SSS270 (17 may 2026)
 *
 * Cubre auth (cookie + admin token), config gate (RESEND), edge cases.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: () => undefined,
  })),
}));

vi.mock("@/lib/subscribers_store", () => ({
  listPendingDrip: vi.fn(() => Promise.resolve([])),
}));

beforeEach(() => {
  delete process.env.ADMIN_TOKEN;
  delete process.env.RESEND_API_KEY;
  vi.resetModules();
});

async function importPost() {
  const mod = await import("../route");
  return mod.POST;
}

function buildReq(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/email/weekly-digest", {
    method: "POST",
    headers,
  });
}

describe("/api/email/weekly-digest POST — auth", () => {
  it("401 sin cookie ni admin token", async () => {
    const POST = await importPost();
    const res = await POST(buildReq());
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("unauthorized");
  });

  it("401 con admin token incorrecto", async () => {
    process.env.ADMIN_TOKEN = "secret_admin";
    const POST = await importPost();
    const res = await POST(buildReq({ "x-admin-token": "wrong" }));
    expect(res.status).toBe(401);
  });

  it("503 si admin token correcto pero RESEND_API_KEY missing", async () => {
    process.env.ADMIN_TOKEN = "secret_admin";
    const POST = await importPost();
    const res = await POST(buildReq({ "x-admin-token": "secret_admin" }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/RESEND/i);
  });
});

describe("/api/email/weekly-digest POST — happy path", () => {
  it("200 con admin auth + RESEND ok pero 0 subscribers", async () => {
    process.env.ADMIN_TOKEN = "secret_admin";
    process.env.RESEND_API_KEY = "re_dummy";
    const POST = await importPost();
    const res = await POST(buildReq({ "x-admin-token": "secret_admin" }));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(j.queued).toBe(0);
  });
});
