import Link from "next/link";
import type { Metadata } from "next";
import { NEIGHBORHOOD_COMPARISONS } from "@/lib/neighborhood_comparisons";

export const metadata: Metadata = {
  title: "Dónde dormir: comparar barrios en ciudades top 2026 | TripCazador",
  description:
    "Comparativas head-to-head entre barrios para alojarse: Barcelona Gòtic vs Eixample, Madrid Centro vs Malasaña, Roma Trastevere vs Centro, París Marais vs Montmartre, Lisboa Alfama vs Chiado, Sevilla Centro vs Triana. Precios reales, vibe, transporte. Veredicto cazador.",
  alternates: { canonical: "/comparar-barrios" },
  openGraph: {
    title: "Dónde dormir: comparar barrios en ciudades top 2026",
    description:
      "Comparativas honestas barrio vs barrio en BCN, MAD, Roma, París, Lisboa, Sevilla. Precios, vibe y veredicto cazador.",
    type: "website",
    url: "https://tripcazador.com/comparar-barrios",
  },
};

export const revalidate = 86400; // 24h

export default function NeighborhoodComparisonsIndex() {
  // ItemList JSON-LD para que Google entienda la colección.
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Comparativas head-to-head entre barrios",
    numberOfItems: NEIGHBORHOOD_COMPARISONS.length,
    itemListElement: NEIGHBORHOOD_COMPARISONS.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://tripcazador.com/comparar-barrios/${c.slug}`,
      name: `${c.a.name} vs ${c.b.name} (${c.cityName})`,
    })),
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <nav className="text-xs text-gray-400" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>{" "}
        ›{" "}
        <Link href="/hoteles" className="hover:text-amber-400">Hoteles</Link>{" "}
        › Comparar barrios
      </nav>

      <header>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Dónde dormir: comparar barrios
        </h1>
        <p className="mt-3 text-gray-300 text-lg">
          La decisión de zona pesa más que el hotel concreto: cambia tu
          presupuesto, tu vibe y los minutos al monumento que vas a ver. Estas
          comparativas son honestas — sin pintar barrios &ldquo;peligrosos&rdquo; ni
          glorificar zonas turísticas — con precios reales y veredicto por
          tipo de viajero.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {NEIGHBORHOOD_COMPARISONS.map((c) => (
          <Link
            key={c.slug}
            href={`/comparar-barrios/${c.slug}`}
            className="block rounded-xl border border-gray-800 hover:border-amber-500/40 p-5 bg-gray-900/40 hover:bg-gray-900/70 transition-colors"
          >
            <div className="text-[10px] uppercase tracking-wider text-amber-400/80 font-mono mb-1">
              {c.cityName}
            </div>
            <div className="flex items-center gap-2 text-base font-bold text-white">
              <span>{c.a.emoji}</span>
              <span>{c.a.name}</span>
              <span className="text-gray-500 text-sm font-normal">vs</span>
              <span>{c.b.name}</span>
              <span>{c.b.emoji}</span>
            </div>
            <p className="mt-2 text-xs text-gray-400 line-clamp-3">
              {c.description}
            </p>
            <div className="mt-3 flex items-center gap-3 text-[11px] text-gray-500">
              <span>Desde €{Math.min(c.a.avgPriceEur, c.b.avgPriceEur)}/noche</span>
              <span aria-hidden="true">·</span>
              <span>3★</span>
            </div>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
        <h2 className="text-base font-bold text-white mb-2">
          Visión general de Europa
        </h2>
        <p className="text-sm text-gray-300 mb-3">
          Si todavía no has decidido a qué ciudad ir, lee primero la guía
          completa con TL;DR de las 12 ciudades y errores que comete el viajero
          medio.
        </p>
        <Link
          href="/blog/donde-dormir-europa-2026-12-ciudades-barrios"
          className="inline-block text-sm font-bold text-amber-400 hover:text-amber-300"
        >
          Dónde dormir en Europa 2026 — guía 12 ciudades →
        </Link>
      </section>

      <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
        <h2 className="text-base font-bold text-amber-300 mb-2">
          Cómo leemos cada comparativa
        </h2>
        <ul className="text-sm text-gray-300 space-y-1.5">
          <li>· <strong>Precio medio noche</strong>: hoteles 3★/4★ doble estándar, observado en Booking en los últimos 90 días.</li>
          <li>· <strong>Centralidad</strong>: cuán a pie está el barrio del centro turístico real.</li>
          <li>· <strong>Vibe</strong>: el carácter del barrio fuera del horario turista (mañanas, lunes).</li>
          <li>· <strong>Transporte</strong>: minutos al aeropuerto en metro/tren regional (no taxi).</li>
          <li>· <strong>Veredicto</strong>: para qué tipo de viajero gana cada barrio — sin &ldquo;el mejor&rdquo; absoluto.</li>
        </ul>
      </section>
    </main>
  );
}
