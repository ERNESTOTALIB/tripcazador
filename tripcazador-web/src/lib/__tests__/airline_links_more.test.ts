/**
 * airline_links_more.test.ts — coverage de builders por aerolínea + getBookingUrl.
 */
import { describe, it, expect } from "vitest";
import {
  skyscannerUrl,
  lufthansaUrl,
  klmUrl,
  airFranceUrl,
  britishAirwaysUrl,
  vuelingUrl,
  tapPortugalUrl,
  airEuropaUrl,
  aerLingusUrl,
  norwegianUrl,
  sasUrl,
  finnairUrl,
  aegeanUrl,
  turkishUrl,
  qatarUrl,
  emiratesUrl,
  singaporeAirlinesUrl,
  anaUrl,
  jalUrl,
  cathayUrl,
  vietnamAirlinesUrl,
  aeromexicoUrl,
  iberiaUrl,
  condorUrl,
  tuiFlyUrl,
  getBookingUrl,
  enhanceDealBookingUrl,
} from "../airline_links";

describe("skyscannerUrl", () => {
  it("formato fecha YYMMDD para path", () => {
    const u = skyscannerUrl("MAD", "BCN", "2026-06-01");
    expect(u).toContain("/mad/bcn/260601");
  });
  it("incluye carrier filter cuando se pasa", () => {
    const u = skyscannerUrl("MAD", "BCN", "2026-06-01", "", "32753");
    expect(u).toContain("carriers=32753");
  });
  it("round-trip dos fechas YYMMDD", () => {
    const u = skyscannerUrl("MAD", "BCN", "2026-06-01", "2026-06-08");
    expect(u).toContain("/mad/bcn/260601/260608");
    expect(u).toContain("rtn=1");
  });
  it("fallback base sin date", () => {
    const u = skyscannerUrl("", "BCN", "2026-06-01");
    expect(u).toBe("https://www.skyscanner.es/transporte/vuelos");
  });
});

describe("Builders aerolíneas individuales — happy path", () => {
  const O = "MAD";
  const D = "FCO";
  const DT = "2026-08-15";

  it.each<[string, (o: string, d: string, dOut: string) => string, string]>([
    ["lufthansa", lufthansaUrl, "lufthansa.com"],
    ["klm", klmUrl, "klm.com"],
    ["airFrance", airFranceUrl, "airfrance.es"],
    ["britishAirways", britishAirwaysUrl, "britishairways.com"],
    ["vueling", vuelingUrl, "vueling.com"],
    ["tapPortugal", tapPortugalUrl, "flytap.com"],
    ["airEuropa", airEuropaUrl, "aireuropa.com"],
    ["aerLingus", aerLingusUrl, "aerlingus.com"],
    ["norwegian", norwegianUrl, "norwegian.com"],
    ["sas", sasUrl, "flysas.com"],
    ["finnair", finnairUrl, "finnair.com"],
    ["aegean", aegeanUrl, "aegeanair.com"],
    ["turkish", turkishUrl, "turkishairlines.com"],
    ["qatar", qatarUrl, "qatarairways.com"],
    ["emirates", emiratesUrl, "emirates.com"],
    ["singapore", singaporeAirlinesUrl, "singaporeair.com"],
    ["ana", anaUrl, "ana.co.jp"],
    ["jal", jalUrl, "jal.co.jp"],
    ["cathay", cathayUrl, "cathaypacific.com"],
    ["vietnamAirlines", vietnamAirlinesUrl, "vietnamairlines.com"],
    ["aeromexico", aeromexicoUrl, "aeromexico.com"],
    ["iberia", iberiaUrl, "iberia.com"],
    ["condor", condorUrl, "condor.com"],
    ["tuiFly", tuiFlyUrl, "tuifly.com"],
  ])("%s → URL contains %s", (_name, builder, dom) => {
    const u = builder(O, D, DT);
    expect(u).toContain(dom);
  });
});

