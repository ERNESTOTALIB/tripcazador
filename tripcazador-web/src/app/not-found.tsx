/**
 * 404 root — SSS434 mejorado (23 may 2026)
 *
 * Custom not-found page que muestra sugerencias activas (deals top
 * + escapadas populares + destinos hot) para no perder al usuario.
 *
 * Mantiene robots noindex (no SEO) pero retención UX clave.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ESCAPADAS_CATALOG } from "@/lib/escapadas_catalog";

export const metadata: Metadata = {
  title: "Página no encontrada | TripCazador",
  description: "Esta ruta no existe. Mira los chollos activos o nuestras escapadas más populares.",
  robots: { index: false, follow: false },
};

// 6 escapadas populares (subconjunto del catálogo)
const POPULAR_DESTINOS = [
  { slug: "lisboa", name: "Lisboa", emoji: "🇵🇹" },
  { slug: "roma", name: "Roma", emoji: "🇮🇹" },
  { slug: "amsterdam", name: "Ámsterdam", emoji: "🇳🇱" },
  { slug: "berlin", name: "Berlín", emoji: "🇩🇪" },
  { slug: "praga", name: "Praga", emoji: "🇨🇿" },
  { slug: "estambul", name: "Estambul", emoji: "🇹🇷" },
];

export default function NotFound() {
  // 4 escapadas curadas para sugerencia
  const featuredEscapadas = ESCAPADAS_CATALOG.slice(0, 4);

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8 text-center">
        <div aria-hidden="true" className="text-6xl">🛰️</div>
        <h1 className="mt-3 text-4xl font-bold text-white sm:text-5xl">
          404 — <span className="text-amber-400">No encontramos esto</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-slate-300">
          Esta ruta no existe o el chollo ya expiró. Mira algunas
          alternativas activas:
        </p>
      </header>

      <section className="mb-8 grid gap-3 sm:grid-cols-3">
        <Link
          href="/deals"
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 text-center transition-colors hover:border-amber-500/70"
        >
          <div className="text-3xl">🎯</div>
          <div className="mt-2 text-base font-bold text-white">Chollos activos</div>
          <div className="mt-1 text-xs text-amber-300">Detectados ahora mismo</div>
        </Link>
        <Link
          href="/escapadas"
          className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-3xl">🎒</div>
          <div className="mt-2 text-base font-bold text-white">Escapadas fin de semana</div>
          <div className="mt-1 text-xs text-slate-400">12 destinos planificados</div>
        </Link>
        <Link
          href="/destinos"
          className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 text-center transition-colors hover:border-amber-500/50"
        >
          <div className="text-3xl">🌍</div>
          <div className="mt-2 text-base font-bold text-white">Explorar destinos</div>
          <div className="mt-1 text-xs text-slate-400">Catálogo completo</div>
        </Link>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-white">Destinos populares</h2>
        <div className="flex flex-wrap gap-2">
          {POPULAR_DESTINOS.map((d) => (
            <Link
              key={d.slug}
              href={`/destinos/${d.slug}`}
              className="rounded-full border border-slate-700 bg-slate-900/60 px-4 py-1.5 text-sm text-slate-200 transition-colors hover:border-amber-500/50 hover:text-amber-300"
            >
              {d.emoji} {d.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-white">📚 Escapadas listas para reservar</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {featuredEscapadas.map((e) => (
            <Link
              key={e.slug}
              href={`/escapadas/${e.slug}`}
              className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 transition-colors hover:border-amber-500/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white">
                  {e.emoji} {e.name}
                </span>
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
                  €{e.totalBudgetEur}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Vuelo €{e.avgFlightMadEur} · {e.flightHoursFromMad}h · 2-3 días
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 text-center text-sm text-slate-300">
        <p>
          ¿Sigues atascado? Vuelve a la{" "}
          <Link href="/" className="text-amber-400 hover:underline">
            home
          </Link>{" "}
          o entra a{" "}
          <Link href="/premium" className="text-amber-400 hover:underline">
            Premium
          </Link>{" "}
          (prueba 7 días gratis) para alertas en tiempo real.
        </p>
      </section>
    </main>
  );
}
