"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/tracker";

/**
 * PageViewTracker — fase tt-TT4
 *
 * Component client que escucha cambios de pathname (Next App Router) y
 * dispara un evento page_view a /api/track. Esto alimenta /panel con qué
 * páginas concretamente reciben tráfico — sin esto sólo veíamos contador
 * agregado de Cloudflare sin granularidad.
 *
 * Uso: añadir en app/layout.tsx (root) — se renderiza vacío.
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    trackPageView({ path: pathname });
  }, [pathname]);

  return null;
}
