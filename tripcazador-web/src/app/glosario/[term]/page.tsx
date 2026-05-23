/**
 * /glosario/[term] — SSS422 (23 may 2026)
 *
 * Landing dedicada por término de viaje. Long-form content (1-3
 * párrafos) + ejemplo + tips + cross-links. Complementa hub /glosario
 * (51 definiciones cortas existentes) con 15 guías ampliadas.
 *
 * SEO: high-intent queries info ("que es error fare", "diferencia
 * layover stopover", "como funciona open jaw vuelo"). FAQ + Breadcrumb
 * + DefinedTerm JSON-LD.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  GLOSARIO_CATALOG,
  GLOSARIO_SLUGS,
  getGlosario,
} from "@/lib/glosario_landings";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ term: string }> {
  return GLOSARIO_SLUGS.map((term) => ({ term }));
}

export async function generateMetadata({
  params,
}: {
  params: { term: string };
}): Promise<Metadata> {
  const entry = getGlosario(params.term);
  if (!entry) return { title: "Término no encontrado | TripCazador" };
  const title = `${entry.term}: definición y ejemplos | Glosario TripCazador`;
  return {
    title,
    description: entry.shortDef,
    alternates: { canonical: `${SITE_URL}/glosario/${entry.slug}` },
    openGraph: {
      title,
      description: entry.shortDef,
      url: `${SITE_URL}/glosario/${entry.slug}`,
      type: "article",
      images: [
        {
          url: `${SITE_URL}/api/og?title=${encodeURIComponent(entry.term)}&subtitle=${encodeURIComponent("Glosario TripCazador")}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

export default function GlosarioTermPage({ params }: { params: { term: string } }) {
  const entry = getGlosario(params.term);
  if (!entry) notFound();

  const related = (entry.relatedTerms ?? [])
    .map((slug) => GLOSARIO_CATALOG.find((e) => e.slug === slug))
    .filter((e): e is NonNullable<typeof e> => e !== undefined);

  // DefinedTerm + Breadcrumb + FAQ JSON-LD
  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": `${SITE_URL}/glosario/${entry.slug}`,
    name: entry.term,
    alternateName: entry.englishEquivalent ? [entry.englishEquivalent] : [],
    description: entry.shortDef,
    inDefinedTermSet: `${SITE_URL}/glosario`,
    termCode: entry.slug,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Glosario", item: `${SITE_URL}/glosario` },
      { "@type": "ListItem", position: 3, name: entry.term, item: `${SITE_URL}/glosario/${entry.slug}` },
    ],
  };

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/glosario" className="hover:text-amber-400">Glosario</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{entry.term}</span>
      </nav>

      <header className="mb-8">
        <div className="mb-3 text-5xl">{entry.emoji}</div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{entry.term}</h1>
        {entry.englishEquivalent && (
          <p className="mt-2 text-sm italic text-slate-400">
            En inglés: <span className="font-mono">{entry.englishEquivalent}</span>
          </p>
        )}
        <p className="mt-4 rounded-xl border-l-4 border-amber-500 bg-slate-800/40 p-4 text-lg text-slate-100">
          {entry.shortDef}
        </p>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold text-white">Definición ampliada</h2>
        <p className="leading-relaxed text-slate-300">{entry.longDef}</p>
      </section>

      {entry.example && (
        <section className="mb-8 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <h2 className="mb-2 text-lg font-bold text-emerald-300">Ejemplo</h2>
          <p className="text-slate-200">{entry.example}</p>
        </section>
      )}

      {entry.tips && entry.tips.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold text-white">💡 Tips cazador</h2>
          <ul className="space-y-2">
            {entry.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-300">
                <span className="mt-1 text-amber-400">→</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {entry.relatedLinks.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold text-white">Recursos relacionados</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {entry.relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 transition-colors hover:border-amber-500/50"
              >
                <div className="text-sm font-semibold text-white">{link.label}</div>
                <div className="mt-1 text-xs text-amber-400">Ver →</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold text-white">Términos relacionados</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/glosario/${r.slug}`}
                className="rounded-full border border-slate-700 bg-slate-900/60 px-4 py-1 text-sm text-slate-200 transition-colors hover:border-amber-500/50 hover:text-amber-300"
              >
                {r.emoji} {r.term}
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-10 border-t border-slate-800 pt-4 text-xs text-slate-500">
        Categoría: {entry.category}. ¿Falta un matiz? Sugiere en{" "}
        <a
          href="https://t.me/tripcazador_bot"
          className="text-amber-400 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Telegram
        </a>
        .
      </footer>
    </main>
  );
}
