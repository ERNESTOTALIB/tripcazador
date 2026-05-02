import { getDeals } from "@/lib/api";
import { DealCard, DealRow } from "@/components/DealCard";
import { JsonLd } from "@/components/JsonLd";
import { SectionHero } from "@/components/SectionHero";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { DealsViewToggle } from "@/components/DealsViewToggle";
import { DealsFilterDrawer } from "@/components/DealsFilterDrawer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Todos los deals — TripCazador",
  description:
    "Filtra y explora todos los chollos de vuelo activos: error fares, Business barato, por región, precio y más.",
  alternates: { canonical: "/deals" },
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Deals", item: `${SITE_URL}/deals` },
  ],
};

export const revalidate = 300; // ISR 5 minutos

interface SearchParams {
  classification?: string;
  region?: string;
  cabin?: string;
  max_price?: string;
  sort?: string;
  freshness?: string;  // "all" | "fresh" (≤24h) | "today" (≤8h)
  // VV7 — params del searchbar de la home
  origin?: string;
  destination?: string;
  date?: string;
  // HHH2 — date range filter
  date_from?: string;
  date_to?: string;
  // III2 — paginación
  page?: string;
  // JJJ2 — drawer filters
  max_stops?: string;
  max_duration_min?: string;
}

const PAGE_SIZE = 24;

// NN2 fase nn: filtros de frescura. "fresh" oculta deals que llevarían el chip
// rojo "Posiblemente caducado" (>72h) y los amber "Visto Hace Xd" (>24h).
const FRESHNESS_OPTIONS: { id: string; label: string; maxHours: number | null }[] = [
  { id: "all", label: "Todos", maxHours: null },
  { id: "fresh", label: "🟢 Frescos (24h)", maxHours: 24 },
  { id: "today", label: "🔥 Hoy (8h)", maxHours: 8 },
];

// F2 fase ii: opciones de ordenación. URL state preservada para SEO/share.
const SORT_OPTIONS: { id: string; label: string }[] = [
  { id: "recent", label: "Más recientes" },
  { id: "cheapest", label: "Más baratos" },
  { id: "savings", label: "Mayor descuento" },
  { id: "score", label: "Mejor puntuación" },
];

function applyFreshness(deals: import("@/lib/api").Deal[], freshness: string | undefined): import("@/lib/api").Deal[] {
  const opt = FRESHNESS_OPTIONS.find((f) => f.id === freshness);
  if (!opt || opt.maxHours === null) return deals;
  const now = Date.now();
  const maxMs = opt.maxHours * 3600_000;
  return deals.filter((d) => {
    if (!d.found_at) return true;  // sin timestamp, no filtramos
    return now - new Date(d.found_at).getTime() <= maxMs;
  });
}

function applySort(deals: import("@/lib/api").Deal[], sort: string | undefined): import("@/lib/api").Deal[] {
  const arr = [...deals];
  switch (sort) {
    case "cheapest":
      return arr.sort((a, b) => a.price_eur - b.price_eur);
    case "savings":
      return arr.sort((a, b) => (b.savings_pct || 0) - (a.savings_pct || 0));
    case "score":
      return arr.sort((a, b) => (b.score || 0) - (a.score || 0));
    case "recent":
    default:
      return arr.sort((a, b) => {
        const tA = new Date(a.found_at || 0).getTime();
        const tB = new Date(b.found_at || 0).getTime();
        return tB - tA;
      });
  }
}

// Opciones de filtro
const REGIONS = [
  "Todos",
  "Europa",
  "Asia",
  "América Norte",
  "América Sur",
  "Caribe",
  "Oriente Medio",
  "África",
  "Oceanía",
];
const CLASSIFICATIONS = ["Todos", "CRÍTICO", "ERROR", "ANOMALÍA", "OFERTA"];
const CABINS = ["Todas", "economy", "business", "premium_economy", "first"];

