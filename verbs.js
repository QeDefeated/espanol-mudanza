// Спряжение глаголов (латиноамериканская норма: без vosotros).
// Правильные формы строятся по правилам; у неправильных глаголов заданы
// только отличия: yo — неправильная форма «я» в настоящем, ch — чередование
// в корне, pretStem — «сильная» основа претерита, fut — основа будущего и т. д.
(function () {
  "use strict";

  const PERSONS = ["yo", "tú", "él / ella / usted", "nosotros", "ellos / ustedes"];
  const IMP_PERSONS = ["tú", "usted", "ustedes"];

  const TENSES = [
    { id: "pres", es: "Presente", ru: "Настоящее время", hint: "hablo — я говорю" },
    { id: "cont", es: "Estar + gerundio", ru: "Сейчас, в процессе", hint: "estoy hablando — я сейчас говорю" },
    { id: "irA", es: "Ir a + infinitivo", ru: "Ближайшее будущее", hint: "voy a hablar — я собираюсь сказать" },
    { id: "pret", es: "Pretérito indefinido", ru: "Прошедшее законченное", hint: "hablé — я сказал (один раз, ayer)" },
    { id: "impf", es: "Pretérito imperfecto", ru: "Прошедшее длительное", hint: "hablaba — я говорил (обычно, фон)" },
    { id: "perf", es: "Pretérito perfecto", ru: "Недавнее прошлое", hint: "he hablado — я (уже) сказал" },
    { id: "plusc", es: "Pluscuamperfecto", ru: "Предпрошедшее", hint: "había hablado — я уже сказал (до того)" },
    { id: "fut", es: "Futuro simple", ru: "Будущее время", hint: "hablaré — я скажу" },
    { id: "cond", es: "Condicional", ru: "Условное («бы»)", hint: "hablaría — я бы сказал" },
    { id: "subj", es: "Presente de subjuntivo", ru: "Субхунтив", hint: "que hable — чтобы я сказал" },
    { id: "subjImp", es: "Imperfecto de subjuntivo", ru: "Субхунтив прошедшего", hint: "si hablara — если бы я говорил" },
    { id: "imp", es: "Imperativo", ru: "Повелительное", hint: "habla / hable / hablen — говори / говорите" }
  ];

  // top: 1 — входит в набор «самые нужные»
  const VERBS = [
    { inf: "ser", ru: "быть (кем-то, каким-то)", top: 1,
      pres: ["soy", "eres", "es", "somos", "son"],
      pret: ["fui", "fuiste", "fue", "fuimos", "fueron"],
      impf: ["era", "eras", "era", "éramos", "eran"],
      subj: ["sea", "seas", "sea", "seamos", "sean"], impT: "sé" },
    { inf: "estar", ru: "быть, находиться", top: 1,
      pres: ["estoy", "estás", "está", "estamos", "están"], pretStem: "estuv",
      subj: ["esté", "estés", "esté", "estemos", "estén"] },
    { inf: "tener", ru: "иметь", top: 1, yo: "tengo", ch: "ie", pretStem: "tuv", fut: "tendr", impT: "ten" },
    { inf: "ir", ru: "идти, ехать", top: 1,
      pres: ["voy", "vas", "va", "vamos", "van"],
      pret: ["fui", "fuiste", "fue", "fuimos", "fueron"],
      impf: ["iba", "ibas", "iba", "íbamos", "iban"],
      subj: ["vaya", "vayas", "vaya", "vayamos", "vayan"], impT: "ve", ger: "yendo" },
    { inf: "hacer", ru: "делать", top: 1, yo: "hago", pretStem: "hic", pret3: "hizo", fut: "har", part: "hecho", impT: "haz" },
    { inf: "poder", ru: "мочь", top: 1, ch: "ue", pretStem: "pud", fut: "podr", ger: "pudiendo", noImp: 1 },
    { inf: "querer", ru: "хотеть", top: 1, ch: "ie", pretStem: "quis", fut: "querr" },
    { inf: "decir", ru: "говорить, сказать", top: 1, yo: "digo", ch: "i", pretStem: "dij", fut: "dir", part: "dicho", impT: "di", ger: "diciendo" },
    { inf: "venir", ru: "приходить, приезжать", top: 1, yo: "vengo", ch: "ie", pretStem: "vin", fut: "vendr", impT: "ven", ger: "viniendo" },
    { inf: "poner", ru: "класть, ставить", yo: "pongo", pretStem: "pus", fut: "pondr", part: "puesto", impT: "pon" },
    { inf: "salir", ru: "выходить, уезжать", top: 1, yo: "salgo", fut: "saldr", impT: "sal" },
    { inf: "saber", ru: "знать, уметь", top: 1, yo: "sé", pretStem: "sup", fut: "sabr",
      subj: ["sepa", "sepas", "sepa", "sepamos", "sepan"] },
    { inf: "conocer", ru: "знать (кого-то), быть знакомым", yo: "conozco" },
    { inf: "dar", ru: "давать", top: 1,
      pres: ["doy", "das", "da", "damos", "dan"],
      pret: ["di", "diste", "dio", "dimos", "dieron"],
      subj: ["dé", "des", "dé", "demos", "den"] },
    { inf: "ver", ru: "видеть, смотреть", top: 1,
      pret: ["vi", "viste", "vio", "vimos", "vieron"],
      impf: ["veía", "veías", "veía", "veíamos", "veían"],
      subj: ["vea", "veas", "vea", "veamos", "vean"], part: "visto" },
    { inf: "traer", ru: "приносить", yo: "traigo", pretStem: "traj", part: "traído", ger: "trayendo" },
    { inf: "oír", ru: "слышать",
      pres: ["oigo", "oyes", "oye", "oímos", "oyen"],
      pret: ["oí", "oíste", "oyó", "oímos", "oyeron"],
      subj: ["oiga", "oigas", "oiga", "oigamos", "oigan"], part: "oído", ger: "oyendo" },
    { inf: "leer", ru: "читать", pret: ["leí", "leíste", "leyó", "leímos", "leyeron"], part: "leído", ger: "leyendo" },
    { inf: "creer", ru: "верить, считать", pret: ["creí", "creíste", "creyó", "creímos", "creyeron"], part: "creído", ger: "creyendo" },
    { inf: "seguir", ru: "продолжать; следовать", yo: "sigo", ch: "i" },
    { inf: "conseguir", ru: "достать, добиться", yo: "consigo", ch: "i" },
    { inf: "pedir", ru: "просить, заказывать", top: 1, ch: "i" },
    { inf: "servir", ru: "служить, подавать; годиться", ch: "i" },
    { inf: "repetir", ru: "повторять", ch: "i" },
    { inf: "sentir", ru: "чувствовать", ch: "ie" },
    { inf: "preferir", ru: "предпочитать", ch: "ie" },
    { inf: "dormir", ru: "спать", top: 1, ch: "ue" },
    { inf: "pensar", ru: "думать", top: 1, ch: "ie" },
    { inf: "empezar", ru: "начинать", top: 1, ch: "ie" },
    { inf: "cerrar", ru: "закрывать", ch: "ie" },
    { inf: "entender", ru: "понимать", top: 1, ch: "ie" },
    { inf: "perder", ru: "терять", ch: "ie" },
    { inf: "volver", ru: "возвращаться", ch: "ue", part: "vuelto" },
    { inf: "encontrar", ru: "находить", top: 1, ch: "ue" },
    { inf: "costar", ru: "стоить", ch: "ue" },
    { inf: "recordar", ru: "помнить", ch: "ue" },
    { inf: "almorzar", ru: "обедать (днём)", ch: "ue" },
    { inf: "jugar", ru: "играть", ch: "ue", vowel: "u" },
    { inf: "parecer", ru: "казаться", yo: "parezco" },
    { inf: "escribir", ru: "писать", part: "escrito" },
    { inf: "abrir", ru: "открывать", part: "abierto" },
    { inf: "hablar", ru: "говорить, разговаривать", top: 1 },
    { inf: "trabajar", ru: "работать", top: 1 },
    { inf: "vivir", ru: "жить", top: 1 },
    { inf: "comer", ru: "есть, обедать", top: 1 },
    { inf: "beber", ru: "пить" },
    { inf: "tomar", ru: "брать; пить", top: 1 },
    { inf: "necesitar", ru: "нуждаться", top: 1 },
    { inf: "buscar", ru: "искать", top: 1 },
    { inf: "pagar", ru: "платить", top: 1 },
    { inf: "llegar", ru: "прибывать", top: 1 },
    { inf: "llamar", ru: "звонить, звать" },
    { inf: "mandar", ru: "отправлять" },
    { inf: "rentar", ru: "снимать (жильё)" },
    { inf: "comprar", ru: "покупать", top: 1 },
    { inf: "vender", ru: "продавать" },
    { inf: "esperar", ru: "ждать; надеяться" },
    { inf: "deber", ru: "быть должным" },
    { inf: "aprender", ru: "учить(ся)", top: 1 },
    { inf: "cambiar", ru: "менять" },
    { inf: "llevar", ru: "нести, брать с собой" },
    { inf: "dejar", ru: "оставлять; позволять" },
    { inf: "ayudar", ru: "помогать" },
    { inf: "manejar", ru: "водить (машину)" },
    { inf: "estudiar", ru: "учиться, изучать" },
    { inf: "recibir", ru: "получать" },
    { inf: "subir", ru: "подниматься" },
    { inf: "bajar", ru: "спускаться" },
    { inf: "terminar", ru: "заканчивать" },
    { inf: "firmar", ru: "подписывать" },
    { inf: "viajar", ru: "путешествовать" },
    { inf: "cocinar", ru: "готовить (еду)" },
    { inf: "limpiar", ru: "убирать, чистить" },
    { inf: "preguntar", ru: "спрашивать" },
    { inf: "entrar", ru: "входить" },
    { inf: "regresar", ru: "возвращаться" },
    { inf: "practicar", ru: "практиковать" }
  ];

  const stripAcc = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC");
  const type = (v) => stripAcc(v.inf).slice(-2);
  const stem = (v) => stripAcc(v.inf).slice(0, -2);

  function replaceLast(s, from, to) {
    const i = s.lastIndexOf(from);
    return i < 0 ? s : s.slice(0, i) + to + s.slice(i + from.length);
  }
  // Чередование под ударением: e→ie, o→ue (jugar: u→ue), e→i
  function changeStressed(v, s) {
    if (v.ch === "ie") return replaceLast(s, "e", "ie");
    if (v.ch === "i") return replaceLast(s, "e", "i");
    if (v.ch === "ue") return replaceLast(s, v.vowel || "o", "ue");
    return s;
  }
  // Глаголы на -ir с чередованием: e→i, o→u (pidió, durmió, sintamos)
  function changeWeak(v, s) {
    if (type(v) !== "ir" || !v.ch) return s;
    if (v.ch === "ue") return replaceLast(s, "o", "u");
    return replaceLast(s, "e", "i");
  }
  // Орфография перед e: c→qu, g→gu, z→c
  function spellBeforeE(s) {
    if (s.endsWith("c")) return s.slice(0, -1) + "qu";
    if (s.endsWith("g")) return s + "u";
    if (s.endsWith("z")) return s.slice(0, -1) + "c";
    return s;
  }

  const forms = {
    pres(v) {
      if (v.pres) return v.pres.slice();
      const t = type(v), st = stem(v);
      const E = { ar: ["o", "as", "a", "amos", "an"], er: ["o", "es", "e", "emos", "en"], ir: ["o", "es", "e", "imos", "en"] }[t];
      const out = E.map((e, i) => (v.ch && i !== 3 ? changeStressed(v, st) : st) + e);
      if (v.yo) out[0] = v.yo;
      return out;
    },
    pret(v) {
      if (v.pret) return v.pret.slice();
      if (v.pretStem) {
        const s = v.pretStem, j = s.endsWith("j");
        return [s + "e", s + "iste", v.pret3 || s + "o", s + "imos", s + (j ? "eron" : "ieron")];
      }
      const t = type(v), st = stem(v);
      if (t === "ar") {
        return [spellBeforeE(st) + "é", st + "aste", st + "ó", st + "amos", st + "aron"];
      }
      const w = changeWeak(v, st);
      return [st + "í", st + "iste", w + "ió", st + "imos", w + "ieron"];
    },
    impf(v) {
      if (v.impf) return v.impf.slice();
      const st = stem(v);
      const E = type(v) === "ar" ? ["aba", "abas", "aba", "ábamos", "aban"] : ["ía", "ías", "ía", "íamos", "ían"];
      return E.map((e) => st + e);
    },
    fut(v) {
      const s = v.fut || stripAcc(v.inf);
      return ["é", "ás", "á", "emos", "án"].map((e) => s + e);
    },
    cond(v) {
      const s = v.fut || stripAcc(v.inf);
      return ["ía", "ías", "ía", "íamos", "ían"].map((e) => s + e);
    },
    part(v) {
      if (v.part) return v.part;
      return stem(v) + (type(v) === "ar" ? "ado" : "ido");
    },
    ger(v) {
      if (v.ger) return v.ger;
      const t = type(v), st = stem(v);
      if (t === "ar") return st + "ando";
      if (/[aeo]$/.test(st)) return st + "yendo";
      return changeWeak(v, st) + "iendo";
    },
    perf(v) {
      const p = forms.part(v);
      return ["he", "has", "ha", "hemos", "han"].map((a) => a + " " + p);
    },
    plusc(v) {
      const p = forms.part(v);
      return ["había", "habías", "había", "habíamos", "habían"].map((a) => a + " " + p);
    },
    // От формы ellos претерита: hablaron → hablara; в nosotros ударение: habláramos
    subjImp(v) {
      const st = forms.pret(v)[4].slice(0, -3);
      const acc = { a: "á", e: "é", i: "í", o: "ó", u: "ú" };
      const stAcc = st.replace(/[aeiou](?=[^aeiou]*$)/, (m) => acc[m]);
      return [st + "ra", st + "ras", st + "ra", stAcc + "ramos", st + "ran"];
    },
    cont(v) {
      const g = forms.ger(v);
      return ["estoy", "estás", "está", "estamos", "están"].map((a) => a + " " + g);
    },
    irA(v) {
      return ["voy a", "vas a", "va a", "vamos a", "van a"].map((a) => a + " " + v.inf);
    },
    subj(v) {
      if (v.subj) return v.subj.slice();
      const t = type(v);
      const E = t === "ar" ? ["e", "es", "e", "emos", "en"] : ["a", "as", "a", "amos", "an"];
      const fix = t === "ar" ? spellBeforeE : (s) => s;
      if (v.yo && v.yo.endsWith("o")) {
        const ys = v.yo.slice(0, -1);
        return E.map((e) => fix(ys) + e);
      }
      const st = stem(v);
      const strong = v.ch ? changeStressed(v, st) : st;
      const nos = v.ch ? changeWeak(v, st) : st;
      return E.map((e, i) => fix(i === 3 ? nos : strong) + e);
    },
    imp(v) {
      if (v.noImp) return null;
      const s = forms.subj(v);
      const tu = v.impT || forms.pres(v)[2];
      return [tu, s[2], s[4]];
    }
  };

  function conjugate(v, tense) {
    if (typeof v === "string") v = VERBS.find((x) => x.inf === v);
    if (!v || !forms[tense]) return null;
    return forms[tense](v);
  }

  window.ES_CONJ = { PERSONS, IMP_PERSONS, TENSES, VERBS, conjugate, stripAcc };
})();
