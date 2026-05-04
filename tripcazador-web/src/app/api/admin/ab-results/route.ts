import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { getRecentEvents } from "@/lib/event_store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/ab-results — fase SSS64 (May 2026)
 *
 * Calcula resultados de los experimentos A/B con chi-square test.
 *
 * Cómo:
 *   1. Recorre eventos del ring buffer (24h) buscando metadata
 *      `experiment` + `variant` + el evento de "conversion" canonical:
 *      por defecto = deal_click. Configurable por experiment.
 *   2. Cuenta exposures (denominator) y conversions (numerator) por variant.
 *   3. Aplica chi-square test (1 df) → p-value → significant si p < 0.05.
 *
 * Limitación: solo agrega eventos de las últimas 24h del ring local.
 * Para ventanas mayores hace falta backend persistencia.
 */

interface VariantStats {
  variant: string;
  exposures: number;
  conversions: number;
  conv_rate: number;
}

interface ExperimentResult {
  experiment: string;
  variants: VariantStats[];
  chi_square: number | null;
  p_value: number | null;
  significant: boolean;
  winner: string | null;
  uplift_pct: number | null;
}

// Tabla chi-square para 1 grado de libertad (sample p-values)
const CHI_TABLE: Array<[number, number]> = [
  [0.0, 1.0], [1.0, 0.317], [2.0, 0.157], [2.706, 0.10],
  [3.0, 0.083], [3.841, 0.05], [5.0, 0.0254], [5.024, 0.025],
  [6.0, 0.0143], [6.635, 0.01], [7.879, 0.005], [10.828, 0.001],
];
function approxPvalue(chi: number): number {
  if (!Number.isFinite(chi) || chi <= 0) return 1.0;
  for (let i = CHI_TABLE.length - 1; i >= 0; i--) {
    if (chi >= CHI_TABLE[i][0]) return CHI_TABLE[i][1];
  }
  return 1.0;
}

function chiSquare2x2(exp1: number, conv1: number, exp2: number, conv2: number): number {
  const n1 = exp1, n2 = exp2;
  const c1 = conv1, c2 = conv2;
  if (n1 === 0 || n2 === 0) return 0;
  const totalExp = n1 + n2;
  const totalConv = c1 + c2;
  const totalNonConv = totalExp - totalConv;
  if (totalConv === 0 || totalNonConv === 0) return 0;

  const e1c = (n1 * totalConv) / totalExp;
  const e2c = (n2 * totalConv) / totalExp;
  const e1nc = n1 - e1c;
  const e2nc = n2 - e2c;
  const o1nc = n1 - c1;
  const o2nc = n2 - c2;
  return (
    Math.pow(c1 - e1c, 2) / e1c +
    Math.pow(o1nc - e1nc, 2) / e1nc +
    Math.pow(c2 - e2c, 2) / e2c +
    Math.pow(o2nc - e2nc, 2) / e2nc
  );
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_KEY)?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const events = getRecentEvents();

  // Agrupar exposures + conversions por experiment+variant
  const exposureMap = new Map<string, Map<string, number>>(); // exp → variant → count
  const conversionMap = new Map<string, Map<string, number>>();

  for (const e of events) {
    const exp = e.meta?.experiment ? String(e.meta.experiment) : null;
    const variant = e.meta?.variant ? String(e.meta.variant) : null;
    if (!exp || !variant) continue;

    if ((e.type as string) === "experiment_exposure" || (e.type as string) === "page_view") {
      const m = exposureMap.get(exp) || new Map<string, number>();
      m.set(variant, (m.get(variant) || 0) + 1);
      exposureMap.set(exp, m);
    }
    if (e.type === "deal_click" || e.type === "booking_redirect" || e.type === "premium_cta_click") {
      const m = conversionMap.get(exp) || new Map<string, number>();
      m.set(variant, (m.get(variant) || 0) + 1);
      conversionMap.set(exp, m);
    }
  }

  const results: ExperimentResult[] = [];
  const allExperiments = new Set<string>([
    ...Array.from(exposureMap.keys()),
    ...Array.from(conversionMap.keys()),
  ]);
  for (const exp of Array.from(allExperiments)) {
    const exposures = exposureMap.get(exp) || new Map<string, number>();
    const conversions = conversionMap.get(exp) || new Map<string, number>();
    const variantNames = new Set<string>([
      ...Array.from(exposures.keys()),
      ...Array.from(conversions.keys()),
    ]);
    const variants: VariantStats[] = [];
    for (const v of Array.from(variantNames)) {
      const expC = exposures.get(v) || 0;
      const conC = conversions.get(v) || 0;
      variants.push({
        variant: v,
        exposures: expC,
        conversions: conC,
        conv_rate: expC > 0 ? Math.round((conC / expC) * 10000) / 100 : 0,
      });
    }
    variants.sort((a, b) => a.variant.localeCompare(b.variant));

    let chi: number | null = null;
    let p: number | null = null;
    let winner: string | null = null;
    let uplift: number | null = null;
    let significant = false;
    if (variants.length === 2) {
      const [A, B] = variants;
      chi = chiSquare2x2(A.exposures, A.conversions, B.exposures, B.conversions);
      p = approxPvalue(chi);
      significant = p < 0.05;
      if (significant) {
        if (B.conv_rate > A.conv_rate) {
          winner = B.variant;
          uplift = A.conv_rate > 0
            ? Math.round(((B.conv_rate - A.conv_rate) / A.conv_rate) * 1000) / 10
            : null;
        } else if (A.conv_rate > B.conv_rate) {
          winner = A.variant;
          uplift = B.conv_rate > 0
            ? Math.round(((A.conv_rate - B.conv_rate) / B.conv_rate) * 1000) / 10
            : null;
        }
      }
    }

    results.push({
      experiment: exp,
      variants,
      chi_square: chi === null ? null : Math.round(chi * 100) / 100,
      p_value: p,
      significant,
      winner,
      uplift_pct: uplift,
    });
  }

  return NextResponse.json({
    experiments: results,
    note: "p-value es aproximación interpolada de tabla chi² (1 df). Mín. 200 exposures por variante para conclusión robusta.",
    generated_at: new Date().toISOString(),
  });
}
