/**
 * SSS145 — Smoke test anti-regresión SSS143
 *
 * Visita TODAS las rutas críticas y comprueba que ninguna muestra el
 * error.tsx con "Algo salió mal en el radar" (que es la signatura del
 * bug RSC event handler que tiró producción el 11 may 2026).
 *
 * Diseñado para correr contra el preview URL de PRE antes de mergear:
 *   BASE_URL=https://tripcazador-git-pre-ernesto-talibs-projects.vercel.app \
 *     npx playwright test smoke_no_runtime_errors.spec.ts
 *
 * Si CUALQUIER ruta dispara el error boundary, el test falla y debe
 * bloquearse el merge a main.
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Set de rutas críticas (cubren todos los Server Components principales)
const ROUTES = [
  // Home + secciones principales
  "/",
  "/deals",
  "/destinos",
  "/hoteles",
  "/blog",
  "/favoritos",
  "/buscar",

  // Listings con datos seed (los que más a menudo crashean por data shape)
  "/destinos/japon",
  "/destinos/bali",
  "/destinos/tailandia",
  "/hoteles/madrid",
  "/hoteles/barcelona",

  // Verticales que descubrimos hoy
  "/comparar-aerolineas",
  "/comparar-barrios",
  "/comparar-barrios/bcn-gotico-vs-eixample",

  // Páginas legales / utility
  "/legal",
  "/legal/privacidad",
  "/glosario",
  "/calculadora",
  "/stopovers",
  "/partners",
  "/prensa",
  "/faq",

  // i18n stubs
  "/en",
  "/en/blog",
  "/en/destinos",
  "/de",
  "/fr",
  "/it",

  // Áreas dinámicas / con riesgo
  "/planificador",
  "/regalo",
  "/tendencias",
  "/mapa-precios",
];

const ERROR_TEXT_PATTERNS = [
  "Algo salió mal en el radar",
  "An error occurred in the Server Components render",
];

for (const route of ROUTES) {
  test(`smoke: ${route} no debe mostrar error.tsx`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(`console.error: ${msg.text()}`);
    });

    const response = await page.goto(`${BASE_URL}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    expect(response, `Sin respuesta para ${route}`).not.toBeNull();
    // Aceptamos 200, 301/302 redirect, o (ocasionalmente) 404 para rutas que
    // se hayan retirado — pero NO 500 ni error.tsx visible.
    const status = response!.status();
    expect(
      [200, 301, 302, 304, 404],
      `Status ${status} inesperado en ${route}`,
    ).toContain(status);

    // Espera a que la app se hidrate. error.tsx aparece justo tras
    // hidratación si hay RSC error → damos 2.5s a React.
    await page.waitForTimeout(2_500);

    const bodyText = await page.locator("body").innerText();
    for (const pattern of ERROR_TEXT_PATTERNS) {
      expect(
        bodyText,
        `Ruta ${route} muestra el error boundary: "${pattern}"`,
      ).not.toContain(pattern);
    }

    // Recogemos error.digest del HTML por si Next lo metió en payload
    const html = await page.content();
    const digestMatch = html.match(/"digest":"(\d{6,12})"/);
    if (digestMatch) {
      throw new Error(
        `Ruta ${route} contiene error.digest ${digestMatch[1]} en HTML — RSC render error.`,
      );
    }

    // Reportamos cualquier pageerror que haya ocurrido — fail si hubo
    if (consoleErrors.length > 0) {
      // Filtramos warnings de hidratación benignos (#418, #425, #422) que
      // React recovers from. Sólo failures críticos cuentan.
      const fatal = consoleErrors.filter(
        (e) =>
          !/Minified React error #(418|425|422)/.test(e) &&
          !/AdSense head tag/.test(e),
      );
      if (fatal.length > 0) {
        throw new Error(
          `Ruta ${route} tiene errores fatales:\n${fatal.join("\n")}`,
        );
      }
    }
  });
}
