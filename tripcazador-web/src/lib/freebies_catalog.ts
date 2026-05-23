/**
 * freebies_catalog.ts — SSS429 (23 may 2026)
 *
 * Lead magnets — guías PDF gated por email. El user introduce email,
 * se suscribe a la newsletter con source="freebie_${slug}", y recibe
 * el PDF (o link a la guía) por email.
 *
 * Sin PDFs reales aún — v1 dispara welcome via /api/subscribe que
 * incluye link al asset (cuando se preparen). Mientras tanto, link a
 * blog post existente o "Próximamente".
 *
 * Diseño: 4 PDFs cubren angles distintos del producto → recogen
 * subsegmentos email distintos para drips targeted.
 */

export interface FreebieEntry {
  slug: string;
  title: string;
  subtitle: string;
  emoji: string;
  /** Lo que el user obtiene (3 bullets cortos). */
  benefits: string[];
  /** Categoría: travel/equipaje/error-fares/visa/eSIM. */
  category: "errores" | "equipaje" | "documentacion" | "concierge";
  /** Tipo de descarga: pdf real, blog redirect, o coming soon. */
  delivery:
    | { kind: "pdf"; pdfUrl: string }
    | { kind: "blog"; blogSlug: string }
    | { kind: "coming_soon" };
  /** Páginas aproximadas (PDFs) o estimación lectura. */
  pages?: number;
  /** Idioma. */
  lang: "es";
}

export const FREEBIES_CATALOG: FreebieEntry[] = [
  {
    slug: "guia-error-fares",
    title: "Guía 'Cómo cazar Error Fares'",
    subtitle:
      "PDF 12 páginas — qué son, cómo se detectan, cómo reservar sin que te cancelen.",
    emoji: "🎯",
    benefits: [
      "Las 7 webs que publican error fares antes que Google Flights",
      "Lista de aerolíneas que SÍ respetan errores groseros y las que no",
      "Cómo reservar para que el sistema confirme antes de retirar la tarifa",
    ],
    category: "errores",
    delivery: { kind: "blog", blogSlug: "como-detectar-error-fares" },
    pages: 12,
    lang: "es",
  },
  {
    slug: "checklist-equipaje-low-cost",
    title: "Checklist 'Equipaje Ryanair sin penalización'",
    subtitle:
      "PDF 8 páginas — qué cabe, qué no, trucos para evitar el gate fee de €75.",
    emoji: "🧳",
    benefits: [
      "Dimensiones EXACTAS aprobadas en gate por Ryanair, Vueling, easyJet, Wizz",
      "Lista de mochilas 40×20×25 cm que pasan sin problema",
      "5 trucos para meter 'algo más' sin que te detecten",
    ],
    category: "equipaje",
    delivery: { kind: "blog", blogSlug: "ryanair-equipaje-trucos" },
    pages: 8,
    lang: "es",
  },
  {
    slug: "visados-corto-plazo",
    title: "Mapa de visados express (eVisa)",
    subtitle:
      "PDF 6 páginas — qué destinos requieren visa para españoles y cuál se tramita 100% online.",
    emoji: "📄",
    benefits: [
      "Los 18 países que requieren visa para españoles en 2026",
      "Cuáles aceptan eVisa (24-72h) vs cuáles requieren embajada",
      "Precios oficiales + webs gov para no caer en intermediarios caros",
    ],
    category: "documentacion",
    delivery: { kind: "coming_soon" },
    pages: 6,
    lang: "es",
  },
  {
    slug: "muestra-concierge",
    title: "Muestra de búsqueda Concierge",
    subtitle:
      "PDF 4 páginas — ejemplo real de búsqueda Concierge Premium con 5 opciones para un cliente Madrid → Tokio.",
    emoji: "🎩",
    benefits: [
      "Cómo organizamos la búsqueda con tu input",
      "Ejemplo de 5 opciones vuelo+hotel con análisis pros/cons",
      "Lo que recibes de vuelta (formato real)",
    ],
    category: "concierge",
    delivery: { kind: "coming_soon" },
    pages: 4,
    lang: "es",
  },
];

export const FREEBIES_BY_SLUG: Record<string, FreebieEntry> = Object.fromEntries(
  FREEBIES_CATALOG.map((f) => [f.slug, f]),
);

export const FREEBIES_SLUGS = FREEBIES_CATALOG.map((f) => f.slug);

export function getFreebie(slug: string): FreebieEntry | null {
  return FREEBIES_BY_SLUG[slug] ?? null;
}
