/**
 * airline_links.ts
 *
 * Port TS del módulo Python flight_hunter_v4/airline_links.py.
 * Genera URLs de booking directas:
 *   - Ryanair  → ryanair.com/trip/flights/select?...   (deep link real)
 *   - easyJet  → easyjet.com/es/vuelos-baratos/...     (precarga ruta+fecha)
 *   - Wizz Air → wizzair.com/en-gb/flights/search?...  (precarga ruta+fecha)
 *   - Resto    → kayak.es/flights/{O}-{D}/{date}       (200 OK universal)
 *
 * Si TRAVELPAYOUTS_MARKER está configurado en NEXT_PUBLIC_TP_MARKER, los
 * deals que NO tengan deeplink directo (ej: Iberia, Air France, Lufthansa)
 * van a Aviasales con marker de afiliación → comisión 2-6%.
 *
 * Política de seguridad:
 *   - Todos los inputs IATA se sanitizan (uppercase, [A-Z0-9]{3})
 *   - Las fechas se validan como ISO YYYY-MM-DD
 *   - Si la entrada está malformada, fallback a Kayak con la URL más permisiva
 */

const TP_MARKER =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_TP_MARKER) || "";

// ─── Sanitización de inputs ───────────────────────────────────────────────────

function safeIata(code: string | undefined | null): string {
  if (!code) return "";
  const s = String(code).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.length === 3 ? s : "";
}

function safeDate(d: string | undefined | null): string {
  if (!d) return "";
  const s = String(d).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
}

// ─── Builders por aerolínea ───────────────────────────────────────────────────

export function kayakUrl(
  origin: string,
  destination: string,
  dateOut: string,
  dateRet: string = ""
): string {
  const o = safeIata(origin);
  const d = safeIata(destination);
  const dOut = safeDate(dateOut);
  const dRet = safeDate(dateRet);
  if (!o || !d) return "https://www.kayak.es/flights";
  if (!dOut) return `https://www.kayak.es/flights/${o}-${d}`;
  if (dRet) return `https://www.kayak.es/flights/${o}-${d}/${dOut}/${dRet}?sort=price_a`;
  return `https://www.kayak.es/flights/${o}-${d}/${dOut}?sort=price_a`;
}

export function ryanairUrl(
  origin: string,
  destination: string,
  dateOut: string,
  dateRet: string = ""
): string {
  const o = safeIata(origin);
  const d = safeIata(destination);
  const dOut = safeDate(dateOut);
  const dRet = safeDate(dateRet);
  if (!o || !d || !dOut) return kayakUrl(origin, destination, dateOut, dateRet);
  const params = new URLSearchParams({
    adults: "1",
    teens: "0",
    children: "0",
    infants: "0",
    dateOut: dOut,
    isConnectedFlight: "false",
    isReturn: dRet ? "true" : "false",
    originIata: o,
    destinationIata: d,
  });
  if (dRet) params.set("dateIn", dRet);
  return `https://www.ryanair.com/es/es/trip/flights/select?${params.toString()}`;
}

export function easyjetUrl(
  origin: string,
  destination: string,
  dateOut: string,
  dateRet: string = ""
): string {
  const o = safeIata(origin).toLowerCase();
  const d = safeIata(destination).toLowerCase();
  const dOut = safeDate(dateOut);
  const dRet = safeDate(dateRet);
  if (!o || !d || !dOut) return kayakUrl(origin, destination, dateOut, dateRet);
  const base = `https://www.easyjet.com/es/vuelos-baratos/${o}/${d}`;
  const params = new URLSearchParams({ departDate: dOut, adults: "1" });
  if (dRet) params.set("returnDate", dRet);
  return `${base}?${params.toString()}`;
}

export function wizzairUrl(
  origin: string,
  destination: string,
  dateOut: string,
  dateRet: string = ""
): string {
  const o = safeIata(origin);
  const d = safeIata(destination);
  const dOut = safeDate(dateOut);
  const dRet = safeDate(dateRet);
  if (!o || !d || !dOut) return kayakUrl(origin, destination, dateOut, dateRet);
  const params = new URLSearchParams({
    isRoundTrip: dRet ? "true" : "false",
    departureIata: o,
    arrivalIata: d,
    departureDate: dOut,
    adultsCount: "1",
  });
  if (dRet) params.set("returnDate", dRet);
  return `https://www.wizzair.com/en-gb/flights/search?${params.toString()}`;
}