describe("Builders — invalid fallback to skyscanner", () => {
  it.each([
    lufthansaUrl, klmUrl, airFranceUrl, britishAirwaysUrl,
    vuelingUrl, tapPortugalUrl, airEuropaUrl, aerLingusUrl,
    norwegianUrl, sasUrl, finnairUrl, aegeanUrl,
    turkishUrl, qatarUrl, emiratesUrl, singaporeAirlinesUrl,
    anaUrl, jalUrl, cathayUrl, vietnamAirlinesUrl,
    aeromexicoUrl, iberiaUrl, condorUrl, tuiFlyUrl,
  ])("invalid IATA → skyscanner (builder $#)", (builder) => {
    const u = builder("ZZZZ", "BCN", "2026-06-01");
    expect(u).toContain("skyscanner");
  });
});

describe("Builders — return date handling", () => {
  it("Lufthansa RT adds flights array", () => {
    const u = lufthansaUrl("MAD", "FCO", "2026-08-15", "2026-08-22");
    expect(u).toContain("tripType=RT");
  });

  it("Lufthansa OW no return flight", () => {
    const u = lufthansaUrl("MAD", "FCO", "2026-08-15");
    expect(u).toContain("tripType=OW");
  });

  it("BA isoToBA convierte ISO a DDMMYYYY", () => {
    const u = britishAirwaysUrl("LHR", "BCN", "2026-08-15");
    expect(u).toContain("DepartingDate=15082026");
  });

  it("KLM RETURN type cuando hay retorno", () => {
    const u = klmUrl("AMS", "MAD", "2026-08-15", "2026-08-22");
    expect(u).toContain("type=RETURN");
    expect(u).toContain("returnDate=2026-08-22");
  });

  it("KLM ONEWAY type sin retorno", () => {
    const u = klmUrl("AMS", "MAD", "2026-08-15");
    expect(u).toContain("type=ONEWAY");
  });

  it("Vueling trip=2 con retorno", () => {
    const u = vuelingUrl("BCN", "FCO", "2026-08-15", "2026-08-22");
    expect(u).toContain("trip=2");
    expect(u).toContain("in=2026-08-22");
  });

  it("Vueling trip=1 sin retorno", () => {
    const u = vuelingUrl("BCN", "FCO", "2026-08-15");
    expect(u).toContain("trip=1");
  });

  it("JAL convierte ISO a YYYYMMDD", () => {
    const u = jalUrl("HND", "LAX", "2026-08-15");
    expect(u).toContain("outDate=20260815");
  });
});

describe("getBookingUrl — selección por code", () => {
  it.each([
    ["FR", "ryanair.com"],
    ["U2", "easyjet.com"],
    ["W6", "wizzair.com"],
    ["LH", "lufthansa.com"],
    ["KL", "klm.com"],
    ["AF", "airfrance.es"],
    ["BA", "britishairways.com"],
    ["VY", "vueling.com"],
    ["TP", "flytap.com"],
    ["UX", "aireuropa.com"],
    ["EI", "aerlingus.com"],
    ["IB", "iberia.com"],
    ["EK", "emirates.com"],
    ["NH", "ana.co.jp"],
    ["TK", "turkishairlines.com"],
    ["QR", "qatarairways.com"],
  ])("IATA code %s → %s", (code, expectDomain) => {
    const u = getBookingUrl({
      airlineCode: code,
      origin: "MAD",
      destination: "FCO",
      dateOut: "2026-08-15",
    });
    expect(u).toContain(expectDomain);
  });

  it("normalize: lowercase + trim", () => {
    const u = getBookingUrl({
      airlineCode: " fr ",
      origin: "MAD",
      destination: "STN",
      dateOut: "2026-08-15",
    });
    expect(u).toContain("ryanair.com");
  });
});

