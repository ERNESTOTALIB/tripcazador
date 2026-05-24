import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  NEIGHBORHOOD_COMPARISONS,
  getNeighborhoodComparisonBySlug,
  getRelatedNeighborhoodComparisons,
} from "@/lib/neighborhood_comparisons";
import { buildBookingUrl } from "@/lib/hotel_helpers";
import { JsonLd } from "@/components/JsonLd";
import { NewsletterSignup } from "@/components/NewsletterSignup";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return NEIGHBORHOOD_COMPARISONS.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;
export const revalidate = 86400; // 24h

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const c = getNeighborhoodComparisonBySlug(params.slug);
  if (!c) return { title: "Comparativa no encontrada" };
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `/comparar-barrios/${c.slug}` },
    openGraph: {
      title: c.title,
      description: c.description,
      type: "article",
      url: `https://tripcazador.com/comparar-barrios/${c.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: c.title,
      description: c.description,
    },
  };
}

export default function NeighborhoodComparisonPage({
  params,
}: {
  params: Params;
}) {
  const c = getNeighborhoodComparisonBySlug(params.slug);
  if (!c) notFound();

  const aWins = c.criteria.filter((cr) => cr.winner === "a").length;
  const bWins = c.criteria.filter((cr) => cr.winner === "b").length;
  const ties = c.criteria.filter((cr) => cr.winner === "tie").length;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.title,
    description: c.description,
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
      "@id": `https://tripcazador.com/comparar-barrios/${c.slug}`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: "https://tripcazador.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Hoteles",
        item: "https://tripcazador.com/hoteles",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Comparar barrios",
        item: "https://tripcazador.com/comparar-barrios",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: `${c.a.name} vs ${c.b.name} (${c.cityName})`,
        item: `https://tripcazador.com/comparar-barrios/${c.slug}`,
      },
    ],
  };

  const related = getRelatedNeighborhoodComparisons(c.slug, 4);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />

      <nav className="text-xs text-gray-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>{" "}
        ›{" "}
        <Link href="/hoteles" className="hover:text-amber-400">Hoteles</Link>{" "}
        ›{" "}
        <Link href="/comparar-barrios" className="hover:text-amber-400">
          Comparar barrios
        </Link>{" "}
        › {c.a.name} vs {c.b.name}
      </nav>

      <header>
        <div className="text-xs uppercase tracking-wider text-amber-400/80 font-mono mb-2">
          {c.cityName}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          {c.a.emoji} {c.a.name} vs {c.b.name} {c.b.emoji}
        </h1>
        <p className="mt-3 text-gray-300 text-lg">{c.description}</p>
        <div className="mt-2 text-xs text-gray-500">
          Temporada:{" "}
          <span className="font-mono text-gray-400">{c.seasonContext}</span>
        </div>
      </header>

      {/* Side-by-side cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[c.a, c.b].map((side) => (
          <div
            key={side.name}
            className="rounded-xl border border-gray-800 p-5 bg-gray-900/40"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl" aria-hidden="true">
                {side.emoji}
              </span>
              <div>
                <div className="text-lg font-bold text-white">{side.name}</div>
                <div className="text-xs text-gray-400">{side.vibe}</div>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-4">{side.tagline}</p>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <dt className="text-gray-500">Hotel 3★ medio</dt>
              <dd className="text-gray-200 font-mono">
                €{side.avgPriceEur}/noche
              </dd>
              <dt className="text-gray-500">Hotel 4★ medio</dt>
              <dd className="text-gray-200 font-mono">
                €{side.avgPrice4starEur}/noche
              </dd>
              <dt className="text-gray-500">Ideal para</dt>
              <dd className="text-gray-300">{side.bestFor}</dd>
              <dt className="text-gray-500">Al centro</dt>
              <dd className="text-gray-300">{side.centerDistance}</dd>
            </dl>
          </div>
        ))}
      </section>

      {/* Criterios head-to-head */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">
          Comparativa por criterios
        </h2>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-gray-400 border-b border-gray-800">
                <th className="text-left py-2 pr-3">Criterio</th>
                <th className="text-center py-2 px-2">{c.a.name}</th>
                <th className="text-center py-2 px-2">{c.b.name}</th>
                <th className="text-left py-2 pl-3">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {c.criteria.map((cr) => (
                <tr key={cr.label} className="border-b border-gray-900">
                  <td className="py-3 pr-3 text-gray-200 font-medium">
                    {cr.label}
                  </td>
                  <td
                    className={`text-center font-mono ${
                      cr.winner === "a"
                        ? "text-amber-400 font-bold"
                        : "text-gray-400"
                    }`}
                  >
                    {cr.aScore}/10
                  </td>
                  <td
                    className={`text-center font-mono ${
                      cr.winner === "b"
                        ? "text-amber-400 font-bold"
                        : "text-gray-400"
                    }`}
                  >
                    {cr.bScore}/10
                  </td>
                  <td className="py-3 pl-3 text-gray-300 text-xs">{cr.note}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-xs text-gray-500">
                <td className="pt-3"></td>
                <td className="pt-3 text-center font-mono">
                  {aWins} {aWins === 1 ? "victoria" : "victorias"}
                </td>
                <td className="pt-3 text-center font-mono">
                  {bWins} {bWins === 1 ? "victoria" : "victorias"}
                </td>
                <td className="pt-3 pl-3">{ties} empates</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Verdict */}
      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
        <h2 className="text-lg font-bold text-amber-300 mb-2">
          Veredicto del cazador
        </h2>
        <p className="text-gray-200 leading-relaxed">{c.verdict}</p>
      </section>

      {/* Pick A / Pick B */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <h3 className="text-base font-bold text-white mb-3">
            Elige {c.a.emoji} {c.a.name} si...
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            {c.pickA.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-amber-400 flex-shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <h3 className="text-base font-bold text-white mb-3">
            Elige {c.b.emoji} {c.b.name} si...
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            {c.pickB.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-amber-400 flex-shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Hoteles destacados con CTAs Booking AID */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">
          Hoteles destacados en cada barrio
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
            <h3 className="text-sm font-bold text-amber-300 mb-3">
              {c.a.emoji} {c.a.name}
            </h3>
            <ul className="space-y-2">
              {c.hotelsA.map((hotel) => (
                <li key={hotel}>
                  <a
                    href={buildBookingUrl({
                      hotelName: hotel,
                      city: c.cityName,
                    })}
                    target="_blank"
                    rel="noopener nofollow sponsored"
                    className="block text-sm text-gray-200 hover:text-amber-300 py-1.5"
                  >
                    {hotel} →
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] text-gray-500 leading-relaxed">
              Enlaces a Booking.com — TripCazador puede cobrar comisión sin
              coste adicional para ti.
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
            <h3 className="text-sm font-bold text-amber-300 mb-3">
              {c.b.emoji} {c.b.name}
            </h3>
            <ul className="space-y-2">
              {c.hotelsB.map((hotel) => (
                <li key={hotel}>
                  <a
                    href={buildBookingUrl({
                      hotelName: hotel,
                      city: c.cityName,
                    })}
                    target="_blank"
                    rel="noopener nofollow sponsored"
                    className="block text-sm text-gray-200 hover:text-amber-300 py-1.5"
                  >
                    {hotel} →
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] text-gray-500 leading-relaxed">
              Enlaces a Booking.com — TripCazador puede cobrar comisión sin
              coste adicional para ti.
            </p>
          </div>
        </div>
      </section>

      {/* Search all hotels en la ciudad */}
      <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 text-center">
        <h3 className="text-base font-bold text-white mb-2">
          ¿Buscas más opciones en {c.cityName}?
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Compara todos los hoteles con fechas y huéspedes.
        </p>
        <a
          href={buildBookingUrl({ hotelName: c.cityName, city: c.cityName })}
          target="_blank"
          rel="noopener nofollow sponsored"
          className="inline-block px-5 py-2.5 rounded-lg bg-amber-500 text-gray-900 font-bold text-sm hover:bg-amber-400 transition-colors"
        >
          Ver hoteles en {c.cityName} →
        </a>
      </section>

      {/* Newsletter */}
      <NewsletterSignup
        variant="compact"
        context={`comparar-barrios-${c.slug}`}
      />

      {/* Related lectura — link a guía Europa */}
      <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-4 text-sm text-gray-300">
        <Link
          href="/blog/donde-dormir-europa-2026-12-ciudades-barrios"
          className="text-amber-300 font-bold hover:text-amber-200"
        >
          Guía completa: dónde dormir en 12 ciudades europeas →
        </Link>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-3">
            Otras comparativas de barrios
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {related.map((other) => (
              <Link
                key={other.slug}
                href={`/comparar-barrios/${other.slug}`}
                className="text-sm text-gray-300 hover:text-amber-300 py-2 px-3 rounded-lg hover:bg-gray-800/50"
              >
                <span className="text-[10px] uppercase tracking-wider text-amber-400/60 font-mono mr-2">
                  {other.cityName}
                </span>
                {other.a.name} vs {other.b.name} →
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