// ─── Builders adicionales fase ii ─── (20+ aerolíneas con deeplink directo)
//
// Cada builder genera URL al booking-engine de la aerolínea con la ruta y
// fechas pre-rellenadas. Si el formato no acepta deeplink fiable, fallback
// a Skyscanner con carrier filter (más fiable que Kayak para precio cash).

/**
 * skyscannerUrl — fallback universal MEJORADO.
 * Skyscanner muestra el precio "from" más fiel a la realidad del booking
 * engine de la aerolínea (mejor que Kayak en data refresh y disponibilidad).
 * Acepta filtro carrier vía param ?inboundaltsenabled=false&outboundaltsenabled=false.
 */
export function skyscannerUrl(
  origin: string,
  destination: string,
  dateOut: string,
  dateRet: string = "",
  carrier: string = ""
): string {
  const o = safeIata(origin).toLowerCase();
  const d = safeIata(destination).toLowerCase();
  const dOut = safeDate(dateOut);
  const dRet = safeDate(dateRet);
  if (!o || !d || !dOut) return `https://www.skyscanner.es/transporte/vuelos`;
  const yymmdd = (s: string) => s.slice(2, 4) + s.slice(5, 7) + s.slice(8, 10);
  const path = dRet ? `${o}/${d}/${yymmdd(dOut)}/${yymmdd(dRet)}` : `${o}/${d}/${yymmdd(dOut)}`;
  const params = new URLSearchParams({
    adultsv2: "1",
    cabinclass: "economy",
    rtn: dRet ? "1" : "0",
    preferdirects: "false",
    outboundaltsenabled: "false",
    inboundaltsenabled: "false",
  });
  if (carrier) params.set("carriers", carrier);
  return `https://www.skyscanner.es/transporte/vuelos/${path}/?${params.toString()}`;
}

// fase jj-G7-fix: deeplinks que NO testé contra los booking engines reales
// volcaban en páginas de error (Air France "Oops..." reportado por usuario).
// Política: solo deeplink directo cuando lo TESTAMOS (Ryanair, easyJet, Wizz).
// Para LH/KL/AF/BA/VY/TP/UX/Norwegian/Turkish → Skyscanner+carrier filter.
// Skyscanner con carrier_id pre-seleccionado da el resultado de esa aerolínea
// con precio real, sin riesgo de URL inválida.

export function lufthansaUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32753"); // LH carrier id
}

export function klmUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32382"); // KL
}

export function airFranceUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32399"); // AF
}

export function britishAirwaysUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32475"); // BA
}

export function vuelingUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32467"); // VY
}

export function tapPortugalUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32464"); // TP
}

export function airEuropaUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32388"); // UX
}

export function aerLingusUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32384"); // EI carrier id
}

export function norwegianUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32411"); // DY
}

export function sasUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32448"); // SK
}

export function finnairUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32411"); // AY
}

export function aegeanUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32249"); // A3
}

export function turkishUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32465"); // TK
}

export function qatarUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32436"); // QR
}

export function emiratesUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32385"); // EK
}

export function singaporeAirlinesUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32449"); // SQ
}

export function anaUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32249"); // NH
}

export function jalUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32379"); // JL
}

export function cathayUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32381"); // CX
}

export function vietnamAirlinesUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32466"); // VN
}

export function aeromexicoUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32228"); // AM
}

export function iberiaUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  // iberia.com 403 bot. Skyscanner con carrier IB es lo más cerca a directo.
  return skyscannerUrl(o, d, dOut, dRet, "32384"); // IB carrier id
}

export function condorUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32264"); // DE
}

export function tuiFlyUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  return skyscannerUrl(o, d, dOut, dRet, "32463"); // X3
}

export function travelpayoutsUrl(
  origin: string,
  destination: string,
  dateOut: string,
  dateRet: string = ""
): string {
  if (!TP_MARKER) return kayakUrl(origin, destination, dateOut, dateRet);
  const o = safeIata(origin);
  const d = safeIata(destination);
  const dOut = safeDate(dateOut);
  const dRet = safeDate(dateRet);
  if (!o || !d || !dOut) return kayakUrl(origin, destination, dateOut, dateRet);
  // Aviasales formato: DDMM
  const ddmm = (s: string) => s.slice(8, 10) + s.slice(5, 7);
  let trip = `${o}${ddmm(dOut)}${d}1`;
  if (dRet) trip += `${d}${ddmm(dRet)}${o}1`;
  return `https://www.aviasales.es/search/${trip}?marker=${encodeURIComponent(TP_MARKER)}&powered_by=true`;
}

