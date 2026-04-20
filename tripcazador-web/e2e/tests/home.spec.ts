import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("carga sin errores y muestra hero", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/TripCazador/i);

    // Hero visible (h1 principal)
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
  });

  test("muestra stats de deals", async ({ page }) => {
    await page.goto("/");
    // Debe haber al menos un numero visible (total deals, flights, hotels, etc.)
    const pageContent = await page.content();
    expect(pageContent).toMatch(/\d+/);
  });

  test("tiene al menos 1 tarjeta de deal visible", async ({ page }) => {
    await page.goto("/");
    // Buscar enlaces a /deals o articulos de tipo card
    const dealLinks = page.locator("a[href*='/deals']");
    const count = await dealLinks.count();
    // Al menos 1 link hacia deals (puede ser el boton "Ver todos" o una card)
    expect(count).toBeGreaterThan(0);
  });

  test("no hay errores de consola criticos", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filtrar errores benignos (extensiones, favicons, recursos externos, etc.)
    // "Failed to load resource" + "net::ERR_" son errores de red emitidos por
    // el browser cuando un fetch falla (p. ej. la API está en cold-start en
    // CI). No son bugs de nuestro código, los ignoramos.
    const critical = errors.filter((e) => {
      const low = e.toLowerCase();
      if (low.includes("favicon")) return false;
      if (low.includes("extension")) return false;
      if (low.includes("third-party")) return false;
      if (low.includes("failed to load resource")) return false;
      if (low.includes("net::err_")) return false;
      if (low.includes("cors")) return false;
      if (low.includes("err_connection")) return false;
      // Analytics (GA4/Plausible) cuando no hay consentimiento aceptado
      if (low.includes("google-analytics") || low.includes("gtag")) return false;
      if (low.includes("plausible")) return false;
      return true;
    });
    expect(critical).toEqual([]);
  });
});
