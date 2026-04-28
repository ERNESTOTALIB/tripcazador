import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getAllTagsWithCounts, getPostsByTag } from "@/lib/blog";
import { JsonLd } from "@/components/JsonLd";

type Params = { tag: string };

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<Params[]> {
  return getAllTagsWithCounts("es").map((t) => ({ tag: encodeURIComponent(t.tag) }));
}

function decode(t: string): string {
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}

function humanizeTag(t: string): string {
  return t.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const tag = decode(params.tag);
  const posts = getPostsByTag(tag, "es");
  if (posts.length === 0) return { title: "Etiqueta no encontrada" };
  const human = humanizeTag(tag);
  return {
    title: `${human} — Artículos en TripCazador`,
    description: `${posts.length} artículos sobre ${human}: estrategias, análisis y guías de chollos de vuelo.`,
    alternates: { canonical: `/blog/tag/${tag}` },
    openGraph: {
      type: "website",
      title: `${human} — TripCazador Blog`,
      description: `Todos los artículos etiquetados con "${human}".`,
    },
    robots: posts.length === 0 ? { index: false } : undefined,
  };
}

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

/**
 * abr-2026x: páginas archive por tag. Capturan keywords long-tail
 * ("vuelos baratos lisboa", "asia luxury", "fin de semana"). Cada tag genera
 * una landing con todos sus posts + JSON-LD CollectionPage para Google.
 *
 * generateStaticParams pre-renderiza al build los tags conocidos; tags
 * nuevos se sirven dinámicamente vía dynamicParams=true (ISR).
 */
export default function BlogTagPage({ params }: { params: Params }) {
  const tag = decode(params.tag);
  const posts = getPostsByTag(tag, "es");
  if (posts.length === 0) notFound();
  const human = humanizeTag(tag);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${human} — TripCazador`,
      description: `Artículos sobre ${human}.`,
      url: `https://tripcazador.com/blog/tag/${tag}`,
      inLanguage: "es-ES",
      isPartOf: {
        "@type": "Blog",
        name: "TripCazador Blog",
        url: "https://tripcazador.com/blog",
      },
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
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://tripcazador.com/blog" },
        {
          "@type": "ListItem",
          position: 3,
          name: human,
          item: `https://tripcazador.com/blog/tag/${tag}`,
        },
      ],
    },
  ];

  return (
    <div className="space-y-10">
      <JsonLd data={jsonLd} />
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">Inicio</a>
          <span>/</span>
          <a href="/blog" className="hover:text-white">Blog</a>
          <span>/</span>
          <span className="text-white">{human}</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Artículos sobre <span className="text-amber-400">{human}</span></h1>
        <p className="text-gray-400 max-w-2xl">
          {posts.length} {posts.length === 1 ? "artículo" : "artículos"} sobre {human} — guías y análisis basados en datos reales del motor.
        </p>
      </header>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <li
            key={post.slug}
            className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-amber-500/40 transition-colors"
          >
            <a href={`/blog/${post.slug}`} className="block">
              {post.heroImage && (
                <div className="relative w-full h-44 bg-gray-800">
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
              <div className="p-5 space-y-2">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                  <span>·</span>
                  <span>{post.readingTime} min</span>
                </div>
                <h2 className="text-lg font-bold text-white leading-snug">{post.title}</h2>
                <p className="text-gray-400 text-sm line-clamp-2">{post.description}</p>
              </div>
            </a>
          </li>
        ))}
      </ul>

      <div className="text-sm text-gray-500">
        <a href="/blog" className="text-amber-400 hover:text-amber-300">
          ← Ver todos los artículos
        </a>
      </div>
    </div>
  );
}
