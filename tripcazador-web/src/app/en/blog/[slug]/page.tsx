import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import { getAllPostSlugs, getPostBySlug } from "@/lib/blog";
import { JsonLd } from "@/components/JsonLd";
import { RelatedPosts } from "@/components/RelatedPosts";

/**
 * /en/blog/[slug] — abr-2026k
 *
 * Estrategia: cuando un post está marcado como EN (slug-hint o tag
 * "english"/"en"), se renderiza aquí en su versión original. Cuando es
 * un post ES (sin marcas EN), mostramos un STUB de cortesía con un
 * resumen y un link al post ES — NO duplicamos el contenido.
 *
 * Regla SEO: el canonical apunta SIEMPRE al artículo en su idioma original.
 * Para los posts ES servidos bajo /en/blog/[slug], canonical = /blog/[slug].
 * Esto evita que Google indexe contenido duplicado.
 */

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

export const dynamic = "force-static";
export const revalidate = 3600;

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: "Not found" };
  const isEn = isEnglishPost(post.slug, post.tags);
  const canonical = isEn
    ? `/en/blog/${post.slug}`
    : `/blog/${post.slug}`; // Posts ES → canonical apunta al ES original.
  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical,
      languages: {
        en: `https://tripcazador.com/en/blog/${post.slug}`,
        es: `https://tripcazador.com/blog/${post.slug}`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      locale: "en_US",
      alternateLocale: ["es_ES"],
      publishedTime: post.publishedAt,
      modifiedTime: post.lastModified,
      images: post.heroImage ? [{ url: post.heroImage }] : ["/og-default.png"],
    },
    robots: { index: isEn, follow: true },
    // Posts ES bajo /en/blog/* NO se indexan: el stub es ayuda al usuario,
    // no contenido para crawlers.
  };
}

export default function EnBlogSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const isEn = isEnglishPost(post.slug, post.tags);

  // ──── Versión EN: renderizar el artículo completo ────
  if (isEn) {
    const jsonLd = [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.description,
        datePublished: post.publishedAt,
        dateModified: post.lastModified || post.publishedAt,
        author: { "@type": "Organization", name: post.author },
        publisher: {
          "@type": "Organization",
          name: "TripCazador",
          logo: {
            "@type": "ImageObject",
            url: "https://tripcazador.com/android-chrome-512x512.png",
            width: 512,
            height: 512,
          },
        },
        image: post.heroImage || "https://tripcazador.com/og-default.png",
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://tripcazador.com/en/blog/${post.slug}`,
        },
        keywords: post.tags,
        inLanguage: "en",
        wordCount: post.wordCount,
        timeRequired: `PT${Math.max(1, post.readingTime)}M`,
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
            name: post.title,
            item: `https://tripcazador.com/en/blog/${post.slug}`,
          },
        ],
      },
    ];

    return (
      <article className="max-w-3xl mx-auto">
        <JsonLd data={jsonLd} />
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <a href="/en" className="hover:text-white">Home</a>
          <span>/</span>
          <a href="/en/blog" className="hover:text-white">Blog</a>
          <span>/</span>
          <span className="text-white truncate">{post.title}</span>
        </nav>
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            {post.title}
          </h1>
          <p className="text-lg text-gray-400 mt-3">{post.description}</p>
          <div className="flex items-center gap-3 text-sm text-gray-500 mt-4">
            <span>{post.author}</span>
            <span>·</span>
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <span>·</span>
            <span>{post.readingTime} min read</span>
          </div>
        </header>
        {post.heroImage && (
          <div className="relative w-full mb-8 rounded-2xl overflow-hidden aspect-[16/9] bg-gray-800">
            <Image
              src={post.heroImage}
              alt={post.title}
              fill
              sizes="(max-width: 1024px) 100vw, 800px"
              priority
              className="object-cover"
            />
          </div>
        )}
        <div className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-amber-400 hover:prose-a:text-amber-300 prose-strong:text-white prose-code:text-amber-300 prose-blockquote:border-amber-500 prose-blockquote:text-gray-300">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]]}
          >
            {post.content}
          </ReactMarkdown>
        </div>
        {/* abr-2026x: Related posts EN — top-3 por tag overlap, mismo idioma. */}
        <RelatedPosts slug={post.slug} localePrefix="/en" />
      </article>
    );
  }

  // ──── Versión ES vista bajo /en: STUB con resumen y link al original ────
  // Importante: noindex (en `generateMetadata` arriba) — esto es ayuda al
  // usuario que aterriza en /en/blog/[slug] de un post sólo en español.
  return (
    <article className="max-w-3xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <a href="/en" className="hover:text-white">Home</a>
        <span>/</span>
        <a href="/en/blog" className="hover:text-white">Blog</a>
        <span>/</span>
        <span className="text-white truncate">{post.title}</span>
      </nav>
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
          {post.title}
        </h1>
        <p className="text-lg text-gray-400 mt-3">{post.description}</p>
      </header>
      <div className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-8 border border-amber-500/30">
        <h2 className="text-xl font-bold text-white mb-3">
          🇪🇸 This article is currently Spanish-only
        </h2>
        <p className="text-gray-300 mb-4">
          Our long-form guides ship in Spanish first and get translated when
          we have a confident EN draft. In the meantime, the original Spanish
          article is fully readable with browser auto-translate (Chrome &
          Edge handle the layout cleanly).
        </p>
        <p className="text-gray-400 text-sm mb-5">
          Published <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>{" "}
          · {post.readingTime} min read
        </p>
        <a
          href={`/blog/${post.slug}`}
          hrefLang="es"
          rel="alternate"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Read the original (Spanish) →
        </a>
      </div>
      <p className="text-sm text-gray-500 mt-8">
        Want this article in English? Tell us on{" "}
        <a
          href="https://t.me/tripcazador_bot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400 hover:text-amber-300"
        >
          Telegram
        </a>{" "}
        and we&apos;ll prioritise the translation.
      </p>
    </article>
  );
}
