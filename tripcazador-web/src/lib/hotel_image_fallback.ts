/**
 * hotel_image_fallback — SSS86 (May 2026)
 *
 * Fallback visual cuando una imagen Unsplash de un hotel falla al cargar.
 * En lugar de mostrar un cuadro vacío:
 *   1. Generamos un gradient determinístico basado en el slug/nombre
 *   2. Mostramos el emoji del hotel grande en el centro
 *
 * El gradient es estable: el mismo hotel siempre verá el mismo color, lo
 * que evita layout shift y da identidad visual.
 *
 * Uso:
 *   <img onError={(e) => onImageError(e, hotel)} ... />
 *   const grad = getHotelGradient(hotel.airline_name);
 *   <div style={{ background: grad }}>{hotel.emoji}</div>
 */

// Paleta de gradientes alineada con la marca TripCazador (navy + amber + ocean tones)
const GRADIENTS: string[] = [
  "linear-gradient(135deg, #0EA5E9 0%, #0F172A 100%)", // ocean → navy
  "linear-gradient(135deg, #F59E0B 0%, #B45309 100%)", // amber
  "linear-gradient(135deg, #10B981 0%, #064E3B 100%)", // emerald
  "linear-gradient(135deg, #EC4899 0%, #831843 100%)", // pink
  "linear-gradient(135deg, #6366F1 0%, #1E1B4B 100%)", // indigo
  "linear-gradient(135deg, #06B6D4 0%, #164E63 100%)", // cyan
  "linear-gradient(135deg, #8B5CF6 0%, #3B0764 100%)", // violet
  "linear-gradient(135deg, #DC2626 0%, #450A0A 100%)", // red
  "linear-gradient(135deg, #FBBF24 0%, #92400E 100%)", // gold
  "linear-gradient(135deg, #14B8A6 0%, #134E4A 100%)", // teal
  "linear-gradient(135deg, #F97316 0%, #7C2D12 100%)", // orange
  "linear-gradient(135deg, #84CC16 0%, #1A2E05 100%)", // lime
];

/**
 * Hash determinístico simple (FNV-1a 32-bit) para mapear strings a índices.
 * No criptográfico — solo necesitamos buena distribución.
 */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0; // unsigned 32-bit
}

/**
 * Devuelve un CSS background gradient estable para el hotel.
 * El gradient es siempre el mismo para el mismo input.
 */
export function getHotelGradient(seed: string): string {
  if (!seed) return GRADIENTS[0];
  const idx = fnv1a(seed) % GRADIENTS.length;
  return GRADIENTS[idx];
}

/**
 * Reemplaza una <img> rota por un placeholder visual:
 *   - Background = gradient determinístico
 *   - Emoji centrado grande
 *   - data-fallback="true" para tests / a11y
 *
 * Llamar desde onError del <img>:
 *   <img onError={(e) => onImageError(e.currentTarget, hotelName, emoji)} />
 */
export function onImageError(
  img: HTMLImageElement,
  seed: string,
  emoji?: string,
): void {
  if (img.dataset.fallback === "true") return; // ya aplicado, evita loops
  img.dataset.fallback = "true";

  // Crear contenedor que reemplaza la <img>
  const parent = img.parentElement;
  if (!parent) {
    img.style.display = "none";
    return;
  }

  const grad = getHotelGradient(seed);
  const placeholder = document.createElement("div");
  placeholder.setAttribute("aria-hidden", "true");
  placeholder.dataset.hotelFallback = "true";
  placeholder.style.cssText = `
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: ${grad};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(3rem, 12vw, 6rem);
    line-height: 1;
    user-select: none;
  `;
  if (emoji) {
    placeholder.textContent = emoji;
  } else {
    // Si el hotel no tiene emoji, mostramos un icono genérico
    placeholder.textContent = "🏨";
  }

  // Reemplazar img por placeholder dentro del mismo contenedor
  img.style.display = "none";
  parent.appendChild(placeholder);
}
