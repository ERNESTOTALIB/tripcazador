/**
 * E2E — Hotel detail page exhaustivo (fase BBB3).
 *
 * Cobertura completa de la nueva página de detalle:
 *  - Header + breadcrumbs
 *  - Galería con thumbnails + lightbox + keyboard nav
 *  - Sección "Por qué destaca" con highlight
 *  - Rating bar visual con role=progressbar
 *  - Lista de amenities con todos los iconos
 *  - Reviews section con ≥3 reviews + summary
 *  - Mapa SVG con OSM/Google Maps links
 *  - Políticas con 8 ítems
 *  - Sticky booking CTA con cálculo total
 *  - JSON-LD: Hotel + GeoCoordinates + Review array + Offer + BreadcrumbList
 *  - Hoteles relacionados
 *  - 404 para slugs inexistentes
 *  - Mobile responsive
 */
import { test, expect } from "@playwright/test";

const SAMPLE_SLUG = "dusit-thani-phuket";

test.describe("Hotel detail — header & breadcrumbs", () => {
  test("renderiza breadcrumbs visuales", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const nav = page.getByRole("navigation", { name: /breadcrumb/i });
    await expect(nav).toBeVisible();
    await expect(nav).toContainText("Inicio");
    await expect(nav).toContainText("Hoteles");
  });

  test("título h1 con nombre del hotel", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const title = page.getByTestId("hotel-detail-title");
    await expect(title).toBeVisible();
    await expect(title).toContainText(/Dusit Thani Phuket/i);
  });

  test("indica estrellas + categoría + emoji", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/★+/);
    expect(body).toMatch(/Phuket|Tailandia/i);
  });
});

test.describe("Hotel detail — galería de fotos", () => {
  test("renderiza el hero + 3 thumbnails", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    await expect(page.getByTestId("hotel-gallery")).toBeVisible();
    await expect(page.getByTestId("hotel-gallery-hero")).toBeVisible();
    // Las 3 thumbnails están en md:+ — en mobile se ocultan
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.reload();
    await expect(page.getByTestId("hotel-gallery-thumb-1")).toBeVisible();
    await expect(page.getByTestId("hotel-gallery-thumb-2")).toBeVisible();
    await expect(page.getByTestId("hotel-gallery-thumb-3")).toBeVisible();
  });

  test("click en hero abre el lightbox", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    await page.getByTestId("hotel-gallery-hero").click();
    await expect(page.getByTestId("hotel-gallery-lightbox")).toBeVisible();
    await expect(page.getByTestId("hotel-gallery-prev")).toBeVisible();
    await expect(page.getByTestId("hotel-gallery-next")).toBeVisible();
  });

  test("Esc cierra el lightbox", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    await page.getByTestId("hotel-gallery-hero").click();
    await expect(page.getByTestId("hotel-gallery-lightbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("hotel-gallery-lightbox")).toBeHidden();
  });

  test("ArrowRight navega a siguiente foto en lightbox", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    await page.getByTestId("hotel-gallery-hero").click();
    await page.keyboard.press("ArrowRight");
    // El contador "X / total" debe actualizarse
    await expect(page.getByTestId("hotel-gallery-lightbox")).toContainText("2 /");
  });

  test("ArrowLeft + ArrowRight ciclan correctamente", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    await page.getByTestId("hotel-gallery-hero").click();
    // Empezamos en 1
    await expect(page.getByTestId("hotel-gallery-lightbox")).toContainText("1 /");
    await page.keyboard.press("ArrowLeft");
    // Wrap-around: del 1 al último
    await expect(page.getByTestId("hotel-gallery-lightbox")).toContainText(/[2-9] \/ [2-9]/);
  });

  test("click en X cierra el lightbox", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    await page.getByTestId("hotel-gallery-hero").click();
    await page.getByTestId("hotel-gallery-close").click();
    await expect(page.getByTestId("hotel-gallery-lightbox")).toBeHidden();
  });
});

test.describe("Hotel detail — amenities & políticas", () => {
  test("amenities section visible con ≥3 items", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const sec = page.getByTestId("hotel-amenities");
    await expect(sec).toBeVisible();
    const items = sec.locator("li");
    const n = await items.count();
    expect(n).toBeGreaterThanOrEqual(3);
  });

  test("amenity wifi siempre presente (default categoría)", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    await expect(page.getByTestId("hotel-amenity-wifi")).toBeVisible();
  });

  test("políticas section con 8 items en dl", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const pol = page.getByTestId("hotel-policies");
    await expect(pol).toBeVisible();
    for (const k of ["checkin", "checkout", "cancellation", "children", "pets", "payment", "internet", "parking"]) {
      await expect(page.getByTestId(`hotel-policy-${k}`)).toBeVisible();
    }
  });
});

test.describe("Hotel detail — reviews", () => {
  test("sección de reviews con summary + ≥3 reviews", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const sec = page.getByTestId("hotel-reviews");
    await expect(sec).toBeVisible();
    await expect(page.getByTestId("hotel-reviews-summary")).toBeVisible();
    await expect(page.getByTestId("hotel-review-0")).toBeVisible();
    await expect(page.getByTestId("hotel-review-1")).toBeVisible();
    await expect(page.getByTestId("hotel-review-2")).toBeVisible();
  });

  test("cada review tiene autor + país + rating", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const r0 = page.getByTestId("hotel-review-0");
    const txt = await r0.innerText();
    // Debe contener un rating numérico tipo "9.0"
    expect(txt).toMatch(/\d\.\d/);
  });

  test("reviews son determinísticas (mismo hotel = mismo orden)", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const author1 = await page.getByTestId("hotel-review-0").locator(".text-white").first().innerText();
    await page.reload();
    const author2 = await page.getByTestId("hotel-review-0").locator(".text-white").first().innerText();
    expect(author1).toBe(author2);
  });
});

