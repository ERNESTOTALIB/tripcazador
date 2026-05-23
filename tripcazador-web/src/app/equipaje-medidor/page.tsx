/**
 * /equipaje-medidor — SSS450 (23 may 2026)
 *
 * Herramienta interactiva: introduce dimensiones + peso de tu bolso,
 * ve qué aerolíneas lo aceptan en cabina (gratis o pagando).
 *
 * SEO: "medidor equipaje cabina", "que aerolineas aceptan mi bolso",
 * "comparador equipaje cabina".
 */
import type { Metadata } from "next";
import Link from "next/link";
import { EquipajeMedidorTool } from "@/components/EquipajeMedidorTool";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Medidor de equipaje: ¿qué aerolínea acepta tu bolso? | TripCazador",
  description:
    "Introduce dimensiones (cm) y peso (kg) de tu bolso y descubre al instante qué aerolíneas low-cost lo aceptan en cabina, gratis o con fee.",
  alternates: { canonical: `${SITE_URL}/equipaje-medidor` },
  openGraph: {
    title: "Medidor de equipaje cabina",
    description: "¿Tu bolso entra en cabina? Compara con 15 aerolíneas.",
    url: `${SITE_URL}/equipaje-medidor`,
    type: "website",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function EquipajeMedidorPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <div className="text-5xl">🧳</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Medidor de equipaje
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Introduce las dimensiones y peso de tu bolso y verifica al instante
          qué aerolíneas low-cost lo aceptan en cabina (gratis o con fee).
        </p>
      </header>

      <EquipajeMedidorTool />

      <section className="mt-10 rounded-xl border border-slate-700 bg-slate-800/40 p-5 text-sm text-slate-300">
        <h2 className="text-base font-bold text-white">
          ¿Tu bolso no entra? Mira{" "}
          <Link href="/equipaje" className="text-amber-400 hover:underline">
            las reglas detalladas
          </Link>
        </h2>
        <p className="mt-2">
          Cada aerolínea tiene política específica de equipaje cabina,
          facturado, prioridad y gate fee. Consulta nuestras 15 guías por
          aerolínea para evitar penalizaciones de hasta €75.
        </p>
      </section>
    </main>
  );
}
