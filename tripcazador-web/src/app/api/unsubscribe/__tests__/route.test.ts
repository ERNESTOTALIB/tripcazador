/**
 * /api/unsubscribe route.test.ts — SSS260 (16 may 2026)
 *
 * Tests para GET + POST /api/unsubscribe (one-click List-Unsubscribe RFC 8058).
 */
import { describe, it, expect, vi, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import crypto from "node:crypto";

// AUDIT-FULL FIX-SEC-1 (24 may 2026): tests actualizados al nuevo formato
// HMAC. Tokens legacy (email:ts sin sig) ahora son rechazados.
const TEST_SECRET = "test-unsubscribe-secret-32chars-aaaa";
beforeAll(() => {
  process.env.UNSUBSCRIBE_SECRET = TEST_SECRET;
});

async function importMod() {
  vi.resetModules();
  return import("../route");
}

function buildReq(method: "GET" | "POST", token: string): NextRequest {
  return new NextRequest(`http://localhost/api/unsubscribe?t=${token}`, {
    method,
  });
}

// Genera token HMAC-signed compatible con el verifier actualizado.
function makeToken(email: string): string {
  const ts = Date.now().toString();
  const sig = crypto
    .createHmac("sha256", TEST_SECRET)
    .update(`${email}:${ts}`)
    .digest("hex");
  return Buffer.from(`${email}:${ts}:${sig}`).toString("base64url");
}

// Helper para crear tokens legacy (sin HMAC) — útil en tests que validan rechazo.
function makeLegacyToken(email: string): string {
  return Buffer.from(`${email}:${Date.now()}`).toString("base64url");
}

describe("/api/unsubscribe — token validation", () => {
  it("400 si token missing", async () => {
    const mod = await importMod();
    const req = new NextRequest("http://localhost/api/unsubscribe");
    const res = await mod.GET(req);
    expect(res.status).toBe(400);
  });

  it("400 si token no decodea email válido", async () => {
    const mod = await importMod();
    const req = buildReq("GET", "not-base64url-or-garbage");
    const res = await mod.GET(req);
    expect(res.status).toBe(400);
  });

  it("400 si email decodeado sin @", async () => {
    const mod = await importMod();
    const fakeToken = Buffer.from("notanemail:123").toString("base64url");
    const req = buildReq("GET", fakeToken);
    const res = await mod.GET(req);
    expect(res.status).toBe(400);
  });

  // AUDIT-FULL FIX-SEC-1: tokens legacy (sin HMAC sig) deben ser rechazados.
  it("400 para token legacy (email:ts sin HMAC) — bug previo arreglado", async () => {
    const mod = await importMod();
    const req = buildReq("GET", makeLegacyToken("victim@example.com"));
    const res = await mod.GET(req);
    expect(res.status).toBe(400);
  });

  // AUDIT-FULL FIX-SEC-1: token con HMAC tampered debe ser rechazado.
  it("400 para token con HMAC forjado (signature inválida)", async () => {
    const mod = await importMod();
    const evilToken = Buffer.from(
      "victim@example.com:" + Date.now() + ":deadbeef0000000000000000000000000000000000000000000000000000",
    ).toString("base64url");
    const req = buildReq("GET", evilToken);
    const res = await mod.GET(req);
    expect(res.status).toBe(400);
  });
});

describe("/api/unsubscribe — happy path", () => {
  it("GET 200 + text/html para token válido", async () => {
    const mod = await importMod();
    const token = makeToken("user@example.com");
    const req = buildReq("GET", token);
    const res = await mod.GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toMatch(/<!DOCTYPE html>/i);
    expect(html).toMatch(/te hemos dado de baja/i);
  });

  it("POST 200 (List-Unsubscribe-Post One-Click compliance RFC 8058)", async () => {
    const mod = await importMod();
    const token = makeToken("user@example.com");
    const req = buildReq("POST", token);
    const res = await mod.POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
  });

  it("idempotent — segundo unsubscribe del mismo email también 200", async () => {
    const mod = await importMod();
    const token = makeToken("idem@example.com");
    const r1 = await mod.GET(buildReq("GET", token));
    expect(r1.status).toBe(200);
    const r2 = await mod.GET(buildReq("GET", token));
    expect(r2.status).toBe(200);
  });
});

describe("/api/unsubscribe — security", () => {
  it("HTML response no permite XSS via email tampering", async () => {
    const mod = await importMod();
    // Si attacker construye token con HTML, el response NO debe incluir
    // ese HTML raw (el handler no escupe el email decodeado en la response)
    const evilToken = Buffer.from('<script>alert(1)</script>:123').toString(
      "base64url",
    );
    const req = buildReq("GET", evilToken);
    const res = await mod.GET(req);
    // Como no contiene @, debe ser 400
    expect(res.status).toBe(400);
  });
});
