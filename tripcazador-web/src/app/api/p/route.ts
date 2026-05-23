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
 *
 * SSS415: `runtime` y `dynamic` se declaran como literales aquí (no
 * via re-export) porque Next.js 14 sólo puede inferir route segment
 * config si está asignado a un string literal directo en el archivo.
 * El re-export `export { runtime } from` quedaba ignorado silently
 * (warning build) y el endpoint caía a defaults (auto runtime + auto
 * dynamic). Manteniéndolo aquí explícito = paridad real con /api/track.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export { POST } from "../track/route";
