/**
 * /newsletter/unsubscribe — SSS430 (23 may 2026)
 *
 * Página UX para baja manual del newsletter. Complementa el endpoint
 * one-click /api/unsubscribe (con token) que se usa desde links de
 * emails RFC 8058.
 *
 * Render: server component con form client (UnsubscribeForm).
 * No requiere auth — usar email del visitante.
 */
import type { Metadata } from "next";
import { UnsubscribeForm } from "@/components/UnsubscribeForm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Darse de baja del newsletter | TripCazador",
  description:
    "Baja del newsletter de TripCazador en un clic. Sin trucos, sin retención agresiva — sólo cuéntanos por qué (opcional) y listo.",
  alternates: { canonical: `${SITE_URL}/newsletter/unsubscribe` },
  robots: { index: false, follow: false },
};

export const dynamic = "force-static";

export default function NewsletterUnsubscribePage() {
  return (
    <main className="container mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8 text-center">
        <div className="text-5xl">📭</div>
        <h1 className="mt-3 text-3xl font-bold text-white">
          Darse de baja del newsletter
        </h1>
        <p className="mt-3 text-slate-300">
          Introduce tu email y te damos de baja en un clic. Sin trucos.
        </p>
      </header>

      <UnsubscribeForm />

      <section className="mt-10 rounded-xl border border-slate-700 bg-slate-800/40 p-5 text-sm text-slate-300">
        <h2 className="text-base font-bold text-white">¿Hay alternativas?</h2>
        <p className="mt-2">
          Si recibes demasiados emails pero quieres seguir cazando chollos:
        </p>
        <ul className="mt-2 space-y-1">
          <li>
            • <a href="/premium" className="text-amber-400 hover:underline">Premium</a> manda solo
            alertas de tus rutas favoritas (no broadcast)
          </li>
          <li>
            • <a href="https://t.me/tripcazador_bot" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">Telegram</a> es opt-in, tú decides cuándo mirar
          </li>
          <li>
            • <a href="/rss.xml" className="text-amber-400 hover:underline">RSS</a> sigue chollos sin emails
          </li>
        </ul>
      </section>
    </main>
  );
}
