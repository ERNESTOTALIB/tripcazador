/**
 * airline_links_tp_marker.test.ts — SSS273 (17 may 2026)
 *
 * Tests para `applyTPMarkerServerSide` — REVENUE LEAK FIX.
 *
 * Antes del fix:
 * - SSR href era Ryanair directo (€0 revenue para crawlers/no-JS/fast clicks)
 * - rewrite client-side podía no aplicarse por race condition
 *
 * Después: si `NEXT_PUBLIC_TP_MARKER` está set y airline es TP-profitable,
 * el booking_url se rewrite a aviasales.es server-side.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

describe("applyTPMarkerServerSide — REVENUE LEAK FIX SSS273", () => {
  it("sin TP_MARKER → pasa-through (no rewrite)", async () => {
    vi.stubEnv("NEXT_PUBLIC_TP_MARKER", "");
    const { applyTPMarkerServerSide } = await import("../airline_links");
    const deal = {
      airline: "FR",
      booking_url: "https://www.ryanair.com/select?ABC",
      origin: "MAD",
      destination: "BCN",
      date_out: "2026-08-15",
    };
    const result = applyTPMarkerServerSide(deal);
    expect(result.booking_url).toBe("https://www.ryanair.com/select?ABC");
    vi.unstubAllEnvs();
  });

  it("con TP_MARKER + Ryanair (code FR) → rewrite a aviasales", async () => {
    vi.stubEnv("NEXT_PUBLIC_TP_MARKER", "testmarker123");
    const { applyTPMarkerServerSide } = await import("../airline_links");
    const deal = {
      airline: "FR",
      booking_url: "https://www.ryanair.com/select?ABC",
      origin: "MAD",
      destination: "BCN",
      date_out: "2026-08-15",
    };
    const result = applyTPMarkerServerSide(deal);
    expect(result.booking_url).toContain("aviasales");
    expect(result.booking_url).toContain("marker=testmarker123");
    vi.unstubAllEnvs();
  });

  it("con TP_MARKER + easyJet (code U2) → rewrite", async () => {
    vi.stubEnv("NEXT_PUBLIC_TP_MARKER", "mk");
    const { applyTPMarkerServerSide } = await import("../airline_links");
    const result = applyTPMarkerServerSide({
      airline: "U2",
      booking_url: "https://www.easyjet.com/booking",
      origin: "BCN",
      destination: "LGW",
      date_out: "2026-09-01",
    });
    expect(result.booking_url).toContain("aviasales");
    vi.unstubAllEnvs();
  });

  it("con TP_MARKER + Iberia (full-service code IB) → NO rewrite", async () => {
    vi.stubEnv("NEXT_PUBLIC_TP_MARKER", "mk");
    const { applyTPMarkerServerSide } = await import("../airline_links");
    const deal = {
      airline: "IB",
      booking_url: "https://www.iberia.com/booking",
      origin: "MAD",
      destination: "JFK",
      date_out: "2026-10-15",
    };
    const result = applyTPMarkerServerSide(deal);
    expect(result.booking_url).toBe("https://www.iberia.com/booking");
    vi.unstubAllEnvs();
  });

  it("detección por dominio (booking_url contiene ryanair.com pero airline vacío)", async () => {
    vi.stubEnv("NEXT_PUBLIC_TP_MARKER", "mk");
    const { applyTPMarkerServerSide } = await import("../airline_links");
    const result = applyTPMarkerServerSide({
      airline: "",
      booking_url: "https://www.ryanair.com/some/path",
      origin: "MAD",
      destination: "BCN",
      date_out: "2026-08-15",
    });
    expect(result.booking_url).toContain("aviasales");
    vi.unstubAllEnvs();
  });

  it("idempotent — si ya es aviasales URL no rewrite", async () => {
    vi.stubEnv("NEXT_PUBLIC_TP_MARKER", "mk");
    const { applyTPMarkerServerSide } = await import("../airline_links");
    const deal = {
      airline: "FR",
      booking_url: "https://www.aviasales.es/search/MAD2308BCN1?marker=other",
      origin: "MAD",
      destination: "BCN",
      date_out: "2026-08-23",
    };
    const result = applyTPMarkerServerSide(deal);
    expect(result.booking_url).toBe(
      "https://www.aviasales.es/search/MAD2308BCN1?marker=other",
    );
    vi.unstubAllEnvs();
  });

  it("sin origin/destination/date_out → pasa-through", async () => {
    vi.stubEnv("NEXT_PUBLIC_TP_MARKER", "mk");
    const { applyTPMarkerServerSide } = await import("../airline_links");
    const result = applyTPMarkerServerSide({
      airline: "FR",
      booking_url: "https://www.ryanair.com/select",
      // origin missing
      destination: "BCN",
      date_out: "2026-08-15",
    });
    expect(result.booking_url).toBe("https://www.ryanair.com/select");
    vi.unstubAllEnvs();
  });
});
