(function () {
  "use strict";

  const DECKS = window.ES_DECKS || [];
  const LESSONS = window.ES_LESSONS || [];
  const DIALOGS = window.ES_DIALOGS || [];
  const CONJ = window.ES_CONJ;

  // ---------------------------------------------------------------- утилиты
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d = new Date()) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const addDays = (key, n) => { const [y, m, d] = key.split("-").map(Number); return dayKey(new Date(y, m - 1, d + n)); };
  const stripAcc = CONJ.stripAcc;
  function plural(n, one, few, many) {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  }
  const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const WEEK_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  const ICON = {
    say: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    slow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/></svg>'
  };

  const COUNTRIES = {
    MX: { ru: "Мексика", es: "México", lang: "es-MX" },
    CO: { ru: "Колумбия", es: "Colombia", lang: "es-CO" },
    AR: { ru: "Аргентина", es: "Argentina", lang: "es-AR", voseo: true },
    CL: { ru: "Чили", es: "Chile", lang: "es-CL" },
    PE: { ru: "Перу", es: "Perú", lang: "es-PE" },
    EC: { ru: "Эквадор", es: "Ecuador", lang: "es-EC" },
    UY: { ru: "Уругвай", es: "Uruguay", lang: "es-UY", voseo: true },
    CR: { ru: "Коста-Рика", es: "Costa Rica", lang: "es-CR" },
    LA: { ru: "Латинская Америка в целом", es: "Latinoamérica", lang: "es-419" }
  };
  const NEW_BY_MINUTES = { 20: 8, 30: 12, 45: 16, 60: 20 };

  // ---------------------------------------------------------------- состояние
  const KEY = "es-mudanza-v1";
  function defaults() {
    return {
      v: 1, updatedAt: 0,
      settings: {
        country: "MX", minutes: 30, newPerDay: 12, level: "A1", dir: "mixed", autoplay: true, rate: 0.9,
        voice: "", soft: true, conjTenses: ["pres"], conjSet: "top", decksOff: []
      },
      cards: {}, custom: [], days: {}, lessons: {}, dialogs: {}, mistakes: [], stats: { ans: 0, ok: 0 }
    };
  }
  function merge(x) {
    const d = defaults();
    if (!x || typeof x !== "object") return d;
    const o = Object.assign(d, x);
    o.settings = Object.assign(defaults().settings, x.settings || {});
    for (const k of ["cards", "days", "lessons", "dialogs", "stats"]) if (!o[k] || typeof o[k] !== "object" || Array.isArray(o[k])) o[k] = defaults()[k];
    for (const k of ["custom", "mistakes"]) if (!Array.isArray(o[k])) o[k] = [];
    return o;
  }
  function loadLocal() {
    try { const raw = localStorage.getItem(KEY); if (raw) return merge(JSON.parse(raw)); } catch (e) { /* хранилище недоступно */ }
    return defaults();
  }
  let S = loadLocal();
  function saveLocal() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* без локальной копии */ } }
  function save() { S.updatedAt = Date.now(); saveLocal(); Sync.soon(); }

  function today() {
    const k = dayKey();
    if (!S.days[k]) S.days[k] = { sec: 0, rev: 0, nw: 0, ok: 0, bad: 0, prac: 0, lesson: 0, dialog: 0, chat: 0 };
    return S.days[k];
  }

  // ---------------------------------------------------------------- синхронизация (db)
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
        if ((remote.updatedAt || 0) > (S.updatedAt || 0)) { S = remote; saveLocal(); return true; }
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
        if ((remote.updatedAt || 0) > (S.updatedAt || 0)) {
          S = remote; saveLocal(); buildCards();
          if (!Cards.active && !P.active) render();
        } else if (S.updatedAt) Sync.soon(300);
      } else if (S.updatedAt) Sync.soon(300);
      Sync.set("cloud");
    } catch (e) { Sync.ref = null; Sync.set("local"); }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { clearTimeout(Sync.timer); Sync.push(); }
    else Sync.pull().then((changed) => { if (changed) { buildCards(); if (!Cards.active && !P.active) render(); } });
  });

  // ---------------------------------------------------------------- Claude (sample) и скачивание
  const AI = { fn: null, ready: false };
  const DL = { fn: null };
  async function initCaps() {
    const cl = window.claude;
    if (!cl || typeof cl.use !== "function") { AI.ready = true; refreshAISlots(); return; }
    try { AI.fn = await cl.use("sample"); } catch (e) { AI.fn = null; }
    AI.ready = true;
    refreshAISlots();
    try { DL.fn = await cl.use("downloads"); } catch (e) { DL.fn = null; }
    $$("[data-needs-dl]").forEach((el) => { el.hidden = !DL.fn; });
  }
  function aiError(e) {
    const code = e && e.code;
    if (["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(code)) {
      AI.fn = null;
      setTimeout(refreshAISlots, 0);
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
  // Блоки, которые зависят от Claude, перерисовываются, когда станет известно, доступен ли он
  function refreshAISlots() {
    const draftEl = $("#chatIn"), draft = draftEl ? draftEl.value : "";
    $$("[data-ai-slot]").forEach((el) => {
      const fn = AI_SLOTS[el.dataset.aiSlot];
      if (fn) el.innerHTML = fn(el);
    });
    const ta = $("#chatIn");
    if (ta && draft && !ta.value) ta.value = draft;
  }
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
  const country = () => COUNTRIES[S.settings.country] || COUNTRIES.MX;

  // ---------------------------------------------------------------- озвучка
  const Voice = { ok: typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined", list: [], warned: false, keep: [] };
  function loadVoices() {
    if (!Voice.ok) return;
    try { Voice.list = speechSynthesis.getVoices().filter((v) => /^es([-_]|$)/i.test(v.lang)); } catch (e) { Voice.list = []; }
  }
  if (Voice.ok) {
    loadVoices();
    try { speechSynthesis.addEventListener("voiceschanged", () => { loadVoices(); const sel = $("#voiceSel"); if (sel) render(); }); } catch (e) { /* старый браузер */ }
  }
  function chooseVoice() {
    if (!Voice.list.length) loadVoices();
    if (S.settings.voice) { const v = Voice.list.find((x) => x.voiceURI === S.settings.voice); if (v) return v; }
    const norm = (l) => l.replace("_", "-").toLowerCase();
    const want = [country().lang, "es-mx", "es-us", "es-419", "es-co", "es-ar"].map((x) => x.toLowerCase());
    for (const l of want) {
      const cands = Voice.list.filter((v) => norm(v.lang) === l);
      if (cands.length) return cands.find((v) => /natural|online|google/i.test(v.name)) || cands[0];
    }
    return Voice.list.find((v) => !/es-es/i.test(norm(v.lang))) || Voice.list[0] || null;
  }
  function utter(text, slow) {
    const u = new SpeechSynthesisUtterance(String(text).replace(/[«»—]/g, " "));
    const v = chooseVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = country().lang;
    u.rate = slow ? 0.62 : S.settings.rate;
    Voice.keep.push(u); if (Voice.keep.length > 30) Voice.keep.shift();
    return u;
  }
  // Записанная озвучка: фразы из словаря, диалогов и уроков заранее записаны
  // нейросетевыми голосами и лежат в audio/*.json (base64 mp3), индекс — в audio-index.js.
  // Голос браузера нужен только для того, чего нет в записи (формы глаголов, ответы Claude, свои слова).
  const REC = { index: window.ES_AUDIO_INDEX || {}, packs: {}, loading: {}, audio: null, seq: 0 };
  const AK = window.ES_AUDIO_KEY;
  function loadPack(name) {
    if (REC.packs[name]) return Promise.resolve(REC.packs[name]);
    if (!REC.loading[name]) {
      REC.loading[name] = fetch("audio/" + name + ".json")
        .then((r) => (r.ok ? r.json() : {}))
        .then((j) => (REC.packs[name] = j))
        .catch(() => { delete REC.loading[name]; return {}; });
    }
    return REC.loading[name];
  }
  const packFor = (text) => (AK ? REC.index[AK.audioKey(text)] : null);
  const hasRecording = (text) => !!packFor(text);
  function preload(texts) { const seen = new Set(); texts.forEach((t) => { const p = t && packFor(t); if (p && !seen.has(p)) { seen.add(p); loadPack(p); } }); }
  function stopAudio() {
    REC.seq++;
    if (REC.audio) { try { REC.audio.pause(); } catch (e) { /* уже остановлено */ } REC.audio = null; }
    if (Voice.ok) try { speechSynthesis.cancel(); } catch (e) { /* нечего останавливать */ }
  }
  // Проигрывает фразу; onend вызывается после окончания (или сразу, если звука нет)
  async function speak(text, slow, onend) {
    stopAudio();
    const seq = REC.seq;
    const done = () => { if (seq === REC.seq && onend) onend(); };
    const pack = packFor(text);
    if (pack) {
      const p = await loadPack(pack);
      if (seq !== REC.seq) return;
      const b64 = p[AK.audioKey(text)];
      if (b64) {
        const a = new Audio("data:audio/mpeg;base64," + b64);
        a.playbackRate = slow ? 0.7 : Math.max(0.6, Math.min(1.3, S.settings.rate / 0.9));
        a.onended = done;
        a.onerror = done;
        REC.audio = a;
        a.play().catch(() => { if (seq === REC.seq) { toast("Браузер не дал включить звук. Нажмите кнопку озвучки ещё раз."); } });
        return;
      }
    }
    speakBrowser(text, slow, done);
  }
  function speakBrowser(text, slow, done) {
    const v = Voice.ok ? chooseVoice() : null;
    if (!v) {
      if (!Voice.warned) { Voice.warned = true; toast("Для этой фразы нет записи, а испанского голоса в браузере нет. Как его добавить — в «Прогрессе» → «Озвучка»."); }
      if (done) setTimeout(done, 300);
      return;
    }
    try {
      const u = utter(text, slow);
      u.onend = done; u.onerror = done;
      speechSynthesis.speak(u);
    } catch (e) { if (done) done(); }
  }
  const sayBtn = (text, cls) => '<button class="say ' + (cls || "") + '" data-act="say" data-text="' + esc(text) + '" aria-label="Произнести" title="Произнести">' + ICON.say + "</button>";

  // ---------------------------------------------------------------- слова и интервальное повторение
  let ALL = [];
  const BY_ID = new Map();
  const BY_ES = new Map();
  function buildCards() {
    ALL = []; BY_ID.clear(); BY_ES.clear();
    const add = (deck, w) => {
      const c = { id: deck + "|" + w[0], deck, es: w[0], ru: w[1], exEs: w[2] || "", exRu: w[3] || "", note: w[4] || "" };
      if (BY_ID.has(c.id)) return;
      ALL.push(c); BY_ID.set(c.id, c);
      if (!BY_ES.has(c.es)) BY_ES.set(c.es, []);
      BY_ES.get(c.es).push(c);
    };
    DECKS.forEach((d) => d.words.forEach((w) => add(d.id, w)));
    S.custom.forEach((w) => add("custom", w));
  }
  function deckList() {
    return DECKS.concat([{ id: "custom", title: "Мои слова", es: "Mis palabras", words: S.custom }]);
  }
  const deckById = (id) => deckList().find((d) => d.id === id);
  const enabledDeck = (id) => !S.settings.decksOff.includes(id);
  const TOP_IDS = new Set(DECKS.filter((d) => d.group === "top").map((d) => d.id));
  const isTop = (id) => TOP_IDS.has(id);
  function interleave(a, b) { const out = []; for (let i = 0; i < Math.max(a.length, b.length); i++) { if (i < a.length) out.push(a[i]); if (i < b.length) out.push(b[i]); } return out; }
  const status = (id) => { const c = S.cards[id]; return !c ? "new" : c.i >= 21 ? "learned" : "learning"; };
  const isDue = (id, t) => { const c = S.cards[id]; return c && c.d <= t; };

  function nextInterval(c, g) {
    const st = c || { i: 0, e: 2.5 };
    let i = st.i, e = st.e;
    if (g === 0) { e = Math.max(1.3, e - 0.2); i = 0; }
    else if (g === 1) { e = Math.max(1.3, e - 0.15); i = i < 1 ? 1 : Math.max(i + 1, Math.round(i * 1.2)); }
    else if (g === 2) { i = i < 1 ? 2 : i < 3 ? i + 2 : Math.round(i * e); }
    else { e = Math.min(3, e + 0.15); i = i < 1 ? 4 : Math.max(i + 3, Math.round(i * e * 1.3)); }
    return { i: Math.min(i, 365), e: Math.round(e * 100) / 100 };
  }
  function intervalLabel(i) {
    if (i === 0) return "снова сегодня";
    if (i < 30) return i + " " + plural(i, "день", "дня", "дней");
    const m = Math.round(i / 30);
    return m + " " + plural(m, "месяц", "месяца", "месяцев");
  }
  // Одно и то же слово может стоять в нескольких темах: у «близнецов» общее расписание повторений
  const twins = (id) => { const c = BY_ID.get(id); return c ? (BY_ES.get(c.es) || [c]) : []; };
  function grade(id, g) {
    const old = S.cards[id];
    const n = nextInterval(old, g);
    const t = dayKey();
    const st = { i: n.i, e: n.e, d: addDays(t, n.i), r: (old ? old.r : 0) + 1, l: (old ? old.l : 0) + (g === 0 ? 1 : 0), s: old ? old.s : t };
    for (const c of twins(id)) S.cards[c.id] = Object.assign({}, st);
  }
  // Оставляет по одной карточке на каждое испанское слово
  function uniqueByEs(list) { const seen = new Set(); return list.filter((c) => (seen.has(c.es) ? false : seen.add(c.es))); }
  function counts() {
    const t = dayKey();
    let due = 0, freshAvail = 0;
    for (const c of uniqueByEs(ALL)) {
      if (S.cards[c.id]) { if (S.cards[c.id].d <= t) due++; }
      else if (enabledDeck(c.deck)) freshAvail++;
    }
    const newLeft = Math.max(0, S.settings.newPerDay - today().nw);
    return { due, newToday: Math.min(newLeft, freshAvail), freshAvail };
  }
  function deckCounts(deck) {
    const r = { total: 0, learned: 0, learning: 0, fresh: 0, due: 0 };
    const t = dayKey();
    for (const c of ALL) {
      if (c.deck !== deck) continue;
      r.total++;
      const s = status(c.id);
      if (s === "learned") r.learned++; else if (s === "learning") r.learning++; else r.fresh++;
      if (isDue(c.id, t)) r.due++;
    }
    return r;
  }
  const typeable = (c) => !/[,…]/.test(c.es) && c.es.split(" / ").length <= 2;
  function answersFor(c) {
    const parts = c.es.split(" / ");
    return parts.length > 1 ? parts.concat([c.es]) : parts;
  }

  // ---------------------------------------------------------------- проверка ответа
  const norm = (s) => String(s).toLowerCase().replace(/[¿?¡!.,;:"«»()…—–]/g, " ").replace(/\s+/g, " ").trim();
  const ARTICLE = /^(el|la|los|las|un|una|unos|unas) /;
  function checkAnswer(given, answers, opts) {
    const g = norm(given);
    if (!g) return { ok: false, empty: true };
    const list = answers.map(norm);
    if (list.includes(g)) return { ok: true };
    const ga = stripAcc(g);
    if (list.some((a) => stripAcc(a) === ga)) return S.settings.soft ? { ok: true, accent: true } : { ok: false, accent: true };
    if (opts && opts.articles) {
      const gNo = ga.replace(ARTICLE, "");
      if (list.some((a) => stripAcc(a).replace(ARTICLE, "") === gNo)) return { ok: true, article: true };
    }
    return { ok: false };
  }

  // ---------------------------------------------------------------- маршруты и UI-состояние
  const ROUTES = ["today", "words", "grammar", "practice", "talk", "progress"];
  let route = "today";
  const UI = { deck: null, lesson: null, talk: { mode: "list", id: null }, confirmReset: false, gen: null, quiz: {} };
  const Cards = { active: false, queue: [], pos: 0, shown: false, done: 0, again: 0, deck: null, front: "es" };
  const P = { active: false, kind: null, items: [], i: 0, ok: 0, answered: false, wrong: [], built: [], pool: [] };
  const Chat = { scenario: "free", turns: [], msgs: [], busy: false, ctl: null };

  function go(r, keepSub) {
    if (!ROUTES.includes(r)) r = "today";
    route = r;
    if (!keepSub) {
      if (r === "words") UI.deck = null;
      if (r === "grammar") UI.lesson = null;
      if (r === "talk") UI.talk = { mode: "list", id: null };
    }
    Cards.active = false; P.active = false;
    try { if (location.hash !== "#" + r) history.replaceState(null, "", "#" + r); } catch (e) { /* адрес не меняется */ }
    stopAudio(); Dlg.playing = -1;
    render();
    window.scrollTo(0, 0);
  }
  function render() {
    $$(".nav-link").forEach((a) => { if (a.dataset.route === route) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    const v = $("#view");
    let html = "";
    if (Cards.active) html = viewCards();
    else if (P.active) html = viewPractice();
    else if (route === "today") html = viewToday();
    else if (route === "words") html = UI.deck ? viewDeck(UI.deck) : viewWords();
    else if (route === "grammar") html = UI.lesson ? viewLesson(UI.lesson) : viewGrammar();
    else if (route === "practice") html = viewPracticeHome();
    else if (route === "talk") html = UI.talk.mode === "dialog" ? viewDialog(UI.talk.id) : UI.talk.mode === "chat" ? viewChat() : viewTalk();
    else if (route === "progress") html = viewProgress();
    v.innerHTML = html;
    afterRender();
  }
  function afterRender() {
    refreshAISlots();
    $$("[data-needs-dl]").forEach((el) => { el.hidden = !DL.fn; });
    const af = $("[data-autofocus]");
    if (af) setTimeout(() => af.focus({ preventScroll: true }), 30);
    if (route === "talk" && UI.talk.mode === "chat") { const box = $("#chatLog"); if (box) box.scrollIntoView({ block: "end" }); }
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  const keysHTML = () => '<div class="keys" aria-label="Испанские буквы">' + ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"].map((k) => '<button type="button" class="key" data-key="' + k + '" tabindex="-1">' + k + "</button>").join("") + "</div>";
  let lastInput = null;
  document.addEventListener("focusin", (e) => { if (e.target.matches("input[type=text], textarea")) lastInput = e.target; });
  document.addEventListener("pointerdown", (e) => {
    const k = e.target.closest(".key");
    if (!k) return;
    e.preventDefault();
    const el = document.activeElement && document.activeElement.matches("input[type=text], textarea") ? document.activeElement : lastInput;
    if (!el || !document.contains(el) || el.disabled) return;
    const s = el.selectionStart ?? el.value.length, en = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, s) + k.dataset.key + el.value.slice(en);
    el.focus();
    el.setSelectionRange(s + 1, s + 1);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  // ---------------------------------------------------------------- учёт времени
  let lastAct = Date.now(), ticks = 0;
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach((ev) => window.addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true }));
  setInterval(() => {
    if (document.hidden || Date.now() - lastAct > 90000) return;
    today().sec += 5;
    if (++ticks % 6 === 0) save();
    updateRing();
  }, 5000);
  const minutesToday = () => Math.floor(today().sec / 60);
  function streak() {
    let n = 0, k = dayKey();
    if (!((S.days[k] || {}).sec >= 600)) k = addDays(k, -1);
    while ((S.days[k] || {}).sec >= 600) { n++; k = addDays(k, -1); }
    return n;
  }

  // ================================================================ СЕГОДНЯ
  function ringHTML() {
    const goal = S.settings.minutes, m = minutesToday();
    const C = 2 * Math.PI * 52, frac = Math.min(1, m / goal);
    return '<div class="ring" role="img" aria-label="' + m + " из " + goal + ' минут сегодня"><svg viewBox="0 0 120 120"><circle class="track" cx="60" cy="60" r="52"/><circle class="arc" id="ringArc" cx="60" cy="60" r="52" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - frac)).toFixed(1) + '"/></svg><div class="ring-label"><b class="num" id="ringMin">' + m + '</b><span>из ' + goal + " мин</span></div></div>";
  }
  function updateRing() {
    const arc = $("#ringArc"), num = $("#ringMin");
    if (!arc || !num) return;
    const goal = S.settings.minutes, m = minutesToday(), C = 2 * Math.PI * 52;
    num.textContent = m;
    arc.setAttribute("stroke-dashoffset", (C * (1 - Math.min(1, m / goal))).toFixed(1));
  }
  const PRACTICE_KINDS = [
    { id: "choice", title: "Выбор перевода", ex: "el departamento → квартира", desc: "Быстро узнавать слова в обе стороны.", min: 4 },
    { id: "type", title: "Перевод на испанский", ex: "ключ → la llave", desc: "Вспомнить слово и написать его самому.", min: 5 },
    { id: "build", title: "Собери фразу", ex: "¿ · Dónde · está · el · banco · ?", desc: "Порядок слов в живых фразах.", min: 5 },
    { id: "dict", title: "Диктант", ex: "Слушаю и записываю", desc: "Понимание на слух: латиноамериканское произношение.", min: 6 },
    { id: "conj", title: "Спряжения", ex: "tener · nosotros → tenemos", desc: "Тренажёр форм глаголов по выбранным временам.", min: 5 },
    { id: "mist", title: "Работа над ошибками", ex: "Повторить то, где ошибся", desc: "Слова и формы, в которых вы ошибались.", min: 4 }
  ];
  function planItems() {
    const G = S.settings.minutes, d = today(), c = counts();
    const items = [];
    const cardMin = Math.max(1, Math.ceil((c.due * 8 + c.newToday * 25) / 60));
    items.push({
      done: c.due === 0 && c.newToday === 0 && (d.rev + d.nw) > 0 || (c.due === 0 && c.newToday === 0 && c.freshAvail === 0),
      title: "Карточки", sub: c.due + " на повторение, " + c.newToday + " " + plural(c.newToday, "новое слово", "новых слова", "новых слов"),
      min: cardMin, act: "cards-start", label: "Начать"
    });
    const lesson = LESSONS.find((l) => !S.lessons[l.id]);
    if (lesson) items.push({ done: d.lesson > 0, title: "Урок: " + lesson.title, sub: lesson.es + " · " + lesson.level, min: 8, act: "open-lesson", arg: lesson.id, label: "Открыть" });
    const nPrac = G < 30 ? 1 : G < 45 ? 2 : 3;
    const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const kinds = PRACTICE_KINDS.filter((k) => k.id !== "mist");
    for (let i = 0; i < nPrac; i++) {
      const k = kinds[(doy + i * 2) % kinds.length];
      items.push({ done: ((d.pk || {})[k.id] || 0) > 0, title: "Упражнение: " + k.title.toLowerCase(), sub: k.desc, min: k.min, act: "practice-start", arg: k.id, label: "Начать" });
    }
    if (S.mistakes.length >= 5) items.push({ done: false, title: "Работа над ошибками", sub: S.mistakes.length + " " + plural(S.mistakes.length, "пункт", "пункта", "пунктов") + " в списке", min: 4, act: "practice-start", arg: "mist", label: "Повторить" });
    if (G >= 30) {
      const dl = DIALOGS.find((x) => !S.dialogs[x.id]) || DIALOGS[doy % DIALOGS.length];
      items.push({ done: d.dialog > 0, title: "Диалог: " + dl.title, sub: "Прослушать, прочитать роль, выучить фразы", min: 7, act: "open-dialog", arg: dl.id, label: "Открыть" });
    }
    if (G >= 45) items.push({ done: d.chat >= 6, title: "Разговор с Claude", sub: "Ролевая сцена с исправлением ошибок, 10 минут", min: 10, act: "open-chat", label: "Говорить", ai: true });
    return items;
  }
  function weekStrip() {
    let html = '<div class="week" aria-label="Последние 7 дней">';
    for (let i = 6; i >= 0; i--) {
      const k = addDays(dayKey(), -i);
      const dt = new Date(k + "T12:00");
      const on = (S.days[k] || {}).sec >= 600;
      html += '<span class="' + (on ? "on " : "") + (i === 0 ? "today" : "") + '"><i></i>' + WEEK_RU[dt.getDay()] + "</span>";
    }
    return html + "</div>";
  }
  function phraseOfDay() {
    const pool = [];
    DIALOGS.forEach((d) => d.lines.forEach((l) => { if (l[1].split(" ").length >= 4 && l[1].split(" ").length <= 10) pool.push([l[1], l[2], d.title]); }));
    const k = dayKey().split("-").map(Number);
    const idx = (k[0] * 372 + k[1] * 31 + k[2]) % pool.length;
    return pool[idx];
  }
  function viewToday() {
    const now = new Date();
    const date = DIAS[now.getDay()] + ", " + now.getDate() + " de " + MESES[now.getMonth()];
    const items = planItems();
    const total = items.filter((x) => !x.done).reduce((a, x) => a + x.min, 0);
    const st = streak();
    const ph = phraseOfDay();
    const learned = ALL.filter((c) => status(c.id) === "learned").length;
    const inWork = Object.keys(S.cards).length;
    const tomorrow = ALL.filter((c) => S.cards[c.id] && S.cards[c.id].d <= addDays(dayKey(), 1)).length;
    const first = !Object.keys(S.cards).length && !Object.keys(S.lessons).length;
    return '<section class="hero">' +
      '<div><p class="eyebrow">Сегодня</p><h1 class="hero-date">' + esc(date) + "</h1>" +
      '<div class="hero-meta"><span class="chip acc">Переезд: ' + esc(country().ru) + '</span><span class="chip">Уровень ' + esc(S.settings.level) + '</span><span class="chip">Цель ' + S.settings.minutes + " мин в день</span></div></div>" +
      ringHTML() + "</section>" +
      (first ? '<section class="panel stack"><h2 class="sec">С чего начать</h2><p>План ниже собран под ' + S.settings.minutes + ' минут в день. Начните с карточек: первые слова — самые нужные в первые недели после переезда. Страну, уровень и время можно поменять в разделе «Прогресс».</p></section>' : "") +
      '<section class="panel stack"><div class="sec-head"><h2 class="sec">План на сегодня</h2><span class="muted small">' + (total ? "осталось примерно " + total + " мин" : "план выполнен") + "</span></div>" +
      '<div class="plan">' + items.map((it) =>
        '<div class="plan-item' + (it.done ? " done" : "") + '"><span class="plan-check">' + (it.done ? ICON.check : "") + "</span>" +
        '<div><div class="plan-title">' + esc(it.title) + '</div><div class="plan-sub">' + esc(it.sub) + " · ~" + it.min + " мин</div></div>" +
        '<button class="btn ' + (it.done ? "ghost " : "") + 'sm" data-act="' + it.act + '"' + (it.arg ? ' data-arg="' + esc(it.arg) + '"' : "") + ">" + (it.done ? "Ещё раз" : it.label) + "</button></div>").join("") +
      "</div></section>" +
      '<div class="grid-2">' +
      '<section class="panel stack"><p class="eyebrow">Días seguidos</p><div class="streak"><span class="streak-n num">' + st + '</span><span class="muted small">' + plural(st, "день", "дня", "дней") + " подряд по 10+ минут</span></div>" + weekStrip() + "</section>" +
      '<section class="panel stack"><p class="eyebrow">Frase del día</p><div class="phrase"><p class="es">' + esc(ph[0]) + "</p>" + sayBtn(ph[0]) + '<p class="muted small">' + esc(ph[1]) + " · из диалога «" + esc(ph[2]) + "»</p></div></section>" +
      "</div>" +
      '<section class="panel"><div class="stats">' +
      stat(learned, "слов выучено") + stat(inWork, "слов в работе") + stat(tomorrow, "повторить завтра") + stat(Object.keys(S.lessons).length + " / " + LESSONS.length, "уроков пройдено") +
      "</div></section>";
  }
  const stat = (v, l) => '<div class="stat"><b>' + esc(v) + "</b><span>" + esc(l) + "</span></div>";

  // ================================================================ СЛОВА
  function deckBar(dc) {
    const t = dc.total || 1;
    return '<div class="bar" aria-hidden="true"><i class="b-learned" style="width:' + (dc.learned / t * 100) + '%"></i><i class="b-learning" style="width:' + (dc.learning / t * 100) + '%"></i></div>';
  }
  function deckCard(d) {
    const dc = deckCounts(d.id);
    return '<section class="panel deck"><div class="deck-top"><div><div class="deck-title">' + esc(d.title) + '</div><div class="deck-es">' + esc(d.es) + "</div></div>" +
      (dc.due ? '<span class="chip sun">' + dc.due + " к повтору</span>" : "") + "</div>" + deckBar(dc) +
      '<div class="deck-foot"><span class="muted small num">' + dc.learned + " / " + dc.total + ' выучено</span><div class="row">' +
      '<label class="switch"><input type="checkbox" data-act="deck-toggle" data-arg="' + d.id + '"' + (enabledDeck(d.id) ? " checked" : "") + "> В плане</label>" +
      '<button class="btn ghost sm" data-act="open-deck" data-arg="' + d.id + '">Открыть</button></div></div></section>';
  }
  function viewWords() {
    const c = counts();
    const decks = deckList();
    const top = decks.filter((d) => d.group === "top"), themes = decks.filter((d) => d.group !== "top");
    const topLearned = top.reduce((a, d) => a + deckCounts(d.id).learned, 0);
    return '<header class="page-head"><div><h1>Слова</h1><p class="sub">Vocabulario para la mudanza</p></div>' +
      '<div class="row"><button class="btn" data-act="cards-start"' + (c.due + c.newToday ? "" : " disabled") + ">Учить: " + c.due + " повторить · " + c.newToday + " новых</button></div></header>" +
      '<p class="muted">Новые слова приходят по ' + S.settings.newPerDay + " в день поровну из топ-1500 и из тем для переезда — из тех, у которых включён переключатель «В плане». Карточку, которую вы вспомнили легко, приложение покажет нескоро; трудную — снова скоро.</p>" +
      '<div class="legend"><span class="l1">выучено (интервал от 3 недель)</span><span class="l2">в процессе</span><span>не начато</span></div>' +
      '<div class="sec-head"><h2 class="sec">Топ-1500 самых употребительных слов</h2><span class="muted small num">' + topLearned + " / " + top.reduce((a, d) => a + d.words.length, 0) + " выучено</span></div>" +
      '<p class="muted small">Тысяча самых частых слов покрывает около 80% повседневной речи. Отделы 1–5 — основа: самые частые слова, глаголы, существительные, прилагательные и связки. Отделы 6–10 — следующий уровень: бытовые глаголы, вещи и места, люди и чувства, описания и живые разговорные выражения со сленгом. Отделы 11–15 — для уверенной жизни на месте: глаголы для учёбы, техники и кухни, дом и продукты, работа и деньги, здоровье и характер, связки и идиомы.</p>' +
      '<div class="grid-2">' + top.map(deckCard).join("") + "</div>" +
      '<h2 class="sec">Темы для переезда</h2>' +
      '<div class="grid-2">' + themes.map(deckCard).join("") + "</div>" +
      '<section class="panel stack"><h2 class="sec">Новые слова по вашей теме</h2><p class="muted">Напишите тему — Claude подберёт 10 слов с примерами, принятыми в стране «' + esc(country().ru) + '». Выбранные слова попадут в «Мои слова».</p><div data-ai-slot="gen"></div></section>';
  }
  const AI_SLOTS = {
    gen() {
      if (!AI.fn) return aiNote();
      const g = UI.gen;
      let html = '<form class="row" data-form="gen"><input type="text" id="genTopic" placeholder="Например: аренда машины, детский сад, спортзал" value="' + esc(g && g.topic || "") + '" style="flex:1 1 260px"><button class="btn"' + (g && g.busy ? " disabled" : "") + ">" + (g && g.busy ? "Подбираю…" : "Подобрать слова") + "</button></form>";
      if (g && g.error) html += '<p class="muted small">' + esc(g.error) + "</p>";
      if (g && g.items && g.items.length) {
        html += '<div class="wordlist">' + g.items.map((w, i) => '<label class="wordrow"><input type="checkbox" data-gen="' + i + '" checked><span class="es">' + esc(w.es) + '</span><span class="ru">' + esc(w.ru) + (w.note ? " · " + esc(w.note) : "") + "</span>" + sayBtn(w.es) + "</label>").join("") + "</div>" +
          '<div class="row"><button class="btn" data-act="gen-add">Добавить выбранные</button><button class="btn ghost" data-act="gen-clear">Убрать список</button></div>';
      }
      return html;
    },
    chat() { return chatBody(); },
    lessonAsk(el) {
      if (!AI.fn) return aiNote();
      return '<form class="stack" data-form="lesson-ask" data-arg="' + esc(el.dataset.arg) + '"><textarea id="lessonQ" placeholder="Например: почему здесь estar, а не ser?"></textarea><div class="row"><button class="btn sm">Спросить</button></div></form><div class="ai-text" id="lessonA"></div>';
    },
    explain(el) { return AI.fn ? '<button class="btn quiet sm" data-act="explain">Объяснить ошибку (Claude)</button><div class="ai-text" id="explainOut"></div>' : ""; },
    planChat() { return ""; }
  };
  function viewDeck(id) {
    const d = deckById(id);
    if (!d) { UI.deck = null; return viewWords(); }
    const list = ALL.filter((c) => c.deck === id);
    const dc = deckCounts(id);
    const t = dayKey();
    const freshLeft = list.filter((c) => !S.cards[c.id]).length;
    let html = '<div class="row"><button class="btn quiet sm" data-act="back-words">← Все темы</button></div>' +
      '<header class="page-head"><div><h1>' + esc(d.title) + '</h1><p class="sub">' + esc(d.es) + "</p></div>" +
      '<div class="row">' + (dc.due ? '<button class="btn" data-act="cards-deck" data-arg="' + id + '">Повторить ' + dc.due + "</button>" : "") +
      (freshLeft ? '<button class="btn ' + (dc.due ? "ghost" : "") + '" data-act="cards-deck-new" data-arg="' + id + '">Учить 10 новых</button>' : "") + "</div></header>" +
      deckBar(dc);
    if (id === "custom") {
      html += '<section class="panel stack"><h2 class="sec">Добавить слово</h2><form class="stack" data-form="add-word">' +
        '<div class="grid-2"><label class="field">По-испански<input type="text" id="awEs" lang="es" autocomplete="off" required placeholder="la guardería"></label><label class="field">Перевод<input type="text" id="awRu" autocomplete="off" required placeholder="детский сад"></label></div>' +
        '<div class="grid-2"><label class="field">Пример (необязательно)<input type="text" id="awEx" lang="es" autocomplete="off"></label><label class="field">Перевод примера<input type="text" id="awExRu" autocomplete="off"></label></div>' +
        keysHTML() + '<div class="row"><button class="btn">Добавить</button></div></form></section>';
    }
    if (!list.length) return html + '<p class="muted">Пока здесь пусто. Добавьте первое слово формой выше или подберите слова с Claude в разделе «Слова».</p>';
    html += '<section class="panel"><div class="wordlist">' + list.map((c) => {
      const s = status(c.id);
      const chip = s === "learned" ? '<span class="chip ok">выучено</span>' : s === "learning" ? (isDue(c.id, t) ? '<span class="chip sun">повторить</span>' : '<span class="chip acc">через ' + esc(intervalLabel(Math.max(1, Math.round((new Date(S.cards[c.id].d) - new Date(t)) / 86400000)))) + "</span>") : '<span class="chip">новое</span>';
      return '<div class="wordrow">' + sayBtn(c.es) + '<span class="es">' + esc(c.es) + '</span><span class="ru">' + esc(c.ru) + (c.note ? '<br><span class="small">' + esc(c.note) + "</span>" : "") + "</span>" + chip + "</div>";
    }).join("") + "</div></section>";
    return html;
  }

  // ---------------------------------------------------------------- сессия карточек
  function startCards(opts) {
    opts = opts || {};
    const t = dayKey();
    const inDeck = (c) => !opts.deck || c.deck === opts.deck;
    const due = shuffle(uniqueByEs(ALL.filter((c) => inDeck(c) && isDue(c.id, t))));
    let nNew = opts.extraNew != null ? opts.extraNew : counts().newToday;
    const freshAll = uniqueByEs(ALL.filter((c) => inDeck(c) && !S.cards[c.id] && (opts.deck || enabledDeck(c.deck))));
    // Без выбранной темы новые слова чередуются: одно из топ-500, одно из тем для переезда
    const fresh = opts.deck ? freshAll.slice(0, nNew) : interleave(freshAll.filter((c) => isTop(c.deck)), freshAll.filter((c) => !isTop(c.deck))).slice(0, nNew);
    if (opts.onlyNew) due.length = 0;
    const q = [];
    let i = 0, j = 0;
    while (i < due.length || j < fresh.length) {
      if (i < due.length) q.push(due[i++]);
      if (i < due.length) q.push(due[i++]);
      if (j < fresh.length) q.push(fresh[j++]);
    }
    if (!q.length) { toast("Сейчас нечего повторять. Новые карточки появятся завтра."); return; }
    preload(q.map((c) => c.es));
    Object.assign(Cards, { active: true, queue: q.map((c) => ({ id: c.id, isNew: !S.cards[c.id] })), pos: 0, shown: false, done: 0, again: 0, deck: opts.deck || null });
    pickFront();
    render(); window.scrollTo(0, 0);
    autoSay();
  }
  function pickFront() {
    const it = Cards.queue[Cards.pos];
    if (!it) return;
    const d = S.settings.dir;
    Cards.front = it.isNew ? "es" : d === "mixed" ? (Math.random() < 0.5 ? "es" : "ru") : d;
  }
  function autoSay() {
    const it = Cards.queue[Cards.pos];
    if (!it || !S.settings.autoplay) return;
    if (Cards.front === "es" || Cards.shown) speak(BY_ID.get(it.id).es);
  }
  function viewCards() {
    const it = Cards.queue[Cards.pos];
    if (!it) return viewCardsDone();
    const c = BY_ID.get(it.id);
    const deck = deckById(c.deck);
    const st = S.cards[c.id];
    const total = Cards.queue.length;
    const front = Cards.front === "es"
      ? '<p class="flash-prompt es">' + esc(c.es) + "</p>"
      : '<p class="flash-prompt ru">' + esc(c.ru) + "</p>";
    let back = "";
    if (Cards.shown) {
      back = '<div class="flash-answer">' +
        (Cards.front === "es" ? '<p class="main-ans ru">' + esc(c.ru) + "</p>" : '<div class="row" style="justify-content:center"><p class="main-ans es">' + esc(c.es) + "</p>" + sayBtn(c.es) + "</div>") +
        (c.exEs ? '<div class="example"><div class="row" style="justify-content:center"><p class="es">' + esc(c.exEs) + "</p>" + sayBtn(c.exEs) + '</div><p class="muted small">' + esc(c.exRu) + "</p></div>" : "") +
        (c.note ? '<p class="note">' + esc(c.note) + "</p>" : "") + "</div>" +
        '<div class="grades">' + [["Не помню", 0], ["Трудно", 1], ["Хорошо", 2], ["Легко", 3]].map(([l, g]) =>
          '<button class="grade g' + g + '" data-act="grade" data-arg="' + g + '">' + l + " <small>" + esc(intervalLabel(nextInterval(st, g).i)) + ' · <kbd>' + (g + 1) + "</kbd></small></button>").join("") + "</div>";
    }
    return '<div class="sess-top"><button class="btn quiet sm" data-act="cards-exit">← Выйти</button><div class="progress" aria-hidden="true"><i style="width:' + (Cards.pos / total * 100) + '%"></i></div><span class="muted small num">' + (Cards.pos + 1) + " / " + total + "</span></div>" +
      '<section class="panel flash">' +
      '<div class="row" style="justify-content:center"><span class="chip">' + esc(deck ? deck.title : "") + "</span>" + (it.isNew ? '<span class="chip acc">новое слово</span>' : '<span class="chip">повторение</span>') + "</div>" +
      (Cards.front === "es" ? '<div class="row" style="justify-content:center">' + front + sayBtn(c.es) + "</div>" : front) +
      (Cards.shown ? back : '<button class="btn" data-act="flip" data-autofocus>Показать ответ <kbd>Пробел</kbd></button>') +
      "</section>" +
      '<p class="muted small" style="text-align:center">' + (Cards.front === "es" ? "Вспомните перевод, затем откройте ответ." : "Скажите это по-испански вслух, затем откройте ответ.") + " Клавиши 1–4 — оценка.</p>";
  }
  function viewCardsDone() {
    const c = counts();
    return '<section class="panel stack" style="text-align:center;justify-items:center;padding:40px 24px"><p class="eyebrow">¡Listo!</p><h1 class="hero-date">Готово</h1>' +
      "<p>Пройдено карточек: <b>" + Cards.done + "</b>" + (Cards.again ? ", из них забытых: " + Cards.again : "") + ".</p>" +
      '<div class="row" style="justify-content:center">' + (c.due ? '<button class="btn" data-act="cards-start">Повторить оставшиеся (' + c.due + ")</button>" : "") +
      '<button class="btn ghost" data-act="go" data-arg="today">К плану на сегодня</button><button class="btn ghost" data-act="cards-more">Ещё 10 новых слов</button></div></section>';
  }
  function doGrade(g) {
    const it = Cards.queue[Cards.pos];
    if (!it || !Cards.shown) return;
    const d = today();
    if (it.isNew && !it.counted) { d.nw++; it.counted = true; } else if (!it.isNew) d.rev++;
    grade(it.id, g);
    Cards.done++;
    if (g === 0) {
      Cards.again++;
      const copy = { id: it.id, isNew: false, counted: true, again: true };
      Cards.queue.splice(Math.min(Cards.queue.length, Cards.pos + 4), 0, copy);
      addMistake({ k: "card", id: it.id });
    }
    save();
    Cards.pos++; Cards.shown = false;
    pickFront();
    render();
    autoSay();
  }

  // ================================================================ ГРАММАТИКА
  function viewGrammar() {
    const levels = ["A1", "A2", "B1"];
    let n = 0;
    return '<header class="page-head"><div><h1>Грамматика</h1><p class="sub">Gramática paso a paso</p></div><span class="chip">' + Object.keys(S.lessons).length + " из " + LESSONS.length + " пройдено</span></header>" +
      '<p class="muted">Уроки идут по порядку: каждый — короткое объяснение, таблицы, примеры с озвучкой и тест. Урок засчитывается, если в тесте 70% правильных ответов.</p>' +
      levels.map((lv) => {
        const ls = LESSONS.filter((l) => l.level === lv);
        if (!ls.length) return "";
        return '<section class="panel stack"><h2 class="sec">Уровень ' + lv + '</h2><div class="lesson-list">' + ls.map((l) => {
          n++;
          const done = S.lessons[l.id];
          return '<button class="lesson-row" data-act="open-lesson" data-arg="' + l.id + '"><span class="lesson-no">' + pad(n) + '</span><span><span class="lesson-title">' + esc(l.title) + '</span><br><span class="lesson-es">' + esc(l.es) + "</span></span>" +
            (done ? '<span class="chip ok">' + done.score + "%</span>" : '<span class="chip">не пройден</span>') + "</button>";
        }).join("") + "</div></section>";
      }).join("");
  }
  function tableHTML(t, esCols) {
    return '<div class="stack"><p class="caption">' + esc(t.cap) + '</p><div class="table-wrap"><table class="t"><thead><tr>' + t.head.map((h) => "<th>" + esc(h) + "</th>").join("") + "</tr></thead><tbody>" +
      t.rows.map((r) => "<tr>" + r.map((c, i) => '<td class="' + (esCols && i > 0 ? "es" : "") + '">' + esc(c) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div></div>";
  }
  function viewLesson(id) {
    const l = LESSONS.find((x) => x.id === id);
    if (!l) { UI.lesson = null; return viewGrammar(); }
    const idx = LESSONS.indexOf(l);
    const done = S.lessons[l.id];
    const q = UI.quiz[l.id] || (UI.quiz[l.id] = {});
    const tense = l.drill && CONJ.TENSES.find((t) => t.id === l.drill);
    return '<div class="row"><button class="btn quiet sm" data-act="back-grammar">← Все уроки</button></div>' +
      '<header class="page-head"><div><p class="eyebrow">Урок ' + (idx + 1) + " · " + l.level + "</p><h1>" + esc(l.title) + '</h1><p class="sub">' + esc(l.es) + "</p></div>" + (done ? '<span class="chip ok">Пройден · ' + done.score + "%</span>" : "") + "</header>" +
      '<section class="panel stack"><div class="prose">' + l.intro + "</div></section>" +
      (l.tables || []).map((t) => '<section class="panel">' + tableHTML(t) + "</section>").join("") +
      '<section class="panel stack"><h2 class="sec">Примеры</h2><div class="examples">' + l.examples.map((e) => '<div class="ex-row">' + sayBtn(e[0]) + '<div><p class="es">' + esc(e[0]) + '</p><p class="muted small">' + esc(e[1]) + "</p></div></div>").join("") + "</div></section>" +
      (l.tips && l.tips.length ? '<section class="panel stack"><h2 class="sec">Запомнить</h2><ul class="tips">' + l.tips.map((t) => "<li>" + t + "</li>").join("") + "</ul></section>" : "") +
      '<section class="panel stack" id="quiz"><div class="sec-head"><h2 class="sec">Проверьте себя</h2><span class="muted small" id="quizScore">' + quizScoreText(l) + "</span></div>" +
      l.quiz.map((qq, qi) => {
        const ans = q[qi];
        return '<div class="quiz-q" data-q="' + qi + '"><p class="q">' + (qi + 1) + ". " + esc(qq.q) + '</p><div class="quiz-opts">' + qq.o.map((o, oi) => {
          let cls = "opt";
          if (ans != null) { if (oi === qq.a) cls += " right"; else if (oi === ans) cls += " wrong"; }
          return '<button class="' + cls + '" data-act="quiz" data-arg="' + l.id + ":" + qi + ":" + oi + '"' + (ans != null ? " disabled" : "") + ">" + esc(o) + "</button>";
        }).join("") + "</div>" + (ans != null ? '<p class="quiz-exp">' + (ans === qq.a ? "Верно. " : "Неверно. ") + esc(qq.e) + "</p>" : "") + "</div>";
      }).join("") +
      '<div class="row"><button class="btn ghost sm" data-act="quiz-reset" data-arg="' + l.id + '">Пройти тест заново</button>' +
      (tense ? '<button class="btn sm" data-act="drill" data-arg="' + l.drill + '">Тренировать: ' + esc(tense.es) + "</button>" : "") + "</div></section>" +
      '<section class="panel stack"><h2 class="sec">Вопрос по теме</h2><p class="muted small">Что-то непонятно? Спросите Claude — он ответит по-русски с примерами.</p><div data-ai-slot="lessonAsk" data-arg="' + l.id + '"></div></section>' +
      '<div class="row" style="justify-content:space-between">' + (idx > 0 ? '<button class="btn ghost" data-act="open-lesson" data-arg="' + LESSONS[idx - 1].id + '">← ' + esc(LESSONS[idx - 1].title) + "</button>" : "<span></span>") +
      (idx < LESSONS.length - 1 ? '<button class="btn ghost" data-act="open-lesson" data-arg="' + LESSONS[idx + 1].id + '">' + esc(LESSONS[idx + 1].title) + " →</button>" : "") + "</div>";
  }
  function quizScoreText(l) {
    const q = UI.quiz[l.id] || {};
    const answered = Object.keys(q).length;
    if (!answered) return l.quiz.length + " " + plural(l.quiz.length, "вопрос", "вопроса", "вопросов");
    const ok = l.quiz.filter((qq, i) => q[i] === qq.a).length;
    return ok + " из " + l.quiz.length + " верно" + (answered < l.quiz.length ? " · отвечено " + answered : "");
  }
  function answerQuiz(arg) {
    const [lid, qi, oi] = arg.split(":");
    const l = LESSONS.find((x) => x.id === lid);
    const q = UI.quiz[lid] || (UI.quiz[lid] = {});
    if (q[qi] != null) return;
    q[qi] = Number(oi);
    const qq = l.quiz[qi];
    const box = $('.quiz-q[data-q="' + qi + '"]');
    $$(".opt", box).forEach((b, i) => { b.disabled = true; if (i === qq.a) b.classList.add("right"); else if (i === Number(oi)) b.classList.add("wrong"); });
    const p = document.createElement("p");
    p.className = "quiz-exp";
    p.textContent = (Number(oi) === qq.a ? "Верно. " : "Неверно. ") + qq.e;
    box.appendChild(p);
    S.stats.ans++; if (Number(oi) === qq.a) S.stats.ok++;
    $("#quizScore").textContent = quizScoreText(l);
    if (Object.keys(q).length === l.quiz.length) {
      const ok = l.quiz.filter((x, i) => q[i] === x.a).length;
      const score = Math.round(ok / l.quiz.length * 100);
      if (score >= 70) {
        const prev = S.lessons[lid];
        S.lessons[lid] = { score: Math.max(score, prev ? prev.score : 0), date: dayKey() };
        today().lesson++;
        toast("Урок пройден: " + score + "%. ¡Muy bien!");
      } else toast(score + "% — для зачёта нужно 70%. Перечитайте объяснение и попробуйте ещё раз.");
    }
    save();
  }

  // ================================================================ ПРАКТИКА
  function viewPracticeHome() {
    const set = S.settings;
    return '<header class="page-head"><div><h1>Практика</h1><p class="sub">Ejercicios</p></div></header>' +
      '<p class="muted">В каждом упражнении 10 заданий. Слова берутся из тех, что вы уже начали учить в карточках; если их пока мало — из первых тем. Ответ можно набирать без ударений: приложение засчитает, но подскажет правильное написание.</p>' +
      '<div class="tiles">' + PRACTICE_KINDS.map((k) => {
        const disabled = k.id === "mist" && !S.mistakes.length;
        return '<button class="tile" data-act="practice-start" data-arg="' + k.id + '"' + (disabled ? " disabled" : "") + '><span class="tile-title">' + esc(k.title) + (k.id === "mist" ? " · " + S.mistakes.length : "") + '</span><span class="tile-ex">' + esc(k.ex) + '</span><span class="muted small">' + esc(k.desc) + "</span></button>";
      }).join("") + "</div>" +
      '<section class="panel stack"><h2 class="sec">Настройки спряжений</h2><p class="muted small">Какие времена тренировать:</p><div class="seg">' +
      CONJ.TENSES.map((t) => '<button data-act="conj-tense" data-arg="' + t.id + '" aria-pressed="' + set.conjTenses.includes(t.id) + '" title="' + esc(t.ru + ": " + t.hint) + '">' + esc(t.es) + "</button>").join("") + "</div>" +
      '<p class="muted small">Глаголы:</p><div class="seg"><button data-act="conj-set" data-arg="top" aria-pressed="' + (set.conjSet === "top") + '">Самые нужные (' + CONJ.VERBS.filter((v) => v.top).length + ')</button><button data-act="conj-set" data-arg="all" aria-pressed="' + (set.conjSet === "all") + '">Все (' + CONJ.VERBS.length + ")</button></div>" +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Время</th><th>Что выражает</th><th>Пример</th></tr></thead><tbody>' + CONJ.TENSES.map((t) => '<tr><td class="es">' + esc(t.es) + "</td><td>" + esc(t.ru) + '</td><td class="es">' + esc(t.hint) + "</td></tr>").join("") + "</tbody></table></div></section>";
  }

  function wordPool() {
    const seen = shuffle(ALL.filter((c) => S.cards[c.id]));
    if (seen.length >= 12) return seen;
    const extra = ALL.filter((c) => !S.cards[c.id] && enabledDeck(c.deck)).slice(0, 40);
    return seen.concat(shuffle(extra));
  }
  function sentencePool() {
    const out = [];
    const okLen = (s) => { const n = s.split(/\s+/).length; return n >= 3 && n <= 9 && !/[—…]/.test(s); };
    ALL.forEach((c) => { if (c.exEs && S.cards[c.id] && okLen(c.exEs)) out.push({ es: c.exEs, ru: c.exRu }); });
    DIALOGS.forEach((d) => { if (S.dialogs[d.id]) d.lines.forEach((l) => { if (okLen(l[1])) out.push({ es: l[1], ru: l[2] }); }); });
    if (out.length < 20) ALL.slice(0, 120).forEach((c) => { if (c.exEs && okLen(c.exEs)) out.push({ es: c.exEs, ru: c.exRu }); });
    const seen = new Set();
    return shuffle(out.filter((s) => (seen.has(s.es) ? false : seen.add(s.es))));
  }
  function choiceItem(c) {
    const toRu = Math.random() < 0.6;
    const field = toRu ? "ru" : "es";
    const same = shuffle(ALL.filter((x) => x.deck === c.deck && x.id !== c.id && x[field] !== c[field]));
    const others = shuffle(ALL.filter((x) => x.deck !== c.deck && x[field] !== c[field]));
    const opts = [c[field]];
    for (const x of same.concat(others)) { if (opts.length >= 4) break; if (!opts.includes(x[field])) opts.push(x[field]); }
    return { t: "choice", card: c, q: toRu ? c.es : c.ru, qEs: toRu, opts: shuffle(opts), a: c[field], say: c.es, mk: { k: "card", id: c.id } };
  }
  function typeItem(c) {
    return { t: "type", card: c, q: c.ru, answers: answersFor(c), say: c.es, show: c.es, mk: { k: "card", id: c.id } };
  }
  const tokenize = (s) => s.split(/\s+/).map((t) => t.replace(/^[¿¡"«(]+|[?!.,;:"»)]+$/g, "")).filter(Boolean);
  function buildItem(s, pool) {
    const toks = tokenize(s.es);
    const lower = new Set(toks.map((t) => t.toLowerCase()));
    const extras = [];
    for (const o of shuffle(pool)) {
      if (extras.length >= 2) break;
      for (const t of shuffle(tokenize(o.es))) { const lt = t.toLowerCase(); if (!lower.has(lt) && t.length > 2 && !extras.includes(t)) { extras.push(t); break; } }
    }
    return { t: "build", q: s.ru, answer: s.es, tokens: shuffle(toks.concat(extras).map((t, i) => ({ t, i }))), say: s.es, mk: { k: "sent", es: s.es, ru: s.ru } };
  }
  function dictItem(s) { return { t: "dict", say: s.es, answers: [s.es], ru: s.ru, show: s.es, mk: { k: "sent", es: s.es, ru: s.ru } }; }
  function conjItem(fixed) {
    let v, t, forms;
    if (fixed) { v = CONJ.VERBS.find((x) => x.inf === fixed.inf); t = fixed.tense; forms = v && CONJ.conjugate(v, t); }
    if (!forms) {
      const tenses = S.settings.conjTenses.length ? S.settings.conjTenses : ["pres"];
      const verbs = CONJ.VERBS.filter((x) => S.settings.conjSet === "all" || x.top);
      for (let k = 0; k < 30 && !forms; k++) { v = pick(verbs); t = pick(tenses); forms = CONJ.conjugate(v, t); }
    }
    const persons = t === "imp" ? CONJ.IMP_PERSONS : CONJ.PERSONS;
    const p = fixed && fixed.p != null && fixed.p < forms.length ? fixed.p : Math.floor(Math.random() * forms.length);
    return { t: "conj", v, tense: t, p, persons, forms, answers: [forms[p]], show: forms[p], say: forms[p], mk: { k: "conj", inf: v.inf, tense: t, p } };
  }
  function itemFromMistake(m) {
    if (m.k === "card") { const c = BY_ID.get(m.id); if (!c) return null; return typeable(c) ? typeItem(c) : choiceItem(c); }
    if (m.k === "conj") return conjItem(m);
    if (m.k === "sent") return buildItem(m, sentencePool());
    return null;
  }
  function genItems(kind) {
    const N = 10;
    if (kind === "choice") return wordPool().slice(0, N).map(choiceItem);
    if (kind === "type") return wordPool().filter(typeable).slice(0, N).map(typeItem);
    if (kind === "build") { const sp = sentencePool(); return sp.slice(0, N).map((s) => buildItem(s, sp)); }
    if (kind === "dict") return sentencePool().filter((s) => s.es.split(" ").length <= 8 && hasRecording(s.es)).slice(0, N).map(dictItem);
    if (kind === "conj") return Array.from({ length: N }, () => conjItem());
    if (kind === "mist") return S.mistakes.slice(0, N).map((m) => { const it = itemFromMistake(m); if (it) it.fromMistake = mistakeKey(m); return it; }).filter(Boolean);
    return [];
  }
  function startPractice(kind) {
    const items = genItems(kind);
    if (!items.length) { toast(kind === "mist" ? "Список ошибок пуст — отлично!" : "Пока мало материала. Начните с карточек."); return; }
    preload(items.map((it) => it.say));
    Object.assign(P, { active: true, kind, items, i: 0, ok: 0, answered: false, wrong: [], result: null });
    resetBuild();
    render(); window.scrollTo(0, 0);
    if (kind === "dict") setTimeout(() => speak(items[0].say), 250);
  }
  function resetBuild() { P.built = []; }
  const mistakeKey = (m) => m.k === "card" ? "c:" + m.id : m.k === "conj" ? "v:" + m.inf + ":" + m.tense + ":" + m.p : "s:" + m.es;
  function addMistake(m) {
    const key = mistakeKey(m);
    S.mistakes = [m].concat(S.mistakes.filter((x) => mistakeKey(x) !== key)).slice(0, 150);
  }
  function removeMistake(key) { S.mistakes = S.mistakes.filter((x) => mistakeKey(x) !== key); }
  const KIND_LABEL = { choice: "Выберите перевод", type: "Переведите на испанский", build: "Соберите фразу по-испански", dict: "Запишите, что услышали", conj: "Поставьте глагол в нужную форму" };

  function viewPractice() {
    const it = P.items[P.i];
    if (!it) return viewPracticeDone();
    const kind = PRACTICE_KINDS.find((k) => k.id === P.kind);
    let body = '<p class="q-kind">' + esc(KIND_LABEL[it.t]) + "</p>";
    if (it.t === "choice") {
      body += '<div class="row">' + '<p class="q-text ' + (it.qEs ? "es" : "ru") + '">' + esc(it.q) + "</p>" + (it.qEs ? sayBtn(it.say) : "") + "</div>" +
        '<div class="options">' + it.opts.map((o, i) => '<button class="opt ' + (it.qEs ? "" : "es") + '" data-act="choose" data-arg="' + i + '"><kbd>' + (i + 1) + "</kbd><span>" + esc(o) + "</span></button>").join("") + "</div>";
    } else if (it.t === "type" || it.t === "dict" || it.t === "conj") {
      if (it.t === "type") body += '<p class="q-text ru">' + esc(it.q) + "</p>" + (it.card.note ? '<p class="muted small">' + esc(it.card.note) + "</p>" : "");
      if (it.t === "dict") body += '<div class="row">' + sayBtn(it.say, "lg") + '<button class="btn ghost sm" data-act="say-slow" data-text="' + esc(it.say) + '">' + ICON.slow.replace("<svg", '<svg width="16" height="16"') + " Медленно</button></div>";
      if (it.t === "conj") {
        const tn = CONJ.TENSES.find((t) => t.id === it.tense);
        body += '<div class="conj-verb"><span class="es">' + esc(it.v.inf) + '</span><span class="muted">' + esc(it.v.ru) + "</span></div>" +
          '<div class="row"><span class="chip acc">' + esc(tn.es) + '</span><span class="chip">' + esc(tn.ru) + '</span></div><p class="conj-person">' + esc(it.persons[it.p]) + " …</p>";
      }
      body += '<form class="stack" data-form="answer"><input type="text" class="answer-input" id="ans" lang="es" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + (it.t === "conj" && /perf|plusc|cont|irA/.test(it.tense) ? "полностью, например: he hablado" : "ваш ответ") + '" data-autofocus>' +
        keysHTML() + '<div class="row"><button class="btn">Проверить <kbd>Enter</kbd></button><button type="button" class="btn ghost" data-act="dunno">Не знаю</button></div></form>';
    } else if (it.t === "build") {
      const used = new Set(P.built);
      body += '<p class="q-text ru">' + esc(it.q) + "</p>" +
        '<div class="tokens built" aria-label="Ваша фраза">' + (P.built.length ? P.built.map((idx) => { const tk = it.tokens.find((x) => x.i === idx); return '<button class="tok" data-act="untok" data-arg="' + idx + '">' + esc(tk.t) + "</button>"; }).join("") : '<span class="muted small">Нажимайте на слова ниже по порядку. Лишние слова не используйте.</span>') + "</div>" +
        '<div class="tokens">' + it.tokens.filter((tk) => !used.has(tk.i)).map((tk) => '<button class="tok" data-act="tok" data-arg="' + tk.i + '">' + esc(tk.t) + "</button>").join("") + "</div>" +
        '<div class="row"><button class="btn" data-act="build-check"' + (P.built.length ? "" : " disabled") + '>Проверить</button><button class="btn ghost" data-act="build-reset">Сбросить</button><button class="btn ghost" data-act="dunno">Не знаю</button></div>';
    }
    return '<div class="sess-top"><button class="btn quiet sm" data-act="practice-exit">← Выйти</button><div class="progress" aria-hidden="true"><i style="width:' + (P.i / P.items.length * 100) + '%"></i></div><span class="muted small num">' + (P.i + 1) + " / " + P.items.length + "</span></div>" +
      '<p class="eyebrow">' + esc(kind ? kind.title : "") + "</p>" +
      '<section class="panel q-panel" id="qpanel">' + body + '<div id="fb"></div></section>';
  }
  function feedback(ok, extra) {
    const it = P.items[P.i];
    P.answered = true;
    const d = today();
    S.stats.ans++;
    if (ok) { P.ok++; S.stats.ok++; d.ok++; if (it.fromMistake) removeMistake(it.fromMistake); }
    else { d.bad++; P.wrong.push(it); addMistake(it.mk); }
    save();
    $$("#qpanel input, #qpanel .tok, #qpanel .key, #qpanel [data-act=dunno], #qpanel [data-act=build-check], #qpanel [data-act=build-reset], #qpanel form .btn").forEach((b) => { b.disabled = true; });
    const right = it.t === "choice" ? it.a : it.t === "build" ? it.answer : it.show;
    const esRight = it.t !== "choice" || !it.qEs;
    let html = '<div class="feedback ' + (ok ? "ok" : "bad") + '"><p class="head">' + (ok ? pick(["¡Correcto!", "¡Muy bien!", "¡Exacto!", "¡Perfecto!"]) : "Не совсем") + "</p>";
    if (extra) html += "<p>" + extra + "</p>";
    if (!ok || it.t !== "choice") html += '<div class="row"><p class="ans' + (esRight ? "" : " ru") + '">' + esc(right) + "</p>" + (esRight ? sayBtn(right) : sayBtn(it.say)) + "</div>";
    if (it.t === "dict" || it.t === "build") html += '<p class="muted small">' + esc(it.ru || it.q) + "</p>";
    if (it.card && it.card.exEs && it.t !== "build") html += '<p class="small"><span class="es">' + esc(it.card.exEs) + '</span> — <span class="muted">' + esc(it.card.exRu) + "</span></p>";
    if (it.t === "conj") {
      html += '<div class="table-wrap"><table class="t"><tbody>' + it.forms.map((f, i) => '<tr class="' + (i === it.p ? "hl" : "") + '"><td>' + esc(it.persons[i]) + '</td><td class="es">' + esc(f) + "</td></tr>").join("") + "</tbody></table></div>";
    }
    if (!ok) html += '<div data-ai-slot="explain"></div>';
    html += '<div class="row"><button class="btn" data-act="next" data-autofocus>' + (P.i + 1 < P.items.length ? "Дальше" : "Итоги") + " <kbd>Enter</kbd></button></div></div>";
    const fb = $("#fb");
    fb.innerHTML = html;
    refreshAISlots();
    setTimeout(() => { const b = $("[data-act=next]", fb); if (b) b.focus({ preventScroll: true }); fb.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, 30);
    if (ok && it.t !== "dict" && it.say) speak(it.say);
  }
  function submitAnswer(given) {
    const it = P.items[P.i];
    if (P.answered) return;
    const r = checkAnswer(given, it.answers, { articles: it.t === "type" });
    if (r.empty) { toast("Введите ответ или нажмите «Не знаю»."); return; }
    let extra = "";
    if (r.accent) extra = r.ok ? "Засчитано, но проверьте ударения." : "Почти: не хватает ударений.";
    if (r.article) extra = "Засчитано, но обратите внимание на артикль.";
    if (!r.ok) extra = (extra ? extra + " " : "") + "Ваш ответ: <span class=\"es\">" + esc(given) + "</span>";
    it.given = given;
    feedback(r.ok, extra);
  }
  function nextItem() {
    P.i++; P.answered = false; resetBuild();
    if (P.i >= P.items.length) { const d = today(); d.prac++; d.pk = d.pk || {}; d.pk[P.kind] = (d.pk[P.kind] || 0) + 1; save(); }
    render();
    const it = P.items[P.i];
    if (it && it.t === "dict") setTimeout(() => speak(it.say), 200);
  }
  function viewPracticeDone() {
    const n = P.items.length;
    return '<section class="panel stack" style="text-align:center;justify-items:center;padding:36px 24px"><p class="eyebrow">Resultado</p><h1 class="hero-date">' + P.ok + " из " + n + "</h1>" +
      "<p>" + (P.ok === n ? "Без единой ошибки. ¡Excelente!" : P.ok >= n * 0.7 ? "Хороший результат. Ошибки сохранены в «Работе над ошибками»." : "Есть над чем поработать — ошибки сохранены, их можно повторить отдельно.") + "</p>" +
      '<div class="row" style="justify-content:center"><button class="btn" data-act="practice-start" data-arg="' + P.kind + '">Ещё раз</button><button class="btn ghost" data-act="go" data-arg="practice">Другие упражнения</button><button class="btn ghost" data-act="go" data-arg="today">План на сегодня</button></div></section>' +
      (P.wrong.length ? '<section class="panel stack"><h2 class="sec">Ошибки</h2><div class="wordlist">' + P.wrong.map((it) => {
        const right = it.t === "choice" ? it.a : it.t === "build" ? it.answer : it.show;
        const q = it.t === "dict" ? it.ru : it.t === "conj" ? it.v.inf + " · " + it.persons[it.p] : it.q;
        return '<div class="wordrow">' + sayBtn(it.say) + '<span class="es">' + esc(right) + '</span><span class="ru">' + esc(q) + "</span><span></span></div>";
      }).join("") + "</div></section>" : "");
  }

  // ================================================================ ДИАЛОГИ И ЧАТ
  function viewTalk() {
    return '<header class="page-head"><div><h1>Диалоги</h1><p class="sub">Situaciones de la vida real</p></div></header>' +
      '<section class="panel stack"><div class="sec-head"><h2 class="sec">Разговор с Claude</h2><span class="chip acc">ролевая сцена</span></div><p class="muted">Claude играет продавца, хозяйку квартиры, сотрудника банка или нового знакомого и говорит как житель страны «' + esc(country().ru) + '». После каждой вашей реплики он показывает ошибки и более естественный вариант.</p><div class="row"><button class="btn" data-act="open-chat">Начать разговор</button></div></section>' +
      '<section class="stack"><div class="sec-head"><h2 class="sec">Сцены для переезда</h2><span class="muted small">' + Object.keys(S.dialogs).length + " из " + DIALOGS.length + ' пройдено</span></div><div class="tiles">' +
      DIALOGS.map((d) => '<button class="tile" data-act="open-dialog" data-arg="' + d.id + '"><span class="tile-title">' + esc(d.title) + '</span><span class="tile-ex">' + esc(d.place) + '</span><span class="muted small">' + d.lines.length + " реплик · " + d.vocab.length + " новых выражений" + (S.dialogs[d.id] ? " · пройден" : "") + "</span></button>").join("") +
      "</div></section>";
  }
  const Dlg = { hideMine: false, showTr: false, playing: -1, revealed: new Set() };
  function viewDialog(id) {
    const d = DIALOGS.find((x) => x.id === id);
    if (!d) { UI.talk = { mode: "list", id: null }; return viewTalk(); }
    return '<div class="row"><button class="btn quiet sm" data-act="back-talk">← Все сцены</button></div>' +
      '<header class="page-head"><div><p class="eyebrow">' + esc(d.place) + "</p><h1>" + esc(d.title) + '</h1></div><div class="row"><button class="btn" data-act="play-all">' + (Dlg.playing >= 0 ? "Остановить" : "Прослушать весь диалог") + "</button></div></header>" +
      '<div class="row"><label class="check"><input type="checkbox" data-act="dlg-tr"' + (Dlg.showTr ? " checked" : "") + '> Показывать перевод</label><label class="check"><input type="checkbox" data-act="dlg-hide"' + (Dlg.hideMine ? " checked" : "") + "> Тренировка: скрыть мои реплики (вспомните их сами, потом нажмите)</label></div>" +
      '<section class="lines" id="lines">' + d.lines.map((l, i) => {
        const me = l[0] === "me";
        const hidden = me && Dlg.hideMine && !Dlg.revealed.has(i);
        return '<div class="line ' + (me ? "me" : "") + (Dlg.playing === i ? " playing" : "") + '" data-line="' + i + '">' + sayBtn(l[1]) +
          '<div class="bubble' + (hidden ? " hidden-line" : "") + '"' + (hidden ? ' data-act="reveal" data-arg="' + i + '" role="button" tabindex="0" aria-label="Показать реплику"' : "") + '><span class="who">' + (me ? "Вы" : esc(d.other)) + '</span><p class="es">' + esc(l[1]) + "</p>" +
          '<p class="tr"' + (Dlg.showTr || hidden ? "" : " hidden") + ">" + esc(l[2]) + "</p></div></div>";
      }).join("") + "</section>" +
      '<section class="panel stack"><h2 class="sec">Выражения из диалога</h2><div class="wordlist">' + d.vocab.map((v, i) => {
        const added = S.custom.some((w) => w[0] === v[0]);
        return '<div class="wordrow">' + sayBtn(v[0]) + '<span class="es">' + esc(v[0]) + '</span><span class="ru">' + esc(v[1]) + "</span>" +
          (added ? '<span class="chip ok">в моих словах</span>' : '<button class="btn quiet sm" data-act="vocab-add" data-arg="' + d.id + ":" + i + '">+ в карточки</button>') + "</div>";
      }).join("") + "</div></section>" +
      '<div class="row"><button class="btn" data-act="dialog-done" data-arg="' + d.id + '">' + (S.dialogs[d.id] ? "Пройден ✓ · отметить ещё раз" : "Отметить как пройденный") + '</button><button class="btn ghost" data-act="open-chat" data-arg="' + d.id + '">Разыграть сцену с Claude</button></div>';
  }
  function playAll(d) {
    if (Dlg.playing >= 0) { stopPlay(); return; }
    let i = 0;
    const mark = (k) => { Dlg.playing = k; $$(".line").forEach((el) => el.classList.toggle("playing", Number(el.dataset.line) === k)); const b = $("[data-act=play-all]"); if (b) b.textContent = k >= 0 ? "Остановить" : "Прослушать весь диалог"; };
    const next = () => {
      if (i >= d.lines.length || route !== "talk" || UI.talk.mode !== "dialog" || UI.talk.id !== d.id) { mark(-1); return; }
      mark(i);
      const el = $('.line[data-line="' + i + '"]'); if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      speak(d.lines[i][1], false, () => { i++; setTimeout(() => { if (Dlg.playing >= 0) next(); }, 350); });
    };
    next();
  }
  function stopPlay() { Dlg.playing = -1; stopAudio(); $$(".line").forEach((el) => el.classList.remove("playing")); const b = $("[data-act=play-all]"); if (b) b.textContent = "Прослушать весь диалог"; }

  function scenarios() {
    return [{ id: "free", title: "Свободный разговор", role: "дружелюбный местный житель, с которым ученик только что познакомился", desc: "знакомство и разговор о жизни, переезде, работе и городе" }]
      .concat(DIALOGS.map((d) => ({ id: d.id, title: d.title, role: d.role, desc: d.title + " (" + d.place + ")" })));
  }
  function chatRules(sc) {
    const c = country(), lv = S.settings.level;
    return "Ты — партнёр по разговорной практике испанского. Ученик — русскоязычный взрослый, уровень примерно " + lv + ", переезжает жить в страну: " + c.ru + ".\n" +
      "Сцена: " + sc.desc + ". Твоя роль: " + sc.role + ". Ученик играет самого себя.\n" +
      "Правила:\n- Говори как житель страны " + c.es + ": местная лексика и обороты" + (c.voseo ? ", voseo (vos tenés, vos sos)" : "") + "; во множественном числе — ustedes, не vosotros.\n" +
      "- Реплика: 1–3 коротких предложения, лексика уровня " + lv + ". Двигай сцену: реагируй на ответы и задавай вопросы, чтобы ученику было что сказать.\n" +
      "- Если ученик пишет по-русски или смешивает языки, продолжай сцену по-испански, а в поле better покажи, как сказать его мысль по-испански.\n" +
      "- Исправляй только реальные ошибки ПОСЛЕДНЕГО сообщения ученика (грамматика, выбор слова, согласование, пропущенные ударения). Пояснения — по-русски, одной фразой.\n" +
      'Ответь только JSON-объектом: {"reply":"твоя реплика по-испански","translation":"перевод реплики на русский","corrections":[{"wrong":"фрагмент ученика","right":"правильно","why":"пояснение по-русски"}],"better":"естественная версия всей фразы ученика по-испански или пустая строка"}\n' +
      "Для первой реплики сцены corrections — пустой массив, better — пустая строка.";
  }
  function viewChat() {
    const sc = scenarios();
    return '<div class="row"><button class="btn quiet sm" data-act="back-talk">← Диалоги</button></div>' +
      '<header class="page-head"><div><h1>Разговор с Claude</h1><p class="sub">Conversación · ' + esc(country().es) + "</p></div></header>" +
      '<section class="panel stack"><div class="grid-2"><label class="field">Сцена<select id="chatScenario" data-act="chat-scenario">' + sc.map((s) => '<option value="' + s.id + '"' + (s.id === Chat.scenario ? " selected" : "") + ">" + esc(s.title) + "</option>").join("") + '</select></label>' +
      '<div class="stack" style="align-content:end"><p class="muted small">Уровень ' + esc(S.settings.level) + ", страна: " + esc(country().ru) + ". Поменять можно в «Прогрессе».</p></div></div></section>" +
      '<div data-ai-slot="chat"></div>';
  }
  function chatBody() {
    if (!AI.fn) return '<section class="panel">' + aiNote() + "</section>";
    let html = '<section class="chat-box lines" id="chatLog">';
    if (!Chat.msgs.length && !Chat.busy) html += '<div class="panel stack"><p>Claude начнёт сцену первым. Отвечайте по-испански; если не знаете слова — пишите по-русски, он подскажет.</p><div class="row"><button class="btn" data-act="chat-begin">Начать сцену</button></div></div>';
    Chat.msgs.forEach((m, i) => {
      if (m.who === "ai") {
        html += '<div class="line">' + sayBtn(m.es) + '<div class="bubble"><span class="who">Claude</span><p class="es">' + esc(m.es) + '</p><p class="tr"' + (m.showTr ? "" : " hidden") + ">" + esc(m.ru) + '</p><button class="btn quiet sm" data-act="chat-tr" data-arg="' + i + '" style="justify-self:start;padding-inline:0">' + (m.showTr ? "Скрыть перевод" : "Перевод") + "</button></div></div>";
      } else {
        html += '<div class="line me"><div class="bubble"><span class="who">Вы</span><p class="es">' + esc(m.es) + "</p></div></div>";
        if (m.corr || m.better) {
          html += '<div class="corr" style="justify-self:end;max-width:85%">' +
            (m.corr && m.corr.length ? m.corr.map((c) => '<div><span class="w">' + esc(c.wrong) + '</span> → <span class="r">' + esc(c.right) + '</span><br><span class="muted">' + esc(c.why) + "</span></div>").join("") : '<div class="r" style="font-family:var(--f-body)">Без ошибок ✓</div>') +
            (m.better ? '<div><span class="muted">Естественнее:</span> <span class="es">' + esc(m.better) + "</span> " + sayBtn(m.better) + "</div>" : "") +
            (m.deep ? "" : '<div><button class="btn quiet sm" data-act="chat-deep" data-arg="' + i + '" style="padding-inline:0">Подробный разбор</button></div>') + '<div class="ai-text" id="deep' + i + '">' + (m.deep ? md(m.deep) : "") + "</div></div>";
        }
      }
    });
    if (Chat.busy) html += '<div class="line"><span></span><div class="bubble"><p class="typing">Claude печатает…</p></div></div>';
    if (Chat.error) html += '<p class="muted small">' + esc(Chat.error) + "</p>";
    html += "</section>";
    if (Chat.msgs.length) {
      html += '<form class="stack" data-form="chat"><div class="chat-input"><textarea id="chatIn" lang="es" placeholder="Ваш ответ по-испански… (Enter — отправить, Shift+Enter — новая строка)"' + (Chat.busy ? " disabled" : "") + ' data-autofocus></textarea><button class="btn"' + (Chat.busy ? " disabled" : "") + ">Отправить</button></div>" + keysHTML() +
        '<div class="row"><button type="button" class="btn ghost sm" data-act="chat-reset">Начать сцену заново</button></div></form>';
    }
    return html;
  }
  async function chatSend(text) {
    if (!AI.fn || Chat.busy) return;
    const sc = scenarios().find((s) => s.id === Chat.scenario) || scenarios()[0];
    if (text) { Chat.msgs.push({ who: "me", es: text }); Chat.turns.push({ role: "user", content: text }); today().chat++; }
    Chat.busy = true; Chat.error = "";
    refreshAISlots(); afterChat();
    const history = Chat.turns.slice(-16);
    const input = [{ role: "user", content: chatRules(sc) }, { role: "user", content: "Начни сцену своей первой репликой." }].concat(history);
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
      save();
    } catch (e) {
      Chat.error = aiError(e);
    } finally {
      Chat.busy = false; Chat.ctl = null;
      if (route === "talk" && UI.talk.mode === "chat") { refreshAISlots(); afterChat(); }
    }
  }
  function afterChat() {
    const ta = $("#chatIn");
    if (ta && !ta.disabled) ta.focus({ preventScroll: true });
    const log = $("#chatLog");
    if (log) log.lastElementChild && log.lastElementChild.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  function chatReset() {
    if (Chat.ctl) Chat.ctl.abort();
    Object.assign(Chat, { turns: [], msgs: [], busy: false, error: "" });
  }

  // ================================================================ ПРОГРЕСС
  function heatmap() {
    const weeks = 18;
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (weeks * 7 - 1));
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    let html = '<div class="heat" role="img" aria-label="Минуты занятий по дням за последние ' + weeks + ' недель">';
    const tk = dayKey();
    for (let d = new Date(start); dayKey(d) <= addDays(tk, 6 - ((end.getDay() + 6) % 7)); d.setDate(d.getDate() + 1)) {
      const k = dayKey(d);
      if (k > tk) { html += '<i class="fut"></i>'; continue; }
      const m = ((S.days[k] || {}).sec || 0) / 60;
      const lv = m <= 0 ? 0 : m < 10 ? 1 : m < 25 ? 2 : m < 45 ? 3 : 4;
      html += '<i class="h' + lv + '" title="' + k + ": " + Math.round(m) + ' мин"></i>';
    }
    return html + "</div>";
  }
  function viewProgress() {
    const st = streak();
    const totalMin = Math.round(Object.values(S.days).reduce((a, d) => a + (d.sec || 0), 0) / 60);
    const learned = ALL.filter((c) => status(c.id) === "learned").length;
    const acc = S.stats.ans ? Math.round(S.stats.ok / S.stats.ans * 100) + "%" : "—";
    const set = S.settings;
    const voices = Voice.list;
    const cur = Voice.ok ? chooseVoice() : null;
    return '<header class="page-head"><div><h1>Прогресс</h1><p class="sub">Tu avance</p></div></header>' +
      '<section class="panel"><div class="stats">' + stat(st + " " + plural(st, "день", "дня", "дней"), "подряд по 10+ минут") + stat(totalMin >= 120 ? (totalMin / 60).toFixed(1).replace(".", ",") + " ч" : totalMin + " мин", "всего занятий") + stat(learned, "слов выучено") + stat(acc, "верных ответов") + "</div></section>" +
      '<section class="panel stack"><div class="sec-head"><h2 class="sec">Занятия по дням</h2><div class="legend"><span>0</span><span class="l2">до 25 мин</span><span class="l1">45+ мин</span></div></div><div class="heat-wrap">' + heatmap() + "</div></section>" +
      '<section class="panel stack"><h2 class="sec">Слова по темам</h2><div class="deckbars">' + deckList().filter((d) => d.words.length).map((d) => { const dc = deckCounts(d.id); return '<div class="deckbar"><span>' + esc(d.title) + "</span>" + deckBar(dc) + '<span class="n num">' + dc.learned + "/" + dc.total + "</span></div>"; }).join("") + "</div></section>" +
      '<section class="panel stack"><h2 class="sec">Настройки</h2>' +
      '<div class="grid-2"><label class="field">Страна переезда<select data-set="country">' + Object.entries(COUNTRIES).map(([k, c]) => '<option value="' + k + '"' + (set.country === k ? " selected" : "") + ">" + esc(c.ru) + "</option>").join("") + "</select></label>" +
      '<label class="field">Уровень (для Claude и подсказок)<select data-set="level">' + ["A1", "A2", "B1"].map((l) => '<option' + (set.level === l ? " selected" : "") + ">" + l + "</option>").join("") + "</select></label></div>" +
      '<div class="stack"><p class="small" style="font-weight:500">Время в день</p><div class="seg">' + [20, 30, 45, 60].map((m) => '<button data-act="set-minutes" data-arg="' + m + '" aria-pressed="' + (set.minutes === m) + '">' + m + " мин</button>").join("") + "</div></div>" +
      '<div class="grid-2"><label class="field">Новых слов в день<input type="number" min="0" max="50" data-set="newPerDay" value="' + set.newPerDay + '"></label>' +
      '<label class="field">Направление карточек<select data-set="dir"><option value="mixed"' + (set.dir === "mixed" ? " selected" : "") + '>Вперемешку</option><option value="es"' + (set.dir === "es" ? " selected" : "") + '>Испанский → русский</option><option value="ru"' + (set.dir === "ru" ? " selected" : "") + ">Русский → испанский</option></select></label></div>" +
      '<label class="check"><input type="checkbox" data-set="autoplay"' + (set.autoplay ? " checked" : "") + "> Автоматически озвучивать испанское слово на карточке</label>" +
      '<label class="check"><input type="checkbox" data-set="soft"' + (set.soft ? " checked" : "") + "> Мягкая проверка: засчитывать ответ без ударений и показывать правильное написание</label></section>" +
      '<section class="panel stack"><h2 class="sec">Озвучка</h2>' +
      '<p>Слова, примеры, диалоги и примеры из уроков записаны нейросетевыми голосами с мексиканским произношением: Далия читает слова и примеры, в диалогах звучат Хорхе и Алонсо. Запись работает в любом браузере, ничего устанавливать не нужно.</p>' +
      '<label class="field">Скорость: <span id="rateVal" class="num">' + Number(set.rate).toFixed(2) + '</span><input type="range" min="0.6" max="1.2" step="0.05" data-set="rate" value="' + set.rate + '"></label>' +
      '<div class="row"><button class="btn ghost sm" data-act="say" data-text="Hola, ¿cómo estás? Bienvenido a tu nueva ciudad.">Прослушать пример</button></div>' +
      '<h3 class="caption" style="margin-top:8px">Голос браузера</h3><p class="muted small">Нужен только для того, что нельзя записать заранее: формы глаголов в тренажёре, ответы Claude и ваши собственные слова.</p>' +
      (Voice.ok ? '<label class="field">Голос<select id="voiceSel" data-set="voice"><option value="">Автовыбор (сейчас: ' + esc(cur ? cur.name + ", " + cur.lang : "испанский голос не найден") + ")</option>" + voices.map((v) => '<option value="' + esc(v.voiceURI) + '"' + (set.voice === v.voiceURI ? " selected" : "") + ">" + esc(v.name + " — " + v.lang) + "</option>").join("") + "</select></label>" : "<p>Этот браузер не умеет синтезировать речь.</p>") +
      (cur ? "" : '<p class="muted small">Испанского голоса в браузере нет, поэтому формы глаголов и ответы Claude звучать не будут. Чтобы добавить голос: в Windows откройте «Параметры → Время и язык → Речь → Добавить голоса», установите «Español (México)» и перезапустите браузер. Либо откройте приложение в Microsoft Edge: там испанские голоса есть сразу.</p>') + "</section>" +
      '<section class="panel stack"><h2 class="sec">Данные</h2><p class="muted small">' + (Sync.state === "cloud" ? "Прогресс автоматически сохраняется в вашем аккаунте Claude и доступен на любом устройстве, где вы открываете это приложение." : "Прогресс хранится в этом браузере. Сделайте резервную копию, чтобы не потерять его при очистке данных браузера.") + "</p>" +
      '<div class="row"><button class="btn ghost sm" data-act="export-copy">Скопировать резервную копию</button><button class="btn ghost sm" data-act="export-file" data-needs-dl hidden>Сохранить файлом</button></div>' +
      '<textarea id="exportBox" readonly hidden></textarea>' +
      '<label class="field">Восстановить из копии<textarea id="importBox" placeholder="Вставьте сюда текст резервной копии"></textarea></label>' +
      '<div class="row"><button class="btn ghost sm" data-act="import-text">Восстановить</button><label class="btn ghost sm" style="cursor:pointer">Из файла…<input type="file" accept=".json,application/json,text/plain" id="importFile" hidden></label></div>' +
      (UI.confirmReset ? '<div class="confirm"><p><b>Удалить весь прогресс?</b> Карточки, уроки, статистика и свои слова будут стёрты. Это нельзя отменить.</p><div class="row"><button class="btn danger sm" data-act="reset-yes">Да, удалить всё</button><button class="btn ghost sm" data-act="reset-no">Отмена</button></div></div>' : '<div class="row"><button class="btn quiet sm" data-act="reset-ask" style="color:var(--bad)">Сбросить прогресс…</button></div>') +
      "</section>";
  }
  function importState(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { toast("Не получилось прочитать копию: это не похоже на текст резервной копии."); return; }
    if (!data || typeof data !== "object" || !data.settings || !data.cards) { toast("В этом тексте нет данных приложения. Проверьте, что скопировали копию целиком."); return; }
    S = merge(data); S.updatedAt = Date.now(); saveLocal(); Sync.soon(200); buildCards();
    toast("Прогресс восстановлен.");
    render();
  }

  // ================================================================ события
  const ACT = {
    go: (b) => go(b.dataset.arg),
    say: (b) => { if (Dlg.playing >= 0) stopPlay(); speak(b.dataset.text); },
    "say-slow": (b) => { if (Dlg.playing >= 0) stopPlay(); speak(b.dataset.text, true); },
    "cards-start": () => startCards(),
    "cards-more": () => startCards({ extraNew: 10, onlyNew: true }),
    "cards-deck": (b) => startCards({ deck: b.dataset.arg, extraNew: 0 }),
    "cards-deck-new": (b) => startCards({ deck: b.dataset.arg, extraNew: 10, onlyNew: true }),
    "cards-exit": () => { Cards.active = false; save(); render(); },
    flip: () => { Cards.shown = true; render(); if (S.settings.autoplay && Cards.front === "ru") speak(BY_ID.get(Cards.queue[Cards.pos].id).es); },
    grade: (b) => doGrade(Number(b.dataset.arg)),
    "open-deck": (b) => { const dk = deckById(b.dataset.arg); if (dk && dk.words[0]) preload([dk.words[0][0]]); UI.deck = b.dataset.arg; render(); window.scrollTo(0, 0); },
    "back-words": () => { UI.deck = null; render(); },
    "deck-toggle": (b) => { const id = b.dataset.arg; S.settings.decksOff = b.checked ? S.settings.decksOff.filter((x) => x !== id) : S.settings.decksOff.concat([id]); save(); render(); },
    "open-lesson": (b) => { preload([LESSONS[0].examples[0][0]]); route = "grammar"; UI.lesson = b.dataset.arg; Cards.active = P.active = false; syncHash(); render(); window.scrollTo(0, 0); },
    "back-grammar": () => { UI.lesson = null; render(); },
    quiz: (b) => answerQuiz(b.dataset.arg),
    "quiz-reset": (b) => { UI.quiz[b.dataset.arg] = {}; render(); const q = $("#quiz"); if (q) q.scrollIntoView({ block: "start" }); },
    drill: (b) => { S.settings.conjTenses = [b.dataset.arg]; save(); route = "practice"; syncHash(); startPractice("conj"); },
    "practice-start": (b) => { route = "practice"; syncHash(); startPractice(b.dataset.arg); },
    "practice-exit": () => { P.active = false; render(); },
    choose: (b) => {
      if (P.answered) return;
      const it = P.items[P.i], i = Number(b.dataset.arg), ok = it.opts[i] === it.a;
      $$(".opt").forEach((o, k) => { o.disabled = true; if (it.opts[k] === it.a) o.classList.add("right"); else if (k === i) o.classList.add("wrong"); });
      it.given = it.opts[i];
      feedback(ok, ok ? "" : "Ваш выбор: " + esc(it.opts[i]));
    },
    dunno: () => { if (P.answered) return; P.items[P.i].given = "(не знаю)"; feedback(false, ""); },
    next: () => nextItem(),
    tok: (b) => { if (P.answered) return; P.built.push(Number(b.dataset.arg)); render(); },
    untok: (b) => { if (P.answered) return; P.built = P.built.filter((x) => x !== Number(b.dataset.arg)); render(); },
    "build-reset": () => { if (P.answered) return; P.built = []; render(); },
    "build-check": () => {
      if (P.answered) return;
      const it = P.items[P.i];
      const text = P.built.map((idx) => it.tokens.find((x) => x.i === idx).t).join(" ");
      const ok = norm(text) === norm(it.answer) || stripAcc(norm(text)) === stripAcc(norm(it.answer));
      it.given = text;
      feedback(ok, ok ? "" : "Ваш вариант: <span class=\"es\">" + esc(text) + "</span>");
    },
    explain: async () => {
      const it = P.items[P.i];
      const out = $("#explainOut");
      const right = it.t === "choice" ? it.a : it.t === "build" ? it.answer : it.show;
      const task = it.t === "conj" ? "поставить глагол " + it.v.inf + " в форму «" + CONJ.TENSES.find((t) => t.id === it.tense).es + "», лицо " + it.persons[it.p]
        : it.t === "dict" ? "записать на слух испанскую фразу" : it.t === "build" ? "собрать испанскую фразу с переводом «" + it.q + "»" : it.t === "type" ? "перевести на испанский «" + it.q + "»" : "выбрать перевод для «" + it.q + "»";
      await streamInto(out, "Ученик — русскоязычный, учит латиноамериканский испанский (" + country().ru + "), уровень " + S.settings.level + ". Задание: " + task + ". Правильный ответ: «" + right + "». Ответ ученика: «" + (it.given || "") + "».\nОбъясни по-русски в 2–4 коротких предложениях, в чём ошибка и как это запомнить. Если ответ ученика тоже допустим в Латинской Америке — так и скажи.", { modelTier: "quick" });
    },
    "open-dialog": (b) => { const dd = DIALOGS.find((x) => x.id === b.dataset.arg); if (dd) preload([dd.lines[0][1]]); route = "talk"; UI.talk = { mode: "dialog", id: b.dataset.arg }; Dlg.revealed = new Set(); stopPlay(); Cards.active = P.active = false; syncHash(); render(); window.scrollTo(0, 0); },
    "back-talk": () => { stopPlay(); UI.talk = { mode: "list", id: null }; render(); window.scrollTo(0, 0); },
    "play-all": () => playAll(DIALOGS.find((x) => x.id === UI.talk.id)),
    "dlg-tr": (b) => { Dlg.showTr = b.checked; $$("#lines .bubble:not(.hidden-line) .tr").forEach((p) => { p.hidden = !Dlg.showTr; }); },
    "dlg-hide": (b) => { Dlg.hideMine = b.checked; Dlg.revealed = new Set(); render(); },
    reveal: (b) => { Dlg.revealed.add(Number(b.dataset.arg)); render(); },
    "vocab-add": (b) => {
      const [did, i] = b.dataset.arg.split(":");
      const v = DIALOGS.find((x) => x.id === did).vocab[Number(i)];
      if (!S.custom.some((w) => w[0] === v[0])) S.custom.push([v[0], v[1], "", "", "Из диалога «" + DIALOGS.find((x) => x.id === did).title + "»"]);
      buildCards(); save(); render(); toast("Добавлено в «Мои слова».");
    },
    "dialog-done": (b) => { S.dialogs[b.dataset.arg] = dayKey(); today().dialog++; save(); toast("Диалог отмечен. Его фразы появятся в упражнениях «Собери фразу» и «Диктант»."); render(); },
    "open-chat": (b) => {
      route = "talk"; stopPlay();
      const sc = b.dataset.arg && scenarios().some((s) => s.id === b.dataset.arg) ? b.dataset.arg : null;
      if (sc && sc !== Chat.scenario) { chatReset(); Chat.scenario = sc; }
      UI.talk = { mode: "chat", id: null }; Cards.active = P.active = false; syncHash(); render(); window.scrollTo(0, 0);
    },
    "chat-begin": () => chatSend(null),
    "chat-reset": () => { chatReset(); refreshAISlots(); },
    "chat-tr": (b) => { const m = Chat.msgs[Number(b.dataset.arg)]; m.showTr = !m.showTr; refreshAISlots(); },
    "chat-deep": async (b) => {
      const i = Number(b.dataset.arg), m = Chat.msgs[i];
      const sc = scenarios().find((s) => s.id === Chat.scenario);
      const prev = Chat.msgs.slice(0, i).reverse().find((x) => x.who === "ai");
      b.hidden = true;
      const txt = await streamInto($("#deep" + i), "Разбери по-русски фразу ученика на испанском. Ученик русскоязычный, уровень " + S.settings.level + ", переезжает в страну " + country().ru + ". Сцена: " + sc.desc + ".\n" + (prev ? "Собеседник сказал: «" + prev.es + "»\n" : "") + "Ученик ответил: «" + m.es + "»\n\nКоротко: 1) ошибки и почему; 2) исправленный вариант; 3) два варианта, как сказал бы местный житель. Без вступлений, простыми списками.", { modelTier: "default" });
      if (txt) m.deep = txt; else b.hidden = false;
    },
    "set-minutes": (b) => { const m = Number(b.dataset.arg); S.settings.minutes = m; S.settings.newPerDay = NEW_BY_MINUTES[m] || S.settings.newPerDay; save(); render(); toast("Цель: " + m + " минут в день, " + S.settings.newPerDay + " новых слов."); },
    "conj-tense": (b) => { const t = b.dataset.arg, cur = S.settings.conjTenses; S.settings.conjTenses = cur.includes(t) ? (cur.length > 1 ? cur.filter((x) => x !== t) : cur) : cur.concat([t]); save(); render(); },
    "conj-set": (b) => { S.settings.conjSet = b.dataset.arg; save(); render(); },
    "gen-add": () => {
      const g = UI.gen; if (!g || !g.items) return;
      let n = 0;
      $$("[data-gen]").forEach((cb) => { if (!cb.checked) return; const w = g.items[Number(cb.dataset.gen)]; if (!S.custom.some((x) => x[0] === w.es)) { S.custom.push([w.es, w.ru, w.exEs, w.exRu, w.note]); n++; } });
      UI.gen = null; buildCards(); save(); render();
      toast(n ? "Добавлено " + n + " " + plural(n, "слово", "слова", "слов") + " в «Мои слова»." : "Эти слова уже есть в «Моих словах».");
    },
    "gen-clear": () => { UI.gen = null; refreshAISlots(); },
    "export-copy": async () => {
      const text = JSON.stringify(S);
      try { await navigator.clipboard.writeText(text); toast("Копия скопирована. Сохраните её, например, в заметках."); }
      catch (e) { const box = $("#exportBox"); box.hidden = false; box.value = text; box.focus(); box.select(); toast("Выделите текст в поле и скопируйте вручную (Ctrl+C)."); }
    },
    "export-file": async () => {
      if (!DL.fn) return;
      try { await DL.fn.save({ filename: "espanol-progreso-" + dayKey() + ".json", data: JSON.stringify(S, null, 1) }); toast("Файл сохранён."); }
      catch (e) { if (e && e.code !== "declined") toast("Не удалось сохранить файл. Используйте «Скопировать резервную копию»."); }
    },
    "import-text": () => { const t = $("#importBox").value.trim(); if (!t) { toast("Сначала вставьте текст резервной копии в поле."); return; } importState(t); },
    "reset-ask": () => { UI.confirmReset = true; render(); },
    "reset-no": () => { UI.confirmReset = false; render(); },
    "reset-yes": () => { const keep = S.settings; S = defaults(); S.settings = keep; UI.confirmReset = false; chatReset(); save(); buildCards(); render(); toast("Прогресс сброшен. Настройки сохранены."); }
  };
  function syncHash() { try { history.replaceState(null, "", "#" + route); } catch (e) { /* ок */ } }

  document.addEventListener("click", (e) => {
    const link = e.target.closest(".nav-link");
    if (link) { e.preventDefault(); go(link.dataset.route); return; }
    const b = e.target.closest("[data-act]");
    if (!b || b.tagName === "SELECT") return;
    if (b.tagName === "INPUT" && b.type === "checkbox") return;
    const fn = ACT[b.dataset.act];
    if (fn) { if (b.tagName === "A") e.preventDefault(); fn(b, e); }
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.matches('input[type=checkbox][data-act]')) { const fn = ACT[t.dataset.act]; if (fn) fn(t, e); return; }
    if (t.id === "chatScenario") { chatReset(); Chat.scenario = t.value; refreshAISlots(); return; }
    if (t.id === "importFile" && t.files && t.files[0]) {
      const r = new FileReader();
      r.onload = () => importState(String(r.result || ""));
      r.onerror = () => toast("Не удалось прочитать файл.");
      r.readAsText(t.files[0]);
      return;
    }
    const key = t.dataset.set;
    if (!key) return;
    let val = t.type === "checkbox" ? t.checked : t.value;
    if (key === "newPerDay") val = Math.max(0, Math.min(50, parseInt(val, 10) || 0));
    if (key === "rate") val = Number(val);
    S.settings[key] = val;
    save();
    if (key === "country" || key === "voice") render();
  });
  document.addEventListener("input", (e) => {
    if (e.target.dataset && e.target.dataset.set === "rate") { const v = $("#rateVal"); if (v) v.textContent = Number(e.target.value).toFixed(2); }
  });
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("form[data-form]");
    if (!f) return;
    e.preventDefault();
    const kind = f.dataset.form;
    if (kind === "answer") submitAnswer($("#ans").value);
    else if (kind === "add-word") {
      const es = $("#awEs").value.trim(), ru = $("#awRu").value.trim();
      if (!es || !ru) { toast("Заполните слово и перевод."); return; }
      if (S.custom.some((w) => w[0] === es)) { toast("Такое слово уже есть."); return; }
      S.custom.push([es, ru, $("#awEx").value.trim(), $("#awExRu").value.trim(), ""]);
      buildCards(); save(); render(); toast("Слово добавлено. Оно придёт в карточках вместе с новыми словами.");
    } else if (kind === "chat") {
      const ta = $("#chatIn"); const text = ta.value.trim();
      if (!text) return;
      ta.value = "";
      chatSend(text);
    } else if (kind === "lesson-ask") {
      const q = $("#lessonQ").value.trim();
      if (!q) return;
      const l = LESSONS.find((x) => x.id === f.dataset.arg);
      streamInto($("#lessonA"), "Ты — преподаватель испанского для русскоязычных взрослых, которые переезжают в Латинскую Америку (страна ученика: " + country().ru + ", уровень " + S.settings.level + "). Тема урока: «" + l.title + "».\nВопрос ученика: " + q + "\n\nОтветь по-русски, коротко и понятно, с 2–3 примерами на латиноамериканском испанском и их переводом.", { modelTier: "default" });
    } else if (kind === "gen") {
      const topic = $("#genTopic").value.trim();
      if (!topic || !AI.fn) return;
      UI.gen = { topic, busy: true };
      refreshAISlots();
      const c = country();
      AI.fn.json("Составь список из 10 полезных слов и выражений по теме «" + topic + "» для русскоязычного человека, который переезжает жить в страну: " + c.ru + " (уровень " + S.settings.level + "). Используй лексику, принятую именно в " + c.es + "; существительные — с артиклем.\nОтветь только JSON-массивом: [{\"es\":\"слово по-испански\",\"ru\":\"перевод\",\"exEs\":\"короткий пример по-испански\",\"exRu\":\"перевод примера\",\"note\":\"региональная пометка или пустая строка\"}]", { modelTier: "default" })
        .then((arr) => {
          const items = (Array.isArray(arr) ? arr : []).filter((w) => w && typeof w.es === "string" && typeof w.ru === "string" && w.es.trim()).slice(0, 15)
            .map((w) => ({ es: w.es.trim(), ru: w.ru.trim(), exEs: String(w.exEs || "").trim(), exRu: String(w.exRu || "").trim(), note: String(w.note || "").trim() }));
          UI.gen = { topic, items, error: items.length ? "" : "Claude не вернул слов. Попробуйте уточнить тему." };
        })
        .catch((err) => { UI.gen = { topic, error: aiError(err) }; })
        .finally(() => { if (route === "words") refreshAISlots(); });
    }
  });
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
    if (t && t.id === "chatIn" && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); t.form.requestSubmit(); return; }
    if (t && t.classList && t.classList.contains("hidden-line") && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); ACT.reveal(t); return; }
    if (Cards.active && Cards.queue[Cards.pos]) {
      if (typing) return;
      if (!Cards.shown && (e.key === " " || e.key === "Enter")) { e.preventDefault(); ACT.flip(); return; }
      if (Cards.shown && /^[1-4]$/.test(e.key)) { e.preventDefault(); doGrade(Number(e.key) - 1); return; }
      if (Cards.shown && (e.key === " " || e.key === "Enter") && t.tagName !== "BUTTON") { e.preventDefault(); doGrade(2); }
      return;
    }
    if (P.active && P.items[P.i]) {
      if (P.answered && e.key === "Enter" && !(t.tagName === "BUTTON" && t.dataset.act !== "next")) { e.preventDefault(); nextItem(); return; }
      if (!P.answered && !typing && P.items[P.i].t === "choice" && /^[1-4]$/.test(e.key)) { const b = $$(".opt")[Number(e.key) - 1]; if (b) b.click(); }
    }
  });

  // ---------------------------------------------------------------- старт
  buildCards();
  const h = (location.hash || "").replace("#", "");
  route = ROUTES.includes(h) ? h : "today";
  render();
  window.addEventListener("hashchange", () => {
    const r = (location.hash || "").replace("#", "");
    if (ROUTES.includes(r) && r !== route) go(r);
  });
  initSync();
  initCaps();
})();
