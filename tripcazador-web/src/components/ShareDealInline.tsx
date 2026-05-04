"use client";

/**
 * ShareDealInline — fila de share inline bajo el CTA "Ver oferta".
 *
 * 3 botones: WhatsApp, Telegram, native share API (móvil).
 * - GA4 event "deal_share" con channel para tracking conversion atribución.
 * - rel="noopener noreferrer" en todos los links externos.
 * - Texto pre-rellenado optimizado para CTR + URL canónica al deal.
 *
 * Diseño minimalista: 3 iconos pequeños alineados horizontalmente, no
 * compite con el CTA principal pero está presente. Si el browser soporta
 * navigator.share, mostramos icono "Compartir" nativo a la izquierda.
 */

import { tcTrack } from "@/lib/track_client";

interface ShareDealInlineProps {
  dealId: string;
  headline: string;
  origin?: string;
  destination?: string;
  price: number;
}

function track(channel: string, dealId: string) {
  // SSS63: emit share_completed → funnel
  tcTrack("share_completed", { channel, deal_id: dealId });
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (gtag) {
    gtag("event", "deal_share", {
      deal_id: dealId,
      channel,
    });
  }
}

export function ShareDealInline({
  dealId,
  headline,
  origin,
  destination,
  price,
}: ShareDealInlineProps) {
  const dealUrl = `https://tripcazador.com/deals/${encodeURIComponent(dealId)}`;
  const shortText = `${headline} desde ${price.toFixed(0)}€ — TripCazador`;
  const fullText =
    origin && destination
      ? `${origin}→${destination}: ${headline} ${price.toFixed(0)}€. Visto en TripCazador.`
      : shortText;

  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${fullText} ${dealUrl}`)}`;
  const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(dealUrl)}&text=${encodeURIComponent(fullText)}`;

  function nativeShare() {
    if (typeof window === "undefined") return;
    const nav = window.navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (nav.share) {
      track("native", dealId);
      nav
        .share({ title: shortText, text: fullText, url: dealUrl })
        .catch(() => { /* user canceló o no permitido */ });
    } else {
      // Fallback: copiar URL al portapapeles
      track("clipboard", dealId);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(dealUrl).catch(() => undefined);
      }
    }
  }

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
      <span aria-hidden="true">Compartir:</span>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("whatsapp", dealId)}
        aria-label="Compartir por WhatsApp"
        className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-800 hover:bg-green-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        title="WhatsApp"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-1 1.1-.2.2-.4.2-.6.1-.7-.4-1.5-.8-2.3-1.7-.6-.5-1-1.2-1.1-1.4-.1-.2 0-.3.1-.4.1-.1.2-.3.4-.4.1-.1.2-.2.2-.4.1-.1 0-.3 0-.4l-.9-2.1c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3 4.8 4.2 1.7.7 2.3.8 3.1.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.2-.1-.4-.2-.7-.3zM12 2C6.5 2 2 6.5 2 12c0 1.7.4 3.3 1.2 4.7L2 22l5.3-1.4c1.4.8 3 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
        </svg>
      </a>
      <a
        href={tgUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("telegram", dealId)}
        aria-label="Compartir por Telegram"
        className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-800 hover:bg-sky-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        title="Telegram"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
        </svg>
      </a>
      <button
        type="button"
        onClick={nativeShare}
        aria-label="Compartir"
        className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        title="Más opciones"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
          <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
        </svg>
      </button>
    </div>
  );
}

export default ShareDealInline;
