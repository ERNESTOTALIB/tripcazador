import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

/**
 * /it — landing italiana mínima (abr-2026p)
 *
 * Stub SEO: reserva el slot para el mercado italiano. Italia es uno de los
 * mayores mercados europeos de viajeros que vuelan desde MXP/FCO/BGY hacia
 * Asia/USA/LATAM. Page bilingüe estratégica: cabecera y CTA en italiano para
 * indexarse como it-IT, cuerpo refiere al producto principal en español/inglés.
 *
 * Cuando tengamos contenido localizado completo, esta page se reemplaza por
 * un layout /it/* con blog y destinos. Por ahora — descubrible, indexable,
 * hreflang recíproco.
 */

export const metadata: Metadata = {
  title: "TripCazador — Voli economici ed error fare dall'Europa",
  description:
    "Il cacciatore automatico di offerte di volo dai principali hub europei. Error fare, business class a prezzo economy, notifiche Telegram gratuite.",
  alternates: {
    canonical: "/it",
    languages: {
      "it": "https://tripcazador.com/it",
      "it-IT": "https://tripcazador.com/it",
      "it-CH": "https://tripcazador.com/it",
      "es": "https://tripcazador.com/",
      "en": "https://tripcazador.com/en",
      "de": "https://tripcazador.com/de",
      "fr": "https://tripcazador.com/fr",
      "x-default": "https://tripcazador.com/",
    },
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    alternateLocale: ["es_ES", "en_US", "de_DE", "fr_FR"],
    url: "https://tripcazador.com/it",
    siteName: "TripCazador",
    title: "TripCazador — Voli economici dall'Europa",
    description:
      "Error fare, business a prezzo economy, monitoraggio 24/7 da MXP/FCO/BGY/VCE.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "TripCazador — chollos de vuelo desde Europa" }],
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function ItLandingPage() {
  return (
    <section lang="it" className="space-y-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "TripCazador",
          url: "https://tripcazador.com/it",
          inLanguage: "it",
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
          Voli economici ed error fare dall&apos;Europa
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Il cacciatore automatico di offerte di volo da Milano, Roma, Bergamo,
          Venezia, Bologna e Napoli. Monitoriamo le tariffe 24 ore su 24 e
          segnaliamo le anomalie istantaneamente via Telegram.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="/deals"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-5 py-3 rounded-lg transition-colors"
          >
            Vedi le offerte attuali
          </a>
          <a
            href="https://t.me/tripcazador_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-amber-500/40 hover:border-amber-400 text-amber-400 px-5 py-3 rounded-lg transition-colors"
          >
            Iscriviti al bot Telegram
          </a>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-2">
          <h2 className="text-lg font-bold text-white">Trova error fare</h2>
          <p className="text-sm text-gray-400">
            Business Lufthansa MXP→BKK a 299 €: scopriamo questi errori
            tariffari e ti avvisiamo prima che spariscano.
          </p>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-2">
          <h2 className="text-lg font-bold text-white">Offerte business</h2>
          <p className="text-sm text-gray-400">
            Posti flat-bed sotto i 1.000 €. Focus su long-haul verso Asia,
            Stati Uniti, America Latina.
          </p>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-2">
          <h2 className="text-lg font-bold text-white">Logica stagionale</h2>
          <p className="text-sm text-gray-400">
            Il nostro detector adatta le soglie alla stagione + festività. Un
            prezzo di 500 € per Punta Cana è normale a settembre, è un errore
            a febbraio.
          </p>
        </div>
      </section>

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-8 border border-amber-500/20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          Contenuti completi in spagnolo o inglese
        </h2>
        <p className="text-gray-400 mb-4 max-w-xl mx-auto">
          Le pagine di dettaglio (blog, destinazioni, deal live) sono
          attualmente in spagnolo e inglese. Una traduzione italiana completa
          arriverà con la prima campagna dedicata al mercato italiano.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/"
            hrefLang="es"
            rel="alternate"
            className="text-amber-400 hover:text-amber-300"
          >
            🇪🇸 Versione spagnola
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
