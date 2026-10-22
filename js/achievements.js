// Серии дней и мягкие достижения. Новые достижения проверяются при каждом сохранении.
(function (App) {
  "use strict";
  const { dayKey, addDays, toast } = App.util;
  const S = App.S;
  const D = App.D;

  function streak() {
    let n = 0, k = dayKey();
    if (!((S.days[k] || {}).sec >= 600)) k = addDays(k, -1);
    while ((S.days[k] || {}).sec >= 600) { n++; k = addDays(k, -1); }
    return n;
  }
  function bestStreak() {
    const keys = Object.keys(S.days).filter((k) => S.days[k].sec >= 600).sort();
    let best = 0, cur = 0, prev = null;
    for (const k of keys) { cur = prev && addDays(prev, 1) === k ? cur + 1 : 1; best = Math.max(best, cur); prev = k; }
    return best;
  }
  function metrics() {
    return App.srs.cached("metrics", () => {
      const { deckCounts, uniqueAll } = App.srs;
      const { dlgLevel, goalStats } = App.goals;
      const days = Object.values(S.days);
      const themeDone = D.DECKS.filter((d) => d.group !== "top").filter((d) => { const dc = deckCounts(d.id); return dc.total && dc.fresh === 0; });
      return {
        familiar: uniqueAll().filter((c) => S.cards[c.id]).length,
        bestStreak: bestStreak(),
        dlg: D.DIALOGS.filter((d) => dlgLevel(d.id) >= 1).length,
        dlg3: D.DIALOGS.filter((d) => dlgLevel(d.id) >= 3).length,
        lessons: Object.keys(S.lessons).length,
        a1: D.LESSONS.filter((l) => l.level === "A1").every((l) => S.lessons[l.id]),
        b1: D.LESSONS.some((l) => l.level === "B1" && S.lessons[l.id]),
        prac: days.reduce((a, d) => a + (d.prac || 0), 0),
        ok: S.stats.ok || 0,
        chat: days.reduce((a, d) => a + (d.chat || 0), 0),
        themes: themeDone.map((d) => d.title),
        goalReady: D.GOALS.filter((g) => goalStats(g).ready >= 85).length
      };
    });
  }
  const ACH = [
    { id: "w10", t: "Первые 10 слов", d: "Начать учить 10 слов", ok: (m) => m.familiar >= 10 },
    { id: "w50", t: "50 слов", d: "50 знакомых слов — конец мягкого старта", ok: (m) => m.familiar >= 50 },
    { id: "w100", t: "Сотня", d: "100 знакомых слов", ok: (m) => m.familiar >= 100 },
    { id: "w250", t: "250 слов", d: "Хватает, чтобы объясниться в магазине и на улице", ok: (m) => m.familiar >= 250 },
    { id: "w500", t: "500 слов", d: "Половина топ-1000", ok: (m) => m.familiar >= 500 },
    { id: "w1000", t: "Тысяча слов", d: "Около 80% повседневной речи", ok: (m) => m.familiar >= 1000 },
    { id: "s3", t: "3 дня подряд", d: "Заниматься по 10+ минут три дня подряд", ok: (m) => m.bestStreak >= 3 },
    { id: "s7", t: "Неделя подряд", d: "7 дней подряд по 10+ минут", ok: (m) => m.bestStreak >= 7 },
    { id: "s14", t: "Две недели", d: "14 дней подряд", ok: (m) => m.bestStreak >= 14 },
    { id: "s30", t: "Месяц без пропусков", d: "30 дней подряд", ok: (m) => m.bestStreak >= 30 },
    { id: "d1", t: "Первая сцена", d: "Пройти первый диалог", ok: (m) => m.dlg >= 1 },
    { id: "d5", t: "5 диалогов", d: "Пройти 5 сцен", ok: (m) => m.dlg >= 5 },
    { id: "d10", t: "10 диалогов", d: "Пройти 10 сцен", ok: (m) => m.dlg >= 10 },
    { id: "dall", t: "Все сцены", d: "Пройти все диалоги", ok: (m) => m.dlg >= D.DIALOGS.length },
    { id: "own", t: "Своими словами", d: "Довести одну сцену до уровня «Могу сказать своими словами»", ok: (m) => m.dlg3 >= 1 },
    { id: "l1", t: "Первый урок", d: "Сдать тест первого урока", ok: (m) => m.lessons >= 1 },
    { id: "l5", t: "5 уроков", d: "Сдать тесты 5 уроков", ok: (m) => m.lessons >= 5 },
    { id: "la1", t: "База A1", d: "Пройти все уроки уровня A1", ok: (m) => m.a1 },
    { id: "lb1", t: "Уровень B1", d: "Сдать первый урок уровня B1", ok: (m) => m.b1 },
    { id: "p10", t: "10 упражнений", d: "Завершить 10 упражнений", ok: (m) => m.prac >= 10 },
    { id: "a100", t: "100 верных ответов", d: "В упражнениях и тестах", ok: (m) => m.ok >= 100 },
    { id: "chat", t: "Первый разговор", d: "5 реплик в разговоре с Claude", ok: (m) => m.chat >= 5 },
    { id: "theme", t: "Тема освоена", d: "Начать учить все слова одной темы для переезда", ok: (m) => m.themes.length >= 1 },
    { id: "goal", t: "Готов к цели", d: "Готовность к одной из целей переезда — 85%", ok: (m) => m.goalReady >= 1 }
  ];
  function check() {
    if (!D.DECKS.length) return;
    const m = metrics();
    const fresh = ACH.filter((a) => !S.ach[a.id] && a.ok(m));
    if (!fresh.length) return;
    const first = !Object.keys(S.ach).length;
    fresh.forEach((a) => { S.ach[a.id] = dayKey(); });
    if (!(first && fresh.length > 2)) setTimeout(() => toast("Новое достижение: «" + fresh[fresh.length - 1].t + "»"), 400);
  }

  App.ach = { ACH, streak, bestStreak, metrics, check };
})(window.App = window.App || {});
