import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { getVitalsSamples } from "@/lib/vitals_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/vitals — fase SSS64 (May 2026)
 *
 * Agrega p75 por página + métrica desde el ring buffer de /api/web-vitals.
 *
 * No depende de GA4 Reporting API (que requiere service account + scope
 * Property Editor). Esto es ground-truth desde nuestro propio cliente.
 *
 * Output:
 *   {
 *     by_page: [{ path, samples, p75: { LCP, CLS, INP, FCP, TTFB } }],
 *     overall: { LCP, CLS, INP, FCP, TTFB },
 *     thresholds: { LCP: { good: 2500, poor: 4000 }, ... },
 *     generated_at: ISO
 *   }
 */

interface PageRow {
  path: string;
  samples: number;
  p75: Record<string, number | null>;
}

const THRESHOLDS = {
  LCP: { good: 2500, needs: 4000, unit: "ms" },
  CLS: { good: 0.1, needs: 0.25, unit: "score" },
  INP: { good: 200, needs: 500, unit: "ms" },
  FCP: { good: 1800, needs: 3000, unit: "ms" },
  TTFB: { good: 800, needs: 1800, unit: "ms" },
} as const;

function p75(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * 0.75);
  return sorted[Math.min(idx, sorted.length - 1)];
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_KEY)?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const samples = getVitalsSamples();
  if (samples.length === 0) {
    return NextResponse.json({
      by_page: [],
      overall: {},
      thresholds: THRESHOLDS,
      sample_count: 0,
      generated_at: new Date().toISOString(),
      note: "No samples yet. Web Vitals empezarán a llegar en cuanto se desplegueSSS64 con WebVitalsReporter llamando /api/web-vitals.",
    });
  }

  // Por página
  const pageMap = new Map<string, Map<string, number[]>>();
  for (const s of samples) {
    const m = pageMap.get(s.page_path) || new Map<string, number[]>();
    const arr = m.get(s.name) || [];
    arr.push(s.value);
    m.set(s.name, arr);
    pageMap.set(s.page_path, m);
  }

  const by_page: PageRow[] = [];
  for (const [path, metrics] of Array.from(pageMap.entries())) {
    const p75Map: Record<string, number | null> = {};
    let total = 0;
    for (const [name, vals] of Array.from(metrics.entries())) {
      p75Map[name] = p75(vals);
      total += vals.length;
    }
    by_page.push({ path, samples: total, p75: p75Map });
  }
  by_page.sort((a, b) => b.samples - a.samples);

  // Overall (cross-page)
  const overall: Record<string, number | null> = {};
  for (const name of Object.keys(THRESHOLDS)) {
    const all = samples.filter((s) => s.name === name).map((s) => s.value);
    overall[name] = p75(all);
  }

  return NextResponse.json({
    by_page: by_page.slice(0, 30),
    overall,
    thresholds: THRESHOLDS,
    sample_count: samples.length,
    generated_at: new Date().toISOString(),
  });
}
