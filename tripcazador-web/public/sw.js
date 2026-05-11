/* TripCazador Service Worker — SSS136 NO-OP (11 may 2026)
 *
 * BUG SSS135: el kill-switch llamaba a client.navigate(client.url)
 * después de unregister, lo que provocaba un LOOP infinito de recarga
 * cada 2 segundos (recarga → re-registra SW → activate → navigate → ...).
 *
 * Este SW es un NO-OP simple:
 *   - Install: skipWaiting (toma control YA del SW viejo)
 *   - Activate: borra caches + clients.claim + unregister (silent)
 *   - Fetch: pass-through total (no event.respondWith)
 *
 * NO recarga tabs. NO loop. El usuario refresca cuando quiera y verá
 * HTML fresh sin SW activo. Push notifications siguen funcionando.
 */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 1. Borrar todas las caches viejas
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {
        // silent
      }
      // 2. Reclamar control de tabs abiertos (sin recargar)
      try {
        await self.clients.claim();
      } catch (e) {
        // silent
      }
      // 3. Autodesinstalar (silent, sin recargar — el usuario ve HTML cached
      //    en el tab actual pero en el próximo refresh manual recibe fresh).
      try {
        await self.registration.unregister();
      } catch (e) {
        // silent
      }
      // NO client.navigate() — eso causaba LOOP infinito SSS135.
    })(),
  );
});

// Pass-through. Network only. Sin event.respondWith() = browser default.
self.addEventListener("fetch", () => {
  return;
});

// Mantener push notifications + click handlers
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "TripCazador", body: event.data.text() };
  }
  const title = payload.title || "TripCazador";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    data: payload.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((cs) => {
      for (const c of cs) {
        if (c.url === url && "focus" in c) return c.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
