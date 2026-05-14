import type { Metadata } from "next";
import Image from "next/image";
import { getAllPosts, getAllTagsWithCounts } from "@/lib/blog";
import { JsonLd } from "@/components/JsonLd";
import { SectionHero } from "@/components/SectionHero";

export const metadata: Metadata = {
  title: "Blog — Guías, estrategias y análisis de chollos de vuelo",
  description:
    "Guías en profundidad sobre error fares, Business class barata, estrategias de búsqueda y análisis de destinos. Escrito por cazadores, no por IA random.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog TripCazador — Guías y estrategias de chollos",
    description:
      "Todo lo que hemos aprendido monitorizando tarifas 24/7 desde hubs europeos.",
    type: "website",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "TripCazador — chollos de vuelo desde Europa" }],
  },
};

export const dynamic = "force-static";
export const revalidate = 3600;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function BlogIndexPage() {
  const posts = getAllPosts();
  // abr-2026x: top 8 tags como chips de navegación + JSON-LD ItemList del listado
  const topTags = getAllTagsWithCounts("es").slice(0, 8);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "TripCazador Blog",
    url: "https://tripcazador.com/blog",
    inLanguage: "es-ES",
    blogPost: posts.slice(0, 20).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `https://tripcazador.com/blog/${p.slug}`,
      datePublished: p.publishedAt,
      author: { "@type": "Organization", name: p.author },
    })),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: posts.length,
      itemListElement: posts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://tripcazador.com/blog/${p.slug}`,
        name: p.title,
      })),
    },
  };

  return (
    <div className="space-y-10">
      <JsonLd data={jsonLd} />

      {/* fase vv VV6 — Hero sky */}
      <SectionHero
        size="tall"
        badge={`${posts.length} artículos publicados`}
        title={
          <>
            Guías y <em>estrategias</em>
          </>
        }
        subtitle="Todo lo que hemos aprendido monitorizando tarifas 24/7 desde hubs europeos. Sin IA generativa, sin clickbait."
      />

      <header className="space-y-4">
        {/* Breadcrumb textual eliminado en VV11 (el hero ya da contexto). */}
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{posts.length} artículos publicados</span>
          <span className="text-gray-700">·</span>
          <a href="/rss.xml" className="hover:text-amber-400 transition-colors">
            Suscríbete por RSS
          </a>
        </div>
        {topTags.length > 0 && (
          <nav aria-label="Etiquetas populares" className="flex flex-wrap gap-2 pt-2">
            {topTags.map(({ tag, count }) => (
              <a
                key={tag}
                href={`/blog/tag/${encodeURIComponent(tag)}`}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-amber-300 px-3 py-1 rounded-full transition-colors"
              >
                {tag} <span className="text-gray-500">({count})</span>
              </a>
            ))}
          </nav>
        )}
      </header>

      {posts.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
          <p className="text-gray-400">No hay artículos publicados todavía.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
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
                      // No critical: lazy + responsive sizes evitan descargar
                      // 1600px en mobile.
                    />
                  </div>
                )}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                    <span>·</span>
                    <span>{post.readingTime} min lectura</span>
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

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-8 border border-amber-500/20">
        <h2 className="text-xl font-bold text-white mb-2">¿Prefieres recibir los chollos al instante?</h2>
        <p className="text-gray-400 mb-4">
          Nuestro bot de Telegram te avisa en segundos cuando aparece un error fare o una tarifa anómala. Gratis.
        </p>
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Unirme al canal de Telegram
        </a>
      </section>
    </div>
  );
}
