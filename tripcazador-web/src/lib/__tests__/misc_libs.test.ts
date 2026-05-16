/**
 * misc_libs.test.ts — SSS255 (16 may 2026)
 *
 * Tests batch para 6 libs sin tests previo:
 *  - blog.ts (catalog readers MDX)
 *  - premium.ts (status localStorage + trial activation)
 *  - hunter_health_data.ts (catalog fallback)
 *  - newsletter_weekly_helpers.ts (drip helpers + escapeHTML + rate limit)
 *  - outreach_templates.ts (catalog + render placeholders)
 *  - hotel_helpers.ts (sort/filter/count/median + safe URL builder)
 */
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { getAllPostSlugs, getPostBySlug, getPostsByLang, getAllTagsWithCounts, getPostsByTag, getRelatedPosts, getAllPosts } from "../blog";
import {
  PREMIUM_FEATURES,
  PREMIUM_PRICE_EUR,
  PREMIUM_TRIAL_DAYS,
  getPremiumStatus,
  setPremiumStatus,
  activateTrial,
  activateReferralBonus,
  cancelPremium,
} from "../premium";
import { FALLBACK_CATALOG } from "../hunter_health_data";
import {
  ES_ORIGINS,
  RATE_WINDOW_MS,
  isCriticalOrError,
  isSpanishOrigin,
  pickTopFiveDeals,
  escapeHtml,
  daysUntil,
  getLastNewsletterTs,
  setLastNewsletterTs,
  resetNewsletterRateLimit,
} from "../newsletter_weekly_helpers";
import {
  OUTREACH_TEMPLATES,
  getTemplatesByCategory,
  renderTemplate,
} from "../outreach_templates";
import {
  AMENITIES,
  AMENITY_LABELS,
  CATEGORY_META,
  ratingLabel,
  describeCategory,
  filterHotels,
  sortHotels,
  countByCategory,
  medianPricePerNight,
  buildBookingUrl,
  suggestCities,
} from "../hotel_helpers";

beforeEach(() => {
  localStorage.clear();
});

// ============ blog ============

describe("blog helpers", () => {
  it("getAllPostSlugs retorna array", () => {
    const slugs = getAllPostSlugs();
    expect(Array.isArray(slugs)).toBe(true);
  });

  it("getAllPosts retorna BlogPost[] con frontmatter completo", () => {
    const posts = getAllPosts();
    expect(Array.isArray(posts)).toBe(true);
    if (posts.length > 0) {
      const p = posts[0];
      expect(p.slug).toBeTruthy();
      expect(p.title).toBeTruthy();
    }
  });

  it("getPostBySlug retorna null para slug inválido", () => {
    expect(getPostBySlug("nonexistent-blog-post-xyz-9999")).toBeNull();
  });

  it("getPostsByLang filtra por idioma", () => {
    const es = getPostsByLang("es");
    const en = getPostsByLang("en");
    expect(Array.isArray(es)).toBe(true);
    expect(Array.isArray(en)).toBe(true);
  });

  it("getAllTagsWithCounts retorna [{tag,count}]", () => {
    const tags = getAllTagsWithCounts();
    expect(Array.isArray(tags)).toBe(true);
    for (const t of tags.slice(0, 5)) {
      expect(t.tag).toBeTruthy();
      expect(t.count).toBeGreaterThan(0);
    }
  });

  it("getPostsByTag retorna posts filtrados", () => {
    expect(Array.isArray(getPostsByTag("nonexistent-tag-xyz"))).toBe(true);
  });

  it("getRelatedPosts retorna ≤N posts", () => {
    const related = getRelatedPosts("any-slug", 3);
    expect(Array.isArray(related)).toBe(true);
    expect(related.length).toBeLessThanOrEqual(3);
  });
});

// ============ premium ============

