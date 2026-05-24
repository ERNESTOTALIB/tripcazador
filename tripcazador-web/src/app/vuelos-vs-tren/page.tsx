/**
 * /vuelos-vs-tren — SSS428 (23 may 2026)
 *
 * Hub vertical comparador avión vs Renfe AVE/Iryo/Ouigo. Lista 8 rutas
 * con winner glance.
 *
 * SEO: "ave o avion madrid barcelona", "tren vs avion".
 */
import Link from "next/link";
import type { Metadata } from "next";
import { VUELO_TREN_CATALOG, formatDuration } from "@/lib/vuelo_tren_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Vuelo vs Tren AVE: 8 rutas comparadas",
  description:
    "¿AVE o avión? Comparativa real para 8 rutas españolas: tiempo total door-to-door, precio medio, frecuencia. Resultados directos sin marketing.",
  alternates: { canonical: `${SITE_URL}/vuelos-vs-tren` },
  openGraph: {
    title: "Vuelo vs Tren AVE: 8 rutas comparadas",
    description: "Tren o avión — comparativa real por ruta.",
    url: `${SITE_URL}/vuelos-vs-tren`,
    type: "website",
  },
};

export const revalidate = 86400;

export default function VueloTrenHubPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          🚆 ✈️ Tren AVE vs Avión
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
          Para cada ruta española importante: tiempo door-to-door real, precio
          medio, frecuencias y veredicto directo. {VUELO_TREN_CATALOG.length}{" "}
          rutas comparadas con datos verificados may 2026.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {VUELO_TREN_CATALOG.map((entry) => {
          const winnerLabel =
            entry.recommendation.winner === "train"
              ? "Tren gana"
              : entry.recommendation.winner === "flight"
                ? "Vuelo gana"
                : "Empate";
          const winnerColor =
            entry.recommendation.winner === "train"
              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
              : entry.recommendation.winner === "flight"
                ? "bg-sky-500/15 text-sky-300 border-sky-500/40"
                : "bg-amber-500/15 text-amber-300 border-amber-500/40";
          return (
            <Link
              key={entry.slug}
              href={`/vuelos-vs-tren/${entry.slug}`}
              className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 transition-all hover:border-amber-500/60 hover:bg-slate-800/70"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-white">
                  {entry.origin} ↔ {entry.destination}
                </h2>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-bold ${winnerColor}`}
                >
                  {winnerLabel}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <div className="rounded border border-slate-700 bg-slate-900/40 p-2">
                  <div className="text-slate-500">Tren</div>
                  <div className="font-bold text-white">
                    {formatDuration(entry.train.durationMin)} · €{entry.train.avgPriceLowCostEur}+
                  </div>
                </div>
                <div className="rounded border border-slate-700 bg-slate-900/40 p-2">
                  <div className="text-slate-500">Vuelo</div>
                  <div className="font-bold text-white">
                    {formatDuration(entry.flight.durationMin)} · €{entry.flight.avgPriceLowCostEur}+
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-amber-400">Ver análisis →</div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
