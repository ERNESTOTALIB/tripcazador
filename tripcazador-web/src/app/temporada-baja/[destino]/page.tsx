/**
 * /temporada-baja/[destino] — SSS463 (24 may 2026)
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  TEMPORADA_BAJA_CATALOG,
  TEMPORADA_BAJA_SLUGS,
  getTemporadaBaja,
} from "@/lib/temporada_baja_catalog";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ destino: string }> {
  return TEMPORADA_BAJA_SLUGS.map((destino) => ({ destino }));
}

export async function generateMetadata({
  params,
}: {
  params: { destino: string };
}): Promise<Metadata> {
  const t = getTemporadaBaja(params.destino);
  if (!t) return { title: "Destino no encontrado" };
  return {
    title: `Temporada baja ${t.destino}: ${t.cheapestMonth} (-${t.savingsVsPeakPct}%)`,
    description: `${t.destino} en ${t.cheapestMonth} es ${t.savingsVsPeakPct}% más barato que pico. ${t.reason.slice(0, 120)}...`,
    alternates: { canonical: `${SITE_URL}/temporada-baja/${t.slug}` },
  };
}

export default function TemporadaBajaPage({ params }: { params: { destino: string } }) {
  const t = getTemporadaBaja(params.destino);
  if (!t) notFound();

  const others = TEMPORADA_BAJA_CATALOG.filter((x) => x.slug !== t.slug).slice(0, 6);

  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Temporada baja", url: "/temporada-baja" },
    { name: t.destino, url: `/temporada-baja/${t.slug}` },
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
        <Link href="/temporada-baja" className="hover:text-amber-400">Temporada baja</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{t.destino}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {t.emoji} Cuándo viajar barato a {t.destino}
        </h1>
      </header>

      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
          <div className="text-xs uppercase text-emerald-400">Mes valle (más barato)</div>
          <div className="mt-1 text-lg font-bold text-white">{t.cheapestMonth}</div>
          <div className="mt-2 text-emerald-300 font-bold">-{t.savingsVsPeakPct}% vs pico</div>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <div className="text-xs uppercase text-red-400">Evitar (pico)</div>
          <div className="mt-1 text-lg font-bold text-white">{t.peakMonth}</div>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800/40 p-5">
        <h2 className="mb-2 text-lg font-bold text-white">¿Por qué baja el precio?</h2>
        <p className="text-slate-300">{t.reason}</p>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold text-white">💡 Tips para aprovecharlo</h2>
        <ul className="space-y-2">
          {t.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-300">
              <span className="mt-1 text-amber-400">→</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
        <h2 className="mb-3 text-base font-bold text-amber-300">⚠️ Caveats reales</h2>
        <ul className="space-y-1 text-sm text-slate-200">
          {t.caveats.map((c, i) => (
            <li key={i}>• {c}</li>
          ))}
        </ul>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link href="/deals" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 transition-colors hover:border-amber-500/70">
          <div className="text-2xl">🎯</div>
          <div className="mt-1 text-sm font-bold text-white">Chollos {t.destino}</div>
          <div className="text-xs text-amber-300">Vuelos detectados</div>
        </Link>
        <Link href="/cuando-viajar" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 transition-colors hover:border-amber-500/50">
          <div className="text-2xl">📅</div>
          <div className="mt-1 text-sm font-bold text-white">Cuándo viajar</div>
          <div className="text-xs text-slate-400">Calendario completo</div>
        </Link>
      </section>

      {others.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-bold text-white">Otros destinos</h2>
          <div className="flex flex-wrap gap-2">
            {others.map((o) => (
              <Link key={o.slug} href={`/temporada-baja/${o.slug}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300 hover:border-amber-500/50 hover:text-amber-300">
                {o.emoji} {o.destino}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
