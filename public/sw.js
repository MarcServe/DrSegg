/* Minimal service worker so Chromium can treat the app as installable (with manifest + HTTPS). */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", () => {
  // Network-first for all requests; this handler satisfies installability checks.
});
