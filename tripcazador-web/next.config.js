/**
 * TripCazador — Next.js config
 *
 * Security headers:
 *  - CSP estricta (script-src con 'self' + GA4, img-src para unsplash y OSM tiles,
 *    connect-src para la API, frame-src para el embed OSM).
 *  - HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// CSP en producción. En dev Next.js necesita 'unsafe-eval' para HMR — diferenciamos.
const isDev = process.env.NODE_ENV !== "production";

const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-inline' para GA4 + Next.js inline scripts; nonce sería mejor pero requiere middleware SSR
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://plausible.io`,
  // script-src-elem: restricción más fina para <script src=...>. Algunos
  // navegadores (Firefox) la usan preferente y ayuda a aislar scripts
  // inline de scripts externos si en el futuro metemos nonce.
  `script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://plausible.io`,
  "style-src 'self' 'unsafe-inline'", // Tailwind requiere inline styles
  "style-src-elem 'self' 'unsafe-inline'", // consistencia con style-src-attr bloqueado
  "style-src-attr 'unsafe-inline'", // explícito — evita defaulting a 'none' en Chrome 120+
  "img-src 'self' data: https: blob:", // data: para SVG inline, https: para OG/unsplash
  "font-src 'self' data:",
  `connect-src 'self' ${API_URL} https://www.google-analytics.com https://plausible.io https://tile.openstreetmap.org`,
  "frame-src 'self' https://www.openstreetmap.org", // embed de mapa en detalle de deal
  "worker-src 'self' blob:", // Next.js RSC usa workers; blob: necesario para streaming
  "manifest-src 'self'",
  "media-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
  // Trusted Types (opt-in): prepara el terreno para script-src sin 'unsafe-inline'
  // sin forzarlo todavía. Next 14 no emite tipos confiables nativamente, así
  // que usamos `require-trusted-types-for` sólo en Report-Only (header aparte).
].join("; ");

// CSP Report-Only para trusted-types — recoge violaciones sin bloquear.
// Útil para medir impacto antes de endurecer la CSP principal.
const cspReportOnly = [
  "require-trusted-types-for 'script'",
  "trusted-types nextjs default",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Origin-Agent-Cluster aísla este origen a un agent cluster propio:
  // bloquea ataques side-channel cross-origin vía SharedArrayBuffer.
  { key: "Origin-Agent-Cluster", value: "?1" },
  // Cross-Origin-Embedder-Policy en modo permissive: opt-in para SAB sin
  // romper imágenes externas (unsplash) al no requerir CORP response.
  { key: "Cross-Origin-Embedder-Policy", value: "unsafe-none" },
  // Permissions-Policy: explícito lo que NO queremos.
  // `interest-cohort=()` bloquea FLoC (tracking basado en histórico del usuario),
  // `payment` / `usb` / `accelerometer` bloquean APIs invasivas.
  // `browsing-topics` es el reemplazo de FLoC (Topics API de Chrome), también bloqueado.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Cross-Origin-Opener-Policy: aísla este documento de ventanas pop-up de orígenes
  // distintos (impide `window.opener` leaks). Importante para links externos
  // aunque ya ponemos rel="noopener".
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Cross-Origin-Resource-Policy: impide que terceros usen <img src=nuestro>
  // como canal de tracking (solo same-site puede incrustar recursos).
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // No exponer "X-Powered-By: Next.js"
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "tile.openstreetmap.org" },
    ],
  },
  async headers() {
    return [
      {
        // Aplicar headers a todas las rutas. /admin ya tiene robots: noindex vía metadata.
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // abr-2026q — CDN cache para imágenes estáticas /_next/image y /_next/static
        // 1 año immutable: contenido versionado por hash, nunca cambia.
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "CDN-Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // OG images dinámicas: cache 24h en CDN, 1h en navegador.
        source: "/blog/:slug/opengraph-image",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/en/blog/:slug/opengraph-image",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        // /api/img edge proxy: ya define su propio Cache-Control en route.ts pero
        // reforzamos a nivel CDN por si alguna request bypassa el proxy.
        source: "/api/img",
        headers: [
          { key: "CDN-Cache-Control", value: "public, max-age=86400, s-maxage=604800" },
        ],
      },
      {
        // sitemap.xml: cache corto en CDN, signal de freshness para crawlers.
        source: "/sitemap.xml",
        headers: [
          { key: "Cache-Control", value: "public, max-age=300, s-maxage=600, stale-while-revalidate=86400" },
        ],
      },
      {
        // robots.txt: cache muy corto (cambios deben propagarse rápido).
        source: "/robots.txt",
        headers: [
          { key: "Cache-Control", value: "public, max-age=300, s-maxage=600" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
