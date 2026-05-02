/**
 * HotelAmenitiesList — fase BBB2
 *
 * Lista visual de amenities de un hotel. Server-renderizable — usa solo el
 * mapping de etiquetas de hotel_helpers + iconografía emoji.
 *
 * Diseño: 2 columnas mobile / 3 desktop, cada amenity con emoji + label.
 * Cuando hay >12 amenities, muestra "+ N más" como expander client-only
 * (omitido aquí para mantener server-only).
 */
import { AMENITY_LABELS, type Amenity, AMENITIES } from "@/lib/hotel_helpers";

interface HotelAmenitiesListProps {
  amenities: string[];
  className?: string;
}

export function HotelAmenitiesList({ amenities, className = "" }: HotelAmenitiesListProps) {
  // Filtramos los conocidos y los mantenemos en orden canónico de AMENITIES
  const validKeys = new Set(AMENITIES);
  const known = AMENITIES.filter((k) => validKeys.has(k) && amenities.includes(k));
  // Amenities desconocidos — los mostramos al final como genéricos
  const unknown = amenities.filter((a) => !validKeys.has(a as Amenity));

  if (known.length === 0 && unknown.length === 0) return null;

  return (
    <section
      className={`rounded-2xl border border-gray-800 bg-gray-900/60 p-6 ${className}`}
      data-testid="hotel-amenities"
      aria-labelledby="hotel-amenities-heading"
    >
      <h2 id="hotel-amenities-heading" className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        🛎️ Servicios e instalaciones
      </h2>
      <ul
        className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 list-none p-0"
        role="list"
      >
        {known.map((k) => {
          const meta = AMENITY_LABELS[k];
          return (
            <li
              key={k}
              className="flex items-center gap-2.5 text-sm text-gray-200"
              data-testid={`hotel-amenity-${k}`}
            >
              <span className="text-lg" aria-hidden>{meta.emoji}</span>
              <span>{meta.label}</span>
            </li>
          );
        })}
        {unknown.map((u, i) => (
          <li key={`u-${i}`} className="flex items-center gap-2.5 text-sm text-gray-300">
            <span aria-hidden>•</span>
            <span className="capitalize">{u.replace(/_/g, " ")}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
