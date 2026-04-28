"use client";

/**
 * DestinationCard — fase jj G1: tarjeta visual de destino con foto Unsplash
 * real (AVIF responsive). Substituye los gradientes anteriores que el usuario
 * reportó como "no se visualizan imágenes".
 *
 * "use client" porque tiene onError handler en <img> (event handler).
 */

// Mapping slug → Unsplash photo ID (sin params — los añadimos al servir).
// TODOS LOS IDs ESTÁN VERIFICADOS HTTP 200 — fase jj G1.
// Cuando añadas uno nuevo, verifica primero con curl.
const DEST_PHOTOS: Record<string, string> = {
  tanzania: "1494500764479-0c8f2919a3d8",      // León africano ✓
  japon: "1493976040374-85c8e12f0c0e",         // Tokio neón ✓
  maldivas: "1573843981267-be1999ff37cd",      // Bungalows sobre el agua ✓
  "nueva-york": "1496442226666-8d4d0e62e6e9",  // Skyline NYC ✓
  bali: "1518002171953-a080ee817e1f",          // Bali rice terraces ✓
  "buenos-aires": "1589909202802-8f4aadce1849", // Caminito ✓ (mismo que DealCard EZE)
  tailandia: "1528181304800-259b08848526",     // Templo tailandés ✓
  sudafrica: "1547721064-da6cfb341d50",        // Cape Town ✓
  islandia: "1531168556467-80aace0d0144",      // Aurora ✓
  marrakech: "1539020140153-e479b8c22e70",     // Koutoubia ✓
  marruecos: "1597212618440-806262de4f6b",     // Marrakech ✓ (DealCard RAK)
  vietnam: "1528181304800-259b08848526",       // alias tailandia
  "costa-rica": "1473625247510-8ceb1760943f",  // playa tropical ✓
  // aliases comunes
  tokio: "1493976040374-85c8e12f0c0e",         // alias japon
  reikiavik: "1531168556467-80aace0d0144",     // alias islandia
  singapur: "1525625293386-3f8f99389edd",      // ✓
  praga: "1541849546-216549ae216d",            // ✓
  estambul: "1527838832700-5059252407fa",      // ✓
  lisboa: "1555881400-74d7acaacd8b",           // ✓
  oporto: "1555881400-74d7acaacd8b",           // alias lisboa
  cancun: "1552074284-5e88ef1aef18",           // ✓
  habana: "1500759285222-a95626b934cb",        // ✓
  bangkok: "1508009603885-50cf7c579365",       // ✓
  hanoi: "1528181304800-259b08848526",         // alias tailandia
  saigon: "1528181304800-259b08848526",        // alias tailandia
  sydney: "1506973035872-a4ec16b8e8d9",        // ✓
  tahiti: "1573843981267-be1999ff37cd",        // alias maldivas
  capetown: "1547721064-da6cfb341d50",         // alias sudafrica ✓
  doha: "1580418827493-f2b22c0a76cb",          // ✓
  dubai: "1512453979798-5ea266f8880c",         // ✓
  _DEFAULT: "1488646953014-85cb44e25828",      // foto genérica viaje ✓
};

export interface DestinationCardProps {
  name: string;
  slug: string;
  emoji: string;
  /** Gradient legacy (ya no se usa para fondo, sí para el dot indicador) */
  gradient?: string;
  /** Texto corto opcional bajo el nombre (ej. "Desde 389€") */
  tagline?: string;
  /** Si true, la imagen se carga eager (above-the-fold). Para el primer card. */
  eager?: boolean;
}

function destPhoto(slug: string, w: number = 800): string {
  const photoId = DEST_PHOTOS[slug] || DEST_PHOTOS._DEFAULT;
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${w}&q=78`;
}

export function DestinationCard({ name, slug, emoji, tagline, eager }: DestinationCardProps) {
  const photoId = DEST_PHOTOS[slug] || DEST_PHOTOS._DEFAULT;
  const baseUrl = `https://images.unsplash.com/photo-${photoId}`;

  return (
    <a
      href={`/destinos/${slug}`}
      className={`
        relative group block rounded-xl overflow-hidden aspect-[4/5]
        bg-gray-900 border border-white/10 card-hover
        focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950
      `}
      aria-label={`Ver destino ${name}${tagline ? " — " + tagline : ""}`}
    >
      {/* Foto Unsplash con AVIF/WebP/JPG fallback */}
      <picture>
        <source
          type="image/avif"
          srcSet={`${baseUrl}?fm=avif&w=400&q=78&auto=format&fit=crop 400w, ${baseUrl}?fm=avif&w=800&q=78&auto=format&fit=crop 800w`}
          sizes="(max-width: 640px) 50vw, 25vw"
        />
        <source
          type="image/webp"
          srcSet={`${baseUrl}?fm=webp&w=400&q=78&auto=format&fit=crop 400w, ${baseUrl}?fm=webp&w=800&q=78&auto=format&fit=crop 800w`}
          sizes="(max-width: 640px) 50vw, 25vw"
        />
        <img
          src={destPhoto(slug, 800)}
          alt={`Imagen del destino ${name}`}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            const t = e.currentTarget;
            t.style.display = "none";
          }}
        />
      </picture>

      {/* Gradient overlay oscuro para legibilidad del texto */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

      {/* Emoji top-right como acento decorativo (más pequeño que antes) */}
      <div
        aria-hidden="true"
        className="absolute top-3 right-3 text-3xl drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
      >
        {emoji}
      </div>

      {/* Texto inferior */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="text-white font-semibold text-base sm:text-lg drop-shadow-md">{name}</div>
        {tagline && (
          <div className="text-white/80 text-xs sm:text-sm mt-0.5">{tagline}</div>
        )}
        <div className="text-amber-300 text-xs mt-1.5 font-medium opacity-80 group-hover:opacity-100 transition-opacity">
          Ver guía →
        </div>
      </div>
    </a>
  );
}
