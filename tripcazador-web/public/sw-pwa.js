/* TripCazador Service Worker PWA — SSS425 (23 may 2026)
 *
 * IMPORTANTE:
 * - Distinto al sw.js (que es kill-switch auto-unregister desde SSS136)
 * - NO llama a clients.navigate (causaba LOOP infinito en SSS135)
 * - Solo cachea las últimas deals + sirve /offline en fallos de navigation
 *
 * Activación: solo si window registra explícitamente /sw-pwa.js.
 * Hoy lo hace PWARegister.tsx cuando NEXT_PUBLIC_PWA_ENABLED=1.
 *
 * Estrategia:
 * - install: precache /offline + última copia conocida deals-latest.json
 * - activate: limpia caches viejas (versión cambia con CACHE_NAME)
 * - fetch:
 *   • /api/deals* → network-first con timeout 3s, fallback cache
 *   • /deals-latest.json → cache-first (siempre disponible offline)
 *   • navigation request (mode=navigate) en fallo → /offline
 *   • otros → pass-through
 */
const CACHE_NAME = "tc-pwa-v1";
const PRECACHE_URLS = [
  "/offline",
  "/deals-latest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        // addAll falla atómicamente — usamos add() individual para tolerar errores
        await Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch(() => undefined),
          ),
        );
      } catch (e) {
        // silent — fallo de precache no debe romper instalación
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((k) => k.startsWith("tc-pwa-") && k !== CACHE_NAME)
            .map((k) => caches.delete(k)),
        );
      } catch (e) {
        // silent
      }
      try {
        await self.clients.claim();
      } catch (e) {
        // silent
      }
      // SSS425: NO clients.navigate (SSS135 lección)
    })(),
  );
});

async function networkFirstWithTimeout(request, timeoutMs) {
  const cache = await caches.open(CACHE_NAME);
  const networkPromise = (async () => {
    const res = await fetch(request);
    if (res && res.ok) {
      // Solo cachear GET — no podemos cachear POST/PUT
      if (request.method === "GET") {
        try {
          await cache.put(request, res.clone());
        } catch (e) {
          // silent
        }
      }
    }
    return res;
  })();
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("network timeout")), timeoutMs),
  );
  try {
    return await Promise.race([networkPromise, timeoutPromise]);
  } catch (e) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw e;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    // background refresh
    fetch(request)
      .then((res) => {
        if (res && res.ok && request.method === "GET") {
          cache.put(request, res.clone()).catch(() => undefined);
        }
      })
      .catch(() => undefined);
    return cached;
  }
  const res = await fetch(request);
  if (res && res.ok && request.method === "GET") {
    cache.put(request, res.clone()).catch(() => undefined);
  }
  return res;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo same-origin (no cross-origin third party)
  if (url.origin !== self.location.origin) return;

  // /api/deals* → network-first 3s timeout, fallback cache
  if (url.pathname.startsWith("/api/deals")) {
    event.respondWith(
      networkFirstWithTimeout(request, 3000).catch(() =>
        new Response(JSON.stringify({ deals: [], offline: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    return;
  }

  // /deals-latest.json → cache-first (siempre instantáneo)
  if (url.pathname === "/deals-latest.json") {
    event.respondWith(cacheFirst(request).catch(() => fetch(request)));
    return;
  }

  // Navigation request fallback a /offline cuando falla
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const offline = await cache.match("/offline");
        if (offline) return offline;
        return new Response("Sin conexión", {
          status: 503,
          statusText: "Offline",
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }),
    );
    return;
  }

  // Resto: pass-through default browser
});

// Push notifications (compat con sw.js viejo si llegan a este SW)
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
