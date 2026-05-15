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

describe("routeBookingUrl — profitable airline (SSS177: 100% B)", () => {
  beforeEach(() => {
    try { localStorage.clear(); sessionStorage.clear(); } catch { /* noop */ }
  });

  it("Ryanair (FR) sin consent → variant B (bWeight=100 SSS177+179)", () => {
    const r = routeBookingUrl({
      originalUrl: "https://ryanair.com/...",
      airlineCode: "FR",
      origin: "STN",
      destination: "BCN",
      dateOut: "2026-06-01",
    });
    // SSS177: bWeight=100 + SSS179: getVariant siempre asigna por hash
    // → con bWeight=100, todos los hash buckets caen en B.
    expect(r.variant).toBe("B");
    // rerouted depende de si TP_MARKER está set en env de test (suele no estar →
    // travelpayoutsUrl fallback a kayak, que sí difiere del originalUrl ryanair).
    expect(r.rerouted).toBe(true);
    expect(r.url).not.toBe("https://ryanair.com/...");
  });

  it("easyJet (U2) profitable code → variant B (SSS177)", () => {
    const r = routeBookingUrl({
      originalUrl: "https://www.easyjet.com/x",
      airlineCode: "U2",
      origin: "LGW",
      destination: "PMI",
      dateOut: "2026-06-01",
    });
    expect(r.variant).toBe("B");
  });

  it("Wizz (W6) profitable code → variant B (SSS177)", () => {
    const r = routeBookingUrl({
      originalUrl: "https://wizzair.com/x",
      airlineCode: "W6",
      origin: "LTN",
      destination: "WAW",
      dateOut: "2026-06-01",
    });
    expect(r.variant).toBe("B");
  });

  it("Detección por dominio URL — ryanair.com presente → profitable + B", () => {
    const r = routeBookingUrl({
      originalUrl: "https://www.ryanair.com/special-deal",
      airlineCode: "", // sin code
      origin: "STN",
      destination: "BCN",
      dateOut: "2026-06-01",
    });
    // SSS177: defaultVariant=B → siempre reescribe (consent o no)
    expect(r.variant).toBe("B");
    expect(r.rerouted).toBe(true);
  });
});
