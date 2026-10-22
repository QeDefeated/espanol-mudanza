// Цели переезда (из онбординга), уровни освоения сцен и связи уроков с диалогами.
(function (App) {
  "use strict";
  const { dayKey, rank } = App.util;
  const S = App.S;
  const D = App.D;

  function focusGoals() {
    const f = S.settings.focus;
    return f.length ? f.map((id) => D.GOALS.find((g) => g.id === id)).filter(Boolean) : D.GOALS;
  }
  const goalOfDeck = (deckId) => focusGoals().find((g) => g.decks.includes(deckId)) || D.GOALS.find((g) => g.decks.includes(deckId));
  const dialogGoal = (id) => focusGoals().find((g) => g.dialogs.includes(id)) || D.GOALS.find((g) => g.dialogs.includes(id));
  const dialogById = (id) => D.DIALOGS.find((d) => d.id === id);

  // Уровень сцены: 0 — не начата, 1 «Прослушал», 2 «Могу повторить», 3 «Могу сказать своими словами»
  const dlgLevel = (id) => S.dlgLvl[id] || (S.dialogs[id] ? 1 : 0);
  function setDlgLevel(id, lvl) {
    const prev = dlgLevel(id);
    S.dlgLvl[id] = lvl;
    if (!S.dialogs[id]) S.dialogs[id] = dayKey();
    if (lvl > prev) App.state.today().dialog++;
    App.state.save();
  }

  // Готовность к цели: знакомые слова её тем (60%) и уровень освоения её сцен (40%)
  function goalStats(g) {
    return App.srs.cached("goal:" + g.id, () => {
      const { ALL, isSkipped, uniqueByEs } = App.srs;
      let total = 0, score = 0, familiar = 0;
      for (const c of uniqueByEs(ALL.filter((x) => g.decks.includes(x.deck) && !isSkipped(x)))) {
        total++;
        const st = S.cards[c.id];
        if (st) { familiar++; score += st.i >= 7 ? 1 : st.i >= 2 ? 0.6 : 0.3; }
      }
      const lv = g.dialogs.reduce((a, id) => a + dlgLevel(id), 0);
      const dlgDone = g.dialogs.filter((id) => dlgLevel(id) >= 2).length;
      const ready = Math.round(100 * (0.6 * (total ? score / total : 0) + 0.4 * (g.dialogs.length ? lv / (3 * g.dialogs.length) : 0)));
      return { total, familiar, ready, dlgDone, dlgTotal: g.dialogs.length };
    });
  }
  function readinessText(g, ready) {
    if (ready >= 85) return "Уже можете уверенно " + g.can + ".";
    if (ready >= 60) return "Уже можете " + g.can + ", иногда переспрашивая.";
    if (ready >= 25) return "Справитесь с базовыми фразами. Цель: " + g.can + ".";
    return "Начало пути. Цель: " + g.can + ".";
  }
  // Текущая сцена: начатая, но не освоенная сцена из целей; иначе следующая новая
  function currentDialog() {
    const list = focusGoals().flatMap((g) => g.dialogs).map(dialogById).filter(Boolean);
    return list.find((d) => dlgLevel(d.id) >= 1 && dlgLevel(d.id) < 3) || list.find((d) => dlgLevel(d.id) === 0) || D.DIALOGS.find((d) => dlgLevel(d.id) < 3) || null;
  }
  const dialogsByFocus = () => { const order = focusGoals().flatMap((g) => g.dialogs); return D.DIALOGS.slice().sort((a, b) => rank(order, a.id) - rank(order, b.id)); };

  // Сцены, где встречается конструкция урока (шаблон из content/goals.js); нужны загруженные реплики
  function lessonDialogs(l, max) {
    const link = D.LINKS[l.id];
    if (!link || !link.pattern || !App.data.has("dialogs")) return [];
    const re = new RegExp(link.pattern, "i");
    const out = [];
    for (const d of dialogsByFocus()) {
      const line = d.lines.find((x) => re.test(x[1]));
      if (line) out.push({ dialog: d, line: line[1], ru: line[2] });
      if (out.length >= (max || 3)) break;
    }
    return out;
  }

  App.goals = { focusGoals, goalOfDeck, dialogGoal, dialogById, dlgLevel, setDlgLevel, goalStats, readinessText, currentDialog, dialogsByFocus, lessonDialogs };
})(window.App = window.App || {});
