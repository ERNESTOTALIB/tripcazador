/**
 * /api/admin/concierge/tickets — fase sss SSS10 (May 2026)
 *
 * Devuelve la lista canónica de pedidos Concierge (todos los tiers) para el
 * panel admin. Auth: o bien cookie panel_session (panel logueado) o bien
 * header X-Admin-Token: <ADMIN_TOKEN> (server-to-server).
 *
 * Fuente de datos: backend FastAPI VPS (`/api/admin/concierge/orders`).
 * Si el backend no está accesible, devuelve {orders: [], source: "unavailable"}
 * para que el panel pueda fallback a localStorage browser-side.
 *
 * Respuesta normalizada incluye `tier` (con fallback "standard" para pedidos
 * antiguos pre-tiered).
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import {
  CONCIERGE_TIERS,
  isValidTier,
  type ConciergeTier,
} from "@/lib/concierge_tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

interface RawOrder {
  id?: string;
  email?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
  origin?: string;
  destination?: string;
  date_from?: string;
  date_to?: string;
  flex_days?: number;
  budget?: number;
  travelers?: number;
  hotel_stars?: number;
  notes?: string;
  amount_paid_eur?: number;
  stripe_session_id?: string;
  delivered_at?: string;
  paid_at?: string;
  tier?: string;
  // Si el backend marca paid via webhook
  paid?: boolean;
}

interface NormalizedTicket {
  id: string;
  tier: ConciergeTier;
  tier_label: string;
  email: string;
  origin: string;
  destination: string;
  date_from: string;
  date_to: string;
  flex_days: number;
  budget: number;
  travelers: number;
  hotel_stars: number;
  notes: string;
  paid: boolean;
  paid_at: string | null;
  status: "pending" | "in_progress" | "delivered" | "refunded";
  amount_paid_eur: number;
  stripe_session_id: string | null;
  created_at: string;
  delivered_at: string | null;
}

interface TicketsResponse {
  orders: NormalizedTicket[];
  source: "remote" | "unavailable";
  total: number;
  by_tier: Record<ConciergeTier, number>;
  by_status: Record<NormalizedTicket["status"], number>;
}

/** Auth dual: cookie panel_session O header X-Admin-Token */
function authorize(req: Request): boolean {
  // 1) Cookie del panel
  const cookieToken = cookies().get(COOKIE_KEY)?.value;
  if (cookieToken && verifyToken(cookieToken)) return true;

  // 2) Header X-Admin-Token vs ADMIN_TOKEN env
  const hdr = req.headers.get("x-admin-token") || "";
  if (ADMIN_TOKEN && hdr && constantTimeEq(hdr, ADMIN_TOKEN)) return true;

  return false;
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function normalizeStatus(s: string | undefined): NormalizedTicket["status"] {
  if (s === "in_progress" || s === "delivered" || s === "refunded") return s;
  return "pending";
}

function normalizeTier(t: string | undefined): ConciergeTier {
  return isValidTier(t) ? t : "standard"; // legacy fallback
}

function normalizeOrder(raw: RawOrder): NormalizedTicket {
  const tier = normalizeTier(raw.tier);
  const status = normalizeStatus(raw.status);
  return {
    id: raw.id || "",
    tier,
    tier_label: CONCIERGE_TIERS[tier].name,
    email: (raw.email || "").toLowerCase(),
    origin: raw.origin || "",
    destination: raw.destination || "",
    date_from: raw.date_from || "",
    date_to: raw.date_to || "",
    flex_days: typeof raw.flex_days === "number" ? raw.flex_days : 3,
    budget: typeof raw.budget === "number" ? raw.budget : 0,
    travelers: typeof raw.travelers === "number" ? raw.travelers : 1,
    hotel_stars: typeof raw.hotel_stars === "number" ? raw.hotel_stars : 4,
    notes: raw.notes || "",
    paid: Boolean(raw.paid || raw.paid_at || raw.stripe_session_id),
    paid_at: raw.paid_at || null,
    status,
    amount_paid_eur:
      typeof raw.amount_paid_eur === "number"
        ? raw.amount_paid_eur
        : CONCIERGE_TIERS[tier].amount_eur,
    stripe_session_id: raw.stripe_session_id || null,
    created_at: raw.createdAt || raw.created_at || new Date(0).toISOString(),
    delivered_at: raw.delivered_at || null,
  };
}

async function fetchRemoteOrders(): Promise<RawOrder[] | null> {
  if (!BACKEND_URL || !ADMIN_TOKEN) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${BACKEND_URL}/api/admin/concierge/orders`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      cache: "no-store",
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = (await res.json()) as { orders?: RawOrder[] };
    return Array.isArray(data.orders) ? data.orders : [];
  } catch {
    return null;
  }
}

export async function GET(req: Request): Promise<NextResponse<TicketsResponse | { error: string }>> {
  if (!authorize(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const remote = await fetchRemoteOrders();
  if (!remote) {
    return NextResponse.json({
      orders: [],
      source: "unavailable",
      total: 0,
      by_tier: { express: 0, standard: 0, premium: 0, pro: 0 },
      by_status: { pending: 0, in_progress: 0, delivered: 0, refunded: 0 },
    });
  }

  const orders = remote
    .map(normalizeOrder)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const byTier: Record<ConciergeTier, number> = {
    express: 0,
    standard: 0,
    premium: 0,
    pro: 0,
  };
  const byStatus: Record<NormalizedTicket["status"], number> = {
    pending: 0,
    in_progress: 0,
    delivered: 0,
    refunded: 0,
  };
  for (const o of orders) {
    byTier[o.tier]++;
    byStatus[o.status]++;
  }

  return NextResponse.json({
    orders,
    source: "remote",
    total: orders.length,
    by_tier: byTier,
    by_status: byStatus,
  });
}
