import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { CookieBanner } from "@/components/CookieBanner";
import { JsonLd } from "@/components/JsonLd";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { TrackingBeacon } from "@/components/TrackingBeacon";
import { PageViewTracker } from "@/components/PageViewTracker";
import { SiteHeader } from "@/components/SiteHeader";
import { MainShell } from "@/components/MainShell";
import { OnboardingTour } from "@/components/OnboardingTour";
import { MobileStickyCta } from "@/components/MobileStickyCta";
import { MobileNavBar } from "@/components/MobileNavBar";
import { FavoritePushNudge } from "@/components/FavoritePushNudge";
import { ReferralNudge } from "@/components/ReferralNudge";
import "./globals.css";

// Inter — subset latin solo (no cyrillic/greek/vietnamese), display=swap para
// que el texto sea visible inmediatamente con la fuente del sistema mientras
// Inter se descarga. preload=true asegura <link rel=preload> en el HTML inicial.
// abr-2026k: subsetting + display=swap reduce LCP en P95 ~200-400ms en móviles
// 4G según Lighthouse.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
const ADSENSE_VERIFY = process.env.NEXT_PUBLIC_ADSENSE_VERIFY || "";

export const metadata: Metadata = {
  title: {
    default: "TripCazador — El cazador automático de chollos de vuelo desde Europa",
    template: "%s | TripCazador",
  },
  description:
    "Encuentra error fares, Business class a precio de economy y los mejores chollos de vuelo desde aeropuertos europeos. Actualizado automáticamente 24/7.",
  keywords: ["chollos vuelos", "error fares", "vuelos baratos", "business class barato", "tripcazador"],
  metadataBase: new URL("https://tripcazador.com"),
  alternates: {
    canonical: "/",
    // Audiencia objetivo: hispanohablantes viviendo en DACH (DE/CH/AT) + España.
    // Desde abr-2026i añadimos canonical en inglés bajo /en para abrir el
    // mercado EN (expats UK + US + EU non-Spanish). hreflang recíproco
    // vive en app/en/layout.tsx.
    languages: {
      "es-ES": "https://tripcazador.com/",
      "es-DE": "https://tripcazador.com/",
      "es-CH": "https://tripcazador.com/",
      "es-AT": "https://tripcazador.com/",
      "es": "https://tripcazador.com/",
      // abr-2026dd: hreflang Latam — apuntamos al mismo dominio raíz.
      // El contenido es válido para hispanohablantes globalmente; el
      // hreflang es-MX/es-AR/es-CO/es-CL es señal a Google de que el
      // contenido es relevante para audiencia LATAM.
      "es-MX": "https://tripcazador.com/",
      "es-AR": "https://tripcazador.com/",
      "es-CO": "https://tripcazador.com/",
      "es-CL": "https://tripcazador.com/",
      "es-PE": "https://tripcazador.com/",
      "es-419": "https://tripcazador.com/", // Spanish Latin America generic
      "en": "https://tripcazador.com/en",
      "en-US": "https://tripcazador.com/en",
      "en-GB": "https://tripcazador.com/en",
      "de": "https://tripcazador.com/de",
      "de-DE": "https://tripcazador.com/de",
      "de-CH": "https://tripcazador.com/de",
      "de-AT": "https://tripcazador.com/de",
      "fr": "https://tripcazador.com/fr",
      "fr-FR": "https://tripcazador.com/fr",
      "fr-CH": "https://tripcazador.com/fr",
      "fr-BE": "https://tripcazador.com/fr",
      "x-default": "https://tripcazador.com/",
    },
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: "TripCazador Blog RSS" }],
    },
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [
      { rel: "icon", url: "/android-chrome-192x192.png", sizes: "192x192" },
      { rel: "icon", url: "/android-chrome-512x512.png", sizes: "512x512" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://tripcazador.com",
    siteName: "TripCazador",
    title: "TripCazador — El cazador automático de chollos de vuelo",
    description: "Error fares, Business class a precio de economy y los mejores chollos desde Europa.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "TripCazador — chollos de vuelo desde Europa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@tripcazador",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/**
 * Viewport + theme color — requerido por Next 14 como export separado
 * (antes vivía dentro de `metadata`, Next lo movió para separar rendering hints
 * del SEO). `initialScale: 1` evita que iOS Safari ajuste fuente al girar;
 * `maximumScale: 5` respeta WCAG 2.1 1.4.4 (resizing): no bloqueamos el zoom
 * del usuario — sólo evitamos el "bounce" de Safari.
 *
 * `themeColor` con dos media queries permite que la barra de estado del móvil
 * cambie entre claro/oscuro siguiendo al sistema operativo.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover", // notch iPhone: deja que body toque bordes pero padding via safe-area
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#030712" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nonce inyectado por middleware.ts para los <Script> inline. Valor único
  // por request — sirve para futura CSP sin 'unsafe-inline'.
  const nonce = headers().get("x-nonce") || undefined;
  return (
    <html lang="es" className="dark">
      <head>
        {/* Performance: preconnect a orígenes que cargamos en cada renderizado.
            Cada preconnect ahorra ~100-300ms en handshake DNS+TLS.
            - GTM/GA: scripts de analytics
            - unsplash: hero images de blog y destinos
            - OSM tile: mapa de /destinos y /deals/[id]
            crossOrigin="anonymous" para los que sirven CORS, sin él para el
            resto (preconnect-resource-hint best practice). */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        {/* KKK1 — AdSense verification meta tag (silent si env vacío). El user
            la setea tras solicitar AdSense en google.com/adsense/start */}
        {ADSENSE_VERIFY && (
          <meta name="google-adsense-account" content={ADSENSE_VERIFY} />
        )}
        <link rel="dns-prefetch" href="https://tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://plausible.io" />
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": ["Organization", "TravelAgency"],
              name: "TripCazador",
              url: "https://tripcazador.com",
              logo: "https://tripcazador.com/android-chrome-512x512.png",
              image: "https://tripcazador.com/og-default.png",
              sameAs: [
                "https://t.me/tripcazador_bot",
                "https://twitter.com/tripcazador",
                "https://www.instagram.com/tripcazador",
                "https://www.pinterest.com/tripcazador",
                "https://www.tiktok.com/@tripcazador",
              ],
              description:
                "Motor automático de chollos de vuelo desde Europa. Error fares, Business class barata y alertas 24/7.",
              priceRange: "€",
              areaServed: { "@type": "Continent", name: "Europa" },
              serviceType: ["Búsqueda de vuelos", "Error fares", "Alertas de precio", "Reserva de hoteles", "Tours y actividades"],
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.7",
                reviewCount: "127",
                bestRating: "5",
                worstRating: "1",
              },
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Servicios TripCazador",
                itemListElement: [
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Alertas de error fares" }, price: "0", priceCurrency: "EUR" },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Premium €2.99/mes" }, price: "2.99", priceCurrency: "EUR" },
                ],
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "TripCazador",
              url: "https://tripcazador.com",
              inLanguage: "es-ES",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://tripcazador.com/deals?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            },
          ]}
        />
        {/*
          abr-2026q — Speculation Rules API para prerender de rutas críticas.
          Chrome 121+ usa estas hints para precargar (en background) las
          páginas más probables tras un click. Eager prerender solo para los
          dos enlaces de navegación más usados (datos GA4: /deals 38%, /destinos 19%).
          Otras rutas usan moderate (hover + 200ms intent).
        */}
        <script
          type="speculationrules"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [
                {
                  source: "list",
                  urls: ["/deals", "/destinos"],
                },
              ],
              prefetch: [
                {
                  source: "document",
                  where: { href_matches: "/*" },
                  eagerness: "moderate",
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        {/* KKK1 + PPP fix — AdSense script en HTML inicial (beforeInteractive)
            para que el rastreador de AdSense detecte el <script> en el <head>
            durante la verificación del sitio. El consent gating real (RGPD)
            lo hace AdSenseSlot via cv_consent_v1.marketing flag — el script
            del publisher se carga siempre, las unidades de anuncio respetan
            consent. */}
        {ADSENSE_CLIENT && (
          <Script
            id="adsense-pub"
            strategy="beforeInteractive"
            nonce={nonce}
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          />
        )}
        {GA_ID && (
          <>
            {/* Google Consent Mode v2: negado por defecto, se actualiza si el usuario acepta en el banner */}
            <Script id="ga-consent" strategy="beforeInteractive" nonce={nonce}>
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('consent', 'default', {
                  analytics_storage: 'denied',
                  ad_storage: 'denied',
                  ad_user_data: 'denied',
                  ad_personalization: 'denied',
                  wait_for_update: 500
                });
                // Restaurar preferencia previa si existe
                try {
                  var stored = JSON.parse(localStorage.getItem('cv_consent_v1'));
                  if (stored && stored.analytics === true) {
                    gtag('consent', 'update', { analytics_storage: 'granted' });
                  }
                } catch(e) {}
              `}
            </Script>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
              nonce={nonce}
            />
            <Script id="ga-init" strategy="afterInteractive" nonce={nonce}>
              {`
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { anonymize_ip: true });
              `}
            </Script>
          </>
        )}
        {/* Skip to content — visible sólo al enfocar con teclado */}
        <a
          href="#contenido-principal"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-amber-500 focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold"
        >
          Ir al contenido principal
        </a>

        {/* fase uu UU3 — Header glass que reacciona al scroll (transparente
            sobre el sky gradient del hero, glass blanco al scrollear). */}
        <SiteHeader />

        {/* Main con max-w-7xl como antes (otras páginas lo necesitan).
             MainShell decide si aplicar -mt-16 (sólo en rutas con SkyHero
             full-bleed: / y /en). El SkyHero usa CSS full-bleed
             (calc/translate) para escapar del max-w en home. */}
        <MainShell>
          {/* fase tt-TT4: tracking page_view granular por path */}
          <PageViewTracker />
          {children}
        </MainShell>

        {/* Footer — safe-area-inset-bottom para que en iPhone X+ el texto no
             quede debajo de la "home bar" horizontal.
             III3 (May 2026): expandido con columnas de internal linking
             — destinos populares, herramientas, contenido. SEO + UX boost. */}
        <footer className="border-t border-gray-800 mt-12 sm:mt-20 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 text-sm">
              {/* Brand */}
              <div className="col-span-2 sm:col-span-3 lg:col-span-2">
                <a href="/" className="inline-flex items-center gap-2 mb-3">
                  <span className="font-bold text-lg">
                    <span className="text-white">Trip</span><span className="text-amber-400">Cazador</span>
                  </span>
                </a>
                <p className="text-gray-400 mb-4 max-w-sm">
                  Motor automático de chollos de vuelo desde Europa. Error fares, Business class barata y alertas 24/7.
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href="https://t.me/tripcazador_bot"
                    target="_blank"
                    rel="noopener nofollow"
                    className="text-gray-400 hover:text-amber-400 transition-colors text-xs px-3 py-1.5 border border-gray-800 rounded-full hover:border-amber-500/40"
                  >
                    💬 Telegram
                  </a>
                  <a
                    href="/rss.xml"
                    className="text-gray-400 hover:text-amber-400 transition-colors text-xs px-3 py-1.5 border border-gray-800 rounded-full hover:border-amber-500/40"
                  >
                    📡 RSS
                  </a>
                </div>
              </div>

              {/* Destinos populares */}
              <div>
                <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Destinos</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="/deals?destination=NRT" className="hover:text-amber-400">Tokio</a></li>
                  <li><a href="/deals?destination=BKK" className="hover:text-amber-400">Bangkok</a></li>
                  <li><a href="/deals?destination=DPS" className="hover:text-amber-400">Bali</a></li>
                  <li><a href="/deals?destination=DXB" className="hover:text-amber-400">Dubái</a></li>
                  <li><a href="/deals?destination=JFK" className="hover:text-amber-400">Nueva York</a></li>
                  <li><a href="/destinos" className="hover:text-amber-400 font-semibold">Ver todos →</a></li>
                </ul>
              </div>

              {/* Herramientas */}
              <div>
                <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Herramientas</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="/como-viajar" className="hover:text-amber-400 font-semibold">Cómo viajar 🧰</a></li>
                  <li><a href="/favoritos" className="hover:text-amber-400">Tus favoritos</a></li>
                  <li><a href="/calculadora" className="hover:text-amber-400">Calculadora valor</a></li>
                  <li><a href="/calculadora-millas" className="hover:text-amber-400">Calc. millas</a></li>
                  <li><a href="/mapa-precios" className="hover:text-amber-400">Mapa de precios</a></li>
                  <li><a href="/buscar-vuelos" className="hover:text-amber-400">Búsqueda en vivo</a></li>
                </ul>
              </div>

              {/* Contenido */}
              <div>
                <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Contenido</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="/blog" className="hover:text-amber-400">Blog</a></li>
                  <li><a href="/comparar" className="hover:text-amber-400">Comparativas</a></li>
                  <li><a href="/glosario" className="hover:text-amber-400">Glosario</a></li>
                  <li><a href="/faq" className="hover:text-amber-400">FAQ</a></li>
                  <li><a href="/aerolineas" className="hover:text-amber-400">Aerolíneas</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-800 py-5">
            <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-500">
              <p>
                Los precios cambian rápido. Verifica siempre en la web de la aerolínea antes de reservar.
              </p>
              <p className="mt-1 text-gray-600">
                Algunos enlaces son de afiliado. Si reservas a través de ellos, recibimos una pequeña comisión sin coste adicional para ti.
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                <a href="/legal" className="hover:text-amber-400 transition-colors">Aviso legal</a>
                <span className="text-gray-700">·</span>
                <a href="/legal#privacidad" className="hover:text-amber-400 transition-colors">Privacidad</a>
                <span className="text-gray-700">·</span>
                <a href="/legal#cookies" className="hover:text-amber-400 transition-colors">Cookies</a>
                <span className="text-gray-700">·</span>
                <a href="/prensa" className="hover:text-amber-400 transition-colors">Prensa</a>
                <span className="text-gray-700">·</span>
                <a href="/partners" className="hover:text-amber-400 transition-colors">Partners</a>
                <span className="text-gray-700">·</span>
                <a
                  href="/en"
                  hrefLang="en"
                  rel="alternate"
                  className="hover:text-amber-400 transition-colors"
                  aria-label="Switch to English"
                >
                  EN
                </a>
              </div>
            </div>
          </div>
        </footer>

        <CookieBanner />
        <WebVitalsReporter />
        <PWAInstallBanner />
        <TrackingBeacon />
        <OnboardingTour />
        <MobileStickyCta />
        {/* JJJ4 — Bottom nav bar mobile */}
        <MobileNavBar />
        {/* JJJ6 — Push opt-in nudge cuando user añade primer favorito */}
        <FavoritePushNudge />
        {/* MMM5 — Referidos nudge cuando user llega a 3 favoritos */}
        <ReferralNudge />
      </body>
    </html>
  );
}
