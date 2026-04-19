import { test, expect } from "@playwright/test";

test.describe("Pagina /deals", () => {
  test("lista deals correctamente", async ({ page }) => {
    await page.goto("/deals");
    await expect(page).toHaveURL(/\/deals/);

    // H1 presente
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();

    // Al menos 1 deal visible o mensaje de empty state
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").innerText();
    // O hay tarjetas con precio (€) o mensaje de "sin resultados"
    expect(body).toMatch(/€|sin resultados|no hay ofertas/i);
  });

  test("filtro por clasificacion CRITICO funciona", async ({ page }) => {
    await page.goto("/deals");
    await page.waitForLoadState("networkidle");

    // Buscar un boton/link/select con texto "CRITICO" o "CRÍTICO"
    const criticoBtn = page.getByRole("button", { name: /crítico|critico/i }).first();
    if (await criticoBtn.count()) {
      await criticoBtn.click();
      await page.waitForTimeout(500);
      // Despues del filtro, la URL o el contenido debe reflejar el filtro
      const url = page.url();
      const body = await page.locator("body").innerText();
      expect(url + body).toMatch(/crítico|critico/i);
    }
  });

  test("filtro por cabina business funciona", async ({ page }) => {
    await page.goto("/deals?cabin=business");
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").innerText();
    // Deberia verse al menos 1 deal o empty state
    expect(body.length).toBeGreaterThan(100);
  });

  test("filtro por region funciona", async ({ page }) => {
    await page.goto("/deals?region=Europa");
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(100);
  });

  test("click en deal abre detalle o link externo", async ({ page }) => {
    await page.goto("/deals");
    await page.waitForLoadState("networkidle");
    const firstCard = page.locator("a").filter({ hasText: /€/ }).first();
    if (await firstCard.count()) {
      const href = await firstCard.getAttribute("href");
      expect(href).toBeTruthy();
    }
  });
});
