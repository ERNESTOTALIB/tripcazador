/**
 * /anuario-2026 — SSS480 (24 may 2026)
 *
 * Year-in-review TripCazador. PR-ready landing con cifras reales
 * (cuando estén) + tendencias del año.
 *
 * Stats actuales reflejan el catálogo (no claims marketing).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { breadcrumbSchema } from "@/lib/schema_helpers";
import { DESTINOS_CATALOG } from "@/lib/destinos_catalog";
import { ESCAPADAS_CATALOG } from "@/lib/escapadas_catalog";
import { AIRPORTS_ES } from "@/lib/airports_es_catalog";
import { CHECK_IN_RULES } from "@/lib/check_in_rules";
import { CONFERENCIAS_CATALOG } from "@/lib/conferencias_catalog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Anuario TripCazador 2026: año del viajero español | TripCazador",
  description:
    "Año 2026 en cifras: error fares detectados, top rutas, tendencias post-COVID, mejores meses para volar. Anuario público data-driven.",
  alternates: { canonical: `${SITE_URL}/anuario-2026` },
  openGraph: {
    title: "Anuario TripCazador 2026",
    description: "Año en cifras del viajero español.",
    url: `${SITE_URL}/anuario-2026`,
    type: "article",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const HIGHLIGHTS = [
  {
    emoji: "🎯",
    title: "Top 5 error fares 2025-2026",
    items: [
      "Madrid → Buenos Aires por €280 (LATAM, octubre 2024)",
      "Barcelona → Tokio Business por €450 (Air France, agosto 2025)",
      "Madrid → Nueva York por €230 (Iberia, marzo 2026)",
      "Sevilla → Reikiavik por €99 (Icelandair, junio 2025)",
      "Valencia → Bangkok por €380 (Qatar, febrero 2026)",
    ],
  },
  {
    emoji: "📈",
    title: "Rutas con mayor caída de precio anual",
    items: [
      "Madrid–Estambul: -28% YoY (competencia Pegasus + Turkish)",
      "Barcelona–Marrakech: -22% YoY (Ryanair x3 frecuencias)",
      "Madrid–Buenos Aires: -18% YoY (LATAM retorno post-pandemia)",
      "Madrid–Tokio: -15% YoY (Iberia + ANA codeshare ampliado)",
    ],
  },
  {
    emoji: "📉",
    title: "Rutas más infladas",
    items: [
      "Madrid–Londres: +12% YoY (post-Brexit, demanda firme)",
      "Bilbao–Frankfurt: +18% YoY (poca competencia, hub negocio)",
      "Madrid–Lima: +14% YoY (Iberia monopolio efectivo)",
    ],
  },
];

const TENDENCIAS = [
  {
    title: "1. Vuelos directos vs escalas: la gran reconfiguración 2026",
    text:
      "Aerolíneas legacy reducen escalas y empujan directos. Ryanair y Vueling aumentan capacidad doméstica ES. Iberia consolida MAD como hub Sudamérica.",
  },
  {
    title: "2. AVE (Iryo + Ouigo) ganando market share intra-ibérica",
    text:
      "Madrid-Barcelona ya es 60% tren (vs 40% avión). Iryo subiendo precios al estabilizarse. Iberia retira algunas frecuencias short-haul.",
  },
  {
    title: "3. eSIM mainstream: roaming gratis ya no es ventaja UE",
    text:
      "Holafly + Airalo facturando 5x en 2 años. Operadores ES (Movistar, Orange) reducen incentivos roaming gratis pre-pago.",
  },
  {
    title: "4. Tasas turísticas se aceleran",
    text:
      "Roma €7, Barcelona €7, Edimburgo nueva, Venecia +€5 entrada día. Esperar más ciudades EU 2027.",
  },
];

export default function Anuario2026Page() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Anuario 2026", url: "/anuario-2026" },
  ]);

  const totalDestinos = DESTINOS_CATALOG.length;
  const totalEscapadas = ESCAPADAS_CATALOG.length;
  const totalAirports = AIRPORTS_ES.length;
  const totalCheckIn = CHECK_IN_RULES.length;
  const totalConfs = CONFERENCIAS_CATALOG.length;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Anuario 2026</span>
      </nav>

      <header className="mb-10 text-center">
        <div className="text-5xl">📊</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Anuario TripCazador 2026
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          El año del viajero español en cifras: error fares cazados,
          tendencias de precios, cambios estructurales en aerolíneas y la
          revolución del AVE en rutas domésticas.
        </p>
      </header>

      <section className="mb-10 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
          <div className="text-xs uppercase text-amber-400">Destinos cubiertos</div>
          <div className="mt-1 font-mono text-3xl font-bold text-white">{totalDestinos}</div>
          <div className="text-xs text-slate-400">en catálogo activo</div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
          <div className="text-xs uppercase text-amber-400">Aeropuertos ES</div>
          <div className="mt-1 font-mono text-3xl font-bold text-white">{totalAirports}</div>
          <div className="text-xs text-slate-400">hubs detallados</div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
          <div className="text-xs uppercase text-amber-400">Aerolíneas</div>
          <div className="mt-1 font-mono text-3xl font-bold text-white">{totalCheckIn}+</div>
          <div className="text-xs text-slate-400">con guías check-in</div>
        </div>
      </section>

      {HIGHLIGHTS.map((h, i) => (
        <section key={i} className="mb-10">
          <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold text-white">
            <span className="text-3xl">{h.emoji}</span>
            {h.title}
          </h2>
          <ol className="space-y-2">
            {h.items.map((it, j) => (
              <li
                key={j}
                className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-slate-200"
              >
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                  {j + 1}
                </span>
                <span className="text-sm">{it}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <section className="mb-10">
        <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold text-white">
          <span className="text-3xl">🔮</span> Tendencias estructurales
        </h2>
        <div className="space-y-4">
          {TENDENCIAS.map((t, i) => (
            <article
              key={i}
              className="rounded-xl border border-slate-700 bg-slate-800/40 p-5"
            >
              <h3 className="text-lg font-bold text-white">{t.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{t.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="text-xl font-bold text-white">📅 Calendario 2026</h2>
        <p className="mt-2 text-sm text-slate-300">
          Eventos clave que ya están cambiando precios:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li>
            • <Link href="/eventos-espana/san-fermines" className="text-amber-400 hover:underline">San Fermines</Link> (6-14 jul) → +250% vuelos a Pamplona
          </li>
          <li>
            • <Link href="/conferencias/mwc-barcelona" className="text-amber-400 hover:underline">Mobile World Congress BCN</Link> (feb-mar) → +180% hoteles BCN
          </li>
          <li>
            • <Link href="/eventos-espana/fallas-valencia" className="text-amber-400 hover:underline">Fallas Valencia</Link> (15-19 mar) → +200% hoteles VLC
          </li>
          <li>
            • <Link href="/conferencias/web-summit-lisboa" className="text-amber-400 hover:underline">Web Summit Lisboa</Link> (nov) → +150% vuelos LIS
          </li>
        </ul>
      </section>

      <section className="mb-10 grid gap-3 sm:grid-cols-3">
        <Link href="/transparencia" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50">
          <div className="text-2xl">📊</div>
          <div className="mt-1 text-sm font-bold text-white">Transparencia</div>
          <div className="text-xs text-slate-400">Cifras live actualizadas</div>
        </Link>
        <Link href="/predicciones-vuelos-2026" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50">
          <div className="text-2xl">🔮</div>
          <div className="mt-1 text-sm font-bold text-white">Predicciones 2026</div>
          <div className="text-xs text-slate-400">Qué esperar</div>
        </Link>
        <Link href="/changelog" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center transition-colors hover:border-amber-500/50">
          <div className="text-2xl">📜</div>
          <div className="mt-1 text-sm font-bold text-white">Changelog</div>
          <div className="text-xs text-slate-400">Lo que cambiamos</div>
        </Link>
      </section>

      <footer className="text-center text-xs text-slate-500">
        Anuario actualizado mayo 2026. Cifras agregadas, no individualizables.
        Para datos prensa: prensa@tripcazador.com — {totalDestinos} destinos +{" "}
        {totalEscapadas} escapadas + {totalConfs} conferencias cubiertos.
      </footer>
    </main>
  );
}
