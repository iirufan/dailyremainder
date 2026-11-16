// Daily Reminder — offline app shell. Live data (Qur'an, weather, fonts) always goes to the network.
const CACHE = "daily-reminder-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(()=>{})); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  // Always let the network handle live APIs and fonts (don't cache-trap them).
  if (/alquran\.cloud|open-meteo\.com|fonts\.(googleapis|gstatic)\.com/.test(u.hostname)) return;
  // App shell: serve from cache, fall back to network, then to index.html.
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const cp = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return resp;
    }).catch(() => caches.match("./index.html")))
  );
});
