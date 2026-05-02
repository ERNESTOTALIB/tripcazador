"use client";

/**
 * ReferralPanel — fase ww WW6
 *
 * Genera el código del usuario y muestra el link compartible con botones
 * WhatsApp / Telegram / Twitter / native share / copy.
 */
import { useEffect, useState } from "react";
import { getOrCreateReferralCode, getReferralLink } from "@/lib/referral";

export function ReferralPanel() {
  const [code, setCode] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCode(getOrCreateReferralCode());
    setLink(getReferralLink());
  }, []);

  function copyLink() {
    if (!link) return;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        try {
          navigator.sendBeacon(
            "/api/track",
            JSON.stringify({ type: "referral_link_copied", meta: { code } }),
          );
        } catch {}
      })
      .catch(() => {});
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `Estoy usando TripCazador para encontrar vuelos baratos y error fares 🛫 Te paso mi código para que ambos tengamos 1 mes Premium gratis: ${link}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }
  function shareTelegram() {
    const text = encodeURIComponent(
      `🛫 TripCazador caza error fares 24/7. Te paso mi código de referido — ambos ganamos 1 mes Premium gratis:`,
    );
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
  function shareTwitter() {
    const text = encodeURIComponent(
      `Cazo vuelos baratos con @tripcazador. Si te haces Premium con mi código, ambos ganamos 1 mes gratis 🎁`,
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(link)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
  async function nativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) {
      copyLink();
      return;
    }
    try {
      await navigator.share({
        title: "TripCazador — chollos de vuelo",
        text: "Te paso mi código de referido — ambos ganamos 1 mes Premium gratis",
        url: link,
      });
    } catch {}
  }

  if (!code) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6 animate-pulse h-32" />
    );
  }

  return (
    <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-600/5 p-6 sm:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <p className="text-sm text-amber-400 font-semibold uppercase tracking-wider mb-2">
            Tu código
          </p>
          <div className="text-3xl sm:text-4xl font-bold text-white font-mono tracking-tight">
            {code}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Cada amigo que se haga Premium con tu código nos da 1 mes gratis a ambos.
          </p>
        </div>

        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
            Tu link único
          </label>
          <div className="flex">
            <input
              type="text"
              readOnly
              value={link}
              className="flex-1 bg-gray-950 border border-gray-700 rounded-l-md px-3 py-2 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={copyLink}
              className="px-4 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-r-md transition-colors"
            >
              {copied ? "✓" : "Copiar"}
            </button>
          </div>
        </div>
      </div>

      {/* Share buttons */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={shareWhatsApp}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          WhatsApp
        </button>
        <button
          onClick={shareTelegram}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.473-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          Telegram
        </button>
        <button
          onClick={shareTwitter}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          𝕏 Twitter
        </button>
        <button
          onClick={nativeShare}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          📲 Más opciones
        </button>
      </div>
    </section>
  );
}
