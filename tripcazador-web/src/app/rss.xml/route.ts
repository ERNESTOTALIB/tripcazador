import { getPostsByLang } from "@/lib/blog";

const BASE_URL = "https://tripcazador.com";
const SITE_TITLE = "TripCazador — Blog";
const SITE_DESCRIPTION =
  "Guías, estrategias y análisis de chollos de vuelo desde Europa. Error fares, Business class barata y más.";

// Revalida el feed cada hora (aunque las entradas rara vez cambian).
export const revalidate = 3600;
export const dynamic = "force-static";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(date: string): string {
  try {
    return new Date(date).toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

export async function GET(): Promise<Response> {
  // abr-2026x: feed ES = solo posts ES. Antes mezclaba EN. Se separa porque
  // Google News indexa por idioma y mezclar baja calidad de hits.
  const posts = getPostsByLang("es");
  const lastBuild = posts.length > 0 ? toRfc822(posts[0].publishedAt) : new Date().toUTCString();

  const items = posts
    .map((post) => {
      const url = `${BASE_URL}/blog/${post.slug}`;
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${toRfc822(post.publishedAt)}</pubDate>
      <author>contacto@tripcazador.com (${escapeXml(post.author)})</author>
      ${post.tags.map((t) => `<category>${escapeXml(t)}</category>`).join("\n      ")}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${BASE_URL}/blog</link>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>es-ES</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <generator>TripCazador Next.js</generator>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
