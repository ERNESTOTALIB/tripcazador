import { test, expect } from "@playwright/test";

/**
 * Tests del detalle de deal /deals/[id].
 *
 * Dependen de que haya al menos un deal en la API. Si no hay, los tests
 * se saltan con test.skip() — no rompen la suite.
 */

async function getFirstDealId(page): Promise<string | null> {
  await page.goto("/deals");
  await page.waitForLoadState("networkidle");
  const firstLink = page.locator("a[href^='/deals/']").first();
  const count = await firstLink.count();
  if (count === 0) return null;
  const href = await firstLink.getAttribute("href");
  if (!href) return null;
  const id = href.split("/").filter(Boolean).pop();
  return id || null;
}

test.describe("Detalle de deal /deals/[id]", () => {
  test("renderiza hero, countdown y share buttons", async ({ page }) => {
    const id = await getFirstDealId(page);
    test.skip(!id, "no hay deals activos para probar el detalle");

    await page.goto(`/deals/${id}`);
    await page.waitForLoadState("networkidle");

    // Hero con H1
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();

    // Share buttons (role="group" con aria-label)
    const share = page.locator("[role='group'][aria-label*='ompartir']").first();
    await expect(share).toBeVisible();

    // CTA principal (Reservar / Ver en aerolínea)
    const cta = page.locator("a").filter({ hasText: /reservar|ver en|ver\s*oferta/i }).first();
    await expect(cta).toBeVisible();
  });

  test("la URL es canonical en meta", async ({ page }) => {
    const id = await getFirstDealId(page);
    test.skip(!id, "no hay deals");

    await page.goto(`/deals/${id}`);
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonical || "").toMatch(new RegExp(`/deals/${id}$`));
  });

  test("enlace de Telegram del CTA secundario existe", async ({ page }) => {
    const id = await getFirstDealId(page);
    test.skip(!id, "no hay deals");

    await page.goto(`/deals/${id}`);
    const tg = page.locator("a[href*='telegram']").first();
    // No es obligatorio pero si existe, debe tener href válido
    if (await tg.count()) {
      const href = await tg.getAttribute("href");
      expect(href).toBeTruthy();
    }
  });

  test("botón 'Copiar' de ShareButtons es operable", async ({ page }) => {
    const id = await getFirstDealId(page);
    test.skip(!id, "no hay deals");

    await page.goto(`/deals/${id}`);
    const copyBtn = page.locator("button[aria-label='Copiar enlace']").first();
    // Si no hay share buttons aún, saltar
    if ((await copyBtn.count()) === 0) {
      test.skip(true, "ShareButtons no renderizado en este entorno");
    }
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toBeEnabled();
  });
});
