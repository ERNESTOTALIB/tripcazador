import { test, expect } from "@playwright/test";

test.describe("Pagina /blog (indice)", () => {
  test("lista articulos con H1 y titulos", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.locator("h1").first()).toBeVisible();

    // Al menos 3 articulos visibles (tenemos 7 ya: 5 originales + 2 nuevos)
    const articles = page.locator("article, a[href^='/blog/']");
    const count = await articles.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("articulo Tailandia monzón accesible y completo", async ({ page }) => {
    await page.goto("/blog/tailandia-monzon-cuando-ir-vuelos-baratos");

    // H1 con título
    const h1 = page.locator("h1").first();
    await expect(h1).toContainText(/tailandia/i);

    // Metadatos
    await expect(page).toHaveTitle(/Tailandia.*monzón/i);

    // Contenido con longitud razonable (no vacío por build roto)
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(5000); // al menos 5k caracteres
    expect(body).toMatch(/phuket|koh\s*samui/i);
  });

  test("articulo Japón otoño accesible", async ({ page }) => {
    await page.goto("/blog/japon-otono-momiji-vuelos-baratos");
    const h1 = page.locator("h1").first();
    await expect(h1).toContainText(/japón/i);
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/momiji|kioto/i);
  });

  test("articulo existente (sakura) sigue funcionando", async ({ page }) => {
    await page.goto("/blog/japon-sakura-2027-vuelos-baratos");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page).toHaveURL(/sakura/);
  });

  test("404 en slug inexistente", async ({ page }) => {
    // SSS169: Next 14 con generateStaticParams + dynamic puede devolver
    // 200 con not-found UI (route SSG con catch-all). Aceptamos ambos:
    // status 404 OR body con copy "no encontrado/not found".
    const res = await page.goto("/blog/articulo-que-no-existe-abcdef");
    const status = res?.status() ?? 0;
    const body = (await page.textContent("body")) ?? "";
    expect(
      status === 404 || /no encontrado|not found|404/i.test(body),
      `Status ${status}, body did not contain not-found copy`,
    ).toBe(true);
  });

  test("RSS feed funciona", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/rss.xml`);
    expect(res.ok()).toBe(true);
    const txt = await res.text();
    expect(txt).toContain("<rss");
    expect(txt).toContain("TripCazador");
  });
});
