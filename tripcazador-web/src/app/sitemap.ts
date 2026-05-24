import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { getDeals } from "@/lib/api";
import { getAllPosts, getAllTagsWithCounts } from "@/lib/blog";
import { AIRLINES } from "@/lib/airlines";
import { HUBS } from "@/lib/hubs";
import { COMPARISONS } from "@/lib/comparisons";
import { AIRLINE_COMPARISONS } from "@/lib/airline_comparisons";
import { NEIGHBORHOOD_COMPARISONS } from "@/lib/neighborhood_comparisons";
import { DESTINATIONS_SEASONAL } from "@/lib/seasonal_data";
import { REGIONS } from "@/lib/regions";
import { MONTHS } from "@/lib/months";
import { MONTHLY_ROUTES } from "@/lib/monthly_prices";
import { getHotelEntries } from "@/lib/hotel_seed";
import { PARTNERS } from "@/lib/travel_partners";
import { SEO_CITIES, SEO_ORIGINS, MONTHS_ES } from "@/lib/programmatic_seo";
import { getAllCreatorHandles } from "@/lib/creators_seed";
// SSS418: nuevos verticales /seguro-viaje/[destino], /esim/[destino], /visados/[destino]
import { DESTINO_SLUGS as DESTINO_CATALOG_SLUGS } from "@/lib/destinos_catalog";
import { AIRPORTS_ES_IATAS } from "@/lib/airports_es_catalog";
import { GLOSARIO_SLUGS } from "@/lib/glosario_landings";
import { CHECK_IN_SLUGS } from "@/lib/check_in_rules";
import { VUELO_TREN_SLUGS } from "@/lib/vuelo_tren_catalog";
import { FREEBIES_SLUGS } from "@/lib/freebies_catalog";
import { ESCAPADAS_SLUGS } from "@/lib/escapadas_catalog";
import { EVENTOS_ES_SLUGS } from "@/lib/eventos_es_catalog";
import { CONFERENCIAS_SLUGS } from "@/lib/conferencias_catalog";
import { CODIGOS_PAIS_ISOS } from "@/lib/codigos_pais_catalog";
import { AIRPORTS_WORLD_IATAS } from "@/lib/airports_world_catalog";
import { FLAG_CARRIERS_ISOS } from "@/lib/flag_carriers_catalog";
import { DIVISAS_CODES } from "@/lib/divisas_catalog";
import { TASA_TURISTICA_SLUGS } from "@/lib/tasa_turistica_catalog";
import { TEMPORADA_BAJA_SLUGS } from "@/lib/temporada_baja_catalog";
import { ETIQUETA_SLUGS } from "@/lib/etiqueta_catalog";
import { CLIMA_SLUGS } from "@/lib/clima_catalog";
import { JETLAG_SLUGS } from "@/lib/jetlag_catalog";
import { IDIOMAS_SLUGS } from "@/lib/idiomas_catalog";
import { DINERO_SLUGS } from "@/lib/dinero_catalog";

const BASE_URL = "https://tripcazador.com";

// Lista hardcoded de destinos (debe coincidir con destinos/[slug]/page.tsx)
// abr-2026z: añadidos marrakech, tokio, reykjavik, singapur, praga, estambul (12 → 18)
// abr-2026bb: añadidos berlin, atenas, dubai, el-cairo, hong-kong, sydney (18 → 24)
const DESTINOS = [
  "tanzania", "japon", "maldivas", "nueva-york", "bali", "buenos-aires",
  "tailandia", "sudafrica", "islandia", "marruecos", "vietnam", "costa-rica",
  "marrakech", "tokio", "reykjavik", "singapur", "praga", "estambul",
  "berlin", "atenas", "dubai", "el-cairo", "hong-kong", "sydney",
  // ZZZ02 — Capitales EU añadidas (alto search volume, antes 404).
  "lisboa", "paris", "londres", "roma", "milan", "amsterdam", "viena",
];

