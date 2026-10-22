// Онбординг: страна, уровень, минуты в день, цели переезда.
(function (App) {
  "use strict";
  const { esc, plural, toast } = App.util;
  const { COUNTRIES, MINUTES, NEW_BY_MINUTES, LEVELS } = App.cfg;
  const S = App.S;
  const D = App.D;
  const ui = App.ui;
  const STEPS = 5;

  function draft() {
    if (!ui.UI.ob) {
      const s = S.settings;
      ui.UI.ob = { step: 0, country: s.country, level: s.level, minutes: MINUTES.includes(s.minutes) ? s.minutes : 30, focus: s.focus.slice() };
    }
    return ui.UI.ob;
  }
  function optCard(act, arg, title, sub, on) {
    return '<button class="choice-card" data-act="' + act + '" data-arg="' + esc(arg) + '" aria-pressed="' + !!on + '"><span class="choice-title">' + esc(title) + "</span>" + (sub ? '<span class="choice-sub">' + esc(sub) + "</span>" : "") + "</button>";
  }
  function render() {
    const o = draft();
    const dots = '<div class="ob-dots" aria-label="Шаг ' + (o.step + 1) + " из " + STEPS + '">' + Array.from({ length: STEPS }, (_, i) => '<i class="' + (i === o.step ? "on" : i < o.step ? "done" : "") + '"></i>').join("") + "</div>";
    let body = "", canNext = true;
    if (o.step === 0) {
      body = '<p class="eyebrow">¡Bienvenido!</p><h1 class="ob-title">Куда вы переезжаете?</h1><p class="muted">От страны зависят местные слова в подсказках и то, как с вами будет говорить Claude. Сменить можно в любой момент.</p>' +
        '<div class="choice-grid">' + Object.entries(COUNTRIES).map(([k, c]) => optCard("ob-country", k, c.ru, c.es, o.country === k)).join("") + "</div>";
    } else if (o.step === 1) {
      body = '<p class="eyebrow">Paso 2</p><h1 class="ob-title">Какой у вас уровень испанского?</h1><p class="muted">Если сомневаетесь, выберите A1 — начнём с самого нужного и не будем перегружать.</p>' +
        '<div class="choice-grid one">' + LEVELS.map((l) => optCard("ob-level", l.id, l.title, l.sub, o.level === l.id)).join("") + "</div>";
    } else if (o.step === 2) {
      body = '<p class="eyebrow">Paso 3</p><h1 class="ob-title">Сколько минут в день готовы заниматься?</h1><p class="muted">Лучше каждый день понемногу, чем час раз в неделю. От времени зависит число новых слов в день.</p>' +
        '<div class="choice-grid">' + MINUTES.map((m) => optCard("ob-minutes", String(m), m + " минут", NEW_BY_MINUTES[m] + " " + plural(NEW_BY_MINUTES[m], "новое слово", "новых слова", "новых слов") + " в день", o.minutes === m)).join("") + "</div>";
    } else if (o.step === 3) {
      canNext = o.focus.length > 0;
      body = '<p class="eyebrow">Paso 4</p><h1 class="ob-title">Что сейчас важнее всего?</h1><p class="muted">Можно выбрать несколько. Слова, диалоги и план дня начнутся с этих тем.</p>' +
        '<div class="choice-grid">' + D.GOALS.map((g) => optCard("ob-focus", g.id, g.title, "Цель: " + g.can, o.focus.includes(g.id))).join("") + "</div>";
    } else {
      const goals = o.focus.map((id) => D.GOALS.find((g) => g.id === id)).filter(Boolean);
      body = '<p class="eyebrow">¡Listo!</p><h1 class="ob-title">Ваш план готов</h1>' +
        '<ul class="ob-summary"><li><b>Переезд:</b> ' + esc(COUNTRIES[o.country].ru) + "</li><li><b>Уровень:</b> " + esc(o.level) + "</li><li><b>В день:</b> " + o.minutes + " минут, " + NEW_BY_MINUTES[o.minutes] + " новых слов</li><li><b>Цели:</b> " + goals.map((g) => esc(g.title)).join(", ") + "</li></ul>" +
        "<p>Первую неделю план щадящий: меньше новых слов, больше повторения базовых фраз. Каждый день будет вариант «Минимум» на 10–15 минут — для дней, когда времени мало.</p>";
    }
    return '<section class="panel ob">' + dots + body +
      '<div class="row ob-nav">' + (o.step > 0 ? '<button class="btn ghost" data-act="ob-back">Назад</button>' : '<button class="btn quiet" data-act="ob-skip">Пропустить</button>') +
      (o.step < STEPS - 1 ? '<button class="btn" data-act="ob-next"' + (canNext ? "" : " disabled") + ">Дальше</button>" : '<button class="btn" data-act="ob-finish" data-autofocus>Начать заниматься</button>') + "</div></section>";
  }
  function finish(skip) {
    const o = draft();
    const s = S.settings;
    if (!skip) {
      s.country = o.country; s.level = o.level; s.minutes = o.minutes; s.newPerDay = NEW_BY_MINUTES[o.minutes]; s.focus = o.focus.slice();
    }
    s.onboarded = true;
    ui.UI.ob = null;
    App.state.save();
    App.router.open("today");
    App.router.render(); window.scrollTo(0, 0);
    if (!skip) toast("Готово! План на сегодня собран под ваши цели.");
  }
  const redraw = () => { App.router.render(); window.scrollTo(0, 0); };

  Object.assign(App.act, {
    "ob-country": (b) => { draft().country = b.dataset.arg; App.router.render(); },
    "ob-level": (b) => { draft().level = b.dataset.arg; App.router.render(); },
    "ob-minutes": (b) => { draft().minutes = Number(b.dataset.arg); App.router.render(); },
    "ob-focus": (b) => { const o = draft(), id = b.dataset.arg; o.focus = o.focus.includes(id) ? o.focus.filter((x) => x !== id) : o.focus.concat([id]); App.router.render(); },
    "ob-next": () => { const o = draft(); if (o.step === 3 && !o.focus.length) return; o.step = Math.min(STEPS - 1, o.step + 1); redraw(); },
    "ob-back": () => { const o = draft(); o.step = Math.max(0, o.step - 1); redraw(); },
    "ob-skip": () => finish(true),
    "ob-finish": () => finish(false),
    "ob-restart": () => { S.settings.onboarded = false; ui.UI.ob = null; redraw(); }
  });

  App.views.onboarding = { render };
})(window.App = window.App || {});
