import type { Metadata } from "next";
import Image from "next/image";
import { getAllPosts } from "@/lib/blog";
import { JsonLd } from "@/components/JsonLd";

/**
 * English blog index — surfaces EN-tagged articles first, then the rest.
 *
 * We don't fork the blog storage: posts live in `src/content/blog/*.mdx`.
 * An article is EN when its filename hints English (e.g. contains "how-to",
 * "what-is", "error-fares-from-europe", "guide") OR when frontmatter tags
 * include "english"/"en". Everything else is surfaced under "More guides".
 * This avoids maintaining two libraries while giving EN crawlers a curated
 * feed. A future refactor can add a proper `lang` field to frontmatter.
 */
export const metadata: Metadata = {
  title: "Blog — Error fare guides, strategies & analysis | TripCazador",
  description:
    "Long-form guides about mistake fares, business-class deals, search strategies and destination analysis. Written by hunters, not scraped from AI slop.",
  alternates: {
    canonical: "/en/blog",
    languages: {
      "en": "https://tripcazador.com/en/blog",
      "es": "https://tripcazador.com/blog",
      "x-default": "https://tripcazador.com/blog",
    },
  },
  openGraph: {
    title: "TripCazador Blog — Error fare guides & strategies",
    description:
      "Everything we've learned tracking fares 24/7 from European hubs.",
    type: "website",
    locale: "en_US",
    url: "https://tripcazador.com/en/blog",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "TripCazador — chollos de vuelo desde Europa" }],
  },
};

export const dynamic = "force-static";
export const revalidate = 3600;

const EN_SLUG_HINTS = [
  "how-to-",
  "what-is-",
  "what-are-",
  "guide",
  "error-fares-from-europe",
  "error-fare",
  "business-class-field-guide",
];

function isEnglishPost(slug: string, tags: string[]): boolean {
  const t = tags.map((x) => x.toLowerCase());
  if (t.includes("english") || t.includes("en")) return true;
  const s = slug.toLowerCase();
  return EN_SLUG_HINTS.some((hint) => s.includes(hint));
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function BlogIndexEnPage() {
  const all = getAllPosts();
  const english = all.filter((p) => isEnglishPost(p.slug, p.tags));
  const others = all.filter((p) => !isEnglishPost(p.slug, p.tags));

  return (
    <div className="space-y-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "TripCazador Blog",
          url: "https://tripcazador.com/en/blog",
          inLanguage: "en",
          description:
            "Guides and analysis about error fares and cheap flights from Europe.",
        }}
      />
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/en" className="hover:text-white">
            Home
          </a>
          <span>/</span>
          <span className="text-white">Blog</span>
        </div>
        <h1 className="text-4xl font-bold text-white">TripCazador Blog (EN)</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          Long-form guides, field-tested strategies and destination analysis —
          distilled from tracking fares 24/7 out of Basel, Zürich, Frankfurt,
          Munich, Paris and Amsterdam.
        </p>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{english.length} English articles</span>
          <span className="text-gray-700">·</span>
          <a href="/blog" hrefLang="es" className="hover:text-amber-400 transition-colors">
            🇪🇸 Leer en español
          </a>
          <span className="text-gray-700">·</span>
          <a href="/rss.xml" className="hover:text-amber-400 transition-colors">
            RSS
          </a>
        </div>
      </header>

      {english.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
          <p className="text-gray-400">No English articles yet — check back soon.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {english.map((post) => (
            <li
              key={post.slug}
              className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-amber-500/40 transition-colors"
            >
              <a href={`/blog/${post.slug}`} className="block">
                {post.heroImage && (
                  <div className="relative w-full h-48 bg-gray-800">
                    <Image
                      src={post.heroImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                    <span>·</span>
                    <span>{post.readingTime} min read</span>
                  </div>
                  <h2 className="text-xl font-bold text-white leading-snug">{post.title}</h2>
                  <p className="text-gray-400 text-sm line-clamp-3">{post.description}</p>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {post.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      {others.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-gray-800">
          <h2 className="text-xl font-bold text-white">More guides (Spanish)</h2>
          <p className="text-sm text-gray-400">
            These articles are currently Spanish-only. Google Translate handles
            them well if you need a quick read.
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {others.slice(0, 6).map((post) => (
              <li
                key={post.slug}
                className="bg-gray-950 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors"
              >
                <a href={`/blog/${post.slug}`} className="block space-y-2">
                  <div className="text-xs text-gray-500">
                    <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                  </div>
                  <h3 className="text-sm font-semibold text-white line-clamp-2">{post.title}</h3>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-8 border border-amber-500/20">
        <h2 className="text-xl font-bold text-white mb-2">
          Want fares pushed to you instead of searching?
        </h2>
        <p className="text-gray-400 mb-4">
          Our Telegram bot pings you in seconds when a mistake fare shows up.
          Free, no signup.
        </p>
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Join the Telegram channel
        </a>
      </section>
    </div>
  );
}
