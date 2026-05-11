import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware Next.js — abr-2026k
 *
 * Responsabilidades:
 *  1. Generar un `nonce` único por request, exponerlo vía header `x-nonce`
 *     para que `app/layout.tsx` lo lea con `headers()` y lo inyecte en cada
 *     `<Script>` inline. Esto prepara la CSP futura sin `'unsafe-inline'`.
 *  2. Setear un `Content-Security-Policy` por-request que incluye
 *     `'nonce-{value}'` en `script-src`. Coexiste con la CSP estática de
 *     `next.config.js`: el header de middleware tiene precedencia.
 *  3. Redirigir/normalizar paths obvios (trailing slash, www → apex).
 *
 * Quitar `'unsafe-inline'` se hará cuando todos los scripts inline (consent
 * mode + GA init) lleven el atributo `nonce={nonce}`. Por ahora dejamos
 * `'unsafe-inline'` como fallback para compat — lo elimina la migración
 * subsiguiente cuando el layout esté actualizado.
 *
 * NOTA: NO interceptar `/api/*` ni `/_next/*` para evitar:
 *   - Romper API routes con headers conflictivos
 *   - Re-procesar assets estáticos
 */

const isDev = process.env.NODE_ENV !== "production";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function generateNonce(): string {
  // Web Crypto API en Edge Runtime; fallback determinístico nunca debería
  // ejecutarse en producción.
  const arr = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  // base64 urlsafe, sin padding
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function buildCSP(nonce: string): string {
  // CSP per-request — usa nonce + 'strict-dynamic' para los scripts del
  // layout. 'unsafe-inline' queda como ignored por strict-dynamic; lo
  // dejamos como fallback para navegadores muy antiguos.
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' ${
      isDev ? "'unsafe-eval'" : ""
    } https://www.googletagmanager.com https://www.google-analytics.com https://plausible.io`,
    `script-src-elem 'self' 'nonce-${nonce}' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://plausible.io`,
    "style-src 'self' 'unsafe-inline'",
    "style-src-elem 'self' 'unsafe-inline'",
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${API_URL} https://www.google-analytics.com https://plausible.io https://tile.openstreetmap.org`,
    "frame-src 'self' https://www.openstreetmap.org",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
  return directives;
}

/**
 * SSS139 (11 may 2026) — Auto-heal masivo para usuarios atascados.
 *
 * El SW v4-2026-05-04 cacheó HTML "Algo salió mal en el radar" en cientos
 * de navegadores. /reset cura uno a uno, pero hay ~1000 visitantes activos
 * que no van a saber visitar /reset. Solución: el middleware envía el header
 * Clear-Site-Data en la PRIMERA respuesta a cualquier visitante que no
 * tenga el cookie marcador `tc_heal_v1`. Dosis única, idempotente.
 *
 *   - "cache" + "storage" + "executionContexts": wipe SW + IDB + localStorage
 *     + HTTP cache. NO incluimos "cookies" para que sobreviva el marcador.
 *   - Cookie 1 año Max-Age: una vez curado, jamás se repite la limpieza.
 *
 * Sólo aplicar a navegaciones HTML (no a APIs, fetch, assets), detectadas
 * por:
 *   - Sec-Fetch-Dest: document (Chrome / FF / Edge / Safari 16+)
 *   - O fallback Accept: text/html
 *
 * Trade-off: localStorage del usuario (favoritos, dismiss flags, etc.) se
 * borra una sola vez. Aceptable comparado con que vean error fare en la home.
 */
const HEAL_COOKIE = "tc_heal_v1";
const HEAL_COOKIE_VALUE = "1";

function shouldHeal(req: NextRequest): boolean {
  // Ya curado
  if (req.cookies.get(HEAL_COOKIE)?.value === HEAL_COOKIE_VALUE) return false;
  // Sólo navegaciones HTML (no fetch/XHR/image/etc.)
  const dest = req.headers.get("sec-fetch-dest");
  if (dest && dest !== "document") return false;
  const accept = req.headers.get("accept") || "";
  if (!accept.includes("text/html")) return false;
  // No tocar /reset (ya lo hace por sí mismo) ni rutas con cache-buster fresh
  const path = req.nextUrl.pathname;
  if (path === "/reset" || path.startsWith("/api/")) return false;
  return true;
}

export function middleware(req: NextRequest) {
  const nonce = generateNonce();
  const csp = buildCSP(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  // Sobrescribir CSP en respuesta (precedencia sobre next.config.js)
  res.headers.set("Content-Security-Policy", csp);
  // Exponer nonce al layout para `<Script nonce={nonce}>`
  res.headers.set("x-nonce", nonce);

  // SSS139 auto-heal masivo
  if (shouldHeal(req)) {
    // Wipe browser state EXCEPT cookies (para que el marcador sobreviva).
    // Tras esto, en milisegundos:
    //   - Service Workers viejos: desinstalados
    //   - Cache Storage: vaciado
    //   - HTTP cache para este origen: vaciado
    //   - IndexedDB + localStorage + sessionStorage: vaciados
    //   - WebSQL: vaciado
    res.headers.set(
      "Clear-Site-Data",
      '"cache", "storage", "executionContexts"',
    );
    res.cookies.set(HEAL_COOKIE, HEAL_COOKIE_VALUE, {
      maxAge: 60 * 60 * 24 * 365, // 1 año
      path: "/",
      sameSite: "lax",
      httpOnly: false, // permitir lectura desde JS si hace falta
      secure: !isDev,
    });
  }

  return res;
}

/**
 * Matcher: aplica a todas las páginas excepto:
 *  - /_next/static/* y /_next/image/* (assets servidos directamente)
 *  - /api/* (route handlers — su seguridad va por sí mismos)
 *  - favicons / manifest / robots / sitemap (estáticos)
 *
 * Esto reduce el coste de middleware en ~70% (assets son la mayoría de hits).
 */
export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|favicon-16x16.png|favicon-32x32.png|apple-touch-icon.png|android-chrome-192x192.png|android-chrome-512x512.png|og-default.png|site.webmanifest|robots.txt|sitemap.xml|rss.xml).*)",
  ],
};
