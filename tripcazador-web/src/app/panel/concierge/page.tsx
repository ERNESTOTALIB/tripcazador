import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken, COOKIE_KEY } from "@/lib/panel_auth";
import { ConciergePanelClient } from "@/components/ConciergePanelClient";
import { CONCIERGE_TIER_IDS, CONCIERGE_TIERS, type ConciergeTier } from "@/lib/concierge_tiers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Concierge tickets — TripCazador Panel",
  robots: "noindex,nofollow",
};

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

interface BackendOrder {
  id: string;
  email: string;
  status: "pending" | "in_progress" | "delivered" | "refunded";
  createdAt: string;
  origin: string;
  destination: string;
  date_from: string;
  date_to?: string;
  flex_days: number;
  budget: number;
  travelers: number;
  hotel_stars: number;
  notes?: string;
  amount_paid_eur: number;
  stripe_session_id?: string;
  delivered_at?: string;
  tier?: ConciergeTier;
}

async function fetchOrders(): Promise<BackendOrder[]> {
  if (!BACKEND_URL || !ADMIN_TOKEN) return [];
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${BACKEND_URL}/api/admin/concierge/orders`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      cache: "no-store",
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return [];
    const data = (await res.json()) as { orders?: BackendOrder[] };
    return Array.isArray(data.orders) ? data.orders : [];
  } catch {
    return [];
  }
}

export default async function ConciergePanelPage() {
  const session = verifyToken(cookies().get(COOKIE_KEY)?.value);
  if (!session) {
    redirect("/panel/login");
  }

  const orders = await fetchOrders();

  // Stats agregados por tier + status + revenue.
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    in_progress: orders.filter((o) => o.status === "in_progress").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    refunded: orders.filter((o) => o.status === "refunded").length,
    revenue_eur: orders
      .filter((o) => o.status !== "refunded")
      .reduce((sum, o) => sum + (o.amount_paid_eur || 0), 0),
  };

  // Revenue por tier
  const revenueByTier: Record<ConciergeTier, number> = {
    express: 0,
    standard: 0,
    premium: 0,
    pro: 0,
  };
  const countByTier: Record<ConciergeTier, number> = {
    express: 0,
    standard: 0,
    premium: 0,
    pro: 0,
  };
  for (const o of orders) {
    if (o.status === "refunded") continue;
    const t: ConciergeTier = o.tier && o.tier in CONCIERGE_TIERS ? o.tier : "standard";
    revenueByTier[t] += o.amount_paid_eur || CONCIERGE_TIERS[t].amount_eur;
    countByTier[t]++;
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/80 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/panel" className="text-amber-400 font-bold text-lg">
              ← Panel
            </Link>
            <span className="text-xs text-gray-500 hidden sm:inline">
              Concierge tickets · 4 tiers
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tickets Concierge</h1>
          <p className="text-gray-400 text-sm">
            Pedidos del flow <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs">/concierge</code>{" "}
            tiered (Express €9 / Standard €19 / Premium €49 / Pro €99). Cada pedido = SLA según tier
            (24h-5d) para enviar propuesta por email.
          </p>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total" value={stats.total} color="white" />
          <StatCard label="Pendiente" value={stats.pending} color="amber" />
          <StatCard label="En curso" value={stats.in_progress} color="cyan" />
          <StatCard label="Entregado" value={stats.delivered} color="emerald" />
          <StatCard label="Reembolso" value={stats.refunded} color="red" />
          <StatCard label="Ingresos €" value={stats.revenue_eur.toFixed(0)} color="amber" />
        </div>

        {/* Stats por tier */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CONCIERGE_TIER_IDS.map((id) => {
            const t = CONCIERGE_TIERS[id];
            return (
              <div
                key={id}
                className="rounded-lg bg-gray-900 border border-gray-800 p-3 flex flex-col gap-1"
              >
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                  {t.name} · €{t.amount_eur}
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-white">{countByTier[id]}</span>
                  <span className="text-xs text-gray-400">pedidos</span>
                </div>
                <div className="text-xs text-amber-400 font-semibold">
                  €{revenueByTier[id].toFixed(0)} revenue
                </div>
              </div>
            );
          })}
        </div>

        {(!BACKEND_URL || !ADMIN_TOKEN) && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
            Para ver pedidos sincronizados de todos los devices, configura{" "}
            <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_API_URL</code>{" "}
            y{" "}
            <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs">ADMIN_TOKEN</code>{" "}
            en Vercel env. Mientras tanto se muestra solo lo guardado en este navegador.
          </div>
        )}

        <ConciergePanelClient initialServerOrders={orders} />

        <div className="text-xs text-gray-500 mt-8">
          <p>
            Acciones disponibles por ticket: ver detalle, copiar email,{" "}
            <strong>Generar borrador</strong> (Claude AI si{" "}
            <code className="bg-gray-800 px-1 py-0.5 rounded">ANTHROPIC_API_KEY</code> configurada,
            si no plantilla manual editable).
          </p>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: "white" | "amber" | "cyan" | "emerald" | "red";
}) {
  const colorMap = {
    white: "text-white",
    amber: "text-amber-400",
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    red: "text-red-400",
  };
  return (
    <div className="rounded-lg bg-gray-900 border border-gray-800 p-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</div>
      <div className={`text-2xl font-bold ${colorMap[color]} mt-1`}>{value}</div>
    </div>
  );
}
