// Раздел «Практика»: упражнения, работа над ошибками, частые ошибки, упражнения по одному диалогу.
(function (App) {
  "use strict";
  const { $, $$, esc, shuffle, pick, norm, stripAcc, keysHTML, ICON, toast } = App.util;
  const { PRACTICE_KINDS, kindById } = App.cfg;
  const S = App.S;
  const D = App.D;
  const srs = App.srs;
  const ui = App.ui;
  const P = ui.P;
  const { sayBtn, speak } = App.audio;
  const KIND_LABEL = { choice: "Выберите перевод", type: "Переведите на испанский", build: "Соберите фразу по-испански", dict: "Запишите, что услышали", conj: "Поставьте глагол в нужную форму" };

  function renderHome() {
    const set = S.settings;
    const T = D.CONJ.TENSES;
    return '<header class="page-head"><div><h1>Практика</h1><p class="sub">Ejercicios</p></div></header>' +
      '<p class="muted">В каждом упражнении до 10 заданий. Слова берутся из тех, что вы уже начали учить в карточках; если их пока мало — из первых тем. Ответ можно набирать без ударений: приложение засчитает, но подскажет правильное написание.</p>' +
      '<div class="tiles">' + PRACTICE_KINDS.filter((k) => !k.hidden).map((k) => {
        const disabled = k.id === "mist" && !S.mistakes.length;
        return '<button class="tile" data-act="practice-start" data-arg="' + k.id + '"' + (disabled ? " disabled" : "") + '><span class="tile-title">' + esc(k.title) + (k.id === "mist" ? " · " + S.mistakes.length : "") + '</span><span class="tile-ex">' + esc(k.ex) + '</span><span class="muted small">' + esc(disabled ? "Пока ошибок нет. Они появятся здесь сами, когда вы ошибётесь в карточках или упражнениях." : k.desc) + "</span></button>";
      }).join("") + "</div>" +
      '<section class="panel stack"><h2 class="sec">Настройки спряжений</h2><p class="muted small">Какие времена тренировать:</p><div class="seg">' +
      T.map((t) => '<button data-act="conj-tense" data-arg="' + t.id + '" aria-pressed="' + set.conjTenses.includes(t.id) + '" title="' + esc(t.ru + ": " + t.hint) + '">' + esc(t.es) + "</button>").join("") + "</div>" +
      '<p class="muted small">Глаголы:</p><div class="seg"><button data-act="conj-set" data-arg="top" aria-pressed="' + (set.conjSet === "top") + '">Самые нужные (' + D.CONJ.VERBS.filter((v) => v.top).length + ')</button><button data-act="conj-set" data-arg="all" aria-pressed="' + (set.conjSet === "all") + '">Все (' + D.CONJ.VERBS.length + ")</button></div>" +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Время</th><th>Что выражает</th><th>Пример</th></tr></thead><tbody>' + T.map((t) => '<tr><td class="es">' + esc(t.es) + "</td><td>" + esc(t.ru) + '</td><td class="es">' + esc(t.hint) + "</td></tr>").join("") + "</tbody></table></div></section>";
  }

  // ---------------------------------------------------------------- генерация заданий
  const okLen = (s) => { const n = s.split(/\s+/).length; return n >= 3 && n <= 9 && !/[—…]/.test(s); };
  function sentencePool() {
    const out = [];
    srs.ALL.forEach((c) => { if (c.exEs && S.cards[c.id] && okLen(c.exEs)) out.push({ es: c.exEs, ru: c.exRu }); });
    D.DIALOGS.forEach((d) => { if (d.lines && App.goals.dlgLevel(d.id) >= 1) d.lines.forEach((l) => { if (okLen(l[1])) out.push({ es: l[1], ru: l[2] }); }); });
    if (out.length < 20) srs.ALL.slice(0, 120).forEach((c) => { if (c.exEs && okLen(c.exEs)) out.push({ es: c.exEs, ru: c.exRu }); });
    const seen = new Set();
    return shuffle(out.filter((s) => (seen.has(s.es) ? false : seen.add(s.es))));
  }
  function choiceItem(c) {
    const toRu = Math.random() < 0.6;
    const field = toRu ? "ru" : "es";
    const same = shuffle(srs.ALL.filter((x) => x.deck === c.deck && x.id !== c.id && x[field] !== c[field]));
    const others = shuffle(srs.ALL.filter((x) => x.deck !== c.deck && x[field] !== c[field]));
    const opts = [c[field]];
    for (const x of same.concat(others)) { if (opts.length >= 4) break; if (!opts.includes(x[field])) opts.push(x[field]); }
    return { t: "choice", card: c, q: toRu ? c.es : c.ru, qEs: toRu, opts: shuffle(opts), a: c[field], say: c.es, mk: { k: "card", id: c.id } };
  }
  // «Угадай по картинке»: в вариантах только слова с другой картинкой, чтобы ответ был однозначным
  function picChoiceItem(c) {
    const all = srs.picCards();
    const fits = (x) => x.es !== c.es && x.pic !== c.pic;
    const same = shuffle(all.filter((x) => x.deck === c.deck && fits(x)));
    const others = shuffle(all.filter((x) => x.deck !== c.deck && fits(x)));
    const opts = [c.es];
    for (const x of same.concat(others)) { if (opts.length >= 4) break; if (!opts.includes(x.es)) opts.push(x.es); }
    return { t: "choice", pic: c.pic, card: c, q: c.ru, qEs: false, opts: shuffle(opts), a: c.es, say: c.es, mk: { k: "card", id: c.id } };
  }
  function picItems(n) {
    const seen = shuffle(srs.picCards().filter((c) => S.cards[c.id]));
    const pool = seen.length >= n ? seen : seen.concat(srs.freshPics().slice(0, 30));
    // Знакомые слова иногда нужно написать самому — картинка плюс перевод мелко, потому что одна картинка бывает у нескольких слов
    return pool.slice(0, n).map((c) => (S.cards[c.id] && srs.typeable(c) && Math.random() < 0.4 ? Object.assign(typeItem(c), { pic: c.pic }) : picChoiceItem(c)));
  }
  // «Услышь и найди картинку»: слово звучит, ответ — одна из четырёх разных картинок
  function earItem(c) {
    const all = srs.picCards();
    const fits = (x) => x.pic !== c.pic;
    const opts = [c.pic];
    for (const x of shuffle(all.filter((x) => x.deck === c.deck && fits(x))).concat(shuffle(all.filter(fits)))) { if (opts.length >= 4) break; if (!opts.includes(x.pic)) opts.push(x.pic); }
    return { t: "choice", ear: true, card: c, q: c.ru, qEs: false, opts: shuffle(opts), a: c.pic, say: c.es, mk: { k: "card", id: c.id } };
  }
  function earItems(n) {
    const ok = (c) => App.audio.hasRecording(c.es);
    const seen = shuffle(srs.picCards().filter((c) => S.cards[c.id] && ok(c)));
    return (seen.length >= n ? seen : seen.concat(srs.freshPics().filter(ok).slice(0, 30))).slice(0, n).map(earItem);
  }
  const typeItem = (c) => ({ t: "type", card: c, q: c.ru, answers: srs.answersFor(c), say: c.es, show: c.es, mk: { k: "card", id: c.id } });
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
  const dictItem = (s) => ({ t: "dict", say: s.es, answers: [s.es], ru: s.ru, show: s.es, mk: { k: "sent", es: s.es, ru: s.ru } });
  function conjItem(fixed) {
    const C = D.CONJ;
    let v, t, forms;
    if (fixed) { v = C.VERBS.find((x) => x.inf === fixed.inf); t = fixed.tense; forms = v && C.conjugate(v, t); }
    if (!forms) {
      const tenses = S.settings.conjTenses.length ? S.settings.conjTenses : ["pres"];
      const verbs = C.VERBS.filter((x) => S.settings.conjSet === "all" || x.top);
      for (let k = 0; k < 30 && !forms; k++) { v = pick(verbs); t = pick(tenses); forms = C.conjugate(v, t); }
    }
    const persons = t === "imp" ? C.IMP_PERSONS : C.PERSONS;
    const p = fixed && fixed.p != null && fixed.p < forms.length ? fixed.p : Math.floor(Math.random() * forms.length);
    return { t: "conj", v, tense: t, p, persons, forms, answers: [forms[p]], show: forms[p], say: forms[p], mk: { k: "conj", inf: v.inf, tense: t, p } };
  }
  // «Частые ошибки»: выбрать правильный вариант из двух
  function errorItems() {
    const pairs = D.ERRORS.flatMap((e) => e.pairs.map((p) => ({ e, p })));
    return shuffle(pairs).slice(0, 10).map(({ e, p }) => ({ t: "choice", q: p[0], qEs: false, opts: shuffle([p[1], p[2]]), a: p[1], say: p[1], why: e.why, mk: null }));
  }
  // Упражнения по одному диалогу: соберите фразу, выбор перевода выражений, диктант
  function dialogItems(id) {
    const d = App.goals.dialogById(id);
    if (!d || !d.lines) return [];
    const lines = shuffle(d.lines.filter((l) => okLen(l[1]))).map((l) => ({ es: l[1], ru: l[2] }));
    const pool = sentencePool().concat(lines);
    const otherVocab = shuffle(D.DIALOGS.filter((x) => x.id !== id && x.vocab).flatMap((x) => x.vocab));
    const vocabItems = shuffle(d.vocab).slice(0, 2).map((v) => {
      const opts = [v[1]];
      for (const o of otherVocab) { if (opts.length >= 4) break; if (!opts.includes(o[1])) opts.push(o[1]); }
      return { t: "choice", q: v[0], qEs: true, opts: shuffle(opts), a: v[1], say: v[0], mk: null };
    });
    const items = [];
    if (lines[0]) items.push(buildItem(lines[0], pool));
    items.push(...vocabItems.slice(0, 1));
    const dictLine = lines.find((l, k) => k > 0 && App.audio.hasRecording(l.es) && l.es.split(" ").length <= 8);
    if (dictLine) items.push(dictItem(dictLine));
    if (lines[2]) items.push(buildItem(lines[2], pool));
    items.push(...vocabItems.slice(1));
    return items.slice(0, 5);
  }
  function itemFromMistake(m) {
    if (m.k === "card") { const c = srs.BY_ID.get(m.id); if (!c) return null; return srs.typeable(c) ? typeItem(c) : choiceItem(c); }
    if (m.k === "conj") return conjItem(m);
    if (m.k === "sent") return buildItem(m, sentencePool());
    return null;
  }
  function genItems(kind, arg) {
    const N = 10;
    if (kind === "choice") return srs.wordPool().slice(0, N).map(choiceItem);
    if (kind === "pics") return picItems(N);
    if (kind === "ear") return earItems(N);
    if (kind === "type") return srs.wordPool().filter(srs.typeable).slice(0, N).map(typeItem);
    if (kind === "build") { const sp = sentencePool(); return sp.slice(0, N).map((s) => buildItem(s, sp)); }
    if (kind === "dict") return sentencePool().filter((s) => s.es.split(" ").length <= 8 && App.audio.hasRecording(s.es)).slice(0, N).map(dictItem);
    if (kind === "conj") return Array.from({ length: N }, () => conjItem());
    if (kind === "errors") return errorItems();
    if (kind === "dlg") return dialogItems(arg);
    if (kind === "mist") return S.mistakes.slice(0, N).map((m) => { const it = itemFromMistake(m); if (it) it.fromMistake = mistakeKey(m); return it; }).filter(Boolean);
    return [];
  }
  // Какие данные нужны упражнению: примеры начатых тем, реплики диалогов, индекс озвучки, спряжения, ошибки
  function needsFor(kind) {
    const started = srs.ALL.filter((c) => S.cards[c.id]).map((c) => c.deck);
    const decks = srs.detailChunks(started.length ? started : srs.ALL.slice(0, 120).map((c) => c.deck));
    switch (kind) {
      case "type": return decks;
      case "build": return decks.concat(["dialogs"]);
      case "dict": return decks.concat(["dialogs", "audio"]);
      case "conj": return ["verbs"];
      case "errors": return ["lessons"];
      case "dlg": return ["dialogs", "audio"];
      case "ear": return ["audio"];
      case "mist": return decks.concat(["dialogs", "verbs"]);
      default: return [];
    }
  }
  async function start(kind, arg) {
    const miss = App.data.missing(needsFor(kind));
    if (miss.length) {
      $("#view").innerHTML = App.util.loadingHTML("Готовлю задания…");
      try { await App.data.ensure(miss); } catch (e) { toast("Не удалось загрузить данные. Проверьте подключение к интернету."); App.router.render(); return; }
    }
    const items = genItems(kind, arg);
    if (!items.length) { toast(kind === "mist" ? "Список ошибок пуст — отлично!" : "Пока мало материала. Начните с карточек."); App.router.render(); return; }
    App.audio.preload(items.map((it) => it.say));
    Object.assign(P, { active: true, kind, items, i: 0, ok: 0, answered: false, wrong: [], built: [], dialog: kind === "dlg" ? arg : null });
    App.router.render(); window.scrollTo(0, 0);
    if (items[0].t === "dict" || items[0].ear) setTimeout(() => speak(items[0].say), 250);
  }

  // ---------------------------------------------------------------- ошибки ученика
  const mistakeKey = (m) => m.k === "card" ? "c:" + m.id : m.k === "conj" ? "v:" + m.inf + ":" + m.tense + ":" + m.p : "s:" + m.es;
  function addMistake(m) {
    if (!m) return;
    const key = mistakeKey(m);
    S.mistakes = [m].concat(S.mistakes.filter((x) => mistakeKey(x) !== key)).slice(0, 150);
  }
  const removeMistake = (key) => { S.mistakes = S.mistakes.filter((x) => mistakeKey(x) !== key); };

  // ---------------------------------------------------------------- экран задания
  function renderSession() {
    const it = P.items[P.i];
    if (!it) return renderDone();
    const kind = kindById(P.kind);
    const d = P.dialog && App.goals.dialogById(P.dialog);
    let body = '<p class="q-kind">' + esc(P.kind === "errors" ? "Как правильно сказать?" : it.ear ? "Что прозвучало? Выберите картинку" : it.pic ? (it.t === "type" ? "Напишите по-испански, что на картинке" : "Что на картинке?") : KIND_LABEL[it.t]) + "</p>";
    const picHTML = it.pic ? '<div class="pic q-pic" role="img" aria-label="Картинка к слову">' + it.pic + "</div>" : "";
    if (it.ear) {
      body += '<div class="row" style="justify-content:center">' + sayBtn(it.say, "lg") + '<button class="btn ghost sm" data-act="say-slow" data-text="' + esc(it.say) + '">' + ICON.slow.replace("<svg", '<svg width="16" height="16"') + " Медленно</button></div>" +
        '<div class="options pic-opts">' + it.opts.map((o, i) => '<button class="opt pic-opt" data-act="choose" data-arg="' + i + '"><kbd>' + (i + 1) + '</kbd><span class="pic">' + o + "</span></button>").join("") + "</div>";
    } else if (it.t === "choice" && it.pic) {
      body += picHTML + '<div class="options">' + it.opts.map((o, i) => '<button class="opt es" data-act="choose" data-arg="' + i + '"><kbd>' + (i + 1) + "</kbd><span>" + esc(o) + "</span></button>").join("") + "</div>";
    } else if (it.t === "choice") {
      body += '<div class="row">' + '<p class="q-text ' + (it.qEs ? "es" : "ru") + '">' + esc(it.q) + "</p>" + (it.qEs ? sayBtn(it.say) : "") + "</div>" +
        '<div class="options">' + it.opts.map((o, i) => '<button class="opt ' + (it.qEs ? "" : "es") + '" data-act="choose" data-arg="' + i + '"><kbd>' + (i + 1) + "</kbd><span>" + esc(o) + "</span></button>").join("") + "</div>";
    } else if (it.t === "type" || it.t === "dict" || it.t === "conj") {
      if (it.t === "type" && it.pic) body += picHTML + '<p class="muted" style="text-align:center">' + esc(it.q) + "</p>";
      else if (it.t === "type") body += '<p class="q-text ru">' + esc(it.q) + "</p>" + (it.card.note ? '<p class="muted small">' + esc(it.card.note) + "</p>" : "");
      if (it.t === "dict") body += '<div class="row">' + sayBtn(it.say, "lg") + '<button class="btn ghost sm" data-act="say-slow" data-text="' + esc(it.say) + '">' + ICON.slow.replace("<svg", '<svg width="16" height="16"') + " Медленно</button></div>";
      if (it.t === "conj") {
        const tn = D.CONJ.TENSES.find((t) => t.id === it.tense);
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
      '<p class="eyebrow">' + esc(d ? "Фразы из сцены «" + d.title + "»" : kind ? kind.title : "") + "</p>" +
      '<section class="panel q-panel" id="qpanel">' + body + '<div id="fb"></div></section>';
  }
  function feedback(ok, extra) {
    const it = P.items[P.i];
    P.answered = true;
    const d = App.state.today();
    S.stats.ans++;
    if (ok) { P.ok++; S.stats.ok++; d.ok++; if (it.fromMistake) removeMistake(it.fromMistake); }
    else { d.bad++; P.wrong.push(it); addMistake(it.mk); }
    App.state.save();
    $$("#qpanel input, #qpanel .tok, #qpanel .key, #qpanel [data-act=dunno], #qpanel [data-act=build-check], #qpanel [data-act=build-reset], #qpanel form .btn").forEach((b) => { b.disabled = true; });
    const right = it.ear ? it.say : it.t === "choice" ? it.a : it.t === "build" ? it.answer : it.show;
    const esRight = it.t !== "choice" || !it.qEs;
    let html = '<div class="feedback ' + (ok ? "ok" : "bad") + '"><p class="head">' + (ok ? pick(["¡Correcto!", "¡Muy bien!", "¡Exacto!", "¡Perfecto!"]) : "Не совсем") + "</p>";
    if (extra) html += "<p>" + extra + "</p>";
    if (!ok || it.t !== "choice" || it.ear) html += '<div class="row"><p class="ans' + (esRight ? "" : " ru") + '">' + esc(right) + "</p>" + (esRight ? sayBtn(right) : sayBtn(it.say)) + "</div>";
    if ((it.pic || it.ear) && it.t === "choice") html += '<p class="muted small">' + esc(it.card.ru) + "</p>";
    if (it.why) html += '<p class="small">' + esc(it.why) + "</p>";
    if (it.t === "dict" || it.t === "build") html += '<p class="muted small">' + esc(it.ru || it.q) + "</p>";
    if (it.card && it.card.exEs && it.t !== "build") html += '<p class="small"><span class="es">' + esc(it.card.exEs) + '</span> — <span class="muted">' + esc(it.card.exRu) + "</span></p>";
    if (it.t === "conj") html += '<div class="table-wrap"><table class="t"><tbody>' + it.forms.map((f, i) => '<tr class="' + (i === it.p ? "hl" : "") + '"><td>' + esc(it.persons[i]) + '</td><td class="es">' + esc(f) + "</td></tr>").join("") + "</tbody></table></div>";
    if (!ok) html += '<div data-ai-slot="explain"></div>';
    html += '<div class="row"><button class="btn" data-act="next" data-autofocus>' + (P.i + 1 < P.items.length ? "Дальше" : "Итоги") + " <kbd>Enter</kbd></button></div></div>";
    const fb = $("#fb");
    fb.innerHTML = html;
    App.ai.refreshSlots();
    setTimeout(() => { const b = $("[data-act=next]", fb); if (b) b.focus({ preventScroll: true }); fb.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, 30);
    if (ok && it.t !== "dict" && !it.ear && it.say) speak(it.say);
  }
  function submitAnswer(given) {
    const it = P.items[P.i];
    if (P.answered) return;
    const r = srs.checkAnswer(given, it.answers, { articles: it.t === "type" });
    if (r.empty) { toast("Введите ответ или нажмите «Не знаю»."); return; }
    let extra = "";
    if (r.accent) extra = r.ok ? "Засчитано, но проверьте ударения." : "Почти: не хватает ударений.";
    if (r.article) extra = "Засчитано, но обратите внимание на артикль.";
    if (!r.ok) extra = (extra ? extra + " " : "") + "Ваш ответ: <span class=\"es\">" + esc(given) + "</span>";
    it.given = given;
    feedback(r.ok, extra);
  }
  function nextItem() {
    P.i++; P.answered = false; P.built = [];
    if (P.i >= P.items.length) { const d = App.state.today(); d.prac++; d.pk = d.pk || {}; d.pk[P.kind] = (d.pk[P.kind] || 0) + 1; App.state.save(); }
    App.router.render();
    const it = P.items[P.i];
    if (it && (it.t === "dict" || it.ear)) setTimeout(() => speak(it.say), 200);
  }
  function renderDone() {
    const n = P.items.length;
    const d = P.dialog && App.goals.dialogById(P.dialog);
    const again = '<button class="btn" data-act="' + (d ? "practice-dlg" : "practice-start") + '" data-arg="' + (d ? d.id : P.kind) + '">Ещё раз</button>';
    const links = d
      ? '<button class="btn ghost" data-act="open-dialog" data-arg="' + d.id + '">К сцене «' + esc(d.title) + "»</button>" + (App.goals.dlgLevel(d.id) < 2 && P.ok >= n * 0.7 ? '<button class="btn ghost" data-act="dlg-level" data-arg="' + d.id + ':2">Отметить: «Могу повторить»</button>' : "")
      : '<button class="btn ghost" data-act="go" data-arg="practice">Другие упражнения</button><button class="btn ghost" data-act="go" data-arg="today">План на сегодня</button>';
    return '<section class="panel stack" style="text-align:center;justify-items:center;padding:36px 24px"><p class="eyebrow">Resultado</p><h1 class="hero-date">' + P.ok + " из " + n + "</h1>" +
      "<p>" + (P.ok === n ? "Без единой ошибки. ¡Excelente!" : P.ok >= n * 0.7 ? "Хороший результат. Ошибки сохранены в «Работе над ошибками»." : "Есть над чем поработать — ошибки сохранены, их можно повторить отдельно.") + "</p>" +
      '<div class="row" style="justify-content:center">' + again + links + "</div></section>" +
      (P.wrong.length ? '<section class="panel stack"><h2 class="sec">Ошибки</h2><div class="wordlist">' + P.wrong.map((it) => {
        const right = it.t === "choice" ? it.a : it.t === "build" ? it.answer : it.show;
        const q = it.t === "dict" ? it.ru : it.t === "conj" ? it.v.inf + " · " + it.persons[it.p] : it.q;
        return '<div class="wordrow">' + sayBtn(it.say) + '<span class="es">' + esc(right) + '</span><span class="ru">' + esc(q) + "</span><span></span></div>";
      }).join("") + "</div></section>" : "");
  }

  // ---------------------------------------------------------------- обработчики
  App.slots.explain = () => (App.ai.AI.fn ? '<button class="btn quiet sm" data-act="explain">Объяснить ошибку (Claude)</button><div class="ai-text" id="explainOut"></div>' : "");
  Object.assign(App.act, {
    "practice-start": (b) => { App.router.open("practice"); start(b.dataset.arg); },
    "practice-dlg": (b) => { App.router.open("talk"); ui.Dlg.resp = null; start("dlg", b.dataset.arg); },
    "practice-exit": () => { P.active = false; App.router.render(); },
    choose: (b) => {
      if (P.answered) return;
      const it = P.items[P.i], i = Number(b.dataset.arg), ok = it.opts[i] === it.a;
      $$(".opt").forEach((o, k) => { o.disabled = true; if (it.opts[k] === it.a) o.classList.add("right"); else if (k === i) o.classList.add("wrong"); });
      it.given = it.opts[i];
      feedback(ok, ok ? "" : "Ваш выбор: " + esc(it.opts[i]));
    },
    dunno: () => { if (P.answered) return; P.items[P.i].given = "(не знаю)"; feedback(false, ""); },
    next: () => nextItem(),
    tok: (b) => { if (P.answered) return; P.built.push(Number(b.dataset.arg)); App.router.render(); },
    untok: (b) => { if (P.answered) return; P.built = P.built.filter((x) => x !== Number(b.dataset.arg)); App.router.render(); },
    "build-reset": () => { if (P.answered) return; P.built = []; App.router.render(); },
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
      const right = it.t === "choice" ? it.a : it.t === "build" ? it.answer : it.show;
      const task = it.t === "conj" ? "поставить глагол " + it.v.inf + " в форму «" + D.CONJ.TENSES.find((t) => t.id === it.tense).es + "», лицо " + it.persons[it.p]
        : it.t === "dict" ? "записать на слух испанскую фразу" : it.t === "build" ? "собрать испанскую фразу с переводом «" + it.q + "»" : it.t === "type" ? "перевести на испанский «" + it.q + "»" : "выбрать перевод для «" + it.q + "»";
      await App.ai.streamInto($("#explainOut"), "Ученик — русскоязычный, учит латиноамериканский испанский (" + App.cfg.country().ru + "), уровень " + S.settings.level + ". Задание: " + task + ". Правильный ответ: «" + right + "». Ответ ученика: «" + (it.given || "") + "».\nОбъясни по-русски в 2–4 коротких предложениях, в чём ошибка и как это запомнить. Если ответ ученика тоже допустим в Латинской Америке — так и скажи.", { modelTier: "quick" });
    },
    "conj-tense": (b) => { const t = b.dataset.arg, cur = S.settings.conjTenses; S.settings.conjTenses = cur.includes(t) ? (cur.length > 1 ? cur.filter((x) => x !== t) : cur) : cur.concat([t]); App.state.save(); App.router.render(); },
    "conj-set": (b) => { S.settings.conjSet = b.dataset.arg; App.state.save(); App.router.render(); }
  });
  App.forms.answer = () => submitAnswer($("#ans").value);
  // Enter — следующее задание, 1–4 — выбор варианта
  App.keys.push((e, typing) => {
    if (!P.active || !P.items[P.i]) return false;
    const t = e.target;
    if (P.answered && e.key === "Enter" && !(t.tagName === "BUTTON" && t.dataset.act !== "next")) { e.preventDefault(); nextItem(); return true; }
    if (!P.answered && !typing && P.items[P.i].t === "choice" && /^[1-4]$/.test(e.key)) { const b = $$(".opt")[Number(e.key) - 1]; if (b) b.click(); }
    return true;
  });

  App.views.practice = {
    needs: (sub) => (sub === "home" ? ["verbs"] : []),
    render: (sub) => (sub === "home" ? renderHome() : renderSession())
  };
  App.practice = { start, addMistake };
})(window.App = window.App || {});
