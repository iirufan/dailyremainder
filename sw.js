// Daily Reminder — offline app shell. Bump CACHE to force phones to pick up new versions.
const CACHE = "daily-reminder-v9";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(()=>{})); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  // Live data + fonts always go to the network.
  if (/alquran\.cloud|open-meteo\.com|fonts\.(googleapis|gstatic)\.com/.test(u.hostname)) return;
  // The page itself: network-first so new versions reach the phone; fall back to cache offline.
  if (e.request.mode === "navigate" || u.pathname.endsWith("/index.html") || u.pathname.endsWith("/")) {
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
    return;
  }
  // Other same-origin assets (icons, and Faruma.ttf once loaded): cache-first, then network.
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => { const cp = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return resp; }).catch(() => null)));
});
// Tapping a reminder (e.g. "Finish Sūrat al-Kahf") focuses or opens the app.
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window" }).then(cs => {
    for (const c of cs) { if ("focus" in c) return c.focus(); }
    if (clients.openWindow) return clients.openWindow("./");
  }));
});
