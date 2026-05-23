/**
 * /aeropuertos — SSS421 (23 may 2026)
 *
 * Hub vertical /aeropuertos/[iata]. Lista los 15 aeropuertos top de
 * España con cards clicables a cada landing.
 *
 * SEO: "aeropuertos España", "aeropuertos AENA", "aeropuertos low-cost
 * España". CTA cross-link a /equipaje, /esim, /seguro-viaje.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { AIRPORTS_ES } from "@/lib/airports_es_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Aeropuertos España: guía completa | TripCazador",
  description:
    "Información práctica de los 15 aeropuertos top de España: transporte al centro, aerolíneas presentes, parking, top destinos. Ahorra tiempo y dinero.",
  alternates: { canonical: `${SITE_URL}/aeropuertos` },
  openGraph: {
    title: "Aeropuertos España: guía completa",
    description:
      "Transporte, aerolíneas, parking y destinos top desde cada aeropuerto español.",
    url: `${SITE_URL}/aeropuertos`,
    type: "website",
  },
};

export const revalidate = 86400;

export default function AeropuertosHubPage() {
  const totalPax = AIRPORTS_ES.reduce((sum, a) => sum + a.paxMillions, 0);

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          ✈️ Aeropuertos de España
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
          Guía completa de los 15 aeropuertos top españoles: cómo llegar al centro,
          aerolíneas presentes, parking más barato y top destinos desde cada uno.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {AIRPORTS_ES.length} aeropuertos · {Math.round(totalPax)}M pasajeros/año combinados
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AIRPORTS_ES.map((airport) => (
          <Link
            key={airport.iata}
            href={`/aeropuertos/${airport.iata.toLowerCase()}`}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 transition-all hover:border-amber-500/60 hover:bg-slate-800/70"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-white">
                {airport.emoji} {airport.city}
              </h2>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-xs text-amber-300">
                {airport.iata}
              </span>
            </div>
            <p className="text-xs text-slate-400">{airport.formalName}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Pasajeros:</span>{" "}
                <span className="font-semibold text-white">{airport.paxMillions}M/año</span>
              </div>
              <div>
                <span className="text-slate-500">Terminales:</span>{" "}
                <span className="font-semibold text-white">{airport.terminals}</span>
              </div>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-slate-300">
              {airport.summary}
            </p>
            <div className="mt-3 text-xs text-amber-400">Ver guía completa →</div>
          </Link>
        ))}
      </section>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <Link
          href="/equipaje"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🧳</div>
          <div className="mt-2 text-sm font-bold text-white">Equipaje</div>
          <div className="text-xs text-slate-400">Reglas por aerolínea</div>
        </Link>
        <Link
          href="/esim"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">📱</div>
          <div className="mt-2 text-sm font-bold text-white">eSIM</div>
          <div className="text-xs text-slate-400">Conexión en destino</div>
        </Link>
        <Link
          href="/seguro-viaje"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🛡️</div>
          <div className="mt-2 text-sm font-bold text-white">Seguro de viaje</div>
          <div className="text-xs text-slate-400">Cobertura por destino</div>
        </Link>
      </section>
    </main>
  );
}
