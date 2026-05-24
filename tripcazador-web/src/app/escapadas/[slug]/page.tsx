/**
 * /escapadas/[slug] — SSS433 (23 may 2026)
 *
 * Landing por escapada fin de semana. Itinerario 2-3 días + vuelo +
 * hotel + tips + pros/cons.
 *
 * Cross-links monetizables: /deals filtrados por destino, /seguro-viaje,
 * /esim, /destinos/[slug] (Booking AID 714734 hotels).
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ESCAPADAS_SLUGS,
  ESCAPADAS_CATALOG,
  getEscapada,
} from "@/lib/escapadas_catalog";
// FIX-CQ-2: /destinos/[slug] tiene dynamicParams=false; algunos
// destinoSlug en escapadas catalog (oporto, edimburgo, dublin, bruselas)
// no están en DESTINOS_CATALOG. Validamos antes de renderizar el link.
import { DESTINO_SLUGS } from "@/lib/destinos_catalog";
// SSS455: usar helper centralizado en lugar de re-implementar Breadcrumb
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ slug: string }> {
  return ESCAPADAS_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const e = getEscapada(params.slug);
  if (!e) return { title: "Escapada no encontrada" };
  const title = `Escapada a ${e.name} en 2-3 días: itinerario + presupuesto`;
  const description = `Itinerario completo para una escapada a ${e.name} (${e.country}) en 2-3 días. Vuelo medio €${e.avgFlightMadEur}, hotel 2n €${e.avgHotel2nEur}, presupuesto total €${e.totalBudgetEur}. Mejor época: ${e.bestSeason.split(/[,(]/)[0].trim()}.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/escapadas/${e.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/escapadas/${e.slug}`,
      type: "article",
    },
  };
}

export default function EscapadaPage({ params }: { params: { slug: string } }) {
  const e = getEscapada(params.slug);
  if (!e) notFound();

  const otherEscapadas = ESCAPADAS_CATALOG.filter((x) => x.slug !== e.slug).slice(0, 5);

  // SSS455: helper centralizado (era ~7 líneas duplicadas en ~15 pages)
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Escapadas", url: "/escapadas" },
    { name: e.name, url: `/escapadas/${e.slug}` },
  ]);

  const tripJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: `Escapada ${e.name} 2-3 días`,
    description: `Itinerario fin de semana ${e.name} (${e.country})`,
    touristType: ["weekend trip", "city break"],
    itinerary: e.itinerary.map((d, i) => ({
      "@type": "ItemList",
      position: i + 1,
      name: `${d.day}: ${d.title}`,
      itemListElement: d.activities.map((a, j) => ({
        "@type": "ListItem",
        position: j + 1,
        name: a,
      })),
    })),
  };

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tripJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/escapadas" className="hover:text-amber-400">Escapadas</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{e.name}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {e.emoji} Escapada a {e.name}
        </h1>
        <p className="mt-2 text-sm text-slate-400">{e.country} · 2-3 días</p>
      </header>

      <section className="mb-8 grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
          <div className="text-xs uppercase text-slate-500">Vuelo (MAD)</div>
          <div className="text-lg font-bold text-white">€{e.avgFlightMadEur}</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
          <div className="text-xs uppercase text-slate-500">Hotel 2n</div>
          <div className="text-lg font-bold text-white">€{e.avgHotel2nEur}</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
          <div className="text-xs uppercase text-slate-500">Tiempo vuelo</div>
          <div className="text-lg font-bold text-white">{e.flightHoursFromMad}h</div>
        </div>
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
          <div className="text-xs uppercase text-amber-400">Total aprox</div>
          <div className="text-lg font-bold text-amber-300">€{e.totalBudgetEur}</div>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-slate-700 bg-slate-800/40 p-5">
        <h2 className="mb-3 text-xl font-bold text-white">📍 Información práctica</h2>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <div className="text-slate-500">Mejor época</div>
            <div className="text-slate-200">{e.bestSeason}</div>
          </div>
          <div>
            <div className="text-slate-500">Zona recomendada</div>
            <div className="text-slate-200">{e.bestArea}</div>
          </div>
        </div>
        <div className="mt-3 text-sm">
          <div className="text-slate-500">Transporte aeropuerto-centro</div>
          <div className="text-slate-200">{e.transportTip}</div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-white">Itinerario sugerido</h2>
        <div className="space-y-4">
          {e.itinerary.map((d, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-700 bg-slate-800/40 p-5"
            >
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-slate-900">
                  {d.day}
                </span>
                <h3 className="text-lg font-bold text-white">{d.title}</h3>
              </div>
              <ul className="space-y-1 text-sm text-slate-300">
                {d.activities.map((a, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className="mt-1 text-amber-400">→</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <h2 className="mb-2 text-lg font-bold text-emerald-300">✅ Pros</h2>
          <ul className="space-y-1 text-sm text-slate-200">
            {e.pros.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 text-emerald-400">+</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
          <h2 className="mb-2 text-lg font-bold text-red-300">⚠️ Contras</h2>
          <ul className="space-y-1 text-sm text-slate-200">
            {e.cons.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 text-red-400">-</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-8 grid gap-3 sm:grid-cols-3">
        <Link
          href={`/deals?destino=${encodeURIComponent(e.name.toLowerCase())}`}
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-center transition-colors hover:border-amber-500/70"
        >
          <div className="text-2xl">🎯</div>
          <div className="mt-2 text-sm font-bold text-white">Chollos detectados</div>
          <div className="text-xs text-amber-300">Vuelos a {e.name}</div>
        </Link>
        {e.destinoSlug && DESTINO_SLUGS.includes(e.destinoSlug) && (
          <Link
            href={`/destinos/${e.destinoSlug}`}
            className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
          >
            <div className="text-2xl">🏨</div>
            <div className="mt-2 text-sm font-bold text-white">Hoteles {e.name}</div>
            <div className="text-xs text-slate-400">Cross-link Booking</div>
          </Link>
        )}
        <Link
          href={`/seguro-viaje`}
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🛡️</div>
          <div className="mt-2 text-sm font-bold text-white">Seguro viaje</div>
          <div className="text-xs text-slate-400">Antes de viajar</div>
        </Link>
      </section>

      {otherEscapadas.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">Otras escapadas</h2>
          <div className="flex flex-wrap gap-2">
            {otherEscapadas.map((x) => (
              <Link
                key={x.slug}
                href={`/escapadas/${x.slug}`}
                className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-300"
              >
                {x.emoji} {x.name} · €{x.totalBudgetEur}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
