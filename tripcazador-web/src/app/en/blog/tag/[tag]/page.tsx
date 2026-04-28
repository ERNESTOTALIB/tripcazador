import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getAllTagsWithCounts, getPostsByTag } from "@/lib/blog";
import { JsonLd } from "@/components/JsonLd";

type Params = { tag: string };

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<Params[]> {
  return getAllTagsWithCounts("en").map((t) => ({ tag: encodeURIComponent(t.tag) }));
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
  const posts = getPostsByTag(tag, "en");
  if (posts.length === 0) return { title: "Tag not found" };
  const human = humanizeTag(tag);
  return {
    title: `${human} — TripCazador articles`,
    description: `${posts.length} articles tagged ${human}: strategies, analysis, and guides on cheap flights.`,
    alternates: { canonical: `/en/blog/tag/${tag}` },
    openGraph: {
      type: "website",
      title: `${human} — TripCazador Blog`,
      description: `All articles tagged "${human}".`,
    },
  };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function EnBlogTagPage({ params }: { params: Params }) {
  const tag = decode(params.tag);
  const posts = getPostsByTag(tag, "en");
  if (posts.length === 0) notFound();
  const human = humanizeTag(tag);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${human} — TripCazador`,
      description: `Articles tagged ${human}.`,
      url: `https://tripcazador.com/en/blog/tag/${tag}`,
      inLanguage: "en-US",
      isPartOf: {
        "@type": "Blog",
        name: "TripCazador Blog",
        url: "https://tripcazador.com/en/blog",
      },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: posts.length,
        itemListElement: posts.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `https://tripcazador.com/en/blog/${p.slug}`,
          name: p.title,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://tripcazador.com/en" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://tripcazador.com/en/blog" },
        {
          "@type": "ListItem",
          position: 3,
          name: human,
          item: `https://tripcazador.com/en/blog/tag/${tag}`,
        },
      ],
    },
  ];

  return (
    <div className="space-y-10">
      <JsonLd data={jsonLd} />
      <header className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/en" className="hover:text-white">Home</a>
          <span>/</span>
          <a href="/en/blog" className="hover:text-white">Blog</a>
          <span>/</span>
          <span className="text-white">{human}</span>
        </nav>
        <h1 className="text-4xl font-bold text-white">Articles tagged <span className="text-amber-400">{human}</span></h1>
        <p className="text-gray-400 max-w-2xl">
          {posts.length} {posts.length === 1 ? "article" : "articles"} on {human} — data-driven guides from a 24/7 fare hunter.
        </p>
      </header>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <li
            key={post.slug}
            className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-amber-500/40 transition-colors"
          >
            <a href={`/en/blog/${post.slug}`} className="block">
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
        <a href="/en/blog" className="text-amber-400 hover:text-amber-300">
          ← All articles
        </a>
      </div>
    </div>
  );
}
