"use client";

/**
 * AgenciaPanelClient — SSS305 (18 may 2026)
 *
 * Cliente busca por email sus tickets de Agencia. Cada ticket muestra:
 *  - status (paid → esperando · delivered → opciones enviadas · refunded → reembolsado)
 *  - garantía activa o expirada (7 días)
 *  - botón "Reclamar garantía" → form proof_url → POST refund-request
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { tcTrack } from "@/lib/track_client";

interface Ticket {
  id: string;
  tipo: "vuelo" | "vuelo_hotel";
  email: string;
  request: {
    origin?: string;
    destination?: string;
    date_out?: string;
    date_ret?: string;
    pasajeros?: number;
    presupuesto?: number;
    notas?: string;
  };
  amount_eur: number;
  status: "paid" | "delivered" | "refunded";
  created_at: number;
  delivered_at?: number;
  refunded_at?: number;
}

const GUARANTEE_DAYS = 7;

export function AgenciaPanelClient() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundUrl, setRefundUrl] = useState("");
  const [refundResult, setRefundResult] = useState<{ ok?: boolean; message?: string; error?: string } | null>(null);

  async function fetchTickets(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTickets([]);
    try {
      const res = await fetch(`/api/agencia/tickets?email=${encodeURIComponent(email)}`);
      const data = (await res.json()) as { ok?: boolean; tickets?: Ticket[]; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "fetch_failed");
        return;
      }
      setTickets(data.tickets || []);
      setSubmittedEmail(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "error");
    } finally {
      setLoading(false);
    }
  }

  async function submitRefund(ticketId: string) {
    if (!refundUrl.trim() || !submittedEmail) return;
    setRefundResult(null);
    try {
      const res = await fetch("/api/agencia/refund-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: ticketId,
          email: submittedEmail,
          proof_url: refundUrl.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (res.ok && data.ok) {
        tcTrack("agencia_refund_submitted", { ticket_id: ticketId });
        setRefundResult({ ok: true, message: data.message });
        // refetch
        const r2 = await fetch(`/api/agencia/tickets?email=${encodeURIComponent(submittedEmail)}`);
        if (r2.ok) {
          const d2 = (await r2.json()) as { tickets?: Ticket[] };
          setTickets(d2.tickets || []);
        }
      } else {
        setRefundResult({ ok: false, error: data.error || "error" });
      }
    } catch (err) {
      setRefundResult({ ok: false, error: err instanceof Error ? err.message : "error" });
    }
  }

  function isGuaranteeActive(t: Ticket): boolean {
    const days = (Date.now() - t.created_at) / 86400_000;
    return days <= GUARANTEE_DAYS && t.status !== "refunded";
  }

  function statusLabel(s: Ticket["status"]): { label: string; color: string } {
    if (s === "paid") return { label: "⏳ Procesando", color: "text-amber-400" };
    if (s === "delivered") return { label: "✓ Opciones enviadas", color: "text-emerald-400" };
    return { label: "💸 Reembolsado", color: "text-rose-400" };
  }

  useEffect(() => {
    // Auto-populate desde localStorage si hay un email recordado
    try {
      const remembered = localStorage.getItem("tc_agencia_last_email");
      if (remembered) setEmail(remembered);
    } catch {
      /* no-op */
    }
  }, []);

  useEffect(() => {
    if (submittedEmail) {
      try {
        localStorage.setItem("tc_agencia_last_email", submittedEmail);
      } catch {
        /* no-op */
      }
    }
  }, [submittedEmail]);

  return (
    <div className="space-y-8">
      <header>
        <nav className="text-sm text-gray-500 mb-2">
          <Link href="/" className="hover:text-white">Inicio</Link>
          <span className="mx-2">/</span>
          <span className="text-white">Mis tickets Agencia</span>
        </nav>
        <h1 className="text-3xl font-bold">🎟️ Mis tickets Agencia</h1>
        <p className="text-gray-400 text-sm mt-2">
          Introduce el email con el que compraste para ver tus tickets y reclamar garantía si encontraste un precio menor.
        </p>
      </header>

      <section className="p-5 rounded-2xl bg-gray-900 border border-gray-800">
        <form onSubmit={fetchTickets} className="flex gap-3">
          <input
            type="email"
            required
            placeholder="Tu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-black border border-gray-700 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-700 text-black font-semibold rounded-lg text-sm"
          >
            {loading ? "Cargando…" : "Buscar"}
          </button>
        </form>
        {error && <p className="text-rose-400 text-xs mt-3">Error: {error}</p>}
      </section>

      {submittedEmail && (
        <section>
          <h2 className="text-lg font-bold mb-3">
            Tickets de {submittedEmail}{" "}
            {tickets.length > 0 && <span className="text-gray-500 text-sm">({tickets.length})</span>}
          </h2>
          {tickets.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No hay tickets con este email. Si acabas de comprar revisa el email del recibo Stripe.
              <br />
              ¿No has comprado aún? <Link href="/agencia" className="text-amber-400 underline">Ir a Agencia</Link>.
            </p>
          ) : (
            <ul className="space-y-3">
              {tickets.map((t) => {
                const s = statusLabel(t.status);
                const guaranteeActive = isGuaranteeActive(t);
                return (
                  <li key={t.id} className="p-4 rounded-xl border border-gray-800 bg-gray-900">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">
                          {t.tipo === "vuelo" ? "🛫 Vuelo" : "🛫🏨 Vuelo + Hotel"} · €{t.amount_eur}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {t.request.origin || "?"} → {t.request.destination || "?"}
                          {t.request.date_out && ` · ${t.request.date_out}`}
                          {t.request.date_ret && ` → ${t.request.date_ret}`}
                          {t.request.pasajeros && ` · ${t.request.pasajeros} pax`}
                        </div>
                        <div className="text-xs mt-1">
                          <span className={s.color}>{s.label}</span>
                          <span className="text-gray-500"> · creado {new Date(t.created_at).toLocaleDateString("es-ES")}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1">
                          ticket: <code className="font-mono">{t.id}</code>
                        </div>
                      </div>
                      {guaranteeActive && t.status !== "refunded" && (
                        <button
                          onClick={() => {
                            setRefundingId(refundingId === t.id ? null : t.id);
                            setRefundUrl("");
                            setRefundResult(null);
                          }}
                          className="text-xs text-amber-400 border border-amber-500/40 px-3 py-1 rounded"
                        >
                          {refundingId === t.id ? "Cerrar" : "Reclamar garantía"}
                        </button>
                      )}
                    </div>

                    {refundingId === t.id && (
                      <div className="mt-4 p-3 bg-black rounded-lg border border-gray-800 space-y-2">
                        <p className="text-xs text-gray-300">
                          Pega la URL pública donde encontraste la misma combinación más barata
                          (Skyscanner, Google Flights, Kayak, web de aerolínea…).
                        </p>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={refundUrl}
                          onChange={(e) => setRefundUrl(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm"
                        />
                        <button
                          onClick={() => submitRefund(t.id)}
                          disabled={!refundUrl.trim()}
                          className="w-full bg-rose-500 hover:bg-rose-400 disabled:bg-rose-700 text-black font-semibold rounded px-3 py-2 text-sm"
                        >
                          Enviar solicitud de reembolso + Premium 1 mes
                        </button>
                        {refundResult?.ok && (
                          <p className="text-emerald-400 text-xs">{refundResult.message}</p>
                        )}
                        {refundResult?.error && (
                          <p className="text-rose-400 text-xs">Error: {refundResult.error}</p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
