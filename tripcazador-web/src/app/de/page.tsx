import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

/**
 * /de — landing alemán mínima (abr-2026k)
 *
 * Stub SEO: reserva el slot para el mercado DACH (Schweiz/Österreich
 * principalmente — la audiencia hispano-DACH ya entra desde /). Es bilingüe
 * intencionado: cabecera y CTA en alemán para que un crawler lo indexe como
 * de-DE, cuerpo refiere al producto principal en inglés/español.
 *
 * Cuando tengamos contenido localizado de verdad, esta page se reemplaza por
 * un layout completo /de/* con blog y destinos. Por ahora — descubrible,
 * indexable, hreflang recíproco.
 */

export const metadata: Metadata = {
  title: "TripCazador — Günstige Flüge & Error Fares aus Europa",
  description:
    "Der automatische Schnäppchen-Jäger für Flüge ab europäischen Drehkreuzen. Error Fares, Business-Class zum Economy-Preis, kostenlose Telegram-Benachrichtigungen.",
  alternates: {
    canonical: "/de",
    languages: {
      "de": "https://tripcazador.com/de",
      "de-DE": "https://tripcazador.com/de",
      "de-CH": "https://tripcazador.com/de",
      "de-AT": "https://tripcazador.com/de",
      "es": "https://tripcazador.com/",
      "en": "https://tripcazador.com/en",
      "x-default": "https://tripcazador.com/",
    },
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    alternateLocale: ["es_ES", "en_US"],
    url: "https://tripcazador.com/de",
    siteName: "TripCazador",
    title: "TripCazador — Günstige Flüge aus Europa",
    description:
      "Error Fares, Business zum Economy-Preis, 24/7-Tracking ab BSL/ZRH/MUC/FRA.",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function DeLandingPage() {
  return (
    <section lang="de" className="space-y-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "TripCazador",
          url: "https://tripcazador.com/de",
          inLanguage: "de",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://tripcazador.com/deals?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />

      <header className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
          Günstige Flüge & Error Fares aus Europa
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Der automatische Schnäppchen-Jäger ab Basel, Zürich, München,
          Frankfurt, Wien und Paris. Wir überwachen Tarife rund um die Uhr
          und melden Anomalien sofort per Telegram.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="/deals"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-5 py-3 rounded-lg transition-colors"
          >
            Aktuelle Schnäppchen ansehen
          </a>
          <a
            href="https://t.me/tripcazador_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-amber-500/40 hover:border-amber-400 text-amber-400 px-5 py-3 rounded-lg transition-colors"
          >
            Telegram-Bot abonnieren
          </a>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-2">
          <h2 className="text-lg font-bold text-white">Error Fares finden</h2>
          <p className="text-sm text-gray-400">
            Lufthansa Business FRA→BKK für 299 € — wir entdecken solche
            Tarif-Pannen und warnen, bevor sie verschwinden.
          </p>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-2">
          <h2 className="text-lg font-bold text-white">Business-Schnäppchen</h2>
          <p className="text-sm text-gray-400">
            Flachbett-Sitze unter 1.000 €. Schwerpunkt auf Long-Haul nach
            Asien, USA, Lateinamerika.
          </p>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-2">
          <h2 className="text-lg font-bold text-white">Saisonale Logik</h2>
          <p className="text-sm text-gray-400">
            Unser Detektor passt Schwellen an Saison + Feiertage an. Ein 500 €
            Preis nach Punta Cana ist im September normal, im Februar ein Error.
          </p>
        </div>
      </section>

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-8 border border-amber-500/20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          Vollständige Inhalte auf Spanisch oder Englisch
        </h2>
        <p className="text-gray-400 mb-4 max-w-xl mx-auto">
          Unsere Detail-Seiten (Blog, Reiseziele, Live-Deals) sind aktuell auf
          Spanisch und Englisch. Eine vollständige deutsche Übersetzung kommt
          mit der ersten dedizierten DACH-Kampagne.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/"
            hrefLang="es"
            rel="alternate"
            className="text-amber-400 hover:text-amber-300"
          >
            🇪🇸 Spanische Version
          </a>
          <span aria-hidden="true" className="text-gray-700">·</span>
          <a
            href="/en"
            hrefLang="en"
            rel="alternate"
            className="text-amber-400 hover:text-amber-300"
          >
            🇬🇧 English version
          </a>
        </div>
      </section>
    </section>
  );
}
