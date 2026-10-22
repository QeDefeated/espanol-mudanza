// Запуск: состояние → стартовый индекс данных → первый экран → синхронизация, Claude,
// фоновая подгрузка остальных данных и (в GitHub-версии) Service Worker для офлайна.
(function (App) {
  "use strict";
  const { $, esc } = App.util;
  const S = App.S;
  const ui = App.ui;

  // Учёт времени: каждые 5 секунд, пока вкладка видна и человек был активен последние 90 секунд
  function startTimer() {
    let lastAct = Date.now(), ticks = 0;
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach((ev) => window.addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true }));
    setInterval(() => {
      if (document.hidden || Date.now() - lastAct > 90000 || !S.settings.onboarded) return;
      App.state.today().sec += 5;
      if (++ticks % 6 === 0) App.state.save();
      requestAnimationFrame(App.views.today.updateRing);
    }, 5000);
  }

  // Service Worker — только в GitHub-версии (её index.html помечен data-sw); на claude.ai он не работает
  function registerSW() {
    if (!("serviceWorker" in navigator) || window.claude || !document.documentElement.hasAttribute("data-sw")) return;
    let updating = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (updating) location.reload(); });
    const offer = (worker) => {
      if ($(".update-bar")) return;
      const bar = document.createElement("div");
      bar.className = "update-bar";
      bar.setAttribute("role", "status");
      bar.innerHTML = "<span>Доступна новая версия приложения</span>";
      const btn = document.createElement("button");
      btn.className = "btn sm";
      btn.textContent = "Обновить";
      btn.onclick = () => { updating = true; worker.postMessage("skip-waiting"); };
      bar.appendChild(btn);
      document.body.appendChild(bar);
    };
    navigator.serviceWorker.register("sw.js").then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        if (w) w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) offer(w); });
      });
    }).catch(() => { /* без офлайна приложение работает как обычно */ });
  }

  async function boot() {
    App.state.loadLocal();
    App.state.applyTheme();
    try {
      await App.data.loadIndex();
    } catch (e) {
      $("#view").innerHTML = '<div class="empty"><p><b>Не удалось загрузить приложение.</b> Проверьте подключение к интернету и обновите страницу.</p><p class="muted small">' + esc(e.message) + "</p></div>";
      return;
    }
    App.srs.buildCards();
    const h = (location.hash || "").replace("#", "");
    ui.route = App.router.ROUTES.includes(h) ? h : "today";
    App.router.render();
    if (window.performance && performance.mark) performance.mark("app-ready");
    window.addEventListener("hashchange", () => {
      const r = (location.hash || "").replace("#", "");
      if (App.router.ROUTES.includes(r) && r !== ui.route) App.router.go(r);
    });
    App.state.initSync();
    App.ai.initCaps();
    App.data.prefetch();
    startTimer();
    registerSW();
  }

  boot();
})(window.App = window.App || {});
