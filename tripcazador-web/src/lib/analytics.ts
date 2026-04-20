/**
 * analytics.ts
 * ────────────
 * Helper tipado para emitir eventos a GA4 y (opcionalmente) Plausible.
 *
 * Diseño:
 *  - Nunca lanza excepciones. Si gtag no está presente (dev local sin GA_ID,
 *    o usuario bloqueando scripts) es un no-op.
 *  - Los eventos están tipados para que el componente no pueda emitir
 *    nombres arbitrarios — ayuda a mantener el schema consistente en GA.
 *  - Las props opcionales se serializan con `JSON.stringify` si tienen
 *    un tipo complejo (GA4 acepta string/number/boolean en params).
 */

export type AnalyticsEvent =
  | {
      name: "search_submitted";
      params: {
        origin: string;
        destination: string;
        date_out?: string;
        flex_days?: number;
        direct_only?: boolean;
        // "group" si origen o destino son grupos de aeropuertos, sino "airport"
        search_type: "airport" | "group";
      };
    }
  | {
      name: "result_clicked";
      params: {
        deal_id: string;
        origin: string;
        destination: string;
        price_eur: number;
        // posición del deal en la lista (1-indexed)
        position?: number;
      };
    }
  | {
      name: "booking_url_opened";
      params: {
        source: "deal_card" | "deal_detail" | "hotel_widget";
        destination: string;
        // para vuelos: precio y aerolínea; para hoteles: fechas
        price_eur?: number;
        airline?: string;
        checkin?: string;
        checkout?: string;
      };
    }
  | {
      // Creación de una alerta de precio (modal /components/PriceAlertModal).
      // Usamos el mismo modelo de destination "(any)" que search_submitted
      // para separar alertas por ruta vs "quiero cualquier chollo".
      name: "price_alert_created";
      params: {
        origin: string;
        destination: string;
        target_price: number | null;
      };
    }
  | {
      // Usuario marca/desmarca un deal como favorito (corazón en DealCard).
      name: "favorite_added" | "favorite_removed";
      params: {
        deal_id: string;
      };
    };

// Shape de gtag en runtime. No exponemos el tipo completo para no acoplarnos
// a @types/gtag.js — con este subset nos basta.
type GtagFn = (
  command: "event" | "config" | "consent" | "js",
  action: string,
  params?: Record<string, unknown>
) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    plausible?: (name: string, opts?: { props?: Record<string, unknown> }) => void;
  }
}

/**
 * Emite un evento a GA4 (y a Plausible si está presente).
 * Siempre seguro de llamar — si los trackers no cargaron, es no-op.
 */
export function track(event: AnalyticsEvent): void {
  // Guard: SSR (no window) o browser sin consent dado → silenciar.
  if (typeof window === "undefined") return;

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", event.name, event.params as Record<string, unknown>);
    }
  } catch {
    /* no-op — nunca queremos que un tracker rompa el flujo de usuario */
  }

  try {
    if (typeof window.plausible === "function") {
      window.plausible(event.name, { props: event.params as Record<string, unknown> });
    }
  } catch {
    /* no-op */
  }
}
