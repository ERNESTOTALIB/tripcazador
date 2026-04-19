import { test, expect } from "@playwright/test";

test.describe("Paginas /destinos/[slug]", () => {
  test("Tanzania carga con tips y estructura correcta", async ({ page }) => {
    const response = await page.goto("/destinos/tanzania");
    expect(response?.status()).toBeLessThan(400);

    // H1 con "Tanzania"
    const h1 = page.locator("h1").first();
    await expect(h1).toContainText(/tanzania/i);

    // Debe haber contenido sustancial
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(500);
  });

  test("Japon carga correctamente", async ({ page }) => {
    const response = await page.goto("/destinos/japon");
    expect(response?.status()).toBeLessThan(400);
    const h1 = page.locator("h1").first();
    await expect(h1).toContainText(/jap[oó]n/i);
  });

  test("destino inexistente devuelve 404 o not-found", async ({ page }) => {
    const response = await page.goto("/destinos/zzz-no-existe-xxx", {
      waitUntil: "domcontentloaded",
    });
    // Next.js puede devolver 404 real o renderizar una pagina "not found"
    const status = response?.status();
    const body = await page.locator("body").innerText();
    expect(
      status === 404 || /no encontrado|not found|404/i.test(body),
    ).toBeTruthy();
  });
});
