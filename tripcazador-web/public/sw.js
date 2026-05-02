/* TripCazador Service Worker — abr-2026o
 *
 * Estrategia:
 *   - Pre-cache: shell mínimo (/, /deals, /destinos) en el install
 *   - Runtime fetch:
 *       · Documentos HTML (navigate): network-first con timeout 3s, fallback al cache
 *       · /api/* y /api/deals: stale-while-revalidate (rápido + frescura background)
 *       · Imágenes (image/*): cache-first con cap de 50 entries
 *       · /_next/static/*: cache-first inmutable (1 año en Vercel)
 *   - Versioning: bump VERSION para invalidar cache vieja en update
 *
 * NO interceptamos /api/admin/* ni /api/price-alerts (POST) — esas requieren
 * fetch directo siempre.
 */

const VERSION = "tc-v3-2026-04-25";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const IMG_CACHE = `${VERSION}-img`;
const IMG_CACHE_LIMIT = 50;

const PRECACHE_URLS = [
  "/",
  "/deals",
  "/destinos",
  "/site.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((c) => c.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((k) => !k.startsWith(VERSION))
              .map((k) => caches.delete(k)),
          ),
        ),
      self.clients.claim(),
    ]),
  );
});

// Helper: trim cache para imágenes — mantén las N más recientes
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxItems) return;
  const toDelete = keys.slice(0, keys.length - maxItems);
  await Promise.all(toDelete.map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar GET — POST/PUT/DELETE pasan al network sin más.
  if (request.method !== "GET") return;

  // Skip cross-origin (queremos delegar al browser default cache + CSP)
  if (url.origin !== self.location.origin) return;

  // Admin y price-alerts: NO cachear
  if (url.pathname.startsWith("/api/admin")) return;
  if (url.pathname.startsWith("/api/price-alerts")) return;

  // Estrategia 1: navegación HTML — network-first con timeout
  if (request.mode === "navigate") {
    event.respondWith(
      networkFirstWithTimeout(request, 3000).catch(() =>
        caches.match("/").then((m) => m || new Response("offline")),
      ),
    );
    return;
  }

  // Estrategia 2: /_next/static/* — cache-first (inmutable)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  // Estrategia 3: /api/deals* — stale-while-revalidate
  if (url.pathname.startsWith("/api/deals")) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  // Estrategia 4: imágenes — cache-first con LRU cap
  if (request.destination === "image") {
    event.respondWith(
      cacheFirst(request, IMG_CACHE).then((res) => {
        trimCache(IMG_CACHE, IMG_CACHE_LIMIT);
        return res;
      }),
    );
    return;
  }
});

async function networkFirstWithTimeout(request, timeoutMs) {
  const cache = await caches.open(RUNTIME_CACHE);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(async () => {
      const cached = await cache.match(request);
      cached ? resolve(cached) : reject(new Error("timeout"));
    }, timeoutMs);

    fetch(request)
      .then((res) => {
        clearTimeout(timer);
        if (res.ok) cache.put(request, res.clone());
        resolve(res);
      })
      .catch(async (err) => {
        clearTimeout(timer);
        const cached = await cache.match(request);
        cached ? resolve(cached) : reject(err);
      });
  });
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkP = fetch(request).then((res) => {
    if (res.ok) cache.put(request, res.clone());
    return res;
  });
  return cached || networkP;
}

// Mensaje desde la app: skipWaiting on demand (e.g. tras release).
self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// ─── GGG2 (Apr 2026) push notification handlers ────────────────────────────
// Recibe pushes del backend cuando match price-alert. Payload esperado:
// { title, body, url?, icon?, badge?, tag? }. Si no llega payload (heartbeat)
// usamos defaults para no perder permission.
self.addEventListener("push", (event) => {
  let data = { title: "TripCazador", body: "Tienes un nuevo aviso" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch { /* payload no-JSON, default */ }
  const opts = {
    body: data.body,
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-72.png",
    data: { url: data.url || "/deals" },
    tag: data.tag || "tc-alert",
    vibrate: [100, 50, 100],
  };
  event.waitUntil(self.registration.showNotification(data.title, opts));
});

// Click → abrir/focalizar la app en url específica del payload.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/deals";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
      for (const c of cs) {
        if (c.url.includes(self.location.origin)) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
