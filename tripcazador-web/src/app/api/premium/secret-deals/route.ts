/**
 * /api/premium/secret-deals — SSS318 (19 may 2026)
 *
 * Devuelve los deals "secret" Premium-only: classification CRÍTICO/ERROR
 * con found_at < 24h ago. Los users free no los ven hasta que pase la
 * ventana de 24h (entonces salen al /api/deals público).
 *
 * GET ?customer_id=cus_xxx → 200 { ok, deals[], total, ttl_ms_max }
 *
 * AUTH: posesión del customerId Stripe (mismo patrón).
 *
 * Fuente: llama internamente /api/deals (que filtra OUT los secret)
 * NO sirve — necesita la fuente cruda. Para esta etapa usamos el repo
 * fallback directamente porque es la única fuente determinista y
 * pública. Si en el futuro el VPS expone un endpoint privado lo
 * cambiaremos.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { isValidStripeOwnerId } from "@/lib/stripe_id";
import { pickSecretDeals, secretTtlMs } from "@/lib/secret_deals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RawDeal {
  id?: string;
  classification?: string;
  found_at?: string;
  origin?: string;
  destination?: string;
  city_from?: string;
  city_to?: string;
  airline_name?: string;
  price_eur?: number;
  date_out?: string;
  date_ret?: string;
  headline?: string;
  savings_pct?: number;
  booking_url?: string;
  [key: string]: unknown;
}

// REFACTOR (31 may 2026): backend Oracle VPS muerto → lee
// public/deals-latest.json directo. Cache module-level 60s.
let cached: { deals: RawDeal[]; ts: number } | null = null;
const CACHE_MS = 60_000;

async function fetchRawDeals(): Promise<RawDeal[]> {
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_MS) return cached.deals;
  try {
    const filepath = path.join(process.cwd(), "public", "deals-latest.json");
    const raw = await fs.readFile(filepath, "utf8");
    const json = JSON.parse(raw) as { deals?: RawDeal[] };
    const deals = Array.isArray(json.deals) ? json.deals : [];
    cached = { deals, ts: now };
    return deals;
  } catch {
    return cached?.deals ?? [];
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const customerId = req.nextUrl.searchParams.get("customer_id") || "";
  if (!isValidStripeOwnerId(customerId)) {
    return NextResponse.json(
      { ok: false, error: "customer_id_invalid" },
      { status: 400 },
    );
  }

  const all = await fetchRawDeals();
  const now = Date.now();
  const secret = pickSecretDeals(all, now);
  // Ordenar por más reciente primero (found_at descendente)
  secret.sort((a, b) => {
    const ta = a.found_at ? Date.parse(a.found_at) : 0;
    const tb = b.found_at ? Date.parse(b.found_at) : 0;
    return tb - ta;
  });

  // Calcular TTL restante para cada deal (UI puede mostrar countdown)
  const enriched = secret.map((d) => ({
    ...d,
    ttl_ms: secretTtlMs(d, now),
  }));

  return NextResponse.json({
    ok: true,
    total: enriched.length,
    deals: enriched.slice(0, 50),
  });
}
