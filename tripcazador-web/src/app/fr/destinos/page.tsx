/**
 * /fr/destinos — i18n stub (SSS153, may 2026)
 *
 * Antes 404. Las páginas /fr/destinos/[slug] existían pero faltaba el índice.
 * Stub minimal: redirige al user a la versión ES o EN si está disponible.
 *
 * Server Component puro.
 */
import type { Metadata } from "next";
import Link from "next/link";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Destinations — TripCazador (FR)",
  description: "Guides de destinations pour vols pas chers. Bientôt en français — actuellement en espagnol et anglais.",
  alternates: { canonical: "/fr/destinos", languages: { es: "/destinos", en: "/en/destinos" } },
};

export const revalidate = 86400;

export default function FrDestinosIndex() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Destinations</h1>
      <p className="mt-4 text-slate-600">
        La version française est en cours de traduction. En attendant, vous pouvez consulter:
      </p>
      <ul className="mt-6 space-y-3 text-amber-700">
        <li>🇪🇸 <Link className="underline hover:text-amber-900" href="/destinos">Destinos (Español — version complète)</Link></li>
        <li>🇬🇧 <Link className="underline hover:text-amber-900" href="/en/destinos">Destinations (English)</Link></li>
        <li>✈️ <Link className="underline hover:text-amber-900" href="/deals">Live deals (1000+ chollos)</Link></li>
      </ul>
    </main>
  );
}
