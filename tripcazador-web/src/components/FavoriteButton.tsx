"use client";

/**
 * FavoriteButton — fase iii III1 (May 2026)
 *
 * Heart toggle. Re-renders cuando otros componentes (otra DealCard, /favoritos)
 * añaden/quitan favoritos via subscribeFavorites.
 *
 * Tamaños: "card" para DealCard (esquina abs), "row" para DealRow (inline),
 * "inline" para uso libre.
 */
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import {
  isFavorite,
  toggleFavorite,
  subscribeFavorites,
  type FavoriteDeal,
} from "@/lib/favorites";

interface FavoriteButtonProps {
  deal: Omit<FavoriteDeal, "saved_at">;
  variant?: "card" | "row" | "inline";
  className?: string;
}

export function FavoriteButton({
  deal,
  variant = "card",
  className = "",
}: FavoriteButtonProps) {
  const [active, setActive] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setActive(isFavorite(deal.id));
    setHydrated(true);
    return subscribeFavorites(() => {
      setActive(isFavorite(deal.id));
    });
  }, [deal.id]);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleFavorite(deal);
    setActive(next);
    // tracking opcional
    if (typeof window !== "undefined" && (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag) {
      (window as unknown as { gtag: (...a: unknown[]) => void }).gtag("event", "favorite_toggle", {
        deal_id: deal.id,
        active: next,
        destination: deal.destination,
      });
    }
  }

  // Variantes visuales
  const baseStyles =
    "inline-flex items-center justify-center rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300";
  const sizes = {
    card:
      "w-9 h-9 bg-gray-900/70 backdrop-blur-md hover:bg-gray-900/90 absolute top-3 left-12 z-10",
    row: "w-9 h-9 bg-transparent hover:bg-gray-800",
    inline: "w-8 h-8 hover:bg-gray-800",
  } as const;

  // Mientras no esté hidratado renderizamos un placeholder no-active para evitar
  // hydration mismatch (cliente reads localStorage, server no).
  const showActive = hydrated && active;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseStyles} ${sizes[variant]} ${className}`}
      aria-label={showActive ? `Quitar de favoritos` : `Guardar en favoritos`}
      aria-pressed={showActive}
      data-testid={`favorite-button-${deal.id}`}
      title={showActive ? "Quitar de favoritos" : "Guardar en favoritos"}
    >
      <Heart
        size={variant === "inline" ? 16 : 18}
        strokeWidth={2}
        fill={showActive ? "#fbbf24" : "transparent"}
        color={showActive ? "#fbbf24" : "currentColor"}
        className={showActive ? "text-amber-400" : "text-gray-300"}
      />
    </button>
  );
}