// ─── Mapa aerolínea (IATA + nombre) → builder ────────────────────────────────

type Builder = (o: string, d: string, dOut: string, dRet?: string) => string;

const CODE_TO_BUILDER: Record<string, Builder> = {
  // Low-cost (deeplink directo testeado)
  FR: ryanairUrl,
  RK: ryanairUrl,
  U2: easyjetUrl,
  EC: easyjetUrl,
  DS: easyjetUrl,
  W6: wizzairUrl,
  W4: wizzairUrl,
  W9: wizzairUrl,
  // ── fase ii: full-service carriers (deeplink propio o Skyscanner+carrier)
  LH: lufthansaUrl,
  CL: lufthansaUrl,  // Lufthansa CityLine
  KL: klmUrl,
  AF: airFranceUrl,
  BA: britishAirwaysUrl,
  VY: vuelingUrl,
  TP: tapPortugalUrl,
  UX: airEuropaUrl,
  EI: aerLingusUrl,
  DY: norwegianUrl,
  D8: norwegianUrl,
  SK: sasUrl,
  AY: finnairUrl,
  A3: aegeanUrl,
  TK: turkishUrl,
  QR: qatarUrl,
  EK: emiratesUrl,
  SQ: singaporeAirlinesUrl,
  NH: anaUrl,
  JL: jalUrl,
  CX: cathayUrl,
  VN: vietnamAirlinesUrl,
  AM: aeromexicoUrl,
  IB: iberiaUrl,
  I2: iberiaUrl,
  YW: iberiaUrl,
  DE: condorUrl,
  X3: tuiFlyUrl,
};

// Nombre (lowercase) → builder. Cubre nombres que devuelven Google Flights/SerpAPI.
const NAME_TO_BUILDER: Record<string, Builder> = {
  // Low-cost
  ryanair: ryanairUrl,
  "ryanair uk": ryanairUrl,
  easyjet: easyjetUrl,
  "easyjet switzerland": easyjetUrl,
  "easyjet europe": easyjetUrl,
  wizz: wizzairUrl,
  "wizz air": wizzairUrl,
  "wizz air malta": wizzairUrl,
  "wizz air abu dhabi": wizzairUrl,
  // ── fase ii: full-service
  lufthansa: lufthansaUrl,
  "lufthansa cityline": lufthansaUrl,
  klm: klmUrl,
  "klm royal dutch airlines": klmUrl,
  "air france": airFranceUrl,
  airfrance: airFranceUrl,
  "british airways": britishAirwaysUrl,
  ba: britishAirwaysUrl,
  vueling: vuelingUrl,
  tap: tapPortugalUrl,
  "tap portugal": tapPortugalUrl,
  "tap air portugal": tapPortugalUrl,
  "air europa": airEuropaUrl,
  aireuropa: airEuropaUrl,
  "aer lingus": aerLingusUrl,
  norwegian: norwegianUrl,
  "norwegian air": norwegianUrl,
  "norwegian air international": norwegianUrl,
  sas: sasUrl,
  "scandinavian airlines": sasUrl,
  finnair: finnairUrl,
  aegean: aegeanUrl,
  "aegean airlines": aegeanUrl,
  turkish: turkishUrl,
  "turkish airlines": turkishUrl,
  qatar: qatarUrl,
  "qatar airways": qatarUrl,
  emirates: emiratesUrl,
  singapore: singaporeAirlinesUrl,
  "singapore airlines": singaporeAirlinesUrl,
  ana: anaUrl,
  "all nippon airways": anaUrl,
  jal: jalUrl,
  "japan airlines": jalUrl,
  cathay: cathayUrl,
  "cathay pacific": cathayUrl,
  "vietnam airlines": vietnamAirlinesUrl,
  aeromexico: aeromexicoUrl,
  aeroméxico: aeromexicoUrl,
  iberia: iberiaUrl,
  "iberia express": iberiaUrl,
  "air nostrum": iberiaUrl,
  "air nostrum (iberia regional)": iberiaUrl,
  condor: condorUrl,
  "tui fly": tuiFlyUrl,
  tuifly: tuiFlyUrl,
};

