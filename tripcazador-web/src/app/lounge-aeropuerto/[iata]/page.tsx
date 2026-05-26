/**
 * /lounge-aeropuerto/[iata] — SUPER-SEO (25 may 2026)
 *
 * 12 landings de salas VIP por aeropuerto ES.
 * High-intent: "sala vip aeropuerto madrid" ~5k/mes etc.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  LOUNGES,
  getLoungesByIata,
} from "@/lib/lounges_catalog";
import {
  breadcrumbSchema,
  faqPageSchema,
  articleSchema,
} from "@/lib/schema_helpers";
// AUDIT-FIX: safe cross-vertical lookup (evita soft-404 transporte-aeropuerto)
import {
  getTransporteSlugForIata,
  aeropuertoExists,
} from "@/lib/cross_vertical_links";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ iata: string }> {
  return LOUNGES.map((h) => ({ iata: h.iata.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: { iata: string };
}): Promise<Metadata> {
  const h = getLoungesByIata(params.iata);
  if (!h) return { title: "Aeropuerto no encontrado" };
  const title = `Salas VIP ${h.ciudad} (${h.iata}): acceso y day pass`;
  const description = `${h.lounges.length} lounges en ${h.iata}: cómo acceder (Priority Pass, Iberia Plus, business), day-pass walk-in desde ${
    Math.min(...h.lounges.filter((l) => l.dayPassEur).map((l) => l.dayPassEur!))
  } €.`;
  return {
    title,
    description: description.slice(0, 170),
    alternates: {
      canonical: `${SITE_URL}/lounge-aeropuerto/${params.iata.toLowerCase()}`,
    },
    openGraph: {
      title,
      description: description.slice(0, 170),
      url: `${SITE_URL}/lounge-aeropuerto/${params.iata.toLowerCase()}`,
      type: "article",
    },
  };
}

export default function LoungeHubPage({
  params,
}: {
  params: { iata: string };
}) {
  const h = getLoungesByIata(params.iata);
  if (!h) notFound();

  const cheapest = [...h.lounges]
    .filter((l) => l.dayPassEur)
    .sort((a, b) => (a.dayPassEur ?? 0) - (b.dayPassEur ?? 0))[0];

  const others = LOUNGES.filter((o) => o.iata !== h.iata).slice(0, 5);

  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Lounges", url: "/lounge-aeropuerto" },
    { name: h.ciudad, url: `/lounge-aeropuerto/${h.iata.toLowerCase()}` },
  ]);
  const faqLd = faqPageSchema([
    {
      q: `¿Cómo accedo a las salas VIP del aeropuerto ${h.iata}?`,
      a: `Hay 4 vías principales: Priority Pass (tarjeta crédito o suscripción 99-429€/año), Iberia Plus Oro/Platino (gratis si elite), business class (incluido en billete), o walk-in day-pass desde ${cheapest?.dayPassEur ?? 30}€.`,
    },
    {
      q: `¿Cuánto cuesta el day-pass más barato en ${h.iata}?`,
      a: cheapest
        ? `${cheapest.dayPassEur}€ en ${cheapest.name}, ${cheapest.estanciaMaxH || 3}h máx estancia. Reservar online 5-10€ más barato que walk-in.`
        : "No hay day-pass walk-in documentado en este aeropuerto — solo acceso por status/tarjeta.",
    },
    {
      q: `¿Priority Pass funciona en lounges Iberia?`,
      a: "NO. Los lounges Iberia (T4 Velázquez/Cibeles MAD, T1 Pau Casals BCN) son exclusivos Oneworld + Iberia Plus Oro. Priority Pass solo accede a lounges Aspire/Plaza Premium/independientes.",
    },
    {
      q: `¿Las tarjetas Amex Platinum dan acceso ilimitado?`,
      a: "Sí. Amex Platinum (740€/año) incluye Priority Pass ilimitado para ti + 2 acompañantes, además de acceso Centurion lounges donde existen.",
    },
    {
      q: `¿Vale la pena comprar Priority Pass solo para vacaciones?`,
      a: `Priority Pass tiene tarifa entrada (99€) + 35€ por visita. Si haces 4+ visitas/año, plan Standard Plus (329€) sale más cuenta. Para visitas esporádicas, Revolut Metal (13.99€/mes) incluye 1 lounge/mes.`,
    },
  ]);

  const articleLd = articleSchema({
    headline: `Salas VIP aeropuerto ${h.iata} ${h.ciudad}`,
    description: `Lounges, accesos y day-pass en ${h.ciudad}`,
    url: `${SITE_URL}/lounge-aeropuerto/${h.iata.toLowerCase()}`,
    datePublished: h.lastUpdated,
    articleSection: "Lounges aeropuerto",
    imageUrl: `${SITE_URL}/api/og?title=${encodeURIComponent(`Salas VIP ${h.iata}`)}`,
  });

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/lounge-aeropuerto" className="hover:text-amber-400">Lounges</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">{h.iata} {h.ciudad}</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🛋️</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Salas VIP aeropuerto {h.iata} {h.ciudad}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          {h.lounges.length} lounges disponibles. Acceso por Priority Pass,
          Iberia Plus Oro, business class o day-pass walk-in desde{" "}
          {cheapest?.dayPassEur ?? "—"} €.
        </p>
      </header>

      <section className="mb-8 space-y-4">
        {h.lounges.map((l, i) => (
          <article
            key={i}
            className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-white">{l.name}</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Terminal {l.terminal} · {l.airside ? "Airside (post seguridad)" : "Landside"}
                  {l.capacidad && ` · ${l.capacidad} pax`}
                </p>
              </div>
              {l.dayPassEur && (
                <div className="shrink-0 text-right">
                  <div className="text-2xl font-bold text-amber-300">
                    {l.dayPassEur} €
                  </div>
                  <div className="text-xs text-slate-500">day pass walk-in</div>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Cómo acceder
                </h3>
                <ul className="mt-2 space-y-1">
                  {l.acceso.map((a, j) => (
                    <li key={j} className="text-xs text-slate-300">
                      <strong className="text-white">{a.metodo}</strong>: {a.detalle}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Servicios
                </h3>
                <ul className="mt-2 space-y-1">
                  {l.servicios.map((s, k) => (
                    <li key={k} className="text-xs text-slate-300 flex gap-1">
                      <span className="text-indigo-400">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Horario: {l.horario}
              {l.estanciaMaxH && ` · Estancia máx ${l.estanciaMaxH}h`}
            </p>
          </article>
        ))}
      </section>

      <section className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <h2 className="text-lg font-bold text-emerald-300 mb-3">
          💳 Tarjetas con acceso lounge
        </h2>
        <div className="space-y-2">
          {h.tarjetasRecomendadas.map((t, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3 border-b border-slate-700 pb-2 last:border-b-0">
              <div>
                <strong className="text-white">{t.nombre}</strong>
                <p className="text-xs text-slate-400 mt-0.5">{t.cobertura}</p>
              </div>
              <span className="shrink-0 text-xs text-amber-300">{t.coste}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-white">💡 Tips locales {h.iata}</h2>
        <ul className="space-y-2">
          {h.tips.map((t, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
              <span className="text-amber-400">→</span>
              <span className="text-sm text-slate-200">{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/40 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Relacionado
        </h2>
        <div className="flex flex-wrap gap-2">
          {aeropuertoExists(h.iata) && (
            <Link
              href={`/aeropuertos/${h.iata.toLowerCase()}`}
              className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40"
            >
              ✈️ Aeropuerto {h.iata}
            </Link>
          )}
          {(() => {
            const transporteSlug = getTransporteSlugForIata(h.iata);
            return transporteSlug ? (
              <Link
                href={`/transporte-aeropuerto/${transporteSlug}`}
                className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40"
              >
                🚇 Cómo llegar al centro
              </Link>
            ) : null;
          })()}
          <Link
            href="/tarjetas-viaje"
            className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40"
          >
            💳 Tarjetas viaje
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Lounges otros aeropuertos
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {others.map((o) => (
            <Link
              key={o.iata}
              href={`/lounge-aeropuerto/${o.iata.toLowerCase()}`}
              className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-sm text-slate-200 transition-colors hover:border-amber-500/50"
            >
              {o.iata} {o.ciudad}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
