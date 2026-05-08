/**
 * I18nDestinoSlugPage — WWW01-03 (May 2026)
 *
 * Componente compartido para renderizar /it /de /fr destinos[slug].
 * Acepta `locale` y delega traducciones a `destinations_i18n.ts`.
 *
 * Mantenemos un único componente para los 3 idiomas DACH/IT en lugar de
 * duplicar 3 templates casi idénticos. Esto reduce drift de UI cuando
 * cambiamos JSON-LD, hreflang, o cross-links.
 */
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { TravelInsuranceCTA } from "@/components/TravelInsuranceCTA";
import {
  DESTINATIONS_I18N,
  UI_STRINGS,
  type Locale,
} from "@/lib/destinations_i18n";

const SITE_URL = "https://tripcazador.com";

interface Props {
  locale: Locale;
  slug: string;
}

export function I18nDestinoSlugPage({ locale, slug }: Props) {
  const dest = DESTINATIONS_I18N[slug];
  if (!dest) return null;

  const t = UI_STRINGS[locale];
  const content = dest.i18n[locale];
  const ogLocale = locale === "it" ? "it_IT" : locale === "de" ? "de_DE" : "fr_FR";
  void ogLocale; // referenced via metadata generators in page.tsx files

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.home, item: `${SITE_URL}/${locale}` },
      {
        "@type": "ListItem",
        position: 2,
        name: t.destinations,
        item: `${SITE_URL}/${locale}/destinos`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: content.name,
        item: `${SITE_URL}/${locale}/destinos/${dest.slug}`,
      },
    ],
  };

  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: content.name,
    description: content.description,
    inLanguage: locale === "it" ? "it-IT" : locale === "de" ? "de-DE" : "fr-FR",
    image: `${SITE_URL}/og-default.png`,
    url: `${SITE_URL}/${locale}/destinos/${dest.slug}`,
    iataCode: dest.iata.join(", "),
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={placeJsonLd} />

      <nav aria-label="Breadcrumb" className="text-xs text-gray-500 mb-4">
        <Link href={`/${locale}`} className="hover:text-amber-300">
          {t.home}
        </Link>
        {" / "}
        <Link href={`/${locale}/destinos`} className="hover:text-amber-300">
          {t.destinations}
        </Link>
        {" / "}
        <span className="text-gray-300">{content.name}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 text-balance">
          {dest.emoji} {t.cheapFlightsTo} {content.name}
        </h1>
        <p className="text-gray-300 max-w-3xl">{content.description}</p>
        {dest.avgErrorFare && (
          <p className="mt-4 text-amber-300 font-semibold">
            {t.avgErrorFare}:{" "}
            <span className="text-3xl">€{dest.avgErrorFare}</span>{" "}
            <span className="text-xs text-gray-400">{t.economyRt}</span>
          </p>
        )}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <Stat label={t.country} value={content.countryLocal} />
        <Stat label={t.avgTemp} value={content.avgTemp} />
        <Stat label={t.flightTime} value={content.flightTime} />
        <Stat label={t.airports} value={dest.iata.join(" · ")} />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-3">{t.bestMonths}</h2>
        <div className="flex flex-wrap gap-2">
          {content.bestMonths.map((m) => (
            <span
              key={m}
              className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 text-sm"
            >
              {m}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-white mb-3">
          {t.hunterTips} — {content.name}
        </h2>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          {content.tips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      </section>

      {dest.isLongHaul && (
        <section className="mb-10">
          <TravelInsuranceCTA variant="expanded" destination={content.name} />
        </section>
      )}

      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 mb-10">
        <h2 className="text-xl font-bold text-white mb-2">
          {t.notifyMe} — {content.name}
        </h2>
        <p className="text-gray-300 mb-3">{t.notifyDescription}</p>
        <Link
          href={`/${locale}`}
          className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition-colors"
        >
          {t.notifyMe}
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-300 mb-3">{t.otherDestinations}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {Object.values(DESTINATIONS_I18N)
            .filter((d) => d.slug !== dest.slug)
            .slice(0, 6)
            .map((d) => (
              <Link
                key={d.slug}
                href={`/${locale}/destinos/${d.slug}`}
                className="text-amber-300 hover:underline"
              >
                {d.emoji} {d.i18n[locale].name}
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
      <div className="text-xs uppercase tracking-wider text-gray-500">{label}</div>
      <div className="text-sm text-white mt-1 font-semibold">{value}</div>
    </div>
  );
}
