"use client";

/**
 * ConciergePanelClient — fase ppp PPP1 (May 2026)
 *
 * Cliente para /panel/concierge. Mezcla los pedidos del backend (server-side
 * fetch) con los del localStorage (browser-side fallback) y permite filtrar
 * por estado + abrir detalle de cada pedido.
 *
 * No persiste cambios de estado en backend todavía: los marca local. Cuando
 * Vercel KV esté configurado, la mutación se hará via /api/admin/concierge/...
 */

import { useEffect, useMemo, useState } from "react";
import { Mail, Plane, Calendar, Users, Hotel, Wallet, Copy, Check } from "lucide-react";
import { getOrdersLocal, type ConciergeOrder } from "@/lib/concierge_store";

interface BackendOrder {
  id: string;
  email: string;
  status: ConciergeOrder["status"];
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
}

type StatusFilter = "all" | ConciergeOrder["status"];

const STATUS_LABEL: Record<ConciergeOrder["status"], { text: string; color: string }> = {
  pending: { text: "Pendiente", color: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  in_progress: { text: "En curso", color: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
  delivered: { text: "Entregado", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  refunded: { text: "Reembolso", color: "bg-red-500/15 text-red-300 border-red-500/30" },
};

export function ConciergePanelClient({
  initialServerOrders,
}: {
  initialServerOrders: BackendOrder[];
}) {
  const [serverOrders] = useState<BackendOrder[]>(initialServerOrders);
  const [localOrders, setLocalOrders] = useState<ConciergeOrder[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setLocalOrders(getOrdersLocal());
  }, []);

  const merged = useMemo<ConciergeOrder[]>(() => {
    const byId = new Map<string, ConciergeOrder>();
    // Server first (canonical), local overrides para clients-only data
    for (const o of serverOrders) {
      byId.set(o.id, { ...o, date_to: o.date_to || "", notes: o.notes || "" });
    }
    for (const o of localOrders) {
      if (!byId.has(o.id)) byId.set(o.id, o);
    }
    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [serverOrders, localOrders]);

  const filtered = filter === "all" ? merged : merged.filter((o) => o.status === filter);

  function copyEmail(email: string) {
    if (!email) return;
    navigator.clipboard?.writeText(email).then(
      () => {
        setCopied(email);
        setTimeout(() => setCopied(null), 1500);
      },
      () => {},
    );
  }

  const filterCounts: Record<StatusFilter, number> = {
    all: merged.length,
    pending: merged.filter((o) => o.status === "pending").length,
    in_progress: merged.filter((o) => o.status === "in_progress").length,
    delivered: merged.filter((o) => o.status === "delivered").length,
    refunded: merged.filter((o) => o.status === "refunded").length,
  };

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "in_progress", "delivered", "refunded"] as StatusFilter[]).map((f) => {
          const isActive = filter === f;
          const labels: Record<StatusFilter, string> = {
            all: "Todos",
            pending: "Pendiente",
            in_progress: "En curso",
            delivered: "Entregado",
            refunded: "Reembolso",
          };
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-amber-500 text-black"
                  : "bg-gray-900 text-gray-400 border border-gray-800 hover:border-gray-700"
              }`}
            >
              {labels[f]} ({filterCounts[f]})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg bg-gray-900 border border-gray-800 p-8 text-center text-gray-400 text-sm">
          {merged.length === 0 ? (
            <>
              No hay pedidos todavía. Cuando un cliente compre el paquete €19 desde{" "}
              <code className="bg-gray-800 px-1.5 py-0.5 rounded">/concierge</code> aparecerán aquí.
            </>
          ) : (
            <>Sin pedidos en estado &quot;{filter}&quot;.</>
          )}
        </div>
      )}

      {/* Orders list */}
      <div className="space-y-2">
        {filtered.map((o) => {
          const isExpanded = expanded === o.id;
          const statusBadge = STATUS_LABEL[o.status];
          return (
            <article
              key={o.id}
              className="rounded-lg bg-gray-900 border border-gray-800 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : o.id)}
                className="w-full text-left p-4 hover:bg-gray-800/50 transition-colors"
                aria-expanded={isExpanded}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${statusBadge.color}`}
                      >
                        {statusBadge.text}
                      </span>
                      <span className="font-mono text-xs text-gray-500 truncate">{o.id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono font-bold text-amber-400">{o.origin}</span>
                      <Plane size={12} className="text-gray-500 rotate-90" />
                      <span className="font-bold text-white truncate">{o.destination}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {o.date_from}
                        {o.date_to ? ` → ${o.date_to}` : ""} (±{o.flex_days}d)
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {o.travelers} pax
                      </span>
                      <span className="flex items-center gap-1">
                        <Hotel size={11} />
                        {o.hotel_stars}★
                      </span>
                      <span className="flex items-center gap-1">
                        <Wallet size={11} />
                        {o.budget}€
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-gray-500">
                      {new Date(o.createdAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-amber-400 text-sm font-bold">
                      {o.amount_paid_eur || 19}€
                    </div>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-800 p-4 bg-gray-950/50 space-y-3 text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Mail size={14} className="text-gray-500" />
                    <a
                      href={`mailto:${o.email}?subject=${encodeURIComponent(`Tu pedido Concierge ${o.id}`)}`}
                      className="text-amber-400 hover:underline font-semibold"
                    >
                      {o.email}
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyEmail(o.email);
                      }}
                      className="text-xs text-gray-500 hover:text-gray-300 inline-flex items-center gap-1"
                      title="Copiar email"
                    >
                      {copied === o.email ? (
                        <>
                          <Check size={12} />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                  {o.notes && (
                    <div>
                      <div className="text-xs uppercase text-gray-500 tracking-wider mb-1">Notas</div>
                      <p className="text-gray-300 whitespace-pre-wrap">{o.notes}</p>
                    </div>
                  )}
                  {o.stripe_session_id && (
                    <div className="text-xs text-gray-500 font-mono break-all">
                      Stripe: {o.stripe_session_id}
                    </div>
                  )}
                  {o.delivered_at && (
                    <div className="text-xs text-emerald-400">
                      Entregado: {new Date(o.delivered_at).toLocaleString("es-ES")}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
