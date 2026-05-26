import type { Metadata } from "next";
import Link from "next/link";
import { DUTY_FREE } from "@/lib/duty_free_catalog";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Duty-free aeropuertos España 2026: análisis honest 10 aeropuertos",
  description: "¿Merece la pena comprar duty-free? Análisis por categoría (alcohol, perfumes, tabaco, productos locales) en 10 aeropuertos ES. Trampas a evitar.",
  alternates: { canonical: `${SITE_URL}/duty-free` },
};

export default function DutyFreeHubPage() {
  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Duty-free", url: "/duty-free" },
  ]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <header className="mb-8 text-center">
        <div className="text-5xl">🛍️✈️</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Duty-free aeropuertos España</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          {DUTY_FREE.length} aeropuertos analizados con honestidad: dónde SÍ
          merece la pena (alcohol premium, perfumes, productos locales) y dónde
          NO (chocolate, alimentación básica, tabaco intra-EU).
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DUTY_FREE.map((d) => (
          <Link
            key={d.iata}
            href={`/duty-free/${d.iata.toLowerCase()}`}
            className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 transition-colors hover:border-amber-500/40"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="font-bold text-white">{d.iata} {d.ciudad}</h2>
              <span className="text-xs text-slate-500">{d.categorias.length} categorías</span>
            </div>
            <p className="mt-1 text-xs text-amber-300">
              {d.marcas.slice(0, 2).join(", ")}…
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
