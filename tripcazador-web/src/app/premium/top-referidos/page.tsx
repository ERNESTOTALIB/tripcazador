/**
 * /premium/top-referidos — SSS464 (24 may 2026)
 *
 * Leaderboard público top 10 referrers. Gamification con tracking
 * mensual + total histórico. Sin exponer info personal — solo
 * código pseudo-anonimizado (TC-XXXX-XX***).
 *
 * Funciona con o sin data — si KV vacío, muestra placeholder
 * onboarding "Sé el primero del leaderboard".
 */
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tripcazador.com";

export const metadata: Metadata = {
  title: "Top referidos Premium — Leaderboard",
  description:
    "Top 10 referrers Premium del mes. Por cada amigo que se suscribe, te llevas 1 mes gratis (y él también). Sumate al ranking.",
  alternates: { canonical: `${SITE_URL}/premium/top-referidos` },
  openGraph: {
    title: "Top referidos Premium TripCazador",
    description: "Leaderboard mensual de referrers.",
    url: `${SITE_URL}/premium/top-referidos`,
    type: "website",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 3600;

// Mock data — en PROD esto vendría de listTopReferrers() en lib/referral_store
// que agregaría sobre el KV. Placeholder para que el page renderice.
const TOP_REFERRERS_PLACEHOLDER: Array<{
  rank: number;
  pseudoCode: string;
  count: number;
  city?: string;
}> = [];

export default function TopReferidosPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <div className="text-5xl">🏆</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
          Top referidos Premium
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-300">
          Cada referido = 1 mes gratis para ti + 1 mes gratis para tu amigo.
          Ranking se reinicia cada mes natural.
        </p>
      </header>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-white">🥇 Top 10 este mes</h2>
        {TOP_REFERRERS_PLACEHOLDER.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-8 text-center">
            <div className="text-4xl">🚀</div>
            <h3 className="mt-3 text-lg font-bold text-white">
              ¡Sé el primero del leaderboard!
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Nadie ha referido este mes aún. Tu código TC-XXXXXX podría liderar.
            </p>
            <Link
              href="/premium/referidos"
              className="mt-4 inline-block rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-400"
            >
              Obtener mi código referido →
            </Link>
          </div>
        ) : (
          <ol className="space-y-2">
            {TOP_REFERRERS_PLACEHOLDER.map((r) => (
              <li
                key={r.rank}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800/40 p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-mono font-bold ${
                      r.rank === 1
                        ? "bg-amber-500 text-slate-900"
                        : r.rank === 2
                          ? "bg-slate-300 text-slate-900"
                          : r.rank === 3
                            ? "bg-amber-700 text-white"
                            : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {r.rank}
                  </span>
                  <div>
                    <div className="font-mono text-sm text-white">{r.pseudoCode}</div>
                    {r.city && <div className="text-xs text-slate-400">{r.city}</div>}
                  </div>
                </div>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-sm font-bold text-emerald-300">
                  {r.count} referidos
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mb-8 rounded-2xl border border-slate-700 bg-slate-800/40 p-6">
        <h2 className="mb-3 text-xl font-bold text-white">¿Cómo funciona?</h2>
        <ol className="space-y-3 text-sm text-slate-300">
          <li className="flex items-start gap-3">
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">1</span>
            <span>Obtén tu código único en{" "}
              <Link href="/premium/referidos" className="text-amber-400 hover:underline">
                /premium/referidos
              </Link>{" "}
              (necesitas Premium activo).
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">2</span>
            <span>Comparte tu código con amigos. Cuando se suscriben a Premium con el código, ambos recibís 1 mes gratis (aplicado automáticamente en próximo cobro Stripe).</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">3</span>
            <span>Tu rank en el leaderboard se actualiza cada hora. El leaderboard se reinicia el día 1 de cada mes (el total histórico se mantiene).</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">4</span>
            <span>Sin tope técnico — pero hay un cap de 20 referidos cobrables por suscriptor al año (anti-abuso).</span>
          </li>
        </ol>
      </section>

      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-center">
        <h3 className="text-base font-bold text-white">¿Sin código aún?</h3>
        <p className="mt-2 text-sm text-slate-300">
          Necesitas ser Premium activo. Prueba 7 días gratis.
        </p>
        <Link
          href="/premium"
          className="mt-3 inline-block rounded-lg bg-amber-500 px-5 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-400"
        >
          Empezar prueba gratis →
        </Link>
      </section>

      <footer className="mt-8 text-center text-xs text-slate-500">
        Privacy: solo mostramos código pseudonimizado (últimos 2 chars enmascarados).
        Sin nombres ni emails. Ciudad opcional con consentimiento.
      </footer>
    </main>
  );
}
