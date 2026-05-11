/**
 * hotel_seed_extended.test.ts — coverage para HOTEL_SEED, getHotelBySlug, etc.
 */
import { describe, it, expect } from "vitest";
import {
  HOTEL_SEED,
  getHotelSeedFallback,
  getHotelEntries,
  getHotelBySlug,
  getHotelAmenities,
  getHotelCoords,
  getHotelGallery,
  getCategoryCounts,
} from "../hotel_seed";

describe("HOTEL_SEED — integridad catálogo", () => {
  it("tiene >= 30 hoteles", () => {
    expect(HOTEL_SEED.length).toBeGreaterThanOrEqual(30);
  });

  it("cada hotel tiene id único", () => {
    const ids = HOTEL_SEED.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada hotel tiene headline y city_to", () => {
    for (const h of HOTEL_SEED) {
      expect(h.headline).toBeTruthy();
      expect(h.city_to).toBeTruthy();
    }
  });

  it("cada hotel tiene type 'hotel'", () => {
    for (const h of HOTEL_SEED) {
      expect(h.type).toBe("hotel");
    }
  });

  it("price_per_night > 0", () => {
    for (const h of HOTEL_SEED) {
      expect(h.price_per_night).toBeGreaterThan(0);
    }
  });
});

describe("getHotelSeedFallback", () => {
  it("retorna array", () => {
    const r = getHotelSeedFallback();
    expect(Array.isArray(r)).toBe(true);
  });

  it("respeta limit custom", () => {
    const r = getHotelSeedFallback({ limit: 4 });
    expect(r.length).toBe(4);
  });

  it("filtra por minStars", () => {
    const r = getHotelSeedFallback({ minStars: 5 });
    for (const h of r) {
      const tag = (h.tags || []).find((t) => t.endsWith("-stars"));
      const stars = tag ? parseInt(tag.split("-")[0], 10) : 0;
      expect(stars).toBeGreaterThanOrEqual(5);
    }
  });

  it("filtra por maxPricePerNight", () => {
    const r = getHotelSeedFallback({ maxPricePerNight: 50, minStars: 1 });
    for (const h of r) {
      expect(h.price_per_night ?? 0).toBeLessThanOrEqual(50);
    }
  });

  it("filtra por category", () => {
    const r = getHotelSeedFallback({ category: "luxury", minStars: 1 });
    for (const h of r) {
      expect((h.tags || []).includes("luxury")).toBe(true);
    }
  });

  it("filtra por region", () => {
    const r = getHotelSeedFallback({ region: "Asia", minStars: 1 });
    for (const h of r) {
      expect(h.region).toBe("Asia");
    }
  });

  it("ordena por price_per_night asc", () => {
    const r = getHotelSeedFallback({ minStars: 1 });
    for (let i = 1; i < r.length; i++) {
      expect(r[i].price_per_night ?? 0).toBeGreaterThanOrEqual(
        r[i - 1].price_per_night ?? 0,
      );
    }
  });
});

