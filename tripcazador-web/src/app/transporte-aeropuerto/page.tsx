import type { Metadata } from "next";
import Link from "next/link";
import { TRANSPORTE_AEROPUERTO } from "@/lib/transporte_aeropuerto_catalog";
import { breadcrumbSchema } from "@/lib/schema_helpers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Transporte aeropuerto-centro España 2026: 15 ciudades, todas las opciones",
  description: "Cómo llegar del aeropuerto al centro en 15 ciudades de España. Metro, tren, bus, taxi, VTC: precios, tiempos, frecuencias y tips locales.",
  alternates: { canonical: `${SITE_URL}/transporte-aeropuerto` },
};

export default function TransporteAeropuertoHubPage() {
  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Transporte aeropuerto", url: "/transporte-aeropuerto" },
  ]);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <header className="mb-8 text-center">
        <div className="text-5xl">🚇✈️</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Transporte aeropuerto-centro España
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          {TRANSPORTE_AEROPUERTO.length} ciudades con todas las opciones reales
          (metro, tren, bus, taxi, VTC). Precios, tiempos, frecuencias y trucos
          locales que solo sabe quien vive ahí.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TRANSPORTE_AEROPUERTO.map((c) => {
          const cheapest = [...c.options].sort((a, b) => a.precioEur - b.precioEur)[0];
          const fastest = [...c.options].sort((a, b) => a.tiempoMin - b.tiempoMin)[0];
          return (
            <Link
              key={c.slug}
              href={`/transporte-aeropuerto/${c.slug}`}
              className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 transition-colors hover:border-amber-500/40"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-bold text-white">{c.ciudad}</h2>
                <span className="text-xs text-slate-500">{c.iata}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {c.distanciaKm} km · {c.options.length} opciones
              </p>
              <p className="mt-2 text-xs text-emerald-300">
                Desde {cheapest.precioEur} € · Más rápido {fastest.tiempoMin} min
              </p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
