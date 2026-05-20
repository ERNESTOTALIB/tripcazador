/**
 * /creator/[handle] — SSS364 (21 may 2026)
 *
 * Influencer marketplace: landings branded para travel creators que
 * comparten sus chollos curados con su audiencia. Cada signup Premium
 * con su ref code = 8% comisión al creator.
 *
 * Posicionamiento: "Cazador oficial TripCazador" — semi-affiliate.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { findCreator, getAllCreatorHandles } from "@/lib/creators_seed";
import { getDeals } from "@/lib/api";
import { DealCard } from "@/components/DealCard";
import { breadcrumbSchema } from "@/lib/schema_helpers";

export const revalidate = 3600;

export async function generateStaticParams() {
  return getAllCreatorHandles().map((handle) => ({ handle }));
}

export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const creator = findCreator(params.handle);
  if (!creator) return { title: "Creator no encontrado" };
  return {
    title: `Chollos curados por ${creator.display_name} | TripCazador`,
    description: `${creator.bio.slice(0, 140)}... Descubre los chollos de vuelos seleccionados por ${creator.display_name}.`,
    alternates: { canonical: `/creator/${creator.handle}` },
    openGraph: {
      title: `Chollos de ${creator.display_name}`,
      description: creator.bio,
      type: "profile",
    },
  };
}

export default async function CreatorPage({
  params,
}: {
  params: { handle: string };
}) {
  const creator = findCreator(params.handle);
  if (!creator) notFound();

  // Curated deals: filtramos por topics del creator
  const dealsData = await getDeals({ limit: 100 }).catch(() => null);
  const allDeals = dealsData?.deals || [];
  const curatedDeals = allDeals
    .filter((d) => {
      const region = (d.region || "").toLowerCase();
      const cabin = (d.cabin || "").toLowerCase();
      return creator.topics.some((t) =>
        t === "business-class" ? cabin.includes("business") : region.includes(t),
      );
    })
    .slice(0, 8);

  const breadcrumbLd = breadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Creators", url: "/creators" },
    { name: creator.display_name, url: `/creator/${creator.handle}` },
  ]);

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: creator.display_name,
    description: creator.bio,
    sameAs: Object.values(creator.social).filter(Boolean),
  };

  return (
    <div className="space-y-10">
      <JsonLd data={[breadcrumbLd, personLd]} />

      <header className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-5xl">
            {creator.avatar}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{creator.display_name}</h1>
            <p className="text-sm text-amber-300 mt-1">Cazador oficial TripCazador</p>
            {creator.followers_total && (
              <p className="text-xs text-gray-400 mt-0.5">
                {creator.followers_total.toLocaleString()} seguidores totales
              </p>
            )}
            <p className="text-sm text-gray-300 mt-3 max-w-2xl">{creator.bio}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {creator.social.instagram && (
                <a
                  href={creator.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-xs text-pink-400 hover:border-pink-500/40"
                >
                  📷 Instagram
                </a>
              )}
              {creator.social.tiktok && (
                <a
                  href={creator.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-xs text-white hover:border-amber-500/40"
                >
                  🎵 TikTok
                </a>
              )}
              {creator.social.youtube && (
                <a
                  href={creator.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-xs text-rose-400 hover:border-rose-500/40"
                >
                  📺 YouTube
                </a>
              )}
              {creator.social.twitter && (
                <a
                  href={creator.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-xs text-sky-400 hover:border-sky-500/40"
                >
                  𝕏 Twitter
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Curated deals */}
      {curatedDeals.length > 0 ? (
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">
            🎯 Chollos curados por {creator.display_name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {curatedDeals.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center">
          <p className="text-sm text-gray-400">
            Ahora mismo no hay chollos activos en los topics de {creator.display_name}.
            Suscríbete para recibir el próximo en cuanto aparezca.
          </p>
        </section>
      )}

      {/* CTA Premium con ref code */}
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="text-xl font-bold text-white mb-2">
          Recibe los próximos chollos de {creator.display_name}
        </h2>
        <p className="text-sm text-gray-300 mb-4">
          Suscríbete a TripCazador Premium con código <code className="text-amber-300 font-mono">{creator.ref_code}</code> y
          recibe 1 mes gratis. {creator.display_name} recibe una pequeña comisión.
        </p>
        <Link
          href={`/premium?ref=${encodeURIComponent(creator.ref_code)}`}
          className="inline-block px-5 py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm"
        >
          🚀 Probar Premium con {creator.ref_code}
        </Link>
      </section>

      {/* Become a creator CTA */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-lg font-bold text-white mb-2">¿Eres creator travel?</h2>
        <p className="text-sm text-gray-400 mb-3">
          Únete al programa: tu landing dedicada + tracking 8% comisión por cada
          subscripción Premium que generes. Pago mensual via Stripe o bank transfer.
        </p>
        <Link
          href="/creators"
          className="inline-block text-sm text-amber-400 hover:underline"
        >
          Apply al programa →
        </Link>
      </section>
    </div>
  );
}