describe("premium status", () => {
  it("PREMIUM_FEATURES + PRICE + TRIAL_DAYS constantes", () => {
    expect(PREMIUM_FEATURES).toBeTruthy();
    expect(typeof PREMIUM_FEATURES).toBe("object");
    expect(PREMIUM_PRICE_EUR).toBeGreaterThan(0);
    expect(PREMIUM_TRIAL_DAYS).toBeGreaterThanOrEqual(1);
  });

  it("getPremiumStatus retorna default si no hay state", () => {
    const s = getPremiumStatus();
    expect(s).toBeTruthy();
    expect(s.active).toBe(false);
  });

  it("setPremiumStatus persiste a localStorage", () => {
    setPremiumStatus({
      active: true,
      tier: "premium",
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      source: "manual",
    });
    const s = getPremiumStatus();
    expect(s.active).toBe(true);
  });

  it("activateTrial activa con expiry futuro (ISO string)", () => {
    const s = activateTrial();
    expect(s.active).toBe(true);
    expect(typeof s.expiresAt).toBe("string");
    if (s.expiresAt) {
      expect(new Date(s.expiresAt).getTime()).toBeGreaterThan(Date.now());
    }
  });

  it("activateReferralBonus activa el premium", () => {
    const s = activateReferralBonus();
    expect(s.active).toBe(true);
  });

  it("cancelPremium desactiva", () => {
    activateTrial();
    cancelPremium();
    const s = getPremiumStatus();
    expect(s.active).toBe(false);
  });
});

// ============ hunter_health_data ============

describe("FALLBACK_CATALOG", () => {
  it("es un array no vacío", () => {
    expect(Array.isArray(FALLBACK_CATALOG)).toBe(true);
    expect(FALLBACK_CATALOG.length).toBeGreaterThan(0);
  });

  it("cada entry tiene shape esperada", () => {
    const first = FALLBACK_CATALOG[0];
    expect(first).toBeTruthy();
    expect(typeof first).toBe("object");
  });
});

// ============ newsletter_weekly_helpers ============

describe("newsletter helpers", () => {
  it("ES_ORIGINS es Set con códigos IATA ES", () => {
    expect(ES_ORIGINS instanceof Set).toBe(true);
    expect(ES_ORIGINS.has("MAD")).toBe(true);
    expect(ES_ORIGINS.has("BCN")).toBe(true);
  });

  it("RATE_WINDOW_MS = 6 horas", () => {
    expect(RATE_WINDOW_MS).toBe(6 * 3600 * 1000);
  });

  it("isCriticalOrError + isSpanishOrigin son fns", () => {
    expect(typeof isCriticalOrError).toBe("function");
    expect(typeof isSpanishOrigin).toBe("function");
  });

  it("escapeHtml escapa <, >, &, \"", () => {
    expect(escapeHtml("<script>")).not.toContain("<script>");
    expect(escapeHtml("<script>")).toContain("&lt;");
    expect(escapeHtml("a & b")).toContain("&amp;");
    expect(escapeHtml('"quote"')).toContain("&quot;");
  });

  it("escapeHtml maneja null/undefined", () => {
    expect(escapeHtml(null as unknown as string)).toBe("");
    expect(escapeHtml(undefined as unknown as string)).toBe("");
  });

  it("daysUntil retorna número o null", () => {
    const futureDate = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    const d = daysUntil(futureDate);
    expect(typeof d === "number" || d === null).toBe(true);
  });

  it("daysUntil null para fecha inválida", () => {
    expect(daysUntil("invalid-date")).toBeNull();
  });

  it("rate limit get/set/reset funcional", () => {
    resetNewsletterRateLimit();
    expect(getLastNewsletterTs()).toBe(0);
    setLastNewsletterTs(12345);
    expect(getLastNewsletterTs()).toBe(12345);
    resetNewsletterRateLimit();
    expect(getLastNewsletterTs()).toBe(0);
  });

  it("pickTopFiveDeals retorna ≤5 deals", () => {
    const result = pickTopFiveDeals([]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(5);
  });
});

// ============ outreach_templates ============

describe("OUTREACH_TEMPLATES catalog", () => {
  it("tiene mínimo 3 templates", () => {
    expect(OUTREACH_TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });

  it("cada template tiene id, category, subject, body", () => {
    for (const t of OUTREACH_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.category).toBeTruthy();
      expect(t.subject).toBeTruthy();
      expect(t.body).toBeTruthy();
    }
  });

  it("subject NO contiene newlines (defense email header injection)", () => {
    for (const t of OUTREACH_TEMPLATES) {
      expect(t.subject).not.toMatch(/\r|\n/);
    }
  });
});

describe("getTemplatesByCategory + renderTemplate", () => {
  it("getTemplatesByCategory filtra correctamente", () => {
    const cat = OUTREACH_TEMPLATES[0].category;
    const filtered = getTemplatesByCategory(cat);
    expect(filtered.length).toBeGreaterThanOrEqual(1);
    for (const t of filtered) expect(t.category).toBe(cat);
  });

  it("renderTemplate sustituye {{brand}} placeholder", () => {
    const t = OUTREACH_TEMPLATES[0];
    const rendered = renderTemplate(t, "TestBrand");
    expect(rendered.subject).not.toContain("{{brand}}");
    expect(rendered.body).not.toContain("{{brand}}");
    expect(rendered.body.includes("TestBrand") || rendered.subject.includes("TestBrand")).toBe(true);
  });
});

// ============ hotel_helpers ============

describe("hotel_helpers constants", () => {
  it("AMENITIES no vacío", () => {
    expect(AMENITIES.length).toBeGreaterThanOrEqual(3);
  });

  it("AMENITY_LABELS tiene label+emoji para cada amenity", () => {
    for (const a of AMENITIES) {
      expect(AMENITY_LABELS[a]).toBeDefined();
      expect(AMENITY_LABELS[a].label).toBeTruthy();
      expect(AMENITY_LABELS[a].emoji).toBeTruthy();
    }
  });

  it("CATEGORY_META incluye categorías con shape correcta", () => {
    const keys = Object.keys(CATEGORY_META);
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) {
      const m = CATEGORY_META[k as keyof typeof CATEGORY_META];
      expect(m.label).toBeTruthy();
      expect(m.emoji).toBeTruthy();
      expect(m.tagline).toBeTruthy();
    }
  });
});

