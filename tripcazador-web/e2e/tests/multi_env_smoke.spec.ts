/**
 * multi_env_smoke.spec.ts — fase XX3
 *
 * Tests de smoke ejecutables contra cualquier entorno: local / staging / prod.
 *
 * En modo PROD (process.env.E2E_ENV === "prod"):
 *   - Solo lectura. Cero side-effects.
 *   - No POSTs a /api/track, /api/subscribe, /api/price-alerts.
 *   - Solo verificamos páginas + APIs GET + headers.
 *
 * En modo STAGING o LOCAL:
 *   - Puede mutar (POSTs OK).
 *   - Puede verificar tracker dual-write end-to-end.
 *
 * Setear E2E_ENV en GH Actions:
 *   - staging: E2E_ENV=staging BASE_URL=https://tripcazador-staging.vercel.app
 *   - prod: E2E_ENV=prod BASE_URL=https://tripcazador.com
 */
import { test, expect } from "@playwright/test";

const ENV = process.env.E2E_ENV || "local";
const IS_PROD = ENV === "prod";
const BASE = process.env.BASE_URL || "http://localhost:3000";

test.describe(`Smoke @ ${ENV} (${BASE})`, () => {
  test("home carga 200 y muestra hero", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/TripCazador/i);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("/deals carga", async ({ page }) => {
    const res = await page.goto("/deals");
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("/destinos carga", async ({ page }) => {
    const res = await page.goto("/destinos");
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("/hoteles carga", async ({ page }) => {
    const res = await page.goto("/hoteles");
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("/blog carga", async ({ page }) => {
    const res = await page.goto("/blog");
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("/premium carga", async ({ page }) => {
    const res = await page.goto("/premium");
    expect(res?.status() ?? 0).toBeLessThan(500);
    if (res?.status() === 200) {
      await expect(page.locator("h1").first()).toBeVisible();
    }
  });

  test("/refer carga", async ({ page }) => {
    const res = await page.goto("/refer");
    expect(res?.status() ?? 0).toBeLessThan(500);
  });

  test("/calculadora carga", async ({ page }) => {
    const res = await page.goto("/calculadora");
    expect(res?.status() ?? 0).toBeLessThan(500);
  });

  test("/buscar carga", async ({ page }) => {
    const res = await page.goto("/buscar");
    expect(res?.status() ?? 0).toBeLessThan(500);
  });

  test("/en home carga", async ({ page }) => {
    const res = await page.goto("/en");
    expect(res?.status() ?? 0).toBeLessThan(500);
  });

  test("/sitemap.xml válido", async ({ request }) => {
    const r = await request.get("/sitemap.xml");
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toMatch(/<urlset|<sitemapindex/);
    expect(body.length).toBeGreaterThan(500);
  });

  test("/robots.txt incluye sitemap", async ({ request }) => {
    const r = await request.get("/robots.txt");
    expect(r.status()).toBe(200);
    const body = await r.text();
    expect(body).toMatch(/Sitemap/i);
  });

  test("/api/deals retorna JSON array no vacío", async ({ request }) => {
    const r = await request.get("/api/deals?limit=5");
    expect(r.status()).toBe(200);
    const body = await r.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test("404 página inexistente devuelve 404", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist-xx-test");
    expect(res?.status()).toBe(404);
  });

  test("HSTS header en https (solo prod/staging)", async ({ request }) => {
    if (BASE.startsWith("https://")) {
      const r = await request.get("/");
      const headers = r.headers();
      expect.soft(headers["strict-transport-security"]).toBeDefined();
    }
  });
});

test.describe(`Mutaciones @ ${ENV}`, () => {
  test.skip(IS_PROD, "skipping mutations in prod env");

  test("POST /api/track no-PII permitido", async ({ request }) => {
    const r = await request.post("/api/track", {
      data: { type: "smoke_test", path: "/test", ts: Date.now() },
    });
    expect([200, 202, 204]).toContain(r.status());
  });

  test("POST /api/push/subscribe valida shape", async ({ request }) => {
    const r = await request.post("/api/push/subscribe", { data: {} });
    expect([400, 422]).toContain(r.status());
  });
});
