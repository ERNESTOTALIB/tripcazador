import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { CookieBanner } from "@/components/CookieBanner";
import { JsonLd } from "@/components/JsonLd";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
    // Mismo contenido en español para todos; hreflang evita que Google
    // penalice por duplicado y ayuda a servir la variante correcta en SERPs.
    languages: {
      "es-ES": "https://tripcazador.com/",
      "es-DE": "https://tripcazador.com/",
      "es-CH": "https://tripcazador.com/",
      "es-AT": "https://tripcazador.com/",
      "es": "https://tripcazador.com/",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <head>
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
      </head>
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        {GA_ID && (
          <>
            {/* Google Consent Mode v2: negado por defecto, se actualiza si el usuario acepta en el banner */}
            <Script id="ga-consent" strategy="beforeInteractive">
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
            />
            <Script id="ga-init" strategy="afterInteractive">
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

        {/* Navbar */}
        <nav
          aria-label="Navegación principal"
          className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800"
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
              <ul className="flex items-center gap-6 text-sm list-none m-0 p-0">
                <li>
                  <a
                    href="/deals"
                    className="text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
                  >
                    Vuelos
                  </a>
                </li>
                <li>
                  <a
                    href="/hoteles"
                    className="text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
                  >
                    Hoteles
                  </a>
                </li>
                <li>
                  <a
                    href="/destinos"
                    className="text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
                  >
                    Destinos
                  </a>
                </li>
                <li>
                  <a
                    href="/blog"
                    className="text-gray-300 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
                  >
                    Blog
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Main */}
        <main id="contenido-principal" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800 mt-20 py-8 text-center text-sm text-gray-500">
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
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500 flex-wrap">
              <a href="/estadisticas" className="hover:text-amber-400 transition-colors">Estadísticas</a>
              <span className="text-gray-700">·</span>
              <a href="/telegram" className="hover:text-amber-400 transition-colors">Telegram</a>
              <span className="text-gray-700">·</span>
              <a href="/legal" className="hover:text-amber-400 transition-colors">Aviso legal</a>
              <span className="text-gray-700">·</span>
              <a href="/legal#privacidad" className="hover:text-amber-400 transition-colors">Privacidad</a>
              <span className="text-gray-700">·</span>
              <a href="/legal#cookies" className="hover:text-amber-400 transition-colors">Cookies</a>
              <span className="text-gray-700">·</span>
              <a href="/rss.xml" className="hover:text-amber-400 transition-colors">RSS</a>
            </div>
          </div>
        </footer>

        <CookieBanner />
      </body>
    </html>
  );
}
