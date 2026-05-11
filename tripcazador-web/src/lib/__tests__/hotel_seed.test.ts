/**
 * hotel_seed.test.ts — verifica la integridad del catálogo HOTEL_SEED + helpers.
 */
import { describe, it, expect } from "vitest";
import { HOTEL_SEED, getHotelSeedFallback } from "../hotel_seed";

describe("HOTEL_SEED — integridad", () => {
  it("contiene al menos 60 hoteles", () => {
    expect(HOTEL_SEED.length).toBeGreaterThanOrEqual(60);
  });

  it("todos los hoteles tienen id distintos", () => {
    const ids = HOTEL_SEED.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todos los hoteles tienen city_to no vacío", () => {
    HOTEL_SEED.forEach((h) => {
      expect(h.city_to?.length).toBeGreaterThan(0);
    });
  });

  it("todos los hoteles tienen country_to no vacío", () => {
    HOTEL_SEED.forEach((h) => {
      expect(h.country_to?.length).toBeGreaterThan(0);
    });
  });

  it("todos los hoteles tienen price_per_night > 0", () => {
    HOTEL_SEED.forEach((h) => {
      expect(h.price_per_night).toBeGreaterThan(0);
    });
  });

  it("todos los hoteles tienen price_eur > 0", () => {
    HOTEL_SEED.forEach((h) => {
      expect(h.price_eur).toBeGreaterThan(0);
    });
  });

  it("todos los hoteles son type=hotel", () => {
    HOTEL_SEED.forEach((h) => {
      expect(h.type).toBe("hotel");
    });
  });

  it("booking_url contiene aid=714734 (Booking marker)", () => {
    HOTEL_SEED.forEach((h) => {
      expect(h.booking_url).toContain("aid=714734");
    });
  });

  it("booking_url apunta a booking.com", () => {
    HOTEL_SEED.forEach((h) => {
      expect(h.booking_url).toContain("booking.com");
    });
  });

  it("booking_url contiene label=tripcazador", () => {
    HOTEL_SEED.forEach((h) => {
      expect(h.booking_url).toContain("label=tripcazador");
    });
  });

  it("todos los hoteles tienen tags con star tier", () => {
    HOTEL_SEED.forEach((h) => {
      const tag = (h.tags || []).find((t) => t.endsWith("-stars"));
      expect(tag).toBeDefined();
    });
  });

  it("todos los hoteles tienen nights = 5 (default seed)", () => {
    HOTEL_SEED.forEach((h) => {
      expect(h.nights).toBe(5);
    });
  });

  it("todos tienen image_url (Unsplash proxy o vacío)", () => {
    HOTEL_SEED.forEach((h) => {
      // El proxy /api/img o vacío
      expect(typeof h.image_url).toBe("string");
    });
  });

  it("todos los hoteles tienen date_out + date_ret", () => {
    HOTEL_SEED.forEach((h) => {
      expect(h.date_out).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(h.date_ret).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("todos los hoteles tienen savings_pct positivo", () => {
    HOTEL_SEED.forEach((h) => {
      expect(h.savings_pct).toBeGreaterThan(0);
    });
  });
});

describe("HOTEL_SEED — cobertura geográfica", () => {
  it("incluye al menos 5 regiones distintas", () => {
    const regions = new Set(HOTEL_SEED.map((h) => h.region));
    expect(regions.size).toBeGreaterThanOrEqual(5);
  });

  it("incluye hoteles en Europa", () => {
    expect(HOTEL_SEED.some((h) => h.region === "Europa")).toBe(true);
  });

  it("incluye hoteles en Asia", () => {
    expect(HOTEL_SEED.some((h) => h.region === "Asia")).toBe(true);
  });

  it("incluye hoteles en España", () => {
    expect(HOTEL_SEED.some((h) => h.country_to === "España")).toBe(true);
  });

  it("incluye hoteles en África", () => {
    expect(HOTEL_SEED.some((h) => h.region === "África")).toBe(true);
  });
});

describe("getHotelSeedFallback — filtros", () => {
  it("sin opts devuelve los 30 hoteles por defecto", () => {
    const r = getHotelSeedFallback();
    expect(r.length).toBe(30);
  });

  it("minStars=5 filtra 4★", () => {
    const r = getHotelSeedFallback({ minStars: 5, limit: 100 });
    r.forEach((h) => {
      const tag = (h.tags || []).find((t) => t.endsWith("-stars"));
      const n = parseInt(tag?.split("-")[0] ?? "0", 10);
      expect(n).toBeGreaterThanOrEqual(5);
    });
  });

  it("maxPricePerNight=100 sólo devuelve hoteles baratos", () => {
    const r = getHotelSeedFallback({ maxPricePerNight: 100, limit: 100 });
    r.forEach((h) => {
      expect(h.price_per_night ?? 999).toBeLessThanOrEqual(100);
    });
  });

  it("category=beach filtra por categoría", () => {
    const r = getHotelSeedFallback({ category: "beach", limit: 100 });
    r.forEach((h) => {
      expect((h.tags || []).includes("beach")).toBe(true);
    });
  });

  it("region=Europa filtra correctamente", () => {
    const r = getHotelSeedFallback({ region: "Europa", limit: 100 });
    r.forEach((h) => {
      expect(h.region).toBe("Europa");
    });
  });

  it("city='Marrakech' filtra por ciudad", () => {
    const r = getHotelSeedFallback({ city: "Marrakech", limit: 100 });
    expect(r.length).toBeGreaterThan(0);
    r.forEach((h) => {
      expect(h.city_to?.toLowerCase()).toBe("marrakech");
    });
  });

  it("ordena por price_per_night ASC", () => {
    const r = getHotelSeedFallback({ limit: 100 });
    for (let i = 1; i < r.length; i++) {
      expect((r[i].price_per_night ?? 0) >= (r[i - 1].price_per_night ?? 0)).toBe(true);
    }
  });

  it("limit respeta el cap", () => {
    const r = getHotelSeedFallback({ limit: 5 });
    expect(r.length).toBeLessThanOrEqual(5);
  });

  it("category inexistente devuelve []", () => {
    const r = getHotelSeedFallback({
      category: "nonexistent" as unknown as "beach",
      limit: 100,
    });
    expect(r).toEqual([]);
  });

  it("city no existente devuelve []", () => {
    const r = getHotelSeedFallback({ city: "AtlantisCity", limit: 100 });
    expect(r).toEqual([]);
  });
});
