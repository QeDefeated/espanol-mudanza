// Маршруты (#today, #words …), состояние интерфейса и реестры, куда экраны регистрируют
// свои обработчики. Экран — объект App.views[имя] = { needs(sub), render(sub), after(sub) }:
// needs перечисляет блоки данных, без которых экран не нарисовать (пока они грузятся, виден индикатор).
(function (App) {
  "use strict";
  const { $, $$, loadingHTML } = App.util;
  const S = App.S;

  const ROUTES = ["today", "words", "grammar", "practice", "talk", "progress"];
  App.views = {};
  // Реестры обработчиков: data-act="…", data-form="…", клавиатура, поля ввода и select
  App.act = {};
  App.forms = {};
  App.keys = [];
  App.inputs = {};
  App.changes = {};

  App.ui = {
    route: "today",
    UI: { deck: null, pics: null, picHide: false, lesson: null, talk: { mode: "list", id: null }, confirmReset: false, gen: null, quiz: {}, search: "", ob: null, prefill: null },
    Cards: { active: false, queue: [], pos: 0, shown: false, done: 0, again: 0, deck: null, pics: false, hint: false, front: "es" },
    P: { active: false, kind: null, items: [], i: 0, ok: 0, answered: false, wrong: [], built: [], dialog: null },
    Chat: { scenario: "free", turns: [], msgs: [], busy: false, ctl: null, hints: null, hintBusy: false },
    Dlg: { hideMine: false, showTr: false, playing: -1, revealed: new Set(), resp: null }
  };
  const ui = App.ui;

  function viewKey() {
    const { UI, Cards, P } = ui;
    if (!S.settings.onboarded) return ["onboarding"];
    if (Cards.active) return ["cards"];
    if (P.active) return ["practice", "session"];
    switch (ui.route) {
      case "words": return ["words", UI.deck ? "deck" : UI.pics ? "pics" : "list"];
      case "grammar": return ["grammar", UI.lesson ? "lesson" : "list"];
      case "practice": return ["practice", "home"];
      case "talk": return UI.talk.mode === "chat" ? ["chat"] : ["dialogs", UI.talk.mode === "dialog" ? "dialog" : "list"];
      case "progress": return ["progress"];
      default: return ["today"];
    }
  }

  let token = 0;
  function render() {
    $$(".nav-link").forEach((a) => { if (a.dataset.route === ui.route && S.settings.onboarded) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    const [name, sub] = viewKey();
    const v = App.views[name];
    const t = ++token;
    const miss = App.data.missing(v.needs ? v.needs(sub) : []);
    const box = $("#view");
    if (miss.length) {
      box.innerHTML = loadingHTML();
      App.data.ensure(miss).then(
        () => { if (t === token) render(); },
        () => { if (t === token) box.innerHTML = '<div class="empty"><p><b>Не удалось загрузить данные.</b> Проверьте подключение к интернету и попробуйте ещё раз.</p><button class="btn sm" data-act="retry">Повторить</button></div>'; }
      );
      return;
    }
    box.innerHTML = v.render(sub);
    afterRender(v, sub);
  }
  function afterRender(v, sub) {
    App.ai.refreshSlots();
    $$("[data-needs-dl]").forEach((el) => { el.hidden = !App.ai.DL.fn; });
    const af = $("[data-autofocus]");
    if (af) setTimeout(() => af.focus({ preventScroll: true }), 30);
    if (v.after) v.after(sub);
  }
  function syncHash() { try { if (location.hash !== "#" + ui.route) history.replaceState(null, "", "#" + ui.route); } catch (e) { /* адрес не меняется */ } }
  function go(r, keepSub) {
    if (!ROUTES.includes(r)) r = "today";
    ui.route = r;
    if (!keepSub) {
      if (r === "words") { ui.UI.deck = null; ui.UI.pics = null; }
      if (r === "grammar") ui.UI.lesson = null;
      if (r === "talk") ui.UI.talk = { mode: "list", id: null };
    }
    ui.Cards.active = false; ui.P.active = false; ui.Dlg.resp = null;
    syncHash();
    App.audio.stop(); ui.Dlg.playing = -1;
    render();
    window.scrollTo(0, 0);
  }
  // Переход в раздел без сброса подэкрана (например, сразу в урок или тему)
  function open(r) {
    ui.route = r;
    ui.Cards.active = false; ui.P.active = false;
    syncHash();
  }

  App.act.go = (b) => go(b.dataset.arg);
  App.act.retry = () => render();

  App.router = { ROUTES, render, go, open, syncHash };
})(window.App = window.App || {});
