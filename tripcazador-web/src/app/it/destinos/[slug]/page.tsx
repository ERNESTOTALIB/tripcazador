/**
 * /it/destinos/[slug] — WWW01 (May 2026)
 * Italian-language destination guide pages.
 * Mirror of /en/destinos/[slug] using shared I18nDestinoSlugPage component.
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
  if (!dest) return { title: "Destinazione non trovata" };
  const content = dest.i18n.it;
  const title = `Voli economici per ${content.name}`;
  const description = content.description.slice(0, 155);
  return {
    title,
    description,
    alternates: {
      canonical: `/it/destinos/${dest.slug}`,
      languages: {
        it: `${SITE_URL}/it/destinos/${dest.slug}`,
        en: `${SITE_URL}/en/destinos/${dest.slug}`,
        es: `${SITE_URL}/destinos/${dest.esSlug}`,
        de: `${SITE_URL}/de/destinos/${dest.slug}`,
        fr: `${SITE_URL}/fr/destinos/${dest.slug}`,
        "x-default": `${SITE_URL}/destinos/${dest.esSlug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "it_IT",
      url: `${SITE_URL}/it/destinos/${dest.slug}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function ItDestinoPage({ params }: { params: { slug: string } }) {
  if (!DESTINATIONS_I18N[params.slug]) notFound();
  return <I18nDestinoSlugPage locale="it" slug={params.slug} />;
}
