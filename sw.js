// Service Worker GitHub-версии: офлайн и быстрые повторные визиты.
// Значения в двойных подчёркиваниях подставляет tools/build.js при сборке.
//   shell-*  — оболочка приложения (HTML, CSS, JS, стартовый индекс), кэшируется при установке;
//   data-*   — блоки данных и озвучка, кэшируются при первом обращении и не скачиваются при обновлении кода;
//   fonts-*  — шрифты Google Fonts (показываются из кэша, обновляются в фоне).
const SHELL = "shell-ba50b6b8f2";
const DATA = "data-c108d37a2a";
const FONTS = "fonts-v1";
const PRECACHE = ["index.html","data/index.json","styles.css","verbs.js","js/util.js","js/config.js","js/audiokey.js","js/state.js","js/data.js","js/audio.js","js/ai.js","js/srs.js","js/goals.js","js/achievements.js","js/router.js","js/views/onboarding.js","js/views/today.js","js/views/words.js","js/views/cards.js","js/views/grammar.js","js/views/practice.js","js/views/dialogs.js","js/views/chat.js","js/views/progress.js","js/events.js","js/main.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)));
});

// Сразу берём под управление открытую страницу — данные, которые она подгрузит фоном, попадут в кэш уже при первом визите
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => ![SHELL, DATA, FONTS].includes(k)).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Новая версия ждёт, пока пользователь не нажмёт «Обновить», — чтобы не подменять код посреди занятия
self.addEventListener("message", (e) => { if (e.data === "skip-waiting") self.skipWaiting(); });

function cacheFirst(cacheName, req) {
  return caches.open(cacheName).then((cache) => cache.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  })));
}
function staleWhileRevalidate(cacheName, req) {
  return caches.open(cacheName).then((cache) => cache.match(req).then((hit) => {
    const net = fetch(req).then((res) => { if (res.ok || res.type === "opaque") cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === "navigate") {
      e.respondWith(caches.open(SHELL).then((c) => c.match("index.html")).then((hit) => hit || fetch(req)));
      return;
    }
    const path = url.pathname.slice(new URL(self.registration.scope).pathname.length);
    if (PRECACHE.includes(path)) { e.respondWith(cacheFirst(SHELL, req)); return; }
    if (path.startsWith("data/") || path.startsWith("audio/")) { e.respondWith(cacheFirst(DATA, req)); return; }
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") e.respondWith(staleWhileRevalidate(FONTS, req));
});
