/**
 * /divisas — SSS457 (23 may 2026)
 *
 * Hub vertical /divisas/[code]. 8 divisas top destinos viajeros ES.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { DIVISAS_CATALOG } from "@/lib/divisas_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Cambio EUR a 8 divisas: USD, GBP, JPY, CHF, ARS, BRL, MXN, THB",
  description:
    "Tipos de cambio orientativos + tips de viajero para evitar comisiones bancarias. Wise, Revolut y trucos por destino.",
  alternates: { canonical: `${SITE_URL}/divisas` },
  openGraph: {
    title: "Cambio EUR a divisas top",
    description: "Tips para evitar comisiones cambio + tipo orientativo.",
    url: `${SITE_URL}/divisas`,
    type: "website",
  },
};

export const revalidate = 86400;

const VOLATILITY_LABEL: Record<string, { label: string; color: string }> = {
  low: { label: "Estable", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
  medium: { label: "Moderada", color: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
  high: { label: "Alta volatilidad", color: "bg-red-500/15 text-red-300 border-red-500/40" },
};

export default function DivisasHubPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          💱 Cambio EUR a divisas
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
          {DIVISAS_CATALOG.length} divisas top con tipo cambio orientativo + tips
          de viajero. Para conversiones live usa{" "}
          <Link href="/tarjetas-viaje" className="text-amber-400 hover:underline">
            Wise/Revolut
          </Link>
          .
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {DIVISAS_CATALOG.map((d) => {
          const vol = VOLATILITY_LABEL[d.volatility];
          return (
            <Link
              key={d.code}
              href={`/divisas/${d.code.toLowerCase()}`}
              className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 transition-all hover:border-amber-500/60 hover:bg-slate-800/70"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-white">
                  {d.emoji} {d.code}
                </h2>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${vol.color}`}>
                  {vol.label}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{d.nameEs}</p>
              <div className="mt-2 rounded bg-slate-900/60 p-2 text-center">
                <div className="text-xs text-slate-500">1 € =</div>
                <div className="font-mono text-base font-bold text-amber-300">
                  {d.symbol} {d.rateFromEur.toLocaleString("es-ES")}
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      <footer className="mt-10 text-center text-xs text-slate-500">
        Tipos orientativos {DIVISAS_CATALOG[0].lastUpdated}. Para tipo live
        usa Wise.com, XE.com o tu broker bancario.
      </footer>
    </main>
  );
}
