import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import { getAllPostSlugs, getPostBySlug } from "@/lib/blog";
import { JsonLd } from "@/components/JsonLd";
import { NewsletterABWidget } from "@/components/NewsletterABWidget";
import { PremiumInlineCTA } from "@/components/PremiumInlineCTA";
import { RelatedPosts } from "@/components/RelatedPosts";
import { TableOfContents } from "@/components/TableOfContents";
import { TravelInsuranceCTA } from "@/components/TravelInsuranceCTA";

type Params = { slug: string };

// abr-2026r — explicit revalidate. Posts del blog no cambian tras publicación
// (correcciones puntuales sí, pero no contenido completo). 24h reduce
// regeneración innecesaria sin sacrificar capacidad de actualizar.
export const revalidate = 86400;
export const dynamicParams = true; // permite slugs nuevos sin rebuild

export async function generateStaticParams(): Promise<Params[]> {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: "Artículo no encontrado" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
      images: post.heroImage ? [post.heroImage] : ["/og-default.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.heroImage ? [post.heroImage] : ["/og-default.png"],
    },
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

export default function BlogPostPage({ params }: { params: Params }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  // JSON-LD Article structured data — enriquecido en abr-2026k:
  // - dateModified real (mtime del MDX) en lugar de = publishedAt
  // - wordCount + timeRequired (ISO 8601 PT{n}M) — Google los muestra
  //   en algunos resultados rich
  // - articleSection / inLanguage / isPartOf (Blog) — refuerzan la
  //   relación canónica con el blog y la jerarquía editorial
  // - keywords como array (más estándar que CSV string)
  const jsonLd: Array<Record<string, unknown>> = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: post.publishedAt,
      dateModified: post.lastModified || post.publishedAt,
      author: { "@type": "Organization", name: post.author, url: "https://tripcazador.com" },
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
        "@id": `https://tripcazador.com/blog/${post.slug}`,
      },
      keywords: post.tags,
      articleSection: post.tags[0] || "Travel",
      inLanguage: "es-ES",
      wordCount: post.wordCount,
      timeRequired: `PT${Math.max(1, post.readingTime)}M`,
      isPartOf: {
        "@type": "Blog",
        name: "TripCazador Blog",
        url: "https://tripcazador.com/blog",
      },
    },
    // Breadcrumb separado — Google lo lee como tabla independiente del Article.
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: "https://tripcazador.com/" },
        { "@type": "ListItem", position: 2, name: "Blog", item: "https://tripcazador.com/blog" },
        {
          "@type": "ListItem",
          position: 3,
          name: post.title,
          item: `https://tripcazador.com/blog/${post.slug}`,
        },
      ],
    },
  ];

  return (
    <article className="max-w-3xl mx-auto">
      {/* Inyección de JSON-LD con escape anti-breakout <script> centralizado. */}
      <JsonLd data={jsonLd} />

      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <a href="/" className="hover:text-white">
          Inicio
        </a>
        <span>/</span>
        <a href="/blog" className="hover:text-white">
          Blog
        </a>
        <span>/</span>
        <span className="text-white truncate">{post.title}</span>
      </nav>

      <header className="space-y-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-800 text-amber-400 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
          {post.title}
        </h1>
        <p className="text-lg text-gray-400">{post.description}</p>
        <div className="flex items-center gap-3 text-sm text-gray-500 border-b border-gray-800 pb-4">
          <span>{post.author}</span>
          <span>·</span>
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span>·</span>
          <span>{post.readingTime} min lectura</span>
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

      {/* TTT04 — Table of Contents auto-generated from H2/H3 markdown.
          Solo aparece si el post tiene ≥3 headings (skip on short posts).
          Render server-side; los IDs hash matchean los que rehype-slug
          inyecta abajo en runtime → click de TOC → scroll a sección. */}
      <TableOfContents content={post.content} lang="es" />

      <div className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-amber-400 hover:prose-a:text-amber-300 prose-strong:text-white prose-code:text-amber-300 prose-blockquote:border-amber-500 prose-blockquote:text-gray-300">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]]}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      <footer className="mt-12 pt-8 border-t border-gray-800 space-y-6">
        <div className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-6 border border-amber-500/20">
          <h2 className="text-lg font-bold text-white mb-2">
            ¿Quieres que te avisemos del próximo chollo?
          </h2>
          <p className="text-gray-400 mb-4 text-sm">
            Únete al canal de Telegram y recibe alertas al instante — 100% gratis.
          </p>
          <a
            href="https://t.me/tripcazador_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Suscribirme a Telegram
          </a>
        </div>

        <div>
          <a
            href="/blog"
            className="text-amber-400 hover:text-amber-300 text-sm inline-flex items-center gap-1"
          >
            ← Volver al blog
          </a>
        </div>
        {/* SSS258 (16 may 2026): Switched to NewsletterABWidget. A/B switch:
            A = NewsletterSignup form embed (variante actual, compact)
            B = NewsletterRibbon CTA banner → /alertas
            Hipótesis: ribbon convierte mejor mid-blog. Validar tras N exposures
            via newsletter_signup vs newsletter_ribbon_click event rate. */}
        <div className="mt-8">
          <NewsletterABWidget context={`blog-${params.slug}`} />
        </div>
        {/* SSS276 (17 may 2026): Premium CTA inline antes del footer affiliate.
            Lector con intent claro de viaje + lleva ya scrolled 100% post = ideal
            momento para promover SMS alerts + Deep Search. */}
        <PremiumInlineCTA source={`blog-${params.slug}`} variant="card" />
        {/* KKK4 — Travel insurance affiliate CTA en blog footer. Lector ya
            está en intent de viaje, alta conversion. */}
        <TravelInsuranceCTA variant="compact" />
        {/* abr-2026x: Related posts (top-3 by tag overlap). Mejora dwell
            time + internal linking semántico. */}
        <RelatedPosts slug={params.slug} localePrefix="" />
      </footer>
    </article>
  );
}
