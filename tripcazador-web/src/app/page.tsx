import { Suspense } from "react";
import { getDeals, getAttractiveDeals, type Deal } from "@/lib/api";
import { DealCard } from "@/components/DealCard";
// fase vv VV13: SearchBar legacy retirado del home (SkyHero ya cubre todo)
import { DestinationCard } from "@/components/DestinationCard";
import { Testimonials } from "@/components/Testimonials";
import { JsonLd } from "@/components/JsonLd";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { SkyHero, type FloatingDeal } from "@/components/SkyHero";
import { TrendingNowWidget } from "@/components/TrendingNowWidget";
import { SocialProofStrip } from "@/components/SocialProofStrip";
import { RecentSearchesStrip } from "@/components/RecentSearchesStrip";
import { MyFeedStrip } from "@/components/MyFeedStrip";
import { HotelDealsStrip } from "@/components/HotelDealsStrip";
import { PushNotificationOptIn } from "@/components/PushNotificationOptIn";
import { StreakBadge } from "@/components/StreakBadge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TripCazador — Error fares y chollos de vuelo desde Europa",
  description:
    "El motor automático que rastrea 24/7 los mejores chollos de vuelo, error fares y Business class a precio de economy desde aeropuertos europeos.",
};

// ISR: revalidar cada 5 minutos
export const revalidate = 300;

async function HeroStats() {
  // Sin limit para que stats refleje el total real, no el del query paginado.
  // Bug fase-ee: con limit:1, getDeals (tras wrap) computaba stats sobre 1 deal
  // y la home mostraba "1 Deals activos / 89€" en vez de los totales reales.
  // SSS134: defensive try/catch — si la API externa falla, mostrar stats
  // genéricas en lugar de crashear el Server Component (que disparaba el
  // error.tsx "Algo salió mal en el radar" en home).
  let stats = {
    total: 0,
    price_min: 0,
    verified_count: 0,
    by_region: {} as Record<string, number>,
  };
  try {
    const data = await getDeals();
    if (data?.stats) {
      stats = {
        total: data.stats.total ?? 0,
        price_min: data.stats.price_min ?? 0,
        verified_count: data.stats.verified_count ?? 0,
        by_region: data.stats.by_region ?? {},
      };
    }
  } catch (e) {
    console.warn("[HomePage HeroStats] getDeals fail:", e);
  }
  // G3 fase jj: stats inteligentes — verified_count cuando >0, sino destinos
  const regionCount = Object.keys(stats.by_region || {}).length;
  return (
    <div className="flex flex-wrap justify-center gap-x-10 gap-y-6 text-center mt-10">
      <div>
        <div className="text-3xl sm:text-4xl font-bold text-amber-400 tabular-nums">{stats.total}</div>
        <div className="text-xs sm:text-sm text-gray-300 mt-1 uppercase tracking-wide">Deals activos</div>
      </div>
      <div>
        <div className="text-3xl sm:text-4xl font-bold text-amber-400 tabular-nums">
          {stats.price_min > 0 ? `${stats.price_min.toFixed(0)}€` : "—"}
        </div>
        <div className="text-xs sm:text-sm text-gray-300 mt-1 uppercase tracking-wide">Precio mínimo</div>
      </div>
      {stats.verified_count > 0 ? (
        <div>
          <div className="text-3xl sm:text-4xl font-bold text-amber-400 tabular-nums">
            {stats.verified_count}
          </div>
          <div className="text-xs sm:text-sm text-gray-300 mt-1 uppercase tracking-wide">Verificados</div>
        </div>
      ) : (
        <div>
          <div className="text-3xl sm:text-4xl font-bold text-amber-400 tabular-nums">
            {regionCount > 0 ? regionCount : "7"}
          </div>
          <div className="text-xs sm:text-sm text-gray-300 mt-1 uppercase tracking-wide">Regiones cubiertas</div>
        </div>
      )}
      <div>
        <div className="text-3xl sm:text-4xl font-bold text-amber-400">24/7</div>
        <div className="text-xs sm:text-sm text-gray-300 mt-1 uppercase tracking-wide">Rastreo activo</div>
      </div>
    </div>
  );
}

