/**
 * /podcast — SSS472 (24 may 2026)
 *
 * Landing podcast TripCazador (coming soon). Captura email para
 * notificar al lanzamiento + cross-link a recursos audio existentes.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Podcast TripCazador (próximamente) | TripCazador",
  description:
    "Próximamente: el podcast TripCazador. Entrevistas con cazadores de chollos, casos reales de ahorro y análisis tendencias aviación. Apúntate para notificación.",
  alternates: { canonical: `${SITE_URL}/podcast` },
  openGraph: {
    title: "Podcast TripCazador",
    description: "Próximamente — entrevistas y análisis del mundo de los chollos.",
    url: `${SITE_URL}/podcast`,
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const PLANNED_EPISODES = [
  {
    title: "Cómo cacé un Madrid-Tokio Business por €450",
    description: "Caso real: Ernesto cuenta el error fare TAP Portugal de octubre 2024 que hizo que 8 viajeros pillaran Business 200€ menos que turista normal.",
    duration: "32 min",
  },
  {
    title: "Iberia vs LATAM: la guerra silenciosa por Madrid-Buenos Aires",
    description: "Análisis del duopolio en la ruta más rentable de Iberia. ¿Por qué Iberia no baja precios y LATAM no lanza más frecuencias?",
    duration: "28 min",
  },
  {
    title: "El día que Ryanair cerró 800 rutas: anatomía de un huelga",
    description: "Cómo planificar viajes con aerolíneas low-cost cuando hay turbulencias laborales.",
    duration: "24 min",
  },
  {
    title: "Concierge vs Skyscanner: cuándo merece la pena pagar a un humano",
    description: "Análisis de 50 búsquedas reales: cuándo el Concierge encuentra opciones mejores que cualquier metasearch.",
    duration: "35 min",
  },
];

export default function PodcastPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Podcast", url: "/podcast" },
  ]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Podcast</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🎙️</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Podcast TripCazador
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Próximamente: entrevistas con cazadores de chollos, anatomía de
          error fares reales, y análisis del estado de la aviación europea.
        </p>
        <span className="mt-4 inline-block rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
          🚧 Coming soon Q3 2026
        </span>
      </header>

      <section className="mb-10 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Episodios previstos</h2>
        <ol className="space-y-4">
          {PLANNED_EPISODES.map((ep, i) => (
            <li
              key={i}
              className="rounded-lg border border-slate-700 bg-slate-900/40 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-bold text-white">
                  Ep {i + 1}. {ep.title}
                </h3>
                <span className="rounded-full border border-slate-600 bg-slate-900 px-2 py-0.5 text-xs text-slate-400">
                  ~{ep.duration}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{ep.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-10 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-center">
        <h2 className="text-base font-bold text-white">📬 Apúntate para el lanzamiento</h2>
        <p className="mt-2 text-sm text-slate-300">
          Te avisamos cuando esté el primer episodio. Mismo email que la
          newsletter — no spam, no compartido.
        </p>
        <Link
          href="/?subscribe=podcast"
          className="mt-3 inline-block rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-400"
        >
          Suscríbete a newsletter →
        </Link>
      </section>

      <section className="mb-10 grid gap-3 sm:grid-cols-3">
        <Link href="/blog" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50">
          <div className="text-2xl">📝</div>
          <div className="mt-1 text-sm font-bold text-white">Blog</div>
          <div className="text-xs text-slate-400">Mientras tanto, lee</div>
        </Link>
        <a href="https://t.me/tripcazador_bot" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50">
          <div className="text-2xl">💬</div>
          <div className="mt-1 text-sm font-bold text-white">Telegram</div>
          <div className="text-xs text-slate-400">Comunidad live</div>
        </a>
        <Link href="/feed.json" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50">
          <div className="text-2xl">📡</div>
          <div className="mt-1 text-sm font-bold text-white">JSON Feed</div>
          <div className="text-xs text-slate-400">Para tu aggregator</div>
        </Link>
      </section>

      <footer className="text-center text-xs text-slate-500">
        ¿Quieres ser entrevistado o sugerir un episodio? Escríbenos a{" "}
        <a href="mailto:podcast@tripcazador.com" className="text-amber-400 hover:underline">
          podcast@tripcazador.com
        </a>
      </footer>
    </main>
  );
}
