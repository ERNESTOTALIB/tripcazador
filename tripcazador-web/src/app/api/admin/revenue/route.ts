import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/admin/revenue — fase yyy
 *
 * Agrega revenue real (vs. estimado del tracker interno) consultando los
 * dashboards de partners cuando hay credenciales, o leyendo overrides
 * manuales desde env vars (útil hasta que conectemos APIs de cada partner).
 *
 * Sources soportadas:
 *  - Travelpayouts (vuelos+hoteles, AID 714734) → API stats si TRAVELPAYOUTS_TOKEN
 *  - GetYourGuide → manual via env GYG_REVENUE_30D_EUR
 *  - Holafly eSIM → manual via env HOLAFLY_REVENUE_30D_EUR
 *  - Heymondo seguros → manual via env HEYMONDO_REVENUE_30D_EUR
 *  - Booking → cuenta junto con Travelpayouts si AID activo
 *  - AdSense → manual via env ADSENSE_REVENUE_30D_EUR
 *  - Concierge €19 → suma desde event_store (booking_redirect type=concierge)
 *
 * Cada source devuelve { configured, source_type, last_30d_eur, last_7d_eur, last_24h_eur, note }.
 */

interface RevenueSource {
  name: string;
  configured: boolean;
  last_24h_eur: number;
  last_7d_eur: number;
  last_30d_eur: number;
  source_type: "api" | "manual_env" | "internal";
  note?: string;
  link?: string;
}

interface RevenueResponse {
  sources: RevenueSource[];
  totals: {
    last_24h_eur: number;
    last_7d_eur: number;
    last_30d_eur: number;
  };
  pending_clicks_value_eur: number; // estimación de clicks que aún no han convertido
  fetched_at: string;
}

