/**
 * baggage_dimensions.test.ts — SSS450 pure-fn tests.
 */
import { describe, it, expect } from "vitest";
import {
  parseDimensions,
  parseWeight,
  bagFitsDimensions,
  bagFitsWeight,
  checkAirlineFit,
  checkAllAirlines,
  type BagSize,
} from "@/lib/baggage_dimensions";
import { BAGGAGE_RULES } from "@/lib/baggage_rules";

describe("baggage_dimensions", () => {
  it("parseDimensions reconoce '55 × 40 × 20 cm'", () => {
    expect(parseDimensions("55 × 40 × 20 cm")).toEqual([55, 40, 20]);
  });

  it("parseDimensions reconoce '55x40x20cm' sin espacios", () => {
    expect(parseDimensions("55x40x20cm")).toEqual([55, 40, 20]);
  });

  it("parseDimensions devuelve null si no coincide", () => {
    expect(parseDimensions("no dimensions here")).toBeNull();
  });

  it("parseWeight reconoce '10 kg'", () => {
    expect(parseWeight("10 kg")).toBe(10);
  });

  it("parseWeight reconoce '7.5 kg'", () => {
    expect(parseWeight("7.5 kg")).toBe(7.5);
  });

  it("parseWeight reconoce '8,5 kg' (coma decimal)", () => {
    expect(parseWeight("8,5 kg")).toBe(8.5);
  });

  it("bagFitsDimensions — bolso 40×20×25 entra en límite Ryanair personal 40×20×25", () => {
    const bag: BagSize = { length: 40, width: 20, height: 25, weightKg: 5 };
    expect(bagFitsDimensions(bag, "40 × 20 × 25 cm")).toBe(true);
  });

  it("bagFitsDimensions — bolso 50×30×25 NO entra en 40×20×25", () => {
    const bag: BagSize = { length: 50, width: 30, height: 25, weightKg: 5 };
    expect(bagFitsDimensions(bag, "40 × 20 × 25 cm")).toBe(false);
  });

  it("bagFitsDimensions — orientación libre (probamos al revés)", () => {
    const bag: BagSize = { length: 20, width: 40, height: 25, weightKg: 5 };
    // Mismas dimensiones reorganizadas — debería entrar en 40×20×25
    expect(bagFitsDimensions(bag, "40 × 20 × 25 cm")).toBe(true);
  });

  it("bagFitsWeight — sin límite (undefined) permite cualquier peso", () => {
    const bag: BagSize = { length: 40, width: 20, height: 25, weightKg: 100 };
    expect(bagFitsWeight(bag, undefined)).toBe(true);
  });

  it("bagFitsWeight — 7kg entra en límite 10kg", () => {
    const bag: BagSize = { length: 40, width: 20, height: 25, weightKg: 7 };
    expect(bagFitsWeight(bag, "10 kg")).toBe(true);
  });

  it("bagFitsWeight — 11kg NO entra en límite 10kg", () => {
    const bag: BagSize = { length: 40, width: 20, height: 25, weightKg: 11 };
    expect(bagFitsWeight(bag, "10 kg")).toBe(false);
  });

  it("checkAirlineFit Ryanair — bolso 40×20×25 5kg = personal item OK", () => {
    const ryanair = BAGGAGE_RULES.find((r) => r.slug === "ryanair")!;
    const bag: BagSize = { length: 40, width: 20, height: 25, weightKg: 5 };
    const result = checkAirlineFit(bag, ryanair);
    expect(result.personalItem.fits).toBe(true);
    // SSS456: cabinFree removed (was duplicate of personalItem)
    expect(result.cabinPaid.fits).toBe(true);
  });

  it("checkAirlineFit Ryanair — bolso 55×40×20 8kg = cabin paid OK pero personal item NO", () => {
    const ryanair = BAGGAGE_RULES.find((r) => r.slug === "ryanair")!;
    const bag: BagSize = { length: 55, width: 40, height: 20, weightKg: 8 };
    const result = checkAirlineFit(bag, ryanair);
    expect(result.personalItem.fits).toBe(false);
    expect(result.cabinPaid.fits).toBe(true);
    expect(result.cabinPaid.feeFromEur).toBeGreaterThan(0);
  });

  it("checkAllAirlines — devuelve array con todas las rules", () => {
    const bag: BagSize = { length: 40, width: 20, height: 25, weightKg: 5 };
    const all = checkAllAirlines(bag);
    expect(all.length).toBe(BAGGAGE_RULES.length);
    expect(all.every((r) => "airline" in r)).toBe(true);
  });
});
