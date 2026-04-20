"use client";

/**
 * FavoriteButton — icono corazón para marcar/desmarcar un deal como favorito.
 *
 * - Usa `useFavorites` para estado + persistencia en localStorage.
 * - Optimizado para ir absolute positioned sobre la imagen del DealCard.
 * - A11y: aria-pressed + aria-label dinámicos. Visible en reduced-motion.
 * - No propaga el click al contenedor padre (evita abrir el deal).
 */

import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";
import { track } from "@/lib/analytics";

interface FavoriteButtonProps {
  dealId: string;
  /** Posiciona absoluto sobre la imagen (top-right) cuando true. */
  floating?: boolean;
  /** Tamaño del icono en px. */
  size?: number;
}

export function FavoriteButton({
  dealId,
  floating = false,
  size = 16,
}: FavoriteButtonProps) {
  const { has, toggle, ready } = useFavorites();
  const active = has(dealId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(dealId);
    track({
      name: active ? "favorite_removed" : "favorite_added",
      params: { deal_id: dealId },
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!ready}
      aria-pressed={active}
      aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      title={active ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={`
        inline-flex items-center justify-center rounded-full
        transition-colors duration-150
        ${floating
          ? "absolute top-3 right-3 w-8 h-8 bg-gray-950/60 hover:bg-gray-900/80 backdrop-blur-md border border-gray-700/60"
          : "w-7 h-7 hover:bg-gray-800"}
        ${active ? "text-amber-400" : "text-gray-300 hover:text-amber-300"}
        disabled:opacity-40 disabled:cursor-not-allowed
      `}
    >
      <Heart
        size={size}
        fill={active ? "currentColor" : "none"}
        strokeWidth={2}
      />
    </button>
  );
}
