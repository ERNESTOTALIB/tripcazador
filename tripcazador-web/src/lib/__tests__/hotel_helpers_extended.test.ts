/**
 * hotel_helpers_extended.test.ts — coverage profundo de helpers.
 */
import { describe, it, expect } from "vitest";
import type { Deal } from "@/lib/api";
import {
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
  AMENITIES,
  AMENITY_LABELS,
  CATEGORY_META,
} from "../hotel_helpers";

function mkHotel(overrides: Partial<Deal> & Record<string, unknown> = {}): Deal {
  return {
    id: overrides.id as string ?? "h1",
    type: "hotel",
    headline: "Test Hotel",
    origin: "",
    destination: "",
    city_from: "",
    city_to: "Barcelona",
    country_to: "España",
    region: "Europa",
    price_eur: 100,
    savings_pct: 0,
    savings_eur: 0,
    nights: 1,
    price_per_night: (overrides.price_per_night as number) ?? 100,
    date_out: "",
    date_ret: "",
    classification: "OFERTA",
    cabin: "economy",
    airline_name: "Hotel Name",
    stops: 0,
    duration_min: 0,
    score: 70,
    image_url: "",
    booking_url: "",
    verified: false,
    tags: ["city", "4-stars"],
    expires_at: "",
    found_at: "",
    ...overrides,
  } as Deal;
}

describe("ratingLabel", () => {
  it.each([
    [9.6, "Excepcional"],
    [9.5, "Excepcional"],
    [9.4, "Magnífico"],
    [9.0, "Magnífico"],
    [8.9, "Muy bueno"],
    [8.5, "Muy bueno"],
    [8.4, "Bien"],
    [8.0, "Bien"],
    [7.9, "Aceptable"],
    [7.0, "Aceptable"],
    [6.9, "Por debajo de la media"],
    [5.0, "Por debajo de la media"],
    [0, "Por debajo de la media"],
  ])("score %s → %s", (score, label) => {
    expect(ratingLabel(score)).toBe(label);
  });
});

describe("describeCategory", () => {
  it.each([
    "beach", "city", "luxury", "family", "budget", "unknown",
  ])("describe %s → no vacío", (cat) => {
    expect(describeCategory(cat).length).toBeGreaterThan(10);
  });

  it("default para categoría desconocida", () => {
    expect(describeCategory("xyz")).toBe("todo tipo de viajeros");
  });
});

describe("AMENITIES y AMENITY_LABELS", () => {
  it("AMENITIES tiene 12 items", () => {
    expect(AMENITIES.length).toBe(12);
  });

  it("cada amenity tiene label + emoji", () => {
    for (const a of AMENITIES) {
      expect(AMENITY_LABELS[a].label).toBeTruthy();
      expect(AMENITY_LABELS[a].emoji).toBeTruthy();
    }
  });

  it("CATEGORY_META cubre las 5 categorías", () => {
    expect(Object.keys(CATEGORY_META).sort()).toEqual(
      ["beach", "budget", "city", "family", "luxury"],
    );
  });

  it("cada categoría tiene label + emoji + tagline", () => {
    for (const cat of Object.values(CATEGORY_META)) {
      expect(cat.label).toBeTruthy();
      expect(cat.emoji).toBeTruthy();
      expect(cat.tagline).toBeTruthy();
    }
  });
});

