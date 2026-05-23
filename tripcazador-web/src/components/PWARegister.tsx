"use client";
/**
 * PWARegister — SSS425 (23 may 2026)
 *
 * Registra /sw-pwa.js sólo si NEXT_PUBLIC_PWA_ENABLED=1. Sin esta env,
 * NO toca nada — preserva el comportamiento actual (kill-switch sw.js
 * auto-unregister desde SSS136).
 *
 * Diseño defensivo:
 * - Skip si SW no soportado o estamos en localhost
 * - Skip si NEXT_PUBLIC_PWA_ENABLED != "1"
 * - Registra /sw-pwa.js (distinto de /sw.js — coexisten)
 * - update() periódico cada 30 min — no navigate (lección SSS135)
 */
import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    const enabled = process.env.NEXT_PUBLIC_PWA_ENABLED === "1";
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // No registrar en localhost (rompe dev experience)
    if (window.location.hostname === "localhost") return;

    let registration: ServiceWorkerRegistration | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    navigator.serviceWorker
      .register("/sw-pwa.js")
      .then((reg) => {
        registration = reg;
        // Check de actualización cada 30 min
        intervalId = setInterval(
          () => {
            reg.update().catch(() => undefined);
          },
          30 * 60 * 1000,
        );
      })
      .catch(() => {
        // silent — fallo de registro no debe romper la app
      });

    return () => {
      if (intervalId) clearInterval(intervalId);
      // No unregister al unmount — el SW debe seguir vivo entre renders
      void registration;
    };
  }, []);

  return null;
}

export default PWARegister;
