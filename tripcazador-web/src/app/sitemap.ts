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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "hourly", priority: 1.0 },
    { url: `${BASE_URL}/deals`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/hoteles`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE_URL}/destinos`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/telegram`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/legal`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const destinoPages: MetadataRoute.Sitemap = DESTINOS.map((slug) => ({
    url: `${BASE_URL}/destinos/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Blog posts — usamos publishedAt como lastmod para que Google sepa
  // cuándo recrawlear. Con `now` fuerza recrawl constante pero pierde
  // señal de "qué ha cambiado de verdad".
  const blogPages: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : now,
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
