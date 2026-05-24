/**
 * /eventos-espana — SSS439 (23 may 2026)
 *
 * Hub vertical /eventos-espana/[slug]. Lista 8 eventos top con datos
 * prácticos para viajeros.
 *
 * SEO: "eventos espana 2026", "fechas san fermines", "feria abril
 * sevilla 2026 hoteles".
 */
import Link from "next/link";
import type { Metadata } from "next";
import { EVENTOS_ES_CATALOG } from "@/lib/eventos_es_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "8 eventos top de España: fechas, alojamiento y tips",
  description:
    "San Fermines, Feria de Abril, Fallas, Carnaval Tenerife, La Tomatina, Semana Santa Sevilla, Cap Roig y Año Nuevo. Fechas + dónde dormir + tips prácticos.",
  alternates: { canonical: `${SITE_URL}/eventos-espana` },
  openGraph: {
    title: "8 eventos top de España",
    description: "Fechas, alojamiento y tips prácticos.",
    url: `${SITE_URL}/eventos-espana`,
    type: "website",
  },
};

export const revalidate = 86400;

export default function EventosEsHubPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl">
          🎉 Eventos top de España
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300">
          {EVENTOS_ES_CATALOG.length} eventos con fechas exactas, mejor zona para
          alojarte y tips prácticos. Reserva con antelación — los precios se
          multiplican.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {EVENTOS_ES_CATALOG.map((e) => (
          <Link
            key={e.slug}
            href={`/eventos-espana/${e.slug}`}
            className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 transition-all hover:border-amber-500/60 hover:bg-slate-800/70"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-white">
                {e.emoji} {e.name}
              </h2>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-xs text-amber-300">
                {e.iata}
              </span>
            </div>
            <p className="text-xs text-slate-400">{e.city}</p>
            <p className="mt-2 line-clamp-2 text-sm text-slate-300">{e.dates}</p>
            <p className="mt-2 line-clamp-3 text-xs text-slate-400">{e.summary}</p>
            <div className="mt-3 text-xs text-amber-400">Ver tips →</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