function envNum(name: string): number | null {
  const raw = process.env[name];
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function manualSource(
  name: string,
  envBase: string,
  link: string,
  note: string,
): RevenueSource {
  const d30 = envNum(`${envBase}_REVENUE_30D_EUR`);
  const d7 = envNum(`${envBase}_REVENUE_7D_EUR`);
  const h24 = envNum(`${envBase}_REVENUE_24H_EUR`);
  const configured = d30 != null || d7 != null || h24 != null;
  return {
    name,
    configured,
    last_24h_eur: h24 ?? 0,
    last_7d_eur: d7 ?? 0,
    last_30d_eur: d30 ?? 0,
    source_type: "manual_env",
    note: configured
      ? note
      : `${note} — define ${envBase}_REVENUE_30D_EUR en Vercel para mostrar valor`,
    link,
  };
}

interface TPStatsResp {
  data?: Array<{
    profit?: number;
    revenue?: number;
    date?: string;
  }>;
  success?: boolean;
}

async function fetchTravelpayouts(): Promise<RevenueSource> {
  const token = process.env.TRAVELPAYOUTS_API_TOKEN || "";
  const marker = process.env.NEXT_PUBLIC_BOOKING_AID || "714734";

  const base: RevenueSource = {
    name: "Travelpayouts (vuelos+hoteles+ferries)",
    configured: false,
    last_24h_eur: 0,
    last_7d_eur: 0,
    last_30d_eur: 0,
    source_type: "api",
    note: `AID ${marker}. Define TRAVELPAYOUTS_API_TOKEN en Vercel para tirar de la API.`,
    link: "https://app.travelpayouts.com/programs",
  };
  if (!token) return base;

  try {
    const today = new Date();
    const since30 = new Date(today.getTime() - 30 * 86_400_000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const url = `https://api.travelpayouts.com/statistics/v1/payments_by_marker?marker=${encodeURIComponent(marker)}&start_date=${fmt(since30)}&end_date=${fmt(today)}`;
    const res = await fetch(url, {
      headers: { "X-Access-Token": token },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      return { ...base, note: `${base.note} (HTTP ${res.status})` };
    }
    const json = (await res.json()) as TPStatsResp;
    const items = json.data || [];
    const now = today.getTime();
    let h24 = 0;
    let d7 = 0;
    let d30 = 0;
    for (const it of items) {
      const ts = it.date ? new Date(it.date).getTime() : 0;
      const profit = Number(it.profit ?? it.revenue ?? 0);
      if (now - ts <= 86_400_000) h24 += profit;
      if (now - ts <= 7 * 86_400_000) d7 += profit;
      if (now - ts <= 30 * 86_400_000) d30 += profit;
    }
    return {
      ...base,
      configured: true,
      last_24h_eur: Math.round(h24 * 100) / 100,
      last_7d_eur: Math.round(d7 * 100) / 100,
      last_30d_eur: Math.round(d30 * 100) / 100,
      note: `AID ${marker}. Datos en directo de Travelpayouts API.`,
    };
  } catch (err) {
    return { ...base, note: `${base.note} (err: ${(err as Error).message})` };
  }
}

async function fetchInternalConcierge(): Promise<RevenueSource> {
  // Lee desde el backend de api/.. event_store remoto (si configurado)
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const adminToken = process.env.ADMIN_TOKEN || "";
  const result: RevenueSource = {
    name: "Concierge €19 (interno)",
    configured: false,
    last_24h_eur: 0,
    last_7d_eur: 0,
    last_30d_eur: 0,
    source_type: "internal",
    note: "Cobros directos del servicio Concierge.",
    link: "/panel/concierge",
  };
  if (!baseUrl || !adminToken) return result;

  try {
    const res = await fetch(
      `${baseUrl}/api/admin/concierge/stats?token=${encodeURIComponent(adminToken)}`,
      { cache: "no-store", signal: AbortSignal.timeout(3000) },
    );
    if (!res.ok) return result;
    const json = (await res.json()) as {
      total_orders_24h?: number;
      total_orders_7d?: number;
      total_orders_30d?: number;
      unit_price_eur?: number;
    };
    const unit = json.unit_price_eur ?? 19;
    return {
      ...result,
      configured: true,
      last_24h_eur: (json.total_orders_24h ?? 0) * unit,
      last_7d_eur: (json.total_orders_7d ?? 0) * unit,
      last_30d_eur: (json.total_orders_30d ?? 0) * unit,
    };
  } catch {
    return result;
  }
}

export async function GET(_req: NextRequest): Promise<NextResponse<RevenueResponse | { error: string }>> {
  const session = verifyToken(cookies().get(COOKIE_KEY)?.value);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sources: RevenueSource[] = await Promise.all([
    fetchTravelpayouts(),
    Promise.resolve(
      manualSource(
        "GetYourGuide (tours+actividades)",
        "GYG",
        "https://partner.getyourguide.com/en-us/dashboard",
        "Comisión típica 8% sobre venta. Login y copia el revenue 30d.",
      ),
    ),
    Promise.resolve(
      manualSource(
        "Holafly eSIM",
        "HOLAFLY",
        "https://esim.holafly.com/affiliates",
        "Comisión típica 5–7%.",
      ),
    ),
    Promise.resolve(
      manualSource(
        "Heymondo seguros",
        "HEYMONDO",
        "https://heymondo.com/affiliates/",
        "Comisión típica $25–60 por venta.",
      ),
    ),
    Promise.resolve(
      manualSource(
        "Google AdSense",
        "ADSENSE",
        "https://www.google.com/adsense/new/u/0/pub-XXXXXXXXXX/main/home",
        "Pago por impresiones+clicks. CPM medio €1–4 viajes.",
      ),
    ),
    Promise.resolve(
      manualSource(
        "DiscoverCars (alquiler)",
        "DISCOVERCARS",
        "https://www.discovercars.com/affiliate-program",
        "Comisión típica 30–60% sobre el margen.",
      ),
    ),
    fetchInternalConcierge(),
  ]);

  const totals = sources.reduce(
    (acc, s) => ({
      last_24h_eur: acc.last_24h_eur + s.last_24h_eur,
      last_7d_eur: acc.last_7d_eur + s.last_7d_eur,
      last_30d_eur: acc.last_30d_eur + s.last_30d_eur,
    }),
    { last_24h_eur: 0, last_7d_eur: 0, last_30d_eur: 0 },
  );

  // Pending clicks value: clicks últimas 24h × prob conversión 2% × AOV €120 × commission 3%
  const pendingClicksValue = 0; // se rellena en el panel desde analytics

  return NextResponse.json({
    sources,
    totals: {
      last_24h_eur: Math.round(totals.last_24h_eur * 100) / 100,
      last_7d_eur: Math.round(totals.last_7d_eur * 100) / 100,
      last_30d_eur: Math.round(totals.last_30d_eur * 100) / 100,
    },
    pending_clicks_value_eur: pendingClicksValue,
    fetched_at: new Date().toISOString(),
  });
}
