import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";

/**
 * /fr — landing francesa mínima (abr-2026k)
 *
 * Mismo concepto que /de: stub SEO indexable que reserva el slot para los
 * mercados FR/CH/BE francófonos. CDG y BSL son hubs claves para el motor
 * (origen de muchos error fares trans-Atlántico), por lo que el ROI SEO
 * es alto incluso con un stub.
 */

export const metadata: Metadata = {
  title: "TripCazador — Vols pas chers & error fares depuis l'Europe",
  description:
    "Le chasseur automatique de bons plans de vols depuis les hubs européens. Error fares, Business class au prix de l'économie, alertes gratuites par Telegram.",
  alternates: {
    canonical: "/fr",
    languages: {
      "fr": "https://tripcazador.com/fr",
      "fr-FR": "https://tripcazador.com/fr",
      "fr-CH": "https://tripcazador.com/fr",
      "fr-BE": "https://tripcazador.com/fr",
      "es": "https://tripcazador.com/",
      "en": "https://tripcazador.com/en",
      "x-default": "https://tripcazador.com/",
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: ["es_ES", "en_US"],
    url: "https://tripcazador.com/fr",
    siteName: "TripCazador",
    title: "TripCazador — Vols pas chers depuis l'Europe",
    description:
      "Error fares, Business au prix Economy, surveillance 24/7 depuis CDG/BSL/ZRH/AMS.",
  },
};

export const dynamic = "force-static";
export const revalidate = 86400;

export default function FrLandingPage() {
  return (
    <section lang="fr" className="space-y-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "TripCazador",
          url: "https://tripcazador.com/fr",
          inLanguage: "fr",
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
          Vols pas chers & error fares depuis l&apos;Europe
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          Le chasseur automatique de bons plans depuis Paris, Bâle, Zurich,
          Bruxelles et Amsterdam. Nous surveillons les tarifs en continu et
          signalons les anomalies en quelques secondes via Telegram.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="/deals"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold px-5 py-3 rounded-lg transition-colors"
          >
            Voir les bons plans
          </a>
          <a
            href="https://t.me/tripcazador_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-amber-500/40 hover:border-amber-400 text-amber-400 px-5 py-3 rounded-lg transition-colors"
          >
            Bot Telegram gratuit
          </a>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-2">
          <h2 className="text-lg font-bold text-white">Error fares</h2>
          <p className="text-sm text-gray-400">
            Air France CDG→Tokyo en Business à 380 € — nous repérons ces
            erreurs de tarif et alertons avant qu&apos;elles ne disparaissent.
          </p>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-2">
          <h2 className="text-lg font-bold text-white">Business à prix Economy</h2>
          <p className="text-sm text-gray-400">
            Sièges lit-plat sous 1 000 €. Spécial long-courriers vers
            l&apos;Asie, l&apos;Amérique du Nord et le Pacifique.
          </p>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-2">
          <h2 className="text-lg font-bold text-white">Logique saisonnière</h2>
          <p className="text-sm text-gray-400">
            Notre détecteur ajuste les seuils selon la saison et les fêtes.
            500 € pour Punta Cana est normal en septembre, c&apos;est une
            erreur en février.
          </p>
        </div>
      </section>

      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-2xl p-8 border border-amber-500/20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          Contenu détaillé en espagnol ou anglais
        </h2>
        <p className="text-gray-400 mb-4 max-w-xl mx-auto">
          Le blog, les destinations et le flux de bons plans sont actuellement
          disponibles en espagnol et en anglais. Une traduction française
          complète arrive avec la première campagne dédiée FR.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/"
            hrefLang="es"
            rel="alternate"
            className="text-amber-400 hover:text-amber-300"
          >
            🇪🇸 Version espagnole
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
