// Разговор с Claude: ролевая сцена с исправлением ошибок и подсказкой «Подскажи, что сказать».
(function (App) {
  "use strict";
  const { $, esc, md, norm, keysHTML } = App.util;
  const S = App.S;
  const D = App.D;
  const ui = App.ui;
  const Chat = ui.Chat;
  const { sayBtn } = App.audio;

  function scenarios() {
    return [{ id: "free", title: "Свободный разговор", role: "дружелюбный местный житель, с которым ученик только что познакомился", desc: "знакомство и разговор о жизни, переезде, работе и городе" }]
      .concat(D.DIALOGS.map((d) => ({ id: d.id, title: d.title, role: d.role, desc: d.title + " (" + d.place + ")" })));
  }
  const scenario = () => scenarios().find((s) => s.id === Chat.scenario) || scenarios()[0];
  function rules(sc) {
    const c = App.cfg.country(), lv = S.settings.level;
    return "Ты — партнёр по разговорной практике испанского. Ученик — русскоязычный взрослый, уровень примерно " + lv + ", переезжает жить в страну: " + c.ru + ".\n" +
      "Сцена: " + sc.desc + ". Твоя роль: " + sc.role + ". Ученик играет самого себя.\n" +
      "Правила:\n- Говори как житель страны " + c.es + ": местная лексика и обороты" + (c.voseo ? ", voseo (vos tenés, vos sos)" : "") + "; во множественном числе — ustedes, не vosotros.\n" +
      "- Реплика: 1–3 коротких предложения, лексика уровня " + lv + ". Двигай сцену: реагируй на ответы и задавай вопросы, чтобы ученику было что сказать.\n" +
      "- Если ученик пишет по-русски или смешивает языки, продолжай сцену по-испански, а в поле better покажи, как сказать его мысль по-испански.\n" +
      "- Исправляй только реальные ошибки ПОСЛЕДНЕГО сообщения ученика (грамматика, выбор слова, согласование, пропущенные ударения). Пояснения — по-русски, одной фразой.\n" +
      'Ответь только JSON-объектом: {"reply":"твоя реплика по-испански","translation":"перевод реплики на русский","corrections":[{"wrong":"фрагмент ученика","right":"правильно","why":"пояснение по-русски"}],"better":"естественная версия всей фразы ученика по-испански или пустая строка"}\n' +
      "Для первой реплики сцены corrections — пустой массив, better — пустая строка.";
  }
  function render() {
    return '<div class="row"><button class="btn quiet sm" data-act="back-talk">← Диалоги</button></div>' +
      '<header class="page-head"><div><h1>Разговор с Claude</h1><p class="sub">Conversación · ' + esc(App.cfg.country().es) + "</p></div></header>" +
      '<section class="panel stack"><div class="grid-2"><label class="field">Сцена<select id="chatScenario" data-act="chat-scenario">' + scenarios().map((s) => '<option value="' + s.id + '"' + (s.id === Chat.scenario ? " selected" : "") + ">" + esc(s.title) + "</option>").join("") + "</select></label>" +
      '<div class="stack" style="align-content:end"><p class="muted small">Уровень ' + esc(S.settings.level) + ", страна: " + esc(App.cfg.country().ru) + ". Поменять можно в «Прогрессе».</p></div></div></section>" +
      '<div data-ai-slot="chat"></div>';
  }
  function body() {
    const { AI, aiNote } = App.ai;
    if (!AI.fn) return '<section class="panel">' + aiNote() + "</section>";
    let html = '<section class="chat-box lines" id="chatLog">';
    if (!Chat.msgs.length && !Chat.busy) html += '<div class="panel stack"><p>Claude начнёт сцену первым. Отвечайте по-испански; если не знаете слова — пишите по-русски или нажмите «Подскажи, что сказать».</p><div class="row"><button class="btn" data-act="chat-begin">Начать сцену</button></div></div>';
    Chat.msgs.forEach((m, i) => {
      if (m.who === "ai") {
        html += '<div class="line">' + sayBtn(m.es) + '<div class="bubble"><span class="who">Claude</span><p class="es">' + esc(m.es) + '</p><p class="tr"' + (m.showTr ? "" : " hidden") + ">" + esc(m.ru) + '</p><button class="btn quiet sm" data-act="chat-tr" data-arg="' + i + '" style="justify-self:start;padding-inline:0">' + (m.showTr ? "Скрыть перевод" : "Перевод") + "</button></div></div>";
        return;
      }
      html += '<div class="line me"><div class="bubble"><span class="who">Вы</span><p class="es">' + esc(m.es) + "</p></div></div>";
      if (m.corr || m.better) {
        html += '<div class="corr" style="justify-self:end;max-width:85%">' +
          (m.corr && m.corr.length ? m.corr.map((c) => '<div><span class="w">' + esc(c.wrong) + '</span> → <span class="r">' + esc(c.right) + '</span><br><span class="muted">' + esc(c.why) + "</span></div>").join("") : '<div class="r" style="font-family:var(--f-body)">Без ошибок ✓</div>') +
          (m.better ? '<div><span class="muted">Естественнее:</span> <span class="es">' + esc(m.better) + "</span> " + sayBtn(m.better) + "</div>" : "") +
          (m.deep ? "" : '<div><button class="btn quiet sm" data-act="chat-deep" data-arg="' + i + '" style="padding-inline:0">Подробный разбор</button></div>') + '<div class="ai-text" id="deep' + i + '">' + (m.deep ? md(m.deep) : "") + "</div></div>";
      }
    });
    if (Chat.busy) html += '<div class="line"><span></span><div class="bubble"><p class="typing">Claude печатает…</p></div></div>';
    if (Chat.error) html += '<p class="muted small">' + esc(Chat.error) + "</p>";
    html += "</section>";
    if (Chat.msgs.length) {
      const hints = Chat.hintBusy ? '<p class="typing">Подбираю варианты…</p>' : Chat.hints && Chat.hints.length
        ? '<div class="hint-chips">' + Chat.hints.map((h, k) => '<button type="button" class="hint" data-act="chat-hint-use" data-arg="' + k + '"><span class="es">' + esc(h.es) + '</span><span class="muted small">' + esc(h.ru) + "</span></button>").join("") + "</div>" : "";
      html += '<form class="stack" data-form="chat">' + hints + '<div class="chat-input"><textarea id="chatIn" lang="es" placeholder="Ваш ответ по-испански… (Enter — отправить, Shift+Enter — новая строка)"' + (Chat.busy ? " disabled" : "") + ' data-autofocus></textarea><button class="btn"' + (Chat.busy ? " disabled" : "") + ">Отправить</button></div>" + keysHTML() +
        '<div class="row"><button type="button" class="btn ghost sm" data-act="chat-hint"' + (Chat.busy || Chat.hintBusy ? " disabled" : "") + '>Подскажи, что сказать</button><button type="button" class="btn quiet sm" data-act="chat-reset">Начать сцену заново</button></div></form>';
    }
    return html;
  }
  const inChat = () => ui.route === "talk" && ui.UI.talk.mode === "chat";
  function focusInput() {
    const ta = $("#chatIn");
    if (ta && !ta.disabled) ta.focus({ preventScroll: true });
    const log = $("#chatLog");
    if (log && log.lastElementChild) log.lastElementChild.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  async function send(text) {
    const { AI, aiError, refreshSlots } = App.ai;
    if (!AI.fn || Chat.busy) return;
    const sc = scenario();
    if (text) { Chat.msgs.push({ who: "me", es: text }); Chat.turns.push({ role: "user", content: text }); App.state.today().chat++; }
    Chat.busy = true; Chat.error = ""; Chat.hints = null;
    refreshSlots(); focusInput();
    const input = [{ role: "user", content: rules(sc) }, { role: "user", content: "Начни сцену своей первой репликой." }].concat(Chat.turns.slice(-16));
    if (input[input.length - 1].role !== "user") input.push({ role: "user", content: "Продолжай." });
    try {
      Chat.ctl = new AbortController();
      const res = await AI.fn.json(input, { modelTier: "quick", cache: false, signal: Chat.ctl.signal });
      const reply = res && typeof res.reply === "string" ? res.reply.trim() : "";
      if (!reply) throw { code: "invalid_json" };
      if (text) {
        const me = Chat.msgs[Chat.msgs.length - 1];
        me.corr = Array.isArray(res.corrections) ? res.corrections.filter((c) => c && c.wrong && c.right).map((c) => ({ wrong: String(c.wrong), right: String(c.right), why: String(c.why || "") })) : [];
        me.better = typeof res.better === "string" && norm(res.better) !== norm(text) ? res.better.trim() : "";
      }
      Chat.msgs.push({ who: "ai", es: reply, ru: String(res.translation || "") });
      Chat.turns.push({ role: "assistant", content: reply });
      App.state.save();
    } catch (e) {
      Chat.error = aiError(e);
    } finally {
      Chat.busy = false; Chat.ctl = null;
      if (inChat()) { refreshSlots(); focusInput(); }
    }
  }
  // «Подскажи, что сказать»: три варианта продолжения по последним репликам
  async function hint() {
    const { AI, aiError, refreshSlots } = App.ai;
    if (!AI.fn || Chat.hintBusy) return;
    const sc = scenario();
    const ctx = Chat.msgs.slice(-6).map((m) => (m.who === "ai" ? "Собеседник" : "Ученик") + ": " + m.es).join("\n");
    Chat.hintBusy = true; refreshSlots();
    try {
      const arr = await AI.fn.json("Сцена: " + sc.desc + ". Собеседник — " + sc.role + ". Страна: " + App.cfg.country().ru + ".\nРазговор:\n" + ctx + "\n\nПредложи ученику (русскоязычному, уровень " + S.settings.level + ") 3 разных коротких варианта, что он может ответить сейчас по-испански — простые, естественные для местного жителя. Ответь только JSON-массивом: [{\"es\":\"вариант по-испански\",\"ru\":\"перевод\"}]", { modelTier: "quick", cache: false });
      Chat.hints = (Array.isArray(arr) ? arr : []).filter((h) => h && typeof h.es === "string").slice(0, 3).map((h) => ({ es: h.es.trim(), ru: String(h.ru || "").trim() }));
      if (!Chat.hints.length) Chat.error = "Claude не предложил вариантов. Попробуйте ещё раз.";
    } catch (e) { Chat.error = aiError(e); }
    Chat.hintBusy = false;
    if (inChat()) refreshSlots();
  }
  function reset() {
    if (Chat.ctl) Chat.ctl.abort();
    Object.assign(Chat, { turns: [], msgs: [], busy: false, error: "", hints: null, hintBusy: false });
  }

  App.slots.chat = body;
  Object.assign(App.act, {
    "open-chat": (b) => {
      ui.Dlg.resp = null; App.audio.stop();
      const sc = b.dataset.arg && scenarios().some((s) => s.id === b.dataset.arg) ? b.dataset.arg : null;
      if (sc && sc !== Chat.scenario) { reset(); Chat.scenario = sc; }
      App.router.open("talk");
      ui.UI.talk = { mode: "chat", id: null };
      App.router.render(); window.scrollTo(0, 0);
    },
    "chat-begin": () => send(null),
    "chat-reset": () => { reset(); App.ai.refreshSlots(); },
    "chat-tr": (b) => { const m = Chat.msgs[Number(b.dataset.arg)]; m.showTr = !m.showTr; App.ai.refreshSlots(); },
    "chat-hint": () => hint(),
    "chat-hint-use": (b) => { const h = Chat.hints && Chat.hints[Number(b.dataset.arg)]; const ta = $("#chatIn"); if (h && ta) { ta.value = h.es; ta.focus(); } },
    "chat-deep": async (b) => {
      const i = Number(b.dataset.arg), m = Chat.msgs[i];
      const prev = Chat.msgs.slice(0, i).reverse().find((x) => x.who === "ai");
      b.hidden = true;
      const txt = await App.ai.streamInto($("#deep" + i), "Разбери по-русски фразу ученика на испанском. Ученик русскоязычный, уровень " + S.settings.level + ", переезжает в страну " + App.cfg.country().ru + ". Сцена: " + scenario().desc + ".\n" + (prev ? "Собеседник сказал: «" + prev.es + "»\n" : "") + "Ученик ответил: «" + m.es + "»\n\nКоротко: 1) ошибки и почему; 2) исправленный вариант; 3) два варианта, как сказал бы местный житель. Без вступлений, простыми списками.", { modelTier: "default" });
      if (txt) m.deep = txt; else b.hidden = false;
    }
  });
  App.forms.chat = () => { const ta = $("#chatIn"); const text = ta.value.trim(); if (!text) return; ta.value = ""; send(text); };
  App.changes.chatScenario = (el) => { reset(); Chat.scenario = el.value; App.ai.refreshSlots(); };

  App.views.chat = {
    render,
    after: () => { const box = $("#chatLog"); if (box) box.scrollIntoView({ block: "end" }); }
  };
})(window.App = window.App || {});
