import { getDeals } from "@/lib/api";
import { DealRow } from "@/components/DealCard";
import { JsonLd } from "@/components/JsonLd";
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
}

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
  const { classification, region, cabin, max_price, sort, freshness } = searchParams;

  const data = await getDeals({
    classification: classification !== "Todos" ? classification : undefined,
    region: region !== "Todos" ? region : undefined,
    cabin: cabin !== "Todas" ? cabin : undefined,
    max_price: max_price ? parseInt(max_price) : undefined,
    limit: 200,
  });

  // F2: server-side sort (estable porque ISR cachea 5min)
  // NN2: aplicar freshness filter antes del sort
  const fresh = applyFreshness(data.deals, freshness);
  const deals = applySort(fresh, sort);
  const stats = data.stats;
  const activeSort = sort || "recent";
  const activeFreshness = freshness || "all";
  const filteredOut = data.deals.length - fresh.length;

  return (
    <div className="space-y-8">
      <JsonLd data={BREADCRUMB_JSONLD} />

      {/* Breadcrumbs visibles */}
      <nav aria-label="Migas de pan" className="flex items-center gap-2 text-sm text-gray-400">
        <a
          href="/"
          className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
        >
          Inicio
        </a>
        <span aria-hidden="true">/</span>
        <span className="text-white">Deals</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Todos los deals</h1>
        <p className="text-gray-400 mt-1">
          {stats.total} deals activos · Actualizado hace{" "}
          {Math.round(
            (Date.now() - new Date(data.generated_at).getTime()) / 60000
          )}{" "}
          min
        </p>
      </div>

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
                  href={`/deals${buildQuery({ ...searchParams, classification: cls })}`}
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
                  href={`/deals${buildQuery({ ...searchParams, cabin: c })}`}
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
                  href={`/deals${buildQuery({ ...searchParams, region: r })}`}
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
              href={`/deals${buildQuery({ ...searchParams, freshness: opt.id })}`}
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

        {/* Sort */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Ordenar:</span>
          {SORT_OPTIONS.map((opt) => (
            <a
              key={opt.id}
              href={`/deals${buildQuery({ ...searchParams, sort: opt.id })}`}
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
        <div className="space-y-3">
          {deals.map((deal) => (
            <DealRow key={deal.id} deal={deal} />
          ))}
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
