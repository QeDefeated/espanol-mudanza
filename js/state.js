// Состояние ученика: прогресс и настройки. Хранится в localStorage,
// на claude.ai дополнительно синхронизируется с аккаунтом (capability db).
(function (App) {
  "use strict";
  const { $, dayKey } = App.util;

  const KEY = "es-mudanza-v1";
  function defaults() {
    return {
      v: 1, updatedAt: 0,
      settings: {
        country: "MX", minutes: 30, newPerDay: 12, level: "A1", dir: "mixed", autoplay: true, rate: 0.9,
        voice: "", soft: true, conjTenses: ["pres"], conjSet: "top", decksOff: [],
        onboarded: false, focus: [], planMode: "full", theme: "auto"
      },
      cards: {}, custom: [], days: {}, lessons: {}, dialogs: {}, mistakes: [], stats: { ans: 0, ok: 0 },
      skip: {}, dlgLvl: {}, ach: {}
    };
  }
  function merge(x) {
    const d = defaults();
    if (!x || typeof x !== "object") return d;
    const o = Object.assign(d, x);
    o.settings = Object.assign(defaults().settings, x.settings || {});
    for (const k of ["cards", "days", "lessons", "dialogs", "stats", "skip", "dlgLvl", "ach"]) if (!o[k] || typeof o[k] !== "object" || Array.isArray(o[k])) o[k] = defaults()[k];
    for (const k of ["custom", "mistakes"]) if (!Array.isArray(o[k])) o[k] = [];
    if (!Array.isArray(o.settings.focus)) o.settings.focus = [];
    return o;
  }

  // Объект состояния один на всё время работы: при загрузке копии или синхронизации
  // меняется его содержимое, а не ссылка — модули могут хранить App.S у себя.
  const S = App.S = defaults();
  let version = 0;
  const bump = () => { version++; };
  function replace(next) {
    for (const k of Object.keys(S)) delete S[k];
    Object.assign(S, next);
    bump();
  }
  function loadLocal() {
    try { const raw = localStorage.getItem(KEY); if (raw) replace(merge(JSON.parse(raw))); } catch (e) { /* хранилище недоступно */ }
  }
  function saveLocal() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* без локальной копии */ } }
  function save() {
    S.updatedAt = Date.now();
    bump();
    if (App.ach) App.ach.check();
    saveLocal();
    Sync.soon();
  }
  function today() {
    const k = dayKey();
    if (!S.days[k]) S.days[k] = { sec: 0, rev: 0, nw: 0, ok: 0, bad: 0, prac: 0, lesson: 0, dialog: 0, chat: 0 };
    return S.days[k];
  }
  function applyTheme() {
    const t = S.settings.theme;
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }
  // После того как состояние пришло извне (облако, копия), пересобираем карточки и экран
  function afterExternalChange() {
    App.srs.buildCards();
    applyTheme();
    const ui = App.ui;
    if (ui && !ui.Cards.active && !ui.P.active) App.router.render();
  }

  // ---------------------------------------------------------------- синхронизация (db на claude.ai)
  const Sync = {
    ref: null, writing: false, dirty: false, timer: null, state: "local",
    set(st) {
      this.state = st;
      const el = $("#sync");
      if (!el) return;
      el.dataset.s = st;
      el.querySelector("span").textContent = st === "cloud" ? "Прогресс сохраняется в вашем аккаунте Claude"
        : st === "error" ? "Не удалось сохранить в аккаунт, копия есть в браузере" : "Прогресс хранится в этом браузере";
    },
    soon(delay) {
      if (!this.ref) return;
      this.dirty = true;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.push(), delay == null ? 6000 : delay);
    },
    async push() {
      if (!this.ref || !this.dirty) return;
      if (this.writing) { this.timer = setTimeout(() => this.push(), 1500); return; }
      this.writing = true; this.dirty = false;
      try {
        await this.ref.set({ json: JSON.stringify(S), updatedAt: S.updatedAt });
        this.set("cloud");
      } catch (e) {
        const code = e && e.code;
        if (code === "unavailable" || code === "resource_exhausted") {
          this.dirty = true;
          this.timer = setTimeout(() => this.push(), 8000 + Math.random() * 4000);
        } else {
          this.ref = null;
          this.set(code === "quota_exceeded" ? "error" : "local");
        }
      } finally { this.writing = false; }
    },
    async pull() {
      if (!this.ref || this.dirty || this.writing) return false;
      try {
        const snap = await this.ref.get();
        if (!snap.exists) return false;
        const remote = merge(JSON.parse(snap.data().json));
        if ((remote.updatedAt || 0) > (S.updatedAt || 0)) { replace(remote); saveLocal(); return true; }
        if ((S.updatedAt || 0) > (remote.updatedAt || 0)) this.soon(500);
      } catch (e) { /* остаёмся на локальной копии */ }
      return false;
    }
  };
  async function initSync() {
    const cl = window.claude;
    if (!cl || typeof cl.use !== "function") return;
    try {
      const [db, user] = await Promise.all([cl.use("db"), cl.use("user")]);
      if (!db || !user) return;
      const id = await user.id();
      if (!id) return;
      Sync.ref = db.doc("data/users/" + id + "/progress");
      const snap = await Sync.ref.get();
      const body = snap.exists ? snap.data() : null;
      if (body && typeof body.json === "string") {
        const remote = merge(JSON.parse(body.json));
        if ((remote.updatedAt || 0) > (S.updatedAt || 0)) { replace(remote); saveLocal(); afterExternalChange(); }
        else if (S.updatedAt) Sync.soon(300);
      } else if (S.updatedAt) Sync.soon(300);
      Sync.set("cloud");
    } catch (e) { Sync.ref = null; Sync.set("local"); }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { clearTimeout(Sync.timer); Sync.push(); }
    else Sync.pull().then((changed) => { if (changed) afterExternalChange(); });
  });

  App.state = { KEY, defaults, merge, replace, loadLocal, saveLocal, save, today, applyTheme, afterExternalChange, Sync, initSync, bump, version: () => version };
})(window.App = window.App || {});
