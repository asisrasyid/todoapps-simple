const CACHE_NAME = "sheetmaster-v1";

const STATIC_ASSETS = [
  "/",
  "/login",
  "/dashboard",
  "/boards",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install: cache static shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - Google Apps Script calls → network only (no cache)
// - _next/static → cache first
// - everything else → network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and Apps Script / external API calls
  if (event.request.method !== "GET") return;
  if (url.hostname.includes("script.google.com")) return;
  if (!url.protocol.startsWith("http")) return;

  // _next/static → network first in dev (chunks have hash-based names so cache is safe in prod,
  // but dev server reuses chunk names without cache-busting — always fetch fresh)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      fetch(event.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else → network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push notifications (server-sent, future use)
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "SheetMaster";
  const options = {
    body: data.body || "You have new activity.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-72.png",
    tag: data.tag || "sheetmaster-push",
    data: { url: data.url || "/dashboard" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click → open or focus app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