describe("filterHotels", () => {
  const hotels = [
    mkHotel({ id: "1", city_to: "Barcelona", region: "Europa", price_per_night: 80, tags: ["city", "3-stars"] }),
    mkHotel({ id: "2", city_to: "Madrid", region: "Europa", price_per_night: 150, tags: ["luxury", "5-stars"] }),
    mkHotel({ id: "3", city_to: "Bali", region: "Asia", price_per_night: 60, tags: ["beach", "4-stars"] }),
    mkHotel({ id: "4", city_to: "Lisbon", region: "Europa", price_per_night: 95, tags: ["budget", "3-stars"] }),
  ];

  it("sin filtros devuelve todos", () => {
    expect(filterHotels(hotels)).toHaveLength(4);
  });

  it("filtro query case-insensitive", () => {
    expect(filterHotels(hotels, { query: "Barcelona" })).toHaveLength(1);
    expect(filterHotels(hotels, { query: "barcelona" })).toHaveLength(1);
  });

  it("filtro category 'all' no filtra", () => {
    expect(filterHotels(hotels, { category: "all" })).toHaveLength(4);
  });

  it("filtro category match en tags", () => {
    expect(filterHotels(hotels, { category: "luxury" })).toHaveLength(1);
    expect(filterHotels(hotels, { category: "beach" })).toHaveLength(1);
  });

  it("filtro región", () => {
    expect(filterHotels(hotels, { region: "Asia" })).toHaveLength(1);
    expect(filterHotels(hotels, { region: "Europa" })).toHaveLength(3);
    expect(filterHotels(hotels, { region: "Todas" })).toHaveLength(4);
  });

  it("filtro minStars", () => {
    expect(filterHotels(hotels, { minStars: 4 })).toHaveLength(2);
    expect(filterHotels(hotels, { minStars: 5 })).toHaveLength(1);
  });

  it("filtro maxPricePerNight", () => {
    expect(filterHotels(hotels, { maxPricePerNight: 100 })).toHaveLength(3);
    expect(filterHotels(hotels, { maxPricePerNight: 70 })).toHaveLength(1);
  });

  it("filtro maxPricePerNight=0 no filtra", () => {
    expect(filterHotels(hotels, { maxPricePerNight: 0 })).toHaveLength(4);
  });

  it("filtro combinado region + maxPrice", () => {
    expect(
      filterHotels(hotels, { region: "Europa", maxPricePerNight: 100 }),
    ).toHaveLength(2);
  });

  it("filtro minRating", () => {
    const h = mkHotel({ id: "x", review_score: 9.0 } as Record<string, unknown>);
    const out = filterHotels([h], { minRating: 8.5 });
    expect(out).toHaveLength(1);
  });

  it("filtro minRating excluye", () => {
    const h = mkHotel({ id: "x", review_score: 7 } as Record<string, unknown>);
    const out = filterHotels([h], { minRating: 8.5 });
    expect(out).toHaveLength(0);
  });

  it("filtro amenities AND lógico", () => {
    const h1 = mkHotel({ id: "x", hotel_amenities: ["wifi", "pool"] } as Record<string, unknown>);
    const h2 = mkHotel({ id: "y", hotel_amenities: ["wifi"] } as Record<string, unknown>);
    const out = filterHotels([h1, h2], { amenities: ["wifi", "pool"] });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("x");
  });

  it("filtro amenities vacío no filtra", () => {
    expect(filterHotels(hotels, { amenities: [] })).toHaveLength(4);
  });

  it("query no match → 0", () => {
    expect(filterHotels(hotels, { query: "NotExistingCity" })).toHaveLength(0);
  });

  it("no muta input", () => {
    const before = [...hotels];
    filterHotels(hotels, { region: "Asia" });
    expect(hotels).toEqual(before);
  });
});

describe("sortHotels", () => {
  const hotels = [
    mkHotel({ id: "1", price_per_night: 150, score: 80 }),
    mkHotel({ id: "2", price_per_night: 80, score: 90 }),
    mkHotel({ id: "3", price_per_night: 120, score: 70 }),
  ];

  it("price_asc ordena ascendente", () => {
    const out = sortHotels(hotels, "price_asc");
    expect(out.map((h) => h.id)).toEqual(["2", "3", "1"]);
  });

  it("price_desc ordena descendente", () => {
    const out = sortHotels(hotels, "price_desc");
    expect(out.map((h) => h.id)).toEqual(["1", "3", "2"]);
  });

  it("rating_desc ordena por review_score desc", () => {
    const h = [
      mkHotel({ id: "a", review_score: 7 } as Record<string, unknown>),
      mkHotel({ id: "b", review_score: 9 } as Record<string, unknown>),
    ];
    expect(sortHotels(h, "rating_desc")[0].id).toBe("b");
  });

  it("stars_desc ordena por estrellas", () => {
    const h = [
      mkHotel({ id: "a", tags: ["3-stars"] }),
      mkHotel({ id: "b", tags: ["5-stars"] }),
    ];
    expect(sortHotels(h, "stars_desc")[0].id).toBe("b");
  });

  it("recommended default", () => {
    const out = sortHotels(hotels);
    expect(out).toHaveLength(3);
  });

  it("no muta input", () => {
    const before = [...hotels];
    sortHotels(hotels, "price_asc");
    expect(hotels).toEqual(before);
  });
});

