import Link from "next/link";
import type { Metadata } from "next";
import { AIRLINE_COMPARISONS } from "@/lib/airline_comparisons";

export const metadata: Metadata = {
  title: "Comparar aerolíneas head-to-head 2026",
  description:
    "10 comparativas head-to-head entre aerolíneas (Iberia vs Vueling, Ryanair vs easyJet, ANA vs JAL, Qatar vs Emirates, etc) con datos reales, error fares y veredictos honestos.",
  alternates: { canonical: "/comparar-aerolineas" },
};

export const revalidate = 86400;

export default function AirlineComparisonsIndex() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Comparar aerolíneas
        </h1>
        <p className="mt-3 text-gray-300 text-lg">
          Comparativas head-to-head entre las aerolíneas más relevantes para el
          viajero español. Datos reales, criterios objetivos, veredicto honesto.
        </p>
      </header>

      <div className="text-sm text-gray-400">
        Si ya tienes el vuelo decidido, mira también nuestras{" "}
        <Link
          href="/comparar-barrios"
          className="text-amber-400 hover:underline"
        >
          comparativas de barrios para alojarse
        </Link>
        .
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {AIRLINE_COMPARISONS.map((c) => (
          <Link
            key={c.slug}
            href={`/comparar-aerolineas/${c.slug}`}
            className="block rounded-xl border border-gray-800 hover:border-amber-500/40 p-4 bg-gray-900/40 hover:bg-gray-900/70 transition-colors"
          >
            <div className="flex items-center gap-2 text-base font-bold text-white">
              <span>{c.a.emoji}</span>
              <span>{c.a.name}</span>
              <span className="text-gray-500 text-sm font-normal">vs</span>
              <span>{c.b.name}</span>
              <span>{c.b.emoji}</span>
            </div>
            <p className="mt-1.5 text-xs text-gray-400 line-clamp-2">
              {c.description}
            </p>
            <div className="mt-2 text-[10px] text-amber-400/80 font-mono uppercase tracking-wider">
              {c.routeContext}
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
