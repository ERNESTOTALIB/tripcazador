/**
 * /de/destinos/[slug] — WWW02 (May 2026)
 * German-language destination guide pages.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { I18nDestinoSlugPage } from "@/components/I18nDestinoSlugPage";
import { DESTINATIONS_I18N } from "@/lib/destinations_i18n";

const SITE_URL = "https://tripcazador.com";

export const dynamic = "force-static";
export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(DESTINATIONS_I18N).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const dest = DESTINATIONS_I18N[params.slug];
  if (!dest) return { title: "Reiseziel nicht gefunden" };
  const content = dest.i18n.de;
  const title = `Günstige Flüge nach ${content.name} | TripCazador`;
  const description = content.description.slice(0, 155);
  return {
    title,
    description,
    alternates: {
      canonical: `/de/destinos/${dest.slug}`,
      languages: {
        de: `${SITE_URL}/de/destinos/${dest.slug}`,
        en: `${SITE_URL}/en/destinos/${dest.slug}`,
        es: `${SITE_URL}/destinos/${dest.esSlug}`,
        it: `${SITE_URL}/it/destinos/${dest.slug}`,
        fr: `${SITE_URL}/fr/destinos/${dest.slug}`,
        "x-default": `${SITE_URL}/destinos/${dest.esSlug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "de_DE",
      url: `${SITE_URL}/de/destinos/${dest.slug}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function DeDestinoPage({ params }: { params: { slug: string } }) {
  if (!DESTINATIONS_I18N[params.slug]) notFound();
  return <I18nDestinoSlugPage locale="de" slug={params.slug} />;
}
