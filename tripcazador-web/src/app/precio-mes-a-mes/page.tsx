import type { Metadata } from "next";
import Link from "next/link";
import { MONTHLY_ROUTES } from "@/lib/monthly_prices";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Precio vuelos mes a mes 2026-2027 — TripCazador",
  description: "Descubre el mes más barato para volar a 12 destinos top: NYC, Cancún, Bangkok, Tokio, Sídney y más. Patrón estacional + sweet spots de booking.",
  alternates: { canonical: "https://tripcazador.com/precio-mes-a-mes" },
};

export default function MonthlyPriceIndex() {
  const routes = Object.entries(MONTHLY_ROUTES);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-amber-400">Inicio</Link>
        {" / "}
        <span className="text-gray-300">Precio mes a mes</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-amber-400">
          Precio mes a mes 2026-2027
        </h1>
        <p className="text-lg text-gray-300 mt-2 max-w-2xl">
          Mediana de precios por mes para las rutas más buscadas. Encuentra
          el mes óptimo para tu próximo viaje y evita los picos estacionales.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map(([slug, r]) => (
          <Link
            key={slug}
            href={`/precio-mes-a-mes/${slug}`}
            className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-amber-700 rounded-lg p-5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <p className="text-2xl font-bold text-amber-400">
              {r.origin} → {r.destination}
            </p>
            <p className="text-sm text-gray-300 mt-1">
              {r.origin_city} → {r.dest_city}
            </p>
            <p className="text-xs text-gray-500 mt-2">{r.country}</p>
            <p className="text-sm text-gray-400 mt-3">
              desde <span className="text-amber-300 font-semibold">{r.hints.basePrice}€</span>
            </p>
          </Link>
        ))}
      </section>

      <p className="text-xs text-gray-500 mt-8">
        Más rutas próximamente. ¿Quieres una específica?{" "}
        <Link href="/alertas" className="text-amber-400 hover:underline">
          Activa una alerta y te avisamos
        </Link>.
      </p>
    </main>
  );
}
