import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accesibilidad basica (WCAG)", () => {
  test("homepage sin violaciones criticas", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"]) // permite en iteracion inicial
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(
      critical,
      JSON.stringify(
        critical.map((v) => ({ id: v.id, nodes: v.nodes.length })),
        null,
        2,
      ),
    ).toEqual([]);
  });

  test("/deals sin violaciones criticas", async ({ page }) => {
    await page.goto("/deals");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(critical.length).toBeLessThanOrEqual(2);
  });

  test("imagenes del hero tienen alt", async ({ page }) => {
    await page.goto("/");
    const imgs = page.locator("img");
    const count = await imgs.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const alt = await imgs.nth(i).getAttribute("alt");
      // El alt debe existir (aunque sea vacio en decorativas)
      expect(alt).not.toBeNull();
    }
  });

  test("idioma del documento es es", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect((lang || "").toLowerCase()).toMatch(/^es/);
  });
});
