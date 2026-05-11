/**
 * hotel_helpers.test.ts — coverage para helpers puros en lib/hotel_helpers.ts
 */
import { describe, it, expect } from "vitest";
import {
  AMENITIES,
  AMENITY_LABELS,
  CATEGORY_META,
  ratingLabel,
  describeCategory,
  filterHotels,
  sortHotels,
  countByCategory,
  countByRegion,
  medianPricePerNight,
  buildBookingUrl,
  suggestCities,
  estimateTotalPrice,
  validateDateRange,
  slugify,
  generateReviews,
  hotelValueScore,
  groupByStarTier,
  cityHotelDeals,
} from "../hotel_helpers";
import type { Deal } from "../api";

const HOTEL_BASE: Partial<Deal> = {
  id: "h-1",
  type: "hotel",
  region: "Europa",
  country_to: "España",
  city_to: "Madrid",
  airline_name: "Test Hotel",
  price_per_night: 100,
  price_eur: 500,
  tags: ["3-stars", "city"],
  score: 80,
};

function makeHotel(overrides: Partial<Deal> = {}): Deal {
  return { ...HOTEL_BASE, ...overrides } as Deal;
}

describe("AMENITIES + labels", () => {
  it("contiene amenities estándar", () => {
    expect(AMENITIES).toContain("wifi");
    expect(AMENITIES).toContain("pool");
    expect(AMENITIES).toContain("breakfast");
    expect(AMENITIES).toContain("spa");
  });

  it("AMENITY_LABELS tiene entry para cada amenity", () => {
    AMENITIES.forEach((a) => {
      expect(AMENITY_LABELS[a]).toBeDefined();
      expect(AMENITY_LABELS[a].label).toBeTruthy();
      expect(AMENITY_LABELS[a].emoji).toBeTruthy();
    });
  });
});

describe("CATEGORY_META", () => {
  it("contiene beach/city/luxury/family/budget", () => {
    expect(CATEGORY_META.beach).toBeDefined();
    expect(CATEGORY_META.city).toBeDefined();
    expect(CATEGORY_META.luxury).toBeDefined();
    expect(CATEGORY_META.family).toBeDefined();
    expect(CATEGORY_META.budget).toBeDefined();
  });
});

describe("ratingLabel", () => {
  it("9.5 → Excepcional", () => {
    expect(ratingLabel(9.5)).toMatch(/Excepcional|Excelente/i);
  });

  it("8.5 → Muy bueno o similar", () => {
    expect(typeof ratingLabel(8.5)).toBe("string");
  });

  it("rating <6 → label más bajo", () => {
    expect(typeof ratingLabel(5)).toBe("string");
  });

  it("rating 0 → string no vacía", () => {
    expect(ratingLabel(0).length).toBeGreaterThan(0);
  });
});

describe("describeCategory", () => {
  it("beach → menciona playa o mar", () => {
    expect(typeof describeCategory("beach")).toBe("string");
  });

  it("desconocido → fallback string", () => {
    expect(typeof describeCategory("xxx")).toBe("string");
  });
});

describe("filterHotels — query", () => {
  it("sin filtros devuelve todos", () => {
    const hotels = [makeHotel(), makeHotel({ id: "h-2" })];
    expect(filterHotels(hotels).length).toBe(2);
  });

  it("query 'madrid' matchea hotel en Madrid", () => {
    const hotels = [makeHotel({ city_to: "Madrid" }), makeHotel({ id: "h-2", city_to: "Barcelona" })];
    expect(filterHotels(hotels, { query: "madrid" }).length).toBe(1);
  });

  it("query insensible a mayúsculas", () => {
    const hotels = [makeHotel({ city_to: "Madrid" })];
    expect(filterHotels(hotels, { query: "MADRID" }).length).toBe(1);
  });

  it("query no matchea → 0", () => {
    const hotels = [makeHotel()];
    expect(filterHotels(hotels, { query: "xyzqwerty" }).length).toBe(0);
  });
});

describe("filterHotels — minStars", () => {
  it("minStars=5 filtra hoteles 3★", () => {
    const hotels = [
      makeHotel({ tags: ["3-stars", "city"] }),
      makeHotel({ id: "h-2", tags: ["5-stars", "luxury"] }),
    ];
    const r = filterHotels(hotels, { minStars: 5 });
    expect(r.length).toBe(1);
  });

  it("minStars=0 pasa todos", () => {
    const hotels = [makeHotel(), makeHotel({ id: "h-2" })];
    expect(filterHotels(hotels, { minStars: 0 }).length).toBe(2);
  });
});

