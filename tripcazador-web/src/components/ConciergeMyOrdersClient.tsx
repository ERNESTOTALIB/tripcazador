"use client";

/**
 * ConciergeMyOrdersClient — SSS328 (19 may 2026)
 *
 * Portal del cliente Concierge. Dos modos:
 *  - Sin token: formulario "introduce email" → POST request-access →
 *    mensaje neutral "Si tienes pedidos te hemos enviado un email".
 *  - Con token (?token=xxx): fetch /api/concierge/my-orders → render
 *    pedidos con status + plan entregado si está listo.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

interface CustomerOrder {
  id: string;
  status: "pending" | "in_progress" | "delivered" | "refunded";
  status_label: string;
  createdAt: string;
  origin: string;
  destination: string;
  date_from: string;
  date_to?: string;
  travelers: number;
  amount_paid_eur: number;
  tier?: "express" | "standard" | "premium" | "pro";
  delivered_at?: string;
  deliverable_markdown?: string;
}

const STATUS_BADGE: Record<CustomerOrder["status"], string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  in_progress: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  refunded: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const TIER_LABEL: Record<NonNullable<CustomerOrder["tier"]>, string> = {
  express: "Express €9",
  standard: "Standard €19",
  premium: "Premium €49",
  pro: "Pro €99",
};

export function ConciergeMyOrdersClient({ initialToken }: { initialToken: string }) {
  const [token, setToken] = useState(initialToken);
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null);
  const [emailUsedForToken, setEmailUsedForToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestState, setRequestState] = useState<
    "idle" | "submitted" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  // Fetch orders cuando hay token (mount o cambio)
  useEffect(() => {
    if (!token) {
      setOrders(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/concierge/my-orders?token=${encodeURIComponent(token)}`)
      .then((r) => r.json().then((d) => ({ status: r.status, body: d })))
      .then(({ status, body }) => {
        if (cancelled) return;
        if (status === 401) {
          setError("link_expired");
          setToken("");
          return;
        }
        if (!body?.ok) {
          setError(body?.error || "unknown");
          return;
        }
        setOrders(body.orders || []);
        setEmailUsedForToken(body.email || "");
      })
      .catch(() => {
        if (!cancelled) setError("network_error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onRequestAccess(e: React.FormEvent) {
    e.preventDefault();
    setRequestState("idle");
    setError(null);
    if (!email.trim()) return;
    setRequesting(true);
    try {
      const res = await fetch("/api/concierge/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
      };
      if (!res.ok || !data.ok) {
        setRequestState("error");
        return;
      }
      // SSS329 H1: shape unificada → mensaje neutral (no revela si existe)
      setRequestState("submitted");
    } catch {
      setRequestState("error");
    } finally {
      setRequesting(false);
    }
  }

  // ─────────── Modo sin token: form request access ───────────
  if (!token) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl sm:text-3xl font-bold">🧳 Tus pedidos Concierge</h1>
          <p className="text-sm text-gray-400 mt-2">
            Introduce tu email para recibir un link de acceso a tu portal.
            Sólo te lo enviamos si tienes algún pedido registrado con ese
            email — sin spam ni cuenta tradicional.
          </p>
        </header>

        {error === "link_expired" && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Tu link de acceso ha caducado (válido 7 días). Pide uno nuevo
            con tu email.
          </div>
        )}

        <form
          onSubmit={onRequestAccess}
          className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-gray-900 p-5 space-y-3"
        >
          <label className="text-xs text-gray-400 block">
            <span className="block mb-1">Tu email de pedido</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white"
            />
          </label>
          <button
            type="submit"
            disabled={requesting}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm"
          >
            {requesting ? "Enviando…" : "📧 Enviar link de acceso"}
          </button>

          {requestState === "submitted" && (
            <p className="text-xs text-emerald-300 mt-2">
              ✅ Si tienes algún pedido con este email, te hemos enviado un
              link. Revisa tu inbox (y spam) — caduca en 7 días. Si no llega
              en 10 minutos, escríbenos a soporte.
            </p>
          )}
          {requestState === "error" && (
            <p className="text-xs text-rose-300 mt-2">
              Hubo un error. Reintenta o escríbenos a{" "}
              <a href="mailto:contacto@tripcazador.com" className="underline">
                contacto@tripcazador.com
              </a>
              .
            </p>
          )}
        </form>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 text-sm text-gray-400">
          <strong className="text-white">¿Aún no has hecho un pedido?</strong>{" "}
          <Link href="/concierge" className="text-amber-400 hover:underline">
            Mira nuestros 4 niveles Concierge
          </Link>{" "}
          desde €9.
        </div>
      </div>
    );
  }

  // ─────────── Modo con token (válido o caducado) ───────────
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">🧳 Tus pedidos Concierge</h1>
        {emailUsedForToken && (
          <p className="text-sm text-gray-400 mt-2">
            Sesión: <span className="font-mono text-gray-200">{emailUsedForToken}</span>
          </p>
        )}
      </header>

      {loading && <div className="text-sm text-gray-500">Cargando tus pedidos…</div>}

      {error && error !== "link_expired" && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Error: {error}. Reintenta o escribe a{" "}
          <a href="mailto:contacto@tripcazador.com" className="underline">
            contacto@tripcazador.com
          </a>
          .
        </div>
      )}

      {orders && orders.length === 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-sm text-gray-300">
          No hemos encontrado pedidos para este email. Si esperabas alguno,
          puede ser que pagaras con otro correo —{" "}
          <Link href="/concierge/mis-pedidos" className="text-amber-400 hover:underline">
            prueba con otro
          </Link>
          .
        </div>
      )}

      {orders && orders.length > 0 && (
        <ul className="space-y-4">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </ul>
      )}

      <div className="text-xs text-gray-500 text-center pt-4">
        <Link href="/concierge/mis-pedidos" className="text-gray-400 hover:text-amber-400">
          Cerrar sesión / Cambiar email
        </Link>
      </div>
    </div>
  );
}

function OrderCard({ order: o }: { order: CustomerOrder }) {
  return (
    <li className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span
              className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${STATUS_BADGE[o.status]}`}
            >
              {o.status_label}
            </span>
            {o.tier && (
              <span className="text-[10px] uppercase tracking-wider text-gray-400 px-2 py-0.5 rounded border border-gray-700">
                {TIER_LABEL[o.tier]}
              </span>
            )}
          </div>
          <div className="text-white font-semibold text-lg">
            {o.origin} → {o.destination}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            ✈ {o.date_from}
            {o.date_to && ` → ${o.date_to}`} · {o.travelers}{" "}
            {o.travelers === 1 ? "viajero" : "viajeros"}
          </div>
          <div className="text-xs text-gray-500 mt-1 font-mono">
            Pedido {o.id} · €{o.amount_paid_eur}
          </div>
          {o.delivered_at && (
            <div className="text-xs text-emerald-300 mt-1">
              ✅ Entregado el {new Date(o.delivered_at).toLocaleDateString("es-ES")}
            </div>
          )}
        </div>
      </div>

      {o.status === "delivered" && o.deliverable_markdown && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-amber-300 hover:text-amber-200">
            📄 Ver mi plan completo
          </summary>
          <div className="mt-3 rounded-lg bg-black/40 border border-gray-800 p-4 text-sm text-gray-200 whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-96 overflow-y-auto">
            {o.deliverable_markdown}
          </div>
        </details>
      )}

      {o.status === "pending" && (
        <p className="mt-3 text-xs text-gray-400">
          Hemos recibido tu pedido. Empezaremos a buscar en cuanto el cazador asignado lo tome.
        </p>
      )}
      {o.status === "in_progress" && (
        <p className="mt-3 text-xs text-cyan-300">
          🔍 Buscando tu mejor opción. Recibirás un email cuando esté listo (≤24h tier Standard).
        </p>
      )}
      {o.status === "refunded" && (
        <p className="mt-3 text-xs text-rose-300">
          Este pedido fue reembolsado. Si tienes dudas escríbenos a{" "}
          <a href="mailto:contacto@tripcazador.com" className="underline">
            contacto@tripcazador.com
          </a>
          .
        </p>
      )}
    </li>
  );
}
