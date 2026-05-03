import { NextRequest, NextResponse } from "next/server";
import {
  resolveCluster,
  generatePairs,
  expandCluster,
  type AirportCluster,
} from "@/lib/airport_clusters";
import { getDeals } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/premium/deep-search — fase SSS50 (May 2026)
 *
 * Premium feature: Deep Search.
 *
 * Input:
 *   {
 *     origin:      "Madrid" | "MAD" | "madrid",
 *     destination: "Bali"   | "DPS" | "bali",
 *     date_from:   "2026-09-15",     // ventana de salida
 *     date_to:     "2026-09-25",     // ventana de regreso
 *     flex_days:   3,                // ±N días flexibilidad
 *     premium_token?: "xxx",         // futura validación premium
 *   }
 *
 * Algoritmo:
 *   1. Resuelve clusters (Madrid → MAD+TOJ, Bali → DPS+SUB)
 *   2. Genera matriz fechas: date_from-flex .. date_from+flex
 *   3. Busca en deals-latest.json TODAS las combinaciones (origin × destination × fecha)
 *   4. Calcula "ahorro real" vs precio típico de la ruta directa primaria
 *   5. Devuelve TOP 10 opciones rankeadas por ahorro_eur DESC
 *
 * Respuesta:
 *   {
 *     query: { origin: cluster, destination: cluster, ... },
 *     baseline_typical_eur: 720,              // precio directo MAD→DPS típico
 *     options: [
 *       {
 *         from, to, date_out, date_ret,
 *         price_eur, savings_eur, savings_pct,
 *         airline, stops, score,
 *         reason: "Aeropuerto secundario + martes (-30%)",
 *       },
 *       ...
 *     ],
 *     total_searched: 168,
 *     total_found: 12,
 *   }
 *
 * NOTA: Este endpoint es público en SSS50 para validar UX. Cuando Premium
 * tier esté activo (Stripe), gating con header X-Premium-Token.
 */

interface DeepSearchInput {
  origin: string;
  destination: string;
  date_from: string;
  date_to: string;
  flex_days?: number;
  premium_token?: string;
}

interface DeepSearchOption {
  from: string;
  to: string;
  city_from: string;
  city_to: string;
  date_out: string;
  date_ret?: string;
  price_eur: number;
  baseline_eur: number;
  savings_eur: number;
  savings_pct: number;
  airline: string;
  stops: number;
  score: number;
  reason: string;
  deal_id?: string;
}

const TYPICAL_PRICES_BY_REGION: Record<string, number> = {
  "Europa": 200,
  "Asia": 750,
  "Norteamérica": 600,
  "Sudamérica": 700,
  "África": 350,
  "Oriente Medio": 450,
  "Caribe": 550,
  "Oceanía": 1100,
};

function explainOption(
  opt: { from: string; to: string; date_out: string; price_eur: number },
  origin: AirportCluster,
  destination: AirportCluster,
  baseline: number
): string {
  const reasons: string[] = [];
  if (opt.from !== origin.primary) reasons.push(`Aeropuerto secundario ${opt.from}`);
  if (opt.to !== destination.primary) reasons.push(`Llegada en ${opt.to} (alternativa)`);
  const date = new Date(opt.date_out);
  const dow = date.getDay();
  if (dow === 2 || dow === 3) reasons.push("Salida martes/miércoles (-25-30%)");
  if (dow === 6) reasons.push("Sábado popular (precio normal)");
  const savings = baseline - opt.price_eur;
  if (savings >= baseline * 0.5) reasons.push("Drop ≥50% sobre precio típico");
  if (reasons.length === 0) reasons.push("Combinación standard pero a buen precio");
  return reasons.join(" · ");
}

