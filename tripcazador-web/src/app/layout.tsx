import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { CookieBanner } from "@/components/CookieBanner";
import { JsonLd } from "@/components/JsonLd";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
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
        <link rel="dns-prefetch" href="https://tile.openstreetmap.org" />
        <link rel="dns-prefetch" href="https://plausible.io" />
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "TripCazador",
              url: "https://tripcazador.com",
              logo: "https://tripcazador.com/android-chrome-512x512.png",
              sameAs: [
                "https://t.me/tripcazador_bot",
                "https://twitter.com/tripcazador",
              ],
              description:
                "Motor automático de chollos de vuelo desde Europa. Error fares, Business class barata y alertas 24/7.",
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

        {/* Header con navbar — landmark <header role="banner"> para screen readers */}
        <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800">
        <nav
          aria-label="Navegación principal"
          className=""
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <a
                href="/"
                aria-label="TripCazador — ir a la página principal"
                className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
              >
                <span className="text-amber-400 text-xl" aria-hidden="true">✈️</span>
                <span className="font-bold text-white text-lg tracking-tight">
                  Trip<span className="text-amber-400">Cazador</span>
                </span>
              </a>
              {/*
                En mobile (< 480px) el gap-6 hace overflow con 4 items.
                - gap-3 sm:gap-6: navegación más densa en móvil.
                - min-h-[44px] en cada link: touch target WCAG 2.5.5 AAA.
                - "Blog" oculto en < 480px (hidden xs:inline-flex) para que
                  quepan las tres rutas principales en un iPhone SE (320px).
              */}
              <ul className="flex items-center gap-3 sm:gap-6 text-sm list-none m-0 p-0">
                <li>
                  <a
                    href="/deals"
                    className="inline-flex items-center min-h-[44px] text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
                  >
                    Vuelos
                  </a>
                </li>
                <li>
                  <a
                    href="/hoteles"
                    className="inline-flex items-center min-h-[44px] text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
                  >
                    Hoteles
                  </a>
                </li>
                <li>
                  <a
                    href="/destinos"
                    className="inline-flex items-center min-h-[44px] text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
                  >
                    Destinos
                  </a>
                </li>
                <li className="hidden xs:inline-flex">
                  <a
                    href="/blog"
                    className="inline-flex items-center min-h-[44px] text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        </header>

        {/* Main — px-4 básico; sm:px-6 lg:px-8 crece con la pantalla.
             py-6 sm:py-8 reduce el hueco vertical en móvil donde pesa más. */}
        <main id="contenido-principal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>

        {/* Footer — safe-area-inset-bottom para que en iPhone X+ el texto no
             quede debajo de la "home bar" horizontal. */}
        <footer className="border-t border-gray-800 mt-12 sm:mt-20 py-8 text-center text-sm text-gray-500 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <div className="max-w-7xl mx-auto px-4">
            <p>
              <span className="text-amber-400">TripCazador</span> — Motor automático de chollos de vuelo desde Europa
            </p>
            <p className="mt-1">
              Los precios cambian rápido. Siempre verifica en la web de la aerolínea antes de reservar.
            </p>
            <p className="mt-2 text-xs text-gray-600">
              Algunos enlaces son de afiliado. Si reservas a través de ellos, recibimos una pequeña comisión sin coste adicional para ti.
            </p>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
              <a href="/legal" className="hover:text-amber-400 transition-colors">Aviso legal</a>
              <span className="text-gray-700">·</span>
              <a href="/legal#privacidad" className="hover:text-amber-400 transition-colors">Privacidad</a>
              <span className="text-gray-700">·</span>
              <a href="/legal#cookies" className="hover:text-amber-400 transition-colors">Cookies</a>
              <span className="text-gray-700">·</span>
              <a href="/rss.xml" className="hover:text-amber-400 transition-colors">RSS</a>
              <span className="text-gray-700">·</span>
              {/*
                Language switcher — hrefLang + rel="alternate" ayudan a Google
                a entender la relación de traducciones entre URLs. Iconos
                planos (no banderas) para no sesgar el idioma hacia un país
                concreto (EN ≠ US ni UK).
              */}
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
        </footer>

        <CookieBanner />
        <WebVitalsReporter />
        <PWAInstallBanner />
      </body>
    </html>
  );
}
