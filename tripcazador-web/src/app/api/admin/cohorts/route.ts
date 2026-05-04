import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { getRecentEvents } from "@/lib/event_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/cohorts — fase SSS64 (May 2026)
 *
 * Calcula retención D1/D7/D30 a partir del event_store ring buffer (24h
 * en memoria + persistencia JSONL backend en Vercel).
 *
 * Definición:
 *   - "Cohorte D" = visitor_ids únicos cuya PRIMERA aparición fue hoy-D días.
 *   - "Retorno DN" = % de la cohorte que aparece de nuevo hoy.
 *
 * Limitación conocida: el ring buffer in-memory es 5k events / 24h. Para
 * D7/D30 de verdad hace falta persistencia. Por ahora usamos los eventos
 * del JSONL backend si NEXT_PUBLIC_API_URL está configurado.
 *
 * Output:
 *   {
 *     cohorts: [{ day, label, size, returned, retention_pct }],
 *     summary: { d1, d7, d30 },
 *     limitations: [...]
 *   }
 */

interface CohortRow {
  day: number;
  label: string;
  cohort_size: number;
  returned_today: number;
  retention_pct: number | null;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_KEY)?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const events = getRecentEvents();
  const now = Date.now();
  const day = 24 * 3600 * 1000;

  // Para cada visitor_id, registrar su primer ts visto en la ventana
  const firstSeen = new Map<string, number>();
  const seenToday = new Set<string>();
  const todayStart = now - day;
  for (const e of events) {
    const cur = firstSeen.get(e.visitor_id);
    if (cur === undefined || e.ts < cur) firstSeen.set(e.visitor_id, e.ts);
    if (e.ts >= todayStart) seenToday.add(e.visitor_id);
  }

  function cohortFor(daysAgo: number): CohortRow {
    const lo = now - (daysAgo + 1) * day;
    const hi = now - daysAgo * day;
    const cohort = new Set<string>();
    for (const [vid, firstTs] of Array.from(firstSeen.entries())) {
      if (firstTs >= lo && firstTs < hi) cohort.add(vid);
    }
    let returned = 0;
    for (const vid of Array.from(cohort)) {
      if (seenToday.has(vid)) returned++;
    }
    const pct = cohort.size > 0 ? (returned / cohort.size) * 100 : null;
    return {
      day: daysAgo,
      label: daysAgo === 1 ? "D1 (ayer)" : daysAgo === 7 ? "D7 (hace 1 semana)" : `D${daysAgo}`,
      cohort_size: cohort.size,
      returned_today: returned,
      retention_pct: pct === null ? null : Math.round(pct * 10) / 10,
    };
  }

  const cohorts = [cohortFor(1), cohortFor(3), cohortFor(7), cohortFor(14), cohortFor(30)];

  return NextResponse.json({
    cohorts,
    summary: {
      d1: cohorts[0].retention_pct,
      d7: cohorts[2].retention_pct,
      d30: cohorts[4].retention_pct,
    },
    limitations: [
      "Ring buffer in-memory: 5k events / 24h por instancia Vercel",
      "Cohort D7/D30 requiere event_log JSONL backend con TTL ≥30d",
      "visitor_id = SHA256(IP+UA) — visitantes con IP dinámica generan cohorts inflados",
    ],
    generated_at: new Date().toISOString(),
  });
}
