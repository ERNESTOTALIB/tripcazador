/**
 * /codigos-promo — Hub. SUPER-1D (24 may 2026)
 */
import type { Metadata } from "next";
import Link from "next/link";
import { PROMO_CODES_CATALOG } from "@/lib/promo_codes_catalog";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Códigos descuento aerolíneas: guía honesta 2026",
  description: `Códigos descuento de ${PROMO_CODES_CATALOG.length} aerolíneas: cuándo, dónde buscar, restricciones reales y si merece la pena.`,
  alternates: { canonical: `${SITE_URL}/codigos-promo` },
  openGraph: {
    title: "Códigos descuento aerolíneas 2026",
    description: "Guía honesta — no listamos códigos activos.",
    url: `${SITE_URL}/codigos-promo`,
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function CodigosPromoHubPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Códigos promo", url: "/codigos-promo" },
  ]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Códigos promo</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🏷️</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Códigos descuento aerolíneas
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400 italic">
          NO listamos códigos activos (cambian semana a semana, se queman rápido,
          y publicarlos viola los T&C). En su lugar: dónde buscar, cuándo salen,
          patrón típico y si merece la pena cada caso.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {PROMO_CODES_CATALOG.map((p) => (
          <Link
            key={p.slug}
            href={`/codigos-promo/${p.slug}`}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 transition-colors hover:border-amber-500/50"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{p.emoji}</span>
              <div>
                <h2 className="text-base font-bold text-white">{p.name}</h2>
                <p className="text-xs text-amber-300">{p.iata}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-amber-500/5 p-6 text-center">
        <h2 className="text-xl font-bold text-white">🎯 Alternativa mejor: error fares</h2>
        <p className="mt-2 max-w-xl mx-auto text-sm text-slate-300">
          Promo codes: 10-25% off. Error fares: 70-95% off. Premium TripCazador
          €9.99/mes detecta error fares 24/7.
        </p>
        <Link
          href="/error-fares"
          className="mt-5 inline-block rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400"
        >
          Ver error fares →
        </Link>
      </section>
    </main>
  );
}
