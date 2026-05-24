import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Vuelos baratos desde México México",
  description:
    "Chollos de vuelos desde Ciudad de México (MEX), Cancún (CUN), Guadalajara (GDL) y Monterrey (MTY). Cazamos errores de tarifa diariamente para viajeros mexicanos.",
  alternates: {
    canonical: "https://tripcazador.com/mx",
    languages: {
      "es-ES": "https://tripcazador.com",
      "es-MX": "https://tripcazador.com/mx",
      "es-AR": "https://tripcazador.com/ar",
      "es-CL": "https://tripcazador.com/cl",
    },
  },
};

export default function MexicoPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <header className="text-center">
        <div className="text-5xl mb-4">🇲🇽</div>
        <h1 className="text-4xl font-bold text-white mb-3">
          Vuelos baratos desde México
        </h1>
        <p className="text-lg text-gray-300">
          Chollos de vuelos cazados desde aeropuertos mexicanos: México DF (MEX),
          Cancún (CUN), Guadalajara (GDL), Monterrey (MTY).
        </p>
      </header>

      <section className="rounded-2xl border border-amber-500/30 bg-gray-900/60 p-6 space-y-3">
        <h2 className="text-xl font-bold text-amber-400">Hubs principales para mexicanos</h2>
        <ul className="space-y-2 text-gray-300">
          <li>✈ <strong>MEX → MAD</strong>: vuelos directos Aeroméxico, Iberia, Air Europa desde $850 USD ida/vuelta</li>
          <li>✈ <strong>CUN → MAD</strong>: temporada baja sept-nov desde $700 USD</li>
          <li>✈ <strong>MEX → BOG/LIM</strong>: hub Centro/Suramérica desde $400 USD</li>
          <li>✈ <strong>MEX → JFK/LAX</strong>: AeroMéxico y United desde $350 USD</li>
        </ul>
        <p className="text-sm text-gray-400 pt-2">
          Variantes futuras: MEX→Tokio (vía LAX), MEX→Bali (vía DFW+SIN), CUN→Lisboa (TAP).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-white">Próximamente: catálogo dedicado para México</h2>
        <p className="text-gray-300">
          Estamos cazando rutas específicas desde aeropuertos mexicanos. Mientras
          tanto, explora todos los chollos cazados en tiempo real:
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
          <Link href="/ar" className="text-amber-400 hover:underline">🇦🇷 Argentina</Link>
          <Link href="/cl" className="text-amber-400 hover:underline">🇨🇱 Chile</Link>
          <Link href="/" className="text-amber-400 hover:underline">🇪🇸 España</Link>
        </div>
      </section>
    </div>
  );
}
