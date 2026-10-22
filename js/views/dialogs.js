// Раздел «Диалоги»: сцены, режим «Я отвечаю», уровни освоения, прослушивание сцены целиком.
(function (App) {
  "use strict";
  const { $, $$, esc, shuffle, keysHTML, toast } = App.util;
  const { DLG_LEVELS } = App.cfg;
  const S = App.S;
  const D = App.D;
  const goals = App.goals;
  const ui = App.ui;
  const Dlg = ui.Dlg;
  const { sayBtn, speak } = App.audio;

  function renderList() {
    const list = goals.dialogsByFocus();
    const doneN = D.DIALOGS.filter((d) => goals.dlgLevel(d.id) >= 1).length;
    return '<header class="page-head"><div><h1>Диалоги</h1><p class="sub">Situaciones de la vida real</p></div></header>' +
      '<section class="panel stack"><div class="sec-head"><h2 class="sec">Разговор с Claude</h2><span class="chip acc">ролевая сцена</span></div><p class="muted">Claude играет продавца, хозяйку квартиры, сотрудника банка или нового знакомого и говорит как житель страны «' + esc(App.cfg.country().ru) + '». После каждой вашей реплики он показывает ошибки и более естественный вариант, а если не знаете, что сказать, — подсказывает.</p><div class="row"><button class="btn" data-act="open-chat">Начать разговор</button></div></section>' +
      '<section class="stack"><div class="sec-head"><h2 class="sec">Сцены для переезда</h2><span class="muted small">' + doneN + " из " + D.DIALOGS.length + " начато · сначала ваши цели</span></div>" +
      '<p class="muted small">Как проходить сцену: 1) прослушайте; 2) пройдите в режиме «Я отвечаю» — выбирайте свои реплики; 3) сделайте 5 упражнений по фразам; 4) отметьте уровень: «Прослушал» → «Могу повторить» → «Могу сказать своими словами».</p><div class="tiles">' +
      list.map((d) => {
        const lvl = goals.dlgLevel(d.id), g = goals.dialogGoal(d.id);
        return '<button class="tile" data-act="open-dialog" data-arg="' + d.id + '"><span class="tile-title">' + esc(d.title) + '</span><span class="tile-ex">' + esc(d.place) + '</span><span class="lvl-dots" aria-label="Уровень ' + lvl + ' из 3">' + [1, 2, 3].map((k) => '<i class="' + (k <= lvl ? "on" : "") + '"></i>').join("") + '<span class="muted small">' + (lvl ? esc(DLG_LEVELS[lvl - 1]) : "не начат") + "</span></span>" + (g ? '<span class="muted small">' + esc(g.title) + "</span>" : "") + "</button>";
      }).join("") + "</div></section>";
  }
  const levelSeg = (d) => '<div class="seg lvl-seg">' + DLG_LEVELS.map((t, k) => '<button data-act="dlg-level" data-arg="' + d.id + ":" + (k + 1) + '" aria-pressed="' + (goals.dlgLevel(d.id) === k + 1) + '">' + (k + 1) + ". " + esc(t) + "</button>").join("") + "</div>";

  function renderDialog() {
    const d = goals.dialogById(ui.UI.talk.id);
    if (!d) { ui.UI.talk = { mode: "list", id: null }; return renderList(); }
    if (Dlg.resp && Dlg.resp.id === d.id) return renderRespond(d);
    return '<div class="row"><button class="btn quiet sm" data-act="back-talk">← Все сцены</button></div>' +
      '<header class="page-head"><div><p class="eyebrow">' + esc(d.place) + "</p><h1>" + esc(d.title) + '</h1></div><div class="row"><button class="btn ghost" data-act="play-all">' + (Dlg.playing >= 0 ? "Остановить" : "Прослушать весь диалог") + '</button><button class="btn" data-act="resp-start" data-arg="' + d.id + '">Я отвечаю</button></div></header>' +
      '<div class="row"><label class="check"><input type="checkbox" data-act="dlg-tr"' + (Dlg.showTr ? " checked" : "") + '> Показывать перевод</label><label class="check"><input type="checkbox" data-act="dlg-hide"' + (Dlg.hideMine ? " checked" : "") + "> Скрыть мои реплики (вспомните их сами, потом нажмите)</label></div>" +
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
      '<section class="panel stack"><h2 class="sec">Закрепить</h2><p class="muted small">5 коротких заданий по фразам этой сцены: собрать фразу, выбрать перевод, записать на слух.</p><div class="row"><button class="btn" data-act="practice-dlg" data-arg="' + d.id + '">Упражнения по диалогу</button><button class="btn ghost" data-act="open-chat" data-arg="' + d.id + '">Разыграть с Claude</button></div></section>' +
      '<section class="panel stack"><h2 class="sec">Насколько вы освоили сцену?</h2>' + levelSeg(d) +
      '<p class="muted small">Уровень влияет на готовность к цели в «Прогрессе». Фразы освоенных сцен попадают в упражнения «Собери фразу» и «Диктант».</p></section>';
  }

  // ---------------------------------------------------------------- «Я отвечаю»
  // Реплики собеседника звучат, за себя ученик выбирает ответ из трёх или говорит своими словами
  function startRespond(id) {
    stopPlay();
    Dlg.resp = { id, step: 0, opts: {}, res: {}, own: {}, ownOpen: {} };
    App.router.render(); window.scrollTo(0, 0);
    playRespLine();
  }
  function respOptions(d, i) {
    const r = Dlg.resp;
    if (r.opts[i]) return r.opts[i];
    const right = d.lines[i][1], n = right.split(" ").length;
    const pool = shuffle(D.DIALOGS.filter((x) => x.id !== d.id && x.lines).flatMap((x) => x.lines.filter((l) => l[0] === "me").map((l) => l[1])));
    const close = pool.filter((s) => Math.abs(s.split(" ").length - n) <= 3);
    const wrong = [];
    for (const s of close.concat(pool)) { if (wrong.length >= 2) break; if (s !== right && !wrong.includes(s)) wrong.push(s); }
    r.opts[i] = shuffle([right].concat(wrong));
    return r.opts[i];
  }
  function playRespLine() {
    const r = Dlg.resp;
    const d = r && goals.dialogById(r.id);
    if (!d || r.step >= d.lines.length) return;
    if (d.lines[r.step][0] !== "me") speak(d.lines[r.step][1]);
  }
  function renderRespond(d) {
    const r = Dlg.resp;
    const bubble = (l, extra) => '<div class="line ' + (l[0] === "me" ? "me" : "") + '">' + sayBtn(l[1]) + '<div class="bubble"><span class="who">' + (l[0] === "me" ? "Вы" : esc(d.other)) + '</span><p class="es">' + esc(l[1]) + '</p><p class="tr">' + esc(l[2]) + "</p>" + (extra || "") + "</div></div>";
    let html = '<div class="row"><button class="btn quiet sm" data-act="resp-exit">← К сцене</button></div>' +
      '<header class="page-head"><div><p class="eyebrow">Я отвечаю · ' + esc(d.place) + "</p><h1>" + esc(d.title) + '</h1></div><span class="muted small num">' + Math.min(r.step + 1, d.lines.length) + " / " + d.lines.length + "</span></header>" +
      '<p class="muted small">Реплики собеседника звучат сами. Когда очередь ваша — выберите подходящий ответ или скажите своими словами.</p><section class="lines">';
    for (let i = 0; i < Math.min(r.step, d.lines.length); i++) {
      const res = r.res[i];
      const mark = res ? (res.own ? '<span class="chip acc">свой вариант</span>' : res.ok ? '<span class="chip ok">верно</span>' : '<span class="chip bad">было: ' + esc(res.chosen) + "</span>") : "";
      html += bubble(d.lines[i], mark);
    }
    html += "</section>";
    if (r.step >= d.lines.length) {
      const mine = Object.keys(r.res).length, ok = Object.values(r.res).filter((x) => x.ok).length;
      return html + '<section class="panel stack" style="text-align:center;justify-items:center"><p class="eyebrow">¡Bien hecho!</p><h2 class="sec">Сцена пройдена</h2><p>Верно выбрано: <b>' + ok + "</b> из " + mine + ".</p>" +
        '<div class="row" style="justify-content:center"><button class="btn" data-act="practice-dlg" data-arg="' + d.id + '">5 упражнений по фразам</button><button class="btn ghost" data-act="resp-start" data-arg="' + d.id + '">Пройти ещё раз</button><button class="btn ghost" data-act="resp-exit">К сцене</button></div>' +
        levelSeg(d) + "</section>";
    }
    const i = r.step, l = d.lines[i];
    if (l[0] !== "me") return html + '<section class="lines">' + bubble(l) + '</section><div class="row"><button class="btn" data-act="resp-next" data-autofocus>Дальше <kbd>Enter</kbd></button></div>';
    const res = r.res[i];
    if (res) {
      return html + '<section class="lines">' + bubble(l, res.own ? "" : res.ok ? '<span class="chip ok">верно</span>' : '<span class="chip bad">вы выбрали: ' + esc(res.chosen) + "</span>") + "</section>" +
        (res.own ? '<div class="corr"><div><span class="muted">Ваш вариант:</span> <span class="es">' + esc(res.text) + '</span></div><div data-ai-slot="respOwn" data-arg="' + i + '"></div></div>' : "") +
        '<div class="row"><button class="btn" data-act="resp-next" data-autofocus>Дальше <kbd>Enter</kbd></button></div>';
    }
    return html + '<section class="panel stack resp"><p class="q-kind">Ваша реплика. Что вы ответите?</p><p class="muted small">Подсказка: ' + esc(l[2]) + "</p>" +
      '<div class="options one">' + respOptions(d, i).map((o, k) => '<button class="opt es" data-act="resp-choose" data-arg="' + k + '"><kbd>' + (k + 1) + "</kbd><span>" + esc(o) + "</span></button>").join("") + "</div>" +
      (r.ownOpen[i] ? '<form class="stack" data-form="resp-own"><textarea id="respIn" lang="es" placeholder="Скажите это своими словами по-испански" data-autofocus></textarea>' + keysHTML() + '<div class="row"><button class="btn sm">Ответить</button></div></form>'
        : '<button class="btn quiet sm" data-act="resp-own-open">Сказать своими словами</button>') + "</section>";
  }
  function respAnswer(ok, chosen) {
    const r = Dlg.resp;
    const d = goals.dialogById(r.id);
    r.res[r.step] = { ok, chosen };
    S.stats.ans++; if (ok) S.stats.ok++;
    if (!ok) App.practice.addMistake({ k: "sent", es: d.lines[r.step][1], ru: d.lines[r.step][2] });
    App.state.save();
    App.router.render();
    speak(d.lines[r.step][1]);
  }
  async function respOwn(text) {
    const { AI, aiError, refreshSlots } = App.ai;
    const r = Dlg.resp;
    const d = goals.dialogById(r.id);
    const i = r.step;
    r.res[i] = { own: true, text };
    if (AI.fn) r.own[i] = { busy: true };
    App.router.render();
    speak(d.lines[i][1]);
    if (!AI.fn) return;
    const before = d.lines.slice(Math.max(0, i - 2), i).map((l) => (l[0] === "me" ? "Ученик" : d.other) + ": " + l[1]).join("\n");
    try {
      const v = await AI.fn.json("Сцена: «" + d.title + "» (" + d.place + "). Собеседник — " + d.role + ". Предыдущие реплики:\n" + before + "\n\nОбразцовый ответ ученика: «" + d.lines[i][1] + "».\nУченик (русскоязычный, уровень " + S.settings.level + ") ответил своими словами: «" + text + "».\nОцени, подходит ли ответ к ситуации и понятен ли он местному жителю (" + App.cfg.country().ru + "). Ответь только JSON: {\"ok\": true/false, \"comment\": \"1–2 предложения по-русски: что хорошо и что исправить\", \"better\": \"естественный вариант его фразы по-испански или пустая строка\"}", { modelTier: "quick", cache: false });
      r.own[i] = { verdict: { ok: !!(v && v.ok), comment: String((v && v.comment) || ""), better: String((v && v.better) || "") } };
    } catch (e) { r.own[i] = { error: aiError(e) }; }
    refreshSlots();
  }
  function respNext() {
    const r = Dlg.resp;
    if (!r) return;
    const d = goals.dialogById(r.id);
    if (d.lines[r.step] && d.lines[r.step][0] === "me" && !r.res[r.step]) return;
    r.step++;
    if (r.step >= d.lines.length && goals.dlgLevel(d.id) < 1) goals.setDlgLevel(d.id, 1);
    App.router.render();
    playRespLine();
  }

  // ---------------------------------------------------------------- прослушивание
  function playAll(d) {
    if (Dlg.playing >= 0) { stopPlay(); return; }
    let i = 0;
    const mark = (k) => { Dlg.playing = k; $$(".line").forEach((el) => el.classList.toggle("playing", Number(el.dataset.line) === k)); const b = $("[data-act=play-all]"); if (b) b.textContent = k >= 0 ? "Остановить" : "Прослушать весь диалог"; };
    const next = () => {
      if (i >= d.lines.length || ui.route !== "talk" || ui.UI.talk.mode !== "dialog" || ui.UI.talk.id !== d.id) {
        mark(-1);
        if (i >= d.lines.length && goals.dlgLevel(d.id) < 1) { goals.setDlgLevel(d.id, 1); toast("Сцена отмечена как «Прослушал». Попробуйте режим «Я отвечаю»."); App.router.render(); }
        return;
      }
      mark(i);
      const el = $('.line[data-line="' + i + '"]'); if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      speak(d.lines[i][1], false, () => { i++; setTimeout(() => { if (Dlg.playing >= 0) next(); }, 350); });
    };
    next();
  }
  function stopPlay() { Dlg.playing = -1; App.audio.stop(); $$(".line").forEach((el) => el.classList.remove("playing")); const b = $("[data-act=play-all]"); if (b) b.textContent = "Прослушать весь диалог"; }

  function openDialog(id) {
    const d = goals.dialogById(id);
    if (d && d.lines) App.audio.preload([d.lines[0][1]]);
    App.router.open("talk");
    ui.UI.talk = { mode: "dialog", id }; Dlg.revealed = new Set(); Dlg.resp = null; stopPlay();
    App.router.render(); window.scrollTo(0, 0);
  }

  App.slots.respOwn = (el) => {
    const i = Number(el.dataset.arg), r = Dlg.resp && Dlg.resp.own[i];
    if (r && r.busy) return '<p class="typing">Claude проверяет ответ…</p>';
    if (r && r.verdict) return '<div class="corr">' + (r.verdict.ok ? '<div class="r" style="font-family:var(--f-body)">Подходит ✓</div>' : '<div class="w" style="text-decoration:none;font-family:var(--f-body)">Не совсем подходит</div>') + (r.verdict.comment ? '<div class="muted">' + esc(r.verdict.comment) + "</div>" : "") + (r.verdict.better ? '<div><span class="muted">Естественнее:</span> <span class="es">' + esc(r.verdict.better) + "</span></div>" : "") + "</div>";
    if (r && r.error) return '<p class="muted small">' + esc(r.error) + "</p>";
    return App.ai.AI.fn ? "" : '<p class="muted small">Сравните свой вариант с образцом выше. На claude.ai ответ проверит Claude.</p>';
  };
  Object.assign(App.act, {
    say: (b) => { if (Dlg.playing >= 0) stopPlay(); speak(b.dataset.text); },
    "say-slow": (b) => { if (Dlg.playing >= 0) stopPlay(); speak(b.dataset.text, true); },
    "open-dialog": (b) => openDialog(b.dataset.arg),
    "back-talk": () => { stopPlay(); Dlg.resp = null; ui.UI.talk = { mode: "list", id: null }; App.router.render(); window.scrollTo(0, 0); },
    "play-all": () => playAll(goals.dialogById(ui.UI.talk.id)),
    "dlg-tr": (b) => { Dlg.showTr = b.checked; $$("#lines .bubble:not(.hidden-line) .tr").forEach((p) => { p.hidden = !Dlg.showTr; }); },
    "dlg-hide": (b) => { Dlg.hideMine = b.checked; Dlg.revealed = new Set(); App.router.render(); },
    reveal: (b) => { Dlg.revealed.add(Number(b.dataset.arg)); App.router.render(); },
    "dlg-level": (b) => {
      const [id, lvl] = b.dataset.arg.split(":");
      goals.setDlgLevel(id, Number(lvl));
      toast("Уровень сцены: «" + DLG_LEVELS[Number(lvl) - 1] + "».");
      if (ui.P.active) { ui.P.active = false; openDialog(id); } else App.router.render();
    },
    "vocab-add": (b) => {
      const [did, i] = b.dataset.arg.split(":");
      const d = goals.dialogById(did), v = d.vocab[Number(i)];
      App.views.words.addOwn(v[0], v[1], "", "", "Из диалога «" + d.title + "»");
      App.router.render(); toast("Добавлено в «Мои слова».");
    },
    "resp-start": (b) => startRespond(b.dataset.arg),
    "resp-exit": () => { App.audio.stop(); Dlg.resp = null; App.router.render(); window.scrollTo(0, 0); },
    "resp-choose": (b) => {
      const r = Dlg.resp;
      if (!r || r.res[r.step]) return;
      const d = goals.dialogById(r.id);
      const chosen = r.opts[r.step][Number(b.dataset.arg)];
      respAnswer(chosen === d.lines[r.step][1], chosen);
    },
    "resp-own-open": () => { Dlg.resp.ownOpen[Dlg.resp.step] = true; App.router.render(); },
    "resp-next": () => respNext()
  });
  App.forms["resp-own"] = () => { const text = $("#respIn").value.trim(); if (text) respOwn(text); };
  // В режиме «Я отвечаю»: 1–3 — выбор ответа, Enter — дальше; в сцене Enter/пробел открывают скрытую реплику
  App.keys.push((e, typing) => {
    const t = e.target;
    if (t && t.classList && t.classList.contains("hidden-line") && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); App.act.reveal(t); return true; }
    if (!Dlg.resp || ui.route !== "talk" || typing) return false;
    const r = Dlg.resp, d = goals.dialogById(r.id);
    if (!d) return false;
    const cur = d.lines[r.step];
    if (cur && cur[0] === "me" && !r.res[r.step] && /^[1-3]$/.test(e.key)) { const b = $$(".resp .opt")[Number(e.key) - 1]; if (b) b.click(); return true; }
    if (e.key === "Enter" && t.tagName !== "BUTTON") { e.preventDefault(); respNext(); return true; }
    return false;
  });

  App.views.dialogs = {
    // Список сцен рисуется по названиям из индекса; сцене нужны реплики
    needs: (sub) => (sub === "dialog" ? ["dialogs"] : []),
    render: (sub) => (sub === "dialog" ? renderDialog() : renderList())
  };
})(window.App = window.App || {});
