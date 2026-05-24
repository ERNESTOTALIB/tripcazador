/**
 * quick_search.ts — SSS466 (24 may 2026)
 *
 * Búsqueda fuzzy ligera contra airports + destinos + verticales.
 * Pure-fn — testeable y rápida (no AI, no API).
 */
import { AIRPORTS_CATALOG } from "@/lib/airports_catalog";
import { DESTINOS_CATALOG } from "@/lib/destinos_catalog";

export interface QuickSearchResult {
  type: "airport" | "destino" | "vertical";
  label: string;
  href: string;
  sublabel?: string;
  emoji?: string;
}

const VERTICAL_KEYWORDS: Array<{ kw: string[]; label: string; href: string; emoji: string }> = [
  { kw: ["chollos", "deals", "ofertas"], label: "Chollos detectados", href: "/deals", emoji: "🎯" },
  { kw: ["seguro", "viaje"], label: "Seguro de viaje", href: "/seguro-viaje", emoji: "🛡️" },
  { kw: ["esim", "datos", "internet"], label: "eSIM", href: "/esim", emoji: "📱" },
  { kw: ["visa", "visado"], label: "Visados", href: "/visados", emoji: "📄" },
  { kw: ["equipaje", "maleta", "cabina"], label: "Equipaje aerolíneas", href: "/equipaje", emoji: "🧳" },
  { kw: ["check-in", "checkin"], label: "Check-in por aerolínea", href: "/check-in", emoji: "🛫" },
  { kw: ["tren", "ave", "avion"], label: "Tren AVE vs avión", href: "/vuelos-vs-tren", emoji: "🚆" },
  { kw: ["escapada", "fin de semana", "weekend"], label: "Escapadas fin de semana", href: "/escapadas", emoji: "🎒" },
  { kw: ["aeropuerto", "iata"], label: "Aeropuertos", href: "/aeropuertos", emoji: "✈️" },
  { kw: ["divisa", "cambio", "moneda"], label: "Cambio EUR a divisas", href: "/divisas", emoji: "💱" },
  { kw: ["tasa", "turistica", "hotel"], label: "Tasa turística", href: "/tasa-turistica", emoji: "🏨" },
  { kw: ["cancelado", "compensacion", "eu 261"], label: "Vuelo cancelado guía", href: "/vuelo-cancelado", emoji: "⚖️" },
  { kw: ["maleta", "perdida", "extravio"], label: "Maleta perdida reclamación", href: "/maleta-perdida", emoji: "🧳" },
  { kw: ["premium", "alertas", "suscripcion"], label: "Premium", href: "/premium", emoji: "💎" },
];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

export function quickSearch(query: string, maxResults = 8): QuickSearchResult[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const results: QuickSearchResult[] = [];

  // 1. Airports (IATA + city + aliases)
  for (const a of AIRPORTS_CATALOG) {
    if (results.length >= maxResults) break;
    const haystack = normalize(
      [a.iata, a.city, a.country, ...(a.aliases || [])].join(" "),
    );
    if (haystack.includes(q)) {
      results.push({
        type: "airport",
        label: `${a.iata} — ${a.city}`,
        sublabel: a.country,
        href: `/buscar?from=${a.iata}`,
        emoji: a.emoji || "✈️",
      });
    }
  }

  // 2. Destinos (catalog rich)
  for (const d of DESTINOS_CATALOG) {
    if (results.length >= maxResults) break;
    if (normalize(d.name).includes(q) || normalize(d.country).includes(q)) {
      results.push({
        type: "destino",
        label: d.name,
        sublabel: `${d.country} · ${d.region}`,
        href: `/destinos/${d.slug}`,
        emoji: d.emoji,
      });
    }
  }

  // 3. Verticals (acciones)
  for (const v of VERTICAL_KEYWORDS) {
    if (results.length >= maxResults) break;
    if (v.kw.some((k) => normalize(k).includes(q) || q.includes(normalize(k)))) {
      results.push({
        type: "vertical",
        label: v.label,
        href: v.href,
        emoji: v.emoji,
      });
    }
  }

  return results.slice(0, maxResults);
}
