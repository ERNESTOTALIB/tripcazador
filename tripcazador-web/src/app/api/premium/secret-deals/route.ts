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
import { isValidStripeOwnerId } from "@/lib/stripe_id";
import { pickSecretDeals, secretTtlMs } from "@/lib/secret_deals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO_BASE = "https://raw.githubusercontent.com/ERNESTOTALIB/tripcazador/main";
const VPS_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.tripcazador.com";

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

async function fetchRawDeals(): Promise<RawDeal[]> {
  // 1) VPS primero
  try {
    const res = await fetch(`${VPS_BASE}/api/deals?limit=500`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const arr = Array.isArray(data) ? data : Array.isArray(data?.deals) ? data.deals : [];
      if (arr.length > 0) return arr as RawDeal[];
    }
  } catch {
    /* no-op */
  }
  // 2) Repo fallback
  try {
    const res = await fetch(`${REPO_BASE}/deals-latest.json`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.deals)) return data.deals as RawDeal[];
      if (Array.isArray(data)) return data as RawDeal[];
    }
  } catch {
    /* no-op */
  }
  return [];
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
