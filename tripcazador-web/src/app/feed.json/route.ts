/**
 * /feed.json — SSS442 (23 may 2026)
 *
 * JSON Feed 1.1 spec (https://www.jsonfeed.org/version/1.1/) endpoint
 * para aggregators modernos (NetNewsWire, Inoreader, Feedly Pro, etc.)
 * que prefieren JSON sobre RSS XML.
 *
 * Mirror de /rss.xml (mismos posts ES) en formato JSON Feed estándar.
 *
 * Spec compliance:
 * - version: "https://jsonfeed.org/version/1.1"
 * - title, home_page_url, feed_url required
 * - items[]: id, url, content_html or content_text, date_published
 *
 * Aggregators que soportan JSON Feed: NetNewsWire, Inoreader, Reeder,
 * Feedbin, Feedly Pro, FreshRSS, Miniflux.
 */
import { getPostsByLang } from "@/lib/blog";

const BASE_URL = "https://tripcazador.com";

export const revalidate = 3600;
export const dynamic = "force-static";

interface JsonFeedItem {
  id: string;
  url: string;
  title: string;
  content_text?: string;
  content_html?: string;
  summary?: string;
  date_published: string;
  tags?: string[];
  authors?: Array<{ name: string }>;
}

interface JsonFeed {
  version: string;
  title: string;
  home_page_url: string;
  feed_url: string;
  description: string;
  language: string;
  icon?: string;
  favicon?: string;
  authors?: Array<{ name: string; url?: string }>;
  items: JsonFeedItem[];
}

export async function GET(): Promise<Response> {
  const posts = getPostsByLang("es");

  const items: JsonFeedItem[] = posts.slice(0, 30).map((post) => {
    const url = `${BASE_URL}/blog/${post.slug}`;
    return {
      id: url,
      url,
      title: post.title,
      summary: post.description || "",
      content_text: post.description || "",
      date_published: new Date(post.publishedAt).toISOString(),
      tags: post.tags || [],
      authors: [{ name: "TripCazador" }],
    };
  });

  const feed: JsonFeed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "TripCazador — Blog",
    home_page_url: BASE_URL,
    feed_url: `${BASE_URL}/feed.json`,
    description:
      "Guías, estrategias y análisis de chollos de vuelo desde Europa. Error fares, Business class barata y más.",
    language: "es-ES",
    icon: `${BASE_URL}/icon-512.png`,
    favicon: `${BASE_URL}/favicon.ico`,
    authors: [{ name: "TripCazador", url: BASE_URL }],
    items,
  };

  return new Response(JSON.stringify(feed, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      // Sin CORS abierto — aggregators no necesitan, y previene scraping abuse.
    },
  });
}
