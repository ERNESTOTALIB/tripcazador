import { Suspense } from "react";
import Image from "next/image";
import { getTopDeals, getDeals } from "@/lib/api";
import { DealCard } from "@/components/DealCard";
import SearchBar from "@/components/SearchBar";
import { DestinationCard } from "@/components/DestinationCard";
import { Testimonials } from "@/components/Testimonials";
import { PopularSearches } from "@/components/PopularSearches";
import { EmptyRadar } from "@/components/EmptyRadar";
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
    <div className="flex flex-wrap justify-center gap-8 sm:gap-12 text-center mt-10">
      <div>
        <div className="text-4xl font-bold text-amber-400 tabular-nums drop-shadow-[0_2px_12px_rgba(245,158,11,0.4)]">
          {stats.total}
        </div>
        <div className="text-sm text-gray-200 mt-1">Deals activos</div>
      </div>
      <div>
        <div className="text-4xl font-bold text-amber-400 tabular-nums drop-shadow-[0_2px_12px_rgba(245,158,11,0.4)]">
          {stats.price_min > 0 ? `${stats.price_min.toFixed(0)}€` : "—"}
        </div>
        <div className="text-sm text-gray-200 mt-1">Precio mínimo</div>
      </div>
      <div>
        <div className="text-4xl font-bold text-amber-400 tabular-nums drop-shadow-[0_2px_12px_rgba(245,158,11,0.4)]">
          {stats.verified_count}
        </div>
        <div className="text-sm text-gray-200 mt-1">Verificados 2+ fuentes</div>
      </div>
      <div>
        <div className="text-4xl font-bold text-amber-400 drop-shadow-[0_2px_12px_rgba(245,158,11,0.4)]">
          24h
        </div>
        <div className="text-sm text-gray-200 mt-1">Actualización</div>
      </div>
    </div>
  );
}

