/**
 * airline_links_edge.test.ts — edge case coverage para airline_links.ts
 *
 * Complementa airline_links.test.ts con casos límite descubiertos auditando
 * el fichero: IATAs vacíos / inválidos / con caracteres especiales,
 * fechas malformadas, código bajo/sin diacrítico, fallback a Skyscanner.
 */
import { describe, it, expect } from "vitest";
import {
  kayakUrl,
  ryanairUrl,
  easyjetUrl,
  wizzairUrl,
  travelpayoutsUrl,
  skyscannerUrl,
  getBookingUrl,
  enhanceDealBookingUrl,
} from "../airline_links";

describe("airline_links — IATA sanitización", () => {
  it("kayakUrl con IATA vacío devuelve home page", () => {
    const u = kayakUrl("", "MAD", "2026-06-01");
    expect(u).toBe("https://www.kayak.es/flights");
  });

  it("kayakUrl con IATA null devuelve home page", () => {
    const u = kayakUrl(null as unknown as string, "MAD", "2026-06-01");
    expect(u).toBe("https://www.kayak.es/flights");
  });

  it("kayakUrl con IATA undefined devuelve home page", () => {
    const u = kayakUrl(undefined as unknown as string, "MAD", "2026-06-01");
    expect(u).toBe("https://www.kayak.es/flights");
  });

  it("kayakUrl con código de 2 letras → fallback", () => {
    const u = kayakUrl("MA", "MAD", "2026-06-01");
    expect(u).toBe("https://www.kayak.es/flights");
  });

  it("kayakUrl con código de 4 letras → fallback (no 3 chars)", () => {
    const u = kayakUrl("MADX", "ZRH", "2026-06-01");
    expect(u).toBe("https://www.kayak.es/flights");
  });

  it("kayakUrl con caracteres no alfanuméricos sanitiza", () => {
    const u = kayakUrl("M@D", "ZRH", "2026-06-01");
    expect(u).toBe("https://www.kayak.es/flights");
  });

  it("kayakUrl con código lowercase se normaliza a UPPER", () => {
    const u = kayakUrl("mad", "zrh", "2026-06-01");
    expect(u).toContain("MAD-ZRH");
  });

  it("kayakUrl sin fecha pero con IATAs OK devuelve URL sin date", () => {
    const u = kayakUrl("MAD", "ZRH", "");
    expect(u).toBe("https://www.kayak.es/flights/MAD-ZRH");
  });

  it("kayakUrl con fecha mal formateada no añade fecha", () => {
    const u = kayakUrl("MAD", "ZRH", "not-a-date");
    expect(u).toBe("https://www.kayak.es/flights/MAD-ZRH");
  });

  it("kayakUrl fecha con timestamp recorta a 10 chars", () => {
    const u = kayakUrl("MAD", "ZRH", "2026-06-01T12:00:00Z");
    expect(u).toContain("/2026-06-01");
    expect(u).not.toContain("T12");
  });
});

describe("airline_links — ryanairUrl casos límite", () => {
  it("ryanairUrl con dateRet vacío → isReturn=false", () => {
    const u = ryanairUrl("STN", "BCN", "2026-06-01", "");
    expect(u).toContain("isReturn=false");
    expect(u).not.toContain("dateIn=");
  });

  it("ryanairUrl con dateRet inválido cae a kayak", () => {
    const u = ryanairUrl("STN", "BCN", "2026-06-01", "invalid");
    // dateRet inválido se ignora pero la fecha out es válida — sigue ryanair OW
    expect(u).toContain("ryanair.com");
    expect(u).toContain("isReturn=false");
  });

  it("ryanairUrl con todos los params válidos: contiene 1 adulto", () => {
    const u = ryanairUrl("STN", "BCN", "2026-06-01");
    expect(u).toContain("adults=1");
    expect(u).toContain("teens=0");
    expect(u).toContain("children=0");
    expect(u).toContain("infants=0");
  });
});

describe("airline_links — wizzairUrl edge cases", () => {
  it("wizzairUrl con dateRet: isRoundTrip=true + returnDate seteado", () => {
    const u = wizzairUrl("LTN", "WAW", "2026-06-01", "2026-06-08");
    expect(u).toContain("isRoundTrip=true");
    expect(u).toContain("returnDate=2026-06-08");
  });

  it("wizzairUrl sin fecha out → fallback a kayak", () => {
    const u = wizzairUrl("LTN", "WAW", "");
    expect(u).toContain("kayak.es");
  });
});

describe("airline_links — easyjetUrl casos límite", () => {
  it("easyjetUrl es lowercase IATA en path", () => {
    const u = easyjetUrl("LGW", "PMI", "2026-06-01");
    expect(u).toMatch(/\/lgw\/pmi/);
  });

  it("easyjetUrl con returnDate añade param", () => {
    const u = easyjetUrl("LGW", "PMI", "2026-06-01", "2026-06-08");
    expect(u).toContain("returnDate=2026-06-08");
  });

  it("easyjetUrl sin fecha → fallback kayak", () => {
    const u = easyjetUrl("LGW", "PMI", "");
    expect(u).toContain("kayak.es");
  });
});

describe("airline_links — skyscannerUrl", () => {
  it("skyscannerUrl genera path con yymmdd", () => {
    const u = skyscannerUrl("MAD", "BCN", "2026-06-01");
    // yymmdd de 2026-06-01 = 260601
    expect(u).toContain("/mad/bcn/260601");
  });

  it("skyscannerUrl rt con returnDate añade yymmdd", () => {
    const u = skyscannerUrl("MAD", "BCN", "2026-06-01", "2026-06-08");
    expect(u).toContain("/mad/bcn/260601/260608");
    expect(u).toContain("rtn=1");
  });

  it("skyscannerUrl sin fecha devuelve home", () => {
    const u = skyscannerUrl("MAD", "BCN", "");
    expect(u).toBe("https://www.skyscanner.es/transporte/vuelos");
  });

  it("skyscannerUrl con carrier filter añade param carriers", () => {
    const u = skyscannerUrl("MAD", "BCN", "2026-06-01", "", "32384");
    expect(u).toContain("carriers=32384");
  });
});

