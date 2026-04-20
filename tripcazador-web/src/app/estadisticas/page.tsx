import type { Metadata } from "next";
import Link from "next/link";
import { getDeals } from "@/lib/api";
import { JsonLd } from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

/**
 * TripCazador — /estadisticas
 *
 * Página pública que publica métricas en vivo del motor: total de deals
 * activos, savings medio, distribución por región, top-5 destinos más
 * baratos, etc. Motivación:
 *   1. Transparencia — quien aterriza aquí ve que el site está vivo y hay
 *      chollos reales detrás.
 *   2. Contenido SEO nuevo — long tail queries como "cuántos vuelos baratos
 *      hay desde Madrid" tienen cero competencia.
 *   3. Señal social para enlaces desde blogs de viajes.
 *
 * ISR 30 min — las stats cambian al ritmo del worker, no necesitamos vivo-
 * vivo y así la página se sirve estática.
 */

export const metadata: Metadata = {
  title: "Estadísticas del motor — TripCazador",
  description:
    "Cuántos vuelos baratos está detectando TripCazador ahora mismo, savings medios, top destinos activos y distribución por región. Datos en vivo del radar.",
  alternates: { canonical: "/estadisticas" },
  openGraph: {
    title: "Estadísticas de TripCazador — datos en vivo",
    description:
      "Deals activos, savings medios y top destinos del radar TripCazador.",
    type: "website",
  },
};

export const revalidate = 1800; // 30 min

const BREADCRUMB_JSONLD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Estadísticas",
      item: `${SITE_URL}/estadisticas`,
    },
  ],
};

// Etiquetas humanas para los enums del backend.
const CABIN_LABEL: Record<string, string> = {
  economy: "Economy",
  premium_economy: "Premium Eco",
  business: "Business",
  first: "First",
};
const REGION_EMOJI: Record<string, string> = {
  Europa: "🇪🇺",
  "América del Norte": "🌎",
  "América del Sur": "🌎",
  Asia: "🌏",
  África: "🌍",
  Oceanía: "🌏",
  "Oriente Medio": "🌍",
  Caribe: "🏝️",
};

function fmtPrice(n: number | undefined): string {
  if (!n || !Number.isFinite(n)) return "—";
  return `${Math.round(n).toLocaleString("es-ES")} €`;
}
function fmtInt(n: number | undefined): string {
  if (!n && n !== 0) return "—";
  return Math.round(n).toLocaleString("es-ES");
}

