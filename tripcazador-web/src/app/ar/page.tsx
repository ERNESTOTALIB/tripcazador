import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Vuelos baratos desde Argentina | TripCazador Argentina",
  description:
    "Chollos de vuelos desde Buenos Aires (EZE/AEP), Córdoba (COR) y Mendoza (MDZ). Especializados en vuelos hacia Europa, México y Norteamérica para viajeros argentinos.",
  alternates: {
    canonical: "https://tripcazador.com/ar",
    languages: {
      "es-ES": "https://tripcazador.com",
      "es-MX": "https://tripcazador.com/mx",
      "es-AR": "https://tripcazador.com/ar",
      "es-CL": "https://tripcazador.com/cl",
    },
  },
};

export default function ArgentinaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <header className="text-center">
        <div className="text-5xl mb-4">🇦🇷</div>
        <h1 className="text-4xl font-bold text-white mb-3">
          Vuelos baratos desde Argentina
        </h1>
        <p className="text-lg text-gray-300">
          Chollos detectados desde Buenos Aires (EZE/AEP), Córdoba (COR) y Mendoza
          (MDZ). Foco en rutas a Europa, México y EEUU con escalas optimizadas.
        </p>
      </header>

      <section className="rounded-2xl border border-amber-500/30 bg-gray-900/60 p-6 space-y-3">
        <h2 className="text-xl font-bold text-amber-400">Rutas frecuentes</h2>
        <ul className="space-y-2 text-gray-300">
          <li>✈ <strong>EZE → MAD/BCN</strong>: vuelos directos Aerolíneas, Iberia, Air Europa desde USD 800 ida/vuelta</li>
          <li>✈ <strong>EZE → MIA/JFK</strong>: American/AeroMéxico/LATAM desde USD 700</li>
          <li>✈ <strong>EZE → SCL/LIM</strong>: cabotaje regional Latam desde USD 200</li>
          <li>✈ <strong>EZE → MEX/CUN</strong>: AeroMéxico vía CDMX desde USD 600</li>
        </ul>
        <p className="text-sm text-gray-400 pt-2">
          Tip cazador: error fares Buenos Aires-Europa son frecuentes en abril-mayo
          (low season austral). Activa alerta Telegram para no perdértelos.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-white">Próximamente: catálogo argentino</h2>
        <p className="text-gray-300">
          Estamos ampliando el motor con rutas específicas para usuarios argentinos.
          Mientras tanto:
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
          <Link href="/cl" className="text-amber-400 hover:underline">🇨🇱 Chile</Link>
          <Link href="/" className="text-amber-400 hover:underline">🇪🇸 España</Link>
        </div>
      </section>
    </div>
  );
}
