import { test, expect } from "@playwright/test";

test.describe("Pagina /hoteles", () => {
  test("carga con titulo y H1", async ({ page }) => {
    await page.goto("/hoteles");
    await expect(page).toHaveTitle(/hotel/i);

    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/hotel/i);
  });

  test("muestra hoteles o empty state con CTA Telegram", async ({ page }) => {
    await page.goto("/hoteles");
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").innerText();

    // O hay al menos un precio por noche (€ / noche) o el empty state
    const hasHotels = /€\s*\/\s*noche/i.test(body);
    const hasEmpty = /aún no tenemos|no tenemos chollos de hotel/i.test(body);
    expect(hasHotels || hasEmpty).toBe(true);

    // Si está el empty state, el CTA Telegram debe estar presente
    if (hasEmpty) {
      const telegramLink = page.locator("a[href*='telegram']").first();
      await expect(telegramLink).toBeVisible();
    }
  });

  test("navbar incluye enlace a Hoteles", async ({ page }) => {
    await page.goto("/");
    const link = page.locator("nav a[href='/hoteles']").first();
    await expect(link).toBeVisible();
    await expect(link).toHaveText(/hoteles/i);
  });

  test("enlaces a Booking.com en tarjetas tienen rel correcto", async ({ page }) => {
    await page.goto("/hoteles");
    await page.waitForLoadState("networkidle");
    const bookingLinks = page.locator("a[href*='booking.com']");
    const count = await bookingLinks.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const rel = await bookingLinks.nth(i).getAttribute("rel");
      expect(rel || "").toMatch(/nofollow/);
      expect(rel || "").toMatch(/noopener/);
    }
  });
});
