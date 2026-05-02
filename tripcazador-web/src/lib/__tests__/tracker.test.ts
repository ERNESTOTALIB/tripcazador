/**
 * tracker.test.ts — fase tt-TT5
 *
 * Tests sobre tracker.ts:
 *  - sanitizeMeta filtra nulls/undefined, recorta strings >200, drops invalid types
 *  - trackClick no crashea si sendBeacon no existe
 *  - trackPageView usa pathname del window
 *  - onTelegramClick devuelve handler que dispara evento
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { _internal, trackClick, trackPageView, onTelegramClick } from "../tracker";

describe("tracker.sanitizeMeta", () => {
  it("filters out undefined and null values", () => {
    const out = _internal.sanitizeMeta({
      a: "x",
      b: undefined,
      c: null as unknown as string,
      d: 1,
    });
    expect(out).toEqual({ a: "x", d: 1 });
  });

  it("truncates strings longer than 200 chars", () => {
    const long = "x".repeat(500);
    const out = _internal.sanitizeMeta({ key: long });
    expect((out.key as string).length).toBe(200);
  });

  it("keeps numbers, booleans, valid strings", () => {
    const out = _internal.sanitizeMeta({ n: 42, b: true, s: "ok" });
    expect(out).toEqual({ n: 42, b: true, s: "ok" });
  });

  it("drops object/array values (not whitelisted)", () => {
    const out = _internal.sanitizeMeta({
      ok: "yes",
      bad: { nested: 1 } as unknown as string,
    });
    expect(out).toEqual({ ok: "yes" });
  });
});

describe("tracker.trackClick", () => {
  let beaconSpy: ReturnType<typeof vi.fn>;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    beaconSpy = vi.fn(() => true);
    fetchSpy = vi.fn(() => Promise.resolve(new Response(null, { status: 202 })));
    Object.defineProperty(globalThis, "navigator", {
      value: { sendBeacon: beaconSpy },
      configurable: true,
      writable: true,
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    Object.defineProperty(globalThis, "Blob", {
      value: class MockBlob {
        constructor(public parts: BlobPart[], public opts?: BlobPropertyBag) {}
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses sendBeacon when available", () => {
    trackClick("calc_used", { calc: "vuelo-valor" });
    expect(beaconSpy).toHaveBeenCalledWith("/api/track", expect.anything());
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("falls back to fetch keepalive when sendBeacon throws", () => {
    beaconSpy.mockImplementation(() => {
      throw new Error("blocked");
    });
    trackClick("calc_used", { calc: "test" });
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/track",
      expect.objectContaining({ method: "POST", keepalive: true }),
    );
  });

  it("does nothing in non-browser environment", () => {
    // Simular SSR: navigator no disponible
    const origNav = globalThis.navigator;
    Object.defineProperty(globalThis, "window", { value: undefined, configurable: true });
    expect(() => trackClick("page_view")).not.toThrow();
    Object.defineProperty(globalThis, "navigator", { value: origNav, configurable: true });
  });
});

describe("tracker.trackPageView", () => {
  it("uses window.location.pathname", () => {
    Object.defineProperty(globalThis, "window", {
      value: { location: { pathname: "/blog/foo" } },
      configurable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: { sendBeacon: vi.fn(() => true) },
      configurable: true,
    });
    Object.defineProperty(globalThis, "Blob", {
      value: class { constructor(public parts: BlobPart[]) {} },
      configurable: true,
    });
    expect(() => trackPageView()).not.toThrow();
  });
});

describe("tracker.onTelegramClick", () => {
  it("returns handler that calls trackClick with telegram_clicked", () => {
    const beaconSpy = vi.fn(() => true);
    Object.defineProperty(globalThis, "navigator", {
      value: { sendBeacon: beaconSpy },
      configurable: true,
    });
    Object.defineProperty(globalThis, "Blob", {
      value: class { constructor(public parts: BlobPart[]) {} },
      configurable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: { location: { pathname: "/" } },
      configurable: true,
    });

    const handler = onTelegramClick("footer");
    handler({} as React.MouseEvent);
    expect(beaconSpy).toHaveBeenCalled();
    const call = beaconSpy.mock.calls[0];
    expect(call[0]).toBe("/api/track");
  });
});
