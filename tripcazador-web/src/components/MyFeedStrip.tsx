"use client";

/**
 * MyFeedStrip — fase jjj JJJ3 (May 2026)
 *
 * Si el user tiene favoritos guardados, muestra un strip personal en home con
 * mini-cards de cada uno + precio guardado + CTA "Ver chollos actuales".
 *
 * Por qué: para usuarios recurrentes, el primer thing que quieren ver es
 * "¿qué pasó con mis rutas guardadas?". Antes había que navegar a /favoritos.
 * Aquí lo subimos al hero de la home.
 *
 * Nota: el precio mostrado es el que estaba cuando guardó (snapshot). En una
 * fase futura podríamos hacer fetch a /api/deals?origin=X&destination=Y y
 * mostrar precio actual + delta — pero eso requiere N requests, mejor lazy.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Plane, ArrowRight } from "lucide-react";
import { getFavorites, subscribeFavorites, type FavoriteDeal } from "@/lib/favorites";

const MAX_VISIBLE = 6;

export function MyFeedStrip() {
  const [favs, setFavs] = useState<FavoriteDeal[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFavs(getFavorites());
    setHydrated(true);
    return subscribeFavorites(() => setFavs(getFavorites()));
  }, []);

  if (!hydrated || favs.length === 0) return null;

  const visible = favs.slice(0, MAX_VISIBLE);
  const more = Math.max(0, favs.length - MAX_VISIBLE);

  return (
    <section
      aria-labelledby="my-feed-heading"
      className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-gray-900 to-gray-950 p-5 sm:p-6"
      data-testid="my-feed-strip"
    >
      <header className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Heart size={18} className="text-amber-400" fill="#fbbf24" />
          <h2 id="my-feed-heading" className="text-lg sm:text-xl font-bold text-white">
            Tu feed
          </h2>
          <span className="text-xs text-gray-400">· {favs.length} {favs.length === 1 ? "guardado" : "guardados"}</span>
        </div>
        <Link
          href="/favoritos"
          className="text-xs text-amber-300 hover:text-amber-200 font-semibold inline-flex items-center gap-1"
        >
          Gestionar
          <ArrowRight size={12} />
        </Link>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {visible.map((f) => (
          <Link
            key={f.id}
            href={`/deals?origin=${encodeURIComponent(f.origin)}&destination=${encodeURIComponent(f.destination)}`}
            className="group relative flex flex-col gap-1.5 p-3 rounded-xl bg-gray-800/60 hover:bg-gray-800 border border-gray-700/40 hover:border-amber-500/30 transition-all min-h-[88px]"
          >
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="font-mono font-bold text-amber-400">{f.origin}</span>
              <Plane size={10} className="text-gray-500 rotate-90" aria-hidden />
              <span className="font-mono font-bold text-white">{f.destination}</span>
            </div>
            <div className="text-xs text-gray-300 truncate">
              {f.city_to || f.destination}
            </div>
            <div className="mt-auto flex items-end justify-between">
              <span className="text-base font-bold text-white">{f.price_eur.toFixed(0)}€</span>
              <span className="text-[10px] text-gray-500 group-hover:text-amber-300">
                Ver →
              </span>
            </div>
          </Link>
        ))}
        {more > 0 && (
          <Link
            href="/favoritos"
            className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-gray-800/40 hover:bg-gray-800 border border-dashed border-gray-700 hover:border-amber-500/30 text-gray-400 hover:text-amber-300 transition-all min-h-[88px]"
          >
            <span className="text-2xl font-bold">+{more}</span>
            <span className="text-[10px]">más</span>
          </Link>
        )}
      </div>
    </section>
  );
}
