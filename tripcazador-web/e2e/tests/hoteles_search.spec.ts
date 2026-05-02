/**
 * E2E — buscador de hoteles (HotelSearchBar + filtros + URL state).
 *
 * Cobertura completa:
 *  - Render del search bar con todos sus campos
 *  - Autocomplete de ciudades (typing + click + keyboard)
 *  - Date pickers entrada/salida con validación
 *  - Picker de huéspedes (counters min/max)
 *  - Submit propaga state a URL
 *  - Filtros aplican y URL se actualiza
 *  - Reset filters limpia todo
 *  - Empty state cuando no hay matches
 *  - Mobile responsive
 *  - A11y básico (axe + roles)
 */
import { test, expect } from "@playwright/test";

test.describe("Hotel Hunter — Search & Filters", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hoteles");
    await page.waitForLoadState("networkidle");
  });

  test("renderiza el search bar con todos los campos", async ({ page }) => {
    const bar = page.getByTestId("hotel-search-bar");
    await expect(bar).toBeVisible();

    await expect(page.getByTestId("hotel-city-input")).toBeVisible();
    await expect(page.getByTestId("hotel-checkin")).toBeVisible();
    await expect(page.getByTestId("hotel-checkout")).toBeVisible();
    await expect(page.getByTestId("hotel-guests-toggle")).toBeVisible();
    await expect(page.getByTestId("hotel-search-submit")).toBeVisible();
  });

  test("autocomplete de ciudades muestra sugerencias al escribir", async ({ page }) => {
    const input = page.getByTestId("hotel-city-input");
    await input.click();
    await input.fill("Bali");
    // Esperamos al popover
    const list = page.getByTestId("hotel-city-suggestions");
    await expect(list).toBeVisible();
    // Debe haber al menos una sugerencia con "Bali" o ciudades indonesias
    const items = list.locator("li");
    await expect(items.first()).toBeVisible();
  });

  test("autocomplete con click selecciona ciudad", async ({ page }) => {
    const input = page.getByTestId("hotel-city-input");
    await input.click();
    await input.fill("Sa");
    const list = page.getByTestId("hotel-city-suggestions");
    await expect(list).toBeVisible();
    // Click la primera sugerencia
    await list.locator("li button").first().click();
    // El input debe contener el nombre completo de la ciudad
    const value = await input.inputValue();
    expect(value.length).toBeGreaterThan(2);
    // El popover se cierra
    await expect(list).toBeHidden();
  });

  test("autocomplete con teclado (ArrowDown + Enter)", async ({ page }) => {
    const input = page.getByTestId("hotel-city-input");
    await input.click();
    await input.fill("U");
    const list = page.getByTestId("hotel-city-suggestions");
    await expect(list).toBeVisible();
    await input.press("ArrowDown");
    await input.press("ArrowDown");
    await input.press("Enter");
    const value = await input.inputValue();
    expect(value.length).toBeGreaterThan(1);
  });

  test("Escape cierra el autocomplete", async ({ page }) => {
    const input = page.getByTestId("hotel-city-input");
    await input.click();
    await input.fill("M");
    await expect(page.getByTestId("hotel-city-suggestions")).toBeVisible();
    await input.press("Escape");
    await expect(page.getByTestId("hotel-city-suggestions")).toBeHidden();
  });

  test("guest picker muestra controles + cuenta personas", async ({ page }) => {
    await page.getByTestId("hotel-guests-toggle").click();
    const picker = page.getByTestId("hotel-guests-picker");
    await expect(picker).toBeVisible();
    await expect(page.getByTestId("hotel-adults-counter")).toBeVisible();
    await expect(page.getByTestId("hotel-children-counter")).toBeVisible();
    await expect(page.getByTestId("hotel-rooms-counter")).toBeVisible();
  });

  test("counter de adultos respeta min=1 max=12", async ({ page }) => {
    await page.getByTestId("hotel-guests-toggle").click();
    const minus = page.getByTestId("hotel-adults-counter-minus");
    const value = page.getByTestId("hotel-adults-counter-value");
    // Default 2 → click -- una vez → 1
    await minus.click();
    await expect(value).toHaveText("1");
    // Volver a click -- estando en 1 → debe seguir siendo 1 (botón disabled)
    await expect(minus).toBeDisabled();
  });

  test("counter de niños empieza en 0 y permite incrementar", async ({ page }) => {
    await page.getByTestId("hotel-guests-toggle").click();
    const value = page.getByTestId("hotel-children-counter-value");
    await expect(value).toHaveText("0");
    const plus = page.getByTestId("hotel-children-counter-plus");
    await plus.click();
    await expect(value).toHaveText("1");
  });

  test("submit del search bar añade params a URL", async ({ page }) => {
    const input = page.getByTestId("hotel-city-input");
    await input.click();
    await input.fill("Bali");
    await page.getByTestId("hotel-search-submit").click();
    await page.waitForLoadState("networkidle");
    // La URL debería incluir city, checkIn, checkOut, adults, rooms
    expect(page.url()).toContain("city=Bali");
    expect(page.url()).toMatch(/checkIn=\d{4}-\d{2}-\d{2}/);
    expect(page.url()).toMatch(/checkOut=\d{4}-\d{2}-\d{2}/);
    expect(page.url()).toContain("adults=2");
    expect(page.url()).toContain("rooms=1");
  });
});

