// Bellas Pork City POS: keeps the counter app on the phone so it opens with no signal.
// The Google Sheet (script.google.com) is never cached: records always go to the live Sheet.
var CACHE = "bpc-pos-v2";
var APP = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(APP); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (/script\.google(usercontent)?\.com$/.test(url.hostname)) return; // live data: never cached
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(CACHE).then(function (c) { return c.match(req).then(function (hit) { return hit || fetch(req).then(function (r) { c.put(req, r.clone()); return r; }); }); }));
    return;
  }
  if (url.origin !== location.origin) return;
  // App files: answer from the phone at once, then refresh the copy in the background when online.
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (r) { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
