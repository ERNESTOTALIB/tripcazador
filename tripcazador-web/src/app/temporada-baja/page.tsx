/**
 * /temporada-baja — SSS463 (24 may 2026)
 *
 * Hub vertical /temporada-baja/[destino] — 12 destinos top con mes
 * valle, razón estacional, savings vs pico.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { TEMPORADA_BAJA_CATALOG } from "@/lib/temporada_baja_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Temporada baja: cuándo viajar barato a 12 destinos",
  description:
    "Roma en febrero, Tokio en enero, Bali en marzo... 12 destinos top con mes valle, savings 35-50% vs pico y caveats reales (clima, eventos cerrados).",
  alternates: { canonical: `${SITE_URL}/temporada-baja` },
  openGraph: {
    title: "Temporada baja por destino",
    description: "Mes más barato + razón estacional para 12 destinos top.",
    url: `${SITE_URL}/temporada-baja`,
    type: "website",
  },
};

export const revalidate = 86400;

export default function TemporadaBajaHubPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          📅 Temporada baja por destino
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
          {TEMPORADA_BAJA_CATALOG.length} destinos top con el mes más barato,
          la razón estacional y savings reales 35-50% vs temporada pico.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {TEMPORADA_BAJA_CATALOG.map((t) => (
          <Link
            key={t.slug}
            href={`/temporada-baja/${t.slug}`}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 transition-all hover:border-amber-500/60 hover:bg-slate-800/70"
          >
            <h2 className="text-base font-bold text-white">
              {t.emoji} {t.destino}
            </h2>
            <p className="mt-2 text-xs text-slate-400">Mes valle:</p>
            <p className="text-sm font-bold text-amber-300">{t.cheapestMonth}</p>
            <div className="mt-2 rounded-full inline-block border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
              -{t.savingsVsPeakPct}% vs pico
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
