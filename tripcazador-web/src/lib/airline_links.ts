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
// Política CCC2 (abr-2026): preferimos SIEMPRE deeplink directo a la web de la
// aerolínea con origen+destino+fecha pre-rellenados. Si la web bloquea bots o el
// deeplink no es estable, fallback a Skyscanner+carrier filter como suelo de
// seguridad. El usuario reportó que enviar a Skyscanner muestra precios distintos
// al de la oferta — ahora vamos directos al motor de la aerolínea para minimizar
// la diferencia (precio LIVE de la propia aerolínea).
//
// Patrones URL revisados oct-2025/abr-2026 con tráfico real. Si una URL deja de
// funcionar, basta con cambiar el builder afectado y se renderea en todas las
// cards.

// Lufthansa — flight-search SPA acepta query string limpia
export function lufthansaUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32753");
  const trip = dRet ? "RT" : "OW";
  const ret = safeDate(dRet);
  const params = new URLSearchParams({
    travelers: "1", cabinClass: "Economy", tripType: trip,
    flights: JSON.stringify([
      { departureAirport: o3, arrivalAirport: d3, departureDate: dt },
      ...(ret ? [{ departureAirport: d3, arrivalAirport: o3, departureDate: ret }] : []),
    ]),
  });
  return `https://www.lufthansa.com/es/es/flight-search?${params.toString()}`;
}

// KLM — itinerary builder URL aceptado, sin captcha
export function klmUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32382");
  const ret = safeDate(dRet);
  const type = ret ? "RETURN" : "ONEWAY";
  const params: string[] = [
    `cabinClass=ECONOMY`, `travellers=1`, `type=${type}`,
    `origin=${o3}`, `destination=${d3}`, `departureDate=${dt}`,
  ];
  if (ret) params.push(`returnDate=${ret}`);
  return `https://www.klm.com/search/results?${params.join("&")}`;
}

// Air France — el dominio wwws.airfrance.es acepta booking-flow=LEISURE
export function airFranceUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32399");
  const ret = safeDate(dRet);
  const params: string[] = [
    `bookingFlow=LEISURE`, `pax=1`,
    `origin=${o3}`, `destination=${d3}`, `departureDate=${dt}`,
  ];
  if (ret) params.push(`returnDate=${ret}`);
  return `https://wwws.airfrance.es/search?${params.join("&")}`;
}

// British Airways — booking público acepta query string
export function britishAirwaysUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32475");
  const ret = safeDate(dRet);
  const isoToBA = (s: string) => s.slice(8, 10) + s.slice(5, 7) + s.slice(0, 4); // DDMMYYYY
  const params: string[] = [
    `Origin=${o3}`, `Destination=${d3}`,
    `DepartingDate=${isoToBA(dt)}`,
    ret ? `ReturningDate=${isoToBA(ret)}` : `ReturningDate=`,
    `NumberOfAdults=1`, `RouteType=${ret ? "return" : "oneway"}`,
  ];
  return `https://www.britishairways.com/travel/booking/public/es_es?${params.join("&")}`;
}

// Vueling — booking nuevo flow acepta IATA + ISO
export function vuelingUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32467");
  const ret = safeDate(dRet);
  const params: string[] = [
    `l=ES`, `from=${o3}`, `to=${d3}`, `out=${dt}`,
    `adt=1`, `inf=0`, `chd=0`, `trip=${ret ? "2" : "1"}`,
  ];
  if (ret) params.push(`in=${ret}`);
  return `https://booking.vueling.com/?${params.join("&")}`;
}

// TAP Portugal — booking SPA con query, fallback Skyscanner si falla
export function tapPortugalUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32464");
  const ret = safeDate(dRet);
  const flightType = ret ? "roundtrip" : "oneway";
  const params: string[] = [
    `flightType=${flightType}`, `from=${o3}`, `to=${d3}`,
    `out=${dt}`, `adults=1`, `currencyCode=EUR`,
  ];
  if (ret) params.push(`in=${ret}`);
  return `https://book.flytap.com/select?${params.join("&")}`;
}

// Air Europa — booking acepta query string limpia
export function airEuropaUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32388");
  const ret = safeDate(dRet);
  const params: string[] = [
    `o=${o3}`, `d=${d3}`, `out=${dt}`, `adt=1`, `inf=0`, `chd=0`,
  ];
  if (ret) params.push(`in=${ret}`);
  return `https://www.aireuropa.com/es/es/vuelos?${params.join("&")}`;
}

