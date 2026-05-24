/**
 * /escapadas — SSS433 (23 may 2026)
 *
 * Hub vertical /escapadas/[slug]. Lista 12 destinos típicos de
 * escapada fin de semana con presupuesto + vuelo + zona alojamiento.
 *
 * SEO: "escapada fin de semana barata desde madrid", "escapada
 * europea 3 dias", "destinos fin de semana barato".
 */
import Link from "next/link";
import type { Metadata } from "next";
import { ESCAPADAS_CATALOG } from "@/lib/escapadas_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Escapadas fin de semana desde España (12 destinos)",
  description:
    "12 escapadas de 2-3 días con presupuesto realista, vuelo medio desde Madrid/Barcelona, itinerario y zona donde alojarse. Roma, Lisboa, Marrakech, Berlín y más.",
  alternates: { canonical: `${SITE_URL}/escapadas` },
  openGraph: {
    title: "Escapadas fin de semana desde España",
    description: "12 destinos planificados con itinerario + presupuesto.",
    url: `${SITE_URL}/escapadas`,
    type: "website",
  },
};

export const revalidate = 86400;

export default function EscapadasHubPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          🎒 Escapadas fin de semana
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
          {ESCAPADAS_CATALOG.length} destinos para 2-3 días desde España. Cada uno
          con itinerario realista, vuelo medio detectado, zona recomendada y
          presupuesto total aproximado.
        </p>
      </header>

      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {ESCAPADAS_CATALOG.map((e) => (
          <Link
            key={e.slug}
            href={`/escapadas/${e.slug}`}
            className="rounded-2xl border border-slate-700 bg-slate-800/40 p-5 transition-all hover:border-amber-500/60 hover:bg-slate-800/70"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-white">
                {e.emoji} {e.name}
              </h2>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
                €{e.totalBudgetEur}
              </span>
            </div>
            <p className="text-xs text-slate-400">{e.country}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Vuelo medio:</span>{" "}
                <span className="font-bold text-white">€{e.avgFlightMadEur}</span>
              </div>
              <div>
                <span className="text-slate-500">Vuelo:</span>{" "}
                <span className="text-white">{e.flightHoursFromMad}h</span>
              </div>
              <div>
                <span className="text-slate-500">Hotel 2n:</span>{" "}
                <span className="font-bold text-white">€{e.avgHotel2nEur}</span>
              </div>
              <div>
                <span className="text-slate-500">Mejor época:</span>{" "}
                <span className="text-xs text-white">{e.bestSeason.split(/[,(]/)[0].trim()}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-amber-400">Ver itinerario →</div>
          </Link>
        ))}
      </section>

      <section className="mt-12 rounded-xl border border-slate-700 bg-slate-800/40 p-5 text-center text-sm text-slate-300">
        <p>
          Los precios mostrados son medias detectadas por el motor TripCazador
          (vuelo + hotel 2 noches). Para precios live, suscríbete a{" "}
          <Link href="/premium" className="text-amber-400 hover:underline">
            Premium
          </Link>{" "}
          o entra a{" "}
          <Link href="/deals" className="text-amber-400 hover:underline">
            chollos detectados
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
