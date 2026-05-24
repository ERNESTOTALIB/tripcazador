import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  DESTINATIONS_SEASONAL,
  getDestinationBySlug,
  getRelatedDestinations,
  formatMonthList,
  monthName,
  type SeasonalEntry,
  type PriceLevel,
  type CrowdLevel,
} from "@/lib/seasonal_data";
import { JsonLd } from "@/components/JsonLd";

/**
 * /cuando-viajar/[slug] — MMMM01 (May 2026)
 *
 * Página detalle SEO. Server Component (sin event handlers JSX para
 * evitar regresión SSS143 — el linter check-rsc-event-handlers.mjs lo
 * verifica en CI). Si en el futuro hace falta una tabla interactiva
 * (filtros, etc.) extraer a un Client Component aparte.
 */

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return DESTINATIONS_SEASONAL.map((d) => ({ slug: d.slug }));
}

export const dynamicParams = false;
export const revalidate = 86400; // 24h

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const d = getDestinationBySlug(params.slug);
  if (!d) {
    return { title: "Destino no encontrado" };
  }
  const sweet = formatMonthList(d.sweetSpotMonths);
  const title = `Cuándo ir a ${d.name}: mejor mes 2026 — TripCazador`;
  const description =
    `Mes a mes para viajar a ${d.name}. Sweet-spot: ${sweet}. Clima, lluvia, crowds, precios y consejos cazador antes de comprar tu vuelo.`;
  return {
    title,
    description,
    alternates: { canonical: `/cuando-viajar/${d.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://tripcazador.com/cuando-viajar/${d.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// ────────────────────────────────────────────────────────────────────────
//  Helpers de presentación (puros, no event handlers)
// ────────────────────────────────────────────────────────────────────────

function priceLabel(p: PriceLevel): string {
  return p === "low" ? "Bajo" : p === "mid" ? "Medio" : "Alto";
}

function crowdLabel(c: CrowdLevel): string {
  return c === "low" ? "Bajo" : c === "mid" ? "Medio" : "Alto";
}

function priceClass(p: PriceLevel): string {
  return p === "low"
    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
    : p === "mid"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-rose-500/15 text-rose-300 border-rose-500/30";
}

function crowdClass(c: CrowdLevel): string {
  return c === "low"
    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
    : c === "mid"
      ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
      : "bg-rose-500/15 text-rose-300 border-rose-500/30";
}

function rainBars(mm: number): { fill: number; label: string } {
  const fill = Math.min(100, Math.round((mm / 350) * 100));
  return { fill, label: `${mm} mm` };
}

function tempColorFor(max: number): string {
  if (max < 5) return "text-sky-400";
  if (max < 15) return "text-sky-300";
  if (max < 22) return "text-emerald-300";
  if (max < 30) return "text-amber-300";
  return "text-rose-300";
}

// ────────────────────────────────────────────────────────────────────────
//  Page
// ────────────────────────────────────────────────────────────────────────

export default function CuandoViajarSlugPage({ params }: { params: Params }) {
  const d = getDestinationBySlug(params.slug);
  if (!d) notFound();

  const related = getRelatedDestinations(d.slug, 3);
  const sweetText = formatMonthList(d.sweetSpotMonths);
  const avoidText = formatMonthList(d.avoidMonths);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Cuándo ir a ${d.name}: mejor mes 2026`,
    description:
      `Guía mes a mes para viajar a ${d.name}. Sweet-spot: ${sweetText}. Clima, lluvia, crowds y precios reales.`,
    author: { "@type": "Organization", name: "TripCazador" },
    publisher: {
      "@type": "Organization",
      name: "TripCazador",
      logo: {
        "@type": "ImageObject",
        url: "https://tripcazador.com/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://tripcazador.com/cuando-viajar/${d.slug}`,
    },
    datePublished: "2026-05-01",
    dateModified: "2026-05-12",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Cuándo viajar",
        item: "https://tripcazador.com/cuando-viajar",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `Cuándo ir a ${d.name}`,
        item: `https://tripcazador.com/cuando-viajar/${d.slug}`,
      },
    ],
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />

      <nav className="text-xs text-gray-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>{" "}
        ›{" "}
        <Link href="/cuando-viajar" className="hover:text-amber-400">
          Cuándo viajar
        </Link>{" "}
        › {d.name}
      </nav>

      {/* HERO */}
      <header className="space-y-3">
        <div className="text-[10px] uppercase tracking-wider text-amber-400/80 font-mono">
          {d.region}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Cuándo ir a {d.name}: mes a mes
        </h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 text-sm">
            <span aria-hidden="true">✓</span>
            <span>
              Sweet-spot: <strong>{sweetText}</strong>
            </span>
          </span>
          {d.avoidMonths.length > 0 && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-200 text-sm">
              <span aria-hidden="true">✗</span>
              <span>
                Evitar: <strong>{avoidText}</strong>
              </span>
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          País: <span className="text-gray-300">{d.country}</span> ·
          Hubs:{" "}
          <span className="font-mono text-gray-300">
            {d.hubIATAs.join(" · ")}
          </span>
        </div>
      </header>

      {/* INTRO TEXT */}
      <section className="prose prose-invert max-w-none">
        {d.description.split("\n\n").map((para, i) => (
          <p key={i} className="text-gray-300 text-base leading-relaxed">
            {para}
          </p>
        ))}
      </section>

      {/* TABLE 12 MONTHS */}
      <section aria-labelledby="month-table-heading" className="space-y-3">
        <h2
          id="month-table-heading"
          className="text-2xl font-bold text-white"
        >
          Mes a mes
        </h2>
        <p className="text-sm text-gray-400">
          Cada fila resume clima, precio y multitudes para ese mes. Los meses{" "}
          <span className="text-amber-300 font-semibold">sweet-spot</span> y{" "}
          <span className="text-rose-300 font-semibold">a evitar</span> están
          resaltados.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" role="table">
            <caption className="sr-only">
              Resumen mensual de clima, precios y crowds para {d.name}
            </caption>
            <thead>
              <tr className="text-xs uppercase tracking-wider text-gray-500 border-b border-gray-800">
                <th scope="col" className="text-left py-3 pr-2 font-semibold">
                  Mes
                </th>
                <th scope="col" className="text-left py-3 px-2 font-semibold">
                  Temp °C
                </th>
                <th scope="col" className="text-left py-3 px-2 font-semibold">
                  Lluvia
                </th>
                <th scope="col" className="text-left py-3 px-2 font-semibold">
                  Precio
                </th>
                <th scope="col" className="text-left py-3 px-2 font-semibold">
                  Crowds
                </th>
                <th scope="col" className="text-left py-3 pl-2 font-semibold">
                  Nota
                </th>
              </tr>
            </thead>
            <tbody>
              {d.months.map((m: SeasonalEntry) => {
                const isSweet = d.sweetSpotMonths.includes(m.month);
                const isAvoid = d.avoidMonths.includes(m.month);
                const rb = rainBars(m.rainfallMm);
                return (
                  <tr
                    key={m.month}
                    className={`border-b border-gray-800/60 align-top ${
                      isSweet
                        ? "bg-amber-500/5"
                        : isAvoid
                          ? "bg-rose-500/5"
                          : ""
                    }`}
                  >
                    <th
                      scope="row"
                      className="py-3 pr-2 text-left font-semibold capitalize align-top whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-100">
                          {monthName(m.month)}
                        </span>
                        {isSweet && (
                          <span
                            aria-label="sweet spot"
                            className="text-amber-300 text-xs"
                          >
                            ★
                          </span>
                        )}
                        {isAvoid && (
                          <span
                            aria-label="evitar"
                            className="text-rose-300 text-xs"
                          >
                            ✗
                          </span>
                        )}
                      </div>
                    </th>
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className={tempColorFor(m.tempMax)}>
                        {m.tempMin}-{m.tempMax}°
                      </span>
                    </td>
                    <td className="py-3 px-2 min-w-[88px]">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-1.5 w-12 bg-gray-800 rounded-full overflow-hidden"
                          aria-hidden="true"
                        >
                          <div
                            className={`h-full rounded-full ${
                              m.rainfallMm > 200
                                ? "bg-rose-400"
                                : m.rainfallMm > 80
                                  ? "bg-sky-400"
                                  : "bg-emerald-400"
                            }`}
                            style={{ width: `${rb.fill}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">
                          {rb.label}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs border ${priceClass(m.priceLevel)}`}
                      >
                        {priceLabel(m.priceLevel)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs border ${crowdClass(m.crowdLevel)}`}
                      >
                        {crowdLabel(m.crowdLevel)}
                      </span>
                    </td>
                    <td className="py-3 pl-2 text-xs text-gray-300">
                      {m.notes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* SWEET-SPOT REASONING */}
      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-2">
        <h2 className="text-xl font-bold text-amber-200">
          ✓ Recomendación: viajar en {sweetText}
        </h2>
        <p className="text-sm text-gray-200">
          Estos meses ofrecen la mejor relación entre clima estable, lluvia
          baja y precios todavía razonables. Para {d.name},{" "}
          {d.sweetSpotMonths.length > 1
            ? "son las ventanas naturales del año entre temporada baja y pico"
            : "es la transición ideal antes del pico turístico"}
          . Reservar con 2-4 meses de antelación maximiza opciones.
        </p>
        <p className="text-sm text-gray-300">
          ¿Lo siguiente? Activa{" "}
          <Link href="/alertas" className="text-amber-300 hover:underline">
            alertas de precio
          </Link>{" "}
          para tu mes objetivo y revisa los{" "}
          <Link href="/deals" className="text-amber-300 hover:underline">
            chollos vigentes
          </Link>{" "}
          a {d.name}.
        </p>
      </section>

      {/* AVOID REASONING */}
      {d.avoidMonths.length > 0 && (
        <section className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-5 space-y-2">
          <h2 className="text-xl font-bold text-rose-200">
            ✗ Evitar: {avoidText}
          </h2>
          <p className="text-sm text-gray-200">
            Estos meses concentran las peores condiciones del año para{" "}
            {d.name}: pueden coincidir lluvia intensa, calor extremo, vientos
            o eventos locales que cierran rutas/atracciones. Aunque los vuelos
            sean más baratos, la experiencia se resiente. Si eres flexible y
            buscas budget, considera más bien las semanas justo antes o
            después.
          </p>
        </section>
      )}

      {/* HUBS / LINKS DESTINO */}
      <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 space-y-3">
        <h2 className="text-xl font-bold text-white">
          Aeropuertos de entrada
        </h2>
        <p className="text-sm text-gray-300">
          Los hubs principales para llegar a {d.name} son:
        </p>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {d.hubIATAs.map((iata) => (
            <li
              key={iata}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-700"
            >
              <span className="font-mono text-sm text-amber-300">{iata}</span>
              <span className="text-xs text-gray-400">aeropuerto</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href={`/destinos/${d.slug}`}
            className="px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-xs text-gray-100 transition-colors"
          >
            Guía completa /destinos/{d.slug} →
          </Link>
          <Link
            href={`/hoteles/${d.slug}`}
            className="px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-xs text-gray-100 transition-colors"
          >
            Hoteles en {d.name} →
          </Link>
          <Link
            href={`/deals?to=${encodeURIComponent(d.hubIATAs[0])}`}
            className="px-3 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs text-amber-200 transition-colors"
          >
            Chollos a {d.hubIATAs[0]} →
          </Link>
        </div>
      </section>

      {/* TIPS */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-white">
          Tips cazador para {d.name}
        </h2>
        <ul className="space-y-2">
          {d.tips.map((t, i) => (
            <li
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-900/40 border border-gray-800"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex-shrink-0"
              >
                {i + 1}
              </span>
              <span className="text-sm text-gray-200">{t}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* INTERNAL LINKS */}
      <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 space-y-3">
        <h2 className="text-xl font-bold text-white">
          Antes de comprar el vuelo
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <li>
            <Link
              href="/comparar-aerolineas"
              className="block px-3 py-2 rounded-lg bg-gray-900/60 hover:bg-gray-900 border border-gray-700 hover:border-amber-500/40 text-gray-200 hover:text-amber-300 transition-colors"
            >
              Comparativas head-to-head aerolíneas →
            </Link>
          </li>
          <li>
            <Link
              href="/seguro-viaje"
              className="block px-3 py-2 rounded-lg bg-gray-900/60 hover:bg-gray-900 border border-gray-700 hover:border-amber-500/40 text-gray-200 hover:text-amber-300 transition-colors"
            >
              Seguro de viaje (necesario long-haul) →
            </Link>
          </li>
          <li>
            <Link
              href="/calculadora"
              className="block px-3 py-2 rounded-lg bg-gray-900/60 hover:bg-gray-900 border border-gray-700 hover:border-amber-500/40 text-gray-200 hover:text-amber-300 transition-colors"
            >
              Calculadora de presupuesto →
            </Link>
          </li>
          <li>
            <Link
              href={`/deals?to=${encodeURIComponent(d.hubIATAs[0])}`}
              className="block px-3 py-2 rounded-lg bg-gray-900/60 hover:bg-gray-900 border border-gray-700 hover:border-amber-500/40 text-gray-200 hover:text-amber-300 transition-colors"
            >
              Chollos actuales a {d.name} →
            </Link>
          </li>
        </ul>
      </section>

      {/* RELATED DESTINATIONS */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="space-y-3">
          <h2
            id="related-heading"
            className="text-2xl font-bold text-white"
          >
            Mira también
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/cuando-viajar/${r.slug}`}
                className="group block rounded-xl border border-gray-800 hover:border-amber-500/40 p-4 bg-gray-900/40 hover:bg-gray-900/70 transition-colors"
              >
                <div className="text-[10px] uppercase tracking-wider text-amber-400/80 font-mono mb-1">
                  {r.region}
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  {r.name}
                </h3>
                <p className="mt-2 text-xs text-gray-400">
                  Sweet-spot:{" "}
                  <span className="text-amber-300">
                    {formatMonthList(r.sweetSpotMonths)}
                  </span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
