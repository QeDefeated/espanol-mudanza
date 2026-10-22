// Раздел «Грамматика»: уроки, тесты, частые ошибки русскоязычных, связь уроков с диалогами и практикой.
(function (App) {
  "use strict";
  const { $, $$, esc, plural, pad, dayKey, toast } = App.util;
  const { kindById } = App.cfg;
  const S = App.S;
  const D = App.D;
  const ui = App.ui;
  const { sayBtn } = App.audio;

  function renderList() {
    let n = 0;
    return '<header class="page-head"><div><h1>Грамматика</h1><p class="sub">Gramática paso a paso</p></div><span class="chip">' + Object.keys(S.lessons).length + " из " + D.LESSONS.length + " пройдено</span></header>" +
      '<p class="muted">Уроки идут по порядку: каждый — короткое объяснение, таблицы, примеры с озвучкой и тест. Урок засчитывается, если в тесте 70% правильных ответов. В конце урока — где эта тема звучит в диалогах.</p>' +
      errorsBlock() +
      ["A1", "A2", "B1"].map((lv) => {
        const ls = D.LESSONS.filter((l) => l.level === lv);
        if (!ls.length) return "";
        return '<section class="panel stack"><h2 class="sec">Уровень ' + lv + '</h2><div class="lesson-list">' + ls.map((l) => {
          n++;
          const done = S.lessons[l.id];
          return '<button class="lesson-row" data-act="open-lesson" data-arg="' + l.id + '"><span class="lesson-no">' + pad(n) + '</span><span><span class="lesson-title">' + esc(l.title) + '</span><br><span class="lesson-es">' + esc(l.es) + "</span></span>" +
            (done ? '<span class="chip ok">' + done.score + "%</span>" : '<span class="chip">не пройден</span>') + "</button>";
        }).join("") + "</div></section>";
      }).join("");
  }
  function errorCard(e, open) {
    const l = e.lesson && D.LESSONS.find((x) => x.id === e.lesson);
    return '<details class="err"' + (open ? " open" : "") + "><summary>" + esc(e.title) + '</summary><div class="err-body"><p>' + esc(e.why) + "</p>" +
      e.pairs.map((p) => '<div class="err-pair"><span class="muted small">' + esc(p[0]) + '</span><span class="w es">' + esc(p[2]) + '</span><span class="r es">' + esc(p[1]) + "</span>" + sayBtn(p[1]) + "</div>").join("") +
      (l ? '<button class="btn quiet sm" data-act="open-lesson" data-arg="' + l.id + '">Урок: ' + esc(l.title) + " →</button>" : "") + "</div></details>";
  }
  function errorsBlock() {
    return '<section class="panel stack"><div class="sec-head"><h2 class="sec">Частые ошибки русскоязычных</h2><button class="btn sm" data-act="practice-start" data-arg="errors">Проверить себя</button></div>' +
      '<p class="muted small">Ловушки, в которые попадают почти все, кто говорит по-русски. Зачёркнуто — как часто говорят, зелёным — как правильно.</p>' +
      '<div class="err-list">' + D.ERRORS.map((e) => errorCard(e)).join("") + "</div></section>";
  }
  function tableHTML(t) {
    return '<div class="stack"><p class="caption">' + esc(t.cap) + '</p><div class="table-wrap"><table class="t"><thead><tr>' + t.head.map((h) => "<th>" + esc(h) + "</th>").join("") + "</tr></thead><tbody>" +
      t.rows.map((r) => "<tr>" + r.map((c) => "<td>" + esc(c) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div></div>";
  }
  function linksBlock(l) {
    const link = D.LINKS[l.id] || {};
    const ds = App.goals.lessonDialogs(l, 3);
    const tense = l.drill && D.CONJ && D.CONJ.TENSES.find((t) => t.id === l.drill);
    const kind = link.practice && kindById(link.practice);
    const err = link.error && D.ERRORS.find((e) => e.id === link.error);
    let html = '<section class="panel stack"><h2 class="sec">Связь с практикой</h2>';
    if (ds.length) {
      html += '<p class="small" style="font-weight:600">Эта конструкция встречается в диалогах:</p><div class="examples">' + ds.map((x) =>
        '<div class="ex-row">' + sayBtn(x.line) + '<div><p class="es">' + esc(x.line) + '</p><p class="muted small">' + esc(x.ru) + ' · <button class="link-btn" data-act="open-dialog" data-arg="' + x.dialog.id + '">сцена «' + esc(x.dialog.title) + "»</button></p></div></div>").join("") + "</div>";
    }
    html += '<p class="small" style="font-weight:600">Попрактиковаться можно здесь:</p><div class="row">' +
      (tense ? '<button class="btn sm" data-act="drill" data-arg="' + l.drill + '">Тренажёр: ' + esc(tense.es) + "</button>" : "") +
      (kind && (!tense || kind.id !== "conj") ? '<button class="btn ' + (tense ? "ghost " : "") + 'sm" data-act="practice-start" data-arg="' + kind.id + '">' + esc(kind.title) + "</button>" : "") +
      (ds.length ? '<button class="btn ghost sm" data-act="open-dialog" data-arg="' + ds[0].dialog.id + '">Диалог «' + esc(ds[0].dialog.title) + "»</button>" : "") + "</div>";
    if (err) html += '<p class="small" style="font-weight:600">Частая ошибка по теме:</p>' + errorCard(err, true);
    return html + "</section>";
  }
  function quizScoreText(l) {
    const q = ui.UI.quiz[l.id] || {};
    const answered = Object.keys(q).length;
    if (!answered) return l.quiz.length + " " + plural(l.quiz.length, "вопрос", "вопроса", "вопросов");
    const ok = l.quiz.filter((qq, i) => q[i] === qq.a).length;
    return ok + " из " + l.quiz.length + " верно" + (answered < l.quiz.length ? " · отвечено " + answered : "");
  }
  function renderLesson() {
    const l = D.LESSONS.find((x) => x.id === ui.UI.lesson);
    if (!l) { ui.UI.lesson = null; return renderList(); }
    const idx = D.LESSONS.indexOf(l);
    const done = S.lessons[l.id];
    const q = ui.UI.quiz[l.id] || (ui.UI.quiz[l.id] = {});
    const prev = D.LESSONS[idx - 1], next = D.LESSONS[idx + 1];
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
      '<div class="row"><button class="btn ghost sm" data-act="quiz-reset" data-arg="' + l.id + '">Пройти тест заново</button></div></section>' +
      linksBlock(l) +
      '<section class="panel stack"><h2 class="sec">Вопрос по теме</h2><p class="muted small">Что-то непонятно? Спросите Claude — он ответит по-русски с примерами.</p><div data-ai-slot="lessonAsk" data-arg="' + l.id + '"></div></section>' +
      '<div class="row" style="justify-content:space-between">' + (prev ? '<button class="btn ghost" data-act="open-lesson" data-arg="' + prev.id + '">← ' + esc(prev.title) + "</button>" : "<span></span>") +
      (next ? '<button class="btn ghost" data-act="open-lesson" data-arg="' + next.id + '">' + esc(next.title) + " →</button>" : "") + "</div>";
  }
  function answerQuiz(arg) {
    const [lid, qi, oi] = arg.split(":");
    const l = D.LESSONS.find((x) => x.id === lid);
    const q = ui.UI.quiz[lid] || (ui.UI.quiz[lid] = {});
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
        App.state.today().lesson++;
        toast("Урок пройден: " + score + "%. ¡Muy bien! Ниже — где эта тема звучит в диалогах.");
      } else toast(score + "% — для зачёта нужно 70%. Перечитайте объяснение и попробуйте ещё раз.");
    }
    App.state.save();
  }

  App.slots.lessonAsk = (el) => {
    if (!App.ai.AI.fn) return App.ai.aiNote();
    return '<form class="stack" data-form="lesson-ask" data-arg="' + esc(el.dataset.arg) + '"><textarea id="lessonQ" placeholder="Например: почему здесь estar, а не ser?"></textarea><div class="row"><button class="btn sm">Спросить</button></div></form><div class="ai-text" id="lessonA"></div>';
  };
  Object.assign(App.act, {
    "open-lesson": (b) => { App.router.open("grammar"); ui.UI.lesson = b.dataset.arg; App.router.render(); window.scrollTo(0, 0); },
    "back-grammar": () => { ui.UI.lesson = null; App.router.render(); },
    quiz: (b) => answerQuiz(b.dataset.arg),
    "quiz-reset": (b) => { ui.UI.quiz[b.dataset.arg] = {}; App.router.render(); const q = $("#quiz"); if (q) q.scrollIntoView({ block: "start" }); },
    drill: (b) => { S.settings.conjTenses = [b.dataset.arg]; App.state.save(); App.router.open("practice"); App.practice.start("conj"); }
  });
  App.forms["lesson-ask"] = (f) => {
    const q = $("#lessonQ").value.trim();
    if (!q) return;
    const l = D.LESSONS.find((x) => x.id === f.dataset.arg);
    App.ai.streamInto($("#lessonA"), "Ты — преподаватель испанского для русскоязычных взрослых, которые переезжают в Латинскую Америку (страна ученика: " + App.cfg.country().ru + ", уровень " + S.settings.level + "). Тема урока: «" + l.title + "».\nВопрос ученика: " + q + "\n\nОтветь по-русски, коротко и понятно, с 2–3 примерами на латиноамериканском испанском и их переводом.", { modelTier: "default" });
  };

  App.views.grammar = {
    // Тексты уроков и частые ошибки — отдельный блок данных; урок ещё показывает сцены и время из тренажёра
    needs: (sub) => (sub === "lesson" ? ["lessons", "dialogs", "verbs"] : ["lessons"]),
    render: (sub) => (sub === "lesson" ? renderLesson() : renderList())
  };
})(window.App = window.App || {});
