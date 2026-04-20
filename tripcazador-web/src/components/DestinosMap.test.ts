import { describe, expect, it } from "vitest";
import { clusterByDestination, priceColor } from "./DestinosMap.helpers";
import type { Deal } from "@/lib/api";

// Helper para fabricar Deals mínimos. Solo los campos que usa el clusterer.
function mkDeal(over: Partial<Deal> = {}): Deal {
  return {
    id: over.id ?? "d1",
    type: "flight",
    headline: "",
    origin: "MAD",
    destination: over.destination ?? "JFK",
    city_from: over.city_from ?? "Madrid",
    city_to: over.city_to ?? "Nueva York",
    country_to: over.country_to ?? "EE.UU.",
    region: "América",
    price_eur: over.price_eur ?? 200,
    savings_pct: 50,
    savings_eur: 200,
    nights: 0,
    date_out: "2026-05-01",
    date_ret: "2026-05-10",
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
    lat: over.lat ?? 40.64,
    lon: over.lon ?? -73.78,
    ...over,
  } as Deal;
}

describe("clusterByDestination", () => {
  it("agrupa deals por IATA de destino y conserva el precio mínimo", () => {
    const deals = [
      mkDeal({ id: "a", destination: "JFK", price_eur: 300 }),
      mkDeal({ id: "b", destination: "JFK", price_eur: 150 }),
      mkDeal({ id: "c", destination: "JFK", price_eur: 220 }),
    ];
    const clusters = clusterByDestination(deals);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].key).toBe("JFK");
    expect(clusters[0].minPrice).toBe(150);
    expect(clusters[0].count).toBe(3);
  });

  it("crea un cluster por destino distinto", () => {
    const deals = [
      mkDeal({ id: "1", destination: "JFK", lat: 40.6, lon: -73.7 }),
      mkDeal({ id: "2", destination: "NRT", lat: 35.7, lon: 140.4 }),
      mkDeal({ id: "3", destination: "BKK", lat: 13.7, lon: 100.7 }),
    ];
    const clusters = clusterByDestination(deals);
    expect(clusters.map((c) => c.key).sort()).toEqual(["BKK", "JFK", "NRT"]);
  });

  it("ignora deals sin lat/lon numéricos", () => {
    const deals = [
      mkDeal({ id: "no-lat", destination: "XXX", lat: undefined, lon: 0 }),
      mkDeal({ id: "ok", destination: "MAD", lat: 40.5, lon: -3.6 }),
    ];
    const clusters = clusterByDestination(deals);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].key).toBe("MAD");
  });

  it("ordena ascendente por precio mínimo", () => {
    const deals = [
      mkDeal({ id: "a", destination: "JFK", price_eur: 500, lat: 40, lon: -73 }),
      mkDeal({ id: "b", destination: "NRT", price_eur: 200, lat: 35, lon: 140 }),
      mkDeal({ id: "c", destination: "BKK", price_eur: 350, lat: 13, lon: 100 }),
    ];
    const clusters = clusterByDestination(deals);
    expect(clusters.map((c) => c.minPrice)).toEqual([200, 350, 500]);
  });

  it("usa lat,lon como fallback de key si no hay `destination`", () => {
    const deals = [
      mkDeal({ id: "x", destination: "", lat: 48.86, lon: 2.35 }),
    ];
    const clusters = clusterByDestination(deals);
    // Sin destination, la key usa "48.86,2.35"
    expect(clusters[0].key).toMatch(/^48\.\d+,2\.\d+$/);
  });

  it("sobre lista vacía devuelve []", () => {
    expect(clusterByDestination([])).toEqual([]);
  });
});

describe("priceColor", () => {
  it("price <= p33 → verde (emerald-500)", () => {
    expect(priceColor(50, 100, 300)).toBe("#10b981");
    expect(priceColor(100, 100, 300)).toBe("#10b981"); // borde inferior inclusive
  });

  it("p33 < price <= p66 → ámbar (amber-500)", () => {
    expect(priceColor(200, 100, 300)).toBe("#f59e0b");
    expect(priceColor(300, 100, 300)).toBe("#f59e0b"); // borde superior inclusive
  });

  it("price > p66 → rojo (red-500)", () => {
    expect(priceColor(500, 100, 300)).toBe("#ef4444");
    expect(priceColor(301, 100, 300)).toBe("#ef4444");
  });

  it("con p33 === p66 (todos iguales) clasifica como barato", () => {
    expect(priceColor(100, 100, 100)).toBe("#10b981");
    expect(priceColor(101, 100, 100)).toBe("#ef4444");
  });
});
