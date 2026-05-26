/**
 * /transporte-aeropuerto/[ciudad] — SUPER-SEO (25 may 2026)
 *
 * 15 landings high-intent: "como llegar centro desde aeropuerto X"
 * 5-15k búsquedas/mes mainland, 2-5k islas. Cubre opciones reales:
 * metro/tren/bus/taxi/VTC con precio, tiempo, frecuencia y caveats.
 *
 * Schema enriched: HowTo (cómo llegar en N pasos), FAQPage, Breadcrumb.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  TRANSPORTE_AEROPUERTO,
  getTransporteCiudadBySlug,
} from "@/lib/transporte_aeropuerto_catalog";
import {
  breadcrumbSchema,
  faqPageSchema,
  howToSchema,
  articleSchema,
} from "@/lib/schema_helpers";
// AUDIT-FIX: gate /aeropuertos/[iata] link — TFN/OVD/IBZ no están en AIRPORTS_ES
import { aeropuertoExists, loungeExists, parkingExists } from "@/lib/cross_vertical_links";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams(): Array<{ ciudad: string }> {
  return TRANSPORTE_AEROPUERTO.map((c) => ({ ciudad: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { ciudad: string };
}): Promise<Metadata> {
  const c = getTransporteCiudadBySlug(params.ciudad);
  if (!c) return { title: "Ciudad no encontrada" };
  const title = `Aeropuerto ${c.iata} al centro de ${c.ciudad}: transporte`;
  const descBase = `${c.options.length} opciones transporte aeropuerto ${c.iata} → ${c.ciudad}: ${c.options
    .slice(0, 3)
    .map((o) => `${o.modo} ${o.precioEur}€`)
    .join(", ")}. Precios + tiempos actualizados.`;
  const description = descBase.slice(0, 170);
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/transporte-aeropuerto/${c.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/transporte-aeropuerto/${c.slug}`,
      type: "article",
    },
  };
}

export default function TransporteAeropuertoPage({
  params,
}: {
  params: { ciudad: string };
}) {
  const c = getTransporteCiudadBySlug(params.ciudad);
  if (!c) notFound();

  const others = TRANSPORTE_AEROPUERTO.filter((o) => o.slug !== c.slug).slice(0, 5);

  const cheapest = [...c.options].sort((a, b) => a.precioEur - b.precioEur)[0];
  const fastest = [...c.options].sort((a, b) => a.tiempoMin - b.tiempoMin)[0];

  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Aeropuertos", url: "/aeropuertos" },
    { name: c.ciudad, url: `/transporte-aeropuerto/${c.slug}` },
  ]);

  const faqLd = faqPageSchema([
    {
      q: `¿Cuál es la opción más barata para ir del aeropuerto ${c.iata} al centro de ${c.ciudad}?`,
      a: `${cheapest.nombre} a ${cheapest.precioEur} €, tarda ${cheapest.tiempoMin} min. ${cheapest.notas}`,
    },
    {
      q: `¿Cuál es la opción más rápida?`,
      a: `${fastest.nombre} en ${fastest.tiempoMin} min (${fastest.precioEur} €). ${fastest.notas}`,
    },
    {
      q: `¿Cuánto cuesta un taxi del aeropuerto ${c.iata} al centro de ${c.ciudad}?`,
      a: (() => {
        const taxi = c.options.find((o) => o.modo === "taxi");
        if (taxi) return `${taxi.precioEur} € aprox (${taxi.tiempoMin} min). ${taxi.notas}`;
        return "No hay tarifa taxi específica documentada. Pide contador siempre.";
      })(),
    },
    {
      q: `¿Hay opciones de transporte nocturno en ${c.ciudad}?`,
      a: c.recomendacion.nocturno,
    },
    {
      q: `¿A qué distancia está el aeropuerto ${c.iata} del centro de ${c.ciudad}?`,
      a: `${c.distanciaKm} km. Los trayectos típicos tardan entre ${fastest.tiempoMin} y ${
        c.options.sort((a, b) => b.tiempoMin - a.tiempoMin)[0].tiempoMin
      } min según el medio.`,
    },
  ]);

  // HowTo schema (Google rich result eligible)
  const howToLd = howToSchema({
    name: `Cómo ir del aeropuerto ${c.iata} al centro de ${c.ciudad}`,
    description: `Guía paso a paso con ${c.options.length} opciones (precios + tiempos).`,
    estimatedCost: { currency: "EUR", value: cheapest.precioEur },
    steps: [
      {
        name: `Identificar tu opción`,
        text: `Decide según presupuesto/rapidez. Más barato: ${cheapest.nombre} (${cheapest.precioEur} €). Más rápido: ${fastest.nombre} (${fastest.tiempoMin} min).`,
      },
      {
        name: `Llegar a la parada/estación`,
        text: c.options[0].notas || "Sigue señalización del aeropuerto hacia tu medio de transporte.",
      },
      {
        name: `Pagar billete`,
        text: `Tarjeta contactless funciona en la mayoría (excepto algunas líneas locales). Cómpralo en máquina o app oficial.`,
      },
      {
        name: `Llegar al centro`,
        text: `Tiempo total estimado: ${fastest.tiempoMin}-${c.options.sort((a, b) => b.tiempoMin - a.tiempoMin)[0].tiempoMin} min según opción.`,
      },
    ],
  });

  const articleLd = articleSchema({
    headline: `Cómo ir del aeropuerto ${c.iata} al centro de ${c.ciudad}`,
    description: `${c.options.length} opciones transporte público y privado, precios y tiempos`,
    url: `${SITE_URL}/transporte-aeropuerto/${c.slug}`,
    datePublished: c.lastUpdated,
    articleSection: "Transporte aeropuerto",
    imageUrl: `${SITE_URL}/api/og?title=${encodeURIComponent(`${c.iata} → ${c.ciudad}`)}`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/aeropuertos" className="hover:text-amber-400">Aeropuertos</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Transporte {c.ciudad}</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🚇✈️</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Aeropuerto {c.iata} → centro de {c.ciudad}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          {c.options.length} opciones reales con precio, tiempo y notas honest.
          Aeropuerto a {c.distanciaKm} km del centro. Actualizado{" "}
          {c.lastUpdated}.
        </p>
      </header>

      <section className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
          <div className="text-xs uppercase text-emerald-300">Más barato</div>
          <div className="mt-1 text-lg font-bold text-white">{cheapest.precioEur} €</div>
          <div className="text-xs text-slate-400 mt-1">{cheapest.nombre}</div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
          <div className="text-xs uppercase text-amber-300">Más rápido</div>
          <div className="mt-1 text-lg font-bold text-white">{fastest.tiempoMin} min</div>
          <div className="text-xs text-slate-400 mt-1">{fastest.nombre}</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-center">
          <div className="text-xs uppercase text-slate-400">Distancia</div>
          <div className="mt-1 text-lg font-bold text-white">{c.distanciaKm} km</div>
          <div className="text-xs text-slate-400 mt-1">Aeropuerto-centro</div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold text-white">Todas las opciones</h2>
        <div className="space-y-3">
          {c.options.map((o, i) => (
            <article
              key={i}
              className="rounded-2xl border border-slate-700 bg-slate-900/40 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs uppercase text-slate-300">
                      {o.modo}
                    </span>
                    <h3 className="font-bold text-white">{o.nombre}</h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{o.notas}</p>
                  <p className="mt-2 text-xs text-amber-300">
                    👤 Mejor para: {o.mejorPara}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-2xl font-bold text-amber-300">
                    {o.precioEur} €
                  </div>
                  <div className="text-xs text-slate-400">{o.tiempoMin} min</div>
                  {o.frecuenciaMin && (
                    <div className="text-xs text-slate-500">cada {o.frecuenciaMin} min</div>
                  )}
                  <div className="text-xs text-slate-500 mt-1">{o.horario}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
            💰 Presupuesto
          </h3>
          <p className="mt-2 text-sm text-slate-200">{c.recomendacion.presupuesto}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-300">
            ⚡ Más rápido
          </h3>
          <p className="mt-2 text-sm text-slate-200">{c.recomendacion.rapido}</p>
        </div>
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-300">
            🌙 Nocturno
          </h3>
          <p className="mt-2 text-sm text-slate-200">{c.recomendacion.nocturno}</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold text-white">💡 Tips locales</h2>
        <ul className="space-y-2">
          {c.tips.map((t, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
              <span className="text-amber-400">→</span>
              <span className="text-sm text-slate-200">{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
        <h2 className="mb-3 text-lg font-bold text-rose-300">⚠️ Qué evitar</h2>
        <ul className="space-y-2">
          {c.evitar.map((e, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-200">
              <span className="text-rose-400">✕</span>
              <span>{e}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/40 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Relacionado
        </h2>
        <div className="flex flex-wrap gap-2">
          {aeropuertoExists(c.iata) && (
            <Link
              href={`/aeropuertos/${c.iata.toLowerCase()}`}
              className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40"
            >
              ✈️ Aeropuerto {c.iata}
            </Link>
          )}
          {loungeExists(c.iata) && (
            <Link
              href={`/lounge-aeropuerto/${c.iata.toLowerCase()}`}
              className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40"
            >
              🛋️ Salas VIP
            </Link>
          )}
          {parkingExists(c.iata) && (
            <Link
              href={`/parking-aeropuerto/${c.iata.toLowerCase()}`}
              className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40"
            >
              🅿️ Parking
            </Link>
          )}
          <Link
            href="/equipo-viaje"
            className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40"
          >
            🎒 Equipo viaje
          </Link>
          <Link
            href="/equipaje-medidor"
            className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40"
          >
            📏 Medidor equipaje
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Otras ciudades
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`/transporte-aeropuerto/${o.slug}`}
              className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-sm text-slate-200 transition-colors hover:border-amber-500/50"
            >
              {o.iata} · {o.ciudad}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
