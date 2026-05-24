/**
 * /dinero-en — Hub dinero por país. SUPERSESSION (24 may 2026)
 */
import type { Metadata } from "next";
import Link from "next/link";
import { DINERO_CATALOG } from "@/lib/dinero_catalog";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Dinero en el extranjero: guía por país",
  description: `Guía dinero en ${DINERO_CATALOG.length} países: cuánto efectivo, dónde cambiar, propinas, tarjetas y errores típicos.`,
  alternates: { canonical: `${SITE_URL}/dinero-en` },
  openGraph: {
    title: "Dinero en el extranjero: guía por país",
    description: "Cuánto, dónde, cómo. Errores típicos del viajero español.",
    url: `${SITE_URL}/dinero-en`,
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function DineroHubPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Dinero por país", url: "/dinero-en" },
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
        <span className="text-slate-200">Dinero por país</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">💰</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Dinero en el extranjero
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Guía práctica del dinero en {DINERO_CATALOG.length} países: cuánto sacar,
          dónde cambiar, propinas obligatorias, tarjetas aceptadas y errores típicos.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {DINERO_CATALOG.map((d) => (
          <Link
            key={d.slug}
            href={`/dinero-en/${d.slug}`}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 transition-colors hover:border-amber-500/50"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{d.emoji}</span>
              <div>
                <h2 className="text-base font-bold text-white">{d.pais}</h2>
                <p className="text-xs text-amber-300">{d.moneda}</p>
                <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                  Tarjetas: {d.tarjetasAceptadas}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-2">
        <Link href="/tarjetas-viaje" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">💳</div>
          <div className="mt-1 text-sm font-bold text-white">Tarjetas viaje</div>
          <div className="text-xs text-slate-400">Comparativa 0% comisión</div>
        </Link>
        <Link href="/divisas/usd" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">💱</div>
          <div className="mt-1 text-sm font-bold text-white">Divisas por código</div>
          <div className="text-xs text-slate-400">USD, GBP, JPY, EUR…</div>
        </Link>
      </section>
    </main>
  );
}
