import { NextResponse } from "next/server";

/**
 * SSS138 — /reset endpoint (11 may 2026)
 *
 * Ruta de emergencia para usuarios atascados con HTML cacheado por el SW
 * v4-2026-05-04 que mostraba "Algo salió mal en el radar" pegado en pantalla
 * aunque el server ya devuelve HTML correcto.
 *
 * Estrategia:
 *   1. Header Clear-Site-Data: dice al browser que borre cache + cookies +
 *      storage + executionContexts (SW + IndexedDB + localStorage).
 *      Soporte: Chrome 76+, Firefox 63+, Edge 79+, Safari 16.4+.
 *   2. HTML mínimo que tras 800ms hace location.replace("/") para llevarlo
 *      a la home con storage limpio. JS fallback en caso de que el header
 *      no funcione en algún browser.
 *
 * El usuario visita /reset UNA sola vez y queda curado.
 */

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Reiniciando TripCazador...</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
      background: #0a0f1e;
      color: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 1rem;
    }
    .panel { max-width: 28rem; }
    h1 { color: #fbbf24; font-size: 1.5rem; margin: 0 0 0.5rem; }
    p { color: #d1d5db; margin: 0.25rem 0; }
    .spinner {
      width: 32px; height: 32px;
      border: 3px solid rgba(251, 191, 36, 0.2);
      border-top-color: #fbbf24;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 1rem auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    a { color: #fbbf24; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="panel">
    <h1>Reiniciando TripCazador</h1>
    <div class="spinner" aria-hidden="true"></div>
    <p>Limpiando cache del navegador...</p>
    <p style="font-size: 0.875rem; color: #9ca3af; margin-top: 1rem;">
      Si no te redirige automáticamente, <a href="/">haz clic aquí</a>.
    </p>
  </div>
  <script>
    (async function() {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister().catch(()=>{})));
        }
      } catch(e) {}
      try {
        if (typeof caches !== 'undefined') {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k).catch(()=>{})));
        }
      } catch(e) {}
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch(e) {}
      setTimeout(function() {
        window.location.replace('/?fresh=' + Date.now());
      }, 800);
    })();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Clear-Site-Data: header oficial. Borra todo el storage del browser
      // para este origen. SW + IDB + localStorage + cookies + HTTP cache.
      "Clear-Site-Data": '"cache", "cookies", "storage", "executionContexts"',
      // Anti-cache headers reforzados
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
