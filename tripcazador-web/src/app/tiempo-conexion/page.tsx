/**
 * /tiempo-conexion — SUPER-1D (24 may 2026)
 *
 * Calculadora minimum connecting time interactiva + tabla 12 aeropuertos.
 * Captura "tiempo mínimo conexión MAD", "MCT JFK", "conexión barajas".
 */
import type { Metadata } from "next";
import Link from "next/link";
import { MCT_AIRPORTS } from "@/lib/mct_data";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema_helpers";
import { MCTCalculatorClient } from "@/components/MCTCalculatorClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Tiempo mínimo de conexión: calculadora 12 aeropuertos",
  description:
    "Calculadora MCT (Minimum Connecting Time) interactiva. Tiempos publicados oficiales + margen recomendado real para 12 aeropuertos top (MAD, BCN, LHR, JFK, DXB...).",
  alternates: { canonical: `${SITE_URL}/tiempo-conexion` },
  openGraph: {
    title: "Calculadora tiempo conexión aeropuertos 2026",
    description: "MCT oficial + margen recomendado por escenario.",
    url: `${SITE_URL}/tiempo-conexion`,
    type: "article",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const FAQ = [
  {
    q: "¿Qué es el MCT (Minimum Connecting Time)?",
    a: "Tiempo mínimo entre vuelos que la aerolínea/aeropuerto considera necesario para que el equipaje y pasajero puedan conectar. Publicado por IATA/OAG. Por debajo de este tiempo, la aerolínea normalmente NO te vende la conexión.",
  },
  {
    q: "¿El MCT publicado es realista?",
    a: "Para situaciones ideales: sí. Pero asume vuelo a tiempo, controles rápidos y caminata directa. En la práctica, añade 30-60min de margen para hubs eficientes (AMS, SIN) y 60-90min para complejos (LHR, JFK).",
  },
  {
    q: "Si pierdo la conexión por delay del vuelo origen, ¿quién paga?",
    a: "Si vendieron como conexión 'protected' (mismo billete, MCT cumplido), la aerolínea te re-rutea sin coste + asistencia (alojamiento si pernoctas). Si compraste segmentos separados o por debajo del MCT, eres tú quien asume.",
  },
  {
    q: "¿Por qué el MCT cambia entre internacional → doméstico?",
    a: "International → Doméstico requiere recoger equipaje + control de aduanas + re-check. En USA puede sumar 90+ min vs internacional → internacional (40-60min normal). Por eso JFK MCT ID = 120min.",
  },
];

export default function TiempoConexionPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Tiempo de conexión", url: "/tiempo-conexion" },
  ]);

  const faqJsonLd = faqPageSchema(FAQ.map((f) => ({ q: f.q, a: f.a })));

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-200">Tiempo de conexión</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">⏱️</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Tiempo mínimo conexión
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          MCT (Minimum Connecting Time) oficial + margen recomendado real para
          {" "}{MCT_AIRPORTS.length} aeropuertos top. Selecciona aeropuerto y
          tipo de conexión.
        </p>
      </header>

      <section className="mb-10">
        <MCTCalculatorClient />
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-white">📊 Tabla rápida MCT internacional→internacional</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2 text-left">Aeropuerto</th>
                <th className="py-2 text-right">MCT II</th>
                <th className="py-2 text-right">+ Buffer</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {MCT_AIRPORTS.map((m, i) => (
                <tr key={i} className="border-t border-slate-700/50">
                  <td className="py-2.5">
                    {m.emoji} <strong className="text-white">{m.iata}</strong> — {m.city}
                  </td>
                  <td className="py-2.5 text-right font-mono">{m.internationalInternational}min</td>
                  <td className="py-2.5 text-right font-mono text-amber-300">
                    {m.internationalInternational + (m.internationalInternational >= 75 ? 60 : 30)}min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-white">❓ FAQ</h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <details key={i} className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
              <summary className="cursor-pointer text-sm font-bold text-white">{f.q}</summary>
              <p className="mt-2 text-sm text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-3">
        <Link href="/jet-lag" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">🛬</div>
          <div className="mt-1 text-sm font-bold text-white">Jet lag por ruta</div>
        </Link>
        <Link href="/aeropuertos" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">🛫</div>
          <div className="mt-1 text-sm font-bold text-white">Aeropuertos ES</div>
        </Link>
        <Link href="/vuelo-cancelado" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">⚖️</div>
          <div className="mt-1 text-sm font-bold text-white">Vuelo cancelado</div>
        </Link>
      </section>
    </main>
  );
}
