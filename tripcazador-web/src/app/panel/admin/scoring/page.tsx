/**
 * /panel/admin/scoring — SSS389 (21 may 2026)
 *
 * UI admin para alimentar `deal_scoring_v3` con outcomes (booked /
 * expired_no_takers / false_positive / regular_sale). Cuanto más
 * feedback marca el operator, más preciso el scoring v3 que prediece
 * la confidence de futuros chollos.
 *
 * Layout: form simple — deal_id + route_key + outcome dropdown → POST.
 * Tabla con últimas 20 entradas + agregados por aerolínea/destino.
 *
 * Auth: panel cookie (verifyToken / COOKIE_KEY).
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { ScoringFeedbackClient } from "@/components/ScoringFeedbackClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Scoring Feedback | TripCazador",
  robots: { index: false, follow: false },
};

export default async function AdminScoringPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_KEY)?.value;
  if (!token || !verifyToken(token)) {
    redirect("/panel/login?next=/panel/admin/scoring");
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">🎯 Scoring Feedback</h1>
        <p className="text-sm text-gray-400 mt-1">
          Alimenta el scoring v3 con outcomes reales (cada feedback mejora la
          predicción de futuros chollos).
        </p>
      </header>

      <section className="rounded-2xl border border-gray-700 bg-gray-900/40 p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Registrar outcome</h2>
        <ScoringFeedbackClient />
      </section>

      <section className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5">
        <h3 className="text-base font-bold text-blue-200 mb-2">📚 Outcomes</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>
            <strong className="text-emerald-300">booked</strong> — un usuario
            reservó vía el deal (Premium tracker o Concierge ticket).
          </li>
          <li>
            <strong className="text-gray-300">regular_sale</strong> — el deal
            estaba bien pero precio normal de oferta (no error fare).
          </li>
          <li>
            <strong className="text-amber-300">expired_no_takers</strong> — el
            deal caducó sin bookings (precio quedaba alto / ruta poco demanda).
          </li>
          <li>
            <strong className="text-red-300">false_positive</strong> — error
            del detector: el deal NO era un chollo real (precio normal, mal
            tagged, link roto).
          </li>
        </ul>
        <p className="text-xs text-gray-500 mt-3">
          Mínimo 3 muestras por ruta antes de aplicar boost/penalty. Mínimo 5
          para agregados airline/destination. Persistencia: in-memory globalThis
          (warm container); migrar a Upstash cuando volumen aumente.
        </p>
      </section>
    </main>
  );
}
