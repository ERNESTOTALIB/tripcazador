import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

/**
 * English layout for /en/* — wraps the localized sub-tree with its own
 * metadata, hreflang alternates and structured data.
 *
 * Why a sub-layout instead of a full second <html>: the root `layout.tsx`
 * already ships `<html lang="es">` + header/footer in Spanish; here we
 * override the language context for crawlers (via JSON-LD `inLanguage` and
 * a dedicated `<section lang="en">` wrapper on children pages) and publish
 * the English canonical + hreflang reciprocal link.
 *
 * The global <header> keeps Spanish labels to minimise DOM/bundle churn —
 * an acceptable compromise for the MVP English market launch (main
 * audience = expats already comfortable with Spanish UI + EN content).
 * A full UI translation ships with the first EN-only campaign.
 */
export const metadata: Metadata = {
  title: {
    default: "TripCazador — Error fares & cheap flights from Europe",
    template: "%s | TripCazador EN",
  },
  description:
    "The automatic engine that tracks error fares, business-class mistake fares and cheap flights from European airports 24/7. Free Telegram alerts.",
  keywords: [
    "error fares",
    "cheap flights Europe",
    "business class deals",
    "flight deals Europe",
    "mistake fare tracker",
    "tripcazador",
  ],
  metadataBase: new URL("https://tripcazador.com"),
  alternates: {
    canonical: "/en",
    languages: {
      "es-ES": "https://tripcazador.com/",
      "es": "https://tripcazador.com/",
      "en": "https://tripcazador.com/en",
      "en-US": "https://tripcazador.com/en",
      "en-GB": "https://tripcazador.com/en",
      "x-default": "https://tripcazador.com/",
    },
    // abr-2026x: feed RSS EN dedicado linkado vía <link rel=alternate>
    types: {
      "application/rss+xml": [
        { url: "/en/rss.xml", title: "TripCazador Blog RSS (English)" },
      ],
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["es_ES"],
    url: "https://tripcazador.com/en",
    siteName: "TripCazador",
    title: "TripCazador — Error fares & cheap flights from Europe",
    description:
      "Error fares, business class at economy prices, 24/7 tracking across 750+ airlines from European hubs.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "TripCazador — error fares & cheap flights from Europe",
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
  },
};

export default function EnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section lang="en" className="space-y-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "TripCazador",
          url: "https://tripcazador.com/en",
          inLanguage: "en",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate:
                "https://tripcazador.com/deals?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      {/* EN sub-nav — the root layout's nav is Spanish, so expose the EN
          surfaces (Home, Blog, Destinations) explicitly for discoverability
          and crawl budget. Stays lightweight: no JS, no client component. */}
      <nav
        aria-label="English sections"
        className="flex flex-wrap items-center gap-4 text-sm text-gray-400 border-b border-gray-800 pb-3"
      >
        <a href="/en" className="hover:text-amber-400 transition-colors">Home</a>
        <span aria-hidden="true" className="text-gray-700">·</span>
        <a href="/en/blog" className="hover:text-amber-400 transition-colors">Blog</a>
        <span aria-hidden="true" className="text-gray-700">·</span>
        <a href="/en/destinos" className="hover:text-amber-400 transition-colors">Destinations</a>
        <span aria-hidden="true" className="text-gray-700">·</span>
        <a href="/deals" className="hover:text-amber-400 transition-colors">Live deals</a>
        <span aria-hidden="true" className="ml-auto text-gray-700">·</span>
        <a
          href="/"
          hrefLang="es"
          rel="alternate"
          className="hover:text-amber-400 transition-colors"
          aria-label="Switch to Spanish"
        >
          🇪🇸 Español
        </a>
      </nav>
      {children}
    </section>
  );
}
