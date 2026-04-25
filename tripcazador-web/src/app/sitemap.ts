import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { getDeals } from "@/lib/api";
import { getAllPosts } from "@/lib/blog";

const BASE_URL = "https://tripcazador.com";

// Lista hardcoded de destinos (debe coincidir con destinos/[slug]/page.tsx)
const DESTINOS = [
  "tanzania", "japon", "maldivas", "nueva-york", "bali", "buenos-aires",
  "tailandia", "sudafrica", "islandia", "marruecos", "vietnam", "costa-rica",
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
  const now = new Date();

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
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1.0,
      alternates: { languages: LANG_ALT_HOME },
    },
    {
      url: `${BASE_URL}/en`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
      alternates: { languages: LANG_ALT_HOME },
    },
    { url: `${BASE_URL}/deals`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/hoteles`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
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
  ];

  const destinoPages: MetadataRoute.Sitemap = DESTINOS.map((slug) => ({
    url: `${BASE_URL}/destinos/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
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

  return [...staticPages, ...destinoPages, ...blogPages, ...dealPages];
}
