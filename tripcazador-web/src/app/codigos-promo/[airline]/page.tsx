/**
 * /codigos-promo/[airline] — SUPER-1D (24 may 2026)
 *
 * 8 landings SEO programmatic: cuándo salen, dónde buscar, patrón típico,
 * restricciones, consejo. NO listamos códigos activos (T&C aerolíneas).
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  PROMO_CODES_CATALOG,
  PROMO_CODES_SLUGS,
  getPromoCodeInfo,
} from "@/lib/promo_codes_catalog";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ airline: string }> {
  return PROMO_CODES_SLUGS.map((airline) => ({ airline }));
}

export async function generateMetadata({
  params,
}: {
  params: { airline: string };
}): Promise<Metadata> {
  const p = getPromoCodeInfo(params.airline);
  if (!p) return { title: "Códigos promo no encontrados" };
  const title = `Códigos descuento ${p.name}: cuándo, dónde, cómo 2026`;
  const description = `Guía honesta de códigos promo ${p.name}: cuándo salen, dónde buscarlos, patrón típico, restricciones y mejor consejo (a veces no merece la pena).`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/codigos-promo/${p.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/codigos-promo/${p.slug}`,
      type: "article",
    },
  };
}

export default function CodigosPromoPage({
  params,
}: {
  params: { airline: string };
}) {
  const p = getPromoCodeInfo(params.airline);
  if (!p) notFound();

  const others = PROMO_CODES_CATALOG.filter((x) => x.slug !== p.slug).slice(0, 4);

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Códigos promo", url: "/codigos-promo" },
    { name: p.name, url: `/codigos-promo/${p.slug}` },
  ]);

  const faqJsonLd = faqPageSchema([
    {
      q: `¿Cuándo salen códigos descuento de ${p.name}?`,
      a: p.cuandoSalen,
    },
    {
      q: `¿Dónde encontrar códigos activos de ${p.name}?`,
      a: p.donde,
    },
    {
      q: `¿Qué restricciones tienen los códigos de ${p.name}?`,
      a: p.restriccionesTipo.join(". "),
    },
    {
      q: `¿Los códigos promo de ${p.name} merecen la pena?`,
      a: p.consejo,
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
        <Link href="/codigos-promo" className="hover:text-amber-400">Códigos promo</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{p.name}</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">{p.emoji}</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Códigos descuento {p.name}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 italic">
          NO listamos códigos activos (cambian semanalmente). Aquí encontrarás dónde,
          cuándo, cómo y si merece la pena.
        </p>
      </header>

      <div className="space-y-5">
        <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <h2 className="mb-3 text-xl font-bold text-amber-300">📅 Cuándo salen</h2>
          <p className="text-sm text-slate-300">{p.cuandoSalen}</p>
        </section>

        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <h2 className="mb-3 text-xl font-bold text-emerald-300">🔍 Dónde buscar</h2>
          <p className="text-sm text-slate-300">{p.donde}</p>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
          <h2 className="mb-3 text-xl font-bold text-white">🏷️ Patrón típico</h2>
          <p className="text-sm text-slate-300">{p.patron}</p>
        </section>

        <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
          <h2 className="mb-3 text-xl font-bold text-red-300">⚠️ Restricciones típicas</h2>
          <ul className="space-y-2">
            {p.restriccionesTipo.map((r, i) => (
              <li key={i} className="text-sm text-slate-300">
                • {r}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs italic text-slate-400">
            <strong className="text-red-300">Combinabilidad:</strong> {p.combinable}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
          <h2 className="mb-3 text-xl font-bold text-white">📋 Ejemplos históricos</h2>
          <p className="text-sm text-slate-300">{p.ejemplos}</p>
        </section>

        <section className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-amber-500/5 p-6">
          <h2 className="mb-3 text-xl font-bold text-amber-300">💡 Mejor consejo</h2>
          <p className="text-sm text-slate-300">{p.consejo}</p>
        </section>
      </div>

      <section className="mt-10 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-amber-500/5 p-6 text-center">
        <h2 className="text-xl font-bold text-white">🎯 Alternativa más fiable: error fares</h2>
        <p className="mt-2 max-w-xl mx-auto text-sm text-slate-300">
          Códigos promo dan 10-25% off. Error fares dan 70-95% off. TripCazador
          rastrea 24/7 — Premium €9.99/mes incluye alertas instant.
        </p>
        <Link
          href="/error-fares"
          className="mt-5 inline-block rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
        >
          Ver guía error fares →
        </Link>
      </section>

      <section className="mt-10">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Códigos otras aerolíneas
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`/codigos-promo/${o.slug}`}
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
