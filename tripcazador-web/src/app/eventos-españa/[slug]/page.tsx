/**
 * /eventos-españa/[slug] — SSS439 (23 may 2026)
 *
 * Landing por evento top. Fechas + por qué + tips + zona + caveats.
 *
 * Cross-link a /aeropuertos/[iata], /escapadas, /preparar-viaje y /destinos.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  EVENTOS_ES_CATALOG,
  EVENTOS_ES_SLUGS,
  getEventoEs,
} from "@/lib/eventos_es_catalog";
// FIX-CQ-3 + FIX-SEO-2: Validate destinoSlug y IATA antes de generar
// cross-links — varios destinoSlug (madrid/sevilla/valencia) NO están en
// DESTINOS_CATALOG, y IATA PNA/TFN NO están en AIRPORTS_ES_CATALOG.
import { DESTINO_SLUGS } from "@/lib/destinos_catalog";
import { AIRPORTS_ES_IATAS } from "@/lib/airports_es_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ slug: string }> {
  return EVENTOS_ES_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const e = getEventoEs(params.slug);
  if (!e) return { title: "Evento no encontrado | TripCazador" };
  const title = `${e.name} en ${e.city}: fechas, hoteles y tips | TripCazador`;
  return {
    title,
    description: e.summary,
    alternates: { canonical: `${SITE_URL}/eventos-españa/${e.slug}` },
    openGraph: {
      title,
      description: e.summary,
      url: `${SITE_URL}/eventos-españa/${e.slug}`,
      type: "article",
    },
  };
}

export default function EventoEsPage({ params }: { params: { slug: string } }) {
  const e = getEventoEs(params.slug);
  if (!e) notFound();

  const others = EVENTOS_ES_CATALOG.filter((x) => x.slug !== e.slug).slice(0, 4);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Eventos España", item: `${SITE_URL}/eventos-españa` },
      { "@type": "ListItem", position: 3, name: e.name, item: `${SITE_URL}/eventos-españa/${e.slug}` },
    ],
  };

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.name,
    description: e.summary,
    location: {
      "@type": "Place",
      name: e.city,
      address: { "@type": "PostalAddress", addressLocality: e.city, addressCountry: "ES" },
    },
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    organizer: { "@type": "Organization", name: e.city },
  };

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/eventos-españa" className="hover:text-amber-400">Eventos España</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{e.name}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {e.emoji} {e.name}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {e.city} · Aeropuerto <span className="font-mono">{e.iata}</span>
        </p>
        <p className="mt-3 rounded-xl border-l-4 border-amber-500 bg-slate-800/40 p-4 text-slate-200">
          📅 <strong className="text-amber-300">Fechas:</strong> {e.dates}
        </p>
        <p className="mt-3 text-slate-300">{e.summary}</p>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold text-white">¿Por qué ir?</h2>
        <ul className="space-y-2">
          {e.whyAttend.map((w, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-300">
              <span className="mt-1 text-emerald-400">✓</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
        <h2 className="mb-3 text-xl font-bold text-amber-300">💡 Tips prácticos</h2>
        <ul className="space-y-2">
          {e.practicalTips.map((t, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-300">
              <span className="mt-1 text-amber-400">→</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-xl border border-slate-700 bg-slate-800/40 p-5">
        <h2 className="mb-2 text-xl font-bold text-white">🏨 Mejor zona para alojarte</h2>
        <p className="text-slate-300">{e.bestArea}</p>
      </section>

      {e.caveats.length > 0 && (
        <section className="mb-8 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
          <h2 className="mb-3 text-xl font-bold text-red-300">⚠️ Qué tener en cuenta</h2>
          <ul className="space-y-2">
            {e.caveats.map((c, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-300">
                <span className="mt-1 text-red-400">✗</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8 grid gap-3 sm:grid-cols-3">
        {/* FIX-SEO-2: solo link a /aeropuertos/X si IATA en catálogo ES.
            Antes PNA y TFN generaban 404. */}
        {AIRPORTS_ES_IATAS.includes(e.iata) && (
          <Link
            href={`/aeropuertos/${e.iata.toLowerCase()}`}
            className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
          >
            <div className="text-2xl">✈️</div>
            <div className="mt-1 text-sm font-bold text-white">Aeropuerto {e.iata}</div>
            <div className="text-xs text-slate-400">Transporte + aerolíneas</div>
          </Link>
        )}
        {/* FIX-CQ-3: solo link si destinoSlug está en DESTINOS_CATALOG. */}
        {e.destinoSlug && DESTINO_SLUGS.includes(e.destinoSlug) && (
          <Link
            href={`/preparar-viaje/${e.destinoSlug}`}
            className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
          >
            <div className="text-2xl">📋</div>
            <div className="mt-1 text-sm font-bold text-white">Preparar viaje</div>
            <div className="text-xs text-slate-400">Checklist {e.city}</div>
          </Link>
        )}
        <Link
          href="/deals"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-center transition-colors hover:border-amber-500/70"
        >
          <div className="text-2xl">🎯</div>
          <div className="mt-1 text-sm font-bold text-white">Vuelos a {e.city}</div>
          <div className="text-xs text-amber-300">Chollos detectados</div>
        </Link>
      </section>

      {others.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">Otros eventos</h2>
          <div className="flex flex-wrap gap-2">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/eventos-españa/${o.slug}`}
                className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-300"
              >
                {o.emoji} {o.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