async function TopDeals() {
  // SSS89: home page = SOLO chollos reales economy.
  // Antes mezclábamos featured(getAttractiveDeals) + rest(getTopDeals), pero
  // getTopDeals incluía business (€2000+) en el grid "Últimos chollos cazados".
  // Usuario quejándose: "QUITA LOS VUELOS BUSINESS DE LA PRIMERA PAGINA".
  // Fix: TODO el pool de la home pasa por getAttractiveDeals (hard-reject
  // business + filter precio ≤ MAX_ATTRACTIVE_PRICE). Business sigue
  // apareciendo en /deals?cabin=business para usuarios premium.
  //
  // SSS134: defensive try/catch — getAttractiveDeals puede lanzar si el
  // fetch a /deals-latest.json o VPS API timeout/falla. Antes crasheaba
  // el Server Component → "Algo salió mal en el radar" en home prod.
  let featured: Deal[] = [];
  try {
    featured = await getAttractiveDeals(12);
  } catch (e) {
    console.warn("[HomePage TopDeals] getAttractiveDeals fail:", e);
    featured = [];
  }
  const featuredHero = featured.slice(0, 3);
  const featuredIds = new Set(featuredHero.map((d) => d.id));
  const deals = [
    ...featuredHero,
    ...featured.filter((d) => !featuredIds.has(d.id)),
  ].slice(0, 12);
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

  // SSS89: `featured` arriba ya devuelve hasta 12 chollos. featuredHero
  // son los 3 destacados; rest son los siguientes 9 ya garantizados
  // economy + precio ≤ MAX_ATTRACTIVE_PRICE.
  const rest = deals.slice(featuredHero.length);

  return (
    <div className="space-y-10">
      {/* Deals destacados — grid 1/2/3 columnas */}
      <div>
        <div className="flex items-end justify-between mb-5">
          <h2 className="text-base font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 pulse-ring" aria-hidden="true" />
            Deals destacados
          </h2>
          <a href="/deals?sort=score" className="text-xs text-gray-400 hover:text-amber-300 transition-colors">
            Ver todos →
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredHero.map((deal) => (
            <DealCard key={deal.id} deal={deal} featured />
          ))}
        </div>
      </div>

      {/* fff F3 — Live trending widget: prueba social en tiempo real */}
      <TrendingNowWidget />

      {/* HHHH01 (May 2026) — SocialProofStrip con stats reales del motor.
          Existía sin uso. Tras audit CF SSS118 (500 unique/día reales),
          añadirlo arriba del NL boost de credibility + conversion del
          signup. Datos: total chollos activos, precio mínimo, último hunt. */}
      <SocialProofStrip />

      {/* SSS95 — Newsletter prominent above-fold: 0 subs detectados en
          monitoring, hay que aumentar visibilidad. Lead magnet PDF concreto. */}
      <NewsletterSignup variant="expanded" context="home-fold" />

      {/* ggg G2 — Push opt-in: permite avisos push instantáneos */}
      <PushNotificationOptIn />

      {/* Grid de deals */}
      {rest.length > 0 && (
        <div>
          <div className="flex items-end justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-300 uppercase tracking-wider">
              Últimos chollos cazados
            </h2>
            <a href="/deals?sort=recent" className="text-xs text-gray-400 hover:text-amber-300 transition-colors">
              Ver todos →
            </a>
          </div>
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

// FAQ estática para JSON-LD. No la rendeizamos visualmente (aún) pero
// Google la muestra en rich snippets cuando la página empieza a rankear.
// Cuando se añada una sección <details>/<summary> en la página, conviene
// mantener ambas fuentes (DOM + JSON-LD) en sincronía.
const HOME_FAQ: Array<{ q: string; a: string }> = [
  {
    q: "¿Qué es un error fare?",
    a: "Un error fare es un precio anormalmente bajo publicado por error por una aerolínea o agencia (tipo de cambio mal aplicado, omisión de tasas, bug en el sistema de reservas). TripCazador los detecta comparando precios en tiempo real contra el histórico de la ruta y los publica en segundos.",
  },
  {
    q: "¿Son fiables los chollos que publicáis?",
    a: "El motor verifica cada deal con al menos dos fuentes independientes (Kiwi, Skyscanner, Ryanair directo, Travelpayouts, RapidAPI) antes de marcarlo como 'verificado'. Los precios cambian en minutos, así que recomendamos reservar rápido y siempre confirmar en la web de la aerolínea antes de pagar.",
  },
  {
    q: "¿Desde qué aeropuertos buscáis?",
    a: "Rastreamos 312 aeropuertos a nivel global, con enfoque especial en DACH (Suiza, Alemania, Austria) y España. Los hubs principales: BSL, ZRH, GVA, FRA, MUC, BER, VIE, MAD, BCN, AGP, VLC, PMI y Canarias.",
  },
  {
    q: "¿Qué es Business a precio de economy?",
    a: "Son tarifas de Business class que por promoción o anomalía del sistema se venden por menos de 500€, en lugar de los 2000-5000€ habituales. Detectamos especialmente vuelos intercontinentales (Europa → Asia, América, África) con cabinas premium a precio de turista.",
  },
  {
    q: "¿Cobráis por las alertas?",
    a: "El canal de Telegram y la web son completamente gratuitos. Financiamos el motor con comisiones de afiliados cuando reservas a través de nuestros enlaces — sin coste extra para ti. No compartimos datos personales con aerolíneas ni anunciantes.",
  },
  {
    q: "¿Con qué frecuencia se actualizan los deals?",
    a: "El motor rastrea en paralelo cada 6 horas (cuatro ciclos al día). Los error fares más críticos se publican en Telegram en menos de 60 segundos desde la detección, antes de que las aerolíneas corrijan el precio.",
  },
];

/**
 * SSS: Genera floating cards reales para SkyHero a partir de deals
 * atractivos. Cada card linka al booking_url DIRECTO (airline / Skyscanner)
 * en nueva pestaña — bug user "ME LLEVA A DEAL, NO AL VUELO CONCRETO".
 */
async function buildHeroFloating(): Promise<FloatingDeal[]> {
  try {
    const deals = await getAttractiveDeals(6);
    return deals.map((d) => {
      const cabinTag = d.cabin === "business" || d.cabin === "first" ? " biz" : "";
      const route = `${d.city_from || d.origin} → ${d.city_to || d.destination}${cabinTag}`;
      const price = `${Math.round(d.price_eur)}€`;
      const savingsBadge = d.savings_pct && d.savings_pct >= 30 ? `-${Math.round(d.savings_pct)}%` : undefined;
      return {
        route,
        price,
        href: d.booking_url || `/deals/${d.id}`,
        external: !!(d.booking_url && d.booking_url.startsWith("http")),
        badge: savingsBadge,
      };
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const heroFloating = await buildHeroFloating();
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  };

  // FFF5 — Organization + WebSite schema para mejor rich results en Google
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TripCazador",
    legalName: "TripCazador",
    url: "https://tripcazador.com",
    logo: "https://tripcazador.com/icon-512.png",
    description: "Cazador de chollos de vuelos y hoteles en tiempo real. Alertas de precio, error fares y comparativas para viajar barato desde España.",
    sameAs: [
      "https://t.me/tripcazador",
      "https://www.instagram.com/tripcazador",
      "https://x.com/tripcazador",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: "contacto@tripcazador.com",
      contactType: "customer support",
      availableLanguage: ["Spanish", "English"],
    },
    foundingDate: "2024",
    areaServed: ["ES", "EU", "Worldwide"],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TripCazador",
    url: "https://tripcazador.com",
    inLanguage: "es-ES",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://tripcazador.com/buscar?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  // SSS142 (11 may 2026) — BISECT v2
  // SSS141 verificó: deshabilitar JsonLd + MyFeed + RecentSearches + Streak +
  // HotelDealsStrip + Testimonials FIX el error "Algo salió mal en el radar".
  // Ahora re-activo TODOS excepto HotelDealsStrip (sospechoso #1: modificó
  // hotel_seed.ts recientemente, es Server Component sin try/catch).
  return (
    <div>
      <JsonLd data={faqSchema} />
      <JsonLd data={orgSchema} />
      <JsonLd data={websiteSchema} />

      <SkyHero floating={heroFloating} />

      <MyFeedStrip />
      <RecentSearchesStrip />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 text-center">
        <StreakBadge />
      </div>

      {/* Stats + chips quick-filters en sección body light, después del hero.
          full-bleed escapando del max-w-7xl del <main> */}
      <section className="bg-gray-950 py-12 sm:py-16" style={{ width: "100vw", marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <a
              href="/deals?classification=CR%C3%8DTICO"
              className="px-5 py-2.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 font-semibold rounded-full text-sm transition-colors"
            >
              🔥 Solo error fares
            </a>
            <a
              href="/deals?cabin=business"
              className="px-5 py-2.5 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 font-semibold rounded-full text-sm transition-colors"
            >
              👑 Business barato
            </a>
            <a
              href="/deals?duration=weekend"
              className="px-5 py-2.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-200 font-semibold rounded-full text-sm transition-colors"
            >
              Fin de semana
            </a>
            <a
              href="/regiones/caribe"
              className="px-5 py-2.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-200 font-semibold rounded-full text-sm transition-colors"
            >
              Caribe
            </a>
            <a
              href="/regiones/asia"
              className="px-5 py-2.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-200 font-semibold rounded-full text-sm transition-colors"
            >
              Asia
            </a>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
        </div>
      </section>

      {/* Resto de secciones en wrapper dark full-bleed.
          fase vv VV13: SearchBar legacy eliminado — el SkyHero arriba ya tiene
          DESDE/A/IDA/VUELTA/CABINA/PRECIO MÁX con autocomplete fuzzy. Las chips
          quick-filter siguen viviendo arriba como atajos. */}
      <div className="bg-gray-950 py-12 space-y-16" style={{ width: "100vw", marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

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

      <HotelDealsStrip />

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
            <DestinationCard key={d.slug} {...d} eager={true} />
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
            className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            📣 Unirme al canal de Telegram
          </a>
        </div>
      </section>

      {/* FAQ — visible en DOM para alinear con schema.org FAQPage (Google exige
          que las preguntas existan en la página, no sólo en el JSON-LD).
          Cada <details> expande sin JS; primera respuesta abierta por defecto. */}
      <section className="panel p-6 sm:p-10 space-y-5">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Preguntas frecuentes</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Lo que más nos preguntan sobre error fares, alertas y cómo funciona TripCazador.
          </p>
        </div>
        <div className="space-y-3 max-w-3xl mx-auto">
          {HOME_FAQ.map(({ q, a }, idx) => (
            <details
              key={q}
              className="group glass rounded-xl p-4 sm:p-5 cursor-pointer focus-within:ring-2 focus-within:ring-amber-400/40"
              open={idx === 0}
            >
              <summary className="font-semibold text-white list-none flex items-start justify-between gap-4 min-h-[44px] items-center">
                <span className="text-base sm:text-lg">{q}</span>
                <span
                  aria-hidden="true"
                  className="text-amber-400 text-xl transition-transform group-open:rotate-45 shrink-0"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-gray-300 text-sm sm:text-base leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* abr-2026r/s: Newsletter signup expanded — captura email tras leer
          FAQ. Conversión típica de bottom-of-page email forms: 3-7%. */}
      <section className="py-10 sm:py-12">
        <NewsletterSignup variant="expanded" context="home-bottom" />
      </section>

      </div>
      </div>
    </div>
  );
}
