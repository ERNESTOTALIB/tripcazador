/**
 * /offline — SSS425 (23 may 2026)
 *
 * Página fallback para navigation requests cuando el dispositivo está
 * sin conexión. Sirve los últimos 50 deals desde deals-latest.json
 * (precacheada por sw-pwa.js).
 *
 * Server component static — el SW serve este HTML pre-renderizado
 * desde cache. Cliente lee /deals-latest.json (también precacheado)
 * para mostrar deals.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { OfflineDealsList } from "@/components/OfflineDealsList";

export const metadata: Metadata = {
  title: "Sin conexión · TripCazador",
  description: "Los últimos chollos que detectamos, disponibles offline.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <div className="mb-3 text-5xl">📡</div>
        <h1 className="text-3xl font-bold text-white">Sin conexión</h1>
        <p className="mt-3 text-slate-300">
          Estos son los últimos chollos que detectamos antes de que perdieras
          conexión. Vuelve a conectar para ver datos en tiempo real.
        </p>
      </header>

      <OfflineDealsList />

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-block rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-400"
        >
          Reintentar conexión
        </Link>
      </div>

      <footer className="mt-10 border-t border-slate-800 pt-4 text-center text-xs text-slate-500">
        Versión offline · TripCazador PWA
      </footer>
    </main>
  );
}