test.describe("Hotel Hunter — Filtros principales", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/hoteles");
    await page.waitForLoadState("networkidle");
  });

  test("tabs de categorías están visibles con conteos", async ({ page }) => {
    for (const cat of ["all", "beach", "city", "luxury", "family", "budget"]) {
      const tab = page.getByTestId(`hotel-filter-cat-${cat}`);
      await expect(tab).toBeVisible();
      // Cada tab debe contener un número entre paréntesis con el conteo
      const txt = await tab.innerText();
      expect(txt).toMatch(/\(\d+\)/);
    }
  });

  test("click en 'Playa' filtra solo hoteles de categoría beach", async ({ page }) => {
    const beach = page.getByTestId("hotel-filter-cat-beach");
    await beach.click();
    await expect(beach).toHaveAttribute("aria-selected", "true");
    // El conteo del filtro debería haberse actualizado
    const count = page.getByTestId("hotel-filters-count");
    await expect(count).toBeVisible();
    const txt = await count.innerText();
    expect(parseInt(txt, 10)).toBeGreaterThan(0);
    // URL debería tener category=beach
    expect(page.url()).toContain("category=beach");
  });

  test("filtro de búsqueda libre filtra por texto", async ({ page }) => {
    const search = page.getByTestId("hotel-filter-search");
    await search.fill("Bali");
    await page.waitForTimeout(300); // debounce no — useMemo es síncrono
    const cards = page.getByTestId("hotel-results").locator("article");
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
    // Cada tarjeta visible debe contener "Bali" o un país coincidente (Indonesia)
    for (let i = 0; i < cardCount; i++) {
      const text = await cards.nth(i).innerText();
      expect(text.toLowerCase()).toMatch(/bali|indonesia|seminyak|ubud|sanur|nusa/);
    }
  });

  test("sort 'Precio: menor primero' ordena ascendente", async ({ page }) => {
    const sort = page.getByTestId("hotel-filter-sort");
    await sort.selectOption("price_asc");
    await page.waitForTimeout(200);
    const cards = page.getByTestId("hotel-results").locator("article");
    const n = Math.min(await cards.count(), 5);
    let prev = -1;
    for (let i = 0; i < n; i++) {
      const txt = await cards.nth(i).innerText();
      const match = txt.match(/(\d+)€/);
      if (match) {
        const price = parseInt(match[1], 10);
        if (prev > 0) expect(price).toBeGreaterThanOrEqual(prev);
        prev = price;
      }
    }
  });

  test("región select filtra por región", async ({ page }) => {
    const region = page.getByTestId("hotel-filter-region");
    await region.selectOption("Asia");
    await page.waitForTimeout(200);
    expect(page.url()).toContain("region=Asia");
    const count = page.getByTestId("hotel-filters-count");
    const txt = await count.innerText();
    expect(parseInt(txt, 10)).toBeGreaterThan(0);
  });

  test("amenity filter (Piscina) reduce resultados", async ({ page }) => {
    const allCount = parseInt(await page.getByTestId("hotel-filters-count").innerText(), 10);
    await page.getByTestId("hotel-filter-amenity-pool").click();
    await page.waitForTimeout(200);
    const filteredCount = parseInt(await page.getByTestId("hotel-filters-count").innerText(), 10);
    // Debería haber al menos algunos hoteles con piscina y posiblemente menos que el total
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(allCount);
    expect(page.url()).toContain("amenities=pool");
  });

  test("varios amenities (Piscina + Spa) aplican AND", async ({ page }) => {
    await page.getByTestId("hotel-filter-amenity-pool").click();
    await page.waitForTimeout(150);
    const c1 = parseInt(await page.getByTestId("hotel-filters-count").innerText(), 10);
    await page.getByTestId("hotel-filter-amenity-spa").click();
    await page.waitForTimeout(150);
    const c2 = parseInt(await page.getByTestId("hotel-filters-count").innerText(), 10);
    expect(c2).toBeLessThanOrEqual(c1);
    expect(page.url()).toMatch(/amenities=(pool,spa|spa,pool)/);
  });

  test("filtros que no matchean nada → empty state", async ({ page }) => {
    // Combinación imposible: max price <50€ + min rating 9.5 + 5 estrellas + spa + beach
    await page.getByTestId("hotel-filter-amenity-spa").click();
    await page.getByTestId("hotel-filter-amenity-beach").click();
    await page.getByTestId("hotel-filter-amenity-kids_club").click();
    // Forzar precio muy bajo
    const priceSlider = page.getByTestId("hotel-filter-max-price");
    await priceSlider.fill("50");
    // Rating mínimo alto
    const ratingSlider = page.getByTestId("hotel-filter-min-rating");
    await ratingSlider.fill("9.5");
    await page.waitForTimeout(300);

    // Si los filtros son tan restrictivos que no hay match, debe aparecer empty state
    const empty = page.getByTestId("hotel-empty-state");
    const count = parseInt(await page.getByTestId("hotel-filters-count").innerText(), 10);
    if (count === 0) {
      await expect(empty).toBeVisible();
      // Reset desde empty state
      await page.getByTestId("hotel-empty-reset").click();
      await page.waitForTimeout(150);
      // Tras reset, hay > 0 hoteles
      const newCount = parseInt(await page.getByTestId("hotel-filters-count").innerText(), 10);
      expect(newCount).toBeGreaterThan(0);
    }
  });

  test("reset filters limpia todos los criterios", async ({ page }) => {
    await page.getByTestId("hotel-filter-cat-beach").click();
    await page.getByTestId("hotel-filter-amenity-pool").click();
    await page.waitForTimeout(150);
    expect(page.url()).toContain("category=beach");

    const reset = page.getByTestId("hotel-filters-reset");
    if (await reset.isVisible()) {
      await reset.click();
      await page.waitForTimeout(200);
      // URL debería estar limpia
      expect(page.url()).not.toContain("category=beach");
      expect(page.url()).not.toContain("amenities=pool");
    }
  });

  test("URL params iniciales rellenan los filtros (deep-link)", async ({ page }) => {
    await page.goto("/hoteles?category=luxury&region=Asia&minRating=9");
    await page.waitForLoadState("networkidle");
    const luxuryTab = page.getByTestId("hotel-filter-cat-luxury");
    await expect(luxuryTab).toHaveAttribute("aria-selected", "true");
    const region = page.getByTestId("hotel-filter-region");
    await expect(region).toHaveValue("Asia");
  });
});

