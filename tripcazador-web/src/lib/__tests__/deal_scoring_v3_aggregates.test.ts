/**
 * deal_scoring_v3_aggregates.test.ts — SSS379
 *
 * Verifica los agregados cross-route (airline, destination) y el fallback
 * de scoreDealV3 cuando ruta exacta tiene <3 muestras.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  scoreDealV3,
  recordOutcome,
  lookupAirlineHistory,
  lookupDestinationHistory,
  __resetForTests,
} from "../deal_scoring_v3";

beforeEach(() => __resetForTests());

describe("lookupAirlineHistory", () => {
  it("agrega outcomes por aerolínea cross-rutas (n>=5)", () => {
    recordOutcome("d1", "MAD-NRT-NH", "booked");
    recordOutcome("d2", "BCN-NRT-NH", "booked");
    recordOutcome("d3", "MAD-HND-NH", "booked");
    recordOutcome("d4", "MAD-NRT-NH", "expired_no_takers");
    recordOutcome("d5", "MAD-LAX-NH", "false_positive");
    // Outras aerolíneas no cuentan
    recordOutcome("d6", "MAD-NRT-JL", "booked");

    const s = lookupAirlineHistory("NH");
    expect(s.total_samples).toBe(5);
    expect(s.booking_rate).toBeCloseTo(0.6, 2);
    expect(s.is_significant).toBe(true);
  });

  it("n<5 no significativo", () => {
    recordOutcome("d1", "MAD-NRT-NH", "booked");
    recordOutcome("d2", "MAD-HND-NH", "booked");
    const s = lookupAirlineHistory("NH");
    expect(s.is_significant).toBe(false);
  });
});

describe("lookupDestinationHistory", () => {
  it("agrega outcomes por destino cross-aerolíneas", () => {
    recordOutcome("d1", "MAD-NRT-NH", "booked");
    recordOutcome("d2", "MAD-NRT-JL", "booked");
    recordOutcome("d3", "BCN-NRT-NH", "expired_no_takers");
    recordOutcome("d4", "BCN-NRT-JL", "false_positive");
    recordOutcome("d5", "MAD-NRT-KL", "booked");
    // Destino diferente
    recordOutcome("d6", "MAD-LAX-DL", "booked");

    const s = lookupDestinationHistory("NRT");
    expect(s.total_samples).toBe(5);
    expect(s.is_significant).toBe(true);
  });
});

describe("scoreDealV3 SSS379 fallback agregados", () => {
  it("aplica +5 boost cuando ruta exacta vacía pero aerolínea histórica positiva", () => {
    // 5 outcomes de NH en rutas distintas, 4 booked → 80% booking_rate
    recordOutcome("d1", "MAD-NRT-NH", "booked");
    recordOutcome("d2", "BCN-NRT-NH", "booked");
    recordOutcome("d3", "MAD-HND-NH", "booked");
    recordOutcome("d4", "VLC-NRT-NH", "booked");
    recordOutcome("d5", "MAD-LAX-NH", "expired_no_takers");

    // Score una ruta NUEVA con NH (no en historial)
    const r = scoreDealV3({
      origin: "AGP",
      destination: "NRT",
      airline_code: "NH",
      price_eur: 500,
      savings_pct: 50,
    });
    expect(r.v3_adjustment).toBeGreaterThanOrEqual(5);
    expect(r.v3_reason.some((x) => x.includes("Aerolínea NH histórica"))).toBe(true);
  });

  it("aplica -8 penalty cuando aerolínea FP-heavy", () => {
    // 5 FP de FR
    recordOutcome("d1", "MAD-STN-FR", "false_positive");
    recordOutcome("d2", "BCN-STN-FR", "false_positive");
    recordOutcome("d3", "AGP-DUB-FR", "false_positive");
    recordOutcome("d4", "VLC-STN-FR", "false_positive");
    recordOutcome("d5", "TFS-LGW-FR", "booked");

    const r = scoreDealV3({
      origin: "PMI",
      destination: "STN",
      airline_code: "FR",
      price_eur: 19,
      savings_pct: 80,
    });
    expect(r.v3_adjustment).toBeLessThanOrEqual(-8);
    expect(r.v3_reason.some((x) => x.includes("FR histórica"))).toBe(true);
  });

  it("destino agregado boost +3 además de aerolínea", () => {
    // Aerolínea NH 5 muestras 100% booked
    recordOutcome("d1", "MAD-NRT-NH", "booked");
    recordOutcome("d2", "BCN-NRT-NH", "booked");
    recordOutcome("d3", "MAD-HND-NH", "booked");
    recordOutcome("d4", "VLC-NRT-NH", "booked");
    recordOutcome("d5", "MAD-LAX-NH", "booked");
    // Destino NRT 5 muestras cross-airlines 100% booked
    recordOutcome("d6", "MAD-NRT-JL", "booked");
    recordOutcome("d7", "MAD-NRT-KL", "booked");
    recordOutcome("d8", "BCN-NRT-AF", "booked");
    recordOutcome("d9", "AGP-NRT-LH", "booked");
    recordOutcome("d10", "VLC-NRT-FI", "booked");

    const r = scoreDealV3({
      origin: "ZZZ", // ruta nueva → fallback agregados
      destination: "NRT",
      airline_code: "NH",
      price_eur: 500,
      savings_pct: 50,
    });
    // Boost airline +5 + dest +3 = 8
    expect(r.v3_adjustment).toBeGreaterThanOrEqual(8);
  });

  it("sin agregados significativos → sin ajuste", () => {
    const r = scoreDealV3({
      origin: "AAA",
      destination: "BBB",
      airline_code: "CC",
      price_eur: 500,
      savings_pct: 50,
    });
    expect(r.v3_adjustment).toBe(0);
  });
});
