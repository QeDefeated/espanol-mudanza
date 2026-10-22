// Claude (capability sample) и сохранение файлов (downloads) — работают, когда приложение открыто на claude.ai.
// Блоки интерфейса, зависящие от Claude, регистрируются в App.slots и перерисовываются, когда станет известно, доступен ли он.
(function (App) {
  "use strict";
  const { $, $$, esc, md } = App.util;

  const AI = { fn: null, ready: false };
  const DL = { fn: null };
  App.slots = {};

  async function initCaps() {
    const cl = window.claude;
    if (!cl || typeof cl.use !== "function") { AI.ready = true; refreshSlots(); return; }
    try { AI.fn = await cl.use("sample"); } catch (e) { AI.fn = null; }
    AI.ready = true;
    refreshSlots();
    try { DL.fn = await cl.use("downloads"); } catch (e) { DL.fn = null; }
    $$("[data-needs-dl]").forEach((el) => { el.hidden = !DL.fn; });
  }
  function aiError(e) {
    const code = e && e.code;
    if (["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(code)) {
      AI.fn = null;
      setTimeout(refreshSlots, 0);
      return "Доступ к Claude для этой страницы не разрешён. Остальные функции работают как обычно.";
    }
    if (code === "cancelled") return "";
    if (code === "rate_limited") return "Слишком много запросов или исчерпан лимит Claude. Попробуйте чуть позже.";
    if (code === "session_expired") return "Нужно снова войти в claude.ai.";
    if (code === "invalid_json") return "Claude ответил в неожиданном формате. Попробуйте ещё раз.";
    if (code === "refused" || code === "empty_completion") return "Claude не смог ответить на это сообщение. Попробуйте переформулировать.";
    return "Не удалось связаться с Claude. Попробуйте ещё раз.";
  }
  function aiNote() {
    if (!AI.ready) return '<p class="muted small">Подключаю Claude…</p>';
    return '<p class="muted small">Эта функция работает, когда приложение открыто на claude.ai. Всё остальное доступно и без неё.</p>';
  }
  function refreshSlots() {
    const draftEl = $("#chatIn"), draft = draftEl ? draftEl.value : "";
    $$("[data-ai-slot]").forEach((el) => {
      const fn = App.slots[el.dataset.aiSlot];
      if (fn) el.innerHTML = fn(el);
    });
    const ta = $("#chatIn");
    if (ta && draft && !ta.value) ta.value = draft;
  }
  async function streamInto(el, prompt, opts) {
    if (!AI.fn) { el.innerHTML = aiNote(); return null; }
    el.innerHTML = '<p class="typing">Claude думает…</p>';
    try {
      const res = await AI.fn(prompt, Object.assign({ onText: ({ text }) => { el.innerHTML = md(text); } }, opts || {}));
      el.innerHTML = md(res.text) + (res.truncated ? '<p class="muted small">Ответ оборван по длине.</p>' : "");
      return res.text;
    } catch (e) {
      const msg = aiError(e);
      el.innerHTML = (e && e.text ? md(e.text) : "") + (msg ? '<p class="muted small">' + esc(msg) + "</p>" : "");
      return null;
    }
  }

  App.ai = { AI, DL, initCaps, aiError, aiNote, refreshSlots, streamInto };
})(window.App = window.App || {});
