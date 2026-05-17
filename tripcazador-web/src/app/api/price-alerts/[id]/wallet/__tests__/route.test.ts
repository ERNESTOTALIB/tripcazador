/**
 * /api/price-alerts/[id]/wallet GET route.test.ts — SSS270 (17 may 2026)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

async function importGet() {
  const mod = await import("../route");
  return mod.GET;
}

function buildReq(url: string): Request {
  return new Request(url, { method: "GET" });
}

describe("/api/price-alerts/[id]/wallet GET — validation", () => {
  it("400 si id inválido (<4 chars)", async () => {
    const GET = await importGet();
    const res = await GET(
      buildReq("http://localhost/api/price-alerts/ab/wallet"),
      { params: Promise.resolve({ id: "ab" }) },
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/inválido/i);
  });

  it("400 si id contiene chars peligrosos (XSS attempt)", async () => {
    const GET = await importGet();
    const res = await GET(
      buildReq(
        "http://localhost/api/price-alerts/abc/wallet",
      ),
      { params: Promise.resolve({ id: "<script>" }) },
    );
    expect(res.status).toBe(400);
  });

  it("400 si id demasiado largo (>40 chars)", async () => {
    const GET = await importGet();
    const res = await GET(
      buildReq("http://localhost/api/price-alerts/x/wallet"),
      { params: Promise.resolve({ id: "x".repeat(50) }) },
    );
    expect(res.status).toBe(400);
  });
});

describe("/api/price-alerts/[id]/wallet GET — platforms", () => {
  it("default platform devuelve JSON con both passes", async () => {
    const GET = await importGet();
    const res = await GET(
      buildReq("http://localhost/api/price-alerts/alert_abc123/wallet"),
      { params: Promise.resolve({ id: "alert_abc123" }) },
    );
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.apple_pass_json).toBeTruthy();
    expect(j.google_wallet_url).toBeTruthy();
    expect(typeof j.note).toBe("string");
  });

  it("platform=apple devuelve content-type pkpass+json", async () => {
    const GET = await importGet();
    const res = await GET(
      buildReq(
        "http://localhost/api/price-alerts/alert_abc123/wallet?platform=apple",
      ),
      { params: Promise.resolve({ id: "alert_abc123" }) },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("apple.pkpass");
    expect(res.headers.get("content-disposition")).toContain(
      "alert_abc123-pass.json",
    );
  });

  it("platform=google redirige a pay.google.com", async () => {
    const GET = await importGet();
    const res = await GET(
      buildReq(
        "http://localhost/api/price-alerts/alert_abc123/wallet?platform=google",
      ),
      { params: Promise.resolve({ id: "alert_abc123" }) },
    );
    // 307/302/308 redirect
    expect([301, 302, 307, 308]).toContain(res.status);
    const location = res.headers.get("location");
    expect(location).toBeTruthy();
    expect(location).toContain("pay.google.com");
  });

  it("acepta querystring params (o, d, t, c, date)", async () => {
    const GET = await importGet();
    const res = await GET(
      buildReq(
        "http://localhost/api/price-alerts/alert_xyz/wallet?o=BCN&oc=Barcelona&d=NRT&dc=Tokio&t=500&c=420",
      ),
      { params: Promise.resolve({ id: "alert_xyz" }) },
    );
    expect(res.status).toBe(200);
    const j = await res.json();
    // Pass usa IATA codes en route + city solo en aux fields
    expect(JSON.stringify(j)).toContain("BCN");
    expect(JSON.stringify(j)).toContain("NRT");
    expect(JSON.stringify(j)).toContain("500");
  });
});
