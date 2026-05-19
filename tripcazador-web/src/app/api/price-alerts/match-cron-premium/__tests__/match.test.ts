/**
 * match-cron-premium match.test.ts — SSS302
 *
 * Tests para dealMatchesAlert exportada del cron Premium.
 * El cron Premium reusa la misma lógica de matching que el cron gratis,
 * pero la testeamos aquí independientemente porque las exports están
 * separadas (no compartimos código entre routes).
 */
import { describe, it, expect } from "vitest";
import { dealMatchesAlert } from "@/lib/deal_alert_matcher";

const SAMPLE_ALERT_PREMIUM = {
  id: "pa_test",
  email: "x@y.com",
  origin: "BCN",
  destination: "JFK",
  max_price: 400,
  cabin: undefined,
  date_min: undefined,
  date_max: undefined,
  created_at: Date.now(),
  triggered_at: null,
  active: true,
  tier: "premium" as const,
  customerId: "cs_live_x",
};

describe("dealMatchesAlert SSS302 premium cron", () => {
  it("match exacto", () => {
    expect(
      dealMatchesAlert(
        { origin: "BCN", destination: "JFK", price_eur: 350 },
        SAMPLE_ALERT_PREMIUM,
      ),
    ).toBe(true);
  });

  it("no match si price > max_price", () => {
    expect(
      dealMatchesAlert(
        { origin: "BCN", destination: "JFK", price_eur: 500 },
        SAMPLE_ALERT_PREMIUM,
      ),
    ).toBe(false);
  });

  it("no match si price missing", () => {
    expect(
      dealMatchesAlert({ origin: "BCN", destination: "JFK" }, SAMPLE_ALERT_PREMIUM),
    ).toBe(false);
  });

  it("no match si origin diferente", () => {
    expect(
      dealMatchesAlert(
        { origin: "MAD", destination: "JFK", price_eur: 350 },
        SAMPLE_ALERT_PREMIUM,
      ),
    ).toBe(false);
  });

  it("no match si destination diferente", () => {
    expect(
      dealMatchesAlert(
        { origin: "BCN", destination: "LAX", price_eur: 350 },
        SAMPLE_ALERT_PREMIUM,
      ),
    ).toBe(false);
  });

  it("alert sin origin → match cualquier origin", () => {
    expect(
      dealMatchesAlert(
        { origin: "ZRH", destination: "JFK", price_eur: 350 },
        { ...SAMPLE_ALERT_PREMIUM, origin: undefined },
      ),
    ).toBe(true);
  });

  it("alert sin destination → match cualquier destination", () => {
    expect(
      dealMatchesAlert(
        { origin: "BCN", destination: "LAX", price_eur: 350 },
        { ...SAMPLE_ALERT_PREMIUM, destination: undefined },
      ),
    ).toBe(true);
  });

  it("cabin filter: alert business + deal economy → no match", () => {
    expect(
      dealMatchesAlert(
        { origin: "BCN", destination: "JFK", price_eur: 350, cabin: "economy" },
        { ...SAMPLE_ALERT_PREMIUM, cabin: "business" },
      ),
    ).toBe(false);
  });

  it("cabin filter: match exacto economy", () => {
    expect(
      dealMatchesAlert(
        { origin: "BCN", destination: "JFK", price_eur: 350, cabin: "economy" },
        { ...SAMPLE_ALERT_PREMIUM, cabin: "economy" },
      ),
    ).toBe(true);
  });

  it("date_min filter: deal antes del rango → no match", () => {
    expect(
      dealMatchesAlert(
        {
          origin: "BCN",
          destination: "JFK",
          price_eur: 350,
          date_out: "2026-06-01",
        },
        { ...SAMPLE_ALERT_PREMIUM, date_min: "2026-08-01" },
      ),
    ).toBe(false);
  });

  it("date_max filter: deal después del rango → no match", () => {
    expect(
      dealMatchesAlert(
        {
          origin: "BCN",
          destination: "JFK",
          price_eur: 350,
          date_out: "2026-12-31",
        },
        { ...SAMPLE_ALERT_PREMIUM, date_max: "2026-10-01" },
      ),
    ).toBe(false);
  });

  it("date range completo: match dentro", () => {
    expect(
      dealMatchesAlert(
        {
          origin: "BCN",
          destination: "JFK",
          price_eur: 350,
          date_out: "2026-09-15",
        },
        {
          ...SAMPLE_ALERT_PREMIUM,
          date_min: "2026-09-01",
          date_max: "2026-09-30",
        },
      ),
    ).toBe(true);
  });
});
