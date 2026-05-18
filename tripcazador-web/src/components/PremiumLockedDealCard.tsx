"use client";

/**
 * PremiumLockedDealCard — SSS305 (18 may 2026)
 *
 * Card overlay locked para deals premium_only cuando el visitor NO
 * es Premium. Muestra:
 *  - imagen blurred + foto visible
 *  - ruta (origin → destination) — sin ocultar
 *  - precio BLURRED + savings BLURRED
 *  - badge dorado "🔒 Premium only"
 *  - CTA "Únete Premium 2,99€/mes" → /premium?utm_source=locked_deal&deal_id=xxx
 *
 * Si visitor es Premium, NO renderiza nada (el caller debería mostrar
 * el deal normal entonces).
 *
 * Anti-bypass: el precio blurred es UI; el verdadero gate está en el
 * server-side `/api/deals` que filtra premium_only deals si no Premium
 * cookie. Esto es solo UX — el deal nunca llega al cliente.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getPremiumStatus } from "@/lib/premium";
import { tcTrack } from "@/lib/track_client";
import { safeImageUrl } from "@/lib/api";

interface Props {
  dealId: string;
  origin: string;
  destination: string;
  cityFrom?: string;
  cityTo?: string;
  imageUrl?: string;
  cabin?: string;
  savingsPct?: number;
}

export function PremiumLockedDealCard({
  dealId,
  origin,
  destination,
  cityFrom,
  cityTo,
  imageUrl,
  cabin,
  savingsPct,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    setIsPremium(getPremiumStatus().active);
    setMounted(true);
    // Track view (event) — solo dispara si no Premium
    if (!getPremiumStatus().active) {
      tcTrack("premium_only_view", { dealId });
    }
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { active: boolean };
      setIsPremium(detail.active);
    };
    window.addEventListener("tc:premium-changed", onChange);
    return () => window.removeEventListener("tc:premium-changed", onChange);
  }, [dealId]);

  // Premium users no ven este card — el caller debería renderizar el deal normal
  if (mounted && isPremium) return null;

  const safeImg = imageUrl ? safeImageUrl(imageUrl) : "";

  function handleUnlock() {
    tcTrack("premium_only_unlock_click", { dealId });
  }

  return (
    <article className="relative rounded-2xl overflow-hidden border border-amber-500/50 bg-gray-900 group">
      <div className="relative aspect-[16/10] bg-gray-800">
        {safeImg && (
          <Image
            src={safeImg}
            alt={`${cityFrom || origin} → ${cityTo || destination}`}
            fill
            className="object-cover blur-sm group-hover:blur-md transition-all"
            sizes="(min-width: 768px) 33vw, 100vw"
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80" />
        <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-amber-500 text-black text-[11px] font-bold uppercase tracking-wider">
          🔒 Premium only
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-amber-400 text-lg">{origin}</span>
          <span className="text-gray-500">→</span>
          <span className="font-bold text-amber-400 text-lg">{destination}</span>
        </div>
        <div className="text-xs text-gray-300">
          {cityTo || destination}
          {cabin && cabin !== "economy" && (
            <span className="ml-2 text-amber-300 capitalize">· {cabin}</span>
          )}
        </div>

        {/* Precio blurred */}
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-white select-none filter blur-md">
            XX €
          </span>
          {typeof savingsPct === "number" && (
            <span className="text-rose-400 font-semibold text-sm filter blur-md select-none">
              -{Math.round(savingsPct)}%
            </span>
          )}
        </div>

        <Link
          href={`/premium?utm_source=locked_deal&deal_id=${encodeURIComponent(dealId)}`}
          onClick={handleUnlock}
          className="block w-full text-center py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg"
        >
          Únete Premium 2,99 €/mes para ver
        </Link>
        <p className="text-[11px] text-gray-500 text-center">
          Deals exclusivos: error fares, descuentos &gt;70% y picks VIP del equipo.
        </p>
      </div>
    </article>
  );
}