async function TopDeals() {
  const deals = await getTopDeals(9);
  if (!deals || deals.length === 0) {
    return (
      <EmptyRadar
        title="El motor está rastreando en este momento."
        subtitle="Estamos comprobando 80 aeropuertos europeos y cientos de aerolíneas. Vuelve en unas horas o suscríbete al canal de Telegram para no perderte el próximo chollo."
      >
        <a
          href="/telegram"
          className="cta-lift px-5 py-2.5 btn-gradient text-black font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          Unirme al Telegram
        </a>
        <a
          href="/destinos"
          className="px-5 py-2.5 glass text-white font-semibold rounded-xl hover:border-amber-500/40 transition-colors"
        >
          Ver destinos
        </a>
      </EmptyRadar>
    );
  }

  const featured = deals[0];
  const rest = deals.slice(1);

  return (
    <div className="space-y-10">
      {/* Deal destacado */}
      <div>
        <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 pulse-ring" aria-hidden="true" />
          Deal del momento
        </h2>
        <div className="max-w-md">
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

interface FeaturedDestination {
  name: string;
  slug: string;
  kicker: string;
  tagline: string;
  imageUrl: string;
  gradient: string;
}

const UNSPLASH = (id: string, w = 800, q = 75) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`;

const FEATURED_DESTINATIONS: FeaturedDestination[] = [
  {
    name: "Tanzania", slug: "tanzania", kicker: "Safari",
    tagline: "Serengeti + Zanzíbar",
    imageUrl: UNSPLASH("1516426122078-c23e76319801"),
    gradient: "from-orange-700 via-amber-800 to-red-900",
  },
  {
    name: "Japón", slug: "japon", kicker: "Sakura",
    tagline: "Error fares Tokio",
    imageUrl: UNSPLASH("1540959733332-eab4deabeeaf"),
    gradient: "from-pink-600 via-rose-700 to-fuchsia-900",
  },
  {
    name: "Maldivas", slug: "maldivas", kicker: "Paraíso",
    tagline: "Business desde 900€",
    imageUrl: UNSPLASH("1540541338287-41700207dee6"),
    gradient: "from-cyan-600 via-sky-700 to-blue-900",
  },
  {
    name: "Nueva York", slug: "nueva-york", kicker: "Transatlántico",
    tagline: "Business DL/AA/UA",
    imageUrl: UNSPLASH("1496442226666-8d4d0e62e6e9"),
    gradient: "from-indigo-700 via-violet-800 to-slate-900",
  },
  {
    name: "Bali", slug: "bali", kicker: "Trópico",
    tagline: "Vía SIN o DOH",
    imageUrl: UNSPLASH("1537996194471-e657df975ab4"),
    gradient: "from-emerald-700 via-teal-800 to-green-900",
  },
  {
    name: "Buenos Aires", slug: "buenos-aires", kicker: "Latinoamérica",
    tagline: "Iberia + Aerolíneas",
    imageUrl: UNSPLASH("1589909202802-8f4aadce1849"),
    gradient: "from-sky-700 via-blue-800 to-indigo-900",
  },
  {
    name: "Tailandia", slug: "tailandia", kicker: "Sudeste Asiático",
    tagline: "Bangkok · Phuket",
    imageUrl: UNSPLASH("1508009603885-50cf7c579365"),
    gradient: "from-yellow-600 via-orange-700 to-red-800",
  },
  {
    name: "Islandia", slug: "islandia", kicker: "Auroras",
    tagline: "Directos desde 89€",
    imageUrl: UNSPLASH("1529963183134-61a90db47eaf"),
    gradient: "from-slate-600 via-cyan-800 to-blue-950",
  },
];

export default async function HomePage() {
  return (
    <div className="space-y-16">
      {/* ───────────── HERO con fondo fotográfico ───────────── */}
      <section className="relative overflow-hidden rounded-3xl -mt-4">
        {/* Foto aérea de avión / nubes */}
        <div className="absolute inset-0 -z-10">
          <Image
            src={UNSPLASH("1436491865332-7a61a109cc05", 2000, 80)}
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            quality={80}
          />
          {/* Capas de oscurecimiento y tinte cálido */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/70 to-gray-950" />
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/25 via-transparent to-transparent mix-blend-multiply" />
          {/* Grid radar sutil */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.08] mix-blend-screen"
            aria-hidden="true"
          >
            <defs>
              <pattern id="hero-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" stroke="white" strokeWidth="0.5" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        <div className="hero-entrance text-center py-20 sm:py-28 px-6 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-medium backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
            Motor activo — rastreando aeropuertos en tiempo real
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
            El cazador automático de
            <br />
            <span className="text-amber-400 drop-shadow-[0_0_30px_rgba(245,158,11,0.5)]">
              chollos de vuelo
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            Error fares, Business class a precio de economy y los mejores chollos
            desde aeropuertos europeos. Rastreamos 750+ aerolíneas 24/7.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href="/deals"
              className="cta-lift px-6 py-3 btn-gradient text-black font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              Ver todos los deals →
            </a>
            <a
              href="/deals?classification=CR%C3%8DTICO"
              className="px-6 py-3 bg-red-500/15 border border-red-500/40 hover:bg-red-500/25 text-red-200 font-semibold rounded-xl transition-colors backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              Solo Error Fares
            </a>
            <a
              href="/deals?cabin=business"
              className="px-6 py-3 bg-purple-500/15 border border-purple-500/40 hover:bg-purple-500/25 text-purple-200 font-semibold rounded-xl transition-colors backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              Business barato
            </a>
          </div>

          {/* Stats dinámicas */}
          <Suspense
            fallback={
              <div className="flex justify-center gap-8 mt-10">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse text-center">
                    <div className="h-8 w-16 bg-white/10 rounded mx-auto" />
                    <div className="h-4 w-24 bg-white/10 rounded mt-2 mx-auto" />
                  </div>
                ))}
              </div>
            }
          >
            <HeroStats />
          </Suspense>
        </div>
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
            <div className="space-y-8">
              <div className="h-80 max-w-md rounded-xl bg-gray-900 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="h-72 rounded-xl bg-gray-900 animate-pulse" />
                ))}
              </div>
            </div>
          }
        >
          <TopDeals />
        </Suspense>
      </section>

      {/* ───────────── Destinos populares con fotografías reales ───────────── */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Destinos más buscados
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Guías completas con la mejor época para volar, clima mes a mes y los
            chollos activos que el motor está siguiendo ahora.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {FEATURED_DESTINATIONS.map((d, idx) => (
            <DestinationCard
              key={d.slug}
              name={d.name}
              slug={d.slug}
              imageUrl={d.imageUrl}
              gradient={d.gradient}
              kicker={d.kicker}
              tagline={d.tagline}
              priority={idx < 4}
            />
          ))}
        </div>
        <div className="text-center pt-2">
          <a
            href="/destinos"
            className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-2 py-1"
          >
            Ver todos los destinos →
          </a>
        </div>
      </section>

      {/* ───────────── Trust / metricas con fotografía ───────────── */}
      <section className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 -z-10">
          <Image
            src={UNSPLASH("1569154941061-e231b4725ef1", 1600, 75)}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            className="object-cover"
            quality={75}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/95 via-gray-950/85 to-gray-950/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-950/80" />
        </div>
        <div className="p-8 sm:p-12 space-y-6">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Datos reales, no humo
            </h2>
            <p className="text-gray-200">
              No somos otro agregador de precios: el motor compara con histórico,
              cruza fuentes y clasifica cada chollo por severidad. Esto es lo que
              hemos hecho desde que arrancó TripCazador.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { n: "80+", t: "Aeropuertos europeos rastreados" },
              { n: "750+", t: "Aerolíneas monitorizadas" },
              { n: "6h", t: "Frecuencia de barrido completo" },
              { n: "2+", t: "Fuentes cruzadas por deal verificado" },
            ].map((s) => (
              <div key={s.t} className="glass rounded-xl p-4 border border-white/10">
                <div className="text-3xl font-bold text-amber-400 drop-shadow-[0_2px_8px_rgba(245,158,11,0.35)] tabular-nums">
                  {s.n}
                </div>
                <div className="text-sm text-gray-300 mt-1 leading-tight">{s.t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof agregado (flag: habilitar testimonios reales cuando existan) */}
      <Testimonials
        enabled={process.env.NEXT_PUBLIC_TESTIMONIALS_ENABLED === "1"}
      />

      {/* ───────────── Cómo funciona ───────────── */}
      <section className="panel p-8 sm:p-10 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Cómo funciona TripCazador
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Un motor que nunca duerme, rastreando precios entre 80 aeropuertos y
            750+ aerolíneas. Cuando detecta un chollo, te lo cuenta antes que a nadie.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              n: "01",
              t: "Rastreo 24/7",
              d: "Rastreamos cientos de aerolíneas y agregadores cada 6 horas, sin descanso.",
              icon: (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3v18M3 12h18M5.64 5.64l12.72 12.72M18.36 5.64L5.64 18.36" opacity="0.4" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                </svg>
              ),
            },
            {
              n: "02",
              t: "Detección inteligente",
              d: "Algoritmo que compara con el histórico y marca errores tarifarios y anomalías.",
              icon: (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l5-5 4 4 8-9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 7h6v6" />
                </svg>
              ),
            },
            {
              n: "03",
              t: "Alerta inmediata",
              d: "Los deals CRÍTICOS se envían al canal de Telegram en segundos.",
              icon: (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
                </svg>
              ),
            },
          ].map((s) => (
            <div key={s.n} className="glass rounded-xl p-6 card-hover border border-gray-800 hover:border-amber-500/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="text-amber-400">{s.icon}</div>
                <div className="text-amber-500/50 font-mono text-sm">{s.n}</div>
              </div>
              <div className="text-white font-semibold text-lg">{s.t}</div>
              <p className="text-sm text-gray-300 mt-2 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── CTA final con fondo de mapa ───────────── */}
      <section className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 -z-10">
          <Image
            src={UNSPLASH("1488085061387-422e29b40080", 1600, 75)}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            className="object-cover"
            quality={75}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/90 to-gray-950/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-amber-900/30 via-transparent to-transparent mix-blend-multiply" />
        </div>
        <div className="p-10 sm:p-14 text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
            No te pierdas el próximo chollo
          </h2>
          <p className="text-gray-200 max-w-xl mx-auto text-lg">
            Los error fares CRÍTICOS duran minutos. Únete al canal y recibe las
            alertas en tiempo real, antes de que la aerolínea las retire.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <a
              href="/telegram"
              className="inline-flex items-center gap-2 px-6 py-3 btn-gradient text-black font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
              </svg>
              Unirme al Telegram
            </a>
            <a
              href="/deals"
              className="px-6 py-3 glass text-white font-semibold rounded-xl hover:border-amber-500/40 transition-colors"
            >
              Explorar deals
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
