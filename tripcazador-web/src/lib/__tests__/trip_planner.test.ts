/**
 * trip_planner.test.ts — SSS232 (16 may 2026)
 *
 * Tests para lib/trip_planner.ts (377 líneas previo sin cov).
 *
 * Cubre `buildHeuristicItinerary` — la función core que genera el plan
 * de viaje completo. Foco en:
 *  - Edge cases en `days` (min 2, max 21)
 *  - `budget` floor 150€
 *  - Bookings con URLs afiliadas correctas (SSS179 fix verified)
 *  - heymondo.com canonical (NO .es)
 *  - Itinerary day labels (llegada/despedida/intermedio)
 *  - Cost estimates per day
 */
import { describe, it, expect } from "vitest";
import { buildHeuristicItinerary, type TripPlannerInput } from "../trip_planner";

const minimalInput: TripPlannerInput = {
  destination: "Lisboa",
  origin: "MAD",
  days: 5,
  travelers: 2,
  budget: 800,
  style: "balanced",
};

describe("buildHeuristicItinerary — bounds + structure", () => {
  it("genera N days correctos", () => {
    const r = buildHeuristicItinerary({ ...minimalInput, days: 7 });
    expect(r.daily).toHaveLength(7);
    expect(r.days).toBe(7);
  });

  it("clamps days min=2 (input días = 1)", () => {
    const r = buildHeuristicItinerary({ ...minimalInput, days: 1 });
    expect(r.days).toBe(2);
  });

  it("clamps days max=21 (input días = 30)", () => {
    const r = buildHeuristicItinerary({ ...minimalInput, days: 30 });
    expect(r.days).toBe(21);
  });

  it("budget floor 150€ (input 50€)", () => {
    const r = buildHeuristicItinerary({ ...minimalInput, budget: 50 });
    expect(r.total_budget).toBe(150);
  });

  it("per_person_per_day = total / travelers / days", () => {
    const r = buildHeuristicItinerary({
      ...minimalInput,
      days: 5,
      travelers: 2,
      budget: 1000,
    });
    expect(r.per_person_per_day).toBe(100); // 1000 / 2 / 5
  });

  it("travelers=1 — singular viajero en summary", () => {
    const r = buildHeuristicItinerary({ ...minimalInput, travelers: 1 });
    expect(r.summary).toContain("1 viajero");
    expect(r.summary).not.toContain("viajeros"); // plural
  });

  it("travelers≥2 — plural viajeros en summary", () => {
    const r = buildHeuristicItinerary({ ...minimalInput, travelers: 3 });
    expect(r.summary).toContain("3 viajeros");
  });
});

describe("buildHeuristicItinerary — day labels", () => {
  it("primer día = llegada", () => {
    const r = buildHeuristicItinerary(minimalInput);
    expect(r.daily[0].title).toMatch(/Llegada/i);
  });

  it("último día = despedida", () => {
    const r = buildHeuristicItinerary(minimalInput);
    const last = r.daily[r.daily.length - 1];
    expect(last.title).toMatch(/Despedida/i);
  });

  it("días intermedios usan nombre destino", () => {
    const r = buildHeuristicItinerary(minimalInput);
    expect(r.daily[2].title).toContain("Lisboa");
  });

  it("cada día tiene morning + afternoon + evening + food_pick + cost_est", () => {
    const r = buildHeuristicItinerary(minimalInput);
    for (const day of r.daily) {
      expect(day.morning).toBeTruthy();
      expect(day.afternoon).toBeTruthy();
      expect(day.evening).toBeTruthy();
      expect(day.food_pick).toBeTruthy();
      expect(day.cost_est).toBeTruthy();
    }
  });

  it("cost_est primer día = caro (×1.4)", () => {
    const r = buildHeuristicItinerary({ ...minimalInput, days: 5, budget: 1000, travelers: 1 });
    // Per person per day = 1000/1/5 = 200. Día caro = 200 × 1.4 = 280
    expect(r.daily[0].cost_est).toContain("280");
    expect(r.daily[0].cost_est).toContain("caro");
  });

  it("cost_est último día = tranquilo (×0.8)", () => {
    const r = buildHeuristicItinerary({ ...minimalInput, days: 5, budget: 1000, travelers: 1 });
    // Día tranquilo = 200 × 0.8 = 160
    const last = r.daily[r.daily.length - 1];
    expect(last.cost_est).toContain("160");
    expect(last.cost_est).toMatch(/tranquilo|tranquilo/i);
  });
});

describe("buildHeuristicItinerary — affiliate URLs (revenue critical SSS179)", () => {
  it("Booking.com URL con aid (default 714734)", () => {
    const r = buildHeuristicItinerary(minimalInput);
    const hotel = r.bookings.hotel.href;
    expect(hotel).toMatch(/^https:\/\/www\.booking\.com\/searchresults/);
    expect(hotel).toContain("aid=");
    expect(hotel).toContain("ss=Lisboa");
    expect(hotel).toContain("group_adults=2");
  });

  it("Heymondo URL canonical .com (NO .es — SSS213 verified)", () => {
    const r = buildHeuristicItinerary(minimalInput);
    const ins = r.bookings.insurance.href;
    expect(ins).toMatch(/^https:\/\/heymondo\.com\//);
    expect(ins).not.toContain("heymondo.es");
    expect(ins).toContain("utm_source=tripcazador");
  });

  it("Skyscanner flights URL con origin+destination", () => {
    const r = buildHeuristicItinerary({ ...minimalInput, origin: "BCN", destination: "Tokio" });
    const flights = r.bookings.flights.href;
    expect(flights).toMatch(/^https:\/\/www\.skyscanner\.es\/transport\/flights\/BCN\//);
    expect(flights).toContain("Tokio");
  });

  it("GetYourGuide URL con query destination", () => {
    const r = buildHeuristicItinerary({ ...minimalInput, destination: "Roma" });
    const acts = r.bookings.activities.href;
    expect(acts).toMatch(/^https:\/\/www\.getyourguide\.com\/s\?q=Roma/);
  });

  it("Holafly eSIM URL con ref (default tripcazador)", () => {
    const r = buildHeuristicItinerary(minimalInput);
    const esim = r.bookings.esim.href;
    expect(esim).toMatch(/^https:\/\/esim\.holafly\.com\//);
    expect(esim).toContain("ref=");
  });

  it("origin se uppercases + 3 chars max", () => {
    const r = buildHeuristicItinerary({ ...minimalInput, origin: "madrid" });
    expect(r.bookings.flights.href).toContain("/MAD/");
  });

  it("origin default MAD si vacío", () => {
    const r = buildHeuristicItinerary({ ...minimalInput, origin: "" });
    expect(r.bookings.flights.href).toContain("/MAD/");
  });

  it("ninguna URL afiliada tiene esquema peligroso", () => {
    const r = buildHeuristicItinerary(minimalInput);
    for (const b of Object.values(r.bookings)) {
      expect(b.href).toMatch(/^https?:\/\//);
      expect(b.href).not.toMatch(/^javascript:/i);
      expect(b.href).not.toMatch(/^data:/i);
    }
  });
});

describe("buildHeuristicItinerary — generated_at + used_ai flag", () => {
  it("generated_at es ISO timestamp válido", () => {
    const r = buildHeuristicItinerary(minimalInput);
    expect(r.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const ts = new Date(r.generated_at).getTime();
    expect(Number.isFinite(ts)).toBe(true);
  });

  it("used_ai=false para heuristic", () => {
    const r = buildHeuristicItinerary(minimalInput);
    expect(r.used_ai).toBe(false);
  });
});
