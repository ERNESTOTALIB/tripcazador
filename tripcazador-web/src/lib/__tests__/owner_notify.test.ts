/**
 * owner_notify.test.ts — SSS331
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sendOwnerNotify } from "../owner_notify";

describe("sendOwnerNotify SSS331", () => {
  const ORIG_RESEND = process.env.RESEND_API_KEY;
  const ORIG_OWNER = process.env.OWNER_NOTIFY_EMAIL;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    process.env.RESEND_API_KEY = "re_test_fake";
    delete process.env.OWNER_NOTIFY_EMAIL;
  });
  afterEach(() => {
    if (ORIG_RESEND === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = ORIG_RESEND;
    if (ORIG_OWNER === undefined) delete process.env.OWNER_NOTIFY_EMAIL;
    else process.env.OWNER_NOTIFY_EMAIL = ORIG_OWNER;
    vi.restoreAllMocks();
  });

  it("false si RESEND_API_KEY no set (no llama Resend)", async () => {
    delete process.env.RESEND_API_KEY;
    const ok = await sendOwnerNotify({
      kind: "premium_signup",
      summary: "test",
    });
    expect(ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("llama Resend cuando RESEND_API_KEY set", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const ok = await sendOwnerNotify({
      kind: "premium_signup",
      customer_email: "user@example.com",
      summary: "Nueva alta Premium · user@example.com",
    });
    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("subject incluye prefix [TRIPCAZADOR]", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await sendOwnerNotify({
      kind: "concierge_order",
      summary: "Nuevo Concierge Standard · MAD→JFK · 19€",
    });
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.subject).toContain("[TRIPCAZADOR]");
    expect(body.subject).toContain("Nuevo Concierge");
  });

  it("usa OWNER_NOTIFY_EMAIL si está set, sino default ernestalib@hotmail.com", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    // Default
    await sendOwnerNotify({ kind: "info", summary: "x" });
    let body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.to).toBe("ernestalib@hotmail.com");
    // Override
    process.env.OWNER_NOTIFY_EMAIL = "ops@tripcazador.com";
    await sendOwnerNotify({ kind: "info", summary: "y" });
    body = JSON.parse((fetchMock.mock.calls[1]![1] as RequestInit).body as string);
    expect(body.to).toBe("ops@tripcazador.com");
  });

  it("details se renderizan en body HTML", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await sendOwnerNotify({
      kind: "premium_signup",
      summary: "test",
      details: {
        customer_id: "cus_ABC123",
        amount: "9.99€",
      },
    });
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.html).toContain("customer_id");
    expect(body.html).toContain("cus_ABC123");
    expect(body.html).toContain("9.99€");
  });

  it("escape XSS en summary + details", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await sendOwnerNotify({
      kind: "info",
      summary: '<script>alert("xss")</script>',
      details: { dangerous: '<img onerror=alert(1)>' },
    });
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.html).not.toContain("<script>alert");
    expect(body.html).toContain("&lt;script&gt;");
    expect(body.html).toContain("&lt;img");
  });

  it("error fetch no throw (fire-and-forget safe)", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    const ok = await sendOwnerNotify({ kind: "info", summary: "x" });
    expect(ok).toBe(false);
  });

  it("res.ok false → returns false sin throw", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const ok = await sendOwnerNotify({ kind: "info", summary: "x" });
    expect(ok).toBe(false);
  });

  it("subject truncated a 200 chars (Resend limit)", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const longSummary = "x".repeat(500);
    await sendOwnerNotify({ kind: "info", summary: longSummary });
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.subject.length).toBeLessThanOrEqual(200);
    expect(body.subject.startsWith("[TRIPCAZADOR]")).toBe(true);
  });

  it("tags incluyen category=owner_internal + kind", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    await sendOwnerNotify({ kind: "concierge_order", summary: "x" });
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.tags).toContainEqual({ name: "category", value: "owner_internal" });
    expect(body.tags).toContainEqual({ name: "kind", value: "concierge_order" });
  });
});