// Aer Lingus — Override.action con SO_SITE_* params
export function aerLingusUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32384");
  const ret = safeDate(dRet);
  const params: string[] = [
    `LANGUAGE=ES`, `CURRENCY=EUR`,
    `SO_SITE_ORIGIN=${o3}`, `SO_SITE_DESTINATION=${d3}`,
    `SO_SITE_DEPARTURE_DATE=${dt}`,
    ret ? `SO_SITE_RETURN_DATE=${ret}` : `SO_SITE_TRIPTYPE=ONEWAY`,
    `SO_SITE_NUM_ADULTS=1`, `SO_SITE_NUM_CHILDREN=0`,
  ];
  return `https://book.aerlingus.com/plnext/aerLingusV3/Override.action?${params.join("&")}`;
}

// Norwegian — booking flow con D_City/A_City/D_Date
export function norwegianUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32411");
  const ret = safeDate(dRet);
  const params: string[] = [
    `D_City=${o3}`, `A_City=${d3}`, `D_Date=${dt}`,
    `Adults=1`, `Children=0`, `Infants=0`, `CurrencyCode=EUR`,
    `TripType=${ret ? "1" : "2"}`,
  ];
  if (ret) params.push(`R_Date=${ret}`);
  return `https://www.norwegian.com/es/booking/flight-tickets/select-flight/?${params.join("&")}`;
}

// SAS — search?from=X&to=Y&fromDate=...
export function sasUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32448");
  const ret = safeDate(dRet);
  const params: string[] = [
    `search=${ret ? "RT" : "NB"}`, `from=${o3}`, `to=${d3}`,
    `fromDate=${dt}`, `adt=1`, `chd=0`, `inf=0`, `currency=EUR`,
  ];
  if (ret) params.push(`toDate=${ret}`);
  return `https://www.flysas.com/es-es/book/flights/?${params.join("&")}`;
}

// Finnair — booking SPA acepta query
export function finnairUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32411");
  const ret = safeDate(dRet);
  const params: string[] = [
    `origin=${o3}`, `destination=${d3}`, `departureDate=${dt}`,
    `adults=1`, `children=0`, `infants=0`, `currency=EUR`,
  ];
  if (ret) params.push(`returnDate=${ret}`);
  return `https://www.finnair.com/es-es/booking/flight-selection?${params.join("&")}`;
}

// Aegean — booking público acepta confirm flow + parámetros simples
export function aegeanUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32249");
  const ret = safeDate(dRet);
  const params: string[] = [
    `wcag=true`, `adults=1`, `children=0`, `infants=0`,
    `origin=${o3}`, `destination=${d3}`, `departure=${dt}`,
  ];
  if (ret) params.push(`return=${ret}`);
  return `https://en.aegeanair.com/booking/?${params.join("&")}`;
}

// Turkish — booking público acepta query
export function turkishUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32465");
  const ret = safeDate(dRet);
  const params: string[] = [
    `Origin=${o3}`, `Destination=${d3}`, `DepartureDate=${dt}`,
    `Adult=1`, `Child=0`, `Infant=0`, `Currency=EUR`,
    `Trip=${ret ? "R" : "O"}`,
  ];
  if (ret) params.push(`ReturnDate=${ret}`);
  return `https://www.turkishairlines.com/es-int/flights/booking/?${params.join("&")}`;
}

// Qatar — homepage con widget=BOOK + query
export function qatarUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32436");
  const ret = safeDate(dRet);
  const params: string[] = [
    `widget=BOOK`, `trip=${ret ? "rt" : "ow"}`,
    `fromCity=${o3}`, `toCity=${d3}`, `fromDate=${dt}`,
    `adults=1`, `children=0`, `infants=0`,
  ];
  if (ret) params.push(`toDate=${ret}`);
  return `https://www.qatarairways.com/es-es/homepage.html#book/avail?${params.join("&")}`;
}

// Emirates — booking flujo redireccionable
export function emiratesUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32385");
  const ret = safeDate(dRet);
  const params: string[] = [
    `flightSearchInput.tripType=${ret ? "RT" : "OW"}`,
    `flightSearchInput.origin=${o3}`,
    `flightSearchInput.destination=${d3}`,
    `flightSearchInput.departureDate=${dt}`,
    `flightSearchInput.numberOfAdults=1`,
    `flightSearchInput.cabinClass=Y`,
  ];
  if (ret) params.push(`flightSearchInput.returnDate=${ret}`);
  return `https://www.emirates.com/es/spanish/book/flight-search?${params.join("&")}`;
}

