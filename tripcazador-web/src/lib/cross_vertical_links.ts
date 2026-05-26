/**
 * cross_vertical_links.ts — AUDIT-FIX (26 may 2026)
 *
 * Lookup helpers para cross-link entre verticales aeropuerto sin 404.
 * Resuelve el bug de auditoría: slugs de transporte ≠ slugs derivados
 * naïve de ciudad ("Tenerife Sur".split(" ")[0] = "tenerife" ≠ slug real
 * "tenerife-sur").
 *
 * Uso:
 *   const transporteSlug = getTransporteSlugForIata("LPA"); // "las-palmas"
 *   if (transporteSlug) <Link href={`/transporte-aeropuerto/${transporteSlug}`}>
 *
 * Single source of truth: TRANSPORTE_AEROPUERTO + LOUNGES + AIRPORTS_ES.
 * Pure functions, server-safe.
 */

import { TRANSPORTE_AEROPUERTO } from "@/lib/transporte_aeropuerto_catalog";
import { LOUNGES } from "@/lib/lounges_catalog";
import { AIRPORTS_ES_IATAS } from "@/lib/airports_es_catalog";
import { PARKING_AEROPUERTO_IATAS } from "@/lib/parking_aeropuerto_catalog";
import { DUTY_FREE_IATAS } from "@/lib/duty_free_catalog";

/**
 * Returns transporte_aeropuerto slug for an IATA code, or undefined
 * if the IATA isn't covered by /transporte-aeropuerto vertical.
 */
export function getTransporteSlugForIata(iata: string): string | undefined {
  const upper = iata.toUpperCase();
  return TRANSPORTE_AEROPUERTO.find((c) => c.iata.toUpperCase() === upper)?.slug;
}

/**
 * Returns true if /aeropuertos/[iata] exists for given IATA.
 * Used to gate `<Link href={\`/aeropuertos/${iata}\`}>`.
 */
export function aeropuertoExists(iata: string): boolean {
  return AIRPORTS_ES_IATAS.some((i) => i.toUpperCase() === iata.toUpperCase());
}

/**
 * Returns true if /lounge-aeropuerto/[iata] exists for given IATA.
 */
export function loungeExists(iata: string): boolean {
  return LOUNGES.some((l) => l.iata.toUpperCase() === iata.toUpperCase());
}

/**
 * Returns true if /transporte-aeropuerto/[ciudad] exists for given IATA.
 */
export function transporteExists(iata: string): boolean {
  return getTransporteSlugForIata(iata) !== undefined;
}

/**
 * Returns true if /parking-aeropuerto/[iata] exists for given IATA.
 */
export function parkingExists(iata: string): boolean {
  return PARKING_AEROPUERTO_IATAS.some((i) => i.toUpperCase() === iata.toUpperCase());
}

/**
 * Returns true if /duty-free/[iata] exists for given IATA.
 */
export function dutyFreeExists(iata: string): boolean {
  return DUTY_FREE_IATAS.some((i) => i.toUpperCase() === iata.toUpperCase());
}