describe("getBookingUrl — selección por name", () => {
  it.each([
    ["Ryanair", "ryanair.com"],
    ["easyJet", "easyjet.com"],
    ["Wizz Air", "wizzair.com"],
    ["Lufthansa", "lufthansa.com"],
    ["KLM Royal Dutch Airlines", "klm.com"],
    ["Air France", "airfrance.es"],
    ["airfrance", "airfrance.es"],
    ["British Airways", "britishairways.com"],
    ["Vueling", "vueling.com"],
    ["TAP Portugal", "flytap.com"],
    ["Iberia", "iberia.com"],
    ["Turkish Airlines", "turkishairlines.com"],
    ["Qatar Airways", "qatarairways.com"],
    ["Emirates", "emirates.com"],
    ["Singapore Airlines", "singaporeair.com"],
    ["Cathay Pacific", "cathaypacific.com"],
    ["Vietnam Airlines", "vietnamairlines.com"],
  ])("name '%s' → %s", (name, dom) => {
    const u = getBookingUrl({
      airlineName: name,
      origin: "MAD",
      destination: "FCO",
      dateOut: "2026-08-15",
    });
    expect(u).toContain(dom);
  });

  it.each([
    ["Ryanair Holdings", "ryanair.com"],
    ["easyJet UK Limited", "easyjet.com"],
    ["Wizz Air Malta Ltd", "wizzair.com"],
    ["Iberia Express", "iberia.com"],
  ])("substring match '%s' → %s", (name, dom) => {
    const u = getBookingUrl({
      airlineName: name,
      origin: "MAD",
      destination: "FCO",
      dateOut: "2026-08-15",
    });
    expect(u).toContain(dom);
  });

  it("airlineName unknown → fallback Skyscanner", () => {
    const u = getBookingUrl({
      airlineName: "Unknown Air Carrier",
      origin: "MAD",
      destination: "FCO",
      dateOut: "2026-08-15",
    });
    expect(u).toContain("skyscanner");
  });

  it("sin code y sin name → skyscanner fallback", () => {
    const u = getBookingUrl({
      origin: "MAD",
      destination: "FCO",
      dateOut: "2026-08-15",
    });
    expect(u).toContain("skyscanner");
  });
});

describe("enhanceDealBookingUrl", () => {
  it("respeta URL no-google", () => {
    const deal = {
      booking_url: "https://my.com/book",
      airline_code: "FR",
      origin: "MAD",
      destination: "STN",
      date_out: "2026-08-15",
    };
    const out = enhanceDealBookingUrl(deal);
    expect(out.booking_url).toBe("https://my.com/book");
  });

  it("reescribe URL google.com/travel", () => {
    const deal = {
      booking_url: "https://google.com/travel/flights/x",
      airline_code: "FR",
      origin: "STN",
      destination: "BCN",
      date_out: "2026-08-15",
    };
    const out = enhanceDealBookingUrl(deal);
    expect(out.booking_url).toContain("ryanair.com");
  });

  it("reescribe URL google.com/flights", () => {
    const deal = {
      booking_url: "https://google.com/flights?x",
      airline_code: "U2",
      origin: "LGW",
      destination: "PMI",
      date_out: "2026-08-15",
    };
    const out = enhanceDealBookingUrl(deal);
    expect(out.booking_url).toContain("easyjet.com");
  });

  it("reescribe cuando booking_url vacío", () => {
    const deal = {
      booking_url: "",
      airline_code: "VY",
      origin: "BCN",
      destination: "FCO",
      date_out: "2026-08-15",
    };
    const out = enhanceDealBookingUrl(deal);
    expect(out.booking_url).toContain("vueling.com");
  });

  it("preserva otros campos del deal", () => {
    const deal = {
      booking_url: "",
      airline_code: "FR",
      airline_name: "Ryanair",
      origin: "STN",
      destination: "BCN",
      date_out: "2026-08-15",
      extra: "field",
    };
    const out = enhanceDealBookingUrl(deal);
    expect(out.airline_name).toBe("Ryanair");
    // @ts-expect-error extra field
    expect(out.extra).toBe("field");
  });
});