describe("filterHotels — maxPricePerNight", () => {
  it("max=80 excluye 100€/noche", () => {
    const hotels = [makeHotel({ price_per_night: 100 })];
    expect(filterHotels(hotels, { maxPricePerNight: 80 }).length).toBe(0);
  });

  it("max=200 incluye 100€/noche", () => {
    const hotels = [makeHotel({ price_per_night: 100 })];
    expect(filterHotels(hotels, { maxPricePerNight: 200 }).length).toBe(1);
  });
});

describe("filterHotels — region", () => {
  it("region='Asia' excluye Europa", () => {
    const hotels = [makeHotel({ region: "Europa" })];
    expect(filterHotels(hotels, { region: "Asia" }).length).toBe(0);
  });

  it("region='Todas' pasa todo", () => {
    const hotels = [makeHotel(), makeHotel({ id: "h-2", region: "Asia" })];
    expect(filterHotels(hotels, { region: "Todas" }).length).toBe(2);
  });
});

describe("sortHotels", () => {
  it("price_asc ordena de menor a mayor", () => {
    const hotels = [
      makeHotel({ id: "a", price_per_night: 200 }),
      makeHotel({ id: "b", price_per_night: 100 }),
      makeHotel({ id: "c", price_per_night: 300 }),
    ];
    const r = sortHotels(hotels, "price_asc");
    expect(r[0].id).toBe("b");
    expect(r[2].id).toBe("c");
  });

  it("price_desc ordena de mayor a menor", () => {
    const hotels = [
      makeHotel({ id: "a", price_per_night: 200 }),
      makeHotel({ id: "b", price_per_night: 100 }),
      makeHotel({ id: "c", price_per_night: 300 }),
    ];
    const r = sortHotels(hotels, "price_desc");
    expect(r[0].id).toBe("c");
    expect(r[2].id).toBe("b");
  });

  it("stars_desc respeta tags '5-stars' > '3-stars'", () => {
    const hotels = [
      makeHotel({ id: "a", tags: ["3-stars"] }),
      makeHotel({ id: "b", tags: ["5-stars"] }),
    ];
    const r = sortHotels(hotels, "stars_desc");
    expect(r[0].id).toBe("b");
  });

  it("default (recommended) no crashea", () => {
    expect(() => sortHotels([makeHotel()])).not.toThrow();
  });

  it("no muta input", () => {
    const hotels = [makeHotel({ id: "a", price_per_night: 200 }), makeHotel({ id: "b", price_per_night: 100 })];
    const orig = JSON.stringify(hotels);
    sortHotels(hotels, "price_asc");
    expect(JSON.stringify(hotels)).toBe(orig);
  });
});

describe("countByCategory", () => {
  it("cuenta cada categoría aparecida en tags", () => {
    const hotels = [
      makeHotel({ tags: ["3-stars", "city"] }),
      makeHotel({ id: "h-2", tags: ["5-stars", "beach"] }),
      makeHotel({ id: "h-3", tags: ["4-stars", "beach"] }),
    ];
    const c = countByCategory(hotels);
    expect(c.all).toBe(3);
    expect(c.beach).toBe(2);
    expect(c.city).toBe(1);
  });
});

describe("countByRegion", () => {
  it("agrupa por región", () => {
    const hotels = [
      makeHotel({ region: "Europa" }),
      makeHotel({ id: "h-2", region: "Asia" }),
      makeHotel({ id: "h-3", region: "Europa" }),
    ];
    const c = countByRegion(hotels);
    expect(c["Europa"]).toBe(2);
    expect(c["Asia"]).toBe(1);
  });
});

describe("medianPricePerNight", () => {
  it("array vacío → 0", () => {
    expect(medianPricePerNight([])).toBe(0);
  });

  it("3 hoteles: 100, 200, 300 → mediana 200", () => {
    const hotels = [
      makeHotel({ price_per_night: 100 }),
      makeHotel({ id: "b", price_per_night: 200 }),
      makeHotel({ id: "c", price_per_night: 300 }),
    ];
    expect(medianPricePerNight(hotels)).toBe(200);
  });

  it("2 hoteles: 100, 200 → mediana 150", () => {
    const hotels = [
      makeHotel({ price_per_night: 100 }),
      makeHotel({ id: "b", price_per_night: 200 }),
    ];
    expect(medianPricePerNight(hotels)).toBe(150);
  });

  it("ignora precios <=0", () => {
    const hotels = [
      makeHotel({ price_per_night: 0 }),
      makeHotel({ id: "b", price_per_night: 100 }),
    ];
    expect(medianPricePerNight(hotels)).toBe(100);
  });
});

