/**
 * /aerolineas/[code]/rutas — SSS476 (24 may 2026)
 *
 * Listado top rutas desde España por aerolínea. Usa AIRLINES catalog
 * existing (popularRoutesFromSpain) — sin duplicar data.
 *
 * SEO: "rutas iberia desde madrid", "rutas vueling barcelona", etc.
 *
 * Solo se generan para aerolíneas con popularRoutesFromSpain > 0.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { AIRLINES, getAirlineByCode } from "@/lib/airlines";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ code: string }> {
  return AIRLINES.filter((a) => a.popularRoutesFromSpain.length > 0).map((a) => ({
    code: a.code.toLowerCase(),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  const a = getAirlineByCode(params.code.toUpperCase());
  if (!a) return { title: "Aerolínea no encontrada | TripCazador" };
  return {
    title: `Rutas ${a.name} desde España (${a.popularRoutesFromSpain.length}) | TripCazador`,
    description: `Todas las rutas ${a.name} desde España: ${a.popularRoutesFromSpain.length} destinos con precio típico y mínimo observado por el motor. Hubs: ${a.hubs.slice(0, 3).join(", ")}.`,
    alternates: { canonical: `${SITE_URL}/aerolineas/${a.code.toLowerCase()}/rutas` },
    openGraph: {
      title: `Rutas ${a.name} desde España`,
      description: `${a.popularRoutesFromSpain.length} rutas con precios reales.`,
      url: `${SITE_URL}/aerolineas/${a.code.toLowerCase()}/rutas`,
      type: "article",
    },
  };
}

export default function AerolineaRutasPage({
  params,
}: {
  params: { code: string };
}) {
  const a = getAirlineByCode(params.code.toUpperCase());
  if (!a || a.popularRoutesFromSpain.length === 0) notFound();

  const sorted = [...a.popularRoutesFromSpain].sort(
    (x, y) => x.typicalPriceEur - y.typicalPriceEur,
  );

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Aerolíneas", url: "/aerolineas" },
    { name: a.name, url: `/aerolineas/${a.code.toLowerCase()}` },
    { name: "Rutas", url: `/aerolineas/${a.code.toLowerCase()}/rutas` },
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
        <Link href="/aerolineas" className="hover:text-amber-400">Aerolíneas</Link>
        <span className="mx-2">/</span>
        <Link href={`/aerolineas/${a.code.toLowerCase()}`} className="hover:text-amber-400">{a.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Rutas</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Rutas {a.name} desde España
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {a.popularRoutesFromSpain.length} rutas observadas por nuestro motor ·
          Hubs principales: {a.hubs.join(", ")}
        </p>
      </header>

      <section className="mb-6 overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/40">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Ruta</th>
              <th className="px-4 py-3 text-right">Precio típico</th>
              <th className="px-4 py-3 text-right">Mínimo (error fare floor)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.route} className="border-t border-slate-700">
                <td className="px-4 py-3 font-mono text-white">{r.route}</td>
                <td className="px-4 py-3 text-right font-bold text-white">
                  €{r.typicalPriceEur}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300">
                    €{r.minPriceEur}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800/40 p-5 text-sm text-slate-300">
        <h2 className="text-base font-bold text-white">📊 Cómo leer esta tabla</h2>
        <ul className="mt-2 space-y-1">
          <li>• <strong>Precio típico</strong>: mediana observada del motor en últimos 12 meses.</li>
          <li>• <strong>Mínimo (error fare floor)</strong>: precio más bajo registrado (suele ser error fare o flash sale).</li>
          <li>• Los precios cambian rápido — comprueba en{" "}
            <Link href="/deals" className="text-amber-400 hover:underline">/deals</Link>{" "}
            para ver actuales.
          </li>
        </ul>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <Link
          href={`/aerolineas/${a.code.toLowerCase()}`}
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">✈️</div>
          <div className="mt-1 text-sm font-bold text-white">{a.name}</div>
          <div className="text-xs text-slate-400">Análisis completo</div>
        </Link>
        <Link
          href={`/equipaje/${a.code.toLowerCase()}`}
          className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-2xl">🧳</div>
          <div className="mt-1 text-sm font-bold text-white">Equipaje</div>
          <div className="text-xs text-slate-400">Reglas {a.name}</div>
        </Link>
        <Link
          href="/deals"
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-center transition-colors hover:border-amber-500/70"
        >
          <div className="text-2xl">🎯</div>
          <div className="mt-1 text-sm font-bold text-white">Chollos live</div>
          <div className="text-xs text-amber-300">Vuelos ahora</div>
        </Link>
      </section>
    </main>
  );
}
