/**
 * TripCazador — Next.js config
 *
 * Security headers:
 *  - CSP estricta (script-src con 'self' + GA4, img-src para unsplash y OSM tiles,
 *    connect-src para la API, frame-src para el embed OSM).
 *  - HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Build-time warning: si NEXT_PUBLIC_BOOKING_AID no está seteado en Vercel,
// cada click a Booking.com desde /hoteles va sin affiliate ID → comisión cero.
// Es un warning (no error) porque queremos que el site se pueda levantar en
// local / PRs sin obligar a tener el aid puesto.
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_BOOKING_AID) {
  console.warn(
    "\n⚠️  NEXT_PUBLIC_BOOKING_AID no está seteado.\n" +
    "    Los deep-links a Booking.com irán sin aid — no hay comisión.\n" +
    "    Añádelo en Vercel → Project Settings → Environment Variables.\n"
  );
}

// CSP en producción. En dev Next.js necesita 'unsafe-eval' para HMR — diferenciamos.
const isDev = process.env.NODE_ENV !== "production";

const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-inline' para GA4 + Next.js inline scripts; nonce sería mejor pero requiere middleware SSR
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://plausible.io`,
  "style-src 'self' 'unsafe-inline'", // Tailwind requiere inline styles
  "img-src 'self' data: https: blob:", // data: para SVG inline, https: para OG/unsplash
  "font-src 'self' data:",
  // *.ingest.sentry.io: endpoint donde el SDK de Sentry envía errores/replays.
  // Inerte si NEXT_PUBLIC_SENTRY_DSN no está setada (el SDK no hace ninguna request).
  `connect-src 'self' ${API_URL} https://www.google-analytics.com https://plausible.io https://tile.openstreetmap.org https://*.ingest.sentry.io`,
  "frame-src 'self' https://www.openstreetmap.org", // embed de mapa en detalle de deal
  "worker-src 'self' blob:", // Sentry Session Replay lanza un Web Worker desde blob
  "child-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
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
