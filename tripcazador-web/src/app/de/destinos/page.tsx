/**
 * /de/destinos — i18n stub (SSS153, may 2026)
 */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reiseziele — TripCazador (DE)",
  description: "Reiseführer für günstige Flüge. Bald auf Deutsch — derzeit auf Spanisch und Englisch verfügbar.",
  alternates: { canonical: "/de/destinos", languages: { es: "/destinos", en: "/en/destinos" } },
};

export const revalidate = 86400;

export default function DeDestinosIndex() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Reiseziele</h1>
      <p className="mt-4 text-slate-600">
        Die deutsche Version ist in Vorbereitung. In der Zwischenzeit kannst du folgendes ansehen:
      </p>
      <ul className="mt-6 space-y-3 text-amber-700">
        <li>🇪🇸 <Link className="underline hover:text-amber-900" href="/destinos">Destinos (Español — vollständige Version)</Link></li>
        <li>🇬🇧 <Link className="underline hover:text-amber-900" href="/en/destinos">Destinations (English)</Link></li>
        <li>✈️ <Link className="underline hover:text-amber-900" href="/deals">Live deals (1000+ Schnäppchen)</Link></li>
      </ul>
    </main>
  );
}
