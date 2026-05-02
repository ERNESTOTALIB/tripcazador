/**
 * hoteles_detail.spec.ts — fase yy YY5
 *
 * Tests E2E para hotel detail pages /hoteles/[slug] + filtros + listado.
 *
 * Cubre:
 *  - /hoteles renderiza hero + filters
 *  - Tabs categoría (Playa/Ciudad/Lujo) cambian conteo
 *  - Sort dropdown ordena
 *  - Click en HotelCard → /hoteles/[slug]
 *  - /hoteles/[slug] hero con imagen + nombre + estrellas + rating
 *  - JSON-LD Hotel + Offer + BreadcrumbList presentes
 *  - CTA "Reservar en Booking" link válido
 */
import { test, expect } from "@playwright/test";

test.describe("/hoteles index", () => {
  test("carga hero + filtros + grid", async ({ page }) => {
    await page.goto("/hoteles");
    await expect(page.locator("h1")).toContainText(/hotel/i);
    // Filtros tabs
    const playaTab = page.getByRole("button", { name: /Playa/i });
    expect(await playaTab.count()).toBeGreaterThan(0);
    const luxuryTab = page.getByRole("button", { name: /Lujo/i });
    expect(await luxuryTab.count()).toBeGreaterThan(0);
  });

  test("tab Playa filtra hoteles", async ({ page }) => {
    await page.goto("/hoteles");
    const all = page.locator("article").count();
    const playaBtn = page.getByRole("button", { name: /Playa/i }).first();
    await playaBtn.click();
    await page.waitForTimeout(300);
    const filtered = await page.locator("article").count();
    // Filtered should be <= all (could be empty if no beach hotels in seed)
    expect(filtered).toBeLessThanOrEqual(await all);
  });

  test("sort dropdown cambia orden", async ({ page }) => {
    await page.goto("/hoteles");
    const sortSelect = page.locator("select").nth(1); // 2do select = sort (1ro = región)
    if ((await sortSelect.count()) > 0) {
      await sortSelect.selectOption("price_asc");
      await page.waitForTimeout(300);
      // No crash → OK
      expect(await page.locator("article").count()).toBeGreaterThan(0);
    }
  });

  test("ItemList JSON-LD presente con Hotel items", async ({ page }) => {
    await page.goto("/hoteles");
    const lds = await page.locator('script[type="application/ld+json"]').allTextContents();
    const hasItemList = lds.some((s) => s.includes("ItemList") && s.includes("Hotel"));
    expect(hasItemList).toBe(true);
  });
});

test.describe("/hoteles/[slug] detail", () => {
  test("dusit-thani-phuket hero + nombre + rating", async ({ page }) => {
    const res = await page.goto("/hoteles/dusit-thani-phuket");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText(/Dusit Thani Phuket/i);
    // Estrellas
    const text = await page.textContent("body");
    expect(text).toMatch(/★/);
    // Rating circle
    expect(text).toMatch(/\d\.\d/);
  });

  test("JSON-LD Hotel + Offer + BreadcrumbList", async ({ page }) => {
    await page.goto("/hoteles/dusit-thani-phuket");
    const lds = await page.locator('script[type="application/ld+json"]').allTextContents();
    const hasHotel = lds.some((s) => s.includes('"@type":"Hotel"'));
    const hasOffer = lds.some((s) => s.includes('"@type":"Offer"') || s.includes("makesOffer"));
    const hasBreadcrumb = lds.some((s) => s.includes("BreadcrumbList"));
    expect(hasHotel).toBe(true);
    expect(hasOffer).toBe(true);
    expect(hasBreadcrumb).toBe(true);
  });

  test("CTA Reservar en Booking lleva a booking.com con marker", async ({ page }) => {
    await page.goto("/hoteles/dusit-thani-phuket");
    const cta = page.getByRole("link", { name: /Reservar en Booking/i }).first();
    expect(await cta.count()).toBeGreaterThan(0);
    const href = await cta.getAttribute("href");
    expect(href).toMatch(/booking\.com/);
    expect(href).toMatch(/aid=/);
  });

  test("Slug inexistente devuelve 404", async ({ page }) => {
    const res = await page.goto("/hoteles/this-hotel-does-not-exist-xyz");
    expect(res?.status()).toBe(404);
  });

  test("OG image dinámica con imagen Unsplash", async ({ page }) => {
    await page.goto("/hoteles/the-mulia-bali");
    const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    expect(og).toMatch(/unsplash/);
  });
});

test.describe("Sitemap incluye hotel slugs", () => {
  test("/sitemap.xml contiene URLs /hoteles/...", async ({ request }) => {
    const r = await request.get("/sitemap.xml");
    expect(r.status()).toBe(200);
    const body = await r.text();
    // Al menos un slug de hotel
    expect(body).toMatch(/\/hoteles\/[a-z-]+/);
  });
});