describe("countByCategory", () => {
  it("cuenta tags", () => {
    const h = [
      mkHotel({ id: "1", tags: ["beach"] }),
      mkHotel({ id: "2", tags: ["beach"] }),
      mkHotel({ id: "3", tags: ["luxury"] }),
    ];
    const c = countByCategory(h);
    expect(c.all).toBe(3);
    expect(c.beach).toBe(2);
    expect(c.luxury).toBe(1);
  });

  it("lista vacía → all=0", () => {
    expect(countByCategory([]).all).toBe(0);
  });
});

describe("countByRegion", () => {
  it("agrupa por region", () => {
    const h = [
      mkHotel({ id: "1", region: "Europa" }),
      mkHotel({ id: "2", region: "Europa" }),
      mkHotel({ id: "3", region: "Asia" }),
    ];
    const c = countByRegion(h);
    expect(c.Europa).toBe(2);
    expect(c.Asia).toBe(1);
  });
});

describe("medianPricePerNight", () => {
  it("mediana impar", () => {
    const h = [
      mkHotel({ id: "1", price_per_night: 50 }),
      mkHotel({ id: "2", price_per_night: 100 }),
      mkHotel({ id: "3", price_per_night: 150 }),
    ];
    expect(medianPricePerNight(h)).toBe(100);
  });

  it("mediana par redondeada", () => {
    const h = [
      mkHotel({ id: "1", price_per_night: 100 }),
      mkHotel({ id: "2", price_per_night: 200 }),
    ];
    expect(medianPricePerNight(h)).toBe(150);
  });

  it("ignora precios <= 0", () => {
    const h = [
      mkHotel({ id: "1", price_per_night: 100 }),
      mkHotel({ id: "2", price_per_night: 0 }),
    ];
    expect(medianPricePerNight(h)).toBe(100);
  });

  it("lista vacía → 0", () => {
    expect(medianPricePerNight([])).toBe(0);
  });
});

describe("buildBookingUrl", () => {
  it("genera URL Booking.com con marker", () => {
    const u = buildBookingUrl({
      hotelName: "Hotel Arts",
      city: "Barcelona",
    });
    expect(u).toContain("booking.com/searchresults.html");
    expect(u).toContain("aid=714734");
    expect(u).toContain("label=tripcazador");
  });

  it("incluye check-in / check-out válidos", () => {
    const u = buildBookingUrl({
      hotelName: "X",
      city: "Y",
      checkIn: "2026-08-15",
      checkOut: "2026-08-20",
    });
    expect(u).toContain("checkin=2026-08-15");
    expect(u).toContain("checkout=2026-08-20");
  });

  it("omite checkin si formato inválido", () => {
    const u = buildBookingUrl({
      hotelName: "X",
      city: "Y",
      checkIn: "08/15/2026",
    });
    expect(u).not.toContain("checkin=");
  });

  it("adults default = 2", () => {
    const u = buildBookingUrl({ hotelName: "X", city: "Y" });
    expect(u).toContain("group_adults=2");
  });

  it("adults custom", () => {
    const u = buildBookingUrl({ hotelName: "X", city: "Y", adults: 4 });
    expect(u).toContain("group_adults=4");
  });

  it("adults < 1 fuerza a 1", () => {
    const u = buildBookingUrl({ hotelName: "X", city: "Y", adults: 0 });
    expect(u).toContain("group_adults=1");
  });

  it("rooms custom", () => {
    const u = buildBookingUrl({ hotelName: "X", city: "Y", rooms: 3 });
    expect(u).toContain("no_rooms=3");
  });

  it("children > 0 incluido", () => {
    const u = buildBookingUrl({ hotelName: "X", city: "Y", children: 2 });
    expect(u).toContain("group_children=2");
  });

  it("children = 0 omitido", () => {
    const u = buildBookingUrl({ hotelName: "X", city: "Y", children: 0 });
    expect(u).not.toContain("group_children");
  });

  it("marker custom", () => {
    const u = buildBookingUrl({
      hotelName: "X",
      city: "Y",
      marker: "custom123",
    });
    expect(u).toContain("aid=custom123");
  });
});

