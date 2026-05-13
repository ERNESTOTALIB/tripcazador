/**
 * /en/comparar — i18n stub (SSS153, may 2026)
 *
 * Antes 404. /en/comparar/[slug] existía pero faltaba el índice.
 */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Compare airlines — TripCazador",
  description: "Head-to-head airline comparisons for European travelers. 38+ matchups.",
  alternates: { canonical: "/en/comparar", languages: { es: "/comparar-aerolineas" } },
};

export const revalidate = 86400;

export default function EnCompararIndex() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Compare airlines</h1>
      <p className="mt-4 text-slate-600">
        The English version of our 38+ airline head-to-head comparisons is in translation.
        For now, the full catalog is available in Spanish:
      </p>
      <ul className="mt-6 space-y-3 text-amber-700">
        <li>🇪🇸 <Link className="underline hover:text-amber-900" href="/comparar-aerolineas">Comparar aerolíneas (Spanish, 38+ matchups)</Link></li>
        <li>📰 <Link className="underline hover:text-amber-900" href="/en/blog">Blog (English long-form)</Link></li>
        <li>✈️ <Link className="underline hover:text-amber-900" href="/deals">Live deals</Link></li>
      </ul>
    </main>
  );
}
