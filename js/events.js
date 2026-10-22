// Общие обработчики событий: один слушатель на документ для каждого типа события.
// Экраны не вешают свои слушатели — они регистрируют функции в App.act / App.forms / App.keys / App.inputs / App.changes.
(function (App) {
  "use strict";
  const { $ } = App.util;
  const S = App.S;

  // Клик по [data-act] вызывает App.act[имя](элемент, событие)
  document.addEventListener("click", (e) => {
    const link = e.target.closest(".nav-link");
    if (link) { e.preventDefault(); if (S.settings.onboarded) App.router.go(link.dataset.route); return; }
    const b = e.target.closest("[data-act]");
    if (!b || b.tagName === "SELECT") return;
    if (b.tagName === "INPUT" && b.type === "checkbox") return;
    const fn = App.act[b.dataset.act];
    if (fn) { if (b.tagName === "A") e.preventDefault(); fn(b, e); }
  });

  // Флажки с data-act, select/поля по id и настройки с data-set="ключ"
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.matches("input[type=checkbox][data-act]")) { const fn = App.act[t.dataset.act]; if (fn) fn(t, e); return; }
    if (t.id && App.changes[t.id]) { App.changes[t.id](t, e); return; }
    const key = t.dataset.set;
    if (!key) return;
    let val = t.type === "checkbox" ? t.checked : t.value;
    if (key === "newPerDay") val = Math.max(0, Math.min(50, parseInt(val, 10) || 0));
    if (key === "rate") val = Number(val);
    S.settings[key] = val;
    if (key === "theme") App.state.applyTheme();
    App.state.save();
    if (key === "country" || key === "voice") App.router.render();
  });

  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.set === "rate") { const v = $("#rateVal"); if (v) v.textContent = Number(t.value).toFixed(2); }
    if (t.id && App.inputs[t.id]) App.inputs[t.id](t, e);
  });

  document.addEventListener("submit", (e) => {
    const f = e.target.closest("form[data-form]");
    if (!f) return;
    e.preventDefault();
    const fn = App.forms[f.dataset.form];
    if (fn) fn(f, e);
  });

  // Клавиатура: Enter отправляет чат и ответ «своими словами»; остальное решают обработчики экранов по очереди
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    const typing = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
    if (t && (t.id === "chatIn" || t.id === "respIn") && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); t.form.requestSubmit(); return; }
    for (const handler of App.keys) if (handler(e, typing)) return;
  });

  // Испанские буквы с экранной клавиатуры вставляются в последнее активное поле
  let lastInput = null;
  const isField = (el) => el && el.matches && el.matches("input[type=text], input[type=search], textarea");
  document.addEventListener("focusin", (e) => { if (isField(e.target)) lastInput = e.target; });
  document.addEventListener("pointerdown", (e) => {
    const k = e.target.closest(".key");
    if (!k) return;
    e.preventDefault();
    const el = isField(document.activeElement) ? document.activeElement : lastInput;
    if (!el || !document.contains(el) || el.disabled) return;
    const s = el.selectionStart ?? el.value.length, en = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, s) + k.dataset.key + el.value.slice(en);
    el.focus();
    el.setSelectionRange(s + 1, s + 1);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
})(window.App = window.App || {});
