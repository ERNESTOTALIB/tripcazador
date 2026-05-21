/**
 * carbon_offset.ts — SSS370 (21 may 2026)
 *
 * Calcula CO2 emissions de un vuelo + offset cost vía Wren/Patch.
 * Audience eco-conscious aprecia tener la opción visible en checkout.
 *
 * Sources:
 *   - ICAO Carbon Emissions Calculator (CO2 por pax-km class-adjusted)
 *   - Wren $0.014 per kg CO2 = ~€2.50/ton offset
 *   - Patch.io $0.020 per kg CO2 = ~€3.50/ton offset
 *
 * Revenue: 10-15% comisión sobre offset purchases via affiliate.
 *
 * Cálculos por defecto basados en clase Economy. Multiplicadores:
 *   - Economy: 1.0x
 *   - Premium Economy: 1.5x
 *   - Business: 3.0x
 *   - First: 4.0x
 */

const EARTH_RADIUS_KM = 6371;

// CO2 kg/pax-km (Economy class), basado en estudios IATA 2024
const CO2_PER_PAX_KM = {
  short_haul: 0.156, // <1500km — más takeoff/landing impact por km
  medium_haul: 0.131, // 1500-4000km
  long_haul: 0.115, // >4000km
};

const CLASS_MULTIPLIER = {
  economy: 1.0,
  premium_economy: 1.5,
  business: 3.0,
  first: 4.0,
};

export type CabinClass = keyof typeof CLASS_MULTIPLIER;

interface AirportCoord {
  iata: string;
  lat: number;
  lng: number;
}

/** Curated subset — top 30 airports. Producción: usar geo_data full backend. */
const AIRPORT_COORDS: AirportCoord[] = [
  { iata: "MAD", lat: 40.4983, lng: -3.5676 },
  { iata: "BCN", lat: 41.2974, lng: 2.0833 },
  { iata: "LIS", lat: 38.7813, lng: -9.1359 },
  { iata: "CDG", lat: 49.0097, lng: 2.5479 },
  { iata: "LHR", lat: 51.4700, lng: -0.4543 },
  { iata: "FCO", lat: 41.8003, lng: 12.2389 },
  { iata: "AMS", lat: 52.3105, lng: 4.7683 },
  { iata: "BER", lat: 52.3667, lng: 13.5033 },
  { iata: "FRA", lat: 50.0379, lng: 8.5622 },
  { iata: "ZRH", lat: 47.4647, lng: 8.5492 },
  { iata: "VIE", lat: 48.1102, lng: 16.5697 },
  { iata: "MXP", lat: 45.6306, lng: 8.7281 },
  { iata: "ATH", lat: 37.9364, lng: 23.9445 },
  { iata: "IST", lat: 41.2753, lng: 28.7519 },
  { iata: "DXB", lat: 25.2532, lng: 55.3657 },
  { iata: "JFK", lat: 40.6413, lng: -73.7781 },
  { iata: "LAX", lat: 33.9416, lng: -118.4085 },
  { iata: "MIA", lat: 25.7959, lng: -80.2870 },
  { iata: "GRU", lat: -23.4356, lng: -46.4731 },
  { iata: "EZE", lat: -34.8222, lng: -58.5358 },
  { iata: "SCL", lat: -33.3930, lng: -70.7858 },
  { iata: "CUN", lat: 21.0365, lng: -86.8771 },
  { iata: "MEX", lat: 19.4361, lng: -99.0719 },
  { iata: "BKK", lat: 13.6900, lng: 100.7501 },
  { iata: "DPS", lat: -8.7482, lng: 115.1672 },
  { iata: "NRT", lat: 35.7720, lng: 140.3929 },
  { iata: "HND", lat: 35.5494, lng: 139.7798 },
  { iata: "SIN", lat: 1.3644, lng: 103.9915 },
  { iata: "ICN", lat: 37.4602, lng: 126.4407 },
  { iata: "DEL", lat: 28.5562, lng: 77.1000 },
  { iata: "RAK", lat: 31.6069, lng: -8.0363 },
  { iata: "CAI", lat: 30.1219, lng: 31.4056 },
  { iata: "CPT", lat: -33.9648, lng: 18.6017 },
  { iata: "SYD", lat: -33.9399, lng: 151.1753 },
];

function findCoord(iata: string): AirportCoord | undefined {
  return AIRPORT_COORDS.find((c) => c.iata === iata.toUpperCase());
}

/** Haversine — distance in km between two points */
function haversineKm(a: AirportCoord, b: AirportCoord): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(x)));
}

export interface OffsetEstimate {
  distance_km: number;
  is_round_trip: boolean;
  co2_kg: number;
  cabin_class: CabinClass;
  offset_cost_eur: number;
  offset_provider: "wren" | "patch";
  /** % del precio del vuelo el offset representa (útil para CTA wording) */
  offset_pct_of_flight?: number;
}

interface CalculateOpts {
  origin: string;
  destination: string;
  roundTrip?: boolean;
  cabinClass?: CabinClass;
  /** Precio del vuelo €; usado para calcular ratio offset/flight */
  flightPriceEur?: number;
  provider?: "wren" | "patch";
}

const PROVIDER_RATE = {
  wren: 0.0014, // €/kg CO2 = 1.4€/ton
  patch: 0.0020, // €/kg CO2 = 2.0€/ton
};

export function calculateOffset(opts: CalculateOpts): OffsetEstimate | null {
  const from = findCoord(opts.origin);
  const to = findCoord(opts.destination);
  if (!from || !to) return null;

  const oneWay = haversineKm(from, to);
  const distance = opts.roundTrip ? oneWay * 2 : oneWay;

  const tier =
    oneWay < 1500
      ? "short_haul"
      : oneWay < 4000
      ? "medium_haul"
      : "long_haul";
  const co2PerKm = CO2_PER_PAX_KM[tier];

  const cabin = opts.cabinClass ?? "economy";
  const multiplier = CLASS_MULTIPLIER[cabin];
  const co2Kg = Math.round(distance * co2PerKm * multiplier);

  const provider = opts.provider ?? "wren";
  const offsetCost = Math.round(co2Kg * PROVIDER_RATE[provider] * 100) / 100;

  let offsetPct: number | undefined;
  if (opts.flightPriceEur && opts.flightPriceEur > 0) {
    offsetPct = Math.round((offsetCost / opts.flightPriceEur) * 1000) / 10;
  }

  return {
    distance_km: Math.round(distance),
    is_round_trip: opts.roundTrip ?? false,
    co2_kg: co2Kg,
    cabin_class: cabin,
    offset_cost_eur: offsetCost,
    offset_provider: provider,
    offset_pct_of_flight: offsetPct,
  };
}

/** Genera URL afiliado al partner. UTM tracking incluido. */
export function getOffsetCheckoutUrl(estimate: OffsetEstimate, dealId?: string): string {
  if (estimate.offset_provider === "wren") {
    const ref = process.env.NEXT_PUBLIC_WREN_REF || "tripcazador";
    const params = new URLSearchParams({
      ref,
      utm_source: "tripcazador",
      utm_medium: "co2_offset_cta",
      kg: String(estimate.co2_kg),
    });
    if (dealId) params.set("deal_id", dealId);
    return `https://www.wren.co/offset?${params.toString()}`;
  }
  // Patch
  const ref = process.env.NEXT_PUBLIC_PATCH_REF || "tripcazador";
  return `https://patch.io/?ref=${ref}&kg=${estimate.co2_kg}`;
}
