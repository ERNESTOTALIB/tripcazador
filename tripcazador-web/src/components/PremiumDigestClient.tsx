"use client";

/**
 * PremiumDigestClient — SSS316 (19 may 2026)
 *
 * Renderiza el digest semanal Premium del user. Llama /api/premium/weekly-digest
 * con el customerId y muestra los top 5 deals scored + razones del match.
 *
 * Esta misma UI se sirve también por email (cron domingos 9:00 Madrid)
 * para los Premium con alertas o búsquedas guardadas activas.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPremiumStatus } from "@/lib/premium";

interface PersonalizedDeal {
  id?: string;
  origin?: string;
  destination?: string;
  price_eur?: number;
  date_out?: string;
  date_ret?: string;
  airline_name?: string;
  headline?: string;
  savings_pct?: number;
  match_score: number;
  why_matched: string[];
}

interface DigestResponse {
  ok: boolean;
  digest_week: string;
  top_deals: PersonalizedDeal[];
  reasoning: string;
}

export function PremiumDigestClient() {
  const [mounted, setMounted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [data, setData] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getPremiumStatus();
    setIsPremium(s.active);
    setCustomerId(s.customerId || null);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isPremium || !customerId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/premium/weekly-digest?customer_id=${encodeURIComponent(customerId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: DigestResponse | null) => {
        if (cancelled) return;
        if (!d || !d.ok) {
          setError("network_error");
          return;
        }
        setData(d);
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
  }, [mounted, isPremium, customerId]);

  if (!mounted) return null;

  if (!isPremium) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-gray-900 p-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Digest semanal — Premium
        </h1>
        <p className="text-sm text-gray-400">
          Cada domingo enviamos un email con los 5 mejores deals que
          matchean tus alertas y búsquedas guardadas. Solo Premium.{" "}
          <Link
            href="/premium?utm_source=digest_panel"
            className="text-amber-400 font-semibold hover:underline"
          >
            Activar Premium
          </Link>
          .
        </p>
      </div>
    );
  }

  if (!customerId) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-gray-900 p-6 text-sm text-gray-300">
        No encontramos tu customerId Stripe. Reactiva desde{" "}
        <Link href="/panel/premium" className="text-amber-400 hover:underline">
          /panel/premium
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Tu digest semanal</h1>
        <p className="text-sm text-gray-400 mt-1">
          Top deals personalizados según tus alertas + búsquedas guardadas.
          También llega a tu email cada domingo a las 9:00.
        </p>
      </header>

      {loading && (
        <div className="text-sm text-gray-500">Calculando tu digest…</div>
      )}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
          No pudimos cargar tu digest. Reintenta más tarde.
        </div>
      )}

      {data && (
        <>
          <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-xs text-gray-400">
            <span className="text-gray-500">Semana:</span>{" "}
            <span className="text-white font-mono">{data.digest_week}</span>{" "}
            · {data.reasoning}
          </div>

          {data.top_deals.length === 0 && (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-sm text-gray-300">
              Esta semana no hay deals que matcheen tus criterios. Ajusta tus{" "}
              <Link
                href="/panel/premium/alertas"
                className="text-amber-400 hover:underline"
              >
                alertas
              </Link>{" "}
              o crea más{" "}
              <Link
                href="/panel/premium/busquedas"
                className="text-amber-400 hover:underline"
              >
                búsquedas
              </Link>
              .
            </div>
          )}

          {data.top_deals.length > 0 && (
            <ol className="space-y-3">
              {data.top_deals.map((d, idx) => (
                <li
                  key={d.id || `${d.origin}-${d.destination}-${idx}`}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl font-bold text-amber-300 shrink-0 tabular-nums">
                      #{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold">
                        {d.origin} → {d.destination}
                        {d.airline_name && (
                          <span className="text-gray-500 font-normal text-sm ml-2">
                            · {d.airline_name}
                          </span>
                        )}
                      </div>
                      {d.headline && (
                        <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                          {d.headline}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        <span className="text-amber-300 font-semibold">
                          {d.price_eur ? `${Math.round(d.price_eur)}€` : "—"}
                        </span>
                        {d.date_out && (
                          <span className="text-gray-400">
                            ✈ {d.date_out}
                            {d.date_ret && ` → ${d.date_ret}`}
                          </span>
                        )}
                        {typeof d.savings_pct === "number" && d.savings_pct > 0 && (
                          <span className="text-emerald-400 font-semibold">
                            -{Math.round(d.savings_pct)}%
                          </span>
                        )}
                        <span className="text-gray-500">
                          score {d.match_score}
                        </span>
                      </div>
                      {d.why_matched.length > 0 && (
                        <ul className="mt-2 text-xs text-gray-300 space-y-0.5">
                          {d.why_matched.map((r, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-gray-500">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {d.id && (
                      <Link
                        href={`/deals/${d.id}`}
                        className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold self-center"
                      >
                        Ver
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
