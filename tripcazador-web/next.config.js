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
  // Skip ESLint during build — large legacy codebase has many no-unescaped-entities
  // warnings that don't affect runtime. Pre-commit hook runs lint separately.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // SSS56e: REACTIVADO typing strict. Tras instalar node_modules local
  // y correr `npx tsc --noEmit`, identifiqué 6 errores en
  // src/app/api/admin/funnel/route.ts (Property 'page_view' does not
  // exist on type '{}') causados porque aggregate24h() devolvía totals
  // con keys hardcodeadas (*_24h) pero funnel buscaba keys dinámicas
  // (page_view/favorite_added/share/scroll_75/deal_click/booking_url_opened).
  // Fix: añadir by_type: Record<string, number> a aggregate24h y usar
  // ese mapa en funnel route. Ahora tsc --noEmit pasa limpio (exit 0).
  typescript: {
    ignoreBuildErrors: false,
  },
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
        // DDD1 (Apr 2026) — bulk airports JSON estático ~520KB, contenido inmutable
        // (regenerado solo en build). 1 año cache para minimizar transfer en repeat
        // visits. Vercel edge sirve gzipped → ~75KB efectivos por request.
        source: "/airports_full.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "CDN-Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // SSS22 — TopoJSON world atlas para DestinationsMap (107KB, gzipped ~30KB).
        // Contenido inmutable (CC0 world-atlas v2). 1 año cache.
        source: "/world-110m.json",
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
      // ── B7 (fase abr-2026 post-EE) — cache headers route-segment ────
      // Estrategia: alinear TTL al ritmo real de cambio de cada ruta.
      // Reduce cold-LCP, descarga la API y permite SWR cuando se invalida.
      {
        // Home: 5 min en CDN, SWR 1h. Refleja deals refresh cada 5min sin
        // forzar recompute en cada visit.
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
          },
        ],
      },
      {
        // /deals: rota mucho. 1 min en CDN, SWR 10 min para deals frescos.
        source: "/deals",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=30, s-maxage=60, stale-while-revalidate=600",
          },
        ],
      },
      {
        // /destinos/[slug]: contenido casi-estático con destino + deals 1h.
        source: "/destinos/:slug",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // /blog/[slug]: artículo evergreen. 24h CDN, SWR 1 semana.
        source: "/blog/:slug",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/en/blog/:slug",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // /comparar/[slug]: head-to-head, evergreen.
        source: "/comparar/:slug",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // /vuelos-baratos/[mes]: temporal por mes — 12h CDN, SWR 3d.
        source: "/vuelos-baratos/:mes",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=1800, s-maxage=43200, stale-while-revalidate=259200",
          },
        ],
      },
      {
        // /regiones/[region]: hub regional, evergreen.
        source: "/regiones/:region",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // /admin: nunca cache (datos sensibles + token-gated).
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, no-cache, must-revalidate" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
      // SSS92: cierre de gap CDN — rutas evergreen/semi-estáticas que aún
      // no tenían cache header explícito. Cloudflare tenía 0% cached en
      // last 24h porque estas rutas (alta frecuencia) golpeaban Vercel directo.
      {
        // /hoteles + /hoteles/[slug]: catálogo hotelero, refresca diario.
        source: "/hoteles",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/hoteles/:slug",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        // Páginas aerolínea — perfiles evergreen.
        source: "/aerolineas/:slug",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // Glosario, FAQ, opiniones, partners, prensa — todo casi estático.
        source: "/glosario",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/faq",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/opiniones",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/partners",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/prensa",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
  async rewrites() {
    // KKKK02 (May 2026): mover /api/:path* rewrite a `fallback`.
    // Antes era array plano (= afterFiles default), pero Vercel runtime
    // estaba enrutando dynamic routes Next (/api/og-comparison/[slug])
    // al backend antes de que Next file-system las capturara.
    //
    // `fallback` se aplica SOLO si ninguna ruta Next.js (static + dynamic
    // + file-system) coincidió. Eso garantiza que /api/og-comparison/...,
    // /api/og/social/post, /api/admin/cloudflare, etc. queden en Next.js,
    // y solo paths como /api/deals?limit, /api/airports, etc. (que son
    // del backend FastAPI) se rewrite al VPS.
    return {
      fallback: [
        {
          source: "/api/:path*",
          destination: `${API_URL}/api/:path*`,
        },
      ],
    };
  },
};

module.exports = nextConfig;