describe("suggestCities", () => {
  const hotels = [
    mkHotel({ id: "1", city_to: "Barcelona" }),
    mkHotel({ id: "2", city_to: "Barcelona" }),
    mkHotel({ id: "3", city_to: "Madrid" }),
  ];

  it("query vacío → []", () => {
    expect(suggestCities(hotels, "")).toEqual([]);
    expect(suggestCities(hotels, "   ")).toEqual([]);
  });

  it("substring case-insensitive", () => {
    expect(suggestCities(hotels, "bar")).toEqual(["Barcelona"]);
    expect(suggestCities(hotels, "MAD")).toEqual(["Madrid"]);
  });

  it("ordena por frecuencia desc", () => {
    const r = suggestCities(hotels, "a");
    expect(r[0]).toBe("Barcelona");
  });

  it("respeta limit", () => {
    const r = suggestCities(hotels, "a", 1);
    expect(r.length).toBeLessThanOrEqual(1);
  });

  it("no match → []", () => {
    expect(suggestCities(hotels, "tokyo")).toEqual([]);
  });
});

describe("estimateTotalPrice", () => {
  it("sin descuento (< threshold)", () => {
    const r = estimateTotalPrice({ pricePerNight: 100, nights: 3 });
    expect(r.subtotal).toBe(300);
    expect(r.discount).toBe(0);
    expect(r.total).toBe(300);
  });

  it("con descuento (>= 7 noches default)", () => {
    const r = estimateTotalPrice({ pricePerNight: 100, nights: 7 });
    expect(r.subtotal).toBe(700);
    expect(r.discount).toBe(56); // 700 * 0.08
    expect(r.total).toBe(644);
  });

  it("custom threshold + pct", () => {
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
  it("válido devuelve nights", () => {
    const r = validateDateRange("2026-08-15", "2026-08-20");
    expect(r.valid).toBe(true);
    expect(r.nights).toBe(5);
  });

  it("invalid sin fechas", () => {
    expect(validateDateRange("", "")).toEqual({
      valid: false,
      error: "Fechas obligatorias",
    });
  });

  it("invalid formato malo", () => {
    expect(validateDateRange("08/15/2026", "08/20/2026").valid).toBe(false);
  });

  it("checkout antes de checkin", () => {
    expect(validateDateRange("2026-08-20", "2026-08-15").valid).toBe(false);
  });

  it("mismo día (0 nights) inválido", () => {
    expect(validateDateRange("2026-08-15", "2026-08-15").valid).toBe(false);
  });

  it("más de 90 noches", () => {
    const r = validateDateRange("2026-01-01", "2026-12-31");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/90 noches/);
  });
});

describe("slugify", () => {
  it.each([
    ["Hello World", "hello-world"],
    ["Café con Leche", "cafe-con-leche"],
    ["Buenos Aires!", "buenos-aires"],
    ["  spaces  trim  ", "spaces-trim"],
    ["multiple  spaces", "multiple-spaces"],
    ["UPPERCASE", "uppercase"],
    ["dashes--double", "dashes-double"],
    ["123 numbers", "123-numbers"],
  ])("slugify %s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});

describe("generateReviews — determinismo", () => {
  it("mismo hotel produce mismas reviews (determinístico)", () => {
    const h = { category: "beach", reviewScore: 9, id: "abc" } as const;
    const r1 = generateReviews(h, 3);
    const r2 = generateReviews(h, 3);
    expect(r1.map((r) => r.title)).toEqual(r2.map((r) => r.title));
  });

  it("respeta count", () => {
    const r = generateReviews({ category: "city", reviewScore: 8.5, id: "x" }, 5);
    expect(r).toHaveLength(5);
  });

  it("default count = 3", () => {
    const r = generateReviews({ category: "city", reviewScore: 8.5, id: "x" });
    expect(r).toHaveLength(3);
  });

  it("rating clamp 7-10", () => {
    const r = generateReviews({ category: "luxury", reviewScore: 9.5, id: "x" }, 3);
    for (const rev of r) {
      expect(rev.rating).toBeGreaterThanOrEqual(7);
      expect(rev.rating).toBeLessThanOrEqual(10);
    }
  });

  it("author tiene initials de 2 letras", () => {
    const r = generateReviews({ category: "beach", reviewScore: 9, id: "x" }, 3);
    for (const rev of r) {
      expect(rev.initials).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("date en formato ISO YYYY-MM-DD", () => {
    const r = generateReviews({ category: "beach", reviewScore: 9, id: "x" }, 3);
    for (const rev of r) {
      expect(rev.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("category desconocida → fallback city", () => {
    // @ts-expect-error testing fallback
    const r = generateReviews({ category: "xyz", reviewScore: 8, id: "x" }, 2);
    expect(r).toHaveLength(2);
  });
});

describe("hotelValueScore", () => {
  it("hotel barato con buen rating tiene score alto", () => {
    const h = mkHotel({
      price_per_night: 60,
      review_score: 9.2,
      tags: ["5-stars"],
    } as Record<string, unknown>);
    expect(hotelValueScore(h, 200)).toBeGreaterThan(60);
  });

  it("hotel sin precio → 0", () => {
    const h = mkHotel({ price_per_night: 0 });
    expect(hotelValueScore(h, 100)).toBe(0);
  });

  it("clamp en 100 max", () => {
    const h = mkHotel({
      price_per_night: 1,
      review_score: 10,
      tags: ["5-stars"],
    } as Record<string, unknown>);
    expect(hotelValueScore(h, 1000)).toBeLessThanOrEqual(100);
  });

  it("peer median = 0 → neutral price comp", () => {
    const h = mkHotel({
      price_per_night: 100,
      review_score: 9,
      tags: ["4-stars"],
    } as Record<string, unknown>);
    const v = hotelValueScore(h, 0);
    expect(v).toBeGreaterThan(0);
  });
});

describe("groupByStarTier", () => {
  it("agrupa por 5/4/3/other", () => {
    const hotels = [
      mkHotel({ id: "5a", tags: ["5-stars"] }),
      mkHotel({ id: "4a", tags: ["4-stars"] }),
      mkHotel({ id: "4b", tags: ["4-stars"] }),
      mkHotel({ id: "3a", tags: ["3-stars"] }),
      mkHotel({ id: "o", tags: [] }),
    ];
    const g = groupByStarTier(hotels);
    expect(g.five).toHaveLength(1);
    expect(g.four).toHaveLength(2);
    expect(g.three).toHaveLength(1);
    expect(g.other).toHaveLength(1);
  });

  it("lista vacía → grupos vacíos", () => {
    const g = groupByStarTier([]);
    expect(g.five).toEqual([]);
    expect(g.four).toEqual([]);
    expect(g.three).toEqual([]);
    expect(g.other).toEqual([]);
  });
});

describe("cityHotelDeals", () => {
  it("filtra por ciudad y limita", () => {
    const hotels = [
      mkHotel({ id: "1", city_to: "Barcelona", price_per_night: 80, review_score: 9 } as Record<string, unknown>),
      mkHotel({ id: "2", city_to: "Barcelona", price_per_night: 90, review_score: 8 } as Record<string, unknown>),
      mkHotel({ id: "3", city_to: "Madrid", price_per_night: 100 } as Record<string, unknown>),
    ];
    const out = cityHotelDeals(hotels, "Barcelona", 5);
    expect(out).toHaveLength(2);
    expect(out.every((h) => h.city_to === "Barcelona")).toBe(true);
  });

  it("ciudad no existe → []", () => {
    expect(cityHotelDeals([], "Atlantis")).toEqual([]);
  });

  it("limit", () => {
    const hotels = Array.from({ length: 10 }, (_, i) =>
      mkHotel({ id: String(i), city_to: "Barcelona", price_per_night: 50 + i } as Record<string, unknown>),
    );
    expect(cityHotelDeals(hotels, "Barcelona", 3)).toHaveLength(3);
  });
});