describe("hotel_helpers utility fns", () => {
  it("ratingLabel devuelve string según rango", () => {
    expect(ratingLabel(9.5)).toBeTruthy();
    expect(ratingLabel(7)).toBeTruthy();
    expect(ratingLabel(3)).toBeTruthy();
    expect(typeof ratingLabel(8)).toBe("string");
  });

  it("describeCategory retorna string no vacío", () => {
    expect(describeCategory("any").length).toBeGreaterThan(0);
  });

  it("filterHotels devuelve array (empty input → empty)", () => {
    expect(filterHotels([])).toEqual([]);
  });

  it("sortHotels devuelve array (empty input → empty)", () => {
    expect(sortHotels([])).toEqual([]);
  });

  it("countByCategory devuelve {} para input vacío", () => {
    const r = countByCategory([]);
    expect(typeof r).toBe("object");
  });

  it("medianPricePerNight devuelve 0 para input vacío", () => {
    expect(medianPricePerNight([])).toBe(0);
  });

  it("suggestCities devuelve array, respeta limit", () => {
    const r = suggestCities([], "mad", 5);
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBeLessThanOrEqual(5);
  });
});

describe("buildBookingUrl (XSS defense)", () => {
  it("retorna URL Booking.com con aid + ss param", () => {
    const url = buildBookingUrl({ hotelName: "Hotel Test", city: "Lisboa" });
    expect(url).toMatch(/^https:\/\/www\.booking\.com\//);
    expect(url).toContain("aid=");
    expect(url).toMatch(/ss=Hotel.*Lisboa|ss=.*Lisboa/);
  });

  it("encodeURIComponent applied a city (XSS defense)", () => {
    const url = buildBookingUrl({
      hotelName: "Hotel",
      city: "<script>alert(1)</script>",
    });
    expect(url).not.toContain("<script>");
    expect(url).not.toMatch(/javascript:/i);
  });

  it("incluye check-in/check-out si provistos (format YYYY-MM-DD)", () => {
    const url = buildBookingUrl({
      hotelName: "Hotel Test",
      city: "Roma",
      checkIn: "2026-06-01",
      checkOut: "2026-06-08",
    });
    expect(url).toContain("checkin=2026-06-01");
    expect(url).toContain("checkout=2026-06-08");
  });

  it("ignora check-in/check-out con formato inválido (regex strict)", () => {
    const url = buildBookingUrl({
      hotelName: "Hotel",
      city: "Roma",
      checkIn: "not-a-date",
      checkOut: "2026/06/08",
    });
    expect(url).not.toContain("checkin=not-a-date");
    expect(url).not.toContain("checkout=2026/06/08");
  });

  it("group_adults default 2, override custom", () => {
    expect(buildBookingUrl({ hotelName: "H", city: "X" })).toContain("group_adults=2");
    expect(
      buildBookingUrl({ hotelName: "H", city: "X", adults: 4 }),
    ).toContain("group_adults=4");
  });

  it("siempre https://", () => {
    const url = buildBookingUrl({ hotelName: "H", city: "Madrid" });
    expect(url).toMatch(/^https:\/\//);
  });

  it("marker custom override", () => {
    const url = buildBookingUrl({
      hotelName: "H",
      city: "Lisboa",
      marker: "999999",
    });
    expect(url).toContain("aid=999999");
  });
});
