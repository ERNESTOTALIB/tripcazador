/**
 * /api/creators/stats GET route.test.ts — SSS267 (17 may 2026)
 */
import { describe, it, expect, vi } from "vitest";
import { signCreatorToken } from "@/lib/creators";

async function importGet() {
  vi.resetModules();
  const mod = await import("../route");
  return mod.GET;
}

function buildReq(token: string = ""): Request {
  return new Request(
    `http://localhost/api/creators/stats?token=${encodeURIComponent(token)}`,
    { method: "GET" },
  );
}

describe("/api/creators/stats GET — auth", () => {
  it("401 si token missing", async () => {
    const GET = await importGet();
    const res = await GET(buildReq(""));
    expect(res.status).toBe(401);
  });

  it("401 si token inválido (no decodea)", async () => {
    const GET = await importGet();
    const res = await GET(buildReq("not-a-valid-token"));
    expect(res.status).toBe(401);
  });

  it("401 si token tampered", async () => {
    const GET = await importGet();
    const validToken = signCreatorToken("validcreator");
    // Tampered: cambiar último char del HMAC
    const tampered = validToken.slice(0, -1) + (validToken.endsWith("a") ? "b" : "a");
    const res = await GET(buildReq(tampered));
    expect(res.status).toBe(401);
  });
});

describe("/api/creators/stats GET — happy path", () => {
  it("200 con token válido + shape correcta", async () => {
    const validToken = signCreatorToken("testcreator");
    const GET = await importGet();
    const res = await GET(buildReq(validToken));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.code).toBe("testcreator");
    expect(j.link).toMatch(/^https?:\/\//);
    expect(j.stats).toBeTruthy();
    expect(j.payout_threshold_eur).toBe(25);
  });
});
