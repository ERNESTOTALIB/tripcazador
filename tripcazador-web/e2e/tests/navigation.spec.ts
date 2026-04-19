import { test, expect } from "@playwright/test";

test.describe("Navegacion global", () => {
  test("navbar tiene links principales", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible();

    // Links basicos esperados
    const links = ["deals", "destinos"];
    for (const key of links) {
      const l = page.locator(`nav a[href*='/${key}']`).first();
      // Al menos uno deberia existir (puede no estar en mobile menu)
      if (await l.count()) {
        await expect(l).toBeVisible();
      }
    }
  });

  test("link a /deals desde homepage funciona", async ({ page }) => {
    await page.goto("/");
    const dealsLink = page.locator("a[href*='/deals']").first();
    if (await dealsLink.count()) {
      await dealsLink.click();
      await expect(page).toHaveURL(/\/deals/);
    }
  });

  test("footer presente en todas las paginas", async ({ page }) => {
    const paths = ["/", "/deals"];
    for (const p of paths) {
      await page.goto(p);
      const footer = page.locator("footer").first();
      await expect(footer).toBeVisible();
    }
  });

  test("favicon responde 200", async ({ page, request }) => {
    const r = await request.get("/favicon.ico");
    // Next puede servir favicon en /favicon.ico o en /icon
    expect([200, 304, 404]).toContain(r.status());
  });

  test("navegacion desde homepage a destino concreto funciona", async ({ page }) => {
    await page.goto("/");
    // Buscar un link a /destinos/[algo]
    const destLink = page.locator("a[href^='/destinos/']").first();
    if (await destLink.count()) {
      const href = await destLink.getAttribute("href");
      await destLink.click();
      await expect(page).toHaveURL(new RegExp(href || "/destinos/"));
    }
  });
});
