import { getDeals } from "@/lib/api";
import { DealsListClient } from "@/components/DealsListClient";
import { PriceAlertButton } from "@/components/PriceAlertModal";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Todos los deals",
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
  const { classification, region, cabin, max_price } = searchParams;

  const data = await getDeals({
    classification: classification !== "Todos" ? classification : undefined,
    region: region !== "Todos" ? region : undefined,
    cabin: cabin !== "Todas" ? cabin : undefined,
    max_price: max_price ? parseInt(max_price) : undefined,
    limit: 200,
  });

  const deals = data.deals;
  const stats = data.stats;

  // ItemList de los primeros 20 deals visibles. Google necesita position + url
  // en cada ListItem para Rich Results en buscador. Las Offer aquí son
  // ligeras (sin Flight) porque el detalle ya está en /deals/[id].
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListUnordered",
    numberOfItems: deals.length,
    itemListElement: deals.slice(0, 20).map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/deals/${d.id}`,
      name: `${d.city_from} → ${d.city_to} desde ${Math.round(d.price_eur)}€`,
    })),
  };

  return (
    <div className="space-y-8">
      <JsonLd data={[BREADCRUMB_JSONLD, itemListJsonLd]} />

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Todos los deals</h1>
          <p className="text-gray-400 mt-1">
            {stats.total} deals activos · Actualizado hace{" "}
            {Math.round(
              (Date.now() - new Date(data.generated_at).getTime()) / 60000,
            )}{" "}
            min
          </p>
        </div>
        <PriceAlertButton
          className="self-start"
          label="🔔 Avisarme cuando baje"
        />
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

      {/* Lista de deals con tabs de ordenación client-side */}
      <DealsListClient deals={deals} />
    </div>
  );
}

function buildQuery(params: Record<string, string | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && v !== "Todos" && v !== "Todas") {
      q.set(k, v);
    }
  }
  const str = q.toString();
  return str ? `?${str}` : "";
}
