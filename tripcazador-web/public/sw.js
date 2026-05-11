/* TripCazador Service Worker — SSS135 KILL SWITCH (11 may 2026)
 *
 * El SW v4-2026-05-04 estaba cacheando HTML con error boundary que
 * sobrevivía a múltiples deploys nuevos del frontend. Como result:
 * los usuarios veían "Algo salió mal en el radar" en la home aunque
 * el server devolviera HTML correcto.
 *
 * Este SW kill-switch:
 *   1. Borra TODAS las caches al instalarse
 *   2. Llama a self.skipWaiting() + clients.claim() para activarse YA
 *   3. Hace fetches PASS-THROUGH (no cache, network direct)
 *   4. Tras la primera activación, se autodesinstala (registration.unregister())
 *   5. Recarga los tabs abiertos para que reciban HTML fresh sin SW
 *
 * Resultado: la próxima vez que un user visite, su SW viejo se
 * reemplaza por este, este borra todo, recarga el tab, y luego se
 * desinstala — el site queda sin SW.
 */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 1. Borrar todas las caches sin excepción
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {
        // silent
      }
      // 2. Reclamar control de todos los tabs abiertos.
      await self.clients.claim();
      // 3. Autodesinstalar.
      try {
        await self.registration.unregister();
      } catch (e) {
        // silent
      }
      // 4. Recargar todos los clients para que reciban HTML fresh sin SW.
      try {
        const clientList = await self.clients.matchAll({ type: "window" });
        for (const client of clientList) {
          try {
            client.navigate(client.url);
          } catch (e) {
            // silent
          }
        }
      } catch (e) {
        // silent
      }
    })(),
  );
});

// Pass-through ABSOLUTO. Network only, sin cache.
// No llamamos a event.respondWith() para que el browser use el default.
self.addEventListener("fetch", () => {
  return;
});

// Mantener push notifications + click handlers para no romper PWA web-push
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
