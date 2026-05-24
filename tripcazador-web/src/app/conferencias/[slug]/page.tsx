/**
 * /conferencias/[slug] — SSS440 (23 may 2026)
 *
 * Landing por conferencia tech/business. Datos prácticos + tips +
 * vuelos desde España + alojamiento.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CONFERENCIAS_CATALOG,
  CONFERENCIAS_SLUGS,
  getConferencia,
} from "@/lib/conferencias_catalog";
// FIX-SEO-1: routes /aeropuertos/[iata] (ES only) y /aeropuertos-mundo/[iata]
// son distintos catálogos. Detectar y rutear correctamente para evitar 404.
import { AIRPORTS_ES_IATAS } from "@/lib/airports_es_catalog";
import { AIRPORTS_WORLD_IATAS } from "@/lib/airports_world_catalog";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ slug: string }> {
  return CONFERENCIAS_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const c = getConferencia(params.slug);
  if (!c) return { title: "Conferencia no encontrada | TripCazador" };
  const title = `${c.name} ${c.city}: vuelos, hotel y tips | TripCazador`;
  return {
    title,
    description: c.summary,
    alternates: { canonical: `${SITE_URL}/conferencias/${c.slug}` },
    openGraph: {
      title,
      description: c.summary,
      url: `${SITE_URL}/conferencias/${c.slug}`,
      type: "article",
    },
  };
}

export default function ConferenciaPage({ params }: { params: { slug: string } }) {
  const c = getConferencia(params.slug);
  if (!c) notFound();

  const others = CONFERENCIAS_CATALOG.filter((x) => x.slug !== c.slug).slice(0, 4);

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Conferencias", url: "/conferencias" },
    { name: c.name, url: `/conferencias/${c.slug}` },
  ]);

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "BusinessEvent",
    name: c.name,
    description: c.summary,
    location: {
      "@type": "Place",
      name: c.city,
      address: { "@type": "PostalAddress", addressLocality: c.city },
    },
    organizer: { "@type": "Organization", name: c.name, url: c.officialUrl },
  };

  // FIX-SEO-1: rutar al catálogo correcto. ES → /aeropuertos, otros → /aeropuertos-mundo.
  // Si el IATA tampoco está en world catalog, no renderizamos link (mejor que 404).
  const aeropuertoHref = AIRPORTS_ES_IATAS.includes(c.iata)
    ? `/aeropuertos/${c.iata.toLowerCase()}`
    : AIRPORTS_WORLD_IATAS.includes(c.iata)
      ? `/aeropuertos-mundo/${c.iata.toLowerCase()}`
      : null;

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
        <Link href="/conferencias" className="hover:text-amber-400">Conferencias</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{c.name}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {c.emoji} {c.name}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {c.city} · Aeropuerto <span className="font-mono">{c.iata}</span>
        </p>
        <p className="mt-3 text-slate-300">{c.summary}</p>
      </header>

      <section className="mb-8 grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
          <div className="text-xs uppercase text-slate-500">Fechas</div>
          <div className="text-sm font-bold text-white">{c.dates}</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
          <div className="text-xs uppercase text-slate-500">Asistentes</div>
          <div className="text-sm font-bold text-white">{c.attendees.toLocaleString("es-ES")}</div>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
          <div className="text-xs uppercase text-slate-500">Ticket €</div>
          <div className="text-sm font-bold text-white">{c.ticketPriceEur}</div>
        </div>
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
          <div className="text-xs uppercase text-amber-400">Sector</div>
          <div className="text-sm font-bold capitalize text-amber-300">{c.sector}</div>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
        <h2 className="mb-3 text-xl font-bold text-amber-300">💡 Tips prácticos</h2>
        <ul className="space-y-2">
          {c.tips.map((t, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-300">
              <span className="mt-1 text-amber-400">→</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-xl border border-slate-700 bg-slate-800/40 p-5">
        <h2 className="mb-2 text-xl font-bold text-white">🏨 Mejor zona para alojarte</h2>
        <p className="text-slate-300">{c.bestArea}</p>
      </section>

      <section className="mb-8 rounded-xl border border-slate-700 bg-slate-800/40 p-5">
        <h2 className="mb-2 text-xl font-bold text-white">✈️ Vuelos desde España</h2>
        <ul className="space-y-1 text-sm text-slate-300">
          {c.airlinesFromSpain.map((a, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-amber-400">→</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 grid gap-3 sm:grid-cols-3">
        {aeropuertoHref && (
          <Link
            href={aeropuertoHref}
            className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
          >
            <div className="text-2xl">✈️</div>
            <div className="mt-1 text-sm font-bold text-white">Aeropuerto {c.iata}</div>
            <div className="text-xs text-slate-400">Transporte + servicios</div>
          </Link>
        )}
        <Link
          href="/deals"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-center transition-colors hover:border-amber-500/70"
        >
          <div className="text-2xl">🎯</div>
          <div className="mt-1 text-sm font-bold text-white">Chollos detectados</div>
          <div className="text-xs text-amber-300">Vuelos a {c.iata}</div>
        </Link>
        <a
          href={c.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🌐</div>
          <div className="mt-1 text-sm font-bold text-white">Web oficial</div>
          <div className="text-xs text-slate-400">Tickets + agenda</div>
        </a>
      </section>

      {others.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">Otras conferencias</h2>
          <div className="flex flex-wrap gap-2">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/conferencias/${o.slug}`}
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
