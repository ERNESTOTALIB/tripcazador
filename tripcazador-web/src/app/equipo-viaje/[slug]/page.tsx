/**
 * /equipo-viaje/[slug] — SUPER-SPONSORS (25 may 2026)
 *
 * Landing programmatic individual por categoría producto. 12 landings
 * con detalle: criterios, picks 3 tiers, guía compra, FAQ.
 * Amazon Associates ready via buildAmazonSearchLink().
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  EQUIPO_VIAJE,
  getEquipoBySlug,
} from "@/lib/equipo_viaje_catalog";
import {
  buildAmazonSearchLink,
  isAmazonAffiliateConfigured,
} from "@/lib/amazon_affiliate";
import { breadcrumbSchema, faqPageSchema, articleSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ slug: string }> {
  return EQUIPO_VIAJE.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const p = getEquipoBySlug(params.slug);
  if (!p) return { title: "Producto no encontrado" };
  return {
    title: p.seoTitle,
    description: p.seoDescription,
    alternates: { canonical: `${SITE_URL}/equipo-viaje/${p.slug}` },
    openGraph: {
      title: p.seoTitle,
      description: p.seoDescription,
      url: `${SITE_URL}/equipo-viaje/${p.slug}`,
      type: "article",
    },
  };
}

export default function EquipoViajeDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const p = getEquipoBySlug(params.slug);
  if (!p) notFound();

  const others = EQUIPO_VIAJE.filter((o) => o.slug !== p.slug).slice(0, 5);

  const amazonLink = buildAmazonSearchLink(p.amazonQuery);
  const affConfigured = isAmazonAffiliateConfigured();

  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Equipo viaje", url: "/equipo-viaje" },
    { name: p.name, url: `/equipo-viaje/${p.slug}` },
  ]);
  const faqLd = faqPageSchema(p.faqs);
  const articleLd = articleSchema({
    headline: p.seoTitle,
    description: p.seoDescription,
    url: `${SITE_URL}/equipo-viaje/${p.slug}`,
    datePublished: p.lastUpdated,
    articleSection: "Equipo viaje",
    imageUrl: `${SITE_URL}/api/og?title=${encodeURIComponent(p.name)}`,
  });

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/equipo-viaje" className="hover:text-amber-400">Equipo viaje</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{p.name}</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">{p.emoji}</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{p.name}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">{p.seoDescription}</p>
        <p className="mt-2 text-xs text-slate-500">
          Actualizado: {p.lastUpdated} · {affConfigured ? "Links contienen tag afiliado Amazon — ayudas a TripCazador sin coste extra." : "Links sin afiliado todavía."}
        </p>
      </header>

      {/* Criterios */}
      <section className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="mb-3 text-lg font-bold text-amber-300">⚙️ Criterios técnicos</h2>
        <ul className="space-y-2">
          {p.criterios.map((c, i) => (
            <li key={i} className="text-sm text-slate-300 flex gap-2">
              <span className="text-amber-400">•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Picks 3 tiers */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-white">Picks por presupuesto</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(["presupuesto", "medio", "premium"] as const).map((tier) => {
            const pick = p.picks[tier];
            return (
              <div
                key={tier}
                className="rounded-xl border border-slate-700 bg-slate-900/40 p-4"
              >
                <div className="text-xs uppercase tracking-wider text-slate-500">
                  {pick.label}
                </div>
                <div className="mt-1 text-2xl font-bold text-amber-300">
                  {pick.rangeEur}
                </div>
                <p className="mt-2 text-xs text-slate-400">{pick.example}</p>
              </div>
            );
          })}
        </div>
        <a
          href={amazonLink}
          target="_blank"
          rel="nofollow noopener sponsored"
          className="mt-4 block text-center rounded-lg bg-amber-500 hover:bg-amber-400 px-5 py-3 text-black font-bold text-sm"
        >
          Ver opciones en Amazon →
        </a>
        <p className="mt-2 text-xs text-slate-500 text-center">
          {affConfigured
            ? "Compras desde este link apoyan TripCazador (3-7% comisión). Sin coste extra para ti."
            : "Link sin código afiliado activo. Compra disponible normal."}
        </p>
      </section>

      {/* Guía compra */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-white">📋 Guía de compra</h2>
        <ol className="space-y-3">
          {p.guia.map((g, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-300">
                {i + 1}
              </span>
              <span className="text-sm text-slate-200">{g}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-white">❓ Preguntas frecuentes</h2>
        <div className="space-y-3">
          {p.faqs.map((f, i) => (
            <details
              key={i}
              className="rounded-xl border border-slate-700 bg-slate-900/40 p-4"
            >
              <summary className="cursor-pointer font-semibold text-white text-sm">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Related verticals */}
      {p.related && p.related.length > 0 && (
        <section className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/40 p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Relacionado en TripCazador
          </h2>
          <div className="flex flex-wrap gap-2">
            {p.related.map((slug) => (
              <Link
                key={slug}
                href={`/${slug}`}
                className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40"
              >
                /{slug}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Otros */}
      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Otras categorías
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`/equipo-viaje/${o.slug}`}
              className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-sm text-slate-200 transition-colors hover:border-amber-500/50"
            >
              {o.emoji} {o.name}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
