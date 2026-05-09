/**
 * booking_url_router.ts — YYY01 (May 2026)
 *
 * A/B test layer entre el `booking_url` original (deeplink directo aerolínea
 * que devuelve el worker) y un equivalente vía Aviasales con marker TP.
 *
 * Mecánica:
 *  - getVariant("booking_router_v1") decide A (directo) o B (TP) per-visitante
 *    determinístico via fnv1a hash de visitor_id.
 *  - Sólo se cambia la URL para low-cost donde sabemos que TP cobra commission
 *    (Ryanair/EasyJet/Wizz/Vueling/etc). Full-service (Iberia/TAP/Lufthansa/...)
 *    se dejan tal cual porque sus deeplinks ya pueden tener tracking propio.
 *  - Si el usuario no consintió analytics → devuelve URL directa (default A).
 *
 * Tracking: emite gtag event "booking_route_decision" con variant + airline_code
 * para poder medir CTR diferencial en GA4.
 *
 * Pure function: import desde DealCard / DealRow / cualquier link de booking.
 */

import { getVariant } from "@/lib/ab";
import { travelpayoutsUrl } from "@/lib/airline_links";

/** Aerolíneas low-cost donde Aviasales/Travelpayouts cobra €1-3 por booking. */
const TP_PROFITABLE_CODES = new Set([
  "FR", "RK",                  // Ryanair / Ryanair UK
  "U2", "EC", "DS",            // easyJet
  "W6", "W4", "W9",            // Wizz Air
  "VY",                        // Vueling
  "DY", "D8",                  // Norwegian
  "DE",                        // Condor
  "X3",                        // TUI fly
  "EW",                        // Eurowings
  "FZ",                        // flydubai
  "PC",                        // Pegasus
  "AY",                        // Finnair (low-cost subsidiary)
]);

const TP_PROFITABLE_DOMAINS = [
  "ryanair.com", "easyjet.com", "wizzair.com", "vueling.com",
  "norwegian.com", "condor.com", "flytuifly.com", "eurowings.com",
  "flydubai.com", "flypgs.com",
];

/**
 * Devuelve la URL final de booking, aplicando A/B test si procede.
 *
 * - Si variant A o no aplica → devuelve URL original.
 * - Si variant B y aerolínea TP-profitable → devuelve aviasales con marker.
 *
 * Llamar desde el onClick handler del link de booking (cliente).
 */
export interface RouteOpts {
  originalUrl: string;
  airlineCode?: string | null;
  origin?: string | null;
  destination?: string | null;
  dateOut?: string | null;
  dateRet?: string | null;
}

export function routeBookingUrl(opts: RouteOpts): {
  url: string;
  variant: "A" | "B";
  rerouted: boolean;
} {
  const { originalUrl, airlineCode, origin, destination, dateOut, dateRet } = opts;

  // Comprueba si esta aerolínea es TP-profitable. Doble check: por code IATA
  // y por dominio del original URL (defensa en profundidad si code está vacío).
  const code = (airlineCode || "").toUpperCase().trim();
  const lowerUrl = (originalUrl || "").toLowerCase();
  const isProfitable =
    TP_PROFITABLE_CODES.has(code) ||
    TP_PROFITABLE_DOMAINS.some((d) => lowerUrl.includes(d));

  if (!isProfitable || !origin || !destination || !dateOut) {
    return { url: originalUrl, variant: "A", rerouted: false };
  }

  const variant = getVariant("booking_router_v1");
  if (variant === "A") {
    return { url: originalUrl, variant: "A", rerouted: false };
  }

  // Variant B → aviasales con marker (si TP_MARKER configurado, si no fallback kayak)
  const tpUrl = travelpayoutsUrl(origin, destination, dateOut, dateRet || "");
  if (!tpUrl || tpUrl === originalUrl) {
    return { url: originalUrl, variant: "B", rerouted: false };
  }

  // Tracking GA4: registra que reescribimos la URL (cookie consent ya
  // chequeado dentro de getVariant, esto solo añade detalle).
  if (typeof window !== "undefined") {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag === "function") {
      try {
        w.gtag("event", "booking_route_decision", {
          variant: "B",
          airline_code: code || "?",
          origin,
          destination,
        });
      } catch {
        /* swallow */
      }
    }
  }

  return { url: tpUrl, variant: "B", rerouted: true };
}
