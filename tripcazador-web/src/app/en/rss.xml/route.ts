import { getPostsByLang } from "@/lib/blog";

const BASE_URL = "https://tripcazador.com";
const SITE_TITLE = "TripCazador — Blog (English)";
const SITE_DESCRIPTION =
  "In-depth guides on error fares, business class deals and flight hunting strategies from European hubs.";

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

/**
 * abr-2026x: feed RSS solo para posts EN (resolvedLang === "en"). Linkable
 * desde /en/blog y desde el head <link rel=alternate> en /en/layout. Habilita
 * que Google News, Feedly, NetNewsWire y otros descubran y notifiquen contenido
 * EN sin tener que filtrar el feed mixto.
 */
export async function GET(): Promise<Response> {
  const posts = getPostsByLang("en");
  const lastBuild =
    posts.length > 0 ? toRfc822(posts[0].publishedAt) : new Date().toUTCString();

  const items = posts
    .map((post) => {
      const url = `${BASE_URL}/en/blog/${post.slug}`;
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
    <link>${BASE_URL}/en/blog</link>
    <atom:link href="${BASE_URL}/en/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-US</language>
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
