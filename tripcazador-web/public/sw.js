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

// SSS52: bump version para invalidar SW cacheado con bug black-screen
const VERSION = "tc-v4-2026-05-04-fix-blackscreen";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const IMG_CACHE = `${VERSION}-img`;
const IMG_CACHE_LIMIT = 50;

const PRECACHE_URLS = [
  "/",
  "/deals",
  "/destinos",
  "/blog",
  "/offline.html",
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
  // SSS42: fallback a /offline.html (página rica con favoritos cache)
  if (request.mode === "navigate") {
    event.respondWith(
      networkFirstWithTimeout(request, 3000).catch(() =>
        caches.match("/offline.html").then(
          (m) => m || caches.match("/").then((r) => r || new Response("offline"))
        ),
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
  // SSS52 (May 2026): BUG FIX — antes el timeout rejectaba aunque la red
  // todavía no hubiera respondido, lo que disparaba el fallback "offline"
  // y mostraba pantalla negra en primera visita (sin caché todavía).
  // Ahora: solo usamos timeout si hay caché disponible. Sin caché, esperamos
  // siempre a la red (que tampoco va a tardar 3s típicamente).
  const cache = await caches.open(RUNTIME_CACHE);
  const networkP = fetch(request).then((res) => {
    if (res.ok) cache.put(request, res.clone());
    return res;
  });

  const cached = await cache.match(request);

  if (!cached) {
    // Sin caché → confía en la red (no race, evita el black-screen bug)
    return networkP;
  }

  // Con caché → race red vs timeout que sirve caché stale como fallback rápido
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(cached), timeoutMs);
    networkP
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(cached);
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
  // SSS42: action buttons + image (más conversión, pattern WhatsApp/Instagram)
  const opts = {
    body: data.body,
    icon: data.icon || "/android-chrome-192x192.png",
    badge: data.badge || "/favicon-32x32.png",
    image: data.image,                 // Hero image (1080×567 ideal)
    data: { url: data.url || "/deals", dealId: data.dealId },
    tag: data.tag || "tc-alert",
    vibrate: [100, 50, 100, 50, 200],
    requireInteraction: data.urgent === true,  // Críticos no se auto-cierran
    actions: [
      { action: "view",   title: "Ver chollo" },
      { action: "snooze", title: "Recordar en 1h" },
    ],
  };
  event.waitUntil(self.registration.showNotification(data.title, opts));
});

// Click → manejar action buttons + abrir/focalizar la app.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const action = event.action;

  // Action: snooze → reprograma para dentro de 1h via setTimeout en el SW
  // (mejor que postMessage al cliente porque puede no estar abierto)
  if (action === "snooze") {
    event.waitUntil(
      // Re-mostrar después de 1h. SW no garantiza vivir 1h pero registramos intent.
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification("Recordatorio: " + (event.notification.title || "Chollo"), {
            body: "Sigue activo — comprueba ahora",
            icon: "/android-chrome-192x192.png",
            data,
            tag: data.tag || "tc-alert-snooze",
          });
          resolve();
        }, 3600 * 1000);
      })
    );
    return;
  }

  // Default + action "view": abrir la URL
  const url = data.url || "/deals";
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

// SSS42: notificationclose → tracking opt-out signal (analítica)
self.addEventListener("notificationclose", (event) => {
  const data = event.notification.data || {};
  // Best-effort beacon — no bloquea si el server no responde
  if (data.dealId && self.fetch) {
    fetch("/api/track?event=push_closed&dealId=" + encodeURIComponent(data.dealId), {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }
});
