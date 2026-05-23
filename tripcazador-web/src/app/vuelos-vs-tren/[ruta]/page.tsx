/**
 * /vuelos-vs-tren/[ruta] — SSS428 (23 may 2026)
 *
 * Landing comparador por ruta. Verdict + tiempo door-to-door real +
 * precio + frecuencias + caveats + tips.
 *
 * Cross-link a /precio-vuelo/[origen]/[destino] cuando aplique.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  VUELO_TREN_CATALOG,
  VUELO_TREN_SLUGS,
  getVueloTren,
  formatDuration,
} from "@/lib/vuelo_tren_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ ruta: string }> {
  return VUELO_TREN_SLUGS.map((ruta) => ({ ruta }));
}

export async function generateMetadata({
  params,
}: {
  params: { ruta: string };
}): Promise<Metadata> {
  const e = getVueloTren(params.ruta);
  if (!e) return { title: "Ruta no encontrada | TripCazador" };
  const title = `${e.origin} - ${e.destination}: tren AVE o avión | TripCazador`;
  const description = `¿Tren AVE o vuelo ${e.origin}-${e.destination}? Tiempo real door-to-door, precio medio, frecuencias y veredicto. ${e.recommendation.winner === "train" ? "Tren gana" : e.recommendation.winner === "flight" ? "Vuelo gana" : "Empate"}.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/vuelos-vs-tren/${e.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/vuelos-vs-tren/${e.slug}`,
      type: "article",
    },
  };
}

export default function VueloTrenRutaPage({ params }: { params: { ruta: string } }) {
  const e = getVueloTren(params.ruta);
  if (!e) notFound();

  const trainWins = e.recommendation.winner === "train";
  const flightWins = e.recommendation.winner === "flight";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Vuelos vs Tren", item: `${SITE_URL}/vuelos-vs-tren` },
      {
        "@type": "ListItem",
        position: 3,
        name: `${e.origin} - ${e.destination}`,
        item: `${SITE_URL}/vuelos-vs-tren/${e.slug}`,
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `¿Qué es más rápido entre ${e.origin} y ${e.destination}, tren AVE o avión?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `El AVE tarda ${formatDuration(e.train.durationMin)} centro a centro. El vuelo dura ${formatDuration(e.flight.durationMin)} en aire, pero el tiempo door-to-door (incluido aeropuerto + traslados) es habitualmente 2-3 horas más largo. ${e.recommendation.reason}`,
        },
      },
      {
        "@type": "Question",
        name: `¿Cuál es más barato, tren o vuelo ${e.origin}-${e.destination}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Precio medio AVE €${e.train.avgPriceEur}, con tarifas low-cost (Ouigo, Avlo, Iryo) desde €${e.train.avgPriceLowCostEur}. Vuelo medio €${e.flight.avgPriceEur}, low-cost desde €${e.flight.avgPriceLowCostEur}.`,
        },
      },
      {
        "@type": "Question",
        name: `¿Cuántas frecuencias diarias hay ${e.origin}-${e.destination}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Tren: ${e.train.frequenciesPerDay} frecuencias/día (operadores: ${e.train.operators.join(", ")}). Vuelo: ${e.flight.frequenciesPerDay} frecuencias/día (aerolíneas: ${e.flight.airlines.join(", ")}).`,
        },
      },
    ],
  };

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/vuelos-vs-tren" className="hover:text-amber-400">Vuelos vs Tren</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{e.origin} ↔ {e.destination}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {e.emoji} {e.origin} ↔ {e.destination}: ¿tren AVE o avión?
        </h1>
        <p className="mt-3 text-slate-300">
          Comparativa de tiempo real door-to-door, precio medio y frecuencias
          (mayo 2026).
        </p>
      </header>

      <section
        className={`mb-8 rounded-2xl border p-5 ${trainWins ? "border-emerald-500/40 bg-emerald-500/5" : flightWins ? "border-sky-500/40 bg-sky-500/5" : "border-amber-500/40 bg-amber-500/5"}`}
      >
        <h2 className="mb-2 text-xl font-bold text-white">
          ✅ Veredicto:{" "}
          {trainWins ? "Tren AVE" : flightWins ? "Avión" : "Empate (depende del caso)"}
        </h2>
        <p className="text-slate-200">{e.recommendation.reason}</p>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/30 bg-slate-800/40 p-5">
          <h3 className="mb-2 text-lg font-bold text-emerald-300">🚆 Tren</h3>
          <div className="space-y-2 text-sm text-slate-200">
            <div>
              <span className="text-slate-500">Duración:</span>{" "}
              <span className="font-bold">{formatDuration(e.train.durationMin)}</span>
            </div>
            <div>
              <span className="text-slate-500">Estaciones:</span>{" "}
              <div className="text-xs text-slate-300">{e.train.fromStation} → {e.train.toStation}</div>
            </div>
            <div>
              <span className="text-slate-500">Precio medio:</span>{" "}
              <span className="font-bold">€{e.train.avgPriceEur}</span>
            </div>
            <div>
              <span className="text-slate-500">Low-cost desde:</span>{" "}
              <span className="font-bold text-emerald-300">€{e.train.avgPriceLowCostEur}</span>
            </div>
            <div>
              <span className="text-slate-500">Frecuencias/día:</span>{" "}
              <span className="font-bold">{e.train.frequenciesPerDay}</span>
            </div>
            <div>
              <span className="text-slate-500">Operadores:</span>{" "}
              <span className="text-xs">{e.train.operators.join(", ")}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-sky-500/30 bg-slate-800/40 p-5">
          <h3 className="mb-2 text-lg font-bold text-sky-300">✈️ Vuelo</h3>
          <div className="space-y-2 text-sm text-slate-200">
            <div>
              <span className="text-slate-500">Duración aire:</span>{" "}
              <span className="font-bold">{formatDuration(e.flight.durationMin)}</span>
            </div>
            <div>
              <span className="text-slate-500">Aeropuertos:</span>{" "}
              <div className="text-xs font-mono text-slate-300">{e.flight.fromAirport} → {e.flight.toAirport}</div>
            </div>
            <div>
              <span className="text-slate-500">Precio medio:</span>{" "}
              <span className="font-bold">€{e.flight.avgPriceEur}</span>
            </div>
            <div>
              <span className="text-slate-500">Low-cost desde:</span>{" "}
              <span className="font-bold text-sky-300">€{e.flight.avgPriceLowCostEur}</span>
            </div>
            <div>
              <span className="text-slate-500">Frecuencias/día:</span>{" "}
              <span className="font-bold">{e.flight.frequenciesPerDay}</span>
            </div>
            <div>
              <span className="text-slate-500">Aerolíneas:</span>{" "}
              <span className="text-xs">{e.flight.airlines.join(", ")}</span>
            </div>
          </div>
        </div>
      </section>

      {e.caveats.length > 0 && (
        <section className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h2 className="mb-3 text-lg font-bold text-amber-300">⚠️ Excepciones — cuándo elegir lo otro</h2>
          <ul className="space-y-2">
            {e.caveats.map((c, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-300">
                <span className="mt-1 text-amber-400">→</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold text-white">💡 Tips cazador</h2>
        <ul className="space-y-2">
          {e.tips.map((t, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-300">
              <span className="mt-1 text-amber-400">→</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 grid gap-3 sm:grid-cols-2">
        <Link
          href={`/precio-vuelo/${e.origin.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}/${e.destination.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}`}
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">✈️</div>
          <div className="mt-2 text-sm font-bold text-white">Precios vuelo {e.origin}→{e.destination}</div>
          <div className="text-xs text-slate-400">Histórico de tarifas detectadas</div>
        </Link>
        <Link
          href="/deals"
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🎯</div>
          <div className="mt-2 text-sm font-bold text-white">Ver chollos detectados</div>
          <div className="text-xs text-slate-400">Last-minute deals filtrados</div>
        </Link>
      </section>

      <footer className="mt-10 border-t border-slate-800 pt-4 text-xs text-slate-500">
        Datos may 2026 — los operadores cambian precios y frecuencias
        regularmente. Confirma en Renfe.com, iryo.eu, ouigo.com y la web de la
        aerolínea antes de reservar.
      </footer>
    </main>
  );
}
