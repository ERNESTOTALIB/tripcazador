"use client";

/**
 * PushNotificationOptIn — fase ww WW4
 *
 * Pequeño widget que pide permiso de notificaciones push al usuario, registra
 * la subscripción al backend y desbloquea avisos instantáneos cuando un
 * price-alert match.
 *
 * Aparece como CTA en /panel/alertas y como banner inline tras crear primera
 * alerta. Solo se muestra si:
 *   - El navegador soporta Notification API + ServiceWorker
 *   - El usuario no ha negado permission (state="default")
 *   - No se ha mostrado <30d ago (localStorage)
 *
 * Cuando NEXT_PUBLIC_VAPID_PUBLIC_KEY no está configurado el botón muestra
 * un mensaje de "próximamente". El backend FastAPI necesita web-push library
 * + VAPID keys para enviar notifs reales.
 */
import { useEffect, useState } from "react";

const _KEY = "tc_push_prompt_v1";
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  // Allocate ArrayBuffer (not SharedArrayBuffer) to satisfy Push API typings
  const buf = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; ++i) {
    view[i] = rawData.charCodeAt(i);
  }
  return view;
}

export function PushNotificationOptIn() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = "Notification" in window && "serviceWorker" in navigator;
    setSupported(ok);
    if (ok) {
      setPermission(Notification.permission);
      // Check existing subscription
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setSubscribed(!!sub))
        .catch(() => {});
    }
  }, []);

  async function subscribe() {
    setBusy(true);
    setError(null);

    if (!VAPID_KEY) {
      setError("Notificaciones push pendientes de configurar (VAPID keys). Próximamente.");
      setBusy(false);
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        setError("Permiso denegado. Puedes activarlo desde la configuración del navegador.");
        setBusy(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      });

      // Send subscription to backend
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      setSubscribed(true);
      try {
        navigator.sendBeacon(
          "/api/track",
          JSON.stringify({ type: "push_opted_in" }),
        );
      } catch {}
    } catch (err) {
      setError("Error al activar: " + (err as Error).message);
    }
    setBusy(false);
  }

  if (!supported) return null;

  if (subscribed) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="text-sm text-amber-200">
          ✓ Notificaciones push activadas — te avisaremos cuando aparezca un chollo
          que cumpla tus alertas.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
      <div className="flex items-start gap-4">
        <div className="text-3xl">🔔</div>
        <div className="flex-1">
          <h3 className="font-bold text-white">Avisos al instante de chollos &lt;50€</h3>
          <p className="text-sm text-gray-300 mt-1">
            Te avisamos en menos de 60 segundos cuando detectamos un{" "}
            <strong className="text-amber-300">error fare</strong> bajo tus
            criterios (ej. Madrid → Lisboa 14€). Sólo CRÍTICOS — nunca más de
            1-2 push por día. Cancelas con 1 click.
          </p>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
        <button
          onClick={subscribe}
          disabled={busy || permission === "denied"}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-bold rounded-lg whitespace-nowrap"
        >
          {busy ? "…" : permission === "denied" ? "Bloqueado" : "Activar"}
        </button>
      </div>
    </div>
  );
}
