"use client";

/**
 * PremiumOnboardingWizard — SSS317 (19 may 2026)
 *
 * 3-step wizard que aparece en /panel/premium para nuevos Premium.
 *
 * Steps (detección automática vía stats endpoint):
 *  1. Crea tu 1ª alerta → CTA /alertas
 *  2. Guarda tu 1ª búsqueda → CTA /deals (con instrucción)
 *  3. Vigila tu 1er deal → CTA /deals
 *
 * Se oculta automáticamente cuando los 3 steps están completos o el
 * user pulsa "dismiss" (localStorage tc_premium_wizard_dismissed_v1).
 *
 * Por qué importa: el "pagué Premium y no sé por dónde empezar" es
 * la friction principal de activación. Sin wizard el user 30% no
 * llega a usar ninguna feature en su primera semana.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPremiumStatus } from "@/lib/premium";

interface PremiumStats {
  ok: boolean;
  alerts: { active: number; triggered: number; total: number };
  saved_searches: { count: number };
  watchlist: { active: number; triggered: number; total: number };
}

const DISMISS_KEY = "tc_premium_wizard_dismissed_v1";

export function PremiumOnboardingWizard() {
  const [mounted, setMounted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [stats, setStats] = useState<PremiumStats | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const s = getPremiumStatus();
    setIsPremium(s.active);
    setCustomerId(s.customerId || null);
    setMounted(true);
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      /* off */
    }
  }, []);

  useEffect(() => {
    if (!mounted || !isPremium || !customerId || dismissed) return;
    let cancelled = false;
    fetch(`/api/premium/stats?customer_id=${encodeURIComponent(customerId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: PremiumStats | null) => {
        if (cancelled || !d || !d.ok) return;
        setStats(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mounted, isPremium, customerId, dismissed]);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* off */
    }
  }

  if (!mounted || !isPremium || dismissed) return null;
  if (!stats) return null;

  const step1Done = stats.alerts.total > 0;
  const step2Done = stats.saved_searches.count > 0;
  const step3Done = stats.watchlist.total > 0;
  const allDone = step1Done && step2Done && step3Done;

  // Si ya completó los 3 → no mostrar wizard. Storytelling celebratorio
  // queda al ROI widget; el wizard solo aparece para guiar nuevos users.
  if (allDone) return null;

  const completed = [step1Done, step2Done, step3Done].filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-gray-900 p-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-wider text-amber-300 font-bold">
            Onboarding Premium · {completed}/3
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Saca el máximo a tu Premium en 3 minutos
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Estos 3 pasos te activan las features que más usan otros
            Premium. Cuando los completes este recuadro desaparece solo.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-xs text-gray-500 hover:text-gray-300 self-start"
          aria-label="Dismiss onboarding"
        >
          Saltar
        </button>
      </div>

      <div className="mt-5 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-amber-400 transition-all"
          style={{ width: `${(completed / 3) * 100}%` }}
        />
      </div>

      <ol className="mt-6 space-y-3">
        <Step
          n={1}
          done={step1Done}
          title="Crea tu 1ª alerta"
          desc="Define una ruta + precio máximo y te avisamos cuando algún deal baje de ese cap."
          cta="Crear alerta"
          href="/alertas?from=premium_wizard_step1"
        />
        <Step
          n={2}
          done={step2Done}
          title="Guarda tu 1ª búsqueda"
          desc="Combina filtros pro (aerolíneas, escalas, cabina) y re-aplícalos con 1 click."
          cta="Ir a buscar deals"
          href="/deals?from=premium_wizard_step2"
        />
        <Step
          n={3}
          done={step3Done}
          title="Vigila tu 1er deal"
          desc="Pulsa &quot;👀 Vigilar este deal&quot; en cualquier oferta — te avisamos si el precio baja."
          cta="Explorar deals"
          href="/deals?from=premium_wizard_step3"
        />
      </ol>

      {completed > 0 && completed < 3 && (
        <p className="mt-4 text-xs text-emerald-300">
          ✨ ¡Vas {completed}/3! Sigue así.
        </p>
      )}
    </div>
  );
}

function Step({
  n,
  done,
  title,
  desc,
  cta,
  href,
}: {
  n: number;
  done: boolean;
  title: string;
  desc: string;
  cta: string;
  href: string;
}) {
  return (
    <li
      className={`flex gap-3 rounded-xl border p-4 transition ${
        done
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-gray-800 bg-gray-900 hover:border-amber-500/30"
      }`}
    >
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          done
            ? "bg-emerald-500 text-black"
            : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
        }`}
      >
        {done ? "✓" : n}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3
            className={`font-semibold text-sm ${
              done ? "text-emerald-300 line-through opacity-80" : "text-white"
            }`}
          >
            {title}
          </h3>
          {!done && (
            <Link
              href={href}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold shrink-0"
            >
              {cta}
            </Link>
          )}
        </div>
        <p
          className={`text-xs mt-1 ${done ? "text-gray-500" : "text-gray-400"}`}
        >
          {desc}
        </p>
      </div>
    </li>
  );
}
