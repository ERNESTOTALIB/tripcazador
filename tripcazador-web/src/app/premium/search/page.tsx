import type { Metadata } from "next";
import DeepSearchClient from "@/components/DeepSearchClient";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Deep Search Premium — TripCazador",
  description:
    "Buscador premium que rastrea TODAS las combinaciones de aeropuertos cercanos × fechas flexibles para encontrarte el ahorro real máximo. Como tener el cazador trabajando solo para ti.",
  alternates: { canonical: "/premium/search" },
  robots: { index: true, follow: true },
};

export const revalidate = 3600;

export default function PremiumSearchPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Deep Search Premium",
    provider: { "@type": "Organization", name: "TripCazador", url: "https://tripcazador.com" },
    description:
      "Búsqueda premium multi-aeropuerto + fechas flexibles. Expande tu origen y destino a todos los aeropuertos cercanos y rastrea ±N días para encontrar ahorros reales típicamente del 25-50% sobre el precio directo.",
    areaServed: "Worldwide",
    offers: {
      "@type": "Offer",
      price: "2.99",
      priceCurrency: "EUR",
      description: "Premium membership €2.99/mes incluye Deep Search ilimitado",
    },
  };

  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <JsonLd data={jsonLd} />

      <div className="text-center mb-10">
        <span className="inline-block bg-amber-100 text-amber-900 text-xs font-bold tracking-widest px-3 py-1 rounded-full mb-4">
          PREMIUM · DEEP SEARCH
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Encuentra el chollo real para tu ruta exacta
        </h1>
        <p className="text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
          Dinos a dónde quieres ir y cuándo. Nuestro motor expande tu origen
          y destino a <strong>todos los aeropuertos cercanos</strong> y rastrea
          <strong> ±3 días alrededor de tus fechas</strong>. Ahorro real medio:
          25-50% vs búsqueda directa.
        </p>
      </div>

      <DeepSearchClient />

      <section className="mt-12 grid sm:grid-cols-3 gap-4 text-center">
        <div className="bg-slate-50 rounded-2xl p-5">
          <div className="text-3xl font-extrabold text-slate-900">134</div>
          <div className="text-xs font-semibold text-slate-600 tracking-widest mt-1">
            AEROPUERTOS
          </div>
          <div className="text-xs text-slate-500 mt-2">en clusters explorados</div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-5">
          <div className="text-3xl font-extrabold text-slate-900">±7</div>
          <div className="text-xs font-semibold text-slate-600 tracking-widest mt-1">
            DÍAS FLEX
          </div>
          <div className="text-xs text-slate-500 mt-2">sobre tus fechas</div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-5">
          <div className="text-3xl font-extrabold text-emerald-600">↓ 38%</div>
          <div className="text-xs font-semibold text-slate-600 tracking-widest mt-1">
            AHORRO MEDIO
          </div>
          <div className="text-xs text-slate-500 mt-2">vs búsqueda directa</div>
        </div>
      </section>

      <section className="mt-14 bg-slate-900 text-white rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-amber-400 mb-4">
          ¿Cómo funciona?
        </h2>
        <ol className="space-y-4 text-slate-200">
          <li className="flex gap-3">
            <span className="bg-amber-400 text-slate-900 font-bold rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
              1
            </span>
            <span>
              Eliges <strong>origen + destino + fechas aproximadas</strong>.
              Por ejemplo &ldquo;Madrid → Bali, 15-25 sep&rdquo;.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="bg-amber-400 text-slate-900 font-bold rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
              2
            </span>
            <span>
              Expandimos a clusters: <strong>Madrid (MAD+TOJ)</strong> ×{" "}
              <strong>Bali (DPS+SUB)</strong> = 4 combinaciones.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="bg-amber-400 text-slate-900 font-bold rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
              3
            </span>
            <span>
              Rastreamos <strong>cada combinación × ±3 días</strong> = 28
              búsquedas. El cazador trabaja solo para tu ruta.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="bg-amber-400 text-slate-900 font-bold rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0">
              4
            </span>
            <span>
              Te devolvemos las <strong>top 10 opciones rankeadas</strong>{" "}
              por ahorro real con explicación de por qué cada una es chollo.
            </span>
          </li>
        </ol>
      </section>

      <section className="mt-10 text-center text-sm text-slate-500">
        <p>
          Deep Search está en beta abierta — gratis para todos en mayo 2026.
          A partir de junio, incluido en Premium €2.99/mes.
        </p>
      </section>
    </main>
  );
}
