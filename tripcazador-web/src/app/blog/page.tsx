import type { Metadata } from "next";
import Image from "next/image";
import { getAllPosts } from "@/lib/blog";

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

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <a href="/" className="hover:text-white">
            Inicio
          </a>
          <span>/</span>
          <span className="text-white">Blog</span>
        </div>
        <h1 className="text-4xl font-bold text-white">Blog TripCazador</h1>
        <p className="text-gray-400 max-w-2xl text-lg">
          Guías en profundidad, estrategias que funcionan y análisis de destinos. Todo lo que hemos aprendido monitorizando tarifas 24/7 desde Basel, Zúrich, Frankfurt, Múnich, París y Ámsterdam.
        </p>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{posts.length} artículos publicados</span>
          <span className="text-gray-700">·</span>
          <a href="/rss.xml" className="hover:text-amber-400 transition-colors">
            Suscríbete por RSS
          </a>
        </div>
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