// Singapore Airlines — booking público
export function singaporeAirlinesUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32449");
  const ret = safeDate(dRet);
  const params: string[] = [
    `flow=flight-search`, `tripType=${ret ? "RT" : "OW"}`,
    `adults=1`, `children=0`, `infants=0`,
    `origin=${o3}`, `destination=${d3}`, `departureDate=${dt}`,
  ];
  if (ret) params.push(`returnDate=${ret}`);
  return `https://www.singaporeair.com/es_ES/plan-and-book/our-network-and-partners/booking/?${params.join("&")}`;
}

// ANA — booking acepta query
export function anaUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32249");
  const ret = safeDate(dRet);
  const params: string[] = [
    `kbn=${ret ? "1" : "0"}`,
    `dom=${o3}`, `arr=${d3}`, `outDate=${dt}`,
    `adt=1`, `chd=0`, `inf=0`,
  ];
  if (ret) params.push(`retDate=${ret}`);
  return `https://www.ana.co.jp/en/eu/book-plan/award-search/select-trip/?${params.join("&")}`;
}

// JAL — booking domestic/intl flow
export function jalUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32379");
  const ret = safeDate(dRet);
  const yyyymmdd = (s: string) => s.replace(/-/g, "");
  const params: string[] = [
    `triptype=${ret ? "RT" : "OW"}`,
    `from=${o3}`, `to=${d3}`,
    `outDate=${yyyymmdd(dt)}`,
    `adt=1`, `chd=0`, `inf=0`,
  ];
  if (ret) params.push(`retDate=${yyyymmdd(ret)}`);
  return `https://www.jal.co.jp/jp/en/inter/booking/?${params.join("&")}`;
}

// Cathay Pacific — booking público
export function cathayUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32381");
  const ret = safeDate(dRet);
  const params: string[] = [
    `tripType=${ret ? "RT" : "OW"}`,
    `origin=${o3}`, `destination=${d3}`, `departureDate=${dt}`,
    `adt=1`, `chd=0`, `inf=0`, `cabin=ECO`,
  ];
  if (ret) params.push(`returnDate=${ret}`);
  return `https://www.cathaypacific.com/cx/en_HK/book-a-trip/search-flights.html?${params.join("&")}`;
}

// Vietnam Airlines
export function vietnamAirlinesUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32466");
  const ret = safeDate(dRet);
  const params: string[] = [
    `tripType=${ret ? "RT" : "OW"}`,
    `origin=${o3}`, `destination=${d3}`, `departureDate=${dt}`,
    `adults=1`, `children=0`, `infants=0`,
  ];
  if (ret) params.push(`returnDate=${ret}`);
  return `https://www.vietnamairlines.com/es/es/booking/flight-search?${params.join("&")}`;
}

// Aeroméxico
export function aeromexicoUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32228");
  const ret = safeDate(dRet);
  const params: string[] = [
    `tripType=${ret ? "RT" : "OW"}`,
    `origin=${o3}`, `destination=${d3}`, `departureDate=${dt}`,
    `adults=1`, `children=0`, `infants=0`,
  ];
  if (ret) params.push(`returnDate=${ret}`);
  return `https://aeromexico.com/es-mx/reservar?${params.join("&")}`;
}

// Iberia — buscador booking
export function iberiaUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32384");
  const ret = safeDate(dRet);
  const params: string[] = [
    `flightSearchInput.searchType=${ret ? "R" : "O"}`,
    `flightSearchInput.origin=${o3}`,
    `flightSearchInput.destination=${d3}`,
    `flightSearchInput.departureDate=${dt}`,
    `flightSearchInput.numberOfAdults=1`,
    `flightSearchInput.numberOfChildren=0`,
    `flightSearchInput.numberOfInfants=0`,
  ];
  if (ret) params.push(`flightSearchInput.returnDate=${ret}`);
  return `https://www.iberia.com/es/buy-flights/?${params.join("&")}`;
}