export default async function DealsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { classification, region, cabin, max_price, sort, freshness, origin, destination, date, date_from, date_to, page, max_stops, max_duration_min } = searchParams;

  const data = await getDeals({
    classification: classification !== "Todos" ? classification : undefined,
    region: region !== "Todos" ? region : undefined,
    cabin: cabin !== "Todas" ? cabin : undefined,
    max_price: max_price ? parseInt(max_price) : undefined,
    limit: 200,
  });

  // VV7: filtros de la searchbar de la home — match exact por IATA + mes
  let scoped = data.deals;
  if (origin) {
    const o = origin.toUpperCase();
    scoped = scoped.filter((d) => d.origin === o);
  }
  if (destination) {
    const dest = destination.toUpperCase();
    scoped = scoped.filter((d) => d.destination === dest);
  }
  if (date) {
    // formato YYYY-MM-DD; filtramos por mes para tolerar fechas flex.
    const monthPrefix = date.slice(0, 7); // YYYY-MM
    scoped = scoped.filter((d) => (d.date_out || "").startsWith(monthPrefix));
  }
  // HHH2 — date range filter (gana sobre date legacy si ambos están presentes)
  if (date_from || date_to) {
    scoped = scoped.filter((d) => {
      const dt = d.date_out || "";
      if (!dt) return false;
      if (date_from && dt < date_from) return false;
      if (date_to && dt > date_to) return false;
      return true;
    });
  }

  // JJJ2 — drawer filters (max_stops + max_duration)
  if (max_stops !== undefined && max_stops !== "") {
    const ms = parseInt(max_stops);
    if (Number.isFinite(ms) && ms < 9) {
      scoped = scoped.filter((d) => (d.stops ?? 9) <= ms);
    }
  }
  if (max_duration_min !== undefined && max_duration_min !== "") {
    const md = parseInt(max_duration_min);
    if (Number.isFinite(md) && md > 0) {
      scoped = scoped.filter((d) => (d.duration_min ?? 0) === 0 || (d.duration_min ?? 0) <= md);
    }
  }

  // F2: server-side sort (estable porque ISR cachea 5min)
  // NN2: aplicar freshness filter antes del sort
  const fresh = applyFreshness(scoped, freshness);
  const allDeals = applySort(fresh, sort);
  const stats = data.stats;
  const activeSort = sort || "recent";
  const activeFreshness = freshness || "all";
  const filteredOut = data.deals.length - fresh.length;

  // III2 — paginación
  const totalPages = Math.max(1, Math.ceil(allDeals.length / PAGE_SIZE));
  const requestedPage = Math.max(1, Math.min(totalPages, parseInt(page || "1") || 1));
  const startIdx = (requestedPage - 1) * PAGE_SIZE;
  const deals = allDeals.slice(startIdx, startIdx + PAGE_SIZE);
  const hasPagination = totalPages > 1;

  const minutesAgo = Math.round(
    (Date.now() - new Date(data.generated_at).getTime()) / 60000
  );

  return (
    <div className="space-y-8">
      <JsonLd data={BREADCRUMB_JSONLD} />

      {/* fase vv VV5 — Hero sky en lugar de header dark plano. Breadcrumb
          textual eliminado en VV11 (el hero ya da contexto + JSON-LD intacto). */}
      <SectionHero
        badge={`${stats.total} deals activos · Actualizado hace ${minutesAgo} min`}
        title={
          <>
            Todos los <em>chollos</em>
          </>
        }
        subtitle="Filtra por región, cabina o precio. Lista completa en tiempo real."
      />

      {/* Filtros */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <div className="flex flex-wrap gap-4">
          {/* Clasificación */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
              Tipo
            </label>
            <div className="flex flex-wrap gap-2">
              {CLASSIFICATIONS.map((cls) => (
                <a
                  key={cls}
                  href={`/deals${buildQuery({ ...searchParams, classification: cls, page: undefined })}`}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    (cls === "Todos" && !classification) ||
                    classification === cls
                      ? "bg-amber-500 text-black font-semibold"
                      : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  {cls === "CRÍTICO" ? "🔥 Error Fares" :
                   cls === "ERROR" ? "⚡ Posibles Errores" :
                   cls === "ANOMALÍA" ? "⚠️ Anomalías" :
                   cls === "OFERTA" ? "💰 Ofertas" : cls}
                </a>
              ))}
            </div>
          </div>

          {/* Cabina */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
              Cabina
            </label>
            <div className="flex flex-wrap gap-2">
              {CABINS.map((c) => (
                <a
                  key={c}
                  href={`/deals${buildQuery({ ...searchParams, cabin: c, page: undefined })}`}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    (c === "Todas" && !cabin) || cabin === c
                      ? "bg-amber-500 text-black font-semibold"
                      : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  {c === "business" ? "👑 Business" :
                   c === "economy" ? "Economy" :
                   c === "premium_economy" ? "Premium Eco" :
                   c === "first" ? "First" : c}
                </a>
              ))}
            </div>
          </div>

          {/* Región */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
              Región
            </label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <a
                  key={r}
                  href={`/deals${buildQuery({ ...searchParams, region: r, page: undefined })}`}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    (r === "Todos" && !region) || region === r
                      ? "bg-amber-500 text-black font-semibold"
                      : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  {r}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* F2 + NN2: Sort + Freshness tabs en una fila */}
      <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 space-y-3">
        {/* Freshness filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Frescura:</span>
          {FRESHNESS_OPTIONS.map((opt) => (
            <a
              key={opt.id}
              href={`/deals${buildQuery({ ...searchParams, freshness: opt.id, page: undefined })}`}
              aria-current={activeFreshness === opt.id ? "true" : undefined}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all min-h-[36px] inline-flex items-center ${
                activeFreshness === opt.id
                  ? "bg-amber-500 text-black font-semibold"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {opt.label}
            </a>
          ))}
          {filteredOut > 0 && (
            <span className="text-xs text-gray-500 ml-2">
              ({filteredOut} ocultos por antigüedad)
            </span>
          )}
        </div>

        {/* HHH2 — date range filter */}
        <DateRangeFilter />

        {/* Sort */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Ordenar:</span>
          {SORT_OPTIONS.map((opt) => (
            <a
              key={opt.id}
              href={`/deals${buildQuery({ ...searchParams, sort: opt.id, page: undefined })}`}
              aria-current={activeSort === opt.id ? "true" : undefined}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all min-h-[36px] inline-flex items-center ${
                activeSort === opt.id
                  ? "bg-amber-500 text-black font-semibold"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {opt.label}
            </a>
          ))}
        </div>
      </div>

      {/* Lista de deals */}
      {deals.length > 0 ? (
        <div data-deals-view-root data-deals-view="list">
          {/* III2 + JJJ1 + JJJ2 — Resumen + paginación + toggle vista + drawer */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-400 mb-4">
            <div>
              Mostrando <span className="text-white font-semibold">{startIdx + 1}–{Math.min(startIdx + PAGE_SIZE, allDeals.length)}</span> de{" "}
              <span className="text-white font-semibold">{allDeals.length}</span> chollos
              {hasPagination && (
                <span className="ml-2 text-gray-500">· Página {requestedPage}/{totalPages}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DealsFilterDrawer />
              <DealsViewToggle />
            </div>
          </div>

          {/* List view — visible cuando data-deals-view=list */}
          <div className="space-y-3 deals-view-list">
            {deals.map((deal) => (
              <DealRow key={deal.id} deal={deal} />
            ))}
          </div>

          {/* JJJ1 — Grid view — visible cuando data-deals-view=grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 deals-view-grid">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>

          {/* III2 — paginación bottom */}
          {hasPagination && (
            <div className="mt-6">
              <Pagination
                currentPage={requestedPage}
                totalPages={totalPages}
                searchParams={searchParams}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg">Sin deals con estos filtros</p>
          <a href="/deals" className="text-amber-400 hover:underline mt-2 block">
            Ver todos los deals →
          </a>
        </div>
      )}
    </div>
  );
}

/**
 * III2 — Pagination component. Server component sin estado, todo via URL.
 * Estrategia: muestra prev/first/window-around-current/last/next con elipsis.
 */
function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: SearchParams;
}) {
  const pageHref = (n: number) => `/deals${buildQuery({ ...searchParams, page: String(n) })}`;

  // Window de 5 paginas centrada (con clamp a edges)
  const window: number[] = [];
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) window.push(i);

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 pt-6"
      aria-label="Paginación"
    >
      {currentPage > 1 ? (
        <a
          href={pageHref(currentPage - 1)}
          rel="prev"
          className="px-3 py-2 min-h-[40px] inline-flex items-center rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold transition-colors"
        >
          ← Anterior
        </a>
      ) : (
        <span className="px-3 py-2 min-h-[40px] inline-flex items-center rounded-lg bg-gray-900 text-gray-600 text-sm font-semibold cursor-not-allowed">
          ← Anterior
        </span>
      )}

      {start > 1 && (
        <>
          <a href={pageHref(1)} className="px-3 py-2 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm">
            1
          </a>
          {start > 2 && <span className="text-gray-600 px-1">…</span>}
        </>
      )}

      {window.map((n) => (
        <a
          key={n}
          href={pageHref(n)}
          aria-current={n === currentPage ? "page" : undefined}
          className={`px-3 py-2 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
            n === currentPage
              ? "bg-amber-500 text-black"
              : "bg-gray-800 hover:bg-gray-700 text-white"
          }`}
        >
          {n}
        </a>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-gray-600 px-1">…</span>}
          <a href={pageHref(totalPages)} className="px-3 py-2 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm">
            {totalPages}
          </a>
        </>
      )}

      {currentPage < totalPages ? (
        <a
          href={pageHref(currentPage + 1)}
          rel="next"
          className="px-3 py-2 min-h-[40px] inline-flex items-center rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold transition-colors"
        >
          Siguiente →
        </a>
      ) : (
        <span className="px-3 py-2 min-h-[40px] inline-flex items-center rounded-lg bg-gray-900 text-gray-600 text-sm font-semibold cursor-not-allowed">
          Siguiente →
        </span>
      )}
    </nav>
  );
}

function buildQuery(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && v !== "Todos" && v !== "Todas" && v !== "all") {
      q.set(k, v);
    }
  }
  const str = q.toString();
  return str ? `?${str}` : "";
}
