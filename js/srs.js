// Карточки и интервальное повторение. Подсчёты (сколько повторить, новые слова, прогресс тем)
// кэшируются до следующего изменения состояния — экран «Сегодня» вызывает их много раз.
(function (App) {
  "use strict";
  const { dayKey, addDays, plural, shuffle, interleave, rank, stripAcc, norm, ARTICLE } = App.util;
  const S = App.S;
  const D = App.D;

  // ---------------------------------------------------------------- карточки
  const ALL = [];
  const BY_ID = new Map();
  const BY_ES = new Map();
  const DETAILS = new Map(); // тема → [[пример, перевод примера, заметка], …] (подгружается лениво)

  function addCard(deck, w, det) {
    const c = { id: deck + "|" + w[0], deck, es: w[0], ru: w[1], exEs: (det && det[0]) || "", exRu: (det && det[1]) || "", note: (det && det[2]) || "", pic: D.PICS[w[0]] || "" };
    if (BY_ID.has(c.id)) return;
    ALL.push(c); BY_ID.set(c.id, c);
    if (!BY_ES.has(c.es)) BY_ES.set(c.es, []);
    BY_ES.get(c.es).push(c);
  }
  function buildCards() {
    ALL.length = 0; BY_ID.clear(); BY_ES.clear(); CONTEXT.clear();
    D.DECKS.forEach((d) => { const det = DETAILS.get(d.id) || []; d.words.forEach((w, i) => addCard(d.id, w, det[i])); });
    S.custom.forEach((w) => addCard("custom", [w[0], w[1]], [w[2], w[3], w[4]]));
    App.state.bump();
  }
  // Примеры и заметки темы пришли с сервера — дописываем их в уже созданные карточки
  function applyDetails(deckId, rows) {
    DETAILS.set(deckId, rows);
    const d = D.DECKS.find((x) => x.id === deckId);
    if (!d) return;
    d.words.forEach((w, i) => {
      const c = BY_ID.get(deckId + "|" + w[0]), r = rows[i];
      if (c && r) { c.exEs = r[0] || ""; c.exRu = r[1] || ""; c.note = r[2] || ""; }
    });
  }
  const detailChunks = (decks) => Array.from(new Set(decks)).filter((d) => d !== "custom").map((d) => "words:" + d);
  const ensureDetails = (decks) => App.data.ensure(detailChunks(decks));

  function deckList() { return D.DECKS.concat([{ id: "custom", title: "Мои слова", es: "Mis palabras", words: S.custom }]); }
  const deckById = (id) => deckList().find((d) => d.id === id);
  const enabledDeck = (id) => !S.settings.decksOff.includes(id);
  const isTop = (id) => { const d = D.DECKS.find((x) => x.id === id); return !!(d && d.group === "top"); };
  const isSkipped = (c) => !!S.skip[c.es];
  const status = (id) => { const c = S.cards[id]; return !c ? "new" : c.i >= 21 ? "learned" : "learning"; };
  const isDue = (id, t) => { const c = S.cards[id]; return c && c.d <= t; };

  // ---------------------------------------------------------------- кэш подсчётов
  let memoV = -1, memoDay = "", memo = new Map();
  function cached(key, fn) {
    const v = App.state.version(), d = dayKey();
    if (v !== memoV || d !== memoDay) { memo = new Map(); memoV = v; memoDay = d; }
    if (!memo.has(key)) memo.set(key, fn());
    return memo.get(key);
  }
  // Оставляет по одной карточке на каждое испанское слово
  function uniqueByEs(list) { const seen = new Set(); return list.filter((c) => (seen.has(c.es) ? false : seen.add(c.es))); }
  const uniqueAll = () => cached("uniq", () => uniqueByEs(ALL));

  // ---------------------------------------------------------------- расписание
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
  function setState(id, st) { for (const c of twins(id)) S.cards[c.id] = Object.assign({}, st); }
  function grade(id, g) {
    const old = S.cards[id];
    const n = nextInterval(old, g);
    const t = dayKey();
    setState(id, { i: n.i, e: n.e, d: addDays(t, n.i), r: (old ? old.r : 0) + 1, l: (old ? old.l : 0) + (g === 0 ? 1 : 0), s: old ? old.s : t });
  }
  // «Уже знаю»: слово уходит в длинный интервал и считается выученным
  function markKnown(id) {
    const old = S.cards[id], t = dayKey();
    setState(id, { i: 60, e: 2.7, d: addDays(t, 60), r: (old ? old.r : 0) + 1, l: old ? old.l : 0, s: old ? old.s : t, known: 1 });
  }

  // ---------------------------------------------------------------- мягкий старт и новые слова
  const activeDays = () => cached("active", () => Object.values(S.days).filter((d) => (d.rev || 0) + (d.nw || 0) > 0 || (d.sec || 0) >= 300).length);
  const knownCount = () => cached("known", () => uniqueAll().filter((c) => S.cards[c.id] && S.cards[c.id].i >= 3 && !isSkipped(c)).length);
  // Пока знакомых слов меньше 50 (и не больше двух недель занятий) — меньше новых слов, сначала базовые фразы
  const softStart = () => knownCount() < 50 && activeDays() < 14;
  function newPerDayNow() {
    const n = S.settings.newPerDay;
    return softStart() ? Math.max(3, Math.round(n * 0.6)) : n;
  }
  function themeOrder() {
    return cached("order", () => {
      const order = [];
      const push = (id) => { if (!order.includes(id)) order.push(id); };
      if (softStart()) ["base", "phrases"].forEach(push);
      App.goals.focusGoals().forEach((g) => g.decks.forEach(push));
      D.DECKS.filter((d) => d.group !== "top").forEach((d) => push(d.id));
      push("custom");
      return order;
    });
  }
  // Новые слова: без выбранной темы чередуются топ-1500 и темы для переезда (сначала цели ученика)
  function freshCandidates(deck) {
    return cached("fresh:" + (deck || ""), () => {
      const t = ALL.filter((c) => !S.cards[c.id] && !isSkipped(c) && (deck ? c.deck === deck : enabledDeck(c.deck)));
      if (deck) return uniqueByEs(t);
      const order = themeOrder();
      const theme = t.filter((c) => !isTop(c.deck)).sort((a, b) => rank(order, a.deck) - rank(order, b.deck));
      return uniqueByEs(interleave(t.filter((c) => isTop(c.deck)), theme));
    });
  }
  function counts() {
    return cached("counts", () => {
      const t = dayKey();
      let due = 0;
      for (const c of uniqueAll()) if (!isSkipped(c) && S.cards[c.id] && S.cards[c.id].d <= t) due++;
      const freshAvail = freshCandidates().length;
      const newLeft = Math.max(0, newPerDayNow() - App.state.today().nw);
      return { due, newToday: Math.min(newLeft, freshAvail), freshAvail };
    });
  }
  // ---------------------------------------------------------------- слова с картинками
  // Картинка привязана к испанскому слову, поэтому у «близнецов» она общая, а расписание одно на всех
  const picCards = () => cached("pics", () => uniqueAll().filter((c) => c.pic && !isSkipped(c)));
  // Новые слова с картинками: сначала в порядке обычной очереди новых слов, затем остальные
  function freshPics() {
    return cached("freshPics", () => {
      const first = freshCandidates().filter((c) => c.pic);
      const inFirst = new Set(first.map((c) => c.es));
      return first.concat(picCards().filter((c) => !S.cards[c.id] && !inFirst.has(c.es)));
    });
  }
  function picCounts() {
    return cached("picCounts", () => {
      const r = { total: 0, learned: 0, learning: 0, due: 0 };
      const t = dayKey();
      for (const c of picCards()) {
        r.total++;
        const s = status(c.id);
        if (s === "learned") r.learned++; else if (s === "learning") r.learning++;
        if (isDue(c.id, t)) r.due++;
      }
      return r;
    });
  }
  function deckCounts(deck) {
    return cached("deck:" + deck, () => {
      const r = { total: 0, learned: 0, learning: 0, fresh: 0, due: 0, skipped: 0 };
      const t = dayKey();
      for (const c of ALL) {
        if (c.deck !== deck) continue;
        if (isSkipped(c)) { r.skipped++; continue; }
        r.total++;
        const s = status(c.id);
        if (s === "learned") r.learned++; else if (s === "learning") r.learning++; else r.fresh++;
        if (isDue(c.id, t)) r.due++;
      }
      return r;
    });
  }

  // ---------------------------------------------------------------- проверка ответа
  const typeable = (c) => !/[,…]/.test(c.es) && c.es.split(" / ").length <= 2;
  function answersFor(c) {
    const parts = c.es.split(" / ");
    return parts.length > 1 ? parts.concat([c.es]) : parts;
  }
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

  // ---------------------------------------------------------------- пример из сцены
  // Где слово звучит в диалогах для переезда (если реплики диалогов уже загружены)
  const CONTEXT = new Map();
  function dialogContext(c) {
    if (!App.data.has("dialogs")) return null;
    if (CONTEXT.has(c.id)) return CONTEXT.get(c.id);
    let found = null;
    const base = c.es.split(" / ")[0].replace(/^(el|la|los|las|un|una) /i, "").replace(/[¿?¡!….,]/g, "").trim();
    if (base.length >= 4 && !/\s.*\s/.test(base)) {
      const re = new RegExp("(^|[^a-záéíóúñü])" + base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-záéíóúñü]|$)", "i");
      const order = App.goals.focusGoals().flatMap((g) => g.dialogs);
      for (const d of D.DIALOGS.slice().sort((a, b) => rank(order, a.id) - rank(order, b.id))) {
        const l = d.lines.find((x) => re.test(x[1]) && x[1] !== c.exEs);
        if (l) { found = { es: l[1], ru: l[2], dialog: d }; break; }
      }
    }
    CONTEXT.set(c.id, found);
    return found;
  }

  // Порции слов для упражнений
  function wordPool() {
    const seen = shuffle(ALL.filter((c) => S.cards[c.id] && !isSkipped(c)));
    if (seen.length >= 12) return seen;
    return seen.concat(shuffle(freshCandidates().slice(0, 40)));
  }

  App.srs = {
    ALL, BY_ID, BY_ES, buildCards, applyDetails, ensureDetails, detailChunks, deckList, deckById, enabledDeck, isTop, isSkipped,
    status, isDue, nextInterval, intervalLabel, grade, markKnown, uniqueByEs, uniqueAll, activeDays, knownCount, softStart, newPerDayNow,
    themeOrder, freshCandidates, counts, deckCounts, picCards, freshPics, picCounts, typeable, answersFor, checkAnswer, dialogContext, wordPool, cached
  };
})(window.App = window.App || {});
