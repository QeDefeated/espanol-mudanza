// Цели переезда, связи между разделами и частые ошибки русскоязычных.
// Только данные: логика — в app.js.

// Цели, которые человек выбирает в онбординге. decks — темы слов, dialogs — сцены;
// can — практический результат («уже можете …»), why — зачем эти слова в плане дня.
window.ES_GOALS = [
  {
    id: "home", title: "Жильё и аренда", es: "Vivienda",
    decks: ["home", "services"], dialogs: ["viewing", "lease", "plumber", "neighbor", "moveout"],
    can: "осмотреть квартиру, обсудить договор и вызвать мастера",
    why: "пригодятся при осмотре квартиры и разговоре с хозяином"
  },
  {
    id: "docs", title: "Документы и банк", es: "Trámites y banco",
    decks: ["docs", "money"], dialogs: ["airport", "migration", "bank", "bankcard", "sim"],
    can: "пройти миграционные процедуры, открыть счёт и купить SIM-карту",
    why: "понадобятся в миграционной службе, банке и салоне связи"
  },
  {
    id: "life", title: "Быт и покупки", es: "Vida diaria",
    decks: ["food", "shop", "city", "health"], dialogs: ["taxi", "market", "cafe", "directions", "pharmacy", "doctor", "package", "haircut", "gym", "dentist", "vet", "school"],
    can: "закупиться на рынке, поесть в кафе, добраться по городу и сходить к врачу",
    why: "пригодятся на рынке, в кафе, транспорте и аптеке"
  },
  {
    id: "work", title: "Работа", es: "Trabajo",
    decks: ["work"], dialogs: ["interview", "dinner"],
    can: "пройти собеседование и общаться с коллегами",
    why: "понадобятся на собеседовании и в разговорах с коллегами"
  },
  {
    id: "talk", title: "Общее общение", es: "Conversación",
    decks: ["base", "people", "phrases", "describe", "verbs", "time"], dialogs: ["neighbor", "dinner", "directions"],
    can: "познакомиться, рассказать о себе и поддержать разговор",
    why: "помогут знакомиться и поддерживать разговор"
  }
];

// Где в диалогах встречается тема урока: регулярное выражение по испанским репликам
// и куда идти тренироваться (drill — время в тренажёре, practice — вид упражнения, error — частая ошибка).
window.ES_LESSON_LINKS = {
  sounds: { pattern: null, practice: "dict" },
  articles: { pattern: "\\b(al|del)\\b", practice: "type", error: "article" },
  pronouns: { pattern: "\\b(usted|ustedes)\\b", practice: "build" },
  serestar: { pattern: "\\b(soy|eres|somos|son|estoy|estás|está|estamos|están)\\b", practice: "errors", error: "serestar" },
  hay: { pattern: "\\b(hay)\\b", practice: "errors", error: "hay" },
  present: { pattern: "\\b(trabajo|vivo|necesito|busco|hablo|comemos|vives)\\b", practice: "conj" },
  stemchange: { pattern: "\\b(puedo|puede|puedes|quiero|quiere|cuesta|prefiero|empieza|vuelvo|pido|sirve|piensas)\\b", practice: "conj" },
  irregular: { pattern: "\\b(tengo|tiene|voy|vamos|hago|digo|vengo|salgo|traigo|tengo que|acabo de|vas a|voy a)\\b", practice: "conj", error: "tener" },
  questions: { pattern: "¿(qué|cuál|cuánto|cuánta|cuántos|cuántas|dónde|cuándo|cómo|por qué|quién|a qué hora)", practice: "build", error: "cual" },
  gustar: { pattern: "\\b(me|te|le|nos|les) (gusta|gustan|encanta|encantan|duele|duelen|falta|faltan|molesta)\\b", practice: "errors", error: "gustar" },
  adjectives: { pattern: "\\b(mi|mis|tu|tus|su|sus|nuestro|nuestra)\\b", practice: "build", error: "adjorder" },
  reflexive: { pattern: "\\b(me|te|se|nos) (llamo|llama|mudo|mudé|mudamos|siento|sientes|quedo|baño|levanto|preocupe|preocupes)\\b", practice: "build" },
  objects: { pattern: "\\b(se lo|se la|se los|se las|me lo|te lo|lo|la|los|las) (mando|doy|pongo|tengo|reviso|transfiero|traigo|muestro|explico|ayudo|llevo|envío)\\b", practice: "build", error: "personal-a" },
  preterite: { pattern: "\\b(fui|fue|hice|hizo|dijo|tuve|pagué|llegué|llegamos|compré|vine|pudo|pasó|probaste|arregló|revisaste|cambiaron|vomitó|terminó|saqué|ingresé|dieron)\\b", practice: "conj", error: "past" },
  imperfect: { pattern: "\\b(estaba|era|había|tenía|vivía|quería|iba|hacía|sabía|acordaba|goteaba)\\b", practice: "conj", error: "past" },
  perfect: { pattern: "\\b(he|has|ha|hemos|han) [a-záéíóúñ]+(ado|ido|to|cho)\\b", practice: "conj" },
  future: { pattern: "\\b(podría|quisiera|gustaría|sería|llegará|vendrá|tendría|vas a|va a)\\b", practice: "conj" },
  porpara: { pattern: "\\b(por|para)\\b", practice: "errors", error: "porpara" },
  imperative: { pattern: "\\b(siga|dé|pase|pasen|firme|espere|llene|traiga|tome|bájeme|siéntese|abra|regrese|deme|mira|cuéntame|pásale|avísame|mándame|márcame)\\b", practice: "conj" },
  subjunctive: { pattern: "\\b(que (le |te |se )?(vaya|mejore|mejores|diviertan|descanses|llegue)|cuando (llegue|llegues|se acaben)|ojalá)\\b", practice: "conj", error: "subj" },
  compare: { pattern: "\\b(más|menos|tan) [a-záéíóúñ]+ (que|como)\\b|\\b(mejor|peor|mayor|menor)\\b", practice: "build" },
  relatives: { pattern: "\\b(lo que|el que|la que|con quien|donde)\\b", practice: "build" },
  se: { pattern: "\\bse (renta|rentan|vende|venden|aceptan|permite|puede|me|nos|le|cayó)\\b", practice: "build" },
  pluperfect: { pattern: "\\bhabía[n]? [a-záéíóúñ]+(ado|ido|to|cho)\\b", practice: "conj" },
  subjpast: { pattern: "\\b(quisiera|hubieras|fuera|tuviera|pudiera)\\b", practice: "conj" },
  conditionals: { pattern: "\\bsi (quieres|necesitas|tienes|insistes|no|mañana|hubiera)\\b", practice: "build" }
};

