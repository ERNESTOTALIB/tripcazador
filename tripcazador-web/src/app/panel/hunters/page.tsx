/**
 * /panel/hunters — fase qqq4
 *
 * Dashboard owner para monitorear motor hunter:
 * - Salud worker cron (last run, deals total, status)
 * - Distribución templates seed (region, mes, origen, clasificación)
 * - Alertas activas (worker caído, quota baja, catálogo pequeño)
 * - Botón trigger manual hunt (workflow_dispatch)
 *
 * Auth: redirige a /panel/login si no hay session.
 */

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import HuntersDashboard from "@/components/HuntersDashboard";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hunters Dashboard — TripCazador Panel",
  robots: { index: false, follow: false },
};

export default async function HuntersPage() {
  // SSS265 (17 may 2026): cookie name era "panel_session" (incorrecta) en
  // lugar de COOKIE_KEY="tc_panel_session". Resultado: pese a estar
  // logueado en /panel, este endpoint siempre redirecciona al login.
  // Bug funcional (no de seguridad — over-protects vs bypass).
  const ck = await cookies();
  const session = verifyToken(ck.get(COOKIE_KEY)?.value);
  if (!session) {
    redirect("/panel/login?next=/panel/hunters");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Hunters Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Monitorización tiempo-real del motor de búsqueda. Métricas refrescan cada 30s.
        </p>
      </header>
      <HuntersDashboard />
    </main>
  );
}
