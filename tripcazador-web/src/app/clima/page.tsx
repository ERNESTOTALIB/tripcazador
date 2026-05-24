/**
 * /clima — Hub para clima mensual por destino. AUDIT-FULL-2 (24 may 2026)
 */
import type { Metadata } from "next";
import Link from "next/link";
import { CLIMA_CATALOG } from "@/lib/clima_catalog";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Clima por destino: cuándo viajar",
  description: `Tabla climática mes a mes de ${CLIMA_CATALOG.length} destinos top. Temperatura, precipitación, días sol y mejor mes para visitar.`,
  alternates: { canonical: `${SITE_URL}/clima` },
  openGraph: {
    title: "Clima por destino: cuándo viajar",
    description: `Tabla climática mes a mes de ${CLIMA_CATALOG.length} destinos top.`,
    url: `${SITE_URL}/clima`,
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function ClimaIndexPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Clima por destino", url: "/clima" },
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
        <span className="text-slate-200">Clima por destino</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🌤️</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Clima por destino
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Tabla climática mes a mes de {CLIMA_CATALOG.length} destinos. Temperatura,
          precipitación, días de sol y mejor temporada para viajar.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {CLIMA_CATALOG.map((c) => (
          <Link
            key={c.slug}
            href={`/clima/${c.slug}`}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 transition-colors hover:border-amber-500/50"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-white">{c.name}</h2>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">{c.oneLiner}</p>
                <p className="mt-2 text-xs text-emerald-300">
                  Mejor: {c.bestMonths.map((m) => c.months[m - 1].monthName.slice(0, 3)).join(", ")}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