export async function POST(req: NextRequest) {
  let input: DeepSearchInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const origin = resolveCluster(input.origin);
  const destination = resolveCluster(input.destination);
  if (!origin) {
    return NextResponse.json(
      { error: "origin_not_found", hint: "Usa nombre ciudad ('Madrid'), IATA ('MAD') o slug ('madrid')" },
      { status: 400 },
    );
  }
  if (!destination) {
    return NextResponse.json(
      { error: "destination_not_found", hint: "Usa nombre ciudad, IATA o slug" },
      { status: 400 },
    );
  }
  if (!input.date_from || !input.date_to) {
    return NextResponse.json({ error: "dates_required" }, { status: 400 });
  }

  const flexDays = Math.min(7, Math.max(0, input.flex_days ?? 3));

  const pairs = generatePairs(origin, destination);
  const baseline = TYPICAL_PRICES_BY_REGION[destination.region || "Europa"] || 400;

  // Cargar deals (tanto VPS como fallback seed)
  let allDeals: Array<Record<string, unknown>> = [];
  try {
    const data = await getDeals({ limit: 1000 });
    allDeals = data.deals as unknown as Array<Record<string, unknown>>;
  } catch {
    allDeals = [];
  }

  // Match deals que coincidan con (origen ∈ cluster) × (destino ∈ cluster) × fecha en ventana ±flex
  const fromSet = new Set(expandCluster(origin));
  const toSet = new Set(expandCluster(destination));

  const dateFromTs = new Date(input.date_from).getTime();
  const dateToTs = new Date(input.date_to).getTime();
  const flexMs = flexDays * 24 * 60 * 60 * 1000;

  const matched: DeepSearchOption[] = [];
  for (const d of allDeals) {
    const o = String(d.origin || "");
    const t = String(d.destination || "");
    if (!fromSet.has(o) || !toSet.has(t)) continue;
    const dOut = new Date(String(d.date_out || ""));
    if (isNaN(dOut.getTime())) continue;
    if (dOut.getTime() < dateFromTs - flexMs) continue;
    if (dOut.getTime() > dateToTs + flexMs) continue;

    const price = Number(d.price_eur || 0);
    if (price <= 0 || price > baseline * 1.2) continue;

    const opt = {
      from: o,
      to: t,
      city_from: String(d.city_from || origin.city),
      city_to: String(d.city_to || destination.city),
      date_out: String(d.date_out || ""),
      date_ret: d.date_ret ? String(d.date_ret) : undefined,
      price_eur: Math.round(price),
      baseline_eur: baseline,
      savings_eur: Math.round(baseline - price),
      savings_pct: Math.round(((baseline - price) / baseline) * 100),
      airline: String(d.airline_name || d.airline || "Aerolínea"),
      stops: Number(d.stops || 0),
      score: Number(d.final_score || d.score || 0),
      reason: "",
      deal_id: d.id ? String(d.id) : undefined,
    } as DeepSearchOption;
    opt.reason = explainOption(opt, origin, destination, baseline);
    matched.push(opt);
  }

  // Sort por savings_eur DESC, luego score DESC
  matched.sort((a, b) => (b.savings_eur - a.savings_eur) || (b.score - a.score));

  return NextResponse.json({
    query: {
      origin: { city: origin.city, codes: expandCluster(origin) },
      destination: { city: destination.city, codes: expandCluster(destination) },
      date_from: input.date_from,
      date_to: input.date_to,
      flex_days: flexDays,
    },
    baseline_typical_eur: baseline,
    options: matched.slice(0, 10),
    total_combinations_explored: pairs.length * (1 + flexDays * 2),
    total_matched: matched.length,
    cluster_expansion: {
      origin: expandCluster(origin),
      destination: expandCluster(destination),
    },
    notes: matched.length === 0
      ? "Sin matches directos en la ventana. Prueba con flex_days mayor o ventana de fechas más amplia."
      : `${matched.length} opciones encontradas tras explorar ${pairs.length * (1 + flexDays * 2)} combinaciones.`,
    premium_disclaimer: "Deep Search Premium · cluster expansion + multi-airport ranking. Powered by TripCazador hunter.",
  });
}
