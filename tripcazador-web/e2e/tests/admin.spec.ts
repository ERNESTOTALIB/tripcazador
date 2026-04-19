import { test, expect } from "@playwright/test";

test.describe("Pagina /admin", () => {
  test("muestra formulario de token y no se indexa", async ({ page }) => {
    await page.goto("/admin");

    // Token form visible
    const tokenInput = page.locator("input#admin-token");
    await expect(tokenInput).toBeVisible();
    await expect(tokenInput).toHaveAttribute("type", "password");

    // Boton submit
    const submit = page.getByRole("button", { name: /cargar overview/i });
    await expect(submit).toBeVisible();
    await expect(submit).toBeDisabled(); // sin token
  });

  test("meta robots es noindex", async ({ page }) => {
    await page.goto("/admin");
    const robots = await page.locator('head meta[name="robots"]').getAttribute("content");
    expect(robots || "").toMatch(/noindex/);
    expect(robots || "").toMatch(/nofollow/);
  });

  test("submit con token incorrecto muestra error", async ({ page }) => {
    await page.goto("/admin");
    await page.locator("#admin-token").fill("token-incorrecto");
    await page.getByRole("button", { name: /cargar overview/i }).click();

    // Espera al error (Token invalido, 503 si backend no tiene token, o Error 503)
    await page.waitForTimeout(1500);
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/token inválido|ADMIN_TOKEN|Error\s*\d+/i);
  });

  test("URL /admin tiene disallow en robots.txt", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/robots.txt`);
    expect(res.ok()).toBe(true);
    const txt = await res.text();
    expect(txt).toMatch(/Disallow:\s*\/admin/);
  });
});
