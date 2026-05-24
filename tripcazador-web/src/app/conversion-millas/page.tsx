/**
 * /conversion-millas — SUPER-1D (24 may 2026)
 *
 * Calculadora valor real millas + comparativa 6 programas top.
 * Captura "cuánto valen mis avios", "conversion millas a euros".
 */
import type { Metadata } from "next";
import Link from "next/link";
import { MILLAS_PROGRAMAS } from "@/lib/millas_programas";
import { breadcrumbSchema, faqPageSchema } from "@/lib/schema_helpers";
import { MillasCalculatorClient } from "@/components/MillasCalculatorClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Conversión millas a euros: calculadora 6 programas",
  description:
    "¿Cuánto valen tus Avios, SkyMiles, AAdvantage? Calculadora con valores reales 2026 + comparativa Iberia/Lufthansa/Delta/American/United/AirFrance.",
  alternates: { canonical: `${SITE_URL}/conversion-millas` },
  openGraph: {
    title: "Conversión millas a euros 2026",
    description: "Calculadora puntos→€ + comparativa 6 programas top.",
    url: `${SITE_URL}/conversion-millas`,
    type: "article",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

const FAQ = [
  {
    q: "¿Cuánto vale realmente 1.000 millas?",
    a: "Depende del programa y la redención. En saver internacional business: Avios ~€13, AAdvantage ~€14, Lufthansa M&M ~€11. En economy intra-Europa cuesta más, no menos.",
  },
  {
    q: "¿Qué es 'cpm' (cents per mile)?",
    a: "Centavos de euro por mil millas. Es la métrica universal de valor real. Promedios saver 2026: 10-14 cpm. Más alto = mejor valor.",
  },
  {
    q: "¿Cuál es el mejor programa de millas para España?",
    a: "Iberia Plus (Avios) por la red Latam imbatible (MAD-EZE/JFK/SCL). Avios además se comparte con BA/Aer Lingus/Qatar — más flexibilidad que cualquier otro.",
  },
  {
    q: "¿Cómo se acumulan millas sin volar mucho?",
    a: "Transferencias Amex Membership Rewards 1:1 a Avios + bonos de welcome de tarjetas premium. Ejemplo: tarjeta Amex Platinum ES viene con 30-50K bonus. Equivale ~€400-650 vuelo cash.",
  },
];

export default function ConversionMillasPage() {
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Conversión millas", url: "/conversion-millas" },
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
        <span className="text-slate-200">Conversión millas</span>
      </nav>

      <header className="mb-8 text-center">
        <div className="text-5xl">🧮</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Conversión millas a euros
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Valor REAL de tus puntos en {MILLAS_PROGRAMAS.length} programas top.
          Datos basados en redenciones saver observadas 2024-2026, no en valuations
          oficiales (que son marketing).
        </p>
      </header>

      <section className="mb-8">
        <MillasCalculatorClient />
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-2xl font-bold text-white">📊 Comparativa 6 programas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="py-2 text-left">Programa</th>
                <th className="py-2 text-right">cpm</th>
                <th className="py-2 text-right">Expira</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {MILLAS_PROGRAMAS.sort((a, b) => b.cpm - a.cpm).map((p, i) => (
                <tr key={i} className="border-t border-slate-700/50">
                  <td className="py-2.5">
                    <div className="font-semibold text-white">{p.emoji} {p.name}</div>
                    <div className="text-xs text-slate-500">{p.notes}</div>
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-amber-300">{p.cpm}</td>
                  <td className="py-2.5 text-right text-xs text-slate-400">
                    {p.expirationMonths === 0 ? "Nunca" : `${p.expirationMonths}m`}
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
        <Link href="/business-class-barato" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">👑</div>
          <div className="mt-1 text-sm font-bold text-white">Business barato</div>
        </Link>
        <Link href="/tarjetas-viaje" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">💳</div>
          <div className="mt-1 text-sm font-bold text-white">Tarjetas viaje</div>
        </Link>
        <Link href="/error-fares" className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-center hover:border-amber-500/50">
          <div className="text-2xl">🎯</div>
          <div className="mt-1 text-sm font-bold text-white">Error fares</div>
        </Link>
      </section>
    </main>
  );
}
