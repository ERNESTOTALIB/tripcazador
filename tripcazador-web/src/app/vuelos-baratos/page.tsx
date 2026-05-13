/**
 * /vuelos-baratos — índice meses (SSS153, may 2026)
 *
 * Antes era 404; las páginas /vuelos-baratos/[mes] (12 meses) existían pero
 * faltaba el índice. Esto cierra el cluster SEO mensual y permite que el
 * breadcrumb desde un mes específico vuelva al hub.
 *
 * Server Component puro (anti-SSS143 regression).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { MONTHS } from "@/lib/months";
import { JsonLd } from "@/components/JsonLd";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Vuelos baratos mes a mes (2026) — TripCazador",
  description:
    "Guía de los meses más baratos para volar a cada destino. Enero a diciembre con sweet spots, evitar y consejos por temporada.",
  alternates: { canonical: "/vuelos-baratos" },
};

export const revalidate = 86400;

export default function VuelosBaratosIndex() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE },
      { "@type": "ListItem", position: 2, name: "Vuelos baratos por mes", item: `${SITE}/vuelos-baratos` },
    ],
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd data={breadcrumb} />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-amber-600">Inicio</Link>
        <span className="mx-2">›</span>
        <span className="text-slate-700">Vuelos baratos por mes</span>
      </nav>

      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          📅 Vuelos baratos mes a mes — 2026
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Cada mes tiene sus destinos imbatibles. Esta guía revela cuáles son
          los chollos de cada mes y qué evitar para no pagar de más.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {MONTHS.map((m) => (
          <Link
            key={m.slug}
            href={`/vuelos-baratos/${m.slug}`}
            className="rounded-lg border border-slate-200 bg-white p-4 text-center transition hover:border-amber-400 hover:bg-amber-50"
          >
            <div className="text-2xl">{m.emoji}</div>
            <div className="mt-2 font-semibold text-slate-900">{m.monthEs}</div>
            <div className="mt-1 text-xs text-slate-500">{m.topDestinations.length} destinos</div>
          </Link>
        ))}
      </section>

      <section className="mt-12 rounded-xl border bg-slate-50 p-6">
        <h2 className="text-xl font-bold text-slate-900">Relacionado</h2>
        <ul className="mt-4 space-y-2 text-amber-700">
          <li><Link className="underline hover:text-amber-900" href="/cuando-viajar">Cuándo viajar a cada destino</Link></li>
          <li><Link className="underline hover:text-amber-900" href="/vuelos">Vuelos por ruta (95 destinos)</Link></li>
          <li><Link className="underline hover:text-amber-900" href="/deals">Chollos activos hoy</Link></li>
          <li><Link className="underline hover:text-amber-900" href="/calculadora">Calculadoras de viaje</Link></li>
        </ul>
      </section>
    </main>
  );
}
