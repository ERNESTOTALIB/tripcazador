/**
 * /parking-aeropuerto/[iata] — NEXT batch (26 may 2026)
 *
 * 15 landings programmatic high-intent + Parclick afiliado revenue.
 * "parking aeropuerto madrid" ~30k búsquedas/mes ES total.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  PARKING_AEROPUERTOS,
  getParkingByIata,
} from "@/lib/parking_aeropuerto_catalog";
import { PARTNERS } from "@/lib/travel_partners";
import {
  breadcrumbSchema,
  faqPageSchema,
  articleSchema,
} from "@/lib/schema_helpers";
// AUDIT-FIX: safe cross-vertical lookup (evita soft-404 internos)
import {
  getTransporteSlugForIata,
  aeropuertoExists,
  loungeExists,
} from "@/lib/cross_vertical_links";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ iata: string }> {
  return PARKING_AEROPUERTOS.map((p) => ({ iata: p.iata.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: { iata: string };
}): Promise<Metadata> {
  const p = getParkingByIata(params.iata);
  if (!p) return { title: "Aeropuerto no encontrado" };
  const cheapest = [...p.options].sort((a, b) => a.diaEur - b.diaEur)[0];
  const title = `Parking aeropuerto ${p.ciudad} (${p.iata}): precios 2026`;
  const description = `Comparativa parking aeropuerto ${p.iata}: AENA general, larga estancia, concertados con shuttle. Desde ${cheapest.diaEur}€/día.`.slice(0, 170);
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/parking-aeropuerto/${params.iata.toLowerCase()}` },
    openGraph: { title, description, url: `${SITE_URL}/parking-aeropuerto/${params.iata.toLowerCase()}`, type: "article" },
  };
}

export default function ParkingAeropuertoPage({
  params,
}: {
  params: { iata: string };
}) {
  const p = getParkingByIata(params.iata);
  if (!p) notFound();

  const parclick = PARTNERS.find((x) => x.slug === "parclick");
  const cheapest = [...p.options].sort((a, b) => a.diaEur - b.diaEur)[0];
  const others = PARKING_AEROPUERTOS.filter((o) => o.iata !== p.iata).slice(0, 5);

  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Aeropuertos", url: "/aeropuertos" },
    { name: `Parking ${p.iata}`, url: `/parking-aeropuerto/${p.iata.toLowerCase()}` },
  ]);
  const faqLd = faqPageSchema([
    {
      q: `¿Cuál es el parking más barato del aeropuerto ${p.iata}?`,
      a: `${cheapest.name} desde ${cheapest.diaEur}€/día (${cheapest.semanaEur}€/semana). ${cheapest.notas}`,
    },
    {
      q: `¿Puedo reservar online el parking de ${p.iata}?`,
      a: `Sí. AENA acepta reserva online en su web (descuentos hasta 30% vs walk-in). Para parkings concertados con shuttle, usa Parclick — comparador con cancelación gratis 24h.`,
    },
    {
      q: `¿Vale la pena el parking concertado off-airport?`,
      a: `Para estancias >3 días sí: ahorras 40-60% vs AENA Express. El shuttle suma 15-20 min al trayecto pero los buses van cada 10-15 min en ambas direcciones.`,
    },
    {
      q: `¿Qué tipo de parking es mejor según mi estancia?`,
      a: `Corto plazo (<4h): ${p.recomendacion.cortoPlazoH}. 1-3 días: ${p.recomendacion.medio1_3Dias}. Semana+: ${p.recomendacion.largoSemana}.`,
    },
    {
      q: `¿Es seguro dejar el coche varios días en ${p.iata}?`,
      a: `Sí en parkings oficiales AENA y concertados verificados (Parclick valida que tengan seguro). Evita parkings 'baratos' anunciados en redes sociales sin web oficial.`,
    },
  ]);
  const articleLd = articleSchema({
    headline: `Parking aeropuerto ${p.iata} ${p.ciudad}`,
    description: `Comparativa precio + tipos de parking aeropuerto ${p.iata}`,
    url: `${SITE_URL}/parking-aeropuerto/${p.iata.toLowerCase()}`,
    datePublished: p.lastUpdated,
    articleSection: "Parking aeropuerto",
    imageUrl: `${SITE_URL}/api/og?title=${encodeURIComponent(`Parking ${p.iata} ${p.ciudad}`)}`,
  });

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/aeropuertos" className="hover:text-amber-400">Aeropuertos</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Parking {p.iata}</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🅿️✈️</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Parking aeropuerto {p.iata} {p.ciudad}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          {p.options.length} opciones reales con precio día y semana. Desde{" "}
          {cheapest.diaEur} €/día. Actualizado {p.lastUpdated}.
        </p>
      </header>

      {parclick && (
        <section className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <h2 className="text-lg font-bold text-white">🚀 Reserva online (ahorro 50-70%)</h2>
          <p className="mt-2 text-sm text-slate-300">
            Parclick compara todos los parkings concertados de {p.iata} con
            cancelación gratis 24h y precio mejor que AENA Express en más del
            90% de casos.
          </p>
          <a
            href={parclick.affiliateUrl()}
            target="_blank"
            rel="nofollow noopener sponsored"
            className="mt-3 inline-block rounded-lg bg-amber-500 hover:bg-amber-400 px-5 py-3 text-black font-bold text-sm"
          >
            Ver parkings {p.iata} en Parclick →
          </a>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold text-white">Opciones disponibles</h2>
        <div className="space-y-3">
          {p.options.map((o, i) => (
            <article
              key={i}
              className="rounded-2xl border border-slate-700 bg-slate-900/40 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs uppercase text-slate-300">
                      {o.type.replace("_", " ")}
                    </span>
                    <h3 className="font-bold text-white">{o.name}</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{o.notas}</p>
                  <p className="mt-2 text-xs text-amber-300">
                    🚶 {o.walkMin} min al terminal
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-2xl font-bold text-amber-300">
                    {o.diaEur} €<span className="text-sm text-slate-400">/día</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {o.semanaEur} €/semana
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">⏱️ Corto (menos de 4h)</h3>
          <p className="mt-2 text-sm text-slate-200">{p.recomendacion.cortoPlazoH}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-300">📅 1-3 días</h3>
          <p className="mt-2 text-sm text-slate-200">{p.recomendacion.medio1_3Dias}</p>
        </div>
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-300">🌴 Semana+</h3>
          <p className="mt-2 text-sm text-slate-200">{p.recomendacion.largoSemana}</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-white">💡 Tips locales {p.iata}</h2>
        <ul className="space-y-2">
          {p.tips.map((t, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
              <span className="text-amber-400">→</span>
              <span className="text-sm text-slate-200">{t}</span>
            </li>
          ))}
        </ul>
      </section>

      {p.evitar.length > 0 && (
        <section className="mb-8 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
          <h2 className="mb-3 text-lg font-bold text-rose-300">⚠️ Qué evitar</h2>
          <ul className="space-y-2">
            {p.evitar.map((e, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-200">
                <span className="text-rose-400">✕</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/40 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Relacionado
        </h2>
        <div className="flex flex-wrap gap-2">
          {aeropuertoExists(p.iata) && (
            <Link href={`/aeropuertos/${p.iata.toLowerCase()}`} className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40">
              ✈️ Aeropuerto {p.iata}
            </Link>
          )}
          {(() => {
            const transporteSlug = getTransporteSlugForIata(p.iata);
            return transporteSlug ? (
              <Link href={`/transporte-aeropuerto/${transporteSlug}`} className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40">
                🚇 Transporte centro
              </Link>
            ) : null;
          })()}
          {loungeExists(p.iata) && (
            <Link href={`/lounge-aeropuerto/${p.iata.toLowerCase()}`} className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40">
              🛋️ Salas VIP
            </Link>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Parking otros aeropuertos
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {others.map((o) => (
            <Link key={o.iata} href={`/parking-aeropuerto/${o.iata.toLowerCase()}`} className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-sm text-slate-200 transition-colors hover:border-amber-500/50">
              {o.iata} {o.ciudad}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