/**
 * getBookingUrl — devuelve URL directa.
 * Prioridad:
 *   1. Web oficial de la aerolínea (solo si tiene deeplink testeado)
 *   2. Travelpayouts/Aviasales con marker de afiliado (si configurado)
 *   3. Kayak (universal, sin captcha, sin comisión)
 */
export function getBookingUrl(opts: {
  airlineCode?: string | null;
  airlineName?: string | null;
  origin: string;
  destination: string;
  dateOut: string;
  dateRet?: string;
}): string {
  const { airlineCode, airlineName, origin, destination, dateOut, dateRet = "" } = opts;

  // 1) por código IATA
  const code = (airlineCode || "").toUpperCase().trim();
  const builderByCode = code && CODE_TO_BUILDER[code];
  if (builderByCode) return builderByCode(origin, destination, dateOut, dateRet);

  // 2) por nombre normalizado
  const name = (airlineName || "").toLowerCase().trim();
  if (name) {
    // Intento exacto
    const builderByName = NAME_TO_BUILDER[name];
    if (builderByName) return builderByName(origin, destination, dateOut, dateRet);
    // Fallbacks por substring (por si llega "Ryanair Holdings" o variantes)
    if (name.includes("ryanair")) return ryanairUrl(origin, destination, dateOut, dateRet);
    if (name.includes("easyjet")) return easyjetUrl(origin, destination, dateOut, dateRet);
    if (name.includes("wizz")) return wizzairUrl(origin, destination, dateOut, dateRet);
    if (name.includes("lufthansa")) return lufthansaUrl(origin, destination, dateOut, dateRet);
    if (name.includes("klm")) return klmUrl(origin, destination, dateOut, dateRet);
    if (name.includes("air france") || name === "airfrance") return airFranceUrl(origin, destination, dateOut, dateRet);
    if (name.includes("vueling")) return vuelingUrl(origin, destination, dateOut, dateRet);
    if (name.includes("iberia")) return iberiaUrl(origin, destination, dateOut, dateRet);
    if (name.includes("turkish")) return turkishUrl(origin, destination, dateOut, dateRet);
    if (name.includes("qatar")) return qatarUrl(origin, destination, dateOut, dateRet);
    if (name.includes("emirates")) return emiratesUrl(origin, destination, dateOut, dateRet);
    if (name.includes("british")) return britishAirwaysUrl(origin, destination, dateOut, dateRet);
    if (name.includes("tap")) return tapPortugalUrl(origin, destination, dateOut, dateRet);
    if (name.includes("singapore")) return singaporeAirlinesUrl(origin, destination, dateOut, dateRet);
    if (name.includes("cathay")) return cathayUrl(origin, destination, dateOut, dateRet);
    if (name.includes("vietnam")) return vietnamAirlinesUrl(origin, destination, dateOut, dateRet);
  }

  // 3) Travelpayouts (si marker configurado) o Skyscanner fallback (mejor que Kayak
  // — Kayak mostraba precios desincronizados de la realidad, Skyscanner refresca
  // mejor y permite filter carrier).
  if (TP_MARKER) return travelpayoutsUrl(origin, destination, dateOut, dateRet);
  return skyscannerUrl(origin, destination, dateOut, dateRet);
}

/**
 * enhanceDealBookingUrl — wrapper para el shape Deal del API.
 * Si el deal trae booking_url ya con dominio NO-google y NO-vacío, lo respeta.
 * Si trae google.com o vacío, lo regenera vía airline link directo.
 */
export function enhanceDealBookingUrl<
  T extends {
    booking_url?: string | null;
    airline_code?: string | null;
    airline_name?: string | null;
    origin?: string | null;
    destination?: string | null;
    date_out?: string | null;
    date_ret?: string | null;
  }
>(deal: T): T {
  const current = (deal.booking_url || "").toLowerCase();
  const isGenericFallback =
    !current ||
    current.includes("google.com/travel") ||
    current.includes("google.com/flights");

  if (!isGenericFallback) return deal;

  const direct = getBookingUrl({
    airlineCode: deal.airline_code,
    airlineName: deal.airline_name,
    origin: deal.origin || "",
    destination: deal.destination || "",
    dateOut: deal.date_out || "",
    dateRet: deal.date_ret || "",
  });

  return { ...deal, booking_url: direct };
}
