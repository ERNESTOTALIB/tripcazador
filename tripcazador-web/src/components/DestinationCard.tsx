/**
 * DestinationCard — tarjeta visual de destino con fondo gradiente + emoji,
 * sin depender de imágenes externas (zero bytes, 100% LCP friendly).
 * Se usa en la home y en /destinos.
 */

export interface DestinationCardProps {
  name: string;
  slug: string;
  emoji: string;
  /** Gradient Tailwind, ej: "from-orange-700 via-amber-800 to-red-900" */
  gradient: string;
  /** Texto corto opcional bajo el nombre (ej. "Desde 389€") */
  tagline?: string;
}

export function DestinationCard({ name, slug, emoji, gradient, tagline }: DestinationCardProps) {
  return (
    <a
      href={`/destinos/${slug}`}
      className={`
        relative group block rounded-xl overflow-hidden aspect-[4/5]
        bg-gradient-to-br ${gradient}
        border border-white/10 card-hover
        focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950
      `}
      aria-label={`Ver destino ${name}${tagline ? " — " + tagline : ""}`}
    >
      {/* Overlay oscuro para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 pointer-events-none" />

      {/* Patrón radar muy sutil */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full opacity-20 mix-blend-screen pointer-events-none"
        viewBox="0 0 200 250"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id={`grid-${slug}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" stroke="white" strokeWidth="0.4" fill="none" />
          </pattern>
        </defs>
        <rect width="200" height="250" fill={`url(#grid-${slug})`} />
        <circle cx="100" cy="125" r="40" stroke="white" strokeWidth="0.6" fill="none" opacity="0.35" />
        <circle cx="100" cy="125" r="70" stroke="white" strokeWidth="0.4" fill="none" opacity="0.2" />
      </svg>

      {/* Emoji gigante como "poster" */}
      <div
        aria-hidden="true"
        className="absolute top-4 right-3 text-5xl sm:text-6xl opacity-90 drop-shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
      >
        {emoji}
      </div>

      {/* Texto inferior */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="text-white font-semibold text-base sm:text-lg drop-shadow-md">{name}</div>
        {tagline && (
          <div className="text-white/80 text-xs sm:text-sm mt-0.5">{tagline}</div>
        )}
        <div className="text-amber-300 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Ver guía →
        </div>
      </div>
    </a>
  );
}
