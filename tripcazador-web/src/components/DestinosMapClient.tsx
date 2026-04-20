"use client";

/**
 * TripCazador — DestinosMapClient
 *
 * Wrapper cliente del mapa Leaflet. Motivo: Leaflet toca `window` en import,
 * por lo que hay que cargarlo con next/dynamic({ ssr: false }). Pero next/dynamic
 * con ssr:false debe invocarse desde un client component — no desde /destinos
 * que es un server component (con export const dynamic = "force-static").
 *
 * Este wrapper aísla esa complejidad: el server component importa
 * <DestinosMapClient deals={...} /> como un componente normal.
 */

import dynamic from "next/dynamic";
import type { Deal } from "@/lib/api";

const DestinosMap = dynamic(() => import("./DestinosMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full rounded-2xl border border-gray-800 bg-gray-900/40 flex items-center justify-center text-gray-500 text-sm">
      Cargando mapa…
    </div>
  ),
});

export function DestinosMapClient({ deals }: { deals: Deal[] }) {
  return <DestinosMap deals={deals} />;
}
