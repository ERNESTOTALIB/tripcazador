import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { getDeals } from "@/lib/api";
import { getAllPosts, getAllTagsWithCounts } from "@/lib/blog";
import { AIRLINES } from "@/lib/airlines";
import { HUBS } from "@/lib/hubs";
import { COMPARISONS } from "@/lib/comparisons";
import { REGIONS } from "@/lib/regions";
import { MONTHS } from "@/lib/months";
import { MONTHLY_ROUTES } from "@/lib/monthly_prices";
import { getHotelEntries } from "@/lib/hotel_seed";
import { PARTNERS } from "@/lib/travel_partners";

const BASE_URL = "https://tripcazador.com";

// Lista hardcoded de destinos (debe coincidir con destinos/[slug]/page.tsx)
// abr-2026z: añadidos marrakech, tokio, reykjavik, singapur, praga, estambul (12 → 18)
// abr-2026bb: añadidos berlin, atenas, dubai, el-cairo, hong-kong, sydney (18 → 24)
const DESTINOS = [
  "tanzania", "japon", "maldivas", "nueva-york", "bali", "buenos-aires",
  "tailandia", "sudafrica", "islandia", "marruecos", "vietnam", "costa-rica",
  "marrakech", "tokio", "reykjavik", "singapur", "praga", "estambul",
  "berlin", "atenas", "dubai", "el-cairo", "hong-kong", "sydney",
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
    // sss SSS11: SEO landing — "agencia de viajes online" 33k búsquedas/mes
    { url: `${BASE_URL}/agencia-de-viajes`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/comparar-vuelos`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/como-viajar`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const destinoPages: MetadataRoute.Sitemap = DESTINOS.map((slug) => ({
    url: `${BASE_URL}/destinos/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
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
  // abr-2026dd: 12 month pages (URL: /vuelos-baratos/{slug})
  // Renamed from /vuelos-baratos-{slug} (top-level bracket route) en abr-2026ee tras
  // descubrir que Vercel CLI sin git source no servía rutas con corchetes en prefix.
  const monthPages: MetadataRoute.Sitemap = MONTHS.map((m) => ({
    url: `${BASE_URL}/vuelos-baratos/${m.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
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

  // SSS99: top-20 rutas pareadas SEO long-tail (origen-destino keywords reales)
  // /vuelos/madrid-lisboa, /vuelos/barcelona-londres, etc.
  const TOP_ROUTE_SLUGS = [
    "madrid-lisboa", "madrid-londres", "barcelona-roma", "madrid-paris",
    "barcelona-londres", "madrid-roma", "barcelona-paris", "madrid-amsterdam",
    "madrid-berlin", "barcelona-amsterdam", "madrid-nueva-york", "madrid-tokio",
    "madrid-bangkok", "madrid-buenos-aires", "barcelona-nueva-york",
    "madrid-cancun", "madrid-bali", "madrid-cuba", "barcelona-tokio",
    "madrid-marrakech",
  ];
  const pairedRoutePages: MetadataRoute.Sitemap = TOP_ROUTE_SLUGS.map((slug) => ({
    url: `${BASE_URL}/vuelos/${slug}`,
    lastModified: hot,
    changeFrequency: "daily" as const,
    priority: 0.75,
  }));

  return [
    ...staticPages,
    ...destinoPages,
    ...comoViajarPages,
    ...blogPages,
    ...esTagPages,
    ...enTagPages,
    ...aerolineasPages,
    ...utilityPages,
    ...hubPages,
    ...comparisonPages,
    ...regionPages,
    ...monthPages,
    monthlyPriceIndex,
    ...monthlyPriceRoutes,
    ...hotelPages,
    ...pairedRoutePages,
    ...feedPages,
    ...dealPages,
  ];
}
