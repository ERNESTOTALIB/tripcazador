/**
 * /aeropuertos/[iata] — SSS421 (23 may 2026)
 *
 * Landing por aeropuerto español. Source of truth: airports_es_catalog.
 *
 * Cross-links: /aerolineas/[code] (presentes), /equipaje/[aerolinea]
 * (low-cost), /esim, /seguro-viaje, parking afiliado Parclick.
 *
 * SEO: "aeropuerto madrid barajas", "parking MAD", "transporte aeropuerto
 * BCN", "como llegar centro VLC", "que aerolineas vuelan AGP".
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  AIRPORTS_ES,
  AIRPORTS_ES_IATAS,
  getAirportEs,
} from "@/lib/airports_es_catalog";
import { getAirlineByCode } from "@/lib/airlines";
// NEXT (26 may 2026): Place schema GeoCoordinates → Google Maps rich result
import { getAirportGeo } from "@/lib/airport_geocoords";
import { airportPlaceSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";
const PARCLICK_REF = process.env.NEXT_PUBLIC_PARCLICK_REF || "tripcazador";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ iata: string }> {
  return AIRPORTS_ES_IATAS.map((iata) => ({ iata: iata.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: { iata: string };
}): Promise<Metadata> {
  const airport = getAirportEs(params.iata.toUpperCase());
  if (!airport) {
    return { title: "Aeropuerto no encontrado" };
  }
  const title = `Aeropuerto ${airport.city} (${airport.iata}): transporte, aerolíneas, parking`;
  const description = `Guía del aeropuerto ${airport.formalName}: cómo llegar al centro, aerolíneas presentes, top destinos y parking más barato. ${airport.paxMillions}M pax/año.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/aeropuertos/${airport.iata.toLowerCase()}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/aeropuertos/${airport.iata.toLowerCase()}`,
      type: "article",
      images: [
        {
          url: `${SITE_URL}/api/og?title=${encodeURIComponent(`${airport.city} ${airport.iata}`)}&subtitle=${encodeURIComponent(`${airport.paxMillions}M pax/año · ${airport.terminals} terminal(es)`)}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

function buildParclickUrl(iata: string, city: string): string {
  const base = "https://parclick.es/";
  const params = new URLSearchParams({
    utm_source: "tripcazador",
    utm_medium: "programmatic",
    utm_campaign: `parking_${iata.toLowerCase()}`,
  });
  if (PARCLICK_REF) params.set("affiliate", PARCLICK_REF);
  return `${base}aeropuertos/${city.toLowerCase().replace(/\s+/g, "-")}?${params.toString()}`;
}

export default function AeropuertoPage({ params }: { params: { iata: string } }) {
  const airport = getAirportEs(params.iata.toUpperCase());
  if (!airport) notFound();

  const parclickUrl = buildParclickUrl(airport.iata, airport.city);

  // Filtrar airlines presentes que tenemos en catálogo
  const knownAirlines = airport.presentAirlines
    .map((code) => getAirlineByCode(code))
    .filter((a): a is NonNullable<typeof a> => a !== null);
  const unknownAirlines = airport.presentAirlines.filter(
    (code) => !getAirlineByCode(code),
  );

  // FAQ JSON-LD
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `¿Cómo llegar del aeropuerto de ${airport.city} (${airport.iata}) al centro?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: airport.transport
            .map((t) => `${t.mode}: ${t.detail} (${t.priceEur}).`)
            .join(" "),
        },
      },
      {
        "@type": "Question",
        name: `¿Qué aerolíneas vuelan desde el aeropuerto de ${airport.city}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Aerolíneas con presencia en ${airport.iata}: ${airport.presentAirlines.join(", ")}.`,
        },
      },
      {
        "@type": "Question",
        name: `¿Cuántos pasajeros mueve el aeropuerto de ${airport.city}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `El aeropuerto ${airport.formalName} mueve aproximadamente ${airport.paxMillions} millones de pasajeros al año (datos 2024).`,
        },
      },
    ],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Aeropuertos", item: `${SITE_URL}/aeropuertos` },
      {
        "@type": "ListItem",
        position: 3,
        name: `${airport.city} (${airport.iata})`,
        item: `${SITE_URL}/aeropuertos/${airport.iata.toLowerCase()}`,
      },
    ],
  };

  // NEXT (26 may): Airport Place schema with GeoCoordinates if coords known.
  const geo = getAirportGeo(airport.iata);
  const placeJsonLd = geo
    ? airportPlaceSchema({
        iata: airport.iata,
        ciudad: airport.city,
        formalName: airport.formalName,
        lat: geo.lat,
        lng: geo.lng,
        address: geo.address,
        postalCode: geo.postalCode,
        url: `${SITE_URL}/aeropuertos/${airport.iata.toLowerCase()}`,
      })
    : null;

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {placeJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }}
        />
      )}

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/aeropuertos" className="hover:text-amber-400">Aeropuertos</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{airport.city} ({airport.iata})</span>
      </nav>

      <header className="mb-8 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              {airport.emoji} Aeropuerto {airport.city}
            </h1>
            <p className="mt-2 text-sm text-slate-400">{airport.formalName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-sm font-bold text-amber-300">
              {airport.iata}
            </span>
            <span className="rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-xs text-slate-300">
              {airport.operator}
            </span>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
            <div className="text-xs uppercase text-slate-500">Pasajeros/año</div>
            <div className="font-mono text-lg font-bold text-white">{airport.paxMillions}M</div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
            <div className="text-xs uppercase text-slate-500">Terminales</div>
            <div className="font-mono text-lg font-bold text-white">{airport.terminals}</div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
            <div className="text-xs uppercase text-slate-500">Región</div>
            <div className="text-sm font-bold text-white">{airport.region}</div>
          </div>
        </div>
        <p className="mt-4 text-slate-300">{airport.summary}</p>
      </header>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-white">🚇 Cómo llegar al centro</h2>
        <div className="space-y-3">
          {airport.transport.map((t, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-800/40 p-4"
            >
              <div className="flex-1">
                <div className="font-semibold text-white">{t.mode}</div>
                <div className="mt-1 text-sm text-slate-300">{t.detail}</div>
              </div>
              <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-mono text-sm font-bold text-emerald-300">
                {t.priceEur}
              </div>
            </div>
          ))}
        </div>
      </section>

      {knownAirlines.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-white">✈️ Aerolíneas presentes</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {knownAirlines.map((a) => (
              <Link
                key={a.code}
                href={`/aerolineas/${a.code.toLowerCase()}`}
                className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 transition-colors hover:border-amber-500/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{a.name}</span>
                  <span className="font-mono text-xs text-amber-300">{a.code}</span>
                </div>
                <div className="mt-1 text-xs capitalize text-slate-400">{a.category}</div>
              </Link>
            ))}
          </div>
          {unknownAirlines.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              Otras presentes: {unknownAirlines.join(", ")}.
            </p>
          )}
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-white">🌍 Top destinos desde {airport.iata}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {airport.topDestinations.map((dest) => (
            <Link
              key={dest.slug}
              href={`/destinos/${dest.slug}`}
              className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 transition-colors hover:border-amber-500/50"
            >
              <div className="font-semibold text-white">{dest.name}</div>
              <div className="mt-1 text-xs text-amber-400">Ver chollos →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
        <h2 className="mb-2 text-xl font-bold text-white">🅿️ Parking en {airport.iata}</h2>
        <p className="text-sm text-slate-300">
          Comparar y reservar parking en el aeropuerto de {airport.city} con descuentos
          de hasta 70% reservando online. Servicios cubierto, descubierto y valet.
        </p>
        <a
          href={parclickUrl}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="mt-3 inline-block rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-400"
        >
          Comparar parking en {airport.iata} →
        </a>
        <p className="mt-2 text-xs text-slate-500">
          Enlace afiliado · TripCazador puede recibir comisión sin coste adicional.
        </p>
      </section>

      {airport.notes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-white">💡 Notas prácticas</h2>
          <ul className="space-y-2">
            {airport.notes.map((note, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-300">
                <span className="mt-1 text-amber-400">→</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/equipaje"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🧳</div>
          <div className="mt-2 text-sm font-bold text-white">Reglas equipaje</div>
          <div className="text-xs text-slate-400">Por aerolínea presente en {airport.iata}</div>
        </Link>
        <Link
          href="/esim"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">📱</div>
          <div className="mt-2 text-sm font-bold text-white">eSIM al aterrizar</div>
          <div className="text-xs text-slate-400">Conexión nada más llegar</div>
        </Link>
        <Link
          href="/seguro-viaje"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🛡️</div>
          <div className="mt-2 text-sm font-bold text-white">Seguro de viaje</div>
          <div className="text-xs text-slate-400">Antes de volar</div>
        </Link>
      </section>

      <footer className="mt-12 border-t border-slate-800 pt-4 text-xs text-slate-500">
        Datos verificados {airport.lastVerified}. Operador {airport.operator}. Las
        frecuencias y precios públicos pueden cambiar — confirma en la web del
        operador antes del viaje.
      </footer>
    </main>
  );
}
