/**
 * /panel/vitals — SSS257 (16 may 2026)
 *
 * Dashboard owner para Core Web Vitals samples (LCP/CLS/INP/FCP/TTFB).
 *
 * Backend: /api/admin/vitals (auth via cookie tc_panel_session).
 * Data source: SSS226 web-vitals reporter capturing samples desde cliente.
 *
 * Auth: redirige a /panel/login si no hay session.
 */

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import VitalsDashboard from "@/components/VitalsDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Web Vitals — TripCazador Panel",
  robots: { index: false, follow: false },
};

export default async function VitalsPage() {
  const ck = await cookies();
  const token = ck.get(COOKIE_KEY)?.value;
  if (!token || !verifyToken(token)) {
    redirect("/panel/login?next=/panel/vitals");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Web Vitals</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Core Web Vitals (LCP/CLS/INP/FCP/TTFB) reportados desde cliente —
          últimas 24h. Refresca para datos nuevos.
        </p>
      </header>
      <VitalsDashboard />
    </main>
  );
}
