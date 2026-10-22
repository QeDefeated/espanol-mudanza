// Озвучка. Фразы из словаря, диалогов и уроков заранее записаны нейросетевыми голосами:
// audio/<пакет>.json (base64 mp3), индекс «ключ фразы → пакет» — audio/index.json (грузится лениво).
// Голос браузера нужен только для того, чего нет в записи (формы глаголов, ответы Claude, свои слова).
(function (App) {
  "use strict";
  const { esc, toast, ICON } = App.util;
  const S = App.S;
  const D = App.D;

  const Voice = { ok: typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined", list: [], warned: false, keep: [] };
  function loadVoices() {
    if (!Voice.ok) return;
    try { Voice.list = speechSynthesis.getVoices().filter((v) => /^es([-_]|$)/i.test(v.lang)); } catch (e) { Voice.list = []; }
  }
  if (Voice.ok) {
    loadVoices();
    try { speechSynthesis.addEventListener("voiceschanged", () => { loadVoices(); if (document.querySelector("#voiceSel")) App.router.render(); }); } catch (e) { /* старый браузер */ }
  }
  function chooseVoice() {
    if (!Voice.list.length) loadVoices();
    if (S.settings.voice) { const v = Voice.list.find((x) => x.voiceURI === S.settings.voice); if (v) return v; }
    const norm = (l) => l.replace("_", "-").toLowerCase();
    const want = [App.cfg.country().lang, "es-mx", "es-us", "es-419", "es-co", "es-ar"].map((x) => x.toLowerCase());
    for (const l of want) {
      const cands = Voice.list.filter((v) => norm(v.lang) === l);
      if (cands.length) return cands.find((v) => /natural|online|google/i.test(v.name)) || cands[0];
    }
    return Voice.list.find((v) => !/es-es/i.test(norm(v.lang))) || Voice.list[0] || null;
  }
  function utter(text, slow) {
    const u = new SpeechSynthesisUtterance(String(text).replace(/[«»—]/g, " "));
    const v = chooseVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = App.cfg.country().lang;
    u.rate = slow ? 0.62 : S.settings.rate;
    Voice.keep.push(u); if (Voice.keep.length > 30) Voice.keep.shift();
    return u;
  }

  const REC = { packs: {}, loading: {}, audio: null, seq: 0 };
  const AK = window.ES_AUDIO_KEY;
  function loadPack(name) {
    if (REC.packs[name]) return Promise.resolve(REC.packs[name]);
    if (!REC.loading[name]) {
      REC.loading[name] = fetch("audio/" + name + ".json")
        .then((r) => (r.ok ? r.json() : {}))
        .then((j) => (REC.packs[name] = j))
        .catch(() => { delete REC.loading[name]; return {}; });
    }
    return REC.loading[name];
  }
  const packFor = (text) => (D.AUDIO && AK ? D.AUDIO[AK.audioKey(text)] : null);
  // Есть ли запись (до загрузки индекса отвечает «нет» — вызывающий код сначала ждёт ensure(["audio"]))
  const hasRecording = (text) => !!packFor(text);
  function preload(texts) {
    const run = () => { const seen = new Set(); texts.forEach((t) => { const p = t && packFor(t); if (p && !seen.has(p)) { seen.add(p); loadPack(p); } }); };
    if (App.data.has("audio")) run(); else App.data.load("audio").then(run, () => {});
  }
  function stop() {
    REC.seq++;
    if (REC.audio) { try { REC.audio.pause(); } catch (e) { /* уже остановлено */ } REC.audio = null; }
    if (Voice.ok) try { speechSynthesis.cancel(); } catch (e) { /* нечего останавливать */ }
  }
  // Проигрывает фразу; onend вызывается после окончания (или сразу, если звука нет)
  async function speak(text, slow, onend) {
    stop();
    const seq = REC.seq;
    const done = () => { if (seq === REC.seq && onend) onend(); };
    if (!App.data.has("audio")) {
      try { await App.data.load("audio"); } catch (e) { /* без записи — голос браузера */ }
      if (seq !== REC.seq) return;
    }
    const pack = packFor(text);
    if (pack) {
      const p = await loadPack(pack);
      if (seq !== REC.seq) return;
      const b64 = p[AK.audioKey(text)];
      if (b64) {
        const a = new Audio("data:audio/mpeg;base64," + b64);
        a.playbackRate = slow ? 0.7 : Math.max(0.6, Math.min(1.3, S.settings.rate / 0.9));
        a.onended = done;
        a.onerror = done;
        REC.audio = a;
        a.play().catch(() => { if (seq === REC.seq) toast("Браузер не дал включить звук. Нажмите кнопку озвучки ещё раз."); });
        return;
      }
    }
    speakBrowser(text, slow, done);
  }
  function speakBrowser(text, slow, done) {
    const v = Voice.ok ? chooseVoice() : null;
    if (!v) {
      if (!Voice.warned) { Voice.warned = true; toast("Для этой фразы нет записи, а испанского голоса в браузере нет. Как его добавить — в «Прогрессе» → «Озвучка»."); }
      if (done) setTimeout(done, 300);
      return;
    }
    try {
      const u = utter(text, slow);
      u.onend = done; u.onerror = done;
      speechSynthesis.speak(u);
    } catch (e) { if (done) done(); }
  }
  const sayBtn = (text, cls) => '<button class="say ' + (cls || "") + '" data-act="say" data-text="' + esc(text) + '" aria-label="Произнести" title="Произнести">' + ICON.say + "</button>";

  App.audio = { Voice, chooseVoice, speak, stop, preload, hasRecording, sayBtn };
})(window.App = window.App || {});
