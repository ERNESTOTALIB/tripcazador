"use client";

/**
 * TravelInsuranceCTA — fase kkk KKK4 (May 2026)
 *
 * CTA de seguro de viaje. Comisión típica $25-60 por venta. Alta conversion
 * porque el viajero internacional sabe que necesita seguro pero no sabe cuál.
 *
 * Implementación:
 *  - Si NEXT_PUBLIC_HEYMONDO_REF / NEXT_PUBLIC_SAFETYWING_REF están: usa esos.
 *  - Fallback: link directo con utm tracking propio.
 *
 * Heymondo es el partner por defecto en España (mejor coverage local + español).
 * SafetyWing es alternativa para nómadas digitales (mensual).
 *
 * Uso: footer de blog posts largos donde el lector ya tiene "intent" de viaje.
 */
import { Shield, ExternalLink } from "lucide-react";
import { tcTrack } from "@/lib/track_client";

const HEYMONDO_REF = process.env.NEXT_PUBLIC_HEYMONDO_REF || "";

interface Props {
  destination?: string;
  variant?: "compact" | "expanded";
}

export function TravelInsuranceCTA({ destination, variant = "compact" }: Props) {
  const utm = `utm_source=tripcazador&utm_medium=affiliate&utm_campaign=insurance${destination ? `_${destination.toLowerCase().replace(/\s+/g, "-")}` : ""}`;
  const ref = HEYMONDO_REF ? `&affiliate_id=${HEYMONDO_REF}` : "";
  const url = `https://www.heymondo.com/?${utm}${ref}`;

  if (variant === "compact") {
    return (
      <aside
        className="my-6 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 flex items-center gap-3"
        data-testid="insurance-cta"
      >
        <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-500/15 inline-flex items-center justify-center">
          <Shield size={18} className="text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-semibold">
            ¿Seguro de viaje{destination ? ` para ${destination}` : ""}?
          </p>
          <p className="text-xs text-gray-400">Cobertura médica, cancelación y equipaje desde €1.5/día</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          className="shrink-0 inline-flex items-center gap-1 px-3 py-2 min-h-[40px] rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors"
          onClick={() => trackClick(destination)}
        >
          Comparar
          <ExternalLink size={11} />
        </a>
      </aside>
    );
  }

  // expanded
  return (
    <section
      className="my-8 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-gray-950 p-5 sm:p-6"
      aria-labelledby="insurance-heading"
    >
      <header className="flex items-center gap-3 mb-3">
        <Shield size={22} className="text-emerald-400" />
        <h2 id="insurance-heading" className="text-base sm:text-lg font-bold text-white">
          Seguro de viaje{destination ? ` para ${destination}` : ""}
        </h2>
      </header>
      <p className="text-sm text-gray-400 mb-4">
        Antes de volar, asegura tu viaje. Cobertura médica internacional, cancelación, equipaje perdido y asistencia 24/7. Imprescindible para viajes fuera de la UE.
      </p>
      <ul className="text-xs text-gray-500 space-y-1 mb-4">
        <li>✓ Hasta €5M en gastos médicos</li>
        <li>✓ Cancelación por causa justificada (incluye COVID)</li>
        <li>✓ Equipaje perdido / retrasado</li>
        <li>✓ Repatriación incluida</li>
      </ul>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-colors"
        onClick={() => trackClick(destination)}
      >
        Comparar seguros desde €1.5/día
        <ExternalLink size={14} />
      </a>
      <p className="mt-2 text-[10px] text-gray-500 text-center">
        Enlace de afiliado · Mismo precio para ti, comisión para mantener TripCazador
      </p>
    </section>
  );
}

function trackClick(destination?: string) {
  if (typeof window === "undefined") return;
  // SSS185: emit a AMBOS — GA4 (gtag) + /api/p (tcTrack server-side, AdBlocker-resistant)
  const w = window as unknown as { gtag?: (...a: unknown[]) => void };
  if (w.gtag) {
    w.gtag("event", "affiliate_click", { provider: "heymondo", destination: destination || "generic" });
  }
  tcTrack("deal_click", { partner: "heymondo", destination: destination || "generic", source: "insurance_cta" });
}
