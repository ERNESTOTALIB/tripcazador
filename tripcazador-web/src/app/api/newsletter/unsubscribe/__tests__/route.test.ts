/**
 * /api/newsletter/unsubscribe — SSS430 tests
 *
 * Cubre: email inválido → 400, honeypot → 200 silencioso, email
 * válido → 200 idempotente, reason no-permitido → fallback unspecified.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/subscribers_store", () => ({
  unsubscribe: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/event_store", () => ({
  trackEvent: vi.fn(),
}));

import { POST } from "../route";

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/newsletter/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/newsletter/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza email inválido con 400", async () => {
    const res = await POST(makeReq({ email: "no-es-email" }));
    expect(res.status).toBe(400);
    const j = (await res.json()) as { error: string };
    expect(j.error).toBe("invalid_email");
  });

  it("rechaza JSON inválido con 400", async () => {
    const req = new NextRequest("http://localhost/api/newsletter/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("acepta email válido y retorna ok", async () => {
    const res = await POST(makeReq({ email: "test@example.com", reason: "too_many_emails" }));
    expect(res.status).toBe(200);
    const j = (await res.json()) as { ok: boolean };
    expect(j.ok).toBe(true);
  });

  it("honeypot silencia (200 sin acción)", async () => {
    const { unsubscribe } = await import("@/lib/subscribers_store");
    const res = await POST(makeReq({ email: "test@example.com", hp: "bot-filled" }));
    expect(res.status).toBe(200);
    // unsubscribe NO debe haber sido llamado
    expect(unsubscribe).not.toHaveBeenCalled();
  });

  it("reason no-permitido se ignora con fallback unspecified", async () => {
    const { trackEvent } = await import("@/lib/event_store");
    await POST(makeReq({ email: "test@example.com", reason: "invalid_reason_xyz" }));
    // event_store debe haber recibido reason=unspecified
    const calls = (trackEvent as unknown as { mock: { calls: Array<[{ meta: { reason: string } }]> } }).mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][0].meta.reason).toBe("unspecified");
  });

  it("normaliza email a lowercase + trim", async () => {
    const { unsubscribe } = await import("@/lib/subscribers_store");
    await POST(makeReq({ email: "  TEST@Example.COM  " }));
    expect(unsubscribe).toHaveBeenCalledWith("test@example.com");
  });
});
