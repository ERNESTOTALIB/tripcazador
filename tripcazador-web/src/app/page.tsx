import { Suspense } from "react";
import { getTopDeals, getDeals } from "@/lib/api";
import { DealCard } from "@/components/DealCard";
import SearchBar from "@/components/SearchBar";
import { DestinationCard } from "@/components/DestinationCard";
import { Testimonials } from "@/components/Testimonials";
import { PopularSearches } from "@/components/PopularSearches";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TripCazador — Error fares y chollos de vuelo desde Europa",
  description:
    "El motor automático que rastrea 24/7 los mejores chollos de vuelo, error fares y Business class a precio de economy desde aeropuertos europeos.",
};

// ISR: revalidar cada 5 minutos
export const revalidate = 300;

async function HeroStats() {
  const data = await getDeals({ limit: 1 });
  const stats = data.stats;
  return (
    <div className="flex flex-wrap justify-center gap-8 text-center mt-10">
      <div>
        <div className="text-3xl font-bold text-amber-400 tabular-nums">{stats.total}</div>
        <div className="text-sm text-gray-300 mt-1">Deals activos</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-amber-400 tabular-nums">
          {stats.price_min > 0 ? `${stats.price_min.toFixed(0)}€` : "—"}
        </div>
        <div className="text-sm text-gray-300 mt-1">Precio mínimo</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-amber-400 tabular-nums">
          {stats.verified_count}
        </div>
        <div className="text-sm text-gray-300 mt-1">Verificados 2+ fuentes</div>
      </div>
      <div>
        <div className="text-3xl font-bold text-amber-400">24h</div>
        <div className="text-sm text-gray-300 mt-1">Actualización</div>
      </div>
    </div>
  );
}

async function TopDeals() {
  const deals = await getTopDeals(9);
  if (!deals || deals.length === 0) {
    return (
      <div className="panel text-center py-16 px-6">
        <p className="text-2xl">🛰️</p>
        <p className="text-lg text-gray-200 mt-2">
          Aún no hay deals disponibles en este momento.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          El motor está rastreando aeropuertos y aerolíneas. Vuelve en unas horas o
          suscríbete al canal de Telegram para no perderte el próximo chollo.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href="/telegram"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors"
          >
            Unirme al Telegram
          </a>
          <a
            href="/destinos"
            className="px-5 py-2.5 glass text-white font-semibold rounded-xl hover:border-amber-500/40 transition-colors"
          >
            Ver destinos
          </a>
        </div>
      </div>
    );
  }

  const featured = deals[0];
  const rest = deals.slice(1);

  return (
    <div className="space-y-8">
      {/* Deal destacado */}
      <div>
        <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 pulse-ring" aria-hidden="true" />
          Deal del momento
        </h2>
        <div className="max-w-sm">
          <DealCard deal={featured} featured />
        </div>
      </div>

      {/* Grid de deals */}
      {rest.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            Últimos chollos cazados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rest.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const FEATURED_DESTINATIONS = [
  { name: "Tanzania", slug: "tanzania", emoji: "🦁", gradient: "from-orange-700 via-amber-800 to-red-900" },
  { name: "Japón", slug: "japon", emoji: "🗼", gradient: "from-pink-600 via-rose-700 to-fuchsia-900" },
  { name: "Maldivas", slug: "maldivas", emoji: "🏝️", gradient: "from-cyan-600 via-sky-700 to-blue-900" },
  { name: "Nueva York", slug: "nueva-york", emoji: "🗽", gradient: "from-indigo-700 via-violet-800 to-slate-900" },
  { name: "Bali", slug: "bali", emoji: "🌴", gradient: "from-emerald-700 via-teal-800 to-green-900" },
  { name: "Buenos Aires", slug: "buenos-aires", emoji: "🥩", gradient: "from-sky-700 via-blue-800 to-indigo-900" },
  { name: "Tailandia", slug: "tailandia", emoji: "🛕", gradient: "from-yellow-600 via-orange-700 to-red-800" },
  { name: "Islandia", slug: "islandia", emoji: "🌋", gradient: "from-slate-600 via-cyan-800 to-blue-950" },
] as const;

export default async function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero con fondo de radar/mapa */}
      <section className="hero-map text-center py-14 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
          Motor activo — rastreando aeropuertos en tiempo real
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          El cazador automático de
          <br />
          <span className="text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.35)]">
            chollos de vuelo
          </span>
        </h1>

        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Error fares, Business class a precio de economy y los mejores chollos
          desde aeropuertos europeos. Rastrea 750+ aerolíneas 24/7.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <a
            href="/deals"
            className="px-6 py-3 btn-gradient text-black font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            Ver todos los deals →
          </a>
          <a
            href="/deals?classification=CR%C3%8DTICO"
            className="px-6 py-3 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            🔥 Solo Error Fares
          </a>
          <a
            href="/deals?cabin=business"
            className="px-6 py-3 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            👑 Business barato
          </a>
        </div>

        {/* Stats dinámicas */}
        <Suspense
          fallback={
            <div className="flex justify-center gap-8 mt-10">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse text-center">
                  <div className="h-8 w-16 bg-gray-800 rounded mx-auto" />
                  <div className="h-4 w-24 bg-gray-800 rounded mt-2 mx-auto" />
                </div>
              ))}
            </div>
          }
        >
          <HeroStats />
        </Suspense>
      </section>

      {/* Buscador en vivo (client component) */}
      <section className="px-4 space-y-6">
        <SearchBar />
        <PopularSearches />
      </section>

      {/* Top Deals */}
      <section>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-64 rounded-xl bg-gray-900 animate-pulse" />
              ))}
            </div>
          }
        >
          <TopDeals />
        </Suspense>
      </section>

      {/* Destinos populares con tarjetas visuales */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">Destinos más buscados</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Guías completas con precio por mes, clima y las mejores épocas para volar.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {FEATURED_DESTINATIONS.map((d) => (
            <DestinationCard key={d.slug} {...d} />
          ))}
        </div>
        <div className="text-center">
          <a
            href="/destinos"
            className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-2 py-1"
          >
            Ver todos los destinos →
          </a>
        </div>
      </section>

      {/* Social proof agregado (flag: habilitar testimonios reales cuando existan) */}
      <Testimonials
        enabled={process.env.NEXT_PUBLIC_TESTIMONIALS_ENABLED === "1"}
      />

      {/* Cómo funciona */}
      <section className="panel p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Cómo funciona TripCazador</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Un motor que nunca duerme, rastreando precios entre 80 aeropuertos y
            750+ aerolíneas. Cuando detecta un chollo, te lo cuenta antes que a nadie.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { n: "01", t: "Rastreo 24/7", d: "El motor busca cada 6 horas en Kiwi, SkyScanner, Ryanair, Travelpayouts y RapidAPI." },
            { n: "02", t: "Detección inteligente", d: "Algoritmo que compara con el histórico y marca errores tarifarios y anomalías." },
            { n: "03", t: "Alerta inmediata", d: "Los deals CRÍTICOS se envían al canal de Telegram en segundos." },
          ].map((s) => (
            <div key={s.n} className="glass rounded-xl p-5 card-hover">
              <div className="text-amber-400 font-mono text-sm">{s.n}</div>
              <div className="text-white font-semibold mt-2">{s.t}</div>
              <p className="text-sm text-gray-300 mt-2">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <a
            href="/telegram"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            📣 Unirme al canal de Telegram
          </a>
        </div>
      </section>
    </div>
  );
}
