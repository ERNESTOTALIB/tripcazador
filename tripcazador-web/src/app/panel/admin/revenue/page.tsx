/**
 * /panel/admin/revenue — SSS361 (21 may 2026)
 *
 * Dashboard unificado de revenue para Ernesto (owner). Pulls de:
 *  - Stripe MRR via API
 *  - Active Premium subs count (in-memory store)
 *  - Concierge orders count + total revenue (backend VPS)
 *  - Affiliate clicks por partner (tcTrack events agregados)
 *  - AdSense earnings (cuando esté approved — vía AdSense Management API)
 *  - Cron health (último éxito/fallo)
 *  - Newsletter subs count
 *
 * Auth: panel cookie (mismo flujo que /panel/concierge).
 * Render: server-side con datos snapshot al request. Refresh manual user.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Stripe from "stripe";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { listActivePremium } from "@/lib/premium_store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Revenue — TripCazador Admin",
  robots: "noindex,nofollow",
};

interface RevenueData {
  premium: {
    active_subs: number;
    estimated_mrr_eur: number;
    annual_subs: number;
    monthly_subs: number;
    gift_active: number;
    last_signup_iso: string | null;
  };
  stripe: {
    monthly_revenue_eur: number | null;
    successful_payments_30d: number | null;
    failed_payments_30d: number | null;
    error?: string;
  };
  concierge: {
    total_orders: number;
    revenue_30d_eur: number;
    pending: number;
    delivered: number;
  };
  affiliates: {
    booking_clicks_30d: number;
    travelpayouts_clicks_30d: number;
    heymondo_clicks_30d: number;
    holafly_clicks_30d: number;
    gyg_clicks_30d: number;
    parclick_clicks_30d: number;
  };
  adsense: {
    earnings_30d_eur: number | null;
    impressions_30d: number | null;
    status: "approved" | "pending_review" | "not_configured";
  };
  newsletter: {
    total_subs: number;
    recent_signups_7d: number;
  };
  crons: {
    workflow: string;
    last_run_iso: string | null;
    status: "ok" | "fail" | "unknown";
  }[];
}

async function fetchStripeStats(): Promise<RevenueData["stripe"]> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return { monthly_revenue_eur: null, successful_payments_30d: null, failed_payments_30d: null, error: "stripe_not_configured" };
  }
  try {
    const stripe = new Stripe(stripeKey);
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 86400;
    const charges = await stripe.charges.list({
      created: { gte: thirtyDaysAgo },
      limit: 100,
    });
    let successful = 0;
    let failed = 0;
    let revenueCents = 0;
    for (const charge of charges.data) {
      if (charge.status === "succeeded" && !charge.refunded) {
        successful += 1;
        revenueCents += charge.amount;
      } else if (charge.status === "failed") {
        failed += 1;
      }
    }
    return {
      monthly_revenue_eur: Math.round(revenueCents / 100),
      successful_payments_30d: successful,
      failed_payments_30d: failed,
    };
  } catch (e) {
    return {
      monthly_revenue_eur: null,
      successful_payments_30d: null,
      failed_payments_30d: null,
      error: e instanceof Error ? e.message : "stripe_api_error",
    };
  }
}

function computePremiumStats(): RevenueData["premium"] {
  const entries = listActivePremium();
  const monthly = entries.filter(
    (e) => !e.customer_id?.startsWith("gift_") && !e.subscription_id?.includes("annual"),
  );
  const annual = entries.filter((e) => e.subscription_id?.includes("annual"));
  const gifts = entries.filter((e) => e.customer_id?.startsWith("gift_"));
  // MRR estimate: monthly * 9.99 + annual * (99/12) + gifts * 0 (one-off)
  const mrr = Math.round(monthly.length * 9.99 + annual.length * (99 / 12));
  const lastSignup = entries
    .map((e) => e.updated_at)
    .sort((a, b) => b - a)[0];
  return {
    active_subs: entries.length,
    estimated_mrr_eur: mrr,
    annual_subs: annual.length,
    monthly_subs: monthly.length,
    gift_active: gifts.length,
    last_signup_iso: lastSignup ? new Date(lastSignup).toISOString() : null,
  };
}

async function fetchAffiliateClicks(): Promise<RevenueData["affiliates"]> {
  // Best-effort: leer eventos del track store si está configurado
  const url = process.env.NEXT_PUBLIC_API_URL || "";
  const token = process.env.ADMIN_TOKEN || "";
  if (!url || !token) {
    return {
      booking_clicks_30d: 0,
      travelpayouts_clicks_30d: 0,
      heymondo_clicks_30d: 0,
      holafly_clicks_30d: 0,
      gyg_clicks_30d: 0,
      parclick_clicks_30d: 0,
    };
  }
  try {
    const res = await fetch(`${url}/api/admin/events-summary?event=affiliate_click&days=30`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("backend_unavailable");
    const data = await res.json();
    const counts: Record<string, number> = data.by_partner || {};
    return {
      booking_clicks_30d: counts.booking || 0,
      travelpayouts_clicks_30d: counts.travelpayouts || 0,
      heymondo_clicks_30d: counts.heymondo || 0,
      holafly_clicks_30d: counts.holafly || 0,
      gyg_clicks_30d: counts.getyourguide || counts.gyg || 0,
      parclick_clicks_30d: counts.parclick || 0,
    };
  } catch {
    return {
      booking_clicks_30d: 0,
      travelpayouts_clicks_30d: 0,
      heymondo_clicks_30d: 0,
      holafly_clicks_30d: 0,
      gyg_clicks_30d: 0,
      parclick_clicks_30d: 0,
    };
  }
}

async function fetchConciergeStats(): Promise<RevenueData["concierge"]> {
  const url = process.env.NEXT_PUBLIC_API_URL || "";
  const token = process.env.ADMIN_TOKEN || "";
  if (!url || !token) {
    return { total_orders: 0, revenue_30d_eur: 0, pending: 0, delivered: 0 };
  }
  try {
    const res = await fetch(`${url}/api/admin/concierge-stats?days=30`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("backend_unavailable");
    return await res.json();
  } catch {
    return { total_orders: 0, revenue_30d_eur: 0, pending: 0, delivered: 0 };
  }
}

function getAdSenseStatus(): RevenueData["adsense"] {
  // Sin AdSense Management API key, devolvemos status genérico.
  const clientSet = !!process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const slotSet = !!process.env.NEXT_PUBLIC_ADSENSE_SLOT_DEFAULT;
  if (!clientSet) return { earnings_30d_eur: null, impressions_30d: null, status: "not_configured" };
  if (!slotSet) return { earnings_30d_eur: null, impressions_30d: null, status: "pending_review" };
  return { earnings_30d_eur: null, impressions_30d: null, status: "approved" };
}

const CRON_WORKFLOWS = [
  "premium-watchlist-cron",
  "premium-hotel-watchlist-cron",
  "premium-weekly-digest-cron",
  "premium-winback-cron",
  "premium-lifecycle-cron",
  "price-alerts-match-cron-premium",
  "email-drip",
  "anomaly-detect",
  "newsletter-weekly",
];

function getCronStatus(): RevenueData["crons"] {
  // Sin GH API token podemos devolver "unknown" — el doc dice qué crons existen
  return CRON_WORKFLOWS.map((w) => ({
    workflow: w,
    last_run_iso: null,
    status: "unknown" as const,
  }));
}

async function loadAll(): Promise<RevenueData> {
  const [stripe, concierge, affiliates] = await Promise.all([
    fetchStripeStats(),
    fetchConciergeStats(),
    fetchAffiliateClicks(),
  ]);
  return {
    premium: computePremiumStats(),
    stripe,
    concierge,
    affiliates,
    adsense: getAdSenseStatus(),
    newsletter: { total_subs: 0, recent_signups_7d: 0 }, // TODO: backend stats
    crons: getCronStatus(),
  };
}

export default async function AdminRevenuePage() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_KEY)?.value;
  if (!token || !(await verifyToken(token))) {
    redirect("/panel/login?next=/panel/admin/revenue");
  }

  const data = await loadAll();
  const totalAffiliateClicks = Object.values(data.affiliates).reduce(
    (acc, n) => acc + n,
    0,
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">💰 Revenue</h1>
          <p className="text-sm text-gray-400 mt-1">
            Dashboard unificado · datos al {new Date().toLocaleString("es-ES")}
          </p>
        </div>
        <Link
          href="/panel"
          className="text-xs text-amber-400 hover:text-amber-300"
        >
          ← Panel principal
        </Link>
      </header>

      {/* Top-line KPIs */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="MRR Premium"
          value={`€${data.premium.estimated_mrr_eur}`}
          sub={`${data.premium.active_subs} subs activos`}
          color="amber"
        />
        <KpiCard
          label="Revenue Stripe 30d"
          value={
            data.stripe.monthly_revenue_eur != null
              ? `€${data.stripe.monthly_revenue_eur}`
              : "–"
          }
          sub={
            data.stripe.successful_payments_30d != null
              ? `${data.stripe.successful_payments_30d} pagos OK`
              : data.stripe.error
              ? `error: ${data.stripe.error}`
              : "esperando datos"
          }
          color="emerald"
        />
        <KpiCard
          label="Concierge 30d"
          value={`€${data.concierge.revenue_30d_eur}`}
          sub={`${data.concierge.total_orders} pedidos · ${data.concierge.pending} pending`}
          color="cyan"
        />
        <KpiCard
          label="Affiliate clicks 30d"
          value={totalAffiliateClicks.toLocaleString()}
          sub="suma de partners"
          color="fuchsia"
        />
      </section>

      {/* Premium breakdown */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-lg font-bold text-white mb-3">Premium tier breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Stat label="Mensual" value={data.premium.monthly_subs} hint="€9.99/mo" />
          <Stat label="Anual" value={data.premium.annual_subs} hint="€99/yr (~€8.25/mo)" />
          <Stat label="Gift activos" value={data.premium.gift_active} hint="30d window" />
          <Stat
            label="Última alta"
            value={
              data.premium.last_signup_iso
                ? new Date(data.premium.last_signup_iso).toLocaleDateString("es-ES")
                : "—"
            }
            hint="signup más reciente"
          />
        </div>
      </section>

      {/* Affiliates breakdown */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-lg font-bold text-white mb-3">Affiliate clicks 30d (top 6)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
          <Stat label="Booking" value={data.affiliates.booking_clicks_30d} hint="AID 714734" />
          <Stat label="Travelpayouts" value={data.affiliates.travelpayouts_clicks_30d} hint="marker 513030" />
          <Stat label="Heymondo" value={data.affiliates.heymondo_clicks_30d} hint="seguros" />
          <Stat label="Holafly" value={data.affiliates.holafly_clicks_30d} hint="eSIM" />
          <Stat label="GetYourGuide" value={data.affiliates.gyg_clicks_30d} hint="tours" />
          <Stat label="Parclick" value={data.affiliates.parclick_clicks_30d} hint="parking" />
        </div>
        {totalAffiliateClicks === 0 && (
          <p className="text-xs text-gray-500 mt-3">
            ⚠ No hay datos de tracking — verificar que el backend VPS está respondiendo
            a `/api/admin/events-summary` y que tcTrack está enviando eventos.
          </p>
        )}
      </section>

      {/* AdSense */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-lg font-bold text-white mb-3">AdSense status</h2>
        <div className="flex items-center gap-3 text-sm">
          <StatusPill status={data.adsense.status} />
          <span className="text-gray-400">
            {data.adsense.status === "not_configured" &&
              "NEXT_PUBLIC_ADSENSE_CLIENT no set"}
            {data.adsense.status === "pending_review" &&
              "Client set, slot ID pendiente (sitio aún no aprobado)"}
            {data.adsense.status === "approved" &&
              "Live — slot ID configurado, ads renderizando"}
          </span>
        </div>
      </section>

      {/* Cron health */}
      <section className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-lg font-bold text-white mb-3">Cron workflows ({CRON_WORKFLOWS.length} activos)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          {data.crons.map((c) => (
            <div
              key={c.workflow}
              className="flex items-center justify-between gap-3 p-2 rounded-lg border border-gray-800 bg-gray-900/50"
            >
              <span className="text-xs text-gray-300 font-mono truncate">{c.workflow}</span>
              <StatusPill status={c.status} small />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          ⓘ Para ver runs reales: <a href="https://github.com/ERNESTOTALIB/tripcazador/actions" target="_blank" rel="noopener" className="text-amber-400 hover:underline">GitHub Actions</a>
        </p>
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="https://dashboard.stripe.com/payments"
          target="_blank"
          rel="noopener"
          className="text-center p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-amber-500/40 text-sm"
        >
          📊 Stripe Dashboard
        </Link>
        <Link
          href="https://adsense.google.com/adsense/u/0/pub-8496076569342556/home"
          target="_blank"
          rel="noopener"
          className="text-center p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-amber-500/40 text-sm"
        >
          📰 AdSense
        </Link>
        <Link
          href="https://github.com/ERNESTOTALIB/tripcazador/actions"
          target="_blank"
          rel="noopener"
          className="text-center p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-amber-500/40 text-sm"
        >
          ⚡ GH Actions
        </Link>
        <Link
          href="https://tripcazador.sentry.io/issues/?statsPeriod=24h"
          target="_blank"
          rel="noopener"
          className="text-center p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-amber-500/40 text-sm"
        >
          🐛 Sentry
        </Link>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: "amber" | "emerald" | "cyan" | "fuchsia";
}) {
  const colorClass = {
    amber: "text-amber-300",
    emerald: "text-emerald-300",
    cyan: "text-cyan-300",
    fuchsia: "text-fuchsia-300",
  }[color];
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
      <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl sm:text-3xl font-bold ${colorClass} mt-1`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{sub}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="p-3 rounded-lg border border-gray-800 bg-gray-900/50">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-lg font-bold text-white mt-0.5">{value}</div>
      {hint && <div className="text-[10px] text-gray-500 mt-0.5">{hint}</div>}
    </div>
  );
}

function StatusPill({ status, small }: { status: string; small?: boolean }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    ok: { bg: "bg-emerald-500/20", text: "text-emerald-300", label: "OK" },
    fail: { bg: "bg-rose-500/20", text: "text-rose-300", label: "FAIL" },
    unknown: { bg: "bg-gray-700", text: "text-gray-300", label: "—" },
    approved: { bg: "bg-emerald-500/20", text: "text-emerald-300", label: "Aprobado" },
    pending_review: { bg: "bg-amber-500/20", text: "text-amber-300", label: "Pending" },
    not_configured: { bg: "bg-gray-700", text: "text-gray-400", label: "No config" },
  };
  const cfg = map[status] ?? map.unknown;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}
