// Раздел «Слова»: темы, топ-1500, поиск, своя тема «Мои слова», подбор слов с Claude.
(function (App) {
  "use strict";
  const { $, $$, esc, plural, dayKey, rank, stripAcc, norm, ARTICLE, keysHTML, loadingHTML, toast } = App.util;
  const S = App.S;
  const D = App.D;
  const srs = App.srs, goals = App.goals;
  const ui = App.ui;
  const { sayBtn } = App.audio;

  function deckBar(dc) {
    const t = dc.total || 1;
    return '<div class="bar" aria-hidden="true"><i class="b-learned" style="width:' + (dc.learned / t * 100) + '%"></i><i class="b-learning" style="width:' + (dc.learning / t * 100) + '%"></i></div>';
  }
  function deckCard(d) {
    const dc = srs.deckCounts(d.id);
    const fam = dc.learned + dc.learning;
    const g = d.group !== "top" ? goals.goalOfDeck(d.id) : null;
    return '<section class="panel deck' + (g && S.settings.focus.includes(g.id) ? " focus" : "") + '"><div class="deck-top"><div><div class="deck-title">' + esc(d.title) + '</div><div class="deck-es">' + esc(d.es) + "</div></div>" +
      '<div class="deck-frac num"><b>' + fam + "</b>/" + dc.total + "</div></div>" + deckBar(dc) +
      '<div class="deck-foot"><span class="muted small">' + (dc.due ? '<span class="chip sun">' + dc.due + " к повтору</span> " : "") + (dc.learned ? dc.learned + " выучено надолго" : fam ? "знакомо " + fam + " из " + dc.total : "ещё не начато") + '</span><div class="row">' +
      '<label class="switch"><input type="checkbox" data-act="deck-toggle" data-arg="' + d.id + '"' + (srs.enabledDeck(d.id) ? " checked" : "") + "> В плане</label>" +
      '<button class="btn ghost sm" data-act="open-deck" data-arg="' + d.id + '">Открыть</button></div></div></section>';
  }
  function statusChip(c) {
    const s = srs.status(c.id), t = dayKey();
    if (s === "learned") return '<span class="chip ok">выучено</span>';
    if (s === "learning") return srs.isDue(c.id, t) ? '<span class="chip sun">повторить</span>' : '<span class="chip acc">через ' + esc(srs.intervalLabel(Math.max(1, Math.round((new Date(S.cards[c.id].d) - new Date(t)) / 86400000)))) + "</span>";
    return '<span class="chip">новое</span>';
  }

  function renderList() {
    const c = srs.counts();
    const decks = srs.deckList();
    const top = decks.filter((d) => d.group === "top"), themes = decks.filter((d) => d.group !== "top");
    const order = srs.themeOrder();
    themes.sort((a, b) => rank(order, a.id) - rank(order, b.id));
    const topFam = top.reduce((a, d) => { const dc = srs.deckCounts(d.id); return a + dc.learned + dc.learning; }, 0);
    return '<header class="page-head"><div><h1>Слова</h1><p class="sub">Vocabulario para la mudanza</p></div>' +
      '<div class="row"><button class="btn ghost" data-act="add-own">+ Своё слово</button><button class="btn" data-act="cards-start"' + (c.due + c.newToday ? "" : " disabled") + ">Учить: " + c.due + " повторить · " + c.newToday + " новых</button></div></header>" +
      '<div class="search-box"><input type="search" id="wordSearch" placeholder="Поиск по словам и фразам: по-испански или по-русски" value="' + esc(ui.UI.search) + '" autocomplete="off" aria-label="Поиск по словам и фразам">' + keysHTML() + '<div id="searchResults" aria-live="polite"></div></div>' +
      '<p class="muted">Новые слова приходят по ' + srs.newPerDayNow() + " в день поровну из топ-1500 и из тем для переезда — сначала из ваших целей. Карточку, которую вы вспомнили легко, приложение покажет нескоро; трудную — снова скоро.</p>" +
      '<div class="legend"><span class="l1">выучено надолго (интервал от 3 недель)</span><span class="l2">знакомо, в процессе</span><span>не начато</span></div>' +
      '<div class="sec-head"><h2 class="sec">Темы для переезда</h2><span class="muted small">сначала ваши цели</span></div>' +
      '<div class="grid-2">' + themes.map(deckCard).join("") + "</div>" +
      '<div class="sec-head"><h2 class="sec">Топ-1500 самых употребительных слов</h2><span class="muted small num">знакомо ' + topFam + " из " + top.reduce((a, d) => a + d.words.length, 0) + "</span></div>" +
      '<p class="muted small">Тысяча самых частых слов покрывает около 80% повседневной речи. Отделы 1–5 — основа, 6–10 — бытовые глаголы, вещи и места, люди и чувства, разговорные выражения. 11–15 — для уверенной жизни на месте: техника и кухня, работа и деньги, здоровье, связки и идиомы.</p>' +
      '<div class="grid-2">' + top.map(deckCard).join("") + "</div>" +
      '<section class="panel stack"><h2 class="sec">Новые слова по вашей теме</h2><p class="muted">Напишите тему — Claude подберёт 10 слов с примерами, принятыми в стране «' + esc(App.cfg.country().ru) + '». Выбранные слова попадут в «Мои слова».</p><div data-ai-slot="gen"></div></section>';
  }

  // ---------------------------------------------------------------- поиск
  // Ищет по словам, репликам и выражениям диалогов, без учёта ударений
  function searchAll(q) {
    const nq = stripAcc(norm(q));
    if (nq.length < 2) return [];
    const hit = (s) => stripAcc(norm(s)).includes(nq);
    const out = [];
    for (const c of srs.uniqueAll()) if (hit(c.es) || hit(c.ru)) out.push({ type: "card", c });
    for (const d of D.DIALOGS) {
      if (!d.lines) continue;
      d.vocab.forEach((v) => { if (hit(v[0]) || hit(v[1])) out.push({ type: "phrase", es: v[0], ru: v[1], d }); });
      d.lines.forEach((l) => { if (hit(l[1]) || hit(l[2])) out.push({ type: "line", es: l[1], ru: l[2], d }); });
    }
    const exact = (r) => {
      const s = stripAcc(norm(r.c ? r.c.es : r.es)).replace(ARTICLE, ""), ru = stripAcc(norm(r.c ? r.c.ru : r.ru));
      return s === nq || ru === nq ? 0 : s.startsWith(nq) || ru.startsWith(nq) ? 1 : 2;
    };
    return out.sort((a, b) => exact(a) - exact(b) || (a.type === "card" ? -1 : 1)).slice(0, 40);
  }
  function renderSearch() {
    const box = $("#searchResults");
    if (!box) return;
    const q = ui.UI.search.trim();
    if (q.length < 2) { box.innerHTML = ""; return; }
    if (!App.data.has("dialogs")) {
      box.innerHTML = loadingHTML("Ищу…");
      App.data.load("dialogs").then(renderSearch, () => { box.innerHTML = '<p class="muted small">Не удалось загрузить фразы из диалогов — ищу только по словам.</p>'; });
      return;
    }
    const res = searchAll(q);
    if (!res.length) {
      box.innerHTML = '<div class="empty"><p>Ничего не нашлось по запросу «' + esc(q) + '».</p><button class="btn ghost sm" data-act="add-own" data-arg="' + esc(q) + '">Добавить «' + esc(q) + "» в мои слова</button></div>";
      return;
    }
    // Список собирается одной строкой и вставляется за один раз — без перерисовки по строке
    box.innerHTML = '<p class="muted small">Найдено: ' + res.length + (res.length === 40 ? "+" : "") + '</p><div class="wordlist">' + res.map((r) => {
      if (r.type === "card") {
        const s = srs.isSkipped(r.c) ? '<span class="chip">скрыто</span>' : statusChip(r.c);
        return '<div class="wordrow">' + sayBtn(r.c.es) + '<span class="es">' + esc(r.c.es) + '</span><span class="ru">' + esc(r.c.ru) + '<br><span class="small">' + esc((srs.deckById(r.c.deck) || {}).title || "") + "</span></span>" + s + "</div>";
      }
      const inMine = S.custom.some((w) => w[0] === r.es);
      return '<div class="wordrow">' + sayBtn(r.es) + '<span class="es">' + esc(r.es) + '</span><span class="ru">' + esc(r.ru) + '<br><span class="small">' + (r.type === "line" ? "реплика" : "выражение") + " · сцена «" + esc(r.d.title) + "»</span></span>" +
        '<span class="row-actions"><button class="btn quiet sm" data-act="open-dialog" data-arg="' + r.d.id + '">К сцене</button>' + (inMine ? '<span class="chip ok">в моих</span>' : '<button class="btn quiet sm" data-act="add-phrase" data-es="' + esc(r.es) + '" data-ru="' + esc(r.ru) + '" data-src="' + esc(r.d.title) + '">+ в мои</button>') + "</span></div>";
    }).join("") + "</div>";
  }

  // ---------------------------------------------------------------- тема
  function renderDeck() {
    const id = ui.UI.deck;
    const d = srs.deckById(id);
    if (!d) { ui.UI.deck = null; return renderList(); }
    const list = srs.ALL.filter((c) => c.deck === id);
    const dc = srs.deckCounts(id);
    const freshLeft = list.filter((c) => !S.cards[c.id] && !srs.isSkipped(c)).length;
    let html = '<div class="row"><button class="btn quiet sm" data-act="back-words">← Все темы</button></div>' +
      '<header class="page-head"><div><h1>' + esc(d.title) + '</h1><p class="sub">' + esc(d.es) + "</p></div>" +
      '<div class="row">' + (dc.due ? '<button class="btn" data-act="cards-deck" data-arg="' + id + '">Повторить ' + dc.due + "</button>" : "") +
      (freshLeft ? '<button class="btn ' + (dc.due ? "ghost" : "") + '" data-act="cards-deck-new" data-arg="' + id + '">Учить 10 новых</button>' : "") + "</div></header>" +
      '<div class="deck-summary"><span class="num"><b>' + (dc.learned + dc.learning) + "</b> из " + dc.total + " знакомо</span>" + deckBar(dc) + (dc.skipped ? '<span class="muted small">скрыто: ' + dc.skipped + "</span>" : "") + "</div>";
    if (id === "custom") {
      html += '<section class="panel stack"><h2 class="sec">Добавить слово или фразу</h2><form class="stack" data-form="add-word">' +
        '<div class="grid-2"><label class="field">По-испански<input type="text" id="awEs" lang="es" autocomplete="off" required placeholder="la guardería" value="' + esc(ui.UI.prefill || "") + '"' + (ui.UI.prefill !== null ? " data-autofocus" : "") + '></label><label class="field">Перевод<input type="text" id="awRu" autocomplete="off" required placeholder="детский сад"></label></div>' +
        '<div class="grid-2"><label class="field">Пример (необязательно)<input type="text" id="awEx" lang="es" autocomplete="off"></label><label class="field">Перевод примера<input type="text" id="awExRu" autocomplete="off"></label></div>' +
        keysHTML() + '<div class="row"><button class="btn">Добавить</button></div></form></section>';
    }
    if (!list.length) return html + '<div class="empty"><p><b>Здесь пока пусто.</b> Добавьте слово формой выше — оно придёт в карточках вместе с новыми словами. Ещё можно добавлять выражения из диалогов кнопкой «+ в карточки» или подобрать слова по теме с Claude в разделе «Слова».</p></div>';
    html += '<p class="muted small">«Знаю» — слово уже знакомо, приложение покажет его не скоро. «Скрыть» — больше не показывать.</p>';
    html += '<section class="panel"><div class="wordlist">' + list.map((c) => {
      const sk = srs.isSkipped(c);
      const actions = sk ? '<button class="btn quiet sm" data-act="word-unskip" data-arg="' + esc(c.id) + '">Вернуть</button>'
        : (!S.cards[c.id] ? '<button class="btn quiet sm" data-act="word-known" data-arg="' + esc(c.id) + '">Знаю</button>' : "") + '<button class="btn quiet sm" data-act="word-skip" data-arg="' + esc(c.id) + '">Скрыть</button>';
      return '<div class="wordrow' + (sk ? " skipped" : "") + '">' + sayBtn(c.es) + '<span class="es">' + esc(c.es) + '</span><span class="ru">' + esc(c.ru) + (c.note ? '<br><span class="small">' + esc(c.note) + "</span>" : "") + "</span>" +
        '<span class="row-actions">' + (sk ? '<span class="chip">скрыто</span>' : statusChip(c)) + actions + "</span></div>";
    }).join("") + "</div></section>";
    return html;
  }

  // ---------------------------------------------------------------- действия
  function openDeck(id, prefill) {
    App.router.open("words");
    ui.UI.deck = id; ui.UI.prefill = prefill == null ? null : prefill;
    const dk = srs.deckById(id);
    if (dk && dk.words[0]) App.audio.preload([dk.words[0][0]]);
    App.router.render(); window.scrollTo(0, 0);
  }
  function addOwn(es, ru, exEs, exRu, note) {
    if (S.custom.some((w) => w[0] === es)) return false;
    S.custom.push([es, ru, exEs || "", exRu || "", note || ""]);
    srs.buildCards(); App.state.save();
    return true;
  }
  const rerender = () => App.router.render();

  App.slots.gen = () => {
    const { AI, aiNote } = App.ai;
    if (!AI.fn) return aiNote();
    const g = ui.UI.gen;
    let html = '<form class="row" data-form="gen"><input type="text" id="genTopic" placeholder="Например: аренда машины, детский сад, спортзал" value="' + esc(g && g.topic || "") + '" style="flex:1 1 260px"><button class="btn"' + (g && g.busy ? " disabled" : "") + ">" + (g && g.busy ? "Подбираю…" : "Подобрать слова") + "</button></form>";
    if (g && g.error) html += '<p class="muted small">' + esc(g.error) + "</p>";
    if (g && g.items && g.items.length) {
      html += '<div class="wordlist">' + g.items.map((w, i) => '<label class="wordrow"><input type="checkbox" data-gen="' + i + '" checked><span class="es">' + esc(w.es) + '</span><span class="ru">' + esc(w.ru) + (w.note ? " · " + esc(w.note) : "") + "</span>" + sayBtn(w.es) + "</label>").join("") + "</div>" +
        '<div class="row"><button class="btn" data-act="gen-add">Добавить выбранные</button><button class="btn ghost" data-act="gen-clear">Убрать список</button></div>';
    }
    return html;
  };

  Object.assign(App.act, {
    "open-deck": (b) => openDeck(b.dataset.arg),
    "back-words": () => { ui.UI.deck = null; rerender(); },
    "deck-toggle": (b) => { const id = b.dataset.arg; S.settings.decksOff = b.checked ? S.settings.decksOff.filter((x) => x !== id) : S.settings.decksOff.concat([id]); App.state.save(); rerender(); },
    "word-known": (b) => { srs.markKnown(b.dataset.arg); App.state.save(); rerender(); toast("Отмечено как знакомое."); },
    "word-skip": (b) => { const c = srs.BY_ID.get(b.dataset.arg); if (c) { S.skip[c.es] = dayKey(); App.state.save(); rerender(); } },
    "word-unskip": (b) => { const c = srs.BY_ID.get(b.dataset.arg); if (c) { delete S.skip[c.es]; App.state.save(); rerender(); } },
    "add-own": (b) => openDeck("custom", b.dataset.arg || ""),
    "add-phrase": (b) => { if (addOwn(b.dataset.es, b.dataset.ru, "", "", "Из диалога «" + b.dataset.src + "»")) toast("Добавлено в «Мои слова»."); renderSearch(); },
    "gen-add": () => {
      const g = ui.UI.gen; if (!g || !g.items) return;
      let n = 0;
      $$("[data-gen]").forEach((cb) => { if (!cb.checked) return; const w = g.items[Number(cb.dataset.gen)]; if (!S.custom.some((x) => x[0] === w.es)) { S.custom.push([w.es, w.ru, w.exEs, w.exRu, w.note]); n++; } });
      ui.UI.gen = null; srs.buildCards(); App.state.save(); rerender();
      toast(n ? "Добавлено " + n + " " + plural(n, "слово", "слова", "слов") + " в «Мои слова»." : "Эти слова уже есть в «Моих словах».");
    },
    "gen-clear": () => { ui.UI.gen = null; App.ai.refreshSlots(); }
  });
  Object.assign(App.forms, {
    "add-word": () => {
      const es = $("#awEs").value.trim(), ru = $("#awRu").value.trim();
      if (!es || !ru) { toast("Заполните слово и перевод."); return; }
      if (!addOwn(es, ru, $("#awEx").value.trim(), $("#awExRu").value.trim(), "")) { toast("Такое слово уже есть."); return; }
      ui.UI.prefill = null; rerender(); toast("Слово добавлено. Оно придёт в карточках вместе с новыми словами.");
    },
    gen: () => {
      const { AI, aiError, refreshSlots } = App.ai;
      const topic = $("#genTopic").value.trim();
      if (!topic || !AI.fn) return;
      ui.UI.gen = { topic, busy: true };
      refreshSlots();
      const c = App.cfg.country();
      AI.fn.json("Составь список из 10 полезных слов и выражений по теме «" + topic + "» для русскоязычного человека, который переезжает жить в страну: " + c.ru + " (уровень " + S.settings.level + "). Используй лексику, принятую именно в " + c.es + "; существительные — с артиклем.\nОтветь только JSON-массивом: [{\"es\":\"слово по-испански\",\"ru\":\"перевод\",\"exEs\":\"короткий пример по-испански\",\"exRu\":\"перевод примера\",\"note\":\"региональная пометка или пустая строка\"}]", { modelTier: "default" })
        .then((arr) => {
          const items = (Array.isArray(arr) ? arr : []).filter((w) => w && typeof w.es === "string" && typeof w.ru === "string" && w.es.trim()).slice(0, 15)
            .map((w) => ({ es: w.es.trim(), ru: w.ru.trim(), exEs: String(w.exEs || "").trim(), exRu: String(w.exRu || "").trim(), note: String(w.note || "").trim() }));
          ui.UI.gen = { topic, items, error: items.length ? "" : "Claude не вернул слов. Попробуйте уточнить тему." };
        })
        .catch((err) => { ui.UI.gen = { topic, error: aiError(err) }; })
        .finally(() => { if (ui.route === "words") refreshSlots(); });
    }
  });
  let searchTimer;
  App.inputs.wordSearch = (el) => { ui.UI.search = el.value; clearTimeout(searchTimer); searchTimer = setTimeout(renderSearch, 150); };

  App.views.words = {
    // Список тем рисуется без примеров; странице темы нужны примеры и заметки её слов
    needs: (sub) => (sub === "deck" ? srs.detailChunks([ui.UI.deck]) : []),
    render: (sub) => (sub === "deck" ? renderDeck() : renderList()),
    after: (sub) => { if (sub === "list" && ui.UI.search) renderSearch(); },
    deckBar, addOwn, openDeck
  };
})(window.App = window.App || {});