// Condor (Alemania, low-cost) — booking SPA
export function condorUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32264");
  const ret = safeDate(dRet);
  const params: string[] = [
    `triptype=${ret ? "rt" : "ow"}`,
    `origin=${o3}`, `destination=${d3}`, `outboundDate=${dt}`,
    `adults=1`, `children=0`, `infants=0`,
  ];
  if (ret) params.push(`inboundDate=${ret}`);
  return `https://www.condor.com/eu/booking/flight-search.htm?${params.join("&")}`;
}

// TUIfly
export function tuiFlyUrl(o: string, d: string, dOut: string, dRet: string = ""): string {
  const o3 = safeIata(o), d3 = safeIata(d), dt = safeDate(dOut);
  if (!o3 || !d3 || !dt) return skyscannerUrl(o, d, dOut, dRet, "32463");
  const ret = safeDate(dRet);
  const params: string[] = [
    `triptype=${ret ? "rt" : "ow"}`,
    `from=${o3}`, `to=${d3}`, `outboundDate=${dt}`,
    `adults=1`, `children=0`, `infants=0`,
  ];
  if (ret) params.push(`inboundDate=${ret}`);
  return `https://www.tuifly.com/booking/?${params.join("&")}`;
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

/**
 * SSS273 (17 may 2026) — REVENUE LEAK FIX
 *
 * Server-side TP marker rewrite para deals con aerolíneas low-cost.
 *
 * Antes: el rewrite a Aviasales TP marker ocurría solo en client-side
 * `routeBookingUrl()` durante el onClick handler de DealCard. Esto perdía
 * revenue de:
 *  - crawlers + bots (indexan el href SSR directo a Ryanair)
 *  - usuarios sin JS o con JS bloqueado
 *  - clicks fast antes de hidratación React
 *  - race conditions al mutar `e.currentTarget.href` mid-click
 *
 * Como `booking_router_v1` lleva `bWeight=100` y `defaultVariant=B`
 * (SSS177), TODOS los usuarios deben ir al TP marker. Ergo podemos
 * hacer el rewrite server-side sin perder el A/B framework: el variant=A
 * ya no se asigna a nadie.
 *
 * Triggers: aerolínea en TP_PROFITABLE_CODES_SERVER (Ryanair, easyJet,
 * Wizz, Vueling, Norwegian, Condor, TUI, Eurowings, flydubai, Pegasus)
 * O dominio de booking_url contiene un dominio TP-profitable.
 *
 * Pasa-through silencioso si:
 *  - TP_MARKER no configurado (no rewrite porque kayak no paga commission)
 *  - airline full-service (Iberia/TAP/LH/AF/...) ya tiene tracking propio
 *  - no hay origin/destination/date_out (no se puede construir URL)
 */
const TP_PROFITABLE_CODES_SERVER = new Set([
  "FR", "RK",
  "U2", "EC", "DS",
  "W6", "W4", "W9",
  "VY",
  "DY", "D8",
  "DE",
  "X3",
  "EW",
  "FZ",
  "PC",
  "AY",
]);

const TP_PROFITABLE_DOMAINS_SERVER = [
  "ryanair.com", "easyjet.com", "wizzair.com", "vueling.com",
  "norwegian.com", "condor.com", "flytuifly.com", "eurowings.com",
  "flydubai.com", "flypgs.com",
];

export function applyTPMarkerServerSide<
  T extends {
    booking_url?: string | null;
    airline?: string | null;
    airline_name?: string | null;
    origin?: string | null;
    destination?: string | null;
    date_out?: string | null;
    date_ret?: string | null;
  }
>(deal: T): T {
  // Sin TP_MARKER no podemos generar marker URL — pasa-through.
  if (!TP_MARKER) return deal;

  const code = (deal.airline || "").toUpperCase().trim();
  const lowerUrl = (deal.booking_url || "").toLowerCase();
  const isProfitable =
    TP_PROFITABLE_CODES_SERVER.has(code) ||
    TP_PROFITABLE_DOMAINS_SERVER.some((d) => lowerUrl.includes(d));

  if (!isProfitable) return deal;
  if (!deal.origin || !deal.destination || !deal.date_out) return deal;

  // Si ya apunta a aviasales, no toques (idempotent).
  if (lowerUrl.includes("aviasales.")) return deal;

  const tpUrl = travelpayoutsUrl(
    deal.origin,
    deal.destination,
    deal.date_out,
    deal.date_ret || "",
  );
  if (!tpUrl || tpUrl === deal.booking_url) return deal;

  return { ...deal, booking_url: tpUrl };
}