function getBlogSlugs(): string[] {
  const dir = path.join(process.cwd(), "src/content/blog");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // SSS97: usar fecha del último deploy (env.VERCEL_GIT_COMMIT_SHA timestamp)
  // o build time, NO `new Date()` en cada request. Antes todas las páginas
  // estáticas reportaban lastModified=NOW en cada SSR/build → patrón
  // "spam-like" detectado por Google que ignora el lastmod del sitemap.
  // Ahora lastmod cambia solo cuando hay deploy real.
  const buildTimestamp = process.env.VERCEL_GIT_COMMIT_DATE
    ? new Date(process.env.VERCEL_GIT_COMMIT_DATE)
    : new Date(); // fallback dev
  const now = buildTimestamp;
  // SSS383 — handles activos para sitemap creator/[handle]
  const creatorsHandles = getAllCreatorHandles();
  // Páginas que sí cambian en cada deploy (deals, home con featured)
  const hot = buildTimestamp;
  // Páginas evergreen — bump sólo cuando se editen manualmente. Por ahora
  // damos una fecha fija anterior para no inflar en deploys de feature/fix.
  const evergreen = new Date("2026-04-01T00:00:00Z");

  // `alternates.languages` genera <xhtml:link rel="alternate" hreflang="..."/>
  // dentro del sitemap — Google lo usa como señal reforzada además del
  // <link rel="alternate"> que ya va en el <head>. Cada URL debe listar
  // TODAS las variantes (incluida ella misma), según la especificación.
  const LANG_ALT_HOME = {
    "es-ES": `${BASE_URL}/`,
    "en": `${BASE_URL}/en`,
    "de": `${BASE_URL}/de`,
    "fr": `${BASE_URL}/fr`,
    "it": `${BASE_URL}/it`,
    "x-default": `${BASE_URL}/`,
  };
  const LANG_ALT_BLOG = {
    "es-ES": `${BASE_URL}/blog`,
    "en": `${BASE_URL}/en/blog`,
    "x-default": `${BASE_URL}/blog`,
  };
  const LANG_ALT_DESTINOS = {
    "es-ES": `${BASE_URL}/destinos`,
    "en": `${BASE_URL}/en/destinos`,
    "x-default": `${BASE_URL}/destinos`,
  };
  // SSS234+243+244+246+250+252 — pricing landings octeto (ES/EN/DE/FR/IT/PT/NL/PL)
  const LANG_ALT_PRICING = {
    "es-ES": `${BASE_URL}/precios-vuelos-baratos`,
    "en-US": `${BASE_URL}/en/cheap-flight-prices`,
    "de-DE": `${BASE_URL}/de/billige-flugpreise`,
    "fr-FR": `${BASE_URL}/fr/prix-vols-pas-chers`,
    "it-IT": `${BASE_URL}/it/prezzi-voli-economici`,
    "pt-PT": `${BASE_URL}/pt/precos-voos-baratos`,
    "nl-NL": `${BASE_URL}/nl/goedkope-vliegtickets`,
    "pl-PL": `${BASE_URL}/pl/tanie-bilety-lotnicze`,
    "x-default": `${BASE_URL}/precios-vuelos-baratos`,
  };

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: hot,
      changeFrequency: "daily",
      priority: 1.0,
      alternates: { languages: LANG_ALT_HOME },
    },
    {
      url: `${BASE_URL}/en`,
      lastModified: hot,
      changeFrequency: "daily",
      priority: 0.9,
      alternates: { languages: LANG_ALT_HOME },
    },
    { url: `${BASE_URL}/deals`, lastModified: hot, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/hoteles`, lastModified: hot, changeFrequency: "daily", priority: 0.8 },
    {
      url: `${BASE_URL}/destinos`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: LANG_ALT_DESTINOS },
    },
    {
      url: `${BASE_URL}/en/destinos`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: LANG_ALT_DESTINOS },
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: LANG_ALT_BLOG },
    },
    {
      url: `${BASE_URL}/en/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: LANG_ALT_BLOG },
    },
    {
      url: `${BASE_URL}/de`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
      alternates: { languages: LANG_ALT_HOME },
    },
    {
      url: `${BASE_URL}/fr`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
      alternates: { languages: LANG_ALT_HOME },
    },
    {
      url: `${BASE_URL}/it`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
      alternates: { languages: LANG_ALT_HOME },
    },
    { url: `${BASE_URL}/telegram`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/legal`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    // ppp PPP1: nuevas landing pages monetización
    { url: `${BASE_URL}/concierge`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    // SSS285 (17 may 2026): 4 tier-dedicated landings
    { url: `${BASE_URL}/concierge/express`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/concierge/standard`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/concierge/premium`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/concierge/pro`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    // sss SSS11: SEO landing — "agencia de viajes online" 33k búsquedas/mes
    { url: `${BASE_URL}/agencia-de-viajes`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    // SSS305/SSS309 (18-19 may 2026): Agencia one-shot €9.99 + €19.99 con garantía mejor precio
    { url: `${BASE_URL}/agencia`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/agencia/vuelo`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/agencia/vuelo-hotel`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/comparar-vuelos`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/como-viajar`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // SSS152: landing /seguro-viaje (afiliado Heymondo, captura "seguro viaje 2026" SEO)
    { url: `${BASE_URL}/seguro-viaje`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    // SSS418: hub /esim (afiliado Holafly) — landings por destino debajo
    { url: `${BASE_URL}/esim`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    // SSS421: hub /aeropuertos — 15 IATA landings debajo
    { url: `${BASE_URL}/aeropuertos`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    // SSS427: hub /check-in — 15 aerolíneas landings debajo
    { url: `${BASE_URL}/check-in`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    // SSS428: hub /vuelos-vs-tren — 8 comparadores AVE/Iryo/Ouigo
    { url: `${BASE_URL}/vuelos-vs-tren`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // SSS429: hub /freebies — 4 lead magnets PDF
    { url: `${BASE_URL}/freebies`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // SSS433: hub /escapadas — 12 escapadas fin de semana
    { url: `${BASE_URL}/escapadas`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    // SSS436: hub /preparar-viaje — checklist pre-trip
    { url: `${BASE_URL}/preparar-viaje`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // SSS439: hub /eventos-espana — 8 eventos top (HOTFIX: renamed sin ñ)
    { url: `${BASE_URL}/eventos-espana`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    // SSS440: hub /conferencias — 8 tech/business
    { url: `${BASE_URL}/conferencias`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // SSS441: /partner-badges — generador SVG badges + embed code
    { url: `${BASE_URL}/partner-badges`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    // SSS444: hub /codigos-pais — 15 países lookup
    { url: `${BASE_URL}/codigos-pais`, lastModified: now, changeFrequency: "yearly", priority: 0.65 },
    // SSS445: hub /aeropuertos-mundo — 20 hubs internacionales
    { url: `${BASE_URL}/aeropuertos-mundo`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // SSS447: /changelog — release notes públicas
    { url: `${BASE_URL}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.55 },
    // SSS449: hub /aerolineas-bandera — flag carriers
    { url: `${BASE_URL}/aerolineas-bandera`, lastModified: now, changeFrequency: "yearly", priority: 0.65 },
    // SSS450: /equipaje-medidor — herramienta interactiva
    { url: `${BASE_URL}/equipaje-medidor`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    // SSS451: /maleta-perdida — guía completa reclamación
    { url: `${BASE_URL}/maleta-perdida`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    // SSS452: /tarjetas-viaje — comparativa 6 tarjetas top
    { url: `${BASE_URL}/tarjetas-viaje`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // SSS457: hub /divisas — 8 currency landings
    { url: `${BASE_URL}/divisas`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    // SSS459: hub /tasa-turistica + 12 ciudades
    { url: `${BASE_URL}/tasa-turistica`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // SSS460: /vuelo-cancelado guía EU 261/2004
    { url: `${BASE_URL}/vuelo-cancelado`, lastModified: now, changeFrequency: "yearly", priority: 0.75 },
    // SSS463: hub /temporada-baja
    { url: `${BASE_URL}/temporada-baja`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // SSS464: leaderboard referidos públicos
    { url: `${BASE_URL}/premium/top-referidos`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    // SSS467: comparador deals
    { url: `${BASE_URL}/comparar-deals`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    // SSS470: /equipo
    { url: `${BASE_URL}/equipo`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    // SSS472: /podcast landing (coming soon)
    { url: `${BASE_URL}/podcast`, lastModified: now, changeFrequency: "monthly", priority: 0.55 },
    // SSS475: /testimonios
    { url: `${BASE_URL}/testimonios`, lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    // SSS480: /anuario-2026 PR landing
    { url: `${BASE_URL}/anuario-2026`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    // SSS482: /predicciones-vuelos-2026 PR landing
    { url: `${BASE_URL}/predicciones-vuelos-2026`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // SSS486: /etiqueta hub + 10 culturas
    { url: `${BASE_URL}/etiqueta`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // SSS487: /regalo-premium dedicated landing (revenue path €9.99)
    { url: `${BASE_URL}/regalo-premium`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    // SSS489: /viajar-bebes guía equipaje con menores
    { url: `${BASE_URL}/viajar-bebes`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    // AUDIT-FULL-2: /business-class-barato hub revenue-driven SEO
    { url: `${BASE_URL}/business-class-barato`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    // AUDIT-FULL-2: /apps-imprescindibles
    { url: `${BASE_URL}/apps-imprescindibles`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // AUDIT-FULL-3: /seguro-cancelacion landing high-intent SEO
    { url: `${BASE_URL}/seguro-cancelacion`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    // SUPERSESSION: /error-fares hub high-intent
    { url: `${BASE_URL}/error-fares`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    // SSS435: /transparencia — métricas + compromisos públicos
    { url: `${BASE_URL}/transparencia`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    // SSS153: índices que estaban 404 — breadcrumbs internos rotos
    { url: `${BASE_URL}/vuelos`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE_URL}/vuelos-baratos`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/fr/destinos`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/it/destinos`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/de/destinos`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/en/comparar`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const destinoPages: MetadataRoute.Sitemap = DESTINOS.map((slug) => ({
    url: `${BASE_URL}/destinos/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // SSS418: 3 nuevos verticales programmatic (seguro / esim / visados) × 31 destinos = 93 URLs
  const seguroDestinoPages: MetadataRoute.Sitemap = DESTINO_CATALOG_SLUGS.map((slug) => ({
    url: `${BASE_URL}/seguro-viaje/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const esimDestinoPages: MetadataRoute.Sitemap = DESTINO_CATALOG_SLUGS.map((slug) => ({
    url: `${BASE_URL}/esim/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const visadoDestinoPages: MetadataRoute.Sitemap = DESTINO_CATALOG_SLUGS.map((slug) => ({
    url: `${BASE_URL}/visados/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  // SSS421: vertical /aeropuertos hub + 15 IATA landings
  const aeropuertoPages: MetadataRoute.Sitemap = AIRPORTS_ES_IATAS.map((iata) => ({
    url: `${BASE_URL}/aeropuertos/${iata.toLowerCase()}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // SSS422: vertical /glosario/[term] — 15 guías ampliadas con FAQ JSON-LD
  const glosarioTermPages: MetadataRoute.Sitemap = GLOSARIO_SLUGS.map((slug) => ({
    url: `${BASE_URL}/glosario/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  // SSS427: vertical /check-in/[aerolinea] — 15 guías por aerolínea
  const checkInPages: MetadataRoute.Sitemap = CHECK_IN_SLUGS.map((slug) => ({
    url: `${BASE_URL}/check-in/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // SSS428: vertical /vuelos-vs-tren/[ruta] — 8 comparadores AVE vs avión
  const vueloTrenPages: MetadataRoute.Sitemap = VUELO_TREN_SLUGS.map((slug) => ({
    url: `${BASE_URL}/vuelos-vs-tren/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  // SSS429: vertical /freebies/[slug] — 4 lead magnets gated por email
  const freebiePages: MetadataRoute.Sitemap = FREEBIES_SLUGS.map((slug) => ({
    url: `${BASE_URL}/freebies/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // SSS433: vertical /escapadas/[slug] — 12 escapadas fin de semana
  const escapadasPages: MetadataRoute.Sitemap = ESCAPADAS_SLUGS.map((slug) => ({
    url: `${BASE_URL}/escapadas/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  // SSS436: vertical /preparar-viaje/[destino] — checklist pre-trip por destino
  const prepararViajePages: MetadataRoute.Sitemap = DESTINO_CATALOG_SLUGS.map((slug) => ({
    url: `${BASE_URL}/preparar-viaje/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // SSS439: vertical /eventos-espana/[slug] — 8 eventos top
  // FIX-SEO-4: encodeURI para no emitir raw ñ en sitemap XML (RFC 3986).
  const eventosEsPages: MetadataRoute.Sitemap = EVENTOS_ES_SLUGS.map((slug) => ({
    url: `${BASE_URL}/eventos-espana/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // SSS440: vertical /conferencias/[slug] — 8 tech/business confs
  const conferenciasPages: MetadataRoute.Sitemap = CONFERENCIAS_SLUGS.map((slug) => ({
    url: `${BASE_URL}/conferencias/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // SSS444: vertical /codigos-pais/[iso] — 15 países lookup
  const codigosPaisPages: MetadataRoute.Sitemap = CODIGOS_PAIS_ISOS.map((iso) => ({
    url: `${BASE_URL}/codigos-pais/${iso}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  // SSS445: vertical /aeropuertos-mundo/[iata] — 20 hubs internacionales
  const aeropuertosMundoPages: MetadataRoute.Sitemap = AIRPORTS_WORLD_IATAS.map((iata) => ({
    url: `${BASE_URL}/aeropuertos-mundo/${iata.toLowerCase()}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  // SSS449: vertical /aerolineas-bandera/[iso] — 20 países flag carriers
  const flagCarriersPages: MetadataRoute.Sitemap = FLAG_CARRIERS_ISOS.map((iso) => ({
    url: `${BASE_URL}/aerolineas-bandera/${iso}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.65,
  }));

  // SSS457: vertical /divisas/[code] — 8 currency landings
  const divisasPages: MetadataRoute.Sitemap = DIVISAS_CODES.map((code) => ({
    url: `${BASE_URL}/divisas/${code}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  // SSS459: vertical /tasa-turistica/[ciudad] — 12 ciudades
  const tasaTuristicaPages: MetadataRoute.Sitemap = TASA_TURISTICA_SLUGS.map((slug) => ({
    url: `${BASE_URL}/tasa-turistica/${slug}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.65,
  }));

  // SSS463: vertical /temporada-baja/[destino] — 12 destinos
  const temporadaBajaPages: MetadataRoute.Sitemap = TEMPORADA_BAJA_SLUGS.map((slug) => ({
    url: `${BASE_URL}/temporada-baja/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // SSS486: vertical /etiqueta/[pais] — 10 guías culturales
  // AUDIT-FULL-2: clima vertical
  const climaPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/clima`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
    ...CLIMA_SLUGS.map((slug) => ({
      url: `${BASE_URL}/clima/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];

  // AUDIT-FULL-3: jet-lag vertical
  const jetlagPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/jet-lag`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
    ...JETLAG_SLUGS.map((slug) => ({
      url: `${BASE_URL}/jet-lag/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];

  // SUPERSESSION: idiomas + dinero verticals
  const idiomasPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/idiomas`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
    ...IDIOMAS_SLUGS.map((slug) => ({
      url: `${BASE_URL}/idiomas/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];
  const dineroPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/dinero-en`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 },
    ...DINERO_SLUGS.map((slug) => ({
      url: `${BASE_URL}/dinero-en/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
  ];

  const etiquetaPages: MetadataRoute.Sitemap = ETIQUETA_SLUGS.map((slug) => ({
    url: `${BASE_URL}/etiqueta/${slug}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.65,
  }));

  // ppp PPP1: páginas /como-viajar/[slug] una por partner afiliado
  const comoViajarPages: MetadataRoute.Sitemap = PARTNERS.map((p) => ({
    url: `${BASE_URL}/como-viajar/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // abr-2026k: lastmod REAL desde mtime del MDX. Antes usábamos `now` para
  // todos los posts (Google trata como spam si el sitemap dice que TODO
  // cambió HOY). Ahora cada post devuelve su fecha real de última edición.
  const allPosts = getAllPosts();
  const blogPages: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.lastModified
      ? new Date(post.lastModified)
      : new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Dynamic deal pages — cada deal activo es una landing indexable.
  // Si la API no responde, devolvemos solo páginas estáticas (no rompe el build).
  let dealPages: MetadataRoute.Sitemap = [];
  try {
    const data = await getDeals({ limit: 200 });
    dealPages = data.deals.map((d) => ({
      url: `${BASE_URL}/deals/${d.id}`,
      lastModified: d.found_at ? new Date(d.found_at) : now,
      changeFrequency: "daily",
      priority: 0.5,
    }));
  } catch {
    /* silencio: el motor puede no estar arriba al momento del build */
  }

  // abr-2026x: tag pages — uno por cada tag único en ES y EN. Long-tail SEO.
  const esTagPages: MetadataRoute.Sitemap = getAllTagsWithCounts("es").map((t) => ({
    url: `${BASE_URL}/blog/tag/${encodeURIComponent(t.tag)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));
  const enTagPages: MetadataRoute.Sitemap = getAllTagsWithCounts("en").map((t) => ({
    url: `${BASE_URL}/en/blog/tag/${encodeURIComponent(t.tag)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  // abr-2026x: aerolíneas — index + cada perfil individual
  const aerolineasPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/aerolineas`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...AIRLINES.map((a) => ({
      url: `${BASE_URL}/aerolineas/${a.code.toLowerCase()}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    // SSS476: sub-vertical /aerolineas/[code]/rutas (solo airlines con popularRoutes)
    ...AIRLINES.filter((a) => a.popularRoutesFromSpain.length > 0).map((a) => ({
      url: `${BASE_URL}/aerolineas/${a.code.toLowerCase()}/rutas`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
  ];

  // abr-2026x: feeds RSS dentro del sitemap como contenido descubrible.
  const feedPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/rss.xml`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/en/rss.xml`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.4,
    },
  ];

  // abr-2026y: glosario, hubs aeropuerto, comparativas, prensa.
  // abr-2026z: añadidos calculadora, mapa-precios, embed.
  const utilityPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/glosario`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/prensa`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      // SSS359 — /sponsor para captación B2B sponsorships
      url: `${BASE_URL}/sponsor`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.55,
    },
    // SSS365 — wire nuevas landings post-MEGA
    {
      url: `${BASE_URL}/business`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7, // alto — B2B revenue target
    },
    {
      url: `${BASE_URL}/api-docs`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/comparar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/vuelos-desde`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/calculadora`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/mapa-precios`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      // SSS217 (15 may 2026): landing SEO long-tail "precios vuelos baratos"
      url: `${BASE_URL}/precios-vuelos-baratos`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: LANG_ALT_PRICING },
    },
    {
      // SSS223 (16 may 2026): English version "cheap flight prices"
      url: `${BASE_URL}/en/cheap-flight-prices`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: LANG_ALT_PRICING },
    },
    {
      // SSS234 (16 may 2026): German version "billige Flugpreise" (DACH market)
      url: `${BASE_URL}/de/billige-flugpreise`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: LANG_ALT_PRICING },
    },
    {
      // SSS243 (16 may 2026): French version "prix vols pas chers" (France market)
      url: `${BASE_URL}/fr/prix-vols-pas-chers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: LANG_ALT_PRICING },
    },
    {
      // SSS244 (16 may 2026): Italian version "prezzi voli economici" (Italy market)
      url: `${BASE_URL}/it/prezzi-voli-economici`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: LANG_ALT_PRICING },
    },
    {
      // SSS246 (16 may 2026): Portuguese version "preços voos baratos" (PT/BR diaspora)
      url: `${BASE_URL}/pt/precos-voos-baratos`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: LANG_ALT_PRICING },
    },
    {
      // SSS250 (16 may 2026): Dutch version "goedkope vliegtickets" (Netherlands market)
      url: `${BASE_URL}/nl/goedkope-vliegtickets`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: LANG_ALT_PRICING },
    },
    {
      // SSS252 (16 may 2026): Polish version "tanie bilety lotnicze" (Poland market)
      url: `${BASE_URL}/pl/tanie-bilety-lotnicze`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: LANG_ALT_PRICING },
    },
    {
      url: `${BASE_URL}/embed`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // abr-2026aa: calculadora-co2, opiniones, faq, lead-magnet 30 trucos
    {
      url: `${BASE_URL}/calculadora-co2`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/opiniones`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/lead-magnet/30-trucos-avanzados`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    // abr-2026bb: buscar, calculadora-millas, stopovers
    {
      url: `${BASE_URL}/buscar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/calculadora-millas`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/stopovers`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    // abr-2026cc: cancelacion calculator, partners, regiones index
    {
      url: `${BASE_URL}/calculadora-cancelacion`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/partners`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // SSS383 — añadir rutas nuevas SSS372-376 al sitemap
    {
      url: `${BASE_URL}/partners/agencia`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7, // B2B revshare landing
    },
    {
      url: `${BASE_URL}/premium/hotline`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/creators`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...creatorsHandles.map<MetadataRoute.Sitemap[number]>((h) => ({
      url: `${BASE_URL}/creator/${h}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    })),
    {
      url: `${BASE_URL}/regiones`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    // abr-2026dd: vuelos-baratos-mes index, calculadora-upgrade
    {
      url: `${BASE_URL}/vuelos-baratos-mes`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/calculadora-upgrade`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
  // abr-2026cc: páginas regiones individuales
  const regionPages: MetadataRoute.Sitemap = REGIONS.map((r) => ({
    url: `${BASE_URL}/regiones/${r.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const hubPages: MetadataRoute.Sitemap = HUBS.map((h) => ({
    url: `${BASE_URL}/vuelos-desde/${h.code.toLowerCase()}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const comparisonPages: MetadataRoute.Sitemap = COMPARISONS.map((c) => ({
    url: `${BASE_URL}/comparar/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  // CCCC01 — airline-vs-airline comparisons
  const airlineComparisonPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/comparar-aerolineas`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    },
    ...AIRLINE_COMPARISONS.map((c) => ({
      url: `${BASE_URL}/comparar-aerolineas/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
  // LLLL01 — neighborhood-vs-neighborhood comparisons (comm intent alto, Booking AID)
  const neighborhoodComparisonPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/comparar-barrios`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    ...NEIGHBORHOOD_COMPARISONS.map((c) => ({
      url: `${BASE_URL}/comparar-barrios/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];

  // MMMM01 — vertical SEO "Cuándo viajar a [destino]" (high intent, evergreen)
  const cuandoViajarPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/cuando-viajar`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    },
    ...DESTINATIONS_SEASONAL.map((d) => ({
      url: `${BASE_URL}/cuando-viajar/${d.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
  // abr-2026dd: 12 month pages (URL: /vuelos-baratos/{slug})
  // Renamed from /vuelos-baratos-{slug} (top-level bracket route) en abr-2026ee tras
  // descubrir que Vercel CLI sin git source no servía rutas con corchetes en prefix.
  const monthPages: MetadataRoute.Sitemap = MONTHS.map((m) => ({
    url: `${BASE_URL}/vuelos-baratos/${m.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // SSS283 (17 may 2026): seasonal landing pages — high-intent SEO long-tail.
  const SEASONAL_SLUGS = [
    "semana-santa-2026",
    "verano-2026",
    "puente-diciembre-2026",
    "puente-octubre-2026",
    "navidad-2026",
  ];
  const seasonalPages: MetadataRoute.Sitemap = SEASONAL_SLUGS.map((slug) => ({
    url: `${BASE_URL}/vuelos-temporada/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // SSS289 (17 may 2026): /equipaje/[aerolinea] nueva vertical SEO high-intent
  const BAGGAGE_SLUGS = ["ryanair", "vueling", "easyjet", "iberia", "wizz", "lufthansa", "air-france", "klm", "norwegian", "qatar-airways", "tap-portugal", "turkish-airlines", "british-airways", "aer-lingus", "emirates"];
  const equipajeIndex = {
    url: `${BASE_URL}/equipaje`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  };
  const equipajePages: MetadataRoute.Sitemap = BAGGAGE_SLUGS.map((slug) => ({
    url: `${BASE_URL}/equipaje/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // C3: precio mes a mes — 12 rutas top con calendar 12 meses cada una
  const monthlyPriceIndex = {
    url: `${BASE_URL}/precio-mes-a-mes`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  };
  const monthlyPriceRoutes: MetadataRoute.Sitemap = Object.keys(MONTHLY_ROUTES).map((slug) => ({
    url: `${BASE_URL}/precio-mes-a-mes/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // YY4: hotel detail pages (60+ entries con imagen + rating + booking)
  const hotelPages: MetadataRoute.Sitemap = getHotelEntries().map((h) => ({
    url: `${BASE_URL}/hoteles/${h.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  // CCCC02 — /hoteles/ciudad/[city] páginas de listado por ciudad
  const citySlug = (city: string) =>
    city
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  const hotelCityPages: MetadataRoute.Sitemap = Array.from(
    new Set(getHotelEntries().map((h) => citySlug(h.city))),
  )
    .filter(Boolean)
    .map((slug) => ({
      url: `${BASE_URL}/hoteles/ciudad/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  // SSS99 + TTT02: 50 rutas pareadas SEO long-tail (origen-destino keywords)
  // /vuelos/madrid-lisboa, /vuelos/barcelona-londres, etc.
  const TOP_ROUTE_SLUGS = [
    // Originales SSS99 (20)
    "madrid-lisboa", "madrid-londres", "barcelona-roma", "madrid-paris",
    "barcelona-londres", "madrid-roma", "barcelona-paris", "madrid-amsterdam",
    "madrid-berlin", "barcelona-amsterdam", "madrid-nueva-york", "madrid-tokio",
    "madrid-bangkok", "madrid-buenos-aires", "barcelona-nueva-york",
    "madrid-cancun", "madrid-bali", "madrid-cuba", "barcelona-tokio",
    "madrid-marrakech",
    // TTT02 — ES regional (10)
    "sevilla-roma", "valencia-londres", "bilbao-paris", "malaga-amsterdam",
    "palma-londres", "alicante-paris", "granada-londres", "tenerife-londres",
    "ibiza-paris", "santiago-roma",
    // TTT02 — EU emerging (10)
    "madrid-praga", "madrid-budapest", "madrid-viena", "madrid-estambul",
    "madrid-dubai", "barcelona-praga", "barcelona-budapest", "madrid-reikiavik",
    "barcelona-singapur", "madrid-lima",
    // TTT02 — cross-EU popular (10)
    "amsterdam-roma", "londres-roma", "paris-roma", "berlin-roma",
    "milan-paris", "milan-londres", "dublin-londres", "lisboa-paris",
    "lisboa-roma", "atenas-roma",
    // UUU01 — long-haul + sun-coast + east-EU emerging (45 new uniques)
    "barcelona-estambul", "madrid-doha",
    "madrid-singapur", "madrid-hong-kong", "madrid-seul", "madrid-shanghai",
    "madrid-melbourne", "madrid-sidney",
    "madrid-bogota", "madrid-santiago-chile", "madrid-sao-paulo",
    "madrid-mexico", "madrid-rio-de-janeiro",
    "madrid-johannesburgo", "madrid-ciudad-del-cabo", "madrid-nairobi",
    "madrid-casablanca",
    "madrid-malta", "madrid-chipre", "barcelona-malta",
    "madrid-tenerife", "madrid-gran-canaria", "barcelona-tenerife",
    "madrid-helsinki", "madrid-estocolmo", "madrid-oslo",
    "barcelona-helsinki",
    "madrid-varsovia", "madrid-cracovia", "madrid-bucarest", "madrid-belgrado",
    "madrid-tirana", "barcelona-cracovia", "barcelona-belgrado",
    "barcelona-bucarest",
    "valencia-paris", "valencia-amsterdam", "sevilla-paris", "sevilla-amsterdam",
    "bilbao-amsterdam", "bilbao-roma", "malaga-roma",
    "milan-barcelona", "praga-paris", "amsterdam-paris",
  ];
  const pairedRoutePages: MetadataRoute.Sitemap = TOP_ROUTE_SLUGS.map((slug) => ({
    url: `${BASE_URL}/vuelos/${slug}`,
    lastModified: hot,
    changeFrequency: "daily" as const,
    priority: 0.75,
  }));

  // WWW04+XXX01 — i18n DACH/IT destinos[slug] (10 destinos × 3 idiomas = 30 URLs).
  // Mantener sincronizado con DESTINATIONS_I18N en lib/destinations_i18n.ts.
  const I18N_DEST_SLUGS = [
    "japan", "thailand", "bali", "new-york", "iceland", "bangkok",
    "paris", "london", "lisbon", "dubai",
  ];
  const I18N_DACH_LOCALES = ["it", "de", "fr"];
  const i18nDachDestPages: MetadataRoute.Sitemap = I18N_DACH_LOCALES.flatMap(
    (locale) => I18N_DEST_SLUGS.map((slug) => ({
      url: `${BASE_URL}/${locale}/destinos/${slug}`,
      lastModified: hot,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    })),
  );

  // SSS338 (20 may 2026) — programmatic SEO landings
  //  - /vuelos-baratos/[ciudad]/[mes]: 48 ciudades × 12 meses = 576 URLs
  //  - /precio-vuelo/[origen]/[destino]: 6 orígenes × 48 destinos = 288 URLs
  // Priority dinámico: sweet spot mes = 0.75, peak mes (jul/ago/dic) = 0.7,
  // resto = 0.6 — Google prioriza las URLs con priority alto en crawl budget.
  const PROGRAMMATIC_PEAK_MONTHS = new Set([7, 8, 12]);
  const vuelosBaratosPages: MetadataRoute.Sitemap = SEO_CITIES.flatMap((city) =>
    MONTHS_ES.map((m) => {
      const isSweet = m.num === city.sweetSpot;
      const isPeak = PROGRAMMATIC_PEAK_MONTHS.has(m.num);
      return {
        url: `${BASE_URL}/vuelos-baratos/${m.slug}/${city.slug}`,
        lastModified: evergreen,
        changeFrequency: "weekly" as const,
        priority: isSweet ? 0.75 : isPeak ? 0.7 : 0.6,
      };
    }),
  );
  const precioVueloPages: MetadataRoute.Sitemap = SEO_ORIGINS.flatMap((o) =>
    SEO_CITIES.map((c) => ({
      url: `${BASE_URL}/precio-vuelo/${o.slug}/${c.slug}`,
      lastModified: evergreen,
      changeFrequency: "weekly" as const,
      // Priority por región — short-haul europa = 0.65, long-haul america/asia = 0.55
      priority: c.region === "europa" ? 0.65 : 0.55,
    })),
  );

  return [
    ...staticPages,
    ...destinoPages,
    // SSS418: 3 nuevos verticales programmatic (93 URLs)
    ...seguroDestinoPages,
    ...esimDestinoPages,
    ...visadoDestinoPages,
    // SSS421: vertical /aeropuertos 15 hubs ES
    ...aeropuertoPages,
    // SSS422: 15 guías ampliadas glosario
    ...glosarioTermPages,
    // SSS427: 15 guías check-in por aerolínea
    ...checkInPages,
    // SSS428: 8 comparadores tren vs avión
    ...vueloTrenPages,
    // SSS429: 4 lead magnets
    ...freebiePages,
    // SSS433: 12 escapadas fin de semana
    ...escapadasPages,
    // SSS436: checklist pre-trip por destino
    ...prepararViajePages,
    // SSS439: 8 eventos top España
    ...eventosEsPages,
    // SSS440: 8 conferencias tech/business
    ...conferenciasPages,
    // SSS444: 15 países códigos lookup
    ...codigosPaisPages,
    // SSS445: 20 hubs internacionales
    ...aeropuertosMundoPages,
    // SSS449: 20 flag carriers
    ...flagCarriersPages,
    // SSS457: 8 currency landings
    ...divisasPages,
    // SSS459: 12 tasa turística landings
    ...tasaTuristicaPages,
    // SSS463: 12 temporada baja landings
    ...temporadaBajaPages,
    // SSS486 + AUDIT-FULL-2: 15 etiqueta cultural landings
    ...etiquetaPages,
    // AUDIT-FULL-2: clima por destino + hub
    ...climaPages,
    // AUDIT-FULL-3: jet-lag por ruta + hub
    ...jetlagPages,
    // SUPERSESSION: idiomas + dinero verticals
    ...idiomasPages,
    ...dineroPages,
    ...comoViajarPages,
    ...blogPages,
    ...esTagPages,
    ...enTagPages,
    ...aerolineasPages,
    ...utilityPages,
    ...hubPages,
    ...comparisonPages,
    ...airlineComparisonPages,
    ...neighborhoodComparisonPages,
    ...cuandoViajarPages,
    ...regionPages,
    ...monthPages,
    ...seasonalPages,
    equipajeIndex,
    ...equipajePages,
    monthlyPriceIndex,
    ...monthlyPriceRoutes,
    ...hotelPages,
    ...hotelCityPages,
    ...pairedRoutePages,
    ...i18nDachDestPages,
    ...feedPages,
    ...dealPages,
    ...vuelosBaratosPages,
    ...precioVueloPages,
  ];
}
