/**
 * /idiomas/[pais] — SUPERSESSION (24 may 2026)
 *
 * 12 landings SEO programmatic con frases básicas por país en idioma local.
 * Captura long-tail "frases en japonés viajeros", "frases básicas tailandés".
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  IDIOMAS_CATALOG,
  IDIOMAS_SLUGS,
  getIdioma,
} from "@/lib/idiomas_catalog";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema_helpers";
import { DESTINO_SLUGS } from "@/lib/destinos_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ pais: string }> {
  return IDIOMAS_SLUGS.map((pais) => ({ pais }));
}

export async function generateMetadata({
  params,
}: {
  params: { pais: string };
}): Promise<Metadata> {
  const i = getIdioma(params.pais);
  if (!i) return { title: "Idioma no encontrado" };
  const title = `Frases básicas en ${i.idiomaName} para viajar a ${i.pais}`;
  const description = `${i.frases.length} frases esenciales en ${i.idiomaName} con pronunciación. ${i.oneLiner}`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/idiomas/${i.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/idiomas/${i.slug}`,
      type: "article",
    },
  };
}

export default function IdiomaPaisPage({ params }: { params: { pais: string } }) {
  const i = getIdioma(params.pais);
  if (!i) notFound();

  const others = IDIOMAS_CATALOG.filter((x) => x.slug !== i.slug).slice(0, 5);
  const hasDestino = i.destinoSlug && DESTINO_SLUGS.includes(i.destinoSlug);

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Idiomas para viajar", url: "/idiomas" },
    { name: i.pais, url: `/idiomas/${i.slug}` },
  ]);

  const faqJsonLd = faqPageSchema([
    {
      q: `¿Cómo se dice 'hola' en ${i.idiomaName}?`,
      a: `'${i.frases[0].local}' (${i.frases[0].pronuncia || "pronunciado tal cual se lee"}).`,
    },
    {
      q: `¿Cómo se dice 'gracias' en ${i.idiomaName}?`,
      a: `'${i.frases[1].local}' (${i.frases[1].pronuncia || "pronunciado tal cual se lee"}).`,
    },
    {
      q: `¿Cuántas frases necesito aprender mínimo?`,
      a: "Con 5 frases (hola, gracias, sí, no, cuánto cuesta) cubres el 80% de interacciones turísticas básicas. Esta página tiene 12 — empieza por las 5 primeras.",
    },
    {
      q: `¿Vale la pena aprender el idioma local?`,
      a: i.tip,
    },
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
        <Link href="/idiomas" className="hover:text-amber-400">Idiomas</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{i.pais}</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">{i.emoji}</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Frases en {i.idiomaName}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          {i.oneLiner}
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-white">📋 {i.frases.length} frases esenciales</h2>
        <div className="space-y-2">
          {i.frases.map((f, k) => (
            <article
              key={k}
              className="rounded-xl border border-slate-700 bg-slate-800/40 p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="text-sm text-slate-400">{f.es}</div>
                {f.pronuncia && (
                  <div className="text-xs italic text-amber-300">
                    {f.pronuncia}
                  </div>
                )}
              </div>
              <div className="mt-1 text-lg font-bold text-white">{f.local}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="mb-3 text-xl font-bold text-amber-300">💡 Tip cultural</h2>
        <p className="text-sm text-slate-300">{i.tip}</p>
      </section>

      {hasDestino && (
        <section className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h3 className="text-sm font-bold text-white">¿Volando a {i.pais}?</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/destinos/${i.destinoSlug}`}
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              Ver vuelos →
            </Link>
            <Link
              href={`/etiqueta/${i.slug}`}
              className="rounded-lg border border-amber-500/40 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/10"
            >
              Etiqueta cultural
            </Link>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Otros idiomas
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`/idiomas/${o.slug}`}
              className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-sm text-slate-200 transition-colors hover:border-amber-500/50"
            >
              {o.emoji} {o.pais}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
