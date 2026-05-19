"use client";

/**
 * NLAlertWidget — SSS319 (19 may 2026)
 *
 * Widget Premium en /panel/premium/alertas. Permite al user escribir
 * una alerta en lenguaje natural ("vuelos a Tokio bajo 500€ en agosto
 * business") en lugar de rellenar el formulario campo a campo.
 *
 * Flujo:
 *  1. User escribe en textarea + email
 *  2. Click "Procesar" → POST /api/premium/alerts/parse-nl
 *  3. Preview de los filtros detectados con confidence + warnings
 *  4. User confirma → POST /api/premium/alerts (mismo endpoint que el
 *     formulario tradicional) para persistir
 *  5. Callback opcional onCreated() para refrescar lista padre
 */

import { useState } from "react";

interface ParseResult {
  ok: boolean;
  parsed: {
    origin?: string;
    destination?: string;
    max_price?: number;
    cabin?: "economy" | "business" | "first";
    date_min?: string;
    date_max?: string;
  };
  warnings: string[];
  confidence: "low" | "medium" | "high";
  matches: { field: string; value: string; raw: string }[];
}

interface Props {
  customerId: string;
  defaultEmail?: string;
  onCreated?: () => void;
}

export function NLAlertWidget({ customerId, defaultEmail, onCreated }: Props) {
  const [text, setText] = useState("");
  const [email, setEmail] = useState(defaultEmail || "");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onParse(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!text.trim()) {
      setError("Escribe qué quieres vigilar primero.");
      return;
    }
    setParsing(true);
    try {
      const res = await fetch("/api/premium/alerts/parse-nl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId, text }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<ParseResult> & {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || `parse_error_${res.status}`);
        return;
      }
      setParseResult(data as ParseResult);
    } catch {
      setError("network_error");
    } finally {
      setParsing(false);
    }
  }

  async function onCreate() {
    if (!parseResult || !email.trim()) {
      setError("Necesitamos tu email para enviarte las alertas.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        customer_id: customerId,
        email: email.trim().toLowerCase(),
        max_price: parseResult.parsed.max_price ?? 999,
      };
      if (parseResult.parsed.origin) body.origin = parseResult.parsed.origin;
      if (parseResult.parsed.destination) body.destination = parseResult.parsed.destination;
      if (parseResult.parsed.cabin) body.cabin = parseResult.parsed.cabin;
      if (parseResult.parsed.date_min) body.date_min = parseResult.parsed.date_min;
      if (parseResult.parsed.date_max) body.date_max = parseResult.parsed.date_max;
      const res = await fetch("/api/premium/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || `create_error_${res.status}`);
        return;
      }
      setSuccess(true);
      setText("");
      setParseResult(null);
      if (onCreated) onCreated();
    } catch {
      setError("network_error");
    } finally {
      setCreating(false);
    }
  }

  const confidenceColor =
    parseResult?.confidence === "high"
      ? "text-emerald-300"
      : parseResult?.confidence === "medium"
        ? "text-amber-300"
        : "text-rose-300";

  return (
    <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-gray-900 p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">✨</span>
        <h3 className="font-bold text-white text-base">
          Crear alerta en lenguaje natural
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-violet-300 font-bold px-2 py-0.5 rounded bg-violet-500/20">
          beta
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Escribe en español lo que quieres vigilar — extraemos origen,
        destino, precio máximo, cabina y fechas. Después confirmas y
        creamos la alerta.
      </p>

      <form onSubmit={onParse} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Ej: "vuelos a Tokio bajo 500€ en septiembre business"'
          rows={2}
          maxLength={500}
          className="w-full px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white placeholder:text-gray-600"
        />
        <div className="flex gap-2 items-center flex-wrap">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white"
          />
          <button
            type="submit"
            disabled={parsing}
            className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white font-semibold text-sm"
          >
            {parsing ? "Procesando…" : "✨ Procesar"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-3 text-xs text-rose-400 bg-rose-500/10 px-3 py-2 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 text-xs text-emerald-300 bg-emerald-500/10 px-3 py-2 rounded">
          ✓ Alerta creada. Si vimos cosas raras, edítala más abajo en la lista.
        </div>
      )}

      {parseResult && (
        <div className="mt-4 rounded-xl border border-gray-800 bg-black/40 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-bold text-white">Preview detección</h4>
            <span className={`text-xs font-semibold ${confidenceColor}`}>
              Confianza: {parseResult.confidence}
            </span>
          </div>

          {parseResult.matches.length > 0 ? (
            <ul className="mt-3 text-xs space-y-1">
              {parseResult.matches.map((m, i) => (
                <li key={i} className="flex gap-2 items-baseline">
                  <span className="text-gray-500 w-24 shrink-0">{m.field}:</span>
                  <span className="text-amber-300 font-semibold">
                    {m.value}
                  </span>
                  <span className="text-gray-600">(&quot;{m.raw}&quot;)</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-gray-400">
              No detectamos ningún campo. Reescribe especificando destino y
              precio (ej: &quot;Tokio bajo 600€&quot;).
            </p>
          )}

          {parseResult.warnings.length > 0 && (
            <ul className="mt-3 text-xs text-amber-300 space-y-1">
              {parseResult.warnings.map((w, i) => (
                <li key={i}>⚠ {humanizeWarning(w)}</li>
              ))}
            </ul>
          )}

          {parseResult.matches.length > 0 && (
            <button
              type="button"
              onClick={onCreate}
              disabled={creating || !email.trim()}
              className="mt-4 w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold text-sm"
            >
              {creating ? "Creando alerta…" : "✓ Crear esta alerta"}
            </button>
          )}
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-gray-500 hover:text-violet-300">
          Ejemplos que sí funcionan
        </summary>
        <ul className="mt-2 text-xs text-gray-400 space-y-1 pl-4 list-disc">
          <li>&quot;vuelos a Tokio bajo 500€ en septiembre business&quot;</li>
          <li>&quot;BCN → JFK máximo 400€ ida y vuelta agosto&quot;</li>
          <li>&quot;Roma desde Madrid 200€ economy&quot;</li>
          <li>&quot;Dubai max 350 octubre&quot;</li>
        </ul>
      </details>
    </div>
  );
}

function humanizeWarning(w: string): string {
  if (w === "no_route_detected")
    return "No vimos un destino/origen claro. Especifica IATA (BCN, MAD) o nombre de ciudad.";
  if (w === "no_price_detected")
    return "No detectamos el precio máximo. Añade '500€' o 'bajo 600'.";
  if (w === "input_too_long") return "Texto demasiado largo, recorta.";
  if (w.startsWith("region_unsupported_"))
    return "Hablaste de una región — por ahora soportamos ciudades concretas o códigos IATA.";
  return w;
}
