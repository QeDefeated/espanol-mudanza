// Сессия карточек: «Не знаю / Почти / Знаю», «Уже знаю», «Больше не показывать», пример из сцены.
// Режим «по картинкам»: на лицевой стороне только картинка, нужно вспомнить испанское слово.
(function (App) {
  "use strict";
  const { esc, dayKey, shuffle, toast } = App.util;
  const { GRADES } = App.cfg;
  const S = App.S;
  const srs = App.srs;
  const ui = App.ui;
  const Cards = ui.Cards;
  const { sayBtn, speak } = App.audio;

  // Собирает очередь: повторения вперемешку с новыми (два повторения — одно новое).
  // Перед стартом подгружаются примеры тем из очереди, чтобы карточки открывались без задержки.
  async function start(opts) {
    opts = opts || {};
    const t = dayKey();
    const inDeck = (c) => (!opts.deck || c.deck === opts.deck) && (!opts.pics || c.pic);
    let due = shuffle(srs.uniqueByEs(srs.ALL.filter((c) => inDeck(c) && !srs.isSkipped(c) && srs.isDue(c.id, t))));
    if (opts.maxDue != null) due = due.slice(0, opts.maxDue);
    const nNew = opts.extraNew != null ? opts.extraNew : srs.counts().newToday;
    const fresh = (opts.pics ? srs.freshPics() : srs.freshCandidates(opts.deck)).slice(0, nNew);
    if (opts.onlyNew) due = [];
    const q = [];
    let i = 0, j = 0;
    while (i < due.length || j < fresh.length) {
      if (i < due.length) q.push(due[i++]);
      if (i < due.length) q.push(due[i++]);
      if (j < fresh.length) q.push(fresh[j++]);
    }
    if (!q.length) { toast(opts.pics ? "По картинкам сейчас нечего повторять. Возьмите 10 новых слов с картинками." : "Сейчас нечего повторять. Новые карточки появятся завтра."); return; }
    App.audio.preload(q.map((c) => c.es));
    try { await srs.ensureDetails(q.map((c) => c.deck)); } catch (e) { /* карточки без примеров тоже работают */ }
    Object.assign(Cards, { active: true, queue: q.map((c) => ({ id: c.id, isNew: !S.cards[c.id] })), pos: 0, shown: false, done: 0, again: 0, deck: opts.deck || null, pics: !!opts.pics });
    pickFront();
    App.router.render(); window.scrollTo(0, 0);
    autoSay();
  }
  function pickFront() {
    const it = Cards.queue[Cards.pos];
    if (!it) return;
    const d = S.settings.dir;
    Cards.hint = false;
    if (Cards.pics) { Cards.front = "pic"; return; }
    Cards.front = it.isNew ? "es" : d === "mixed" ? (Math.random() < 0.5 ? "es" : "ru") : d;
  }
  function autoSay() {
    const it = Cards.queue[Cards.pos];
    if (!it || !S.settings.autoplay) return;
    if (Cards.front === "es" || Cards.shown) speak(srs.BY_ID.get(it.id).es);
  }
  function renderCard() {
    const it = Cards.queue[Cards.pos];
    if (!it) return renderDone();
    const c = srs.BY_ID.get(it.id);
    const deck = srs.deckById(c.deck);
    const st = S.cards[c.id];
    const total = Cards.queue.length;
    const isPic = Cards.front === "pic";
    // В обычном режиме картинка на лицевой стороне только там, где она не подсказывает ответ: при переводе с русского и у нового слова
    const picFront = c.pic && !isPic && (Cards.front === "ru" || it.isNew);
    const picHTML = (cls) => '<div class="pic ' + cls + '" role="img" aria-label="Картинка к слову">' + c.pic + "</div>";
    const front = isPic
      ? picHTML("pic-xl") + (Cards.hint || Cards.shown ? "" : '<button class="btn quiet sm" data-act="card-hint">Подсказка: перевод</button>') + (Cards.hint && !Cards.shown ? '<p class="muted">' + esc(c.ru) + "</p>" : "")
      : (picFront ? picHTML("pic-lg") : "") + (Cards.front === "es"
        ? '<p class="flash-prompt es">' + esc(c.es) + "</p>"
        : '<p class="flash-prompt ru">' + esc(c.ru) + "</p>");
    let back = "";
    if (Cards.shown) {
      const ctx = srs.dialogContext(c);
      back = '<div class="flash-answer">' +
        (c.pic && !isPic && !picFront ? picHTML("pic-lg") : "") +
        (isPic ? '<div class="row" style="justify-content:center"><p class="main-ans es">' + esc(c.es) + "</p>" + sayBtn(c.es) + '</div><p class="main-ans ru">' + esc(c.ru) + "</p>" : Cards.front === "es" ? '<p class="main-ans ru">' + esc(c.ru) + "</p>" : '<div class="row" style="justify-content:center"><p class="main-ans es">' + esc(c.es) + "</p>" + sayBtn(c.es) + "</div>") +
        (c.exEs ? '<div class="example"><div class="row" style="justify-content:center"><p class="es">' + esc(c.exEs) + "</p>" + sayBtn(c.exEs) + '</div><p class="muted small">' + esc(c.exRu) + "</p></div>" : "") +
        (ctx ? '<div class="context"><p class="eyebrow">В сцене «' + esc(ctx.dialog.title) + '»</p><div class="row" style="justify-content:center"><p class="es">' + esc(ctx.es) + "</p>" + sayBtn(ctx.es) + '</div><p class="muted small">' + esc(ctx.ru) + "</p></div>" : "") +
        (c.note ? '<p class="note">' + esc(c.note) + "</p>" : "") + "</div>" +
        '<div class="grades three">' + GRADES.map(([l, g], k) =>
          '<button class="grade g' + g + '" data-act="grade" data-arg="' + g + '">' + l + " <small>" + esc(srs.intervalLabel(srs.nextInterval(st, g).i)) + ' · <kbd>' + (k + 1) + "</kbd></small></button>").join("") + "</div>" +
        '<div class="row card-extra"><button class="btn quiet sm" data-act="card-known">Уже знаю это слово</button><button class="btn quiet sm" data-act="card-skip">Больше не показывать</button></div>';
    }
    return '<div class="sess-top"><button class="btn quiet sm" data-act="cards-exit">← Выйти</button><div class="progress" aria-hidden="true"><i style="width:' + (Cards.pos / total * 100) + '%"></i></div><span class="muted small num">' + (Cards.pos + 1) + " / " + total + "</span></div>" +
      '<section class="panel flash">' +
      '<div class="row" style="justify-content:center"><span class="chip">' + esc(deck ? deck.title : "") + "</span>" + (it.isNew ? '<span class="chip acc">новое слово</span>' : '<span class="chip">повторение</span>') + "</div>" +
      (Cards.front === "es" ? '<div class="row" style="justify-content:center">' + front + sayBtn(c.es) + "</div>" : front) +
      (Cards.shown ? back : '<button class="btn" data-act="flip" data-autofocus>Показать ответ <kbd>Пробел</kbd></button>' + (it.isNew ? '<button class="btn quiet sm" data-act="card-known">Я это уже знаю</button>' : "")) +
      "</section>" +
      '<p class="muted small" style="text-align:center">' + (isPic ? "Назовите по-испански вслух, что на картинке, затем откройте ответ." : Cards.front === "es" ? "Вспомните перевод, затем откройте ответ." : "Скажите это по-испански вслух, затем откройте ответ.") + " Клавиши 1–3 — оценка.</p>";
  }
  function renderDone() {
    const c = srs.counts();
    return '<section class="panel stack" style="text-align:center;justify-items:center;padding:40px 24px"><p class="eyebrow">¡Listo!</p><h1 class="hero-date">Готово</h1>' +
      "<p>Пройдено карточек: <b>" + Cards.done + "</b>" + (Cards.again ? ", из них забытых: " + Cards.again : "") + ".</p>" +
      '<div class="row" style="justify-content:center">' + (c.due ? '<button class="btn" data-act="cards-start">Повторить оставшиеся (' + c.due + ")</button>" : "") +
      '<button class="btn ghost" data-act="go" data-arg="today">К плану на сегодня</button>' + (Cards.pics ? '<button class="btn ghost" data-act="cards-pics-new">Ещё 10 слов по картинкам</button>' : '<button class="btn ghost" data-act="cards-more">Ещё 10 новых слов</button>') + "</div></section>";
  }

  function countSeen(it) {
    const d = App.state.today();
    if (it.isNew && !it.counted) { d.nw++; it.counted = true; } else if (!it.isNew) d.rev++;
  }
  function next() {
    Cards.pos++; Cards.shown = false;
    pickFront();
    App.router.render();
    autoSay();
  }
  function doGrade(g) {
    const it = Cards.queue[Cards.pos];
    if (!it || !Cards.shown) return;
    countSeen(it);
    srs.grade(it.id, g);
    Cards.done++;
    if (g === 0) {
      Cards.again++;
      Cards.queue.splice(Math.min(Cards.queue.length, Cards.pos + 4), 0, { id: it.id, isNew: false, counted: true, again: true });
      App.practice.addMistake({ k: "card", id: it.id });
    }
    App.state.save();
    next();
  }
  // Убирает из оставшейся очереди повторы этого слова
  const dropFromQueue = (es) => { Cards.queue = Cards.queue.filter((q, k) => k <= Cards.pos || srs.BY_ID.get(q.id).es !== es); };
  function known() {
    const it = Cards.queue[Cards.pos];
    if (!it) return;
    countSeen(it);
    srs.markKnown(it.id);
    dropFromQueue(srs.BY_ID.get(it.id).es);
    Cards.done++;
    App.state.save();
    toast("Отмечено как знакомое: покажу снова через 2 месяца.");
    next();
  }
  function skip() {
    const it = Cards.queue[Cards.pos];
    if (!it) return;
    const c = srs.BY_ID.get(it.id);
    S.skip[c.es] = dayKey();
    dropFromQueue(c.es);
    App.state.save();
    toast("Слово скрыто. Вернуть можно в списке темы.");
    next();
  }
  function flip() {
    Cards.shown = true;
    App.router.render();
    if (S.settings.autoplay && Cards.front !== "es") speak(srs.BY_ID.get(Cards.queue[Cards.pos].id).es);
  }

  Object.assign(App.act, {
    "cards-start": () => start(),
    "cards-min": () => start({ maxDue: 20, extraNew: Math.min(srs.counts().newToday, 5) }),
    "cards-more": () => start({ extraNew: 10, onlyNew: true }),
    "cards-deck": (b) => start({ deck: b.dataset.arg, extraNew: 0 }),
    "cards-deck-new": (b) => start({ deck: b.dataset.arg, extraNew: 10, onlyNew: true }),
    "cards-pics": () => start({ pics: true }),
    "cards-pics-new": () => start({ pics: true, extraNew: 10, onlyNew: true }),
    "card-hint": () => { Cards.hint = true; App.router.render(); },
    "cards-exit": () => { Cards.active = false; App.state.save(); App.router.render(); },
    flip,
    grade: (b) => doGrade(Number(b.dataset.arg)),
    "card-known": known,
    "card-skip": skip
  });
  // Пробел/Enter — показать ответ, 1–3 — оценка
  App.keys.push((e, typing) => {
    if (!Cards.active || !Cards.queue[Cards.pos]) return false;
    if (typing) return true;
    const t = e.target;
    if (!Cards.shown && (e.key === " " || e.key === "Enter")) { e.preventDefault(); flip(); return true; }
    if (Cards.shown && /^[1-3]$/.test(e.key)) { e.preventDefault(); doGrade(GRADES[Number(e.key) - 1][1]); return true; }
    if (Cards.shown && (e.key === " " || e.key === "Enter") && t.tagName !== "BUTTON") { e.preventDefault(); doGrade(2); }
    return true;
  });

  App.views.cards = { render: renderCard };
})(window.App = window.App || {});
