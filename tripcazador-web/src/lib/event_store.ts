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
  | "telegram_clicked"   // fase tt-TT4: link a Telegram clickeado
  // SSS61: funnel completo — instrumentación pendiente del HANDOFF
  | "landing_arrived"    // primer page_view de sesión con utm_*
  | "result_viewed"      // deal entra en viewport (IntersectionObserver)
  | "share_completed"    // share efectivo (no solo intent)
  | "favorite_added"     // heart click
  | "scroll_75"          // 75% de página scrolled
  | "concierge_view"     // landing /concierge
  | "concierge_click_pay" // CTA Stripe pago premium
  | "premium_cta_view"   // banner premium visible en viewport
  | "premium_cta_click"  // click en cualquier CTA premium
  | "concierge_promo_claimed" // SSS303: Premium reclama consulta gratis del mes
  | "premium_only_view"        // SSS305: free user ve un deal locked
  | "premium_only_unlock_click" // SSS305: click en "Únete Premium" desde locked card
  | "agencia_product_select"   // SSS305: select tipo vuelo|vuelo_hotel
  | "agencia_buy_click"        // SSS305: click submit form pre-Stripe
  | "agencia_refund_request"   // SSS305: cliente solicita refund garantía
  | "agencia_refund_submitted"; // SSS305: refund OK desde el panel

export interface TrackedEvent {
  ts: number;          // epoch ms
  type: EventType;
  visitor_id: string;  // hashed IP+UA (no PII)
  meta: Record<string, string | number | boolean | undefined>;
}

const RING_SIZE = 5000;        // último 5k eventos
const TTL_MS = 24 * 3600 * 1000; // 24h

// Store global (mismo proceso comparte ring)
const store: {
  ring: TrackedEvent[];
  idx: number;
  hydrated: boolean;
  hydratedAt: number;
} = (
  globalThis as unknown as {
    __tc_event_store?: { ring: TrackedEvent[]; idx: number; hydrated: boolean; hydratedAt: number };
  }
).__tc_event_store ?? { ring: [], idx: 0, hydrated: false, hydratedAt: 0 };

(globalThis as unknown as { __tc_event_store: typeof store }).__tc_event_store = store;

/**
 * SSS92→SSS94: hydrate ring desde data/events-recent.jsonl al primer access.
 *
 * Por qué: cada Vercel lambda arranca con el ring vacío. /api/track persiste
 * a GitHub (data/events-recent.jsonl, 1000 últimas líneas) pero
 * `aggregate24h()` solo leía in-memory → el panel/trending mostraba 0 eventos
 * o fallback estático aunque hubiera tráfico real.
 *
 * SSS94 fix: en Vercel `data/` está fuera del bundle (sólo se publica
 * `tripcazador-web/`). Hacemos fetch del raw URL de GitHub en lugar de fs
 * + cache 5 min. Para tests/SSR-local seguimos intentando fs como fallback.
 */
const GH_RAW_URL =
  "https://raw.githubusercontent.com/ERNESTOTALIB/tripcazador/main/data/events-recent.jsonl";