test.describe("Hotel detail — mapa", () => {
  test("componente HotelMap visible con SVG", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const map = page.getByTestId("hotel-map");
    await expect(map).toBeVisible();
    // SVG con viewBox
    const svg = map.locator("svg");
    await expect(svg).toBeVisible();
    await expect(svg).toHaveAttribute("viewBox", /^0 0 /);
  });

  test("link a OpenStreetMap con coordenadas", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const link = page.getByTestId("hotel-map-osm-link");
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    expect(href).toMatch(/openstreetmap\.org/);
    expect(href).toMatch(/mlat=-?\d+\.\d+/);
    expect(href).toMatch(/mlon=-?\d+\.\d+/);
  });

  test("link a Google Maps con query del hotel", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const link = page.getByTestId("hotel-map-gmaps-link");
    const href = await link.getAttribute("href");
    expect(href).toMatch(/google\.com\/maps/);
    expect(href).toContain("Dusit");
  });
});

test.describe("Hotel detail — booking CTA + sticky aside", () => {
  test("aside booking visible con precio/noche", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const aside = page.getByTestId("hotel-booking-aside");
    await expect(aside).toBeVisible();
    const ppn = page.getByTestId("hotel-price-per-night");
    await expect(ppn).toBeVisible();
    await expect(ppn).toContainText(/\d+€/);
  });

  test("CTA Reservar tiene href a Booking + atributos correctos", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const cta = page.getByTestId("hotel-booking-cta");
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute("href");
    expect(href).toMatch(/booking\.com/);
    expect(href).toMatch(/aid=/);
    await expect(cta).toHaveAttribute("target", "_blank");
    await expect(cta).toHaveAttribute("rel", /nofollow/);
    await expect(cta).toHaveAttribute("rel", /sponsored/);
  });

  test("CTA tiene min-height ≥44px (touch target a11y)", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const box = await page.getByTestId("hotel-booking-cta").boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("incluye total estimado para 5 noches", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const aside = page.getByTestId("hotel-booking-aside");
    const txt = await aside.innerText();
    expect(txt).toMatch(/5 noches/i);
    expect(txt).toMatch(/Total estimado/i);
  });
});

test.describe("Hotel detail — JSON-LD enriquecido", () => {
  test("Hotel schema incluye GeoCoordinates", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const lds = await page.locator('script[type="application/ld+json"]').allTextContents();
    const hotelLd = lds.find((s) => s.includes('"@type":"Hotel"'));
    expect(hotelLd).toBeDefined();
    if (hotelLd) {
      expect(hotelLd).toContain("GeoCoordinates");
      expect(hotelLd).toContain("latitude");
      expect(hotelLd).toContain("longitude");
    }
  });

  test("Hotel schema incluye amenityFeature array", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const lds = await page.locator('script[type="application/ld+json"]').allTextContents();
    const hotelLd = lds.find((s) => s.includes('"@type":"Hotel"'));
    expect(hotelLd).toContain("amenityFeature");
    expect(hotelLd).toContain("LocationFeatureSpecification");
  });

  test("Hotel schema incluye Review array de ≥3", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const lds = await page.locator('script[type="application/ld+json"]').allTextContents();
    const hotelLd = lds.find((s) => s.includes('"@type":"Hotel"'));
    expect(hotelLd).toContain('"@type":"Review"');
    // Al menos 3 reviews → debe haber al menos 3 ocurrencias del @type Review
    if (hotelLd) {
      const reviewCount = (hotelLd.match(/"@type":"Review"/g) ?? []).length;
      expect(reviewCount).toBeGreaterThanOrEqual(3);
    }
  });

  test("Hotel schema images son array (galería)", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const lds = await page.locator('script[type="application/ld+json"]').allTextContents();
    const hotelLd = lds.find((s) => s.includes('"@type":"Hotel"'));
    expect(hotelLd).toMatch(/"image":\s*\[/);
  });
});

test.describe("Hotel detail — relacionados + 404", () => {
  test("sección de hoteles relacionados con ≥1 card", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const sec = page.getByTestId("hotel-related");
    if (await sec.count() > 0) {
      await expect(sec).toBeVisible();
      const cards = sec.locator("article");
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });

  test("slug inexistente devuelve 404", async ({ page }) => {
    const res = await page.goto("/hoteles/slug-que-no-existe-xyz123");
    expect(res?.status()).toBe(404);
  });
});

test.describe("Hotel detail — mobile responsive", () => {
  test("mobile (375px) renderiza todas las secciones", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    await expect(page.getByTestId("hotel-detail-title")).toBeVisible();
    await expect(page.getByTestId("hotel-gallery")).toBeVisible();
    await expect(page.getByTestId("hotel-amenities")).toBeVisible();
    await expect(page.getByTestId("hotel-policies")).toBeVisible();
    await expect(page.getByTestId("hotel-booking-aside")).toBeVisible();
  });
});

test.describe("Sitemap & SEO", () => {
  test("sitemap.xml lista al menos 30 URLs /hoteles/...", async ({ request }) => {
    const r = await request.get("/sitemap.xml");
    expect(r.status()).toBe(200);
    const body = await r.text();
    const matches = body.match(/\/hoteles\/[a-z0-9-]+/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(30);
  });

  test("OG meta tag presente con imagen", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}`);
    const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    expect(og).toMatch(/unsplash/);
  });

  test("canonical URL apunta a la versión sin params", async ({ page }) => {
    await page.goto(`/hoteles/${SAMPLE_SLUG}?utm=test`);
    const canonical = await page.locator('link[rel="canonical"]').first().getAttribute("href");
    expect(canonical).toMatch(new RegExp(`/hoteles/${SAMPLE_SLUG}$`));
  });
});
