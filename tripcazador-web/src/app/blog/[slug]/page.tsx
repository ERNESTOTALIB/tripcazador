import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import { getAllPostSlugs, getPostBySlug } from "@/lib/blog";

type Params = { slug: string };

// Cualquier slug fuera de generateStaticParams devuelve 404 automáticamente
// (sin entrar al componente), asegurando que Next responde con status 404.
export const dynamicParams = false;

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

  // JSON-LD Article structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "TripCazador",
      logo: {
        "@type": "ImageObject",
        url: "https://tripcazador.com/android-chrome-512x512.png",
      },
    },
    image: post.heroImage || "https://tripcazador.com/og-default.png",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://tripcazador.com/blog/${post.slug}`,
    },
    keywords: post.tags.join(", "),
  };

  return (
    <article className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.heroImage}
          alt={post.title}
          className="w-full rounded-2xl mb-8 aspect-[16/9] object-cover"
        />
      )}

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
      </footer>
    </article>
  );
}
