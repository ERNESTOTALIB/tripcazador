"use client";

/**
 * HotelImage — SSS86 (May 2026)
 *
 * Wrapper de <img> con fallback visual gradient + emoji cuando la imagen
 * Unsplash falla al cargar (404, hotlink-blocked, network error, etc.).
 *
 * Usado por HotelCard, HotelGallery, /hoteles/[slug] hero.
 *
 * Por qué client component: necesitamos onError event handler, que sólo
 * funciona en client components. HotelCard sigue siendo server component
 * para SEO; sólo este wrapper es client.
 */
import { useState } from "react";
import { getHotelGradient } from "@/lib/hotel_image_fallback";

interface HotelImageProps {
  src: string;
  alt: string;
  /** Seed estable (slug del hotel) para gradient determinístico. */
  fallbackSeed: string;
  /** Emoji a mostrar centrado en el placeholder (default 🏨). */
  fallbackEmoji?: string;
  className?: string;
  loading?: "eager" | "lazy";
  decoding?: "async" | "sync" | "auto";
}

export function HotelImage({
  src,
  alt,
  fallbackSeed,
  fallbackEmoji = "🏨",
  className = "",
  loading = "lazy",
  decoding = "async",
}: HotelImageProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    const grad = getHotelGradient(fallbackSeed);
    return (
      <div
        role="img"
        aria-label={alt}
        data-hotel-fallback="true"
        className={`flex items-center justify-center select-none ${className}`}
        style={{
          background: grad,
          fontSize: "clamp(3rem, 12vw, 6rem)",
          lineHeight: 1,
        }}
      >
        <span aria-hidden="true">{fallbackEmoji}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={className}
      onError={() => setErrored(true)}
    />
  );
}