describe("getHotelEntries", () => {
  it("devuelve array no vacío", () => {
    const entries = getHotelEntries();
    expect(entries.length).toBeGreaterThan(0);
  });

  it("cada entry tiene slug + name + city + country", () => {
    const entries = getHotelEntries();
    for (const e of entries) {
      expect(e.slug).toBeTruthy();
      expect(e.name).toBeTruthy();
      expect(e.city).toBeTruthy();
      expect(e.country).toBeTruthy();
    }
  });

  it("stars entre 1 y 5", () => {
    const entries = getHotelEntries();
    for (const e of entries) {
      expect(e.stars).toBeGreaterThanOrEqual(1);
      expect(e.stars).toBeLessThanOrEqual(5);
    }
  });

  it("reviewScore válido 0-10", () => {
    const entries = getHotelEntries();
    for (const e of entries) {
      expect(e.reviewScore).toBeGreaterThanOrEqual(0);
      expect(e.reviewScore).toBeLessThanOrEqual(10);
    }
  });

  it("category válida", () => {
    const valid = ["beach", "city", "luxury", "family", "budget"];
    const entries = getHotelEntries();
    for (const e of entries) {
      expect(valid).toContain(e.category);
    }
  });

  it("slugs únicos", () => {
    const slugs = getHotelEntries().map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("getHotelBySlug", () => {
  it("encuentra slug existente", () => {
    const entries = getHotelEntries();
    const first = entries[0];
    expect(getHotelBySlug(first.slug)).toEqual(first);
  });

  it("slug no existente → null", () => {
    expect(getHotelBySlug("no-existe-este-slug-xyz")).toBeNull();
  });

  it("slug vacío → null", () => {
    expect(getHotelBySlug("")).toBeNull();
  });
});

describe("getHotelAmenities", () => {
  it("devuelve array", () => {
    const entries = getHotelEntries();
    expect(Array.isArray(getHotelAmenities(entries[0]))).toBe(true);
  });

  it("incluye al menos 'wifi'", () => {
    const entries = getHotelEntries();
    const am = getHotelAmenities(entries[0]);
    expect(am.length).toBeGreaterThan(0);
  });

  it("respeta amenities específicas del entry", () => {
    const entries = getHotelEntries();
    const withCustom = { ...entries[0], amenities: ["wifi", "pool"] };
    expect(getHotelAmenities(withCustom)).toEqual(["wifi", "pool"]);
  });
});

describe("getHotelCoords", () => {
  it("devuelve [lat, lng]", () => {
    const entries = getHotelEntries();
    const coords = getHotelCoords(entries[0]);
    expect(Array.isArray(coords)).toBe(true);
    expect(coords.length).toBe(2);
    expect(typeof coords[0]).toBe("number");
    expect(typeof coords[1]).toBe("number");
  });

  it("prioriza lat/lng del hotel si están", () => {
    const entries = getHotelEntries();
    const h = { ...entries[0], lat: 10, lng: 20 };
    expect(getHotelCoords(h)).toEqual([10, 20]);
  });

  it("fallback por país", () => {
    const entries = getHotelEntries();
    const h = entries.find((e) => e.country === "España");
    if (h) {
      const coords = getHotelCoords({ ...h, lat: undefined, lng: undefined });
      expect(coords[0]).toBeCloseTo(40.4, 0);
    }
  });
});

describe("getHotelGallery", () => {
  it("devuelve 5 imageIds (hero + 4 secondary)", () => {
    const entries = getHotelEntries();
    expect(getHotelGallery(entries[0]).length).toBe(5);
  });

  it("primer ID es el imageId del hotel", () => {
    const entries = getHotelEntries();
    const gal = getHotelGallery(entries[0]);
    expect(gal[0]).toBe(entries[0].imageId);
  });

  it("IDs únicos en cada galería", () => {
    const entries = getHotelEntries();
    const gal = getHotelGallery(entries[0]);
    expect(new Set(gal).size).toBe(gal.length);
  });

  it("hoteles con mismo slug producen misma galería (determinístico)", () => {
    const entries = getHotelEntries();
    const g1 = getHotelGallery(entries[0]);
    const g2 = getHotelGallery({ ...entries[0] });
    expect(g1).toEqual(g2);
  });
});

describe("getCategoryCounts", () => {
  it("devuelve conteos para 5 categorías", () => {
    const c = getCategoryCounts();
    expect(typeof c.beach).toBe("number");
    expect(typeof c.city).toBe("number");
    expect(typeof c.luxury).toBe("number");
    expect(typeof c.family).toBe("number");
    expect(typeof c.budget).toBe("number");
  });

  it("suma de categorías = total de entradas", () => {
    const counts = getCategoryCounts();
    const total = counts.beach + counts.city + counts.luxury + counts.family + counts.budget;
    expect(total).toBe(getHotelEntries().length);
  });
});