export default async function EstadisticasPage() {
  const data = await getDeals({ limit: 250 });
  const { stats, deals, generated_at } = data;

  // Top 5 destinos por precio mínimo (cluster por destino IATA).
  const byDest = new Map<
    string,
    { city: string; country: string; min: number; count: number }
  >();
  for (const d of deals) {
    const k = d.destination || d.city_to;
    if (!k) continue;
    const cur = byDest.get(k);
    if (!cur) {
      byDest.set(k, {
        city: d.city_to || d.destination,
        country: d.country_to || "",
        min: d.price_eur,
        count: 1,
      });
    } else {
      cur.count += 1;
      if (d.price_eur < cur.min) cur.min = d.price_eur;
    }
  }
  const topCheap = Array.from(byDest.values())
    .sort((a, b) => a.min - b.min)
    .slice(0, 5);

  // Savings medio de los deals con savings > 0 (hay muchos con 0 cuando no
  // tenemos baseline — no inflamos la media artificialmente).
  const withSavings = deals.filter((d) => d.savings_pct > 0);
  const avgSavingsPct =
    withSavings.length > 0
      ? withSavings.reduce((s, d) => s + d.savings_pct, 0) / withSavings.length
      : 0;
  const avgSavingsEur =
    withSavings.length > 0
      ? withSavings.reduce((s, d) => s + d.savings_eur, 0) / withSavings.length
      : 0;

  // Deals por clasificación (orden: críticos primero).
  const clsOrder = ["CRÍTICO", "ERROR", "ANOMALÍA", "OFERTA", "NORMAL"];
  const clsRows = clsOrder
    .filter((k) => (stats.by_classification?.[k] ?? 0) > 0)
    .map((k) => ({ key: k, n: stats.by_classification[k] }));

  // Región — ordenada por N desc.
  const regionRows = Object.entries(stats.by_region || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const generatedLocal = generated_at
    ? new Date(generated_at).toLocaleString("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="space-y-10">
      <JsonLd data={BREADCRUMB_JSONLD} />

      <header className="space-y-3">
        <nav
          aria-label="Migas de pan"
          className="flex items-center gap-2 text-sm text-gray-400"
        >
          <Link
            href="/"
            className="hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
          >
            Inicio
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-white">Estadísticas</span>
        </nav>
        <h1 className="text-4xl sm:text-5xl font-bold text-white">
          Estadísticas del radar
        </h1>
        <p className="text-gray-300 max-w-2xl text-lg">
          Datos en vivo del motor: cuántas ofertas tenemos activas ahora,
          cuánto se ahorra de media y dónde están los vuelos más baratos.
        </p>
        {generatedLocal && (
          <p className="text-xs text-gray-500">
            Actualizado: <time dateTime={generated_at}>{generatedLocal}</time>{" "}
            · se recalcula cada 30 min.
          </p>
        )}
      </header>

      {/* KPI cards */}
      <section
        aria-labelledby="kpi-heading"
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <h2 id="kpi-heading" className="sr-only">
          Métricas principales
        </h2>
        <KpiCard
          label="Deals activos"
          value={fmtInt(stats.total)}
          sub={`${fmtInt(stats.flights)} vuelos · ${fmtInt(stats.hotels)} hoteles`}
        />
        <KpiCard
          label="Precio mínimo"
          value={fmtPrice(stats.price_min)}
          sub="Oferta más barata del radar"
        />
        <KpiCard
          label="Ahorro medio"
          value={avgSavingsPct > 0 ? `${avgSavingsPct.toFixed(0)}%` : "—"}
          sub={avgSavingsEur > 0 ? `≈ ${fmtPrice(avgSavingsEur)} por billete` : "Sin savings calculado"}
        />
        <KpiCard
          label="Verificadas"
          value={fmtInt(stats.verified_count)}
          sub="Deals con precio comprobado"
        />
      </section>

      {/* Top 5 destinos más baratos */}
      {topCheap.length > 0 && (
        <section
          aria-labelledby="top-cheap-heading"
          className="glass rounded-2xl p-6"
        >
          <h2
            id="top-cheap-heading"
            className="text-2xl font-bold text-white mb-1"
          >
            Top destinos más baratos ahora
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Ciudades con el precio mínimo más bajo en el radar en este
            momento. Click en cualquiera para ver todas sus ofertas activas.
          </p>
          <ol className="space-y-2 list-none m-0 p-0">
            {topCheap.map((d, i) => (
              <li
                key={`${d.city}-${i}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 hover:border-amber-500/40 bg-gray-900/40 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    aria-hidden="true"
                    className="w-8 h-8 shrink-0 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold grid place-items-center text-sm"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-white font-semibold truncate">
                      {d.city}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {d.country}
                      {d.count > 1 ? ` · ${d.count} ofertas` : ""}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-amber-400 font-bold text-lg">
                    {fmtPrice(d.min)}
                  </div>
                  <Link
                    href={`/deals?region=`}
                    className="text-xs text-gray-400 hover:text-amber-300"
                  >
                    Ver ofertas →
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Por clasificación */}
        {clsRows.length > 0 && (
          <section
            aria-labelledby="cls-heading"
            className="glass rounded-2xl p-6"
          >
            <h2 id="cls-heading" className="text-xl font-bold text-white mb-3">
              Por tipo de oferta
            </h2>
            <ul className="space-y-2 list-none m-0 p-0">
              {clsRows.map((r) => (
                <li
                  key={r.key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-300">{r.key}</span>
                  <span className="text-white font-semibold">{fmtInt(r.n)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Por región */}
        {regionRows.length > 0 && (
          <section
            aria-labelledby="region-heading"
            className="glass rounded-2xl p-6"
          >
            <h2 id="region-heading" className="text-xl font-bold text-white mb-3">
              Por región
            </h2>
            <ul className="space-y-2 list-none m-0 p-0">
              {regionRows.map(([region, n]) => (
                <li
                  key={region}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-300">
                    {REGION_EMOJI[region] ?? "🌐"} {region}
                  </span>
                  <span className="text-white font-semibold">{fmtInt(n)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Por cabina */}
        {Object.keys(stats.by_cabin || {}).length > 0 && (
          <section
            aria-labelledby="cabin-heading"
            className="glass rounded-2xl p-6"
          >
            <h2 id="cabin-heading" className="text-xl font-bold text-white mb-3">
              Por cabina
            </h2>
            <ul className="space-y-2 list-none m-0 p-0">
              {Object.entries(stats.by_cabin)
                .sort((a, b) => b[1] - a[1])
                .map(([cabin, n]) => (
                  <li
                    key={cabin}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-300">
                      {CABIN_LABEL[cabin] ?? cabin}
                    </span>
                    <span className="text-white font-semibold">{fmtInt(n)}</span>
                  </li>
                ))}
            </ul>
          </section>
        )}

        {/* Rango de precios */}
        <section
          aria-labelledby="price-heading"
          className="glass rounded-2xl p-6"
        >
          <h2 id="price-heading" className="text-xl font-bold text-white mb-3">
            Rango de precios
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-300">Mínimo</dt>
              <dd className="text-emerald-400 font-semibold">
                {fmtPrice(stats.price_min)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-300">Medio</dt>
              <dd className="text-white font-semibold">
                {fmtPrice(stats.price_avg)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-300">Máximo</dt>
              <dd className="text-red-300 font-semibold">
                {fmtPrice(stats.price_max)}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* CTA */}
      <section className="panel p-8">
        <h2 className="text-xl font-bold text-white mb-2">
          ¿Quieres que te avisemos cuando bajen?
        </h2>
        <p className="text-gray-300 mb-4">
          Crea una alerta de precio desde cualquier ficha de deal y te
          mandamos un email en cuanto el precio caiga por debajo de tu límite.
          Sin cuentas, sin spam.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/deals"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            Ver ofertas activas →
          </Link>
          <Link
            href="/destinos"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-700 hover:border-amber-400 text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            Explorar destinos
          </Link>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">
        {label}
      </div>
      <div className="text-3xl sm:text-4xl font-bold text-white mt-1 leading-tight">
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
