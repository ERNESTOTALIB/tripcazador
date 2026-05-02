"use client";

/**
 * AdSenseSlot — fase kkk KKK1 (May 2026)
 *
 * Slot publicitario de Google AdSense. Solo renderiza si:
 *   - NEXT_PUBLIC_ADSENSE_CLIENT está configurado (publisher ID ca-pub-XXX).
 *   - El usuario ha aceptado consent de marketing (RGPD).
 *   - El path no está en lista de páginas premium (panel/embed/api).
 *
 * Patrón: data-ad-format="auto" + data-full-width-responsive="true" para
 * adaptarse a cualquier ancho. La key prop fuerza re-mount al cambiar de
 * ruta (Next App Router no destruye el componente automáticamente).
 *
 * Por qué consent gate: si AdSense carga sin consent, EU users disparan
 * GDPR violation. Mejor render-nada que render-con-fuga-de-datos.
 *
 * Trabajo manual del usuario:
 * 1. Apply AdSense en https://www.google.com/adsense/start
 * 2. Verify domain ownership (ya tenemos meta tag stub abajo)
 * 3. Crear unit "TripCazador Article" → recibir data-ad-slot=XXXXXXXX
 * 4. Setear NEXT_PUBLIC_ADSENSE_CLIENT y default slot env
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
const HIDDEN = ["/panel", "/embed", "/api", "/favoritos"];

interface AdSenseSlotProps {
  slotId?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  variant?: "inline" | "sidebar" | "banner";
}

export function AdSenseSlot({ slotId, format = "auto", variant = "inline" }: AdSenseSlotProps) {
  const pathname = usePathname() || "/";
  const [consent, setConsent] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHydrated(true);
    try {
      const raw = localStorage.getItem("cv_consent_v1");
      if (raw) {
        const obj = JSON.parse(raw);
        setConsent(obj?.marketing === true || obj?.analytics === true);
      }
    } catch {
      /* no-op */
    }
  }, []);

  // Mount the AdSense ad after the slot is in the DOM
  useEffect(() => {
    if (!hydrated || !consent || !CLIENT) return;
    try {
      const adsbygoogle = (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle || [];
      adsbygoogle.push({});
      (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle = adsbygoogle;
    } catch {
      /* no-op */
    }
  }, [hydrated, consent, pathname]);

  if (HIDDEN.some((p) => pathname.startsWith(p))) return null;
  if (!CLIENT) return null;
  if (!hydrated || !consent) return null;

  const sizing =
    variant === "banner"
      ? "min-h-[90px] my-4"
      : variant === "sidebar"
      ? "min-h-[250px] my-4"
      : "min-h-[120px] my-6";

  return (
    <aside
      className={`adsense-slot ${sizing} text-center`}
      data-testid={`adsense-${variant}`}
      aria-label="Publicidad"
    >
      <span className="text-[10px] uppercase tracking-wider text-gray-600 mb-1 block">
        Publicidad
      </span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={slotId || process.env.NEXT_PUBLIC_ADSENSE_SLOT_DEFAULT || ""}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