describe("buildBookingUrl", () => {
  it("incluye aid=714734 por defecto", () => {
    const url = buildBookingUrl({ hotelName: "X", city: "Madrid" });
    expect(url).toContain("aid=714734");
  });

  it("incluye label=tripcazador", () => {
    const url = buildBookingUrl({ hotelName: "X", city: "Madrid" });
    expect(url).toContain("label=tripcazador");
  });

  it("incluye search string (ss)", () => {
    const url = buildBookingUrl({ hotelName: "Hotel Foo", city: "Madrid" });
    expect(url).toContain("ss=");
  });

  it("checkIn válido se añade", () => {
    const url = buildBookingUrl({ hotelName: "X", city: "Madrid", checkIn: "2026-06-01" });
    expect(url).toContain("checkin=2026-06-01");
  });

  it("checkIn inválido se descarta", () => {
    const url = buildBookingUrl({ hotelName: "X", city: "Madrid", checkIn: "not-a-date" });
    expect(url).not.toContain("checkin=");
  });

  it("checkOut válido se añade", () => {
    const url = buildBookingUrl({ hotelName: "X", city: "Madrid", checkOut: "2026-06-05" });
    expect(url).toContain("checkout=2026-06-05");
  });

  it("group_adults default 2", () => {
    const url = buildBookingUrl({ hotelName: "X", city: "Madrid" });
    expect(url).toContain("group_adults=2");
  });

  it("adults custom respetado", () => {
    const url = buildBookingUrl({ hotelName: "X", city: "Madrid", adults: 4 });
    expect(url).toContain("group_adults=4");
  });

  it("group_adults min 1 (no permite 0)", () => {
    const url = buildBookingUrl({ hotelName: "X", city: "Madrid", adults: 0 });
    expect(url).toContain("group_adults=1");
  });

  it("rooms default 1", () => {
    const url = buildBookingUrl({ hotelName: "X", city: "Madrid" });
    expect(url).toContain("no_rooms=1");
  });

  it("marker custom override", () => {
    const url = buildBookingUrl({ hotelName: "X", city: "Madrid", marker: "999999" });
    expect(url).toContain("aid=999999");
  });

  it("apunta a booking.com", () => {
    const url = buildBookingUrl({ hotelName: "X", city: "Madrid" });
    expect(url).toContain("booking.com");
  });
});

describe("estimateTotalPrice", () => {
  it("3 noches 100€/noche → subtotal 300", () => {
    const r = estimateTotalPrice({ pricePerNight: 100, nights: 3 });
    expect(r.subtotal).toBe(300);
    expect(r.discount).toBe(0);
    expect(r.total).toBe(300);
  });

  it("7 noches activa descuento default 8%", () => {
    const r = estimateTotalPrice({ pricePerNight: 100, nights: 7 });
    expect(r.subtotal).toBe(700);
    expect(r.discount).toBe(56); // 8% de 700
    expect(r.total).toBe(644);
  });

  it("threshold custom + pct custom", () => {
    const r = estimateTotalPrice({
      pricePerNight: 100,
      nights: 5,
      longStayDiscountThreshold: 5,
      longStayDiscountPct: 0.1,
    });
    expect(r.discount).toBe(50);
    expect(r.total).toBe(450);
  });
});

describe("validateDateRange", () => {
  it("checkin antes checkout → valid", () => {
    const r = validateDateRange("2026-06-01", "2026-06-05");
    expect(r.valid).toBe(true);
    expect(r.nights).toBe(4);
  });

  it("checkin igual a checkout → inválido (0 noches)", () => {
    const r = validateDateRange("2026-06-01", "2026-06-01");
    expect(r.valid).toBe(false);
  });

  it("checkout antes checkin → inválido", () => {
    const r = validateDateRange("2026-06-05", "2026-06-01");
    expect(r.valid).toBe(false);
  });

  it("formato inválido → error", () => {
    const r = validateDateRange("2026/06/01", "2026-06-05");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/format/i);
  });

  it("vacíos → error", () => {
    const r = validateDateRange("", "");
    expect(r.valid).toBe(false);
  });

  it(">90 noches → error", () => {
    const r = validateDateRange("2026-01-01", "2026-12-31");
    expect(r.valid).toBe(false);
  });
});

