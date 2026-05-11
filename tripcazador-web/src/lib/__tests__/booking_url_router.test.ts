/**
 * booking_url_router.test.ts — YYY01 A/B booking link routing.
 */
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { routeBookingUrl } from "../booking_url_router";

describe("routeBookingUrl — non-profitable", () => {
  beforeEach(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch { /* noop */ }
  });

  it("aerolínea full-service (Iberia IB) → URL original, variant A", () => {
    const r = routeBookingUrl({
      originalUrl: "https://iberia.com/...",
      airlineCode: "IB",
      origin: "MAD",
      destination: "BCN",
      dateOut: "2026-06-01",
    });
    expect(r.variant).toBe("A");
    expect(r.rerouted).toBe(false);
    expect(r.url).toBe("https://iberia.com/...");
  });

  it("aerolínea desconocida + dominio no-TP → no reescribe", () => {
    const r = routeBookingUrl({
      originalUrl: "https://example.com/?ref=x",
      airlineCode: "ZZ",
      origin: "MAD",
      destination: "BCN",
      dateOut: "2026-06-01",
    });
    expect(r.rerouted).toBe(false);
  });

  it("missing origin → no reescribe", () => {
    const r = routeBookingUrl({
      originalUrl: "https://ryanair.com/...",
      airlineCode: "FR",
      origin: "",
      destination: "BCN",
      dateOut: "2026-06-01",
    });
    expect(r.rerouted).toBe(false);
  });

  it("missing dateOut → no reescribe", () => {
    const r = routeBookingUrl({
      originalUrl: "https://ryanair.com/...",
      airlineCode: "FR",
      origin: "STN",
      destination: "BCN",
      dateOut: "",
    });
    expect(r.rerouted).toBe(false);
  });

  it("airlineCode null + URL Iberia → no profitable, no reescribe", () => {
    const r = routeBookingUrl({
      originalUrl: "https://iberia.com/route",
      airlineCode: null,
      origin: "MAD",
      destination: "BCN",
      dateOut: "2026-06-01",
    });
    expect(r.rerouted).toBe(false);
  });
});

describe("routeBookingUrl — profitable airline sin consent", () => {
  beforeEach(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch { /* noop */ }
  });

  it("Ryanair (FR) sin consent → variant default A (no reescribe)", () => {
    const r = routeBookingUrl({
      originalUrl: "https://ryanair.com/...",
      airlineCode: "FR",
      origin: "STN",
      destination: "BCN",
      dateOut: "2026-06-01",
    });
    // sin consent, getVariant cae a defaultVariant
    expect(r.variant).toBe("A");
    expect(r.rerouted).toBe(false);
    expect(r.url).toBe("https://ryanair.com/...");
  });

  it("easyJet (U2) profitable code", () => {
    const r = routeBookingUrl({
      originalUrl: "https://www.easyjet.com/x",
      airlineCode: "U2",
      origin: "LGW",
      destination: "PMI",
      dateOut: "2026-06-01",
    });
    expect(r.variant).toBe("A");
  });

  it("Wizz (W6) profitable code", () => {
    const r = routeBookingUrl({
      originalUrl: "https://wizzair.com/x",
      airlineCode: "W6",
      origin: "LTN",
      destination: "WAW",
      dateOut: "2026-06-01",
    });
    expect(r.variant).toBe("A");
  });

  it("Detección por dominio URL — ryanair.com presente → profitable", () => {
    const r = routeBookingUrl({
      originalUrl: "https://www.ryanair.com/special-deal",
      airlineCode: "", // sin code
      origin: "STN",
      destination: "BCN",
      dateOut: "2026-06-01",
    });
    // Sin consent: defaultVariant=A
    expect(r.variant).toBe("A");
  });
});
