"use client";

/**
 * FavoritePushNudge — fase jjj JJJ6 (May 2026)
 *
 * Toast soft prompt que aparece cuando el usuario añade su PRIMER favorito.
 * Sugiere activar push notifications para recibir alertas de bajada de precio.
 *
 * Solo se muestra una vez (localStorage flag). Solo si:
 *   - Tiene 1+ favoritos
 *   - No le hemos pedido antes
 *   - Browser soporta Notification API
 *   - Permission state === "default" (no negado)
 *
 * Click en "Activar" → trigger flow nativo de Notification.requestPermission().
 * El registro real al backend lo hace PushNotificationOptIn (que sigue en home).
 *
 * Por qué: primer favorito = momento de intent más alto. Pedir push con
 * contexto ("te aviso si baja MAD-NRT") tiene 4x más conversión que un
 * banner genérico.
 */
import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { getFavorites, subscribeFavorites } from "@/lib/favorites";

const NUDGE_KEY = "tc_fav_push_nudge_shown";

export function FavoritePushNudge() {
  const [show, setShow] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return; // ya granted/denied
    try {
      if (localStorage.getItem(NUDGE_KEY)) return; // ya pedido antes
    } catch {
      return;
    }

    const checkFavs = () => {
      const favs = getFavorites();
      if (favs.length >= 1 && Notification.permission === "default") {
        // Pequeño delay para no aparecer simultáneo al toggle del corazón
        setTimeout(() => setShow(true), 800);
      }
    };
    return subscribeFavorites(checkFavs);
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(NUDGE_KEY, "1");
    } catch {
      /* no-op */
    }
  }

  async function handleEnable() {
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      if (typeof window !== "undefined" && (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag) {
        (window as unknown as { gtag: (...a: unknown[]) => void }).gtag("event", "push_nudge_response", {
          result,
          source: "favorite_first",
        });
      }
      // Si granted, PushNotificationOptIn (mounted en home) registrará el endpoint
      // automáticamente vía su useEffect que polleo permission state.
    } catch {
      /* no-op */
    } finally {
      dismiss();
    }
  }

  if (!show) return null;

  return (
    <div
      role="alertdialog"
      aria-live="polite"
      aria-labelledby="fav-push-nudge-title"
      className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-sm z-[55] rounded-2xl border border-amber-500/40 bg-gray-900 shadow-2xl shadow-amber-500/10 p-4 animate-in fade-in slide-in-from-bottom-2"
      data-testid="favorite-push-nudge"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar"
        className="absolute top-2 right-2 w-7 h-7 rounded-full text-gray-500 hover:text-white hover:bg-gray-800 inline-flex items-center justify-center"
      >
        <X size={14} />
      </button>

      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-full bg-amber-500/15 inline-flex items-center justify-center">
          <Bell size={18} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 id="fav-push-nudge-title" className="text-sm font-bold text-white">
            ¿Te aviso si baja de precio?
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Activamos notificaciones para tus chollos guardados. Sin spam, solo bajadas reales.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleEnable}
              disabled={requesting}
              className="flex-1 px-3 py-2 min-h-[36px] rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-bold transition-colors"
            >
              {requesting ? "..." : "Activar"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="px-3 py-2 min-h-[36px] rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