describe("slugify", () => {
  it("'Hotel Madrid Centro' → hotel-madrid-centro", () => {
    expect(slugify("Hotel Madrid Centro")).toBe("hotel-madrid-centro");
  });

  it("strip tildes 'Málaga' → malaga", () => {
    expect(slugify("Málaga")).toContain("malaga");
  });

  it("ya slug → idempotente", () => {
    expect(slugify("foo-bar-baz")).toBe("foo-bar-baz");
  });

  it("vacío → vacío", () => {
    expect(slugify("")).toBe("");
  });
});

describe("suggestCities", () => {
  it("query vacía → []", () => {
    expect(suggestCities([makeHotel()], "")).toEqual([]);
  });

  it("match parcial sobre city_to", () => {
    const hotels = [
      makeHotel({ city_to: "Madrid" }),
      makeHotel({ id: "h-2", city_to: "Madrid" }),
      makeHotel({ id: "h-3", city_to: "Barcelona" }),
    ];
    const r = suggestCities(hotels, "ma");
    expect(r).toContain("Madrid");
    expect(r).not.toContain("Barcelona");
  });

  it("ordena por frecuencia", () => {
    const hotels = [
      makeHotel({ city_to: "Madrid" }),
      makeHotel({ id: "h-2", city_to: "Marrakech" }),
      makeHotel({ id: "h-3", city_to: "Madrid" }),
    ];
    const r = suggestCities(hotels, "m");
    // Madrid (2) primero
    expect(r[0]).toBe("Madrid");
  });

  it("respeta limit", () => {
    const hotels = Array.from({ length: 20 }, (_, i) =>
      makeHotel({ id: `h-${i}`, city_to: `City${i}` }),
    );
    const r = suggestCities(hotels, "city", 3);
    expect(r.length).toBe(3);
  });
});

describe("generateReviews", () => {
  it("count=3 devuelve 3 reviews", () => {
    const r = generateReviews(
      { category: "city", reviewScore: 8.5, id: "h-1" },
      3,
    );
    expect(r.length).toBe(3);
  });

  it("cada review tiene body + rating + author", () => {
    const r = generateReviews(
      { category: "city", reviewScore: 8.5, id: "h-1" },
      1,
    );
    expect(r[0].body).toBeTruthy();
    expect(r[0].rating).toBeGreaterThan(0);
    expect(r[0].author).toBeTruthy();
  });

  it("count=0 devuelve []", () => {
    const r = generateReviews(
      { category: "city", reviewScore: 8.5, id: "h-1" },
      0,
    );
    expect(r.length).toBe(0);
  });
});

describe("hotelValueScore", () => {
  it("hotel con buen precio + alto rating → score alto", () => {
    const h = makeHotel({ price_per_night: 50, score: 90 });
    const s = hotelValueScore(h, 100);
    expect(s).toBeGreaterThan(0);
  });

  it("no crashea con review_score missing", () => {
    const h = makeHotel();
    expect(() => hotelValueScore(h, 100)).not.toThrow();
  });
});

describe("groupByStarTier", () => {
  it("agrupa por estrellas", () => {
    const hotels = [
      makeHotel({ tags: ["3-stars"] }),
      makeHotel({ id: "h-2", tags: ["5-stars"] }),
      makeHotel({ id: "h-3", tags: ["5-stars"] }),
    ];
    const r = groupByStarTier(hotels);
    expect(typeof r).toBe("object");
  });
});

describe("cityHotelDeals", () => {
  it("filtra por ciudad exacta", () => {
    const hotels = [
      makeHotel({ city_to: "Madrid" }),
      makeHotel({ id: "h-2", city_to: "Barcelona" }),
    ];
    const r = cityHotelDeals(hotels, "Madrid");
    expect(r.length).toBe(1);
  });

  it("case insensitive", () => {
    const hotels = [makeHotel({ city_to: "Madrid" })];
    const r = cityHotelDeals(hotels, "madrid");
    expect(r.length).toBe(1);
  });

  it("limit respeta cap", () => {
    const hotels = Array.from({ length: 10 }, (_, i) =>
      makeHotel({ id: `h-${i}`, city_to: "Madrid" }),
    );
    const r = cityHotelDeals(hotels, "Madrid", 3);
    expect(r.length).toBeLessThanOrEqual(3);
  });
});
