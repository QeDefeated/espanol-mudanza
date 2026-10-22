// Экран «Сегодня»: план дня («Минимум» или «Полный»), причины заданий, серия дней, ближайшая цель.
(function (App) {
  "use strict";
  const { $, esc, plural, dayKey, addDays, ICON, stat, DIAS, MESES, WEEK_RU } = App.util;
  const { kindById, DLG_LEVELS } = App.cfg;
  const S = App.S;
  const D = App.D;
  const srs = App.srs, goals = App.goals;
  const { sayBtn } = App.audio;

  const minutesToday = () => Math.floor(App.state.today().sec / 60);
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

  function cardsWhy(c) {
    const parts = [];
    if (c.due) parts.push(c.due + " " + plural(c.due, "слово пора", "слова пора", "слов пора") + " повторить — так они закрепятся надолго.");
    if (c.newToday) {
      const fresh = srs.freshCandidates().slice(0, c.newToday).filter((x) => !srs.isTop(x.deck));
      const g = fresh.length ? goals.goalOfDeck(fresh[0].deck) : null;
      if (srs.softStart()) parts.push("Мягкий старт: новые слова — самые нужные базовые фразы.");
      else if (g) parts.push("Новые слова из темы «" + g.title + "» " + g.why + ".");
      else parts.push("Новые слова — из самых частых в языке.");
    }
    return parts.join(" ") || "Повторение, пока слово не забылось.";
  }
  function lessonWhy(l) {
    const links = goals.lessonDialogs(l, 1);
    if (links.length) return "Эта конструкция встречается в сцене «" + links[0].dialog.title + "»: «" + links[0].line + "».";
    return "Следующая тема по порядку — опора для фраз из диалогов.";
  }
  function phraseOfDay() {
    const pool = [];
    const ids = new Set(goals.focusGoals().flatMap((g) => g.dialogs));
    D.DIALOGS.filter((d) => ids.has(d.id) && d.lines).forEach((d) => d.lines.forEach((l) => { const n = l[1].split(" ").length; if (n >= 4 && n <= 10) pool.push([l[1], l[2], d.title]); }));
    if (!pool.length) return null;
    const k = dayKey().split("-").map(Number);
    return pool[(k[0] * 372 + k[1] * 31 + k[2]) % pool.length];
  }
  function planItems(mode) {
    const G = S.settings.minutes, d = App.state.today(), c = srs.counts(), soft = srs.softStart();
    const items = [];
    const pk = (id) => ((d.pk || {})[id] || 0) > 0;
    const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const cur = goals.currentDialog();
    const curStarted = cur && goals.dlgLevel(cur.id) >= 1;
    const dlgItem = (sub) => ({ done: pk("dlg"), title: "Фразы из сцены «" + cur.title + "»", sub, why: "Закрепить фразы диалога, который вы сейчас проходите.", min: 4, act: "practice-dlg", arg: cur.id, label: "Начать" });
    const kindItem = (k) => ({ done: pk(k.id), title: "Упражнение: " + k.title.toLowerCase(), sub: k.desc, why: k.why, min: k.min, act: "practice-start", arg: k.id, label: "Начать" });
    if (mode === "min") {
      const newMin = Math.min(c.newToday, 5), dueMin = Math.min(c.due, 20);
      items.push({ done: (d.rev + d.nw) >= Math.max(1, Math.min(15, dueMin + newMin)) || (c.due === 0 && c.newToday === 0), title: "Карточки", sub: dueMin + " на повторение, " + newMin + " " + plural(newMin, "новое", "новых", "новых"), why: cardsWhy({ due: dueMin, newToday: newMin }), min: Math.max(3, Math.ceil((dueMin * 8 + newMin * 25) / 60)), act: "cards-min", label: "Начать" });
      items.push(curStarted ? dlgItem("5 коротких заданий") : kindItem(kindById(soft ? "choice" : ["choice", "build", "dict"][doy % 3])));
      const ph = phraseOfDay();
      if (ph) items.push({ done: !!d.phrase, title: "Фраза дня", sub: ph[0], why: "Одна живая фраза в день: послушайте и повторите вслух 3 раза.", min: 1, act: "phrase-day", label: "Слушать" });
      return items;
    }
    items.push({
      done: c.due === 0 && c.newToday === 0 && (d.rev + d.nw) > 0 || (c.due === 0 && c.newToday === 0 && c.freshAvail === 0),
      title: "Карточки", sub: c.due + " на повторение, " + c.newToday + " " + plural(c.newToday, "новое слово", "новых слова", "новых слов"),
      why: cardsWhy(c), min: Math.max(1, Math.ceil((c.due * 8 + c.newToday * 25) / 60)), act: "cards-start", label: "Начать"
    });
    const lesson = D.LESSONS.find((l) => !S.lessons[l.id]);
    if (lesson) items.push({ done: d.lesson > 0, title: "Урок: " + lesson.title, sub: lesson.es + " · " + lesson.level, why: lessonWhy(lesson), min: 8, act: "open-lesson", arg: lesson.id, label: "Открыть" });
    const nPrac = G < 30 ? 1 : G < 45 ? 2 : 3;
    const pool = (soft ? ["choice", "build", "dict"] : ["choice", "build", "dict", "type", "conj", "errors"]).map(kindById);
    let pi = 0;
    if (curStarted) { items.push(dlgItem("5 коротких заданий по диалогу")); pi++; }
    for (let i = 0; pi < nPrac; i++, pi++) items.push(kindItem(pool[(doy + i * 2) % pool.length]));
    if (S.mistakes.length >= 5) items.push({ done: false, title: "Работа над ошибками", sub: S.mistakes.length + " " + plural(S.mistakes.length, "пункт", "пункта", "пунктов") + " в списке", why: kindById("mist").why, min: 4, act: "practice-start", arg: "mist", label: "Повторить" });
    if (G >= 30 && cur) {
      const g = goals.dialogGoal(cur.id), lvl = goals.dlgLevel(cur.id);
      items.push({ done: d.dialog > 0, title: "Диалог: " + cur.title, sub: lvl ? "Сейчас: «" + DLG_LEVELS[lvl - 1] + "» — поднимите уровень" : "Прослушать, ответить за себя, выучить фразы", why: g ? "Сцена из вашей цели «" + g.title + "»: научитесь " + g.can + "." : "Живая сцена для жизни после переезда.", min: 7, act: "open-dialog", arg: cur.id, label: "Открыть" });
    }
    if (G >= 45) items.push({ done: d.chat >= 6, title: "Разговор с Claude", sub: "Ролевая сцена с исправлением ошибок, 10 минут", why: "Живая практика: Claude поправит ошибки и подскажет, как сказать естественнее.", min: 10, act: "open-chat", label: "Говорить" });
    return items;
  }
  function weekStrip() {
    let html = '<div class="week" aria-label="Последние 7 дней">';
    for (let i = 6; i >= 0; i--) {
      const k = addDays(dayKey(), -i);
      const on = (S.days[k] || {}).sec >= 600;
      html += '<span class="' + (on ? "on " : "") + (i === 0 ? "today" : "") + '"><i></i>' + WEEK_RU[new Date(k + "T12:00").getDay()] + "</span>";
    }
    return html + "</div>";
  }
  const planRow = (it) =>
    '<div class="plan-item' + (it.done ? " done" : "") + '"><span class="plan-check">' + (it.done ? ICON.check : "") + "</span>" +
    '<div><div class="plan-title">' + esc(it.title) + '</div><div class="plan-sub">' + esc(it.sub) + " · ~" + it.min + " мин</div>" + (it.why ? '<div class="plan-why">' + esc(it.why) + "</div>" : "") + "</div>" +
    '<button class="btn ' + (it.done ? "ghost " : "") + 'sm" data-act="' + it.act + '"' + (it.arg ? ' data-arg="' + esc(it.arg) + '"' : "") + ">" + (it.done ? "Ещё раз" : it.label) + "</button></div>";

  function render() {
    const now = new Date();
    const date = DIAS[now.getDay()] + ", " + now.getDate() + " de " + MESES[now.getMonth()];
    const mode = S.settings.planMode === "min" ? "min" : "full";
    const minItems = planItems("min"), fullItems = planItems("full");
    const items = mode === "min" ? minItems : fullItems;
    const sum = (list) => list.reduce((a, x) => a + x.min, 0);
    const left = sum(items.filter((x) => !x.done));
    const st = App.ach.streak();
    const ph = phraseOfDay();
    const learned = srs.ALL.filter((c) => srs.status(c.id) === "learned").length;
    const tomorrow = srs.uniqueAll().filter((c) => S.cards[c.id] && S.cards[c.id].d <= addDays(dayKey(), 1) && !srs.isSkipped(c)).length;
    const goal = goals.focusGoals()[0];
    const gs = goal ? goals.goalStats(goal) : null;
    const lastAch = App.ach.ACH.filter((a) => S.ach[a.id]).sort((a, b) => (S.ach[b.id] > S.ach[a.id] ? 1 : -1))[0];
    return '<section class="hero">' +
      '<div><p class="eyebrow">Сегодня</p><h1 class="hero-date">' + esc(date) + "</h1>" +
      '<div class="hero-meta"><span class="chip acc">Переезд: ' + esc(App.cfg.country().ru) + '</span><span class="chip">Уровень ' + esc(S.settings.level) + '</span><span class="chip">Цель ' + S.settings.minutes + " мин в день</span></div></div>" +
      ringHTML() + "</section>" +
      (srs.softStart() ? '<section class="banner"><b>Мягкий старт.</b> Пока знакомых слов меньше 50, новых слов в день меньше (' + srs.newPerDayNow() + " вместо " + S.settings.newPerDay + "), а первыми идут базовые фразы. Так легче войти в ритм.</section>" : "") +
      '<section class="panel stack"><div class="sec-head"><h2 class="sec">План на сегодня</h2><span class="muted small">' + (left ? "осталось примерно " + left + " мин" : "план выполнен — ¡muy bien!") + "</span></div>" +
      '<div class="seg" role="group" aria-label="Объём плана"><button data-act="plan-mode" data-arg="min" aria-pressed="' + (mode === "min") + '">Минимум · ~' + sum(minItems) + ' мин</button><button data-act="plan-mode" data-arg="full" aria-pressed="' + (mode === "full") + '">Полный план · ~' + sum(fullItems) + " мин</button></div>" +
      '<div class="plan">' + items.map(planRow).join("") + "</div></section>" +
      (goal ? '<section class="panel goal-strip"><div><p class="eyebrow">Ближайшая цель · ' + esc(goal.title) + "</p><p>" + esc(goals.readinessText(goal, gs.ready)) + '</p></div><div class="goal-pct num">' + gs.ready + '%</div><div class="bar" aria-hidden="true"><i class="b-learned" style="width:' + gs.ready + '%"></i></div><button class="btn quiet sm" data-act="go" data-arg="progress">Все цели</button></section>' : "") +
      '<div class="grid-2">' +
      '<section class="panel stack"><p class="eyebrow">Días seguidos</p><div class="streak"><span class="streak-n num">' + st + '</span><span class="muted small">' + plural(st, "день", "дня", "дней") + " подряд по 10+ минут</span></div>" + weekStrip() + (lastAch ? '<p class="small ach-last">' + ICON.medal + " " + esc(lastAch.t) + "</p>" : "") + "</section>" +
      (ph ? '<section class="panel stack"><p class="eyebrow">Frase del día</p><div class="phrase"><p class="es">' + esc(ph[0]) + "</p>" + sayBtn(ph[0]) + '<p class="muted small">' + esc(ph[1]) + " · из диалога «" + esc(ph[2]) + "»</p></div></section>" : "") +
      "</div>" +
      '<section class="panel"><div class="stats">' +
      stat(srs.knownCount(), "слов знакомо") + stat(learned, "выучено надолго") + stat(tomorrow, "повторить завтра") + stat(Object.keys(S.lessons).length + " / " + D.LESSONS.length, "уроков пройдено") +
      "</div></section>";
  }

  Object.assign(App.act, {
    "plan-mode": (b) => { S.settings.planMode = b.dataset.arg; App.state.save(); App.router.render(); },
    "phrase-day": () => { const ph = phraseOfDay(); if (!ph) return; App.state.today().phrase = 1; App.state.save(); App.audio.speak(ph[0]); App.router.render(); }
  });

  // «Сегодня» рисуется сразу, без реплик диалогов; когда они подгрузятся, появятся фраза дня
  // и пояснения к уроку — экран дорисуется сам
  function after() {
    if (App.data.has("dialogs")) return;
    App.data.load("dialogs").then(() => {
      const ui = App.ui;
      if (ui.route === "today" && !ui.Cards.active && !ui.P.active && S.settings.onboarded) App.router.render();
    }, () => {});
  }

  App.views.today = { render, after, updateRing, phraseOfDay };
})(window.App = window.App || {});
