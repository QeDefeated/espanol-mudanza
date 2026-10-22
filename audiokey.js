// Ключ записанной озвучки: одинаково считается в приложении и в скрипте записи.
(function (root) {
  function audioClean(text) {
    return String(text).replace(/[«»]/g, "").replace(/—/g, " ").replace(/\s+/g, " ").trim();
  }
  // FNV-1a, 32 бита
  function audioKey(text) {
    const s = audioClean(text);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(36);
  }
  const api = { audioKey, audioClean };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ES_AUDIO_KEY = api;
})(typeof window !== "undefined" ? window : this);
