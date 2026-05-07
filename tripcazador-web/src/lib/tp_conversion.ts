/**
 * Travelpayouts conversion tracking — SSS83 (May 2026)
 *
 * Cuando un usuario clica un deal y va al partner, lanzamos un pixel para
 * que TP cuente la atribución correcta. También guarda evento en /api/track
 * para correlacionar con visitor_id de nuestro analytics.
 *
 * Doc oficial TP: https://support.travelpayouts.com/hc/en-us/articles/115002476193
 */

const TP_MARKER = process.env.NEXT_PUBLIC_TP_MARKER || "513030";

export interface TPConversionEvent {
  deal_id: string;
  city_from?: string;
  city_to?: string;
  price_eur?: number;
  source?: string; // 'ryanair', 'travelpayouts', etc
  partner_url?: string; // booking_url destino
}

/** Lanza tracking en client-side antes de redirect al partner */
export function trackPartnerClick(evt: TPConversionEvent): void {
  if (typeof window === "undefined") return;

  // 1) Travelpayouts conversion pixel (1×1 GIF)
  // El pixel sirve a TP para asociar el click con el marker, aunque el deal
  // haya venido de otra fuente (Ryanair, etc) — útil para hotels widget afiliado.
  try {
    const img = new Image();
    img.src = `https://tp.media/sender_v3.gif?marker=${encodeURIComponent(TP_MARKER)}&trs=&shmarker=${encodeURIComponent(TP_MARKER)}&deal_id=${encodeURIComponent(evt.deal_id)}&t=${Date.now()}`;
    img.style.display = "none";
    img.decoding = "async";
    img.loading = "lazy";
    img.alt = "";
    img.width = 1;
    img.height = 1;
  } catch {
    // ignore — pixel best effort
  }

  // 2) Internal /api/track para correlación
  try {
    const body = JSON.stringify({
      type: "deal_click",
      meta: {
        deal_id: evt.deal_id,
        city_from: evt.city_from || "",
        city_to: evt.city_to || "",
        price_eur: evt.price_eur || 0,
        source: evt.source || "",
        partner_url_host: evt.partner_url ? new URL(evt.partner_url).host : "",
      },
    });
    if ("sendBeacon" in navigator) {
      navigator.sendBeacon(
        "/api/track",
        new Blob([body], { type: "application/json" }),
      );
    } else {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    // ignore — analytics best effort
  }

  // 3) GA4 ecommerce event si gtag disponible
  // window.dataLayer.push permite que el GA4 estándar detecte el click
  // y atribuya conversión cross-domain al partner.
  try {
    interface DataLayerWindow extends Window {
      dataLayer?: Array<Record<string, unknown>>;
    }
    const w = window as DataLayerWindow;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({
      event: "select_item",
      ecommerce: {
        items: [
          {
            item_id: evt.deal_id,
            item_name: `${evt.city_from} → ${evt.city_to}`,
            item_category: evt.source || "flight",
            price: evt.price_eur || 0,
            currency: "EUR",
          },
        ],
      },
    });
  } catch {
    // ignore
  }
}
