import type { Metadata } from "next";
import Link from "next/link";
import { FlightSearchForm } from "@/components/FlightSearchForm";

export const revalidate = 86400; // 24h

export const metadata: Metadata = {
  title: "Buscar vuelos baratos en tiempo real — TripCazador",
  description: "Búsqueda real de vuelos: introduce origen, destino y fechas y te llevamos directo al booking engine de la aerolínea. Sin metasearch que infla precios.",
  alternates: { canonical: "https://tripcazador.com/buscar-vuelos" },
};

export default function BuscarVuelosPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        {" / "}
        <span className="text-gray-300">Buscar vuelos</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-amber-400">
          Buscar vuelos en tiempo real
        </h1>
        <p className="text-lg text-gray-300 mt-2 max-w-2xl">
          Introduce tu ruta y fechas. Te enviamos directamente a la web oficial
          de la aerolínea (cuando tiene deeplink) o a Skyscanner con el carrier
          pre-filtrado. <strong>Sin Kayak</strong>, sin pasos intermedios.
        </p>
      </header>

      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <FlightSearchForm />
      </section>

      <section className="mt-10 prose prose-invert max-w-none">
        <h2>Cómo funciona</h2>
        <ol>
          <li>Eliges aeropuerto origen y destino (autocompletado IATA).</li>
          <li>Eliges fechas (ida o ida-vuelta).</li>
          <li>Opcionalmente preferes una aerolínea concreta (Ryanair, Lufthansa, etc).</li>
          <li>Pulsas <strong>Buscar</strong> → te redirigimos al booking engine
            real con tu ruta + fecha + aerolínea pre-cargados.</li>
        </ol>

        <h2>¿Por qué no como Skyscanner directo?</h2>
        <p>
          TripCazador está enfocado en error fares y deals concretos. Esta
          página es para cuando ya sabes <strong>qué ruta y qué fechas</strong>
          quieres y solo necesitas reservar rápido. Si quieres explorar destinos,
          ve a <Link href="/destinos">/destinos</Link>. Si quieres ver lo que
          el motor caza, ve a <Link href="/deals">/deals</Link>.
        </p>

        <h2>Aerolíneas con deeplink directo</h2>
        <p>
          Estas aerolíneas reciben tu ruta + fechas pre-cargadas (no tienes que
          re-introducirlas):
        </p>
        <ul>
          <li><strong>Low-cost</strong>: Ryanair, easyJet, Wizz Air, Norwegian, Vueling.</li>
          <li><strong>Full-service</strong>: Lufthansa, KLM, Air France, British Airways, TAP Portugal, Air Europa, Turkish Airlines.</li>
        </ul>
        <p>
          Otras aerolíneas (Iberia, Qatar, Emirates, etc.) reciben la búsqueda
          via Skyscanner con el filtro de carrier preconfigurado — equivale a
          un click directo al resultado de esa aerolínea.
        </p>

        <p className="text-xs text-gray-500 mt-8">
          Los precios mostrados al hacer click son los reales del booking engine
          en tiempo real. TripCazador no inventa precios — solo te lleva
          rápido al resultado.
        </p>
      </section>
    </main>
  );
}
