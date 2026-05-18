"use client";

/**
 * AgenciaGraciasClient — SSS309 (19 may 2026)
 *
 * Llama a /api/agencia/activate?session_id=cs_xxx al montar para crear
 * el ticket en caso de que el Stripe webhook no se haya disparado
 * todavía. Idempotente (si ya existe, devuelve el existente).
 *
 * Muestra el ticket_id si se creó/encontró.
 */
import { useEffect, useState } from "react";

interface Ticket {
  id: string;
  tipo: "vuelo" | "vuelo_hotel";
  amount_eur: number;
}

export function AgenciaGraciasClient({ sessionId }: { sessionId: string }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    fetch(`/api/agencia/activate?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.ok && d.ticket) setTicket(d.ticket);
        else if (d.error) setError(d.error);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (ticket) {
    return (
      <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/5 text-left">
        <div className="text-xs text-gray-400 mb-1">Ticket creado:</div>
        <code className="text-amber-300 font-mono text-sm break-all">
          {ticket.id}
        </code>
        <p className="text-xs text-gray-500 mt-2">
          {ticket.tipo === "vuelo" ? "🛫 Vuelo" : "🛫🏨 Vuelo + Hotel"} · €
          {ticket.amount_eur}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-gray-500">
        Procesando ticket… si tienes dudas, escribe a{" "}
        <a className="text-amber-400 underline" href="mailto:contacto@tripcazador.com">
          contacto@tripcazador.com
        </a>{" "}
        con el session_id <code className="font-mono">{sessionId.slice(0, 24)}…</code>
      </div>
    );
  }

  return (
    <p className="text-xs text-gray-500 font-mono">
      Procesando · session: {sessionId.slice(0, 24)}…
    </p>
  );
}
