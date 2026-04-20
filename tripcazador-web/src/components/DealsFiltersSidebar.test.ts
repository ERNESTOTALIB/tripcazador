/**
 * Tests para applySidebarFilters.
 *
 * Validamos los tres ejes (precio, duración, aerolíneas) y las
 * combinaciones críticas:
 *   · duration_min = 0 (desconocido) NO debe filtrarse por duración
 *   · airlines = [] significa "todas" (no filtrar)
 *   · maxPrice null significa "sin límite"
 */

import { describe, it, expect } from "vitest";
import { applySidebarFilters, EMPTY_FILTERS } from "./DealsFiltersSidebar";
import type { Deal } from "@/lib/api";

function mkDeal(over: Partial<Deal>): Deal {
  return {
    id: over.id || "id",
    type: "flight",
    headline: "MAD → JFK",
    origin: "MAD",
    destination: "JFK",
    city_from: "Madrid",
    city_to: "Nueva York",
    country_to: "Estados Unidos",
    region: "América Norte",
    price_eur: 400,
    savings_pct: 30,
    savings_eur: 200,
    nights: 0,
    date_out: "2026-06-15",
    date_ret: "",
    cabin: "economy",
    airline: "IB",
    airline_name: "Iberia",
    stops: 0,
    duration_min: 480,
    distance_category: "long",
    score: 80,
    classification: "OFERTA",
    tags: [],
    image_url: "",
    booking_url: "",
    verified: true,
    sources: [],
    found_at: "",
    expires_at: "",
    ...over,
  };
}

const DEALS: Deal[] = [
  mkDeal({ id: "a", price_eur: 100, duration_min: 120, airline: "FR" }), // Ryanair barato corto
  mkDeal({ id: "b", price_eur: 300, duration_min: 480, airline: "IB" }),
  mkDeal({ id: "c", price_eur: 550, duration_min: 720, airline: "BA" }),
  mkDeal({ id: "d", price_eur: 900, duration_min: 0,   airline: "IB" }), // duración desconocida
];

describe("applySidebarFilters", () => {
  it("sin filtros devuelve el mismo array completo", () => {
    expect(applySidebarFilters(DEALS, EMPTY_FILTERS)).toHaveLength(4);
  });

  it("maxPrice filtra estrictamente mayores", () => {
    const out = applySidebarFilters(DEALS, {
      ...EMPTY_FILTERS,
      maxPrice: 400,
    });
    expect(out.map((d) => d.id)).toEqual(["a", "b"]);
  });

  it("maxPrice null = sin límite", () => {
    expect(
      applySidebarFilters(DEALS, { ...EMPTY_FILTERS, maxPrice: null }),
    ).toHaveLength(4);
  });

  it("maxDurationMin excluye vuelos demasiado largos", () => {
    const out = applySidebarFilters(DEALS, {
      ...EMPTY_FILTERS,
      maxDurationMin: 500,
    });
    // d tiene duration_min=0 (desconocido) y debe pasar; c es 720 → fuera
    expect(out.map((d) => d.id)).toEqual(["a", "b", "d"]);
  });

  it("duration_min === 0 NO filtra (dato desconocido)", () => {
    const out = applySidebarFilters(DEALS, {
      ...EMPTY_FILTERS,
      maxDurationMin: 60, // brutalmente estricto
    });
    // a (120) → fuera, b/c → fuera, d (0) → pasa
    expect(out.map((d) => d.id)).toEqual(["d"]);
  });

  it("airlines: selección única", () => {
    const out = applySidebarFilters(DEALS, {
      ...EMPTY_FILTERS,
      airlines: ["IB"],
    });
    expect(out.map((d) => d.id)).toEqual(["b", "d"]);
  });

  it("airlines: selección múltiple en OR", () => {
    const out = applySidebarFilters(DEALS, {
      ...EMPTY_FILTERS,
      airlines: ["IB", "FR"],
    });
    expect(out.map((d) => d.id)).toEqual(["a", "b", "d"]);
  });

  it("airlines: [] = sin filtro (no vacía el resultado)", () => {
    const out = applySidebarFilters(DEALS, {
      ...EMPTY_FILTERS,
      airlines: [],
    });
    expect(out).toHaveLength(4);
  });

  it("combina los tres ejes en AND", () => {
    const out = applySidebarFilters(DEALS, {
      maxPrice: 500,
      maxDurationMin: 500,
      airlines: ["IB"],
    });
    // b: 300€, 480min, IB → pasa; a/c/d no cumplen algún eje
    expect(out.map((d) => d.id)).toEqual(["b"]);
  });

  it("dataset vacío devuelve vacío", () => {
    expect(applySidebarFilters([], EMPTY_FILTERS)).toEqual([]);
    expect(
      applySidebarFilters([], { maxPrice: 100, maxDurationMin: 10, airlines: ["X"] }),
    ).toEqual([]);
  });
});
