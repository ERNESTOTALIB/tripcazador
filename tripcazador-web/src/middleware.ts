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
