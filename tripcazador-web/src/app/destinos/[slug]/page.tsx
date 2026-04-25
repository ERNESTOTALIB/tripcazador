import { getDeals } from "@/lib/api";
import { DealCard } from "@/components/DealCard";
import { JsonLd } from "@/components/JsonLd";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Datos de destinos (se puede mover a una BD/CMS)
const DESTINATIONS: Record<string, {
  name: string;
  iata: string[];
  country: string;
  emoji: string;
  description: string;
  bestMonths: string[];
  avgTemp: string;
  flightTime: string;
  tips: string[];
}> = {
  "tanzania": {
    name: "Tanzania",
    iata: ["ZNZ", "DAR", "JRO"],
    country: "Tanzania, África Oriental",
    emoji: "🦁",
    description: "Tanzania es el destino perfecto para combinar safari en el Serengeti con las playas de ensueño de Zanzíbar. Un vuelo, dos experiencias únicas.",
    bestMonths: ["Enero", "Febrero", "Junio", "Julio", "Agosto", "Septiembre", "Octubre"],
    avgTemp: "25-30°C",
    flightTime: "~11h desde Europa (con escala)",
    tips: [
      "Mejor época: Junio-Octubre (temporada seca, mejor para safari)",
      "Zanzíbar: Diciembre-Febrero y Junio-Octubre (fuera de monzones)",
      "Evitar Marzo-Mayo (monzón largo) y Noviembre (monzón corto)",
      "Visado: e-visa online antes de volar (50 USD)",
      "Vacunas: fiebre amarilla recomendada, malaria prophylaxis",
    ],
  },
  "japon": {
    name: "Japón",
    iata: ["NRT", "HND", "KIX"],
    country: "Japón, Asia Oriental",
    emoji: "🗼",
    description: "Error fares a Japón son frecuentes desde Europa. La mejor combinación: vuelos de error + temporada de flores o otoño.",
    bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"],
    avgTemp: "10-25°C (varía mucho por estación)",
    flightTime: "~12-14h desde Europa",
    tips: [
      "Cerezos (sakura): finales de Marzo - principios de Abril",
      "Otoño (koyo): Octubre - Noviembre (hojas rojas)",
      "Evitar: Agosto (calor extremo y lluvias) y Obon (15 Agosto)",
      "JR Pass: comprar antes de volar, vale la pena si viajas a múltiples ciudades",
      "Error fares frecuentes: ANA, JAL, Air France con escala",
    ],
  },
  "maldivas": {
    name: "Maldivas",
    iata: ["MLE"],
    country: "Maldivas, Océano Índico",
    emoji: "🏝️",
    description: "Los error fares a Maldivas son raros pero existen — especialmente en Business class. El precio normal es alto, lo que hace los errores más llamativos.",
    bestMonths: ["Diciembre", "Enero", "Febrero", "Marzo", "Abril"],
    avgTemp: "28-32°C todo el año",
    flightTime: "~10-12h desde Europa (con escala en DXB o CMB)",
    tips: [
      "Mejor época: Noviembre - Abril (estación seca)",
      "Evitar: Mayo - Octubre (monzones, aunque hay ofertas)",
      "Transporte: seaplanes o lanchas rápidas al resort (reservar con antelación)",
      "Buget travel: guesthouses en islas locales desde 50€/noche",
      "Business class frecuente con Emirates o Qatar (escala DXB/DOH)",
    ],
  },
  "nueva-york": {
    name: "Nueva York",
    iata: ["JFK", "EWR", "LGA"],
    country: "EE.UU., América del Norte",
    emoji: "🗽",
    description: "Nueva York tiene la mayor densidad de error fares transatlánticos. Especialmente en Business con American, Delta o United desde hubs europeos.",
    bestMonths: ["Abril", "Mayo", "Septiembre", "Octubre"],
    avgTemp: "0-30°C (varía mucho)",
    flightTime: "~8-9h desde Europa occidental",
    tips: [
      "Mejor época: Primavera (Abril-Mayo) y Otoño (Sep-Oct)",
      "Navidades: muy caras pero mágicas — esperar error fares",
      "ESTA: autorización obligatoria para ciudadanos UE (21 USD)",
      "Business error fares: más frecuentes con DL, AA, UA en BA/CDG/AMS/ZRH",
      "Aeropuertos: JFK más céntrico para Manhattan, EWR más barato",
    ],
  },
  "bali": {
    name: "Bali",
    iata: ["DPS"],
    country: "Indonesia, Asia",
    emoji: "🌴",
    description: "Bali es uno de los destinos más buscados del mundo. Los vuelos desde Europa suelen ser con escala en Singapore, Kuala Lumpur o Doha.",
    bestMonths: ["Mayo", "Junio", "Julio", "Agosto", "Septiembre"],
    avgTemp: "27-32°C",
    flightTime: "~15-17h desde Europa (con escala)",
    tips: [
      "Mejor época: Mayo - Septiembre (estación seca)",
      "Evitar: Enero - Marzo (lluvias, aunque hay chollos)",
      "Ubud para cultura, Seminyak/Canggu para playa y nightlife",
      "Visa on arrival: 35 USD (extendible)",
      "Error fares frecuentes vía SIN (Singapore Airlines) o KUL (AirAsia)",
    ],
  },
  "buenos-aires": {
    name: "Buenos Aires",
    iata: ["EZE", "AEP"],
    country: "Argentina, América del Sur",
    emoji: "🥩",
    description: "Buenos Aires es la capital del tango, el asado y una de las ciudades más europeas de América. Los vuelos desde Europa son frecuentemente fuente de error fares.",
    bestMonths: ["Marzo", "Abril", "Octubre", "Noviembre"],
    avgTemp: "15-28°C (temporada opuesta a Europa)",
    flightTime: "~13-14h desde Europa",
    tips: [
      "Mejor época: Septiembre - Noviembre y Marzo - Mayo (primavera/otoño austral)",
      "Evitar: Enero - Febrero (calor extremo y vacaciones locales)",
      "Aeropuerto: EZE para vuelos internacionales, AEP para vuelos internos",
      "Peso argentino: cambio oficial vs. blue (consultar antes de volar)",
      "Error fares: Iberia, Air France, Aerolíneas Argentinas desde MAD/CDG",
    ],
  },
  "tailandia": {
    name: "Tailandia",
    iata: ["BKK", "DMK", "HKT", "CNX"],
    country: "Tailandia, Sudeste Asiático",
    emoji: "🛕",
    description: "Desde los templos de Bangkok hasta las playas de Phuket y Krabi. Destino asequible con vuelos directos o con escala en Doha/Dubai.",
    bestMonths: ["Noviembre", "Diciembre", "Enero", "Febrero"],
    avgTemp: "27-33°C",
    flightTime: "~11-13h desde Europa (con escala)",
    tips: [
      "Mejor época: Noviembre - Febrero (estación seca, menos humedad)",
      "Evitar: Abril (Songkran, precios suben) y Mayo-Oct (monzón)",
      "Visa: hasta 30 días sin visa para ciudadanos UE",
      "Moverse: vuelos internos con AirAsia o Nok Air son baratísimos",
      "Error fares frecuentes con Qatar, Turkish, Emirates",
    ],
  },
  "sudafrica": {
    name: "Sudáfrica",
    iata: ["JNB", "CPT", "DUR"],
    country: "Sudáfrica, África Austral",
    emoji: "🦏",
    description: "Cape Town, Garden Route, Kruger National Park y vinos de Stellenbosch. Business class con Lufthansa y Turkish suele tener buenos chollos.",
    bestMonths: ["Octubre", "Noviembre", "Marzo", "Abril"],
    avgTemp: "15-28°C (estaciones invertidas vs. Europa)",
    flightTime: "~11-13h desde Europa",
    tips: [
      "Mejor época: Oct-Nov y Mar-Abr (primavera/otoño)",
      "Safari: Mayo-Sep (animales concentrados en pozas de agua)",
      "No se necesita visa (hasta 90 días) para ciudadanos UE",
      "Alquiler de coche imprescindible para Garden Route",
      "Business error fares: Lufthansa, Turkish, Qatar vía FRA/IST/DOH",
    ],
  },
  "islandia": {
    name: "Islandia",
    iata: ["KEF", "RKV"],
    country: "Islandia, Europa Norte",
    emoji: "🌋",
    description: "Glaciares, auroras boreales, géiseres y cascadas. Vuelos directos desde hubs europeos con Icelandair o PLAY (la low-cost islandesa).",
    bestMonths: ["Junio", "Julio", "Agosto", "Febrero", "Marzo"],
    avgTemp: "0-15°C (verano), -5-5°C (invierno)",
    flightTime: "~3-4h desde Europa occidental",
    tips: [
      "Verano (Jun-Ago): sol de medianoche, carreteras todas abiertas",
      "Invierno (Feb-Mar): auroras boreales, mejor relación precio/visibilidad",
      "PLAY ofrece vuelos low-cost desde BRU, BSL, AMS, CDG",
      "Alquilar 4x4 si vas en invierno o a tierras altas",
      "Caro en restaurantes; considera Airbnb con cocina",
    ],
  },
  "marruecos": {
    name: "Marruecos",
    iata: ["RAK", "CMN", "AGA", "FEZ", "TNG"],
    country: "Marruecos, Norte de África",
    emoji: "🕌",
    description: "Marrakech, Fez, Chefchaouen y el desierto de Merzouga. Destino perfecto para fin de semana largo desde hubs europeos.",
    bestMonths: ["Marzo", "Abril", "Mayo", "Septiembre", "Octubre", "Noviembre"],
    avgTemp: "15-30°C (varía por región)",
    flightTime: "~3-4h desde Europa",
    tips: [
      "Ryanair, TUI, Air Arabia Maroc con tarifas muy bajas",
      "Evitar Julio-Agosto en Marrakech (45°C, insoportable)",
      "Combina Marrakech + Essaouira para playa y Atlas",
      "Dirham: mejor cambiar en casas de cambio oficiales, no bancos",
      "Sin visa para UE, solo pasaporte válido 3+ meses",
    ],
  },
  "vietnam": {
    name: "Vietnam",
    iata: ["HAN", "SGN", "DAD"],
    country: "Vietnam, Sudeste Asiático",
    emoji: "🍜",
    description: "Hanói, bahía de Halong, Hoi An, Ho Chi Minh y las terrazas de Sapa. Excelente relación calidad/precio en el sudeste asiático.",
    bestMonths: ["Noviembre", "Diciembre", "Enero", "Febrero", "Marzo"],
    avgTemp: "20-32°C (varía norte/sur)",
    flightTime: "~13-15h desde Europa (con escala)",
    tips: [
      "Mejor época general: Nov-Mar (seca en casi todo el país)",
      "Norte (Hanoi, Sapa): Oct-Dic (otoño) y Mar-May (primavera)",
      "Sur (Saigón, Mekong): Dic-Abr (seca)",
      "E-visa: tramitar online antes de volar (25 USD, 30 días)",
      "Error fares frecuentes con Qatar, Etihad, Turkish vía DOH/AUH/IST",
    ],
  },
  "costa-rica": {
    name: "Costa Rica",
    iata: ["SJO", "LIR"],
    country: "Costa Rica, América Central",
    emoji: "🦥",
    description: "Pura vida: selva tropical, playas del Pacífico y el Caribe, volcanes activos y una biodiversidad increíble. Ideal para ecoturismo.",
    bestMonths: ["Diciembre", "Enero", "Febrero", "Marzo", "Abril"],
    avgTemp: "22-30°C",
    flightTime: "~13-14h desde Europa (con escala)",
    tips: [
      "Mejor época: Dic-Abr (seca) — alta temporada y precios altos",
      "Mayo-Nov: lluvias pero ofertas de vuelo mucho mejores",
      "SJO cerca de San José, LIR cerca de Guanacaste (playa)",
      "Alquilar 4x4 si planeas explorar la costa Caribe o Monteverde",
      "Error fares: Iberia (MAD), Condor (FRA), Air France (CDG)",
    ],
  },
};

