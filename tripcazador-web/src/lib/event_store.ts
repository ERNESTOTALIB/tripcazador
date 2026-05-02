/**
 * event_store.ts — fase kk K2
 *
 * Almacén in-memory de eventos analytics. Vive en runtime Node de Vercel
 * (no edge — necesitamos persistir cross-request en la misma instancia).
 *
 * Limitaciones conocidas:
 *  - Vercel Lambda concurrency: cada instance tiene su propio store; los
 *    eventos se distribuyen y los totales se suman aproximadamente.
 *  - Reset al deploy nuevo (eventos pre-deploy se pierden).
 *  - Para producción long-term: migrar a Vercel KV / Upstash Redis.
 *
 * Para el panel del owner (uso bajo volumen, refresh 30s) este store es
 * suficiente para mostrar tendencias y top-N. Las cifras absolutas son
 * aproximadas.
 */

export type EventType =
  | "page_view"
  | "deal_click"
  | "search_submitted"
  | "booking_redirect"
  | "newsletter_signup"
  | "alert_created"
  | "calc_used"          // fase tt-TT4: alguna calculadora usada
  | "share_clicked"      // fase tt-TT4: share button clickeado
  | "telegram_clicked";  // fase tt-TT4: link a Telegram clickeado

export interface TrackedEvent {
  ts: number;          // epoch ms
  type: EventType;
  visitor_id: string;  // hashed IP+UA (no PII)
  meta: Record<string, string | number | boolean | undefined>;
}

const RING_SIZE = 5000;        // último 5k eventos
const TTL_MS = 24 * 3600 * 1000; // 24h

// Store global (mismo proceso comparte ring)
const store: { ring: TrackedEvent[]; idx: number } = (
  globalThis as unknown as { __tc_event_store?: { ring: TrackedEvent[]; idx: number } }
).__tc_event_store ?? { ring: [], idx: 0 };

(globalThis as unknown as { __tc_event_store: typeof store }).__tc_event_store = store;

export function trackEvent(e: TrackedEvent) {
  if (store.ring.length < RING_SIZE) {
    store.ring.push(e);
  } else {
    store.ring[store.idx] = e;
    store.idx = (store.idx + 1) % RING_SIZE;
  }
}

export function getRecentEvents(): TrackedEvent[] {
  const now = Date.now();
  return store.ring
    .filter((e) => e && now - e.ts < TTL_MS)
    .sort((a, b) => b.ts - a.ts);
}

export function aggregate24h() {
  const events = getRecentEvents();
  const totals = {
    page_views_24h: 0,
    deal_clicks_24h: 0,
    searches_24h: 0,
    booking_redirects_24h: 0,
    unique_visitors_24h: 0,
  };
  const visitors = new Set<string>();
  const routesMap = new Map<string, number>();
  const airlinesMap = new Map<string, number>();

  for (const e of events) {
    visitors.add(e.visitor_id);
    if (e.type === "page_view") totals.page_views_24h++;
    else if (e.type === "deal_click") {
      totals.deal_clicks_24h++;
      const route = `${e.meta.origin || "?"}→${e.meta.destination || "?"}`;
      routesMap.set(route, (routesMap.get(route) || 0) + 1);
      const airline = String(e.meta.airline_name || "?");
      airlinesMap.set(airline, (airlinesMap.get(airline) || 0) + 1);
    }
    else if (e.type === "search_submitted") totals.searches_24h++;
    else if (e.type === "booking_redirect") totals.booking_redirects_24h++;
  }
  totals.unique_visitors_24h = visitors.size;

  // Conversión heurística: estimamos comisión 3% sobre AOV €120 por booking_redirect
  const ctr = totals.page_views_24h > 0
    ? totals.deal_clicks_24h / totals.page_views_24h
    : 0;
  const bookingRate = totals.deal_clicks_24h > 0
    ? totals.booking_redirects_24h / totals.deal_clicks_24h
    : 0;
  const estimatedCommission = totals.booking_redirects_24h * 120 * 0.03 * 0.05;
  // El último 0.05 = ~5% de los redirects se convierten en booking real (estimación)

  const top_routes = Array.from(routesMap.entries())
    .map(([route, clicks]) => ({ route, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  const top_airlines = Array.from(airlinesMap.entries())
    .map(([airline, clicks]) => ({ airline, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  const recent_events = events.slice(0, 20).map((e) => ({
    ts: new Date(e.ts).toISOString(),
    type: e.type,
    meta: Object.entries(e.meta).map(([k, v]) => `${k}=${v}`).join(" · "),
  }));

  return {
    totals,
    conversion: {
      click_through_rate: Math.round(ctr * 1000) / 1000,
      booking_rate: Math.round(bookingRate * 1000) / 1000,
      estimated_commission_eur: Math.round(estimatedCommission * 100) / 100,
    },
    top_routes,
    top_airlines,
    recent_events,
  };
}
