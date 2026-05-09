"use client";

/**
 * TrendingNowWidget — fase fff F3 (Apr 2026)
 *
 * Widget client-side para home: muestra las 5 rutas más cazadas hoy.
 * Refresca cada 5 min via SWR pattern (stale-while-revalidate del Cache-Control
 * del endpoint).
 *
 * Diseño: lista vertical compacta con badge de "trending up", route IATA grande
 * y conteo de clicks. Click → navega a /deals filtrado por destino.
 *
 * Por qué este widget: prueba social en tiempo real ("3.000 viajeros buscaron
 * MAD-BKK hoy"), aumenta confianza y conversión.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAirportByIata } from "@/lib/airports_catalog";
import { IATA_CITY_FALLBACK, EU_ORIGINS } from "@/lib/iata_city";

interface TrendingResponse {
  top_routes: Array<{ route: string; clicks: number }>;
  top_destinations: Array<{ destination: string; clicks: number }>;
  generated_at: string;
  source: string;
}

export function TrendingNowWidget() {
  const [data, setData] = useState<TrendingResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchTrending() {
      try {
        const res = await fetch("/api/trending", { cache: "default" });
        if (!res.ok) throw new Error("trending failed");
        const json = (await res.json()) as TrendingResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    fetchTrending();
    // Re-fetch cada 5 min para mantener datos frescos
    const interval = setInterval(fetchTrending, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (error || !data || data.top_routes.length === 0) return null;

  // BBBB03: filtrar rutas LATAM-internas que contaminen el feed visual.
  // Web es ES → no tiene sentido mostrar GIG-SAO, BSB-SAO como "trending".
  // Mantenemos route si origen está en EU_ORIGINS o destino tiene un mapping
  // EU/España conocido.
  const filteredRoutes = data.top_routes.filter((r) => {
    const [o] = r.route.split("-");
    if (!o) return false;
    return EU_ORIGINS.has(o.toUpperCase());
  });
  if (filteredRoutes.length === 0) return null;

  return (
    <section
      className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-gray-900 to-gray-950 p-5 sm:p-6"
      aria-labelledby="trending-now-heading"
      data-testid="trending-now-widget"
    >
      <header className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 id="trending-now-heading" className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span aria-hidden="true" className="text-xl">🔥</span>
            <span>Trending ahora</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Rutas más buscadas en las últimas 24h
          </p>
        </div>
        <span
          className="text-[10px] uppercase tracking-wider text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-1"
          aria-label="actualizado en vivo"
        >
          ● LIVE
        </span>
      </header>

      <ol className="space-y-2" data-testid="trending-list">
        {filteredRoutes.map((r, i) => {
          const [originIata, destIata] = r.route.split("-");
          // BBBB03: enriquecer con city name. getAirportByIata cubre el catálogo
          // OpenFlights principal; IATA_CITY_FALLBACK rellena códigos LATAM
          // que no estaban en el catálogo (SAO/RIO/IGU metropolitan codes).
          const dest = destIata
            ? getAirportByIata(destIata) || (
                IATA_CITY_FALLBACK[destIata.toUpperCase()]
                  ? { city: IATA_CITY_FALLBACK[destIata.toUpperCase()].city, emoji: "" }
                  : undefined
              )
            : undefined;
          return (
            <li
              key={r.route}
              className="flex items-center gap-3 group"
              data-testid={`trending-item-${i}`}
            >
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/15 text-amber-400 font-bold text-sm flex items-center justify-center"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <Link
                href={`/deals?destination=${encodeURIComponent(destIata || "")}`}
                className="flex-1 flex items-center gap-2 py-2 px-3 -mx-3 rounded-lg hover:bg-gray-800/50 transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-amber-300"
              >
                <span className="font-mono font-bold text-white text-sm sm:text-base">
                  {originIata}
                  <span className="mx-1.5 text-gray-500" aria-hidden="true">→</span>
                  {destIata}
                </span>
                {dest && (
                  <span className="text-xs text-gray-400 truncate flex-1">
                    · {dest.city} {dest.emoji}
                  </span>
                )}
                <span className="ml-auto text-xs text-amber-300/70 whitespace-nowrap" aria-hidden="true">
                  Ver chollos →
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-[10px] text-gray-500 text-center">
        Actualizado {new Date(data.generated_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </section>
  );
}