async function hydrateFromJsonlAsync() {
  const now = Date.now();
  // Cache: re-hidrata como mucho cada 5 min
  if (store.hydrated && now - store.hydratedAt < 5 * 60_000) return;
  // Marcar como hidratado en el primer intento para no encolar fetches paralelos
  store.hydrated = true;
  store.hydratedAt = now;

  let content = "";
  // 1) Vercel/edge: fetch raw GitHub (siempre disponible, repo público)
  try {
    const res = await fetch(GH_RAW_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) content = await res.text();
  } catch {
    /* fetch falló — try fs */
  }

  // 2) Fallback fs (tests locales o GH Actions checkout)
  if (!content) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs") as typeof import("fs");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require("path") as typeof import("path");
      const candidatePaths = [
        path.join(process.cwd(), "..", "data", "events-recent.jsonl"),
        path.join(process.cwd(), "data", "events-recent.jsonl"),
      ];
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          content = fs.readFileSync(p, "utf-8");
          break;
        }
      }
    } catch {
      /* fs no disponible — skip */
    }
  }

  if (!content) return;

  const seen = new Set<string>();
  for (const e of store.ring) {
    if (!e) continue;
    seen.add(`${e.ts}|${e.visitor_id}|${e.type}`);
  }

  let added = 0;
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed) as {
        ts: string | number;
        type: string;
        visitor: string;
        meta?: Record<string, string | number | boolean | undefined>;
      };
      const tsMs = typeof obj.ts === "string" ? Date.parse(obj.ts) : obj.ts;
      if (!Number.isFinite(tsMs)) continue;
      if (now - tsMs > TTL_MS) continue; // descarta >24h
      const key = `${tsMs}|${obj.visitor}|${obj.type}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const evt: TrackedEvent = {
        ts: tsMs,
        type: obj.type as EventType,
        visitor_id: obj.visitor,
        meta: obj.meta || {},
      };
      if (store.ring.length < RING_SIZE) {
        store.ring.push(evt);
      } else {
        store.ring[store.idx] = evt;
        store.idx = (store.idx + 1) % RING_SIZE;
      }
      added++;
    } catch {
      /* línea inválida — skip */
    }
  }
  if (added > 0) {
    // eslint-disable-next-line no-console
    console.log(`[event_store] hydrated ${added} events from JSONL`);
  }
}

// Wrapper sync que dispara el async fire-and-forget. La primera lambda call
// retorna ring vacío; la siguiente (post-fetch) ya tiene los eventos.
function hydrateFromJsonl() {
  void hydrateFromJsonlAsync();
}

export function trackEvent(e: TrackedEvent) {
  if (store.ring.length < RING_SIZE) {
    store.ring.push(e);
  } else {
    store.ring[store.idx] = e;
    store.idx = (store.idx + 1) % RING_SIZE;
  }
}

export function getRecentEvents(): TrackedEvent[] {
  // SSS92: hidratamos lazy desde JSONL la primera vez (cold start) o cada 5min
  hydrateFromJsonl();
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

  // SSS56e: by_type registra TODOS los event types — útil para
  // /api/admin/funnel que busca page_view/favorite_added/share/scroll_75/
  // deal_click/booking_url_opened independientemente del rename a *_24h.
  const byType: Record<string, number> = {};

  // SSS95: top_routes ahora pondera AMBOS deal_click (peso 5x) +
  // result_viewed (peso 1x) + booking_redirect (peso 10x). Antes solo
  // contaba deal_click → con tráfico bajo (1 click en 7d) top_routes
  // siempre tenía <3 entries y trending widget caía a fallback estático.
  // Con impressions las rutas más vistas suben aunque nadie haya clicado.
  const ROUTE_WEIGHT: Record<string, number> = {
    deal_click: 5,
    booking_redirect: 10,
    result_viewed: 1,
  };

  for (const e of events) {
    visitors.add(e.visitor_id);
    byType[e.type] = (byType[e.type] || 0) + 1;
    if (e.type === "page_view") totals.page_views_24h++;
    else if (e.type === "deal_click") {
      totals.deal_clicks_24h++;
    } else if (e.type === "search_submitted") totals.searches_24h++;
    else if (e.type === "booking_redirect") totals.booking_redirects_24h++;

    // Aggregate routes/airlines de cualquier evento con origin+destination
    const weight = ROUTE_WEIGHT[e.type];
    if (weight && e.meta.origin && e.meta.destination) {
      const route = `${e.meta.origin}→${e.meta.destination}`;
      routesMap.set(route, (routesMap.get(route) || 0) + weight);
      const airline = String(e.meta.airline_name || "?");
      if (airline !== "?") {
        airlinesMap.set(airline, (airlinesMap.get(airline) || 0) + weight);
      }
    }
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
    by_type: byType,
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
