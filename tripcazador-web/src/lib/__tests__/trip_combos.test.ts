/**
 * trip_combos.test.ts — SSS325
 */
import { describe, it, expect } from "vitest";
import { planTripCombos, type PlannerFlightDeal } from "../trip_combos";

const TODAY = new Date("2026-05-20T12:00:00Z");

function mkDeal(d: Partial<PlannerFlightDeal>): PlannerFlightDeal {
  return {
    id: "deal_x",
    origin: "BCN",
    destination: "JFK",
    price_eur: 400,
    date_out: "2026-09-15",
    airline_name: "Iberia",
    ...d,
  };
}

describe("planTripCombos SSS325", () => {
  it("filtra por destino + mes", () => {
    const deals = [
      mkDeal({ destination: "JFK", date_out: "2026-09-10", price_eur: 400 }),
      mkDeal({ destination: "JFK", date_out: "2026-10-10", price_eur: 350 }), // mes distinto
      mkDeal({ destination: "LAX", date_out: "2026-09-15", price_eur: 300 }), // dest distinto
    ];
    const r = planTripCombos({
      destinationIata: "JFK",
      monthYYYYMM: "2026-09",
      nights: 5,
      deals,
      today: TODAY,
    });
    expect(r.length).toBe(1);
    expect(r[0].flight.id).toBe("deal_x");
  });

  it("ordena ASC por total_eur", () => {
    const deals = [
      mkDeal({ id: "a", origin: "BCN", destination: "TYO", date_out: "2026-09-10", price_eur: 600 }),
      mkDeal({ id: "b", origin: "MAD", destination: "TYO", date_out: "2026-09-12", price_eur: 500 }),
      mkDeal({ id: "c", origin: "VLC", destination: "TYO", date_out: "2026-09-14", price_eur: 700 }),
    ];
    const r = planTripCombos({
      destinationIata: "TYO",
      monthYYYYMM: "2026-09",
      nights: 5,
      deals,
      today: TODAY,
      limit: 3,
    });
    expect(r.length).toBe(3);
    expect(r[0].total_eur).toBeLessThanOrEqual(r[1].total_eur);
    expect(r[1].total_eur).toBeLessThanOrEqual(r[2].total_eur);
  });

  it("dedupe por origin (más barato gana)", () => {
    const deals = [
      mkDeal({ id: "expensive", origin: "BCN", destination: "TYO", date_out: "2026-09-10", price_eur: 600 }),
      mkDeal({ id: "cheap", origin: "BCN", destination: "TYO", date_out: "2026-09-12", price_eur: 400 }),
    ];
    const r = planTripCombos({
      destinationIata: "TYO",
      monthYYYYMM: "2026-09",
      nights: 5,
      deals,
      today: TODAY,
    });
    expect(r.length).toBe(1);
    expect(r[0].flight.id).toBe("cheap");
  });

  it("respeta limit", () => {
    const deals = Array.from({ length: 10 }, (_, i) =>
      mkDeal({
        id: `d_${i}`,
        origin: `O${String(i).padStart(2, "0")}`,
        destination: "TYO",
        date_out: `2026-09-${String(10 + i).padStart(2, "0")}`,
        price_eur: 300 + i * 50,
      }),
    );
    const r = planTripCombos({
      destinationIata: "TYO",
      monthYYYYMM: "2026-09",
      nights: 5,
      deals,
      today: TODAY,
      limit: 2,
    });
    expect(r.length).toBe(2);
  });

  it("vacío si no hay match destino", () => {
    expect(
      planTripCombos({
        destinationIata: "JFK",
        monthYYYYMM: "2026-09",
        nights: 5,
        deals: [mkDeal({ destination: "TYO" })],
        today: TODAY,
      }),
    ).toEqual([]);
  });

  it("vacío si destino no IATA válido", () => {
    expect(
      planTripCombos({
        destinationIata: "junk",
        monthYYYYMM: "2026-09",
        nights: 5,
        deals: [],
        today: TODAY,
      }),
    ).toEqual([]);
  });

  it("vacío si mes mal formado", () => {
    expect(
      planTripCombos({
        destinationIata: "JFK",
        monthYYYYMM: "09/2026",
        nights: 5,
        deals: [mkDeal({})],
        today: TODAY,
      }),
    ).toEqual([]);
  });

  it("nights clamp 1-60", () => {
    const r = planTripCombos({
      destinationIata: "JFK",
      monthYYYYMM: "2026-09",
      nights: 9999,
      deals: [mkDeal({})],
      today: TODAY,
    });
    expect(r[0].hotel.nights).toBeLessThanOrEqual(60);
  });

  it("hotel total = nights × ppn", () => {
    const r = planTripCombos({
      destinationIata: "JFK",
      monthYYYYMM: "2026-09",
      nights: 4,
      deals: [mkDeal({})],
      today: TODAY,
    });
    expect(r[0].hotel.total_eur).toBeCloseTo(r[0].hotel.ppn * 4, 1);
  });

  it("total_eur = flight + hotel", () => {
    const r = planTripCombos({
      destinationIata: "JFK",
      monthYYYYMM: "2026-09",
      nights: 5,
      deals: [mkDeal({ price_eur: 400 })],
      today: TODAY,
    });
    expect(r[0].total_eur).toBeCloseTo(400 + r[0].hotel.total_eur, 1);
  });
});
