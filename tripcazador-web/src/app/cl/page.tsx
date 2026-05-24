import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Vuelos baratos desde Chile Chile",
  description:
    "Chollos de vuelos desde Santiago (SCL) y Iquique. Especializados en rutas a Europa, EEUU y resto de Latam para viajeros chilenos.",
  alternates: {
    canonical: "https://tripcazador.com/cl",
    languages: {
      "es-ES": "https://tripcazador.com",
      "es-MX": "https://tripcazador.com/mx",
      "es-AR": "https://tripcazador.com/ar",
      "es-CL": "https://tripcazador.com/cl",
    },
  },
};

export default function ChilePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <header className="text-center">
        <div className="text-5xl mb-4">🇨🇱</div>
        <h1 className="text-4xl font-bold text-white mb-3">
          Vuelos baratos desde Chile
        </h1>
        <p className="text-lg text-gray-300">
          Chollos detectados desde Santiago (SCL). Rutas frecuentes a Europa, EEUU,
          Latam y Asia con conexiones optimizadas.
        </p>
      </header>

      <section className="rounded-2xl border border-amber-500/30 bg-gray-900/60 p-6 space-y-3">
        <h2 className="text-xl font-bold text-amber-400">Rutas frecuentes</h2>
        <ul className="space-y-2 text-gray-300">
          <li>✈ <strong>SCL → MAD/BCN</strong>: LATAM/Iberia/Air Europa desde USD 850 directo</li>
          <li>✈ <strong>SCL → MIA</strong>: LATAM/American desde USD 600</li>
          <li>✈ <strong>SCL → EZE/LIM</strong>: cabotaje desde USD 180</li>
          <li>✈ <strong>SCL → CDMX</strong>: AeroMéxico/LATAM desde USD 550</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-white">Catálogo chileno en construcción</h2>
        <p className="text-gray-300">
          El motor está expandiendo cobertura para Chile. Mientras:
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/deals"
            className="inline-flex items-center px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-colors"
          >
            Ver chollos en vivo →
          </Link>
          <Link
            href="/telegram"
            className="inline-flex items-center px-5 py-3 rounded-xl border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-bold transition-colors"
          >
            Recibir alertas en Telegram
          </Link>
        </div>
      </section>

      <section className="rounded-xl bg-gray-900/40 border border-gray-800 p-5">
        <h3 className="text-lg font-bold text-white mb-2">Otros mercados Latam</h3>
        <div className="flex gap-3 flex-wrap text-sm">
          <Link href="/mx" className="text-amber-400 hover:underline">🇲🇽 México</Link>
          <Link href="/ar" className="text-amber-400 hover:underline">🇦🇷 Argentina</Link>
          <Link href="/" className="text-amber-400 hover:underline">🇪🇸 España</Link>
        </div>
      </section>
    </div>
  );
}
