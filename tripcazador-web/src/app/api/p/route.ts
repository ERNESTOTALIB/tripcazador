/**
 * /api/p — alias de /api/track (SSS175).
 *
 * AdBlockers (uBlock, AdBlock Plus, Brave Shields, Pi-hole) bloquean
 * agresivamente cualquier URL con "/track", "/analytics", "/pixel", etc.
 * EasyPrivacy + EasyList incluyen `/api/track` por defecto.
 *
 * Análisis SSS174: Cloudflare reporta ~700-800 unique visitors/día,
 * pero /api/track captura solo ~50 unique (93% perdidos). Causa raíz
 * principal: adblockers bloqueando /api/track.
 *
 * Fix: endpoint alias `/api/p` (corto, neutral) que reenvía al mismo
 * handler. track_client.ts envía aquí primero, fallback a /api/track
 * si falla (defense in depth).
 *
 * Reutiliza la lógica completa de /api/track/route.ts via re-export.
 */
export { POST, runtime, dynamic } from "../track/route";
