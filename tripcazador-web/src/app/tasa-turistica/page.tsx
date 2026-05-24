/**
 * /tasa-turistica — SSS459 (23 may 2026)
 *
 * Hub vertical /tasa-turistica/[ciudad]. 12 ciudades top.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { TASA_TURISTICA_CATALOG } from "@/lib/tasa_turistica_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Tasa turística por ciudad: cuánto pagas en cada destino",
  description:
    "Roma €7, Barcelona €7, Amsterdam 12.5%+€3, Berlín 5%... 12 ciudades con tasa turística detallada: precios por noche, excepciones, cobro.",
  alternates: { canonical: `${SITE_URL}/tasa-turistica` },
  openGraph: {
    title: "Tasa turística por ciudad",
    description: "Cuánto pagas por noche en hoteles top Europa.",
    url: `${SITE_URL}/tasa-turistica`,
    type: "website",
  },
};

export const revalidate = 86400;

export default function TasaTuristicaHubPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          🏨 Tasa turística por ciudad
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
          {TASA_TURISTICA_CATALOG.length} ciudades top con tasa turística
          actualizada 2026: precio por noche, excepciones (menores, business),
          y cómo se cobra en cada destino.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {TASA_TURISTICA_CATALOG.map((t) => (
          <Link
            key={t.slug}
            href={`/tasa-turistica/${t.slug}`}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 transition-all hover:border-amber-500/60 hover:bg-slate-800/70"
          >
            <h2 className="text-base font-bold text-white">
              {t.emoji} {t.city}
            </h2>
            <p className="text-xs text-slate-400">{t.country}</p>
            <div className="mt-2 rounded bg-slate-900/60 p-2">
              <div className="text-xs text-slate-500">Por noche/persona</div>
              <div className="text-sm font-bold text-amber-300">
                {t.ratePerNight}
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