// Частые ошибки русскоязычных. pairs — задания для упражнения «Частые ошибки»:
// [что нужно сказать по-русски, правильно, типичная ошибка].
window.ES_ERRORS = [
  {
    id: "serestar", title: "Ser и estar: «я устал» — estoy, а не soy", lesson: "serestar",
    why: "По-русски одно «быть», а в испанском два. Состояние и место — estar, суть и профессия — ser.",
    pairs: [["Я устал.", "Estoy cansado.", "Soy cansado."], ["Банк на углу.", "El banco está en la esquina.", "El banco es en la esquina."], ["Я согласен.", "Estoy de acuerdo.", "Soy de acuerdo."]]
  },
  {
    id: "tener", title: "Возраст, голод, холод — через tener", lesson: "irregular",
    why: "Испанцы «имеют» годы, голод и холод: tener años, tener hambre, tener frío.",
    pairs: [["Мне 30 лет.", "Tengo treinta años.", "Soy treinta años."], ["Мне холодно.", "Tengo frío.", "Estoy frío."], ["Я голоден.", "Tengo hambre.", "Estoy hambre."]]
  },
  {
    id: "article", title: "Артикль нужен чаще, чем кажется", lesson: "articles",
    why: "В русском артиклей нет, поэтому их пропускают. Говоря о чём-то в общем, испанцы ставят el/la: me gusta el café.",
    pairs: [["Мне нравится кофе.", "Me gusta el café.", "Me gusta café."], ["Жизнь здесь дешёвая.", "La vida aquí es barata.", "Vida aquí es barata."]]
  },
  {
    id: "gustar", title: "Gustar: нравится «что», а не «кому»", lesson: "gustar",
    why: "Глагол согласуется с тем, что нравится: me gusta (одно), me gustan (много). «Yo gusto» значит «я нравлюсь».",
    pairs: [["Мне нравятся тако.", "Me gustan los tacos.", "Me gusta los tacos."], ["Мне нравится этот город.", "Me gusta esta ciudad.", "Yo gusto esta ciudad."]]
  },
  {
    id: "porpara", title: "Por или para", lesson: "porpara",
    why: "Para — цель и получатель («для», «чтобы»). Por — причина, обмен, путь («за», «из-за», «через»).",
    pairs: [["Спасибо за помощь.", "Gracias por la ayuda.", "Gracias para la ayuda."], ["Это для тебя.", "Esto es para ti.", "Esto es por ti."], ["Я учу испанский, чтобы работать здесь.", "Estudio español para trabajar aquí.", "Estudio español por trabajar aquí."]]
  },
  {
    id: "hay", title: "Hay или está", lesson: "hay",
    why: "Hay — «есть, имеется» (что-то неопределённое). Está — где находится конкретная известная вещь.",
    pairs: [["Здесь есть аптека?", "¿Hay una farmacia aquí?", "¿Está una farmacia aquí?"], ["Где аптека?", "¿Dónde está la farmacia?", "¿Dónde hay la farmacia?"]]
  },
  {
    id: "personal-a", title: "Предлог a перед людьми", lesson: "objects",
    why: "Если действие направлено на человека, перед ним ставят a: veo a María, espero a mi amigo.",
    pairs: [["Я жду друга.", "Espero a mi amigo.", "Espero mi amigo."], ["Ты знаешь Марию?", "¿Conoces a María?", "¿Conoces María?"]]
  },
  {
    id: "negation", title: "Двойное отрицание — это норма", lesson: null,
    why: "Как и в русском, «не… ничего»: no sé nada, no viene nadie. Без no фраза звучит неправильно.",
    pairs: [["Я ничего не знаю.", "No sé nada.", "Sé nada."], ["Я никогда не вожу ночью.", "No manejo nunca de noche.", "Manejo nunca de noche."]]
  },
  {
    id: "adjorder", title: "Прилагательное — после существительного", lesson: "adjectives",
    why: "По-русски «красная машина», по-испански «машина красная»: un carro rojo.",
    pairs: [["У меня красная машина.", "Tengo un carro rojo.", "Tengo un rojo carro."], ["Это интересная книга.", "Es un libro interesante.", "Es un interesante libro."]]
  },
  {
    id: "false-friends", title: "Ложные друзья", lesson: null,
    why: "Embarazada — «беременная», а не «смущённая». Éxito — «успех», а не «выход». Largo — «длинный», а не «большой».",
    pairs: [["Мне неловко.", "Me da pena.", "Estoy embarazado."], ["Где выход?", "¿Dónde está la salida?", "¿Dónde está el éxito?"], ["Это большой дом.", "Es una casa grande.", "Es una casa larga."]]
  },
  {
    id: "past", title: "Два прошедших: pagué и pagaba", lesson: "imperfect",
    why: "Законченное событие — indefinido (ayer pagué). Привычка и фон в прошлом — imperfecto (antes vivía).",
    pairs: [["Вчера я заплатил за аренду.", "Ayer pagué la renta.", "Ayer pagaba la renta."], ["Когда я был маленьким, я жил в Москве.", "Cuando era niño, vivía en Moscú.", "Cuando fui niño, viví en Moscú."]]
  },
  {
    id: "en-a", title: "«В»: a — куда, en — где", lesson: "articles",
    why: "Направление — a (voy al banco), местонахождение — en (estoy en el banco).",
    pairs: [["Я иду в банк.", "Voy al banco.", "Voy en el banco."], ["Я в банке.", "Estoy en el banco.", "Estoy al banco."]]
  },
  {
    id: "cual", title: "«Какой у тебя номер?» — cuál, а не qué", lesson: "questions",
    why: "Когда выбираем значение из многих (номер, адрес, пароль), спрашивают ¿cuál es…?",
    pairs: [["Какой у тебя номер?", "¿Cuál es tu número?", "¿Qué es tu número?"], ["Какой у вас адрес?", "¿Cuál es su dirección?", "¿Qué es su dirección?"]]
  },
  {
    id: "subj", title: "«Хочу, чтобы…» и «когда…» о будущем — субхунтив", lesson: "subjunctive",
    why: "После querer que, para que и cuando о будущем нужен субхунтив: quiero que vengas, cuando llegues.",
    pairs: [["Я хочу, чтобы ты пришёл.", "Quiero que vengas.", "Quiero que vienes."], ["Когда приедешь, позвони.", "Cuando llegues, llámame.", "Cuando llegarás, llámame."]]
  },
  {
    id: "gente", title: "La gente — в единственном числе", lesson: null,
    why: "«Люди» по-испански — собирательное слово в единственном числе: la gente es amable.",
    pairs: [["Люди здесь дружелюбные.", "La gente aquí es amable.", "La gente aquí son amables."]]
  }
];
