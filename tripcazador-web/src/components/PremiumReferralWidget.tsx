"use client";

/**
 * PremiumReferralWidget — SSS320 (19 may 2026)
 *
 * Widget en /panel/premium para que el user comparta su código de
 * referral. Cuando alguien se suscribe usando su link ambos
 * reciben 30 días gratis de Premium.
 *
 * Show:
 *  - Su código TC-XXXXXXXX
 *  - Botón copy share URL
 *  - Stats: cuántos amigos suscritos / cuántos premiados
 *  - Botón compartir (Web Share API si disponible, fallback clipboard)
 */

import { useEffect, useState } from "react";
import { getPremiumStatus } from "@/lib/premium";

interface ReferralMe {
  ok: boolean;
  code: string;
  share_url: string;
  referrals_count: number;
  rewarded_count: number;
  cap: number;
  cap_remaining: number;
}

export function PremiumReferralWidget() {
  const [mounted, setMounted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [data, setData] = useState<ReferralMe | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const s = getPremiumStatus();
    setIsPremium(s.active);
    setCustomerId(s.customerId || null);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isPremium || !customerId) return;
    let cancelled = false;
    fetch(`/api/premium/referral/me?customer_id=${encodeURIComponent(customerId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ReferralMe | null) => {
        if (cancelled || !d || !d.ok) return;
        setData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mounted, isPremium, customerId]);

  async function copyShareUrl() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.share_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard off */
    }
  }

  async function shareNative() {
    if (!data) return;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: "TripCazador Premium",
          text: "Te paso mi código para 1 mes gratis de TripCazador Premium 🛫",
          url: data.share_url,
        });
        return;
      } catch {
        /* user cancel */
      }
    }
    // Fallback a copy
    void copyShareUrl();
  }

  if (!mounted || !isPremium || !data) return null;

  return (
    <div className="rounded-2xl border border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-500/15 via-fuchsia-500/5 to-gray-900 p-6">
      <div className="text-xs uppercase tracking-wider text-fuchsia-300 font-bold">
        🎁 Referral · 1 mes gratis para ambos
      </div>
      <h2 className="text-xl font-bold text-white mt-1">
        Trae un amigo y gana 30 días gratis
      </h2>
      <p className="text-sm text-gray-300 mt-2">
        Cuando alguien activa Premium usando tu link, recibís{" "}
        <strong className="text-fuchsia-300">ambos</strong> 30 días extra
        gratis en vuestra suscripción.
      </p>

      <div className="mt-4 flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-fuchsia-500/20">
          <div className="text-[10px] uppercase tracking-wider text-gray-500">
            Tu código
          </div>
          <div className="text-2xl font-mono font-bold text-fuchsia-300 mt-1">
            {data.code}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:w-48">
          <button
            type="button"
            onClick={copyShareUrl}
            className="px-4 py-2 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-semibold text-sm"
          >
            {copied ? "✓ Copiado" : "📋 Copiar link"}
          </button>
          <button
            type="button"
            onClick={shareNative}
            className="px-4 py-2 rounded-lg border border-fuchsia-500/40 hover:bg-fuchsia-500/10 text-fuchsia-200 text-sm"
          >
            🔗 Compartir
          </button>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 break-all">
        {data.share_url}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stat
          label="Amigos suscritos"
          value={String(data.referrals_count)}
          sub={`de ${data.cap} máx`}
        />
        <Stat
          label="Premiados"
          value={String(data.rewarded_count)}
          sub="con extensión activa"
        />
      </div>

      {data.referrals_count === 0 && (
        <p className="mt-4 text-xs text-gray-400">
          💡 Aún nadie usó tu código. Compártelo por WhatsApp, Telegram o
          email — el copy ya está hecho.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-black/30 border border-fuchsia-500/20 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <div className="text-2xl font-bold text-white mt-0.5">{value}</div>
      {sub && <div className="text-[11px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}