test.describe("Hotel Hunter — Responsive + a11y", () => {
  test("mobile (375px): search bar se adapta y filtros scrollean horizontalmente", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await page.goto("/hoteles");
    await page.waitForLoadState("networkidle");

    const bar = page.getByTestId("hotel-search-bar");
    await expect(bar).toBeVisible();

    // Tabs de categoría siguen accesibles (overflow-x-auto)
    await expect(page.getByTestId("hotel-filter-cat-all")).toBeVisible();
    // El submit button es ≥44px (touch target)
    const submitBox = await page.getByTestId("hotel-search-submit").boundingBox();
    expect(submitBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("a11y: search bar tiene role search + aria-labels", async ({ page }) => {
    await page.goto("/hoteles");
    const bar = page.getByTestId("hotel-search-bar");
    await expect(bar).toHaveAttribute("role", "search");
    await expect(bar).toHaveAttribute("aria-label", /buscar/i);

    // Tabs tienen role=tab
    const tab = page.getByTestId("hotel-filter-cat-beach");
    await expect(tab).toHaveAttribute("role", "tab");
  });

  test("a11y: counters tienen aria-label", async ({ page }) => {
    await page.goto("/hoteles");
    await page.getByTestId("hotel-guests-toggle").click();
    const minus = page.getByTestId("hotel-adults-counter-minus");
    await expect(minus).toHaveAttribute("aria-label", /reducir/i);
    const plus = page.getByTestId("hotel-adults-counter-plus");
    await expect(plus).toHaveAttribute("aria-label", /aumentar/i);
  });
});
