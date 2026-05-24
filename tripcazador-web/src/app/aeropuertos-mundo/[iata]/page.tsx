/**
 * /aeropuertos-mundo/[iata] — SSS445 (23 may 2026)
 *
 * Landing por aeropuerto internacional. Datos compactos para viajeros
 * en tránsito.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  AIRPORTS_WORLD,
  AIRPORTS_WORLD_IATAS,
  getAirportWorld,
} from "@/lib/airports_world_catalog";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ iata: string }> {
  return AIRPORTS_WORLD_IATAS.map((iata) => ({ iata: iata.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: { iata: string };
}): Promise<Metadata> {
  const a = getAirportWorld(params.iata.toUpperCase());
  if (!a) return { title: "Aeropuerto no encontrado" };
  const title = `Aeropuerto ${a.city} (${a.iata}): terminales y tránsito`;
  const description = `${a.formalName} en ${a.country}: ${a.paxMillions}M pax/año, ${a.terminals} terminal(es). ${a.transitTip}`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/aeropuertos-mundo/${a.iata.toLowerCase()}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/aeropuertos-mundo/${a.iata.toLowerCase()}`,
      type: "article",
    },
  };
}

export default function AeropuertoMundoPage({ params }: { params: { iata: string } }) {
  const a = getAirportWorld(params.iata.toUpperCase());
  if (!a) notFound();

  const others = AIRPORTS_WORLD.filter((x) => x.iata !== a.iata).slice(0, 6);

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Aeropuertos mundo", url: "/aeropuertos-mundo" },
    { name: `${a.city} (${a.iata})`, url: `/aeropuertos-mundo/${a.iata.toLowerCase()}` },
  ]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/aeropuertos-mundo" className="hover:text-amber-400">Aeropuertos mundo</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{a.city} ({a.iata})</span>
      </nav>

      <header className="mb-8 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              {a.emoji} {a.city}
            </h1>
            <p className="mt-1 text-sm text-slate-400">{a.formalName} · {a.country}</p>
          </div>
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 font-mono text-base font-bold text-amber-300">
            {a.iata}
          </span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
            <div className="text-xs uppercase text-slate-500">Pasajeros/año</div>
            <div className="font-mono text-lg font-bold text-white">{a.paxMillions}M</div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
            <div className="text-xs uppercase text-slate-500">Terminales</div>
            <div className="font-mono text-lg font-bold text-white">{a.terminals}</div>
          </div>
          {a.hubAirline && (
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <div className="text-xs uppercase text-slate-500">Hub principal</div>
              <div className="text-sm font-bold text-white">{a.hubAirline}</div>
            </div>
          )}
        </div>
      </header>

      <section className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
        <h2 className="mb-2 text-lg font-bold text-amber-300">🚇 Tránsito y terminales</h2>
        <p className="text-slate-200">{a.transitTip}</p>
      </section>

      <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800/40 p-5">
        <h2 className="mb-2 text-lg font-bold text-white">✈️ Conexiones desde España</h2>
        <p className="text-slate-300">{a.spanishConnection}</p>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link
          href={`/codigos-pais/${a.countryIso}`}
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🌍</div>
          <div className="mt-1 text-sm font-bold text-white">Códigos {a.country}</div>
          <div className="text-xs text-slate-400">Huso, divisa, enchufe, visa</div>
        </Link>
        <Link
          href="/deals"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 transition-colors hover:border-amber-500/70"
        >
          <div className="text-2xl">🎯</div>
          <div className="mt-1 text-sm font-bold text-white">Vuelos a {a.iata}</div>
          <div className="text-xs text-amber-300">Chollos detectados</div>
        </Link>
      </section>

      {others.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-bold text-white">Otros aeropuertos</h2>
          <div className="flex flex-wrap gap-2">
            {others.map((o) => (
              <Link
                key={o.iata}
                href={`/aeropuertos-mundo/${o.iata.toLowerCase()}`}
                className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-300"
              >
                {o.emoji} {o.city} ({o.iata})
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
