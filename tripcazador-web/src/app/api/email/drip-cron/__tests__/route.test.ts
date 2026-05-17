/**
 * /api/email/drip-cron GET route.test.ts — SSS268 (17 may 2026)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

beforeEach(() => {
  delete process.env.DRIP_CRON_TOKEN;
  delete process.env.RESEND_API_KEY;
  vi.resetModules();
});

async function importGet() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.GET;
}

function buildReq(query: string = ""): NextRequest {
  return new NextRequest(`http://localhost/api/email/drip-cron${query}`, {
    method: "GET",
  });
}

describe("/api/email/drip-cron GET — auth", () => {
  it("503 si DRIP_CRON_TOKEN no configurado", async () => {
    const GET = await importGet();
    const res = await GET(buildReq("?token=anything"));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("not_configured");
  });

  it("401 con token incorrecto (constant-time mismatch)", async () => {
    process.env.DRIP_CRON_TOKEN = "secret_drip_token";
    const GET = await importGet();
    const res = await GET(buildReq("?token=wrong_token"));
    expect(res.status).toBe(401);
  });

  it("401 con token missing", async () => {
    process.env.DRIP_CRON_TOKEN = "secret_drip_token";
    const GET = await importGet();
    const res = await GET(buildReq(""));
    expect(res.status).toBe(401);
  });
});

describe("/api/email/drip-cron GET — happy path", () => {
  it("200 con token válido + shape { ok, processed, sent, errors, resend_active }", async () => {
    process.env.DRIP_CRON_TOKEN = "valid_token";
    const GET = await importGet();
    const res = await GET(buildReq("?token=valid_token"));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.ok).toBe(true);
    expect(typeof j.processed).toBe("number");
    expect(typeof j.sent).toBe("number");
    expect(typeof j.errors).toBe("number");
    expect(typeof j.resend_active).toBe("boolean");
  });

  it("resend_active=false si no RESEND_API_KEY", async () => {
    process.env.DRIP_CRON_TOKEN = "valid_token";
    delete process.env.RESEND_API_KEY;
    const GET = await importGet();
    const res = await GET(buildReq("?token=valid_token"));
    const j = await res.json();
    expect(j.resend_active).toBe(false);
    expect(j.sent).toBe(0);
  });

  it("resend_active=true si RESEND_API_KEY presente", async () => {
    process.env.DRIP_CRON_TOKEN = "valid_token";
    process.env.RESEND_API_KEY = "re_test_dummy";
    const GET = await importGet();
    const res = await GET(buildReq("?token=valid_token"));
    const j = await res.json();
    expect(j.resend_active).toBe(true);
  });
});
