/**
 * /duty-free/[iata] — NEXT batch (26 may 2026)
 * 10 landings honest sobre duty-free por aeropuerto ES.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  DUTY_FREE,
  getDutyFreeByIata,
} from "@/lib/duty_free_catalog";
import {
  breadcrumbSchema,
  faqPageSchema,
  articleSchema,
} from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ iata: string }> {
  return DUTY_FREE.map((d) => ({ iata: d.iata.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: { iata: string };
}): Promise<Metadata> {
  const d = getDutyFreeByIata(params.iata);
  if (!d) return { title: "Aeropuerto no encontrado" };
  const title = `Duty-free ${d.ciudad} (${d.iata}): análisis honest 2026`;
  const description = `Guía honest duty-free ${d.iata}: ${d.categorias.length} categorías analizadas (alcohol, perfumes, tabaco, productos locales). Ahorros reales vs ciudad.`.slice(0, 170);
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/duty-free/${params.iata.toLowerCase()}` },
    openGraph: { title, description, url: `${SITE_URL}/duty-free/${params.iata.toLowerCase()}`, type: "article" },
  };
}

export default function DutyFreePage({
  params,
}: {
  params: { iata: string };
}) {
  const d = getDutyFreeByIata(params.iata);
  if (!d) notFound();

  const others = DUTY_FREE.filter((o) => o.iata !== d.iata).slice(0, 5);

  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Duty-free", url: "/duty-free" },
    { name: `${d.iata} ${d.ciudad}`, url: `/duty-free/${d.iata.toLowerCase()}` },
  ]);

  const faqLd = faqPageSchema([
    {
      q: `¿Merece la pena comprar duty-free en ${d.iata}?`,
      a: `Depende del producto. Alcohol premium, perfumería y productos locales únicos: SÍ ahorro real 15-30%. Chocolate, alimentación básica, tabaco intra-EU: NO suele compensar.`,
    },
    {
      q: `¿Cuál es el límite de aduana volviendo a España desde ${d.iata}?`,
      a: `Vuelo intra-EU (España continental, no Canarias): ${d.limitesAduana.intraEU} · Vuelo extra-EU: ${d.limitesAduana.extraEU}`,
    },
    {
      q: `¿Qué producto vale la pena en ${d.iata}?`,
      a: d.categorias[0] ? `${d.categorias[0].category}: ${d.categorias[0].vaLaPena}` : "Productos locales únicos son el mejor pick general.",
    },
    {
      q: `¿Puedo pagar duty-free con tarjeta?`,
      a: "Sí, todas las tiendas duty-free aceptan Visa, Mastercard y Amex. Algunas también acceptan pagos contactless móvil (Apple Pay, Google Pay).",
    },
    {
      q: `¿Hay precios online para comparar antes?`,
      a: "Sí. App AENA Travel o Dufry Reserve & Collect te permiten reservar online (a veces con descuento) y recoger en puerta de embarque. Útil para evitar colas.",
    },
  ]);

  const articleLd = articleSchema({
    headline: `Duty free aeropuerto ${d.iata} ${d.ciudad}`,
    description: `Análisis ${d.categorias.length} categorías duty-free con ahorros reales`,
    url: `${SITE_URL}/duty-free/${d.iata.toLowerCase()}`,
    datePublished: d.lastUpdated,
    articleSection: "Duty-free aeropuerto",
    imageUrl: `${SITE_URL}/api/og?title=${encodeURIComponent(`Duty-free ${d.iata}`)}`,
  });

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/duty-free" className="hover:text-amber-400">Duty-free</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{d.iata} {d.ciudad}</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🛍️✈️</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Duty-free aeropuerto {d.iata} {d.ciudad}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          ¿Merece la pena? Análisis honest por {d.categorias.length} categorías
          con ahorro real vs precio en ciudad. Actualizado {d.lastUpdated}.
        </p>
      </header>

      <section className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/40 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Marcas presentes</h2>
        <div className="flex flex-wrap gap-2">
          {d.marcas.map((m, i) => (
            <span key={i} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">{m}</span>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold text-white">Análisis por categoría</h2>
        <div className="space-y-4">
          {d.categorias.map((c, i) => (
            <article key={i} className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-white">{c.category}</h3>
                <span className="shrink-0 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                  {c.ahorroPct}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Ejemplos: {c.exampleItems.join(", ")}
              </p>
              <p className="mt-3 text-sm text-slate-200">
                <strong className="text-amber-300">Veredicto:</strong> {c.vaLaPena}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6">
        <h2 className="text-lg font-bold text-indigo-300 mb-3">📋 Límites de aduana</h2>
        <div className="space-y-3 text-sm text-slate-200">
          <div>
            <strong className="text-white">Vuelo intra-EU (a España continental):</strong>
            <p className="mt-1 text-slate-300">{d.limitesAduana.intraEU}</p>
          </div>
          <div>
            <strong className="text-white">Vuelo extra-EU:</strong>
            <p className="mt-1 text-slate-300">{d.limitesAduana.extraEU}</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-white">💡 Tips locales</h2>
        <ul className="space-y-2">
          {d.tips.map((t, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
              <span className="text-amber-400">→</span>
              <span className="text-sm text-slate-200">{t}</span>
            </li>
          ))}
        </ul>
      </section>

      {d.trampas.length > 0 && (
        <section className="mb-8 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
          <h2 className="mb-3 text-lg font-bold text-rose-300">⚠️ Trampas a evitar</h2>
          <ul className="space-y-2">
            {d.trampas.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-200">
                <span className="text-rose-400">✕</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/40 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Relacionado {d.iata}</h2>
        <div className="flex flex-wrap gap-2">
          <Link href={`/aeropuertos/${d.iata.toLowerCase()}`} className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40">
            ✈️ Aeropuerto {d.iata}
          </Link>
          <Link href={`/lounge-aeropuerto/${d.iata.toLowerCase()}`} className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40">
            🛋️ Salas VIP
          </Link>
          <Link href={`/parking-aeropuerto/${d.iata.toLowerCase()}`} className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40">
            🅿️ Parking
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Duty-free otros aeropuertos</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {others.map((o) => (
            <Link key={o.iata} href={`/duty-free/${o.iata.toLowerCase()}`} className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-sm text-slate-200 transition-colors hover:border-amber-500/50">
              {o.iata} {o.ciudad}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
