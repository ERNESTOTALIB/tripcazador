/**
 * Tests para los helpers puros del HotelSearchWidget.
 *
 * Cubrimos:
 *  - buildBookingUrl: formato correcto de la URL de afiliado. Si
 *    rompemos el parámetro `aid`, perdemos la comisión en cada click.
 *    Si rompemos `ss` o las fechas, Booking aterriza en búsqueda vacía
 *    y la conversión se hunde.
 *  - shiftDate: seguridad frente a strings ISO inválidas.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

describe("buildBookingUrl", () => {
  // Reset de env entre tests porque BOOKING_AID se lee a nivel módulo.
  // Re-importamos tras cambiar env para obtener el módulo "fresco".
  beforeEach(() => {
    vi.resetModules();
  });

  it("incluye todos los parámetros obligatorios y defaults (EUR, lang es)", async () => {
    process.env.NEXT_PUBLIC_BOOKING_AID = "";
    const { buildBookingUrl } = await import("./HotelSearchWidget");

    const url = buildBookingUrl({
      destination: "Santorini, Grecia",
      checkin: "2026-06-01",
      checkout: "2026-06-05",
      adults: 2,
      rooms: 1,
      children: 0,
    });

    const u = new URL(url);
    expect(u.hostname).toBe("www.booking.com");
    expect(u.searchParams.get("ss")).toBe("Santorini, Grecia");
    expect(u.searchParams.get("checkin")).toBe("2026-06-01");
    expect(u.searchParams.get("checkout")).toBe("2026-06-05");
    expect(u.searchParams.get("group_adults")).toBe("2");
    expect(u.searchParams.get("group_children")).toBe("0");
    expect(u.searchParams.get("no_rooms")).toBe("1");
    expect(u.searchParams.get("selected_currency")).toBe("EUR");
    expect(u.searchParams.get("lang")).toBe("es");
    // Sin AID seteado → la URL no debe incluirlo (y aterrizamos sin tracking)
    expect(u.searchParams.has("aid")).toBe(false);
  });

  it("añade `aid` si NEXT_PUBLIC_BOOKING_AID está definido (flujo ingresos)", async () => {
    process.env.NEXT_PUBLIC_BOOKING_AID = "1234567";
    const { buildBookingUrl } = await import("./HotelSearchWidget");

    const url = buildBookingUrl({
      destination: "Roma",
      checkin: "2026-06-01",
      checkout: "2026-06-03",
      adults: 1,
      rooms: 1,
      children: 0,
    });
    expect(new URL(url).searchParams.get("aid")).toBe("1234567");
  });

  it("codifica correctamente destinos con caracteres especiales", async () => {
    process.env.NEXT_PUBLIC_BOOKING_AID = "";
    const { buildBookingUrl } = await import("./HotelSearchWidget");

    const url = buildBookingUrl({
      destination: "Zanzíbar",
      checkin: "2026-06-01",
      checkout: "2026-06-05",
      adults: 2,
      rooms: 1,
      children: 0,
    });
    // URLSearchParams codifica á/í como %C3%A1/%C3%AD — decoded debe volver al original
    expect(new URL(url).searchParams.get("ss")).toBe("Zanzíbar");
  });
});

describe("shiftDate", () => {
  beforeEach(() => vi.resetModules());

  it("suma días correctamente atravesando mes", async () => {
    const { shiftDate } = await import("./HotelSearchWidget");
    expect(shiftDate("2026-01-30", 3)).toBe("2026-02-02");
    expect(shiftDate("2026-12-30", 5)).toBe("2027-01-04");
  });

  it("devuelve el input si no es una fecha válida (fallback defensivo)", async () => {
    const { shiftDate } = await import("./HotelSearchWidget");
    // Un string no-ISO: el Date resultante es Invalid, debemos devolver el original
    expect(shiftDate("not-a-date", 1)).toBe("not-a-date");
  });

  it("valor 0 días devuelve la misma fecha", async () => {
    const { shiftDate } = await import("./HotelSearchWidget");
    expect(shiftDate("2026-06-01", 0)).toBe("2026-06-01");
  });
});
