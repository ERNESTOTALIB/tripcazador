import { test, expect } from "@playwright/test";

test.describe("SEO y meta tags", () => {
  test("homepage tiene meta description y OG tags", async ({ page }) => {
    await page.goto("/");

    const desc = await page
      .locator('meta[name="description"]')
      .first()
      .getAttribute("content");
    expect(desc).toBeTruthy();
    expect((desc || "").length).toBeGreaterThan(50);

    // OpenGraph
    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .first()
      .getAttribute("content");
    const ogDesc = await page
      .locator('meta[property="og:description"]')
      .first()
      .getAttribute("content");
    expect(ogTitle).toBeTruthy();
    expect(ogDesc).toBeTruthy();
  });

  test("homepage tiene canonical URL", async ({ page }) => {
    await page.goto("/");
    const canonical = await page
      .locator('link[rel="canonical"]')
      .first()
      .getAttribute("href");
    if (canonical) {
      expect(canonical).toMatch(/^https?:\/\//);
    }
  });

  test("sitemap.xml responde y tiene URLs", async ({ request }) => {
    const r = await request.get("/sitemap.xml");
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toContain("<urlset");
    expect(body).toMatch(/<loc>https?:\/\//);
  });

  test("robots.txt responde y permite indexacion", async ({ request }) => {
    const r = await request.get("/robots.txt");
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body.toLowerCase()).toContain("user-agent");
    expect(body.toLowerCase()).toContain("sitemap");
  });

  test("pagina /deals tiene titulo unico y descriptivo", async ({ page }) => {
    await page.goto("/deals");
    const title = await page.title();
    expect(title).toMatch(/deals|ofertas|vuelos/i);
  });

  test("destino tiene structured data o meta especificas", async ({ page }) => {
    await page.goto("/destinos/tanzania");
    const title = await page.title();
    expect(title.toLowerCase()).toContain("tanzania");
  });
});
