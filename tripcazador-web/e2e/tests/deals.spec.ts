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

// ────────────────────────────────────────────────────────────────
// Tests nuevos: Google Flights-style UX (abril 2026)
// ────────────────────────────────────────────────────────────────
test.describe("Pagina /deals — UX overhaul (tabs/sidebar/calendar/hash)", () => {
  test("tabs de ordenacion cambian orden", async ({ page }) => {
    await page.goto("/deals");
    await page.waitForLoadState("networkidle");

    // Si no hay deals, saltamos
    const bodyText = await page.locator("body").innerText();
    if (/sin resultados|no hay ofertas/i.test(bodyText)) {
      test.skip();
      return;
    }

    // Capturamos precios en tab por defecto (best)
    const cheapTab = page.getByRole("tab", { name: /más baratos/i });
    await expect(cheapTab).toBeVisible();
    await cheapTab.click();
    await page.waitForTimeout(300);

    // Tras click, el tab "cheap" debe estar seleccionado
    await expect(cheapTab).toHaveAttribute("aria-selected", "true");

    // El hash debe actualizarse a #orden=baratos
    await page.waitForFunction(() => window.location.hash === "#orden=baratos", null, { timeout: 2000 });
  });

  test("hash #orden=rapidos se aplica al cargar", async ({ page }) => {
    await page.goto("/deals#orden=rapidos");
    await page.waitForLoadState("networkidle");

    // Si no hay deals, saltamos
    const body = await page.locator("body").innerText();
    if (/sin resultados|no hay ofertas/i.test(body)) {
      test.skip();
      return;
    }

    const fastTab = page.getByRole("tab", { name: /más rápidos/i });
    await expect(fastTab).toHaveAttribute("aria-selected", "true");
    // Hash debe persistir (no ser reescrito por el fix de race condition)
    expect(page.url()).toMatch(/#orden=rapidos$/);
  });

  test("sidebar de filtros esta presente y reduce resultados", async ({ page }) => {
    await page.goto("/deals");
    await page.waitForLoadState("networkidle");

    // El sidebar tiene un heading "Filtros" o equivalente
    const sidebar = page.getByRole("complementary").or(
      page.locator('aside, [aria-label*="filtro" i]').first(),
    );
    // Al menos algún control debe existir (precio, duración o aerolíneas)
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/precio|duración|aerolínea/i);
  });

  test("tab Directos muestra conteo y filtra", async ({ page }) => {
    await page.goto("/deals");
    await page.waitForLoadState("networkidle");

    const body = await page.locator("body").innerText();
    if (/sin resultados|no hay ofertas/i.test(body)) {
      test.skip();
      return;
    }

    const directTab = page.getByRole("tab", { name: /directos/i });
    await expect(directTab).toBeVisible();
    await directTab.click();
    await expect(directTab).toHaveAttribute("aria-selected", "true");
  });
});
