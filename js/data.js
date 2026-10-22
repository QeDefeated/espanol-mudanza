// Ленивая загрузка учебных данных.
// На старте нужен только data/index.json: слова (без примеров), названия уроков и сцен, цели.
// Остальное подгружается по требованию раздела, а в свободное время — фоном:
//   words:<тема>  — примеры и заметки к словам темы (data/words/<тема>.json)
//   dialogs       — реплики и выражения всех сцен (data/dialogs.json)
//   lessons       — тексты уроков и частые ошибки (data/lessons.json)
//   verbs         — движок спряжений (verbs.js)
//   audio         — индекс записанной озвучки (audio/index.json)
(function (App) {
  "use strict";

  const D = App.D = { DECKS: [], LESSONS: [], DIALOGS: [], GOALS: [], LINKS: {}, ERRORS: [], CONJ: null, AUDIO: null, version: "" };
  const loaded = new Set();
  const pending = new Map();

  function getJSON(url) {
    return fetch(url).then((r) => {
      if (!r.ok) throw new Error(url + ": " + r.status);
      return r.json();
    });
  }
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error(src));
      document.head.appendChild(s);
    });
  }
  // Полные данные дописываются в уже существующие объекты: ссылки на них в модулях остаются верными
  const fillById = (list, full) => { for (const f of full) { const x = list.find((y) => y.id === f.id); if (x) Object.assign(x, f); } };

  const LOADERS = {
    dialogs: () => getJSON("data/dialogs.json").then((list) => fillById(D.DIALOGS, list)),
    lessons: () => getJSON("data/lessons.json").then((j) => { fillById(D.LESSONS, j.lessons); D.ERRORS = j.errors; }),
    verbs: () => loadScript("verbs.js").then(() => { D.CONJ = window.ES_CONJ; }),
    audio: () => getJSON("audio/index.json").then((j) => { D.AUDIO = j; })
  };
  function loaderFor(name) {
    if (LOADERS[name]) return LOADERS[name];
    if (name.startsWith("words:")) {
      const deck = name.slice(6);
      return () => getJSON("data/words/" + deck + ".json").then((rows) => App.srs.applyDetails(deck, rows));
    }
    throw new Error("Неизвестный блок данных: " + name);
  }
  function load(name) {
    if (loaded.has(name)) return Promise.resolve();
    if (pending.has(name)) return pending.get(name);
    const p = loaderFor(name)().then(
      () => { loaded.add(name); pending.delete(name); },
      (e) => { pending.delete(name); throw e; }
    );
    pending.set(name, p);
    return p;
  }
  const has = (name) => loaded.has(name);
  const missing = (names) => names.filter((n) => !loaded.has(n));
  const ensure = (names) => Promise.all(missing(names).map(load));

  async function loadIndex() {
    const j = await getJSON("data/index.json");
    D.version = j.v;
    D.DECKS = j.decks.map((d) => ({ id: d.id, group: d.group || null, title: d.title, es: d.es, words: d.w }));
    D.LESSONS = j.lessons;
    D.DIALOGS = j.dialogs.map((d) => Object.assign({ lines: null, vocab: null }, d));
    D.GOALS = j.goals;
    D.LINKS = j.links;
  }

  // Фоновая подгрузка всего остального по одному блоку, когда браузер свободен.
  // Благодаря ей переходы между разделами мгновенные, а Service Worker успевает положить данные в кэш для офлайна.
  function prefetch() {
    const queue = ["dialogs", "audio", "lessons", "verbs"].concat(D.DECKS.map((d) => "words:" + d.id));
    let i = 0;
    const step = () => {
      if (i >= queue.length) return;
      load(queue[i++]).catch(() => { /* повторим по требованию */ }).finally(() => App.util.idle(step));
    };
    App.util.idle(step);
  }

  App.data = { loadIndex, load, ensure, has, missing, prefetch };
})(window.App = window.App || {});