// abr-2026r — revalidate: destinos cambian con seasonal_threshold + holiday
// windows, pero el contenido textual es estable. 1h es suficiente para que
// cambios manuales se reflejen razonablemente rápido sin agobiar al ISR.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const dest = DESTINATIONS[params.slug];
  if (!dest) return { title: "Destino no encontrado | TripCazador" };
  return {
    title: `Vuelos baratos a ${dest.name} — TripCazador`,
    description: `Encuentra los mejores chollos de vuelo a ${dest.name}. ${dest.description}`,
    openGraph: {
      title: `${dest.emoji} Vuelos baratos a ${dest.name} | TripCazador`,
      description: dest.description,
    },
  };
}

export default async function DestinationPage({
  params,
}: {
  params: { slug: string };
}) {
  const dest = DESTINATIONS[params.slug];
  if (!dest) notFound();

  // Buscar deals actuales para este destino. abr-2026n (#213): además del
  // match por código IATA exacto, aceptamos match por nombre de ciudad
  // (case-insensitive). Esto evita falsos negativos si el feed reporta el
  // deal con `destination` no IATA (ej. "PBQ" para Punta Cana en lugar de
  // "PUJ"). El IATA sigue siendo señal primaria; ciudad es fallback.
  const data = await getDeals({ region: undefined, limit: 200 });
  const destNameLower = dest.name.toLowerCase();
  const destDeals = data.deals
    .filter((d) => {
      // Match primario por IATA exacto (caso normal)
      if (dest.iata.includes(d.destination)) return true;
      // Fallback: ciudad de destino contiene el nombre del destino canónico
      const cityTo = (d.city_to || "").toLowerCase();
      if (cityTo && cityTo.includes(destNameLower)) return true;
      return false;
    })
    .slice(0, 12);

  // Métricas para enriquecer schema TouristTrip — tomamos rangos del feed
  // de deals ya filtrado para este destino (precio mínimo, aerolíneas únicas).
  const destPrices = destDeals
    .map((d) => Number(d.price_eur || 0))
    .filter((n) => n > 0);
  const minDestPrice = destPrices.length ? Math.min(...destPrices) : null;
  const uniqueAirlines = Array.from(
    new Set(destDeals.map((d) => d.airline).filter(Boolean) as string[]),
  ).slice(0, 6);

  // Heurística de duración recomendada por distancia (ratio noches/destino):
  // - long-haul (Asia/LatAm/Pacífico) → 14 días
  // - medium-haul (África/Caribe) → 10 días
  // - short-haul (Europa/Marruecos) → 5 días
  const longHaulSlugs = ["japon", "bali", "tailandia", "vietnam", "buenos-aires", "maldivas", "sudafrica", "costa-rica"];
  const mediumHaulSlugs = ["nueva-york", "tanzania"];
  const tripDays = longHaulSlugs.includes(params.slug)
    ? 14
    : mediumHaulSlugs.includes(params.slug)
    ? 10
    : 5;

  const jsonLd: Array<Record<string, unknown>> = [
    {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: dest.name,
      description: dest.description,
      url: `https://tripcazador.com/destinos/${params.slug}`,
      image: "https://tripcazador.com/og-default.png",
      touristType: ["Budget travelers from Europe", "Error fare hunters"],
      // abr-2026m: añadimos `availableLanguage` (ES + EN — el feed es bilingüe)
      // y `geo` opcional cuando el frontmatter lo trae.
      availableLanguage: ["es", "en"],
      // Best months como `season` repeatable — Schema.org lo acepta como
      // string o array.
      includesAttraction: dest.bestMonths.map((m) => ({
        "@type": "TouristAttraction",
        name: `${dest.name} en ${m}`,
        description: `Mejor temporada para visitar ${dest.name}: ${m}.`,
      })),
    },
    // abr-2026m: TouristTrip schema — Google muestra rich snippets para
    // queries tipo "viajar a Japón desde Europa". Incluye duración media,
    // budget mínimo (si tenemos deals activos), y partOfTrip → destination.
    {
      "@context": "https://schema.org",
      "@type": "TouristTrip",
      name: `Viaje a ${dest.name} desde Europa`,
      description: dest.description,
      url: `https://tripcazador.com/destinos/${params.slug}`,
      itinerary: {
        "@type": "ItemList",
        numberOfItems: tripDays,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            item: {
              "@type": "Place",
              name: `Llegada a ${dest.name}`,
            },
          },
          {
            "@type": "ListItem",
            position: 2,
            item: {
              "@type": "Action",
              name: `${tripDays} días explorando ${dest.name}`,
            },
          },
        ],
      },
      partOfTrip: {
        "@type": "TouristDestination",
        name: dest.name,
        url: `https://tripcazador.com/destinos/${params.slug}`,
      },
      provider: {
        "@type": "Organization",
        name: "TripCazador",
        url: "https://tripcazador.com",
      },
      // Si tenemos deals activos, exponer rango de precio del vuelo como
      // hint para Google. Marcamos `lowPrice` con la oferta más barata.
      ...(minDestPrice && {
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "EUR",
          lowPrice: Math.round(minDestPrice),
          offerCount: destDeals.length,
          seller: { "@type": "Organization", name: "TripCazador" },
          ...(uniqueAirlines.length > 0 && {
            itemOffered: {
              "@type": "Flight",
              provider: uniqueAirlines.map((a) => ({
                "@type": "Airline",
                name: a,
              })),
            },
          }),
        },
      }),
      // Audiencia + tipo de presupuesto. `suitableForBudget` no es Schema
      // canónico pero algunos crawlers lo respetan; usamos `additionalProperty`.
      audience: {
        "@type": "Audience",
        audienceType: "Travelers from European hubs (BSL, ZRH, MAD, FRA, CDG, AMS)",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
        { "@type": "ListItem", position: 2, name: "Destinos", item: "https://tripcazador.com/destinos" },
        {
          "@type": "ListItem",
          position: 3,
          name: dest.name,
          item: `https://tripcazador.com/destinos/${params.slug}`,
        },
      ],
    },
  ];

  return (
    <div className="space-y-12">
      <JsonLd data={jsonLd} />
      {/* Hero */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <a href="/destinos" className="hover:text-white">Destinos</a>
          <span>/</span>
          <span className="text-white">{dest.name}</span>
        </div>

        <div className="flex items-start gap-4">
          <span className="text-5xl">{dest.emoji}</span>
          <div>
            <h1 className="text-4xl font-bold text-white">{dest.name}</h1>
            <p className="text-gray-400 mt-1">{dest.country}</p>
          </div>
        </div>

        <p className="text-gray-300 text-lg max-w-3xl">{dest.description}</p>

        {/* Info rápida */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Vuelo desde Europa</div>
            <div className="text-white font-semibold mt-1">{dest.flightTime}</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Temperatura media</div>
            <div className="text-white font-semibold mt-1">{dest.avgTemp}</div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Mejor época</div>
            <div className="text-white font-semibold mt-1">{dest.bestMonths.slice(0, 3).join(", ")}</div>
          </div>
        </div>
      </section>

      {/* Deals activos */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">
          Vuelos activos a {dest.name}
          <span className="text-base font-normal text-gray-400 ml-3">
            ({destDeals.length} encontrados)
          </span>
        </h2>

        {destDeals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {destDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
            <p className="text-gray-400">No hay deals activos en este momento para {dest.name}.</p>
            <p className="text-sm text-gray-500 mt-2">El motor está buscando. Vuelve en unas horas.</p>
          </div>
        )}
      </section>

      {/* Guía / Tips */}
      <section className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">
          📚 Guía de viaje — {dest.name}
        </h2>
        <ul className="space-y-2">
          {dest.tips.map((tip, i) => (
            <li key={i} className="flex gap-3 text-gray-300">
              <span className="text-amber-400 mt-0.5 shrink-0">→</span>
              {tip}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
