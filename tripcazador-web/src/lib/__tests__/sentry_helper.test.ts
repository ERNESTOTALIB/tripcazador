/**
 * sentry_helper.test.ts — SSS237 (16 may 2026)
 *
 * Tests para lib/sentry_helper.ts (75 líneas, SSS181 NEW).
 *
 * Cobertura:
 *  - captureRevenueError: pasa exception + tags module/code + extra + level
 *    default "error"; nivel override; no-op safe si Sentry tira.
 *  - captureRevenueMessage: misma estructura, default level "warning".
 *
 * Mockeamos @sentry/nextjs para verificar shape de llamadas — el helper
 * existe específicamente para garantizar shape consistente (grep por tags).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @sentry/nextjs ANTES de importar el helper
const mockCaptureException = vi.fn();
const mockCaptureMessage = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
  captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
}));

// Import después del mock
import {
  captureRevenueError,
  captureRevenueMessage,
} from "../sentry_helper";

describe("captureRevenueError", () => {
  beforeEach(() => {
    mockCaptureException.mockClear();
    mockCaptureMessage.mockClear();
  });

  it("llama Sentry.captureException con error + tags + extra + level default 'error'", () => {
    const err = new Error("Stripe session failed");
    captureRevenueError(err, {
      module: "concierge_checkout",
      code: "stripe_session_failed",
      extra: { order_id: "ord_123" },
    });

    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    const [capturedErr, opts] = mockCaptureException.mock.calls[0];
    expect(capturedErr).toBe(err);
    expect(opts.tags.module).toBe("concierge_checkout");
    expect(opts.tags.code).toBe("stripe_session_failed");
    expect(opts.extra).toEqual({ order_id: "ord_123" });
    expect(opts.level).toBe("error");
  });

  it("permite override de level (warning/fatal/info)", () => {
    captureRevenueError(new Error("x"), {
      module: "m",
      code: "c",
      level: "warning",
    });
    expect(mockCaptureException.mock.calls[0][1].level).toBe("warning");

    captureRevenueError(new Error("y"), {
      module: "m2",
      code: "c2",
      level: "fatal",
    });
    expect(mockCaptureException.mock.calls[1][1].level).toBe("fatal");

    captureRevenueError(new Error("z"), {
      module: "m3",
      code: "c3",
      level: "info",
    });
    expect(mockCaptureException.mock.calls[2][1].level).toBe("info");
  });

  it("acepta cualquier 'unknown' como error (no solo Error)", () => {
    captureRevenueError("string error", { module: "m", code: "c" });
    captureRevenueError(42, { module: "m", code: "c" });
    captureRevenueError({ custom: "obj" }, { module: "m", code: "c" });
    captureRevenueError(null, { module: "m", code: "c" });

    expect(mockCaptureException).toHaveBeenCalledTimes(4);
  });

  it("extra es opcional", () => {
    captureRevenueError(new Error("x"), {
      module: "m",
      code: "c",
    });
    expect(mockCaptureException).toHaveBeenCalled();
    expect(mockCaptureException.mock.calls[0][1].extra).toBeUndefined();
  });

  it("NO throws si Sentry.captureException tira (no-op safe)", () => {
    mockCaptureException.mockImplementationOnce(() => {
      throw new Error("Sentry not initialized");
    });

    expect(() => {
      captureRevenueError(new Error("x"), { module: "m", code: "c" });
    }).not.toThrow();
  });

  it("tags siempre tienen module + code (anti-typo defense via interface)", () => {
    // TypeScript fuerza module + code requeridos via interface;
    // runtime check verifica que están en tags
    captureRevenueError(new Error("x"), {
      module: "stripe_webhook",
      code: "signature_invalid",
    });
    const tags = mockCaptureException.mock.calls[0][1].tags;
    expect(Object.keys(tags)).toContain("module");
    expect(Object.keys(tags)).toContain("code");
  });
});

describe("captureRevenueMessage", () => {
  beforeEach(() => {
    mockCaptureException.mockClear();
    mockCaptureMessage.mockClear();
  });

  it("llama Sentry.captureMessage con tags + extra + level default 'warning'", () => {
    captureRevenueMessage("Booking redirect delayed", {
      module: "booking_router",
      code: "redirect_slow",
      extra: { delay_ms: 8500 },
    });

    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    const [message, opts] = mockCaptureMessage.mock.calls[0];
    expect(message).toBe("Booking redirect delayed");
    expect(opts.tags.module).toBe("booking_router");
    expect(opts.tags.code).toBe("redirect_slow");
    expect(opts.extra).toEqual({ delay_ms: 8500 });
    expect(opts.level).toBe("warning"); // default DIFFERENT del error helper
  });

  it("permite override de level", () => {
    captureRevenueMessage("info msg", {
      module: "m",
      code: "c",
      level: "info",
    });
    expect(mockCaptureMessage.mock.calls[0][1].level).toBe("info");
  });

  it("NO throws si Sentry.captureMessage tira", () => {
    mockCaptureMessage.mockImplementationOnce(() => {
      throw new Error("Sentry edge runtime fail");
    });

    expect(() => {
      captureRevenueMessage("msg", { module: "m", code: "c" });
    }).not.toThrow();
  });

  it("NO llama captureException (solo captureMessage)", () => {
    captureRevenueMessage("just a warning", { module: "m", code: "c" });
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).not.toHaveBeenCalled();
  });
});

describe("contract — Sentry shape compatibility", () => {
  beforeEach(() => {
    mockCaptureException.mockClear();
    mockCaptureMessage.mockClear();
  });

  it("captureRevenueError pasa exactamente { tags, extra, level } a Sentry", () => {
    captureRevenueError(new Error("e"), {
      module: "m",
      code: "c",
      extra: { foo: "bar" },
      level: "error",
    });

    const opts = mockCaptureException.mock.calls[0][1];
    const keys = Object.keys(opts).sort();
    expect(keys).toEqual(["extra", "level", "tags"]);
  });

  it("captureRevenueMessage pasa misma shape", () => {
    captureRevenueMessage("msg", {
      module: "m",
      code: "c",
      extra: { foo: "bar" },
    });

    const opts = mockCaptureMessage.mock.calls[0][1];
    const keys = Object.keys(opts).sort();
    expect(keys).toEqual(["extra", "level", "tags"]);
  });
});
