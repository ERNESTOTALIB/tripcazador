/**
 * /it/destinos — i18n stub (SSS153, may 2026)
 */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Destinazioni — TripCazador (IT)",
  description: "Guide di destinazioni per voli economici. Presto in italiano — attualmente in spagnolo e inglese.",
  alternates: { canonical: "/it/destinos", languages: { es: "/destinos", en: "/en/destinos" } },
};

export const revalidate = 86400;

export default function ItDestinosIndex() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Destinazioni</h1>
      <p className="mt-4 text-slate-600">
        La versione italiana è in fase di traduzione. Nel frattempo puoi consultare:
      </p>
      <ul className="mt-6 space-y-3 text-amber-700">
        <li>🇪🇸 <Link className="underline hover:text-amber-900" href="/destinos">Destinos (Español — versione completa)</Link></li>
        <li>🇬🇧 <Link className="underline hover:text-amber-900" href="/en/destinos">Destinations (English)</Link></li>
        <li>✈️ <Link className="underline hover:text-amber-900" href="/deals">Live deals (1000+ offerte)</Link></li>
      </ul>
    </main>
  );
}
