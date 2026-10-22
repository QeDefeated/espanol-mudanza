// Общие утилиты: DOM, даты, строки, мини-markdown, уведомления.
// Все модули приложения — обычные скрипты, которые кладут своё API в window.App.
(function (App) {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d = new Date()) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const addDays = (key, n) => { const [y, m, d] = key.split("-").map(Number); return dayKey(new Date(y, m - 1, d + n)); };
  function plural(n, one, few, many) {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  }
  const stripAcc = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC");
  const norm = (s) => String(s).toLowerCase().replace(/[¿?¡!.,;:"«»()…—–]/g, " ").replace(/\s+/g, " ").trim();
  const ARTICLE = /^(el|la|los|las|un|una|unos|unas) /;
  // Позиция id в списке приоритетов (чего нет в списке — в конец)
  const rank = (order, id) => { const i = order.indexOf(id); return i < 0 ? 999 : i; };
  function interleave(a, b) { const out = []; for (let i = 0; i < Math.max(a.length, b.length); i++) { if (i < a.length) out.push(a[i]); if (i < b.length) out.push(b[i]); } return out; }
  const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 300));

  // Лёгкий markdown для ответов Claude: экранирование, **жирный**, списки
  function md(text) {
    const lines = esc(text).split(/\n/);
    let html = "", list = false;
    for (let ln of lines) {
      ln = ln.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|\s)\*(\S.+?)\*(?=\s|$|[.,;:!?])/g, "$1<i>$2</i>");
      const m = ln.match(/^\s*(?:[-•*]|\d+\.)\s+(.*)$/);
      if (m) { if (!list) { html += "<ul>"; list = true; } html += "<li>" + m[1] + "</li>"; continue; }
      if (list) { html += "</ul>"; list = false; }
      if (ln.trim()) html += "<p>" + ln.replace(/^#+\s*/, "") + "</p>";
    }
    if (list) html += "</ul>";
    return html;
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3400);
  }

  const keysHTML = () => '<div class="keys" aria-label="Испанские буквы">' + ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"].map((k) => '<button type="button" class="key" data-key="' + k + '" tabindex="-1">' + k + "</button>").join("") + "</div>";
  const loadingHTML = (text) => '<div class="loading"><i></i>' + esc(text || "Загружаю…") + "</div>";
  const stat = (v, l) => '<div class="stat"><b>' + esc(v) + "</b><span>" + esc(l) + "</span></div>";

  const ICON = {
    say: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    slow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>',
    medal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="15" r="6"/><path d="M8.5 9.5L6 3h4l2 4 2-4h4l-2.5 6.5"/><path d="M12 12.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z"/></svg>'
  };

  App.util = {
    $, $$, esc, shuffle, pick, pad, dayKey, addDays, plural, stripAcc, norm, ARTICLE, rank, interleave, idle, md, toast,
    keysHTML, loadingHTML, stat, ICON,
    pct: (a, b) => (b ? Math.round(a / b * 100) : 0),
    DIAS: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
    MESES: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
    WEEK_RU: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
  };
})(window.App = window.App || {});