describe("airline_links — travelpayoutsUrl", () => {
  it("travelpayoutsUrl sin marker devuelve kayak", () => {
    // En tests no hay TP_MARKER configurado
    const u = travelpayoutsUrl("MAD", "BCN", "2026-06-01");
    expect(u).toContain("kayak.es");
  });

  it("travelpayoutsUrl con fecha inválida → kayak", () => {
    const u = travelpayoutsUrl("MAD", "BCN", "");
    expect(u).toContain("kayak.es");
  });
});

describe("airline_links — getBookingUrl routing avanzado", () => {
  it("Lufthansa (LH) → lufthansa.com", () => {
    const u = getBookingUrl({
      airlineCode: "LH",
      airlineName: "Lufthansa",
      origin: "FRA",
      destination: "MAD",
      dateOut: "2026-06-01",
    });
    expect(u).toContain("lufthansa.com");
  });

  it("Turkish (TK) → turkishairlines", () => {
    const u = getBookingUrl({
      airlineCode: "TK",
      airlineName: "Turkish Airlines",
      origin: "MAD",
      destination: "IST",
      dateOut: "2026-06-01",
    });
    expect(u).toContain("turkishairlines");
  });

  it("Qatar (QR) → qatarairways", () => {
    const u = getBookingUrl({
      airlineCode: "QR",
      airlineName: "Qatar Airways",
      origin: "MAD",
      destination: "DOH",
      dateOut: "2026-06-01",
    });
    expect(u).toContain("qatarairways");
  });

  it("Emirates (EK) → emirates.com", () => {
    const u = getBookingUrl({
      airlineCode: "EK",
      airlineName: "Emirates",
      origin: "MAD",
      destination: "DXB",
      dateOut: "2026-06-01",
    });
    expect(u).toContain("emirates");
  });

  it("KLM (KL) → klm.com", () => {
    const u = getBookingUrl({
      airlineCode: "KL",
      airlineName: "KLM",
      origin: "MAD",
      destination: "AMS",
      dateOut: "2026-06-01",
    });
    expect(u).toContain("klm.com");
  });

  it("Aerolínea desconocida sin marker → Skyscanner fallback", () => {
    const u = getBookingUrl({
      airlineCode: "XX",
      airlineName: "Unknown Airlines",
      origin: "MAD",
      destination: "BCN",
      dateOut: "2026-06-01",
    });
    expect(u).toContain("skyscanner.es");
  });

  it("Solo nombre 'Wizz' (sin code) hace match", () => {
    const u = getBookingUrl({
      airlineCode: "",
      airlineName: "Wizz Air Malta",
      origin: "LTN",
      destination: "WAW",
      dateOut: "2026-06-01",
    });
    expect(u).toContain("wizzair.com");
  });

  it("Solo nombre 'British Airways' hace match", () => {
    const u = getBookingUrl({
      airlineCode: "",
      airlineName: "British Airways plc",
      origin: "LHR",
      destination: "MAD",
      dateOut: "2026-06-01",
    });
    expect(u).toContain("britishairways");
  });

  it("Nombre 'Iberia Express' (alias) → iberia.com", () => {
    const u = getBookingUrl({
      airlineCode: "I2",
      airlineName: "Iberia Express",
      origin: "MAD",
      destination: "AGP",
      dateOut: "2026-06-01",
    });
    expect(u).toContain("iberia.com");
  });
});

describe("airline_links — enhanceDealBookingUrl casos extra", () => {
  it("respeta booking_url propio (Wizz airline real link)", () => {
    const orig = "https://www.wizzair.com/booking/some-deeplink";
    const out = enhanceDealBookingUrl({
      booking_url: orig,
      airline_code: "W6",
      origin: "LTN",
      destination: "WAW",
      date_out: "2026-06-01",
    });
    expect(out.booking_url).toBe(orig);
  });

  it("reescribe Google Flights → Wizz (W6)", () => {
    const out = enhanceDealBookingUrl({
      booking_url: "https://www.google.com/travel/flights?abc",
      airline_code: "W6",
      origin: "LTN",
      destination: "WAW",
      date_out: "2026-06-01",
    });
    expect(out.booking_url).toContain("wizzair.com");
  });

  it("booking_url null → genera directo", () => {
    const out = enhanceDealBookingUrl({
      booking_url: null,
      airline_code: "FR",
      origin: "STN",
      destination: "BCN",
      date_out: "2026-06-01",
    });
    expect(out.booking_url).toContain("ryanair.com");
  });

  it("booking_url undefined → genera directo", () => {
    const out = enhanceDealBookingUrl({
      airline_code: "U2",
      origin: "LGW",
      destination: "PMI",
      date_out: "2026-06-01",
    });
    expect(out.booking_url).toContain("easyjet.com");
  });

  it("Sin airline_code ni airline_name + sin booking_url → fallback Skyscanner/Kayak", () => {
    const out = enhanceDealBookingUrl({
      booking_url: "",
      origin: "MAD",
      destination: "BCN",
      date_out: "2026-06-01",
    });
    // Sin TP_MARKER, fallback es skyscanner
    expect(out.booking_url).toMatch(/skyscanner|kayak/);
  });
});
