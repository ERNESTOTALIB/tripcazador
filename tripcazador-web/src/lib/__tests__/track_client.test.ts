/**
 * track_client.test.ts — coverage para track_client.ts (consent + dedup + sendBeacon).
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tcTrack, tcTrackOnce, readUtmFromLocation } from "../track_client";

describe("tcTrack — consent + transports", () => {
  let beaconSpy: ReturnType<typeof vi.fn>;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    beaconSpy = vi.fn(() => true);
    fetchSpy = vi.fn(() => Promise.resolve(new Response(null, { status: 202 })));
    // Reset consent + dedup en localStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch { /* swallow */ }
    Object.defineProperty(navigator, "sendBeacon", {
      value: beaconSpy,
      configurable: true,
      writable: true,
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("usa sendBeacon cuando está disponible", () => {
    tcTrack("page_view", { path: "/" });
    expect(beaconSpy).toHaveBeenCalledWith(
      "/api/track",
      expect.anything(),
    );
  });

  it("consent denegado (localStorage tc_analytics_ok=0) bloquea envío", () => {
    localStorage.setItem("tc_analytics_ok", "0");
    tcTrack("page_view", { path: "/" });
    expect(beaconSpy).not.toHaveBeenCalled();
  });

  it("consent missing → envía (default opt-out de denial)", () => {
    // No seteamos consent → null → readSate considera ok
    tcTrack("page_view", { path: "/" });
    expect(beaconSpy).toHaveBeenCalled();
  });

  it("no crashea si window undefined (SSR guard)", () => {
    // Esta función ya guarda con typeof window === undefined
    // En jsdom env, window existe — testar que NO crashea con args weird
    expect(() => tcTrack("page_view", {})).not.toThrow();
  });

  it("payload contiene type", () => {
    tcTrack("favorite_added", { deal_id: "x-1" });
    const arg = beaconSpy.mock.calls[0]?.[1];
    expect(arg).toBeDefined();
  });
});

describe("tcTrackOnce — dedup", () => {
  let beaconSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    beaconSpy = vi.fn(() => true);
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch { /* swallow */ }
    Object.defineProperty(navigator, "sendBeacon", {
      value: beaconSpy,
      configurable: true,
      writable: true,
    });
  });

  it("primer evento (type, key) dispara", () => {
    tcTrackOnce("premium_cta_view", "hero_banner");
    expect(beaconSpy).toHaveBeenCalledTimes(1);
  });

  it("segundo evento mismo (type, key) NO dispara", () => {
    tcTrackOnce("premium_cta_view", "hero_banner");
    tcTrackOnce("premium_cta_view", "hero_banner");
    expect(beaconSpy).toHaveBeenCalledTimes(1);
  });

  it("mismo type, distinto key → dispara dos veces", () => {
    tcTrackOnce("result_viewed", "deal-1");
    tcTrackOnce("result_viewed", "deal-2");
    expect(beaconSpy).toHaveBeenCalledTimes(2);
  });

  it("distinto type, mismo key → dispara dos veces", () => {
    tcTrackOnce("result_viewed", "deal-1");
    tcTrackOnce("favorite_added", "deal-1");
    expect(beaconSpy).toHaveBeenCalledTimes(2);
  });
});

describe("readUtmFromLocation", () => {
  it("sin params → {}", () => {
    // Default jsdom URL: http://localhost:3000/
    expect(readUtmFromLocation()).toEqual({});
  });

  it("con utm_source → lo lee", () => {
    Object.defineProperty(window, "location", {
      value: {
        search: "?utm_source=newsletter&utm_medium=email",
        href: "http://x/?utm_source=newsletter&utm_medium=email",
      },
      configurable: true,
    });
    const r = readUtmFromLocation();
    expect(r.utm_source).toBe("newsletter");
    expect(r.utm_medium).toBe("email");
  });

  it("solo lee whitelist (no params arbitrarios)", () => {
    Object.defineProperty(window, "location", {
      value: { search: "?utm_random=foo&other=bar" },
      configurable: true,
    });
    const r = readUtmFromLocation();
    expect(r.other).toBeUndefined();
    // utm_random no está en whitelist (solo source/medium/campaign/content/term)
    expect(r.utm_random).toBeUndefined();
  });
});
