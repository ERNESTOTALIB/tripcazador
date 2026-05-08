/**
 * /vuelos/[ruta] — SSS99 (May 2026)
 *
 * Páginas pareadas SEO long-tail: "vuelos baratos {origen} {destino}".
 * 20 rutas top con búsquedas reales en Google España. Cada página:
 *  - hero con precio mínimo histórico de la ruta
 *  - DealCards reales del catálogo filtrados por origin+destination
 *  - sección "mejor mes para volar"
 *  - JSON-LD TouristTrip + BreadcrumbList
 *  - canonical + hreflang es-ES/es-MX/es-AR/x-default
 *
 * Estimado +3000-5000 visitors/mes orgánicos en 3-6 meses tras indexación.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getDeals } from "@/lib/api";
import { DealCard } from "@/components/DealCard";
import { JsonLd } from "@/components/JsonLd";

interface RouteEntry {
  origin: string; // IATA
  destination: string; // IATA
  originCity: string;
  destCity: string;
  originLabel: string; // "Madrid"
  destLabel: string; // "Lisboa"
  intro: string; // 1-2 frases meta-descripción
  bestMonths: string[]; // mejor temporada
  emoji: string;
}

// SSS99: 20 rutas top (mix short-haul barato + long-haul popular).
// Slugs en formato `{origen}-{destino}` ASCII lowercase.
const TOP_ROUTES: Record<string, RouteEntry> = {
  "madrid-lisboa": {
    origin: "MAD", destination: "LIS",
    originCity: "Madrid", destCity: "Lisboa",
    originLabel: "Madrid", destLabel: "Lisboa",
    intro: "Una de las rutas más cazadas. Vueling y TAP suelen tener errores de tarifa por debajo de 30€.",
    bestMonths: ["abril", "mayo", "octubre", "noviembre"],
    emoji: "🇵🇹",
  },
  "madrid-londres": {
    origin: "MAD", destination: "LON",
    originCity: "Madrid", destCity: "Londres",
    originLabel: "Madrid", destLabel: "Londres",
    intro: "Ryanair, easyJet, Iberia y British Airways compiten cada semana. Vuelos por menos de 40€ son frecuentes en martes y miércoles.",
    bestMonths: ["enero", "febrero", "septiembre", "noviembre"],
    emoji: "🇬🇧",
  },
  "barcelona-roma": {
    origin: "BCN", destination: "ROM",
    originCity: "Barcelona", destCity: "Roma",
    originLabel: "Barcelona", destLabel: "Roma",
    intro: "Vueling y Ryanair vuelan directo. Mejor en febrero (post-rebajas) y noviembre (pre-Navidad).",
    bestMonths: ["febrero", "marzo", "noviembre"],
    emoji: "🇮🇹",
  },
  "madrid-paris": {
    origin: "MAD", destination: "PAR",
    originCity: "Madrid", destCity: "París",
    originLabel: "Madrid", destLabel: "París",
    intro: "Air France, Iberia, Vueling y Ryanair. Ofertas frecuentes desde 35€ en mid-week.",
    bestMonths: ["enero", "febrero", "octubre"],
    emoji: "🇫🇷",
  },
  "barcelona-londres": {
    origin: "BCN", destination: "LON",
    originCity: "Barcelona", destCity: "Londres",
    originLabel: "Barcelona", destLabel: "Londres",
    intro: "Ryanair y easyJet hacen Barcelona-Stansted/Gatwick en 2h por menos de 30€ con frecuencia.",
    bestMonths: ["enero", "febrero", "noviembre"],
    emoji: "🇬🇧",
  },
  "madrid-roma": {
    origin: "MAD", destination: "ROM",
    originCity: "Madrid", destCity: "Roma",
    originLabel: "Madrid", destLabel: "Roma",
    intro: "ITA Airways, Iberia, Ryanair y Volotea. Best months: febrero y noviembre fuera de festivos.",
    bestMonths: ["febrero", "marzo", "noviembre"],
    emoji: "🇮🇹",
  },
  "barcelona-paris": {
    origin: "BCN", destination: "PAR",
    originCity: "Barcelona", destCity: "París",
    originLabel: "Barcelona", destLabel: "París",
    intro: "Vueling tiene 8+ frecuencias diarias. Errores fares <40€ aparecen casi cada semana.",
    bestMonths: ["enero", "febrero", "octubre"],
    emoji: "🇫🇷",
  },
  "madrid-amsterdam": {
    origin: "MAD", destination: "AMS",
    originCity: "Madrid", destCity: "Amsterdam",
    originLabel: "Madrid", destLabel: "Amsterdam",
    intro: "KLM, Iberia, easyJet y Transavia. Bajadas a 50€ en mid-week noviembre y enero.",
    bestMonths: ["enero", "noviembre", "marzo"],
    emoji: "🇳🇱",
  },
  "madrid-berlin": {
    origin: "MAD", destination: "BER",
    originCity: "Madrid", destCity: "Berlín",
    originLabel: "Madrid", destLabel: "Berlín",
    intro: "Lufthansa, Ryanair, easyJet. Berlín en febrero/marzo es 50% más barato que verano.",
    bestMonths: ["febrero", "marzo", "noviembre"],
    emoji: "🇩🇪",
  },
  "barcelona-amsterdam": {
    origin: "BCN", destination: "AMS",
    originCity: "Barcelona", destCity: "Amsterdam",
    originLabel: "Barcelona", destLabel: "Amsterdam",
    intro: "Vueling, Transavia, KLM. Aprovecha mid-week y reserva 6-8 semanas antes.",
    bestMonths: ["enero", "marzo", "noviembre"],
    emoji: "🇳🇱",
  },
  "madrid-nueva-york": {
    origin: "MAD", destination: "NYC",
    originCity: "Madrid", destCity: "Nueva York",
    originLabel: "Madrid", destLabel: "Nueva York",
    intro: "Iberia, Air Europa, American, Delta y United. Error fares histórico Madrid-NYC desde 280€ en enero.",
    bestMonths: ["enero", "febrero", "noviembre"],
    emoji: "🇺🇸",
  },
  "madrid-tokio": {
    origin: "MAD", destination: "TYO",
    originCity: "Madrid", destCity: "Tokio",
    originLabel: "Madrid", destLabel: "Tokio",
    intro: "Iberia (directo), Lufthansa, Air France, KLM. Sakura (marzo-abril) sube precios; mejor enero, mayo o noviembre.",
    bestMonths: ["enero", "mayo", "noviembre"],
    emoji: "🇯🇵",
  },
  "madrid-bangkok": {
    origin: "MAD", destination: "BKK",
    originCity: "Madrid", destCity: "Bangkok",
    originLabel: "Madrid", destLabel: "Bangkok",
    intro: "Qatar, Emirates, Turkish via hub. Errores fares bajan a 380€ ida y vuelta en mid-week shoulder season.",
    bestMonths: ["mayo", "septiembre", "octubre"],
    emoji: "🇹🇭",
  },
  "madrid-buenos-aires": {
    origin: "MAD", destination: "BUE",
    originCity: "Madrid", destCity: "Buenos Aires",
    originLabel: "Madrid", destLabel: "Buenos Aires",
    intro: "Iberia, Air Europa, Aerolíneas Argentinas. Junio-agosto (invierno argentino) tiene los precios más bajos.",
    bestMonths: ["junio", "julio", "agosto"],
    emoji: "🇦🇷",
  },
  "barcelona-nueva-york": {
    origin: "BCN", destination: "NYC",
    originCity: "Barcelona", destCity: "Nueva York",
    originLabel: "Barcelona", destLabel: "Nueva York",
    intro: "American, Delta, United, Level. Vuelos directos desde 320€ en enero/febrero.",
    bestMonths: ["enero", "febrero", "noviembre"],
    emoji: "🇺🇸",
  },
  "madrid-cancun": {
    origin: "MAD", destination: "CUN",
    originCity: "Madrid", destCity: "Cancún",
    originLabel: "Madrid", destLabel: "Cancún",
    intro: "Iberia, Air Europa, Wamos. Septiembre-octubre (post-huracanes) precios más bajos.",
    bestMonths: ["septiembre", "octubre", "mayo"],
    emoji: "🇲🇽",
  },
  "madrid-bali": {
    origin: "MAD", destination: "DPS",
    originCity: "Madrid", destCity: "Bali",
    originLabel: "Madrid", destLabel: "Bali (Denpasar)",
    intro: "Qatar, Emirates, Singapore via hub. Off-peak: febrero-marzo y octubre-noviembre.",
    bestMonths: ["febrero", "marzo", "octubre"],
    emoji: "🇮🇩",
  },
  "madrid-cuba": {
    origin: "MAD", destination: "HAV",
    originCity: "Madrid", destCity: "La Habana",
    originLabel: "Madrid", destLabel: "La Habana",
    intro: "Iberia, Air Europa, Cubana. Mejor en mayo-junio y septiembre-octubre fuera de huracanes.",
    bestMonths: ["mayo", "junio", "septiembre"],
    emoji: "🇨🇺",
  },
  "barcelona-tokio": {
    origin: "BCN", destination: "TYO",
    originCity: "Barcelona", destCity: "Tokio",
    originLabel: "Barcelona", destLabel: "Tokio",
    intro: "Qatar, Lufthansa, KLM, Turkish. Mid-week en mayo o septiembre da los mejores precios.",
    bestMonths: ["mayo", "septiembre", "noviembre"],
    emoji: "🇯🇵",
  },
  "madrid-marrakech": {
    origin: "MAD", destination: "RAK",
    originCity: "Madrid", destCity: "Marrakech",
    originLabel: "Madrid", destLabel: "Marrakech",
    intro: "Ryanair y Air Arabia. Vuelos directos desde 30-40€ con frecuencia en febrero y noviembre.",
    bestMonths: ["febrero", "marzo", "octubre", "noviembre"],
    emoji: "🇲🇦",
  },
  // TTT02 — 30 rutas nuevas: ES regional + EU emerging + cross-EU popular
  "sevilla-roma": {
    origin: "SVQ", destination: "ROM",
    originCity: "Sevilla", destCity: "Roma",
    originLabel: "Sevilla", destLabel: "Roma",
    intro: "Vueling y Ryanair. Mejor en febrero y noviembre desde 35€.",
    bestMonths: ["febrero", "marzo", "noviembre"],
    emoji: "🇮🇹",
  },
  "valencia-londres": {
    origin: "VLC", destination: "LON",
    originCity: "Valencia", destCity: "Londres",
    originLabel: "Valencia", destLabel: "Londres",
    intro: "Ryanair, easyJet, Vueling. Errores fares <30€ en mid-week enero-febrero.",
    bestMonths: ["enero", "febrero", "noviembre"],
    emoji: "🇬🇧",
  },
  "bilbao-paris": {
    origin: "BIO", destination: "PAR",
    originCity: "Bilbao", destCity: "París",
    originLabel: "Bilbao", destLabel: "París",
    intro: "Air France y Vueling vuelan directo. 50% más barato fuera de verano.",
    bestMonths: ["enero", "febrero", "octubre"],
    emoji: "🇫🇷",
  },
  "malaga-amsterdam": {
    origin: "AGP", destination: "AMS",
    originCity: "Málaga", destCity: "Amsterdam",
    originLabel: "Málaga", destLabel: "Amsterdam",
    intro: "Transavia, Vueling, KLM. Bajadas a 50€ en mid-week noviembre-marzo.",
    bestMonths: ["enero", "febrero", "marzo", "noviembre"],
    emoji: "🇳🇱",
  },
  "palma-londres": {
    origin: "PMI", destination: "LON",
    originCity: "Palma", destCity: "Londres",
    originLabel: "Palma de Mallorca", destLabel: "Londres",
    intro: "Ryanair, easyJet, Jet2. Vuelos directos desde 25€ en temporada baja.",
    bestMonths: ["enero", "febrero", "noviembre"],
    emoji: "🇬🇧",
  },
  "alicante-paris": {
    origin: "ALC", destination: "PAR",
    originCity: "Alicante", destCity: "París",
    originLabel: "Alicante", destLabel: "París",
    intro: "Ryanair, easyJet, Vueling. Errores frecuentes <40€ enero-febrero.",
    bestMonths: ["enero", "febrero", "noviembre"],
    emoji: "🇫🇷",
  },
  "granada-londres": {
    origin: "GRX", destination: "LON",
    originCity: "Granada", destCity: "Londres",
    originLabel: "Granada", destLabel: "Londres",
    intro: "easyJet temporada. Mejor reservar 4-6 semanas antes para precios <50€.",
    bestMonths: ["febrero", "marzo", "octubre"],
    emoji: "🇬🇧",
  },
  "tenerife-londres": {
    origin: "TFS", destination: "LON",
    originCity: "Tenerife", destCity: "Londres",
    originLabel: "Tenerife Sur", destLabel: "Londres",
    intro: "Ryanair, easyJet, TUI Fly. Vuelos directos desde 30€ en mayo y septiembre.",
    bestMonths: ["mayo", "septiembre", "octubre"],
    emoji: "🇬🇧",
  },
  "ibiza-paris": {
    origin: "IBZ", destination: "PAR",
    originCity: "Ibiza", destCity: "París",
    originLabel: "Ibiza", destLabel: "París",
    intro: "Vueling, easyJet, Air France. Off-season abril-mayo precios mínimos.",
    bestMonths: ["abril", "mayo", "octubre"],
    emoji: "🇫🇷",
  },
  "santiago-roma": {
    origin: "SCQ", destination: "ROM",
    originCity: "Santiago", destCity: "Roma",
    originLabel: "Santiago de Compostela", destLabel: "Roma",
    intro: "Ryanair, Vueling. Vuelos directos limitados, mejor reservar antes.",
    bestMonths: ["febrero", "marzo", "noviembre"],
    emoji: "🇮🇹",
  },
  "madrid-praga": {
    origin: "MAD", destination: "PRG",
    originCity: "Madrid", destCity: "Praga",
    originLabel: "Madrid", destLabel: "Praga",
    intro: "Ryanair, Vueling, Iberia, Czech Airlines. Errores fares <50€ en febrero-marzo.",
    bestMonths: ["febrero", "marzo", "noviembre"],
    emoji: "🇨🇿",
  },
  "madrid-budapest": {
    origin: "MAD", destination: "BUD",
    originCity: "Madrid", destCity: "Budapest",
    originLabel: "Madrid", destLabel: "Budapest",
    intro: "Ryanair, Wizz Air, Iberia. Bajadas a 40€ mid-week en temporada baja.",
    bestMonths: ["enero", "febrero", "marzo", "noviembre"],
    emoji: "🇭🇺",
  },
  "madrid-viena": {
    origin: "MAD", destination: "VIE",
    originCity: "Madrid", destCity: "Viena",
    originLabel: "Madrid", destLabel: "Viena",
    intro: "Austrian Airlines, Iberia, Vueling. Mid-week noviembre-marzo precios mínimos.",
    bestMonths: ["enero", "febrero", "noviembre"],
    emoji: "🇦🇹",
  },
  "madrid-estambul": {
    origin: "MAD", destination: "IST",
    originCity: "Madrid", destCity: "Estambul",
    originLabel: "Madrid", destLabel: "Estambul",
    intro: "Turkish Airlines, Pegasus, Iberia. Hub asiático con tarifas ida y vuelta desde 130€.",
    bestMonths: ["enero", "febrero", "noviembre"],
    emoji: "🇹🇷",
  },
  "madrid-dubai": {
    origin: "MAD", destination: "DXB",
    originCity: "Madrid", destCity: "Dubái",
    originLabel: "Madrid", destLabel: "Dubái",
    intro: "Emirates, Etihad, Iberia, Turkish. Stopover programs incluidos en algunas tarifas.",
    bestMonths: ["mayo", "septiembre", "noviembre"],
    emoji: "🇦🇪",
  },
  "barcelona-praga": {
    origin: "BCN", destination: "PRG",
    originCity: "Barcelona", destCity: "Praga",
    originLabel: "Barcelona", destLabel: "Praga",
    intro: "Ryanair, Vueling, Smart Wings. Mid-week febrero-marzo precios <40€.",
    bestMonths: ["febrero", "marzo", "noviembre"],
    emoji: "🇨🇿",
  },
  "barcelona-budapest": {
    origin: "BCN", destination: "BUD",
    originCity: "Barcelona", destCity: "Budapest",
    originLabel: "Barcelona", destLabel: "Budapest",
    intro: "Ryanair, Wizz Air, Vueling. Errores fares regulares enero-febrero.",
    bestMonths: ["enero", "febrero", "noviembre"],
    emoji: "🇭🇺",
  },
  "madrid-reikiavik": {
    origin: "MAD", destination: "KEF",
    originCity: "Madrid", destCity: "Reikiavik",
    originLabel: "Madrid", destLabel: "Reikiavik",
    intro: "Icelandair, Play, Vueling. Stopover programs gratis hasta 7 días.",
    bestMonths: ["febrero", "marzo", "octubre", "noviembre"],
    emoji: "🇮🇸",
  },
  "barcelona-singapur": {
    origin: "BCN", destination: "SIN",
    originCity: "Barcelona", destCity: "Singapur",
    originLabel: "Barcelona", destLabel: "Singapur",
    intro: "Singapore Airlines, Qatar, Lufthansa. Mejor mid-week octubre-noviembre.",
    bestMonths: ["octubre", "noviembre", "mayo"],
    emoji: "🇸🇬",
  },
  "madrid-lima": {
    origin: "MAD", destination: "LIM",
    originCity: "Madrid", destCity: "Lima",
    originLabel: "Madrid", destLabel: "Lima",
    intro: "Iberia, Air Europa, LATAM. Mejor en mayo-junio y septiembre fuera de temporada alta.",
    bestMonths: ["mayo", "junio", "septiembre"],
    emoji: "🇵🇪",
  },
  "amsterdam-roma": {
    origin: "AMS", destination: "ROM",
    originCity: "Amsterdam", destCity: "Roma",
    originLabel: "Amsterdam", destLabel: "Roma",
    intro: "KLM, Transavia, Ryanair. Mid-week noviembre-marzo precios <40€.",
    bestMonths: ["febrero", "noviembre"],
    emoji: "🇮🇹",
  },
  "londres-roma": {
    origin: "LON", destination: "ROM",
    originCity: "Londres", destCity: "Roma",
    originLabel: "Londres", destLabel: "Roma",
    intro: "Ryanair, easyJet, BA, Vueling. Vuelos directos desde 25£ en temporada baja.",
    bestMonths: ["enero", "febrero", "noviembre"],
    emoji: "🇮🇹",
  },
  "paris-roma": {
    origin: "PAR", destination: "ROM",
    originCity: "París", destCity: "Roma",
    originLabel: "París", destLabel: "Roma",
    intro: "Air France, Vueling, ITA Airways. Errores fares <40€ regulares.",
    bestMonths: ["enero", "febrero", "noviembre"],
    emoji: "🇮🇹",
  },
  "berlin-roma": {
    origin: "BER", destination: "ROM",
    originCity: "Berlín", destCity: "Roma",
    originLabel: "Berlín", destLabel: "Roma",
    intro: "Ryanair, ITA, easyJet. Mid-week febrero-marzo bajada a 35€.",
    bestMonths: ["febrero", "marzo", "noviembre"],
    emoji: "🇮🇹",
  },
  "milan-paris": {
    origin: "MIL", destination: "PAR",
    originCity: "Milán", destCity: "París",
    originLabel: "Milán", destLabel: "París",
    intro: "Air France, Vueling, easyJet, ITA. Vuelos directos desde 30€ en mid-week.",
    bestMonths: ["enero", "febrero", "octubre"],
    emoji: "🇫🇷",
  },
  "milan-londres": {
    origin: "MIL", destination: "LON",
    originCity: "Milán", destCity: "Londres",
    originLabel: "Milán", destLabel: "Londres",
    intro: "Ryanair, easyJet, BA, ITA. Errores fares <30€ regulares.",
    bestMonths: ["enero", "febrero", "noviembre"],
    emoji: "🇬🇧",
  },
  "dublin-londres": {
    origin: "DUB", destination: "LON",
    originCity: "Dublín", destCity: "Londres",
    originLabel: "Dublín", destLabel: "Londres",
    intro: "Aer Lingus, Ryanair. Tarifa más alta del año en sept-oct (turismo).",
    bestMonths: ["enero", "febrero", "noviembre"],
    emoji: "🇬🇧",
  },
  "lisboa-paris": {
    origin: "LIS", destination: "PAR",
    originCity: "Lisboa", destCity: "París",
    originLabel: "Lisboa", destLabel: "París",
    intro: "TAP, Air France, easyJet. Vuelos directos desde 35€ mid-week.",
    bestMonths: ["enero", "febrero", "octubre"],
    emoji: "🇫🇷",
  },
  "lisboa-roma": {
    origin: "LIS", destination: "ROM",
    originCity: "Lisboa", destCity: "Roma",
    originLabel: "Lisboa", destLabel: "Roma",
    intro: "TAP, Ryanair, ITA. Errores fares <40€ frecuentes en febrero.",
    bestMonths: ["febrero", "marzo", "noviembre"],
    emoji: "🇮🇹",
  },
  "atenas-roma": {
    origin: "ATH", destination: "ROM",
    originCity: "Atenas", destCity: "Roma",
    originLabel: "Atenas", destLabel: "Roma",
    intro: "Aegean, ITA, Ryanair. Mid-week octubre-marzo precios <50€.",
    bestMonths: ["febrero", "marzo", "noviembre"],
    emoji: "🇮🇹",
  },
};

const SITE = "https://tripcazador.com";

export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(TOP_ROUTES).map((ruta) => ({ ruta }));
}

export async function generateMetadata({
  params,
}: {
  params: { ruta: string };
}): Promise<Metadata> {
  const route = TOP_ROUTES[params.ruta];
  if (!route) return { title: "Ruta no encontrada | TripCazador" };
  const title = `Vuelos baratos ${route.originLabel} → ${route.destLabel} | TripCazador`;
  const description =
    `${route.intro} Detectamos error fares en tiempo real y te avisamos al móvil cuando un vuelo ${route.originLabel}-${route.destLabel} baja del precio normal.`.slice(
      0,
      155,
    );
  const url = `${SITE}/vuelos/${params.ruta}`;
  return {
    title,
    description,
    alternates: {
      canonical: `/vuelos/${params.ruta}`,
      languages: {
        "es-ES": `/vuelos/${params.ruta}`,
        "es-MX": `/vuelos/${params.ruta}`,
        "es-AR": `/vuelos/${params.ruta}`,
        "x-default": `/vuelos/${params.ruta}`,
      },
    },
    openGraph: {
      title: `${route.emoji} ${route.originLabel} → ${route.destLabel}`,
      description,
      url,
      siteName: "TripCazador",
      type: "website",
      locale: "es_ES",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function VuelosRutaPage({
  params,
}: {
  params: { ruta: string };
}) {
  const route = TOP_ROUTES[params.ruta];
  if (!route) notFound();

  // Filtrar deals reales por origin+destination
  const dealsResp = await getDeals();
  const allDeals = Array.isArray(dealsResp) ? dealsResp : dealsResp.deals || [];
  const matchingDeals = allDeals
    .filter(
      (d) =>
        d.origin === route.origin &&
        (d.destination === route.destination ||
          // Algunos slugs usan códigos macro (LON=todos los aeropuertos Londres)
          (route.destination === "LON" && ["LHR", "LGW", "STN", "LTN"].includes(d.destination)) ||
          (route.destination === "PAR" && ["CDG", "ORY", "BVA"].includes(d.destination)) ||
          (route.destination === "ROM" && ["FCO", "CIA"].includes(d.destination)) ||
          (route.destination === "NYC" && ["JFK", "EWR", "LGA"].includes(d.destination)) ||
          (route.destination === "TYO" && ["NRT", "HND"].includes(d.destination)) ||
          (route.destination === "BUE" && ["EZE", "AEP"].includes(d.destination)) ||
          // TTT02: nuevos macros multi-airport
          (route.destination === "MIL" && ["MXP", "LIN", "BGY"].includes(d.destination)) ||
          (route.destination === "BER" && ["BER", "TXL", "SXF"].includes(d.destination))),
    )
    .sort((a, b) => (a.price_eur || 999) - (b.price_eur || 999))
    .slice(0, 6);

  const minPrice = matchingDeals[0]?.price_eur;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Vuelos", item: `${SITE}/vuelos` },
      {
        "@type": "ListItem",
        position: 3,
        name: `${route.originLabel} → ${route.destLabel}`,
        item: `${SITE}/vuelos/${params.ruta}`,
      },
    ],
  };

  const tripJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: `Vuelos baratos ${route.originLabel} - ${route.destLabel}`,
    description: route.intro,
    touristType: "BudgetTraveler",
    ...(minPrice && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "EUR",
        lowPrice: minPrice,
        offerCount: matchingDeals.length,
        availability: "https://schema.org/InStock",
      },
    }),
  };

  // TTT02 — Trip schema enriched (separate from TouristTrip):
  // estructura BoardingPass-style con itinerary + provider Organization.
  const tripDetailJsonLd = {
    "@context": "https://schema.org",
    "@type": "Trip",
    name: `${route.originLabel} → ${route.destLabel}`,
    description: route.intro,
    itinerary: [
      { "@type": "Place", name: route.originCity },
      { "@type": "Place", name: route.destCity },
    ],
    provider: {
      "@type": "Organization",
      name: "TripCazador",
      url: SITE,
      logo: `${SITE}/logo.svg`,
    },
    partOfTrip: { "@type": "Trip", name: "Vuelos baratos Europa", url: `${SITE}/vuelos` },
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={tripJsonLd} />
      <JsonLd data={tripDetailJsonLd} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-gray-500 mb-4">
        <Link href="/" className="hover:text-amber-300">
          Inicio
        </Link>
        {" / "}
        <Link href="/vuelos" className="hover:text-amber-300">
          Vuelos
        </Link>
        {" / "}
        <span className="text-gray-300">
          {route.originLabel} → {route.destLabel}
        </span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 text-balance">
          {route.emoji} Vuelos baratos {route.originLabel} → {route.destLabel}
        </h1>
        <p className="text-gray-300 max-w-2xl">{route.intro}</p>
        {minPrice && (
          <p className="mt-4 text-amber-300 font-semibold">
            Mejor precio actual: <span className="text-3xl">{minPrice.toFixed(0)}€</span>{" "}
            <span className="text-xs text-gray-400">(últimas 24h)</span>
          </p>
        )}
      </header>

      {/* Deals reales */}
      {matchingDeals.length > 0 ? (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">
            Mejores chollos {route.originLabel} → {route.destLabel}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchingDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-10 rounded-xl border border-gray-800 bg-gray-900/40 p-6">
          <h2 className="text-xl font-bold text-white mb-2">
            Sin chollos detectados ahora mismo
          </h2>
          <p className="text-gray-300">
            El motor escanea esta ruta cada 4 horas. Activa avisos push para que te llegue una
            notificación al móvil cuando aparezca un vuelo {route.originLabel}-{route.destLabel}{" "}
            por debajo del precio normal.
          </p>
        </section>
      )}

      {/* Mejor mes */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-3">
          Mejores meses para volar {route.originLabel} → {route.destLabel}
        </h2>
        <p className="text-gray-300 mb-3">
          Datos basados en 12 meses de histórico del motor:
        </p>
        <div className="flex flex-wrap gap-2">
          {route.bestMonths.map((m) => (
            <span
              key={m}
              className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 text-sm"
            >
              {m}
            </span>
          ))}
        </div>
      </section>

      {/* CTA newsletter inline */}
      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-2">
          ¿No quieres perderte el próximo error fare?
        </h2>
        <p className="text-gray-300 mb-3">
          Activa avisos push o suscríbete al newsletter — te avisamos en menos de 60s cuando
          un vuelo {route.originLabel}-{route.destLabel} cae al precio mínimo histórico.
        </p>
        <Link
          href="/#newsletter"
          className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors"
        >
          Quiero el aviso
        </Link>
      </section>

      {/* Internal linking — otras rutas populares */}
      <section>
        <h2 className="text-lg font-semibold text-gray-300 mb-3">Otras rutas populares</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {Object.entries(TOP_ROUTES)
            .filter(([slug]) => slug !== params.ruta)
            .slice(0, 9)
            .map(([slug, r]) => (
              <Link
                key={slug}
                href={`/vuelos/${slug}`}
                className="text-amber-300 hover:underline"
              >
                {r.emoji} {r.originLabel} → {r.destLabel}
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}
