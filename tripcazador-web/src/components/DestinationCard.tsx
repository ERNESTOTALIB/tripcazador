/**
 * DestinationCard — tarjeta visual de destino con fotografía real de fondo.
 * Usa Unsplash CDN (whitelisted en next.config y CSP img-src). Fallback a
 * gradiente si no hay imageUrl. Incluye skeleton y overlay para legibilidad.
 */

import Image from "next/image";

export interface DestinationCardProps {
  name: string;
  slug: string;
  /** URL absoluta de imagen de fondo (Unsplash, CDN...). Si no, usa gradient. */
  imageUrl?: string;
  /** Gradient Tailwind fallback — ej: "from-orange-700 via-amber-800 to-red-900" */
  gradient?: string;
  /** Texto corto opcional bajo el nombre (ej. "Desde 389€") */
  tagline?: string;
  /** Categoría corta arriba ("Safari", "Paraíso", etc.) */
  kicker?: string;
  /** Relación de aspecto. "tall" = 4/5 (home), "wide" = 16/10, "square" = 1/1 */
  ratio?: "tall" | "wide" | "square";
  /** Priority de Next Image (LCP en home) */
  priority?: boolean;
}

const RATIO_CLASS: Record<NonNullable<DestinationCardProps["ratio"]>, string> = {
  tall: "aspect-[4/5]",
  wide: "aspect-[16/10]",
  square: "aspect-square",
};

export function DestinationCard({
  name,
  slug,
  imageUrl,
  gradient = "from-gray-700 via-gray-800 to-gray-900",
  tagline,
  kicker,
  ratio = "tall",
  priority = false,
}: DestinationCardProps) {
  return (
    <a
      href={`/destinos/${slug}`}
      className={`
        relative group block rounded-2xl overflow-hidden ${RATIO_CLASS[ratio]}
        border border-white/10 card-hover bg-gradient-to-br ${gradient}
        focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950
      `}
      aria-label={`Ver destino ${name}${tagline ? " — " + tagline : ""}`}
    >
      {/* Foto de fondo */}
      {imageUrl && (
        <Image
          src={imageUrl}
          alt=""
          aria-hidden="true"
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
          priority={priority}
          quality={80}
        />
      )}

      {/* Overlay multi-layer para contraste AAA sobre cualquier foto */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-transparent pointer-events-none mix-blend-multiply" />

      {/* Grid radar muy sutil, sólo hover */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 mix-blend-screen pointer-events-none"
        viewBox="0 0 200 250"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id={`grid-${slug}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" stroke="white" strokeWidth="0.4" fill="none" />
          </pattern>
        </defs>
        <rect width="200" height="250" fill={`url(#grid-${slug})`} />
      </svg>

      {/* Kicker arriba */}
      {kicker && (
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[10px] uppercase tracking-widest text-amber-300 font-semibold border border-amber-400/20">
            {kicker}
          </span>
        </div>
      )}

      {/* Texto inferior */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-5">
        <div className="text-white font-bold text-xl sm:text-2xl leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          {name}
        </div>
        {tagline && (
          <div className="text-white/85 text-xs sm:text-sm mt-1 drop-shadow-md">
            {tagline}
          </div>
        )}
        <div className="mt-3 flex items-center gap-1 text-amber-300 text-xs font-medium opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          Ver guía
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
        </div>
      </div>
    </a>
  );
}
