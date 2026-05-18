/**
 * agencia_products.ts — SSS309 (19 may 2026)
 *
 * Catálogo canónico de los 2 productos Agencia. Compartido por las
 * landings dedicated (/agencia/vuelo, /agencia/vuelo-hotel) y la landing
 * principal (/agencia).
 *
 * `amount_eur` debe coincidir con el `price_cents/100` del producto Stripe.
 * Si añades un 3er producto, actualizar también AgenciaTipo en
 * agencia_store.ts + dropdown en AgenciaLandingClient.
 */

import type { AgenciaTipo } from "@/lib/agencia_store";

export interface AgenciaProduct {
  tipo: AgenciaTipo;
  slug: string;
  name: string;
  shortName: string;
  amount_eur: number;
  emoji: string;
  tagline: string;
  description: string;
  bullets: string[];
  popular?: boolean;
}

export const AGENCIA_PRODUCTS: Record<AgenciaTipo, AgenciaProduct> = {
  vuelo: {
    tipo: "vuelo",
    slug: "vuelo",
    name: "Agencia Vuelo",
    shortName: "Vuelo solo",
    amount_eur: 9.99,
    emoji: "🛫",
    tagline: "Búsqueda manual del mejor vuelo en menos de 24h",
    description:
      "Tú nos dices destino + fechas. Nuestro equipo busca a mano " +
      "las 3 mejores opciones de vuelo cotejando Skyscanner, Google " +
      "Flights, Kayak, codeshare arbitrage y error fares. Recibes el " +
      "resultado por email en menos de 24h laborables con enlaces " +
      "directos a la aerolínea. Mejor precio garantizado o reembolso " +
      "+ 1 mes Premium gratis si encuentras lo mismo más barato en 7 días.",
    bullets: [
      "Búsqueda manual <24h por humano (no robot)",
      "3 mejores opciones de vuelo + comparativa de precios",
      "Detección de error fares y codeshare arbitrage",
      "Tips de aeropuerto, equipaje y check-in",
      "Garantía mejor precio 7 días + 1 mes Premium si encuentras más barato",
    ],
  },
  vuelo_hotel: {
    tipo: "vuelo_hotel",
    slug: "vuelo-hotel",
    name: "Agencia Vuelo + Hotel",
    shortName: "Vuelo + Hotel",
    amount_eur: 19.99,
    emoji: "🛫🏨",
    tagline: "Paquete completo vuelo + hotel optimizado al céntimo",
    description:
      "Lo mismo que Vuelo solo + paquete hotel coordinado con tus " +
      "fechas y destino. Comparamos Booking, Airbnb, Hotels.com y " +
      "ofertas directas para encontrar la combinación más barata " +
      "manteniendo calidad (rating 8.0+ y zona central). Te enviamos " +
      "3 opciones de vuelo + 3 opciones de hotel emparejadas. " +
      "Misma garantía 7 días.",
    bullets: [
      "Todo lo del paquete Vuelo +",
      "3 opciones de hotel emparejadas con tu vuelo",
      "Rating Booking 8.0+ garantizado en cada opción",
      "Comparativa hotel vs Airbnb si te ahorra dinero",
      "Recomendación de zona ideal según tipo de viaje",
      "Misma garantía mejor precio 7 días + 1 mes Premium",
    ],
    popular: true,
  },
};

export const AGENCIA_PRODUCT_IDS: AgenciaTipo[] = ["vuelo", "vuelo_hotel"];

export function getAgenciaProductBySlug(
  slug: string,
): AgenciaProduct | null {
  for (const p of Object.values(AGENCIA_PRODUCTS)) {
    if (p.slug === slug) return p;
  }
  return null;
}

export function getAgenciaProductByTipo(
  tipo: string,
): AgenciaProduct | null {
  if (tipo === "vuelo" || tipo === "vuelo_hotel") {
    return AGENCIA_PRODUCTS[tipo];
  }
  return null;
}
