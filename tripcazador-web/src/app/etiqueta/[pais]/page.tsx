/**
 * /etiqueta/[pais] — SSS486 (24 may 2026)
 *
 * 10 landings cultural etiquette por país (Japón, EAU, Marruecos,
 * India, Tailandia, USA, UK, China, México, Argentina).
 *
 * High-value content para evitar gaffes culturales típicas de
 * viajeros españoles. Captura long-tail "propinas en X", "qué no
 * hacer en X", "vestuario X".
 *
 * Cross-links a /destinos/[slug] + /preparar-viaje/[slug] cuando aplica.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ETIQUETA_CATALOG,
  ETIQUETA_SLUGS,
  getEtiqueta,
} from "@/lib/etiqueta_catalog";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema_helpers";
import { DESTINO_SLUGS } from "@/lib/destinos_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ pais: string }> {
  return ETIQUETA_SLUGS.map((pais) => ({ pais }));
}

export async function generateMetadata({
  params,
}: {
  params: { pais: string };
}): Promise<Metadata> {
  const e = getEtiqueta(params.pais);
  if (!e) return { title: "Guía de etiqueta no encontrada | TripCazador" };
  const title = `Etiqueta cultural en ${e.country}: propinas, saludos, tabúes | TripCazador`;
  const description = `${e.oneLiner} Guía completa: saludo, propinas (${e.propinas.slice(0, 50)}…), vestuario, tabúes y gestos para no quedar mal.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/etiqueta/${e.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/etiqueta/${e.slug}`,
      type: "article",
    },
  };
}

export default function EtiquetaPage({ params }: { params: { pais: string } }) {
  const e = getEtiqueta(params.pais);
  if (!e) notFound();

  const others = ETIQUETA_CATALOG.filter((x) => x.slug !== e.slug).slice(0, 4);
  const hasDestino = e.destinoSlug && DESTINO_SLUGS.includes(e.destinoSlug);

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Etiqueta cultural", url: "/etiqueta" },
    { name: e.country, url: `/etiqueta/${e.slug}` },
  ]);

  const faqJsonLd = faqPageSchema([
    { q: `¿Cuánto se da de propina en ${e.country}?`, a: e.propinas },
    { q: `¿Cómo se saluda en ${e.country}?`, a: e.saludo },
    { q: `¿Qué cosas no se deben hacer en ${e.country}?`, a: e.tabues.join(". ") },
    { q: `¿Cómo vestirse en ${e.country}?`, a: e.vestuario },
  ]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/etiqueta" className="hover:text-amber-400">Etiqueta cultural</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{e.country}</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">{e.emoji}</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Etiqueta cultural en {e.country}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">{e.oneLiner}</p>
      </header>

      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-white">
            👋 Saludo
          </h2>
          <p className="text-sm text-slate-300">{e.saludo}</p>
        </section>

        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-emerald-300">
            💰 Propinas
          </h2>
          <p className="text-sm text-slate-300">{e.propinas}</p>
        </section>

        <section className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-purple-300">
            👔 Vestuario
          </h2>
          <p className="text-sm text-slate-300">{e.vestuario}</p>
        </section>

        <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-red-300">
            🚫 Tabúes — qué NO hacer
          </h2>
          <ul className="space-y-2">
            {e.tabues.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-red-400">×</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-emerald-300">
              ✅ Sí hacer
            </h3>
            <ul className="space-y-2">
              {e.gestos.do.map((g, i) => (
                <li key={i} className="text-sm text-slate-300">
                  • {g}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-amber-300">
              ⚠️ Evitar
            </h3>
            <ul className="space-y-2">
              {e.gestos.dont.map((g, i) => (
                <li key={i} className="text-sm text-slate-300">
                  • {g}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-white">
            🍽️ Comida y bebida
          </h2>
          <p className="text-sm text-slate-300">{e.comida}</p>
        </section>

        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-amber-300">
            💡 Curiosidad útil
          </h2>
          <p className="text-sm text-slate-300">{e.curiosidad}</p>
        </section>
      </div>

      {hasDestino && (
        <section className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h3 className="text-sm font-bold text-white">¿Vuelas a {e.country}?</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/destinos/${e.destinoSlug}`}
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              Ver vuelos a {e.country} →
            </Link>
            <Link
              href={`/preparar-viaje/${e.destinoSlug}`}
              className="rounded-lg border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/10"
            >
              Checklist viaje
            </Link>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Otras culturas
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`/etiqueta/${o.slug}`}
              className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-sm text-slate-200 transition-colors hover:border-amber-500/50"
            >
              {o.emoji} {o.country}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
