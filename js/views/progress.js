// Раздел «Прогресс»: готовность к целям, достижения, календарь, темы, настройки, резервная копия.
(function (App) {
  "use strict";
  const { $, esc, plural, dayKey, addDays, ICON, stat, toast } = App.util;
  const { COUNTRIES, MINUTES, NEW_BY_MINUTES } = App.cfg;
  const S = App.S;
  const D = App.D;
  const srs = App.srs, goals = App.goals;
  const ui = App.ui;
  const { Voice, chooseVoice } = App.audio;

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
  function goalsBlock() {
    return '<section class="stack"><div class="sec-head"><h2 class="sec">Готовность к жизни на месте</h2><span class="muted small">слова тем (60%) + освоенные сцены (40%)</span></div><div class="goal-grid">' +
      D.GOALS.map((g) => {
        const s = goals.goalStats(g), mine = S.settings.focus.includes(g.id);
        return '<section class="panel goal-card' + (mine ? " focus" : "") + '"><div class="goal-top"><div><div class="deck-title">' + esc(g.title) + '</div><div class="deck-es">' + esc(g.es) + (mine ? " · ваша цель" : "") + '</div></div><div class="goal-pct num">' + s.ready + "%</div></div>" +
          '<div class="bar" aria-hidden="true"><i class="b-learned" style="width:' + s.ready + '%"></i></div>' +
          '<p class="small">' + esc(goals.readinessText(g, s.ready)) + "</p>" +
          '<p class="muted small num">Слова: ' + s.familiar + " из " + s.total + " знакомо · Сцены: " + s.dlgDone + " из " + s.dlgTotal + " на уровне «Могу повторить»</p></section>";
      }).join("") + "</div></section>";
  }
  function achBlock() {
    const { ACH, metrics } = App.ach;
    const got = ACH.filter((a) => S.ach[a.id]);
    const themes = metrics().themes;
    return '<section class="panel stack"><div class="sec-head"><h2 class="sec">Достижения</h2><span class="muted small num">' + got.length + " из " + ACH.length + "</span></div>" +
      (got.length ? "" : '<p class="muted small">Здесь будут ваши достижения. Первое — после 10 начатых слов: оно ближе, чем кажется.</p>') +
      '<div class="ach-grid">' + ACH.map((a) => '<div class="ach' + (S.ach[a.id] ? " on" : "") + '" title="' + esc(a.d) + '">' + ICON.medal + "<div><b>" + esc(a.t) + "</b><span>" + esc(S.ach[a.id] ? "получено " + S.ach[a.id].split("-").reverse().join(".") : a.d) + "</span></div></div>").join("") + "</div>" +
      (themes.length ? '<p class="small"><b>Освоенные темы:</b> ' + themes.map(esc).join(", ") + "</p>" : "") + "</section>";
  }
  const option = (value, label, cur) => '<option value="' + esc(value) + '"' + (cur === value ? " selected" : "") + ">" + esc(label) + "</option>";
  function render() {
    const st = App.ach.streak();
    const totalMin = Math.round(Object.values(S.days).reduce((a, d) => a + (d.sec || 0), 0) / 60);
    const acc = S.stats.ans ? Math.round(S.stats.ok / S.stats.ans * 100) + "%" : "—";
    const set = S.settings;
    const cur = Voice.ok ? chooseVoice() : null;
    const deckBar = App.views.words.deckBar;
    return '<header class="page-head"><div><h1>Прогресс</h1><p class="sub">Tu avance</p></div></header>' +
      '<section class="panel"><div class="stats">' + stat(st + " " + plural(st, "день", "дня", "дней"), "подряд по 10+ минут") + stat(totalMin >= 120 ? (totalMin / 60).toFixed(1).replace(".", ",") + " ч" : totalMin + " мин", "всего занятий") + stat(srs.knownCount(), "слов знакомо") + stat(acc, "верных ответов") + "</div></section>" +
      goalsBlock() + achBlock() +
      '<section class="panel stack"><div class="sec-head"><h2 class="sec">Занятия по дням</h2><div class="legend"><span>0</span><span class="l2">до 25 мин</span><span class="l1">45+ мин</span></div></div>' + (totalMin ? "" : '<p class="muted small">Здесь появится календарь занятий. Время считается само, пока вы занимаетесь в приложении.</p>') + '<div class="heat-wrap">' + heatmap() + "</div></section>" +
      '<section class="panel stack"><h2 class="sec">Слова по темам</h2><div class="deckbars">' + srs.deckList().filter((d) => d.words.length).map((d) => { const dc = srs.deckCounts(d.id); return '<div class="deckbar"><span>' + esc(d.title) + "</span>" + deckBar(dc) + '<span class="n num">' + (dc.learned + dc.learning) + "/" + dc.total + "</span></div>"; }).join("") + "</div></section>" +
      '<section class="panel stack"><div class="sec-head"><h2 class="sec">Настройки</h2><button class="btn ghost sm" data-act="ob-restart">Пройти настройку заново</button></div>' +
      '<div class="grid-2"><label class="field">Страна переезда<select data-set="country">' + Object.entries(COUNTRIES).map(([k, c]) => option(k, c.ru, set.country)).join("") + "</select></label>" +
      '<label class="field">Уровень (для Claude и подсказок)<select data-set="level">' + ["A1", "A2", "B1"].map((l) => option(l, l, set.level)).join("") + "</select></label></div>" +
      '<div class="stack"><p class="small" style="font-weight:500">Цели переезда</p><div class="seg">' + D.GOALS.map((g) => '<button data-act="toggle-focus" data-arg="' + g.id + '" aria-pressed="' + set.focus.includes(g.id) + '">' + esc(g.title) + "</button>").join("") + "</div></div>" +
      '<div class="stack"><p class="small" style="font-weight:500">Время в день</p><div class="seg">' + MINUTES.map((m) => '<button data-act="set-minutes" data-arg="' + m + '" aria-pressed="' + (set.minutes === m) + '">' + m + " мин</button>").join("") + "</div></div>" +
      '<div class="grid-2"><label class="field">Новых слов в день<input type="number" min="0" max="50" data-set="newPerDay" value="' + set.newPerDay + '"></label>' +
      '<label class="field">Направление карточек<select data-set="dir">' + option("mixed", "Вперемешку", set.dir) + option("es", "Испанский → русский", set.dir) + option("ru", "Русский → испанский", set.dir) + "</select></label></div>" +
      '<label class="field">Оформление<select data-set="theme">' + option("auto", "Как в системе", set.theme) + option("light", "Светлое", set.theme) + option("dark", "Тёмное", set.theme) + "</select></label>" +
      '<label class="check"><input type="checkbox" data-set="autoplay"' + (set.autoplay ? " checked" : "") + "> Автоматически озвучивать испанское слово на карточке</label>" +
      '<label class="check"><input type="checkbox" data-set="soft"' + (set.soft ? " checked" : "") + "> Мягкая проверка: засчитывать ответ без ударений и показывать правильное написание</label></section>" +
      '<section class="panel stack"><h2 class="sec">Озвучка</h2>' +
      "<p>Слова, примеры, диалоги и примеры из уроков записаны нейросетевыми голосами с мексиканским произношением: Далия читает слова и примеры, в диалогах звучат Хорхе и Алонсо. Запись работает в любом браузере, ничего устанавливать не нужно.</p>" +
      '<label class="field">Скорость: <span id="rateVal" class="num">' + Number(set.rate).toFixed(2) + '</span><input type="range" min="0.6" max="1.2" step="0.05" data-set="rate" value="' + set.rate + '"></label>' +
      '<div class="row"><button class="btn ghost sm" data-act="say" data-text="Hola, ¿cómo estás? Bienvenido a tu nueva ciudad.">Прослушать пример</button></div>' +
      '<h3 class="caption" style="margin-top:8px">Голос браузера</h3><p class="muted small">Нужен только для того, что нельзя записать заранее: формы глаголов в тренажёре, ответы Claude и ваши собственные слова.</p>' +
      (Voice.ok ? '<label class="field">Голос<select id="voiceSel" data-set="voice"><option value="">Автовыбор (сейчас: ' + esc(cur ? cur.name + ", " + cur.lang : "испанский голос не найден") + ")</option>" + Voice.list.map((v) => option(v.voiceURI, v.name + " — " + v.lang, set.voice)).join("") + "</select></label>" : "<p>Этот браузер не умеет синтезировать речь.</p>") +
      (cur ? "" : '<p class="muted small">Испанского голоса в браузере нет, поэтому формы глаголов и ответы Claude звучать не будут. Чтобы добавить голос: в Windows откройте «Параметры → Время и язык → Речь → Добавить голоса», установите «Español (México)» и перезапустите браузер. Либо откройте приложение в Microsoft Edge: там испанские голоса есть сразу.</p>') + "</section>" +
      '<section class="panel stack"><h2 class="sec">Данные</h2><p class="muted small">' + (App.state.Sync.state === "cloud" ? "Прогресс автоматически сохраняется в вашем аккаунте Claude и доступен на любом устройстве, где вы открываете это приложение." : "Прогресс хранится в этом браузере. Сделайте резервную копию, чтобы не потерять его при очистке данных браузера.") + "</p>" +
      '<div class="row"><button class="btn ghost sm" data-act="export-copy">Скопировать резервную копию</button><button class="btn ghost sm" data-act="export-file" data-needs-dl hidden>Сохранить файлом</button></div>' +
      '<textarea id="exportBox" readonly hidden></textarea>' +
      '<label class="field">Восстановить из копии<textarea id="importBox" placeholder="Вставьте сюда текст резервной копии"></textarea></label>' +
      '<div class="row"><button class="btn ghost sm" data-act="import-text">Восстановить</button><label class="btn ghost sm" style="cursor:pointer">Из файла…<input type="file" accept=".json,application/json,text/plain" id="importFile" hidden></label></div>' +
      (ui.UI.confirmReset ? '<div class="confirm"><p><b>Удалить весь прогресс?</b> Карточки, уроки, статистика и свои слова будут стёрты. Это нельзя отменить.</p><div class="row"><button class="btn danger sm" data-act="reset-yes">Да, удалить всё</button><button class="btn ghost sm" data-act="reset-no">Отмена</button></div></div>' : '<div class="row"><button class="btn quiet sm" data-act="reset-ask" style="color:var(--bad)">Сбросить прогресс…</button></div>') +
      "</section>";
  }
  function importState(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { toast("Не получилось прочитать копию: это не похоже на текст резервной копии."); return; }
    if (!data || typeof data !== "object" || !data.settings || !data.cards) { toast("В этом тексте нет данных приложения. Проверьте, что скопировали копию целиком."); return; }
    const { replace, merge, saveLocal, Sync } = App.state;
    replace(merge(data)); App.S.updatedAt = Date.now(); saveLocal(); Sync.soon(200);
    App.state.afterExternalChange();
    toast("Прогресс восстановлен.");
  }

  const rerender = () => App.router.render();
  Object.assign(App.act, {
    "set-minutes": (b) => { const m = Number(b.dataset.arg); S.settings.minutes = m; S.settings.newPerDay = NEW_BY_MINUTES[m] || S.settings.newPerDay; App.state.save(); rerender(); toast("Цель: " + m + " минут в день, " + S.settings.newPerDay + " новых слов."); },
    "toggle-focus": (b) => { const f = S.settings.focus, id = b.dataset.arg; S.settings.focus = f.includes(id) ? f.filter((x) => x !== id) : f.concat([id]); srs.buildCards(); App.state.save(); rerender(); },
    "export-copy": async () => {
      const text = JSON.stringify(S);
      try { await navigator.clipboard.writeText(text); toast("Копия скопирована. Сохраните её, например, в заметках."); }
      catch (e) { const box = $("#exportBox"); box.hidden = false; box.value = text; box.focus(); box.select(); toast("Выделите текст в поле и скопируйте вручную (Ctrl+C)."); }
    },
    "export-file": async () => {
      const DL = App.ai.DL;
      if (!DL.fn) return;
      try { await DL.fn.save({ filename: "espanol-progreso-" + dayKey() + ".json", data: JSON.stringify(S, null, 1) }); toast("Файл сохранён."); }
      catch (e) { if (e && e.code !== "declined") toast("Не удалось сохранить файл. Используйте «Скопировать резервную копию»."); }
    },
    "import-text": () => { const t = $("#importBox").value.trim(); if (!t) { toast("Сначала вставьте текст резервной копии в поле."); return; } importState(t); },
    "reset-ask": () => { ui.UI.confirmReset = true; rerender(); },
    "reset-no": () => { ui.UI.confirmReset = false; rerender(); },
    "reset-yes": () => {
      const keep = S.settings;
      App.state.replace(App.state.defaults()); S.settings = keep;
      ui.UI.confirmReset = false; App.act["chat-reset"]();
      srs.buildCards(); App.state.save(); rerender(); toast("Прогресс сброшен. Настройки сохранены.");
    }
  });
  App.changes.importFile = (el) => {
    if (!el.files || !el.files[0]) return;
    const r = new FileReader();
    r.onload = () => importState(String(r.result || ""));
    r.onerror = () => toast("Не удалось прочитать файл.");
    r.readAsText(el.files[0]);
  };

  App.views.progress = { render };
})(window.App = window.App || {});
