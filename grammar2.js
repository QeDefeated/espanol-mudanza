// Уроки уровня B1. Формат как в grammar.js.
window.ES_LESSONS = (window.ES_LESSONS || []).concat([
  {
    id: "compare", level: "B1", title: "Сравнения", es: "Comparativos y superlativos",
    intro: "<p>Сравнение строится через <b>más … que</b> (больше, чем), <b>menos … que</b> (меньше, чем) и <b>tan … como</b> (такой же, как). С существительными — <b>tanto/tanta/tantos/tantas … como</b>.</p><p>Превосходная степень: <b>el/la más …</b> — «самый». А суффикс <b>-ísimo</b> значит «очень-очень»: <i>caro → carísimo, rico → riquísimo</i>.</p>",
    tables: [{ cap: "Конструкции", head: ["Значение", "Конструкция", "Пример"], rows: [
      ["больше, чем", "más + прил. + que", "Aquí la renta es más barata que en Moscú."],
      ["меньше, чем", "menos + прил. + que", "El metro es menos cómodo que el Uber."],
      ["такой же, как", "tan + прил. + como", "Mi español no es tan bueno como el tuyo."],
      ["столько же, сколько", "tanto/a/os/as + сущ. + como", "No tengo tantos amigos como aquí."],
      ["самый", "el/la/los/las + más + прил.", "Es el barrio más seguro de la ciudad."],
      ["очень-очень", "прил. + -ísimo", "Los tacos están riquísimos."]
    ] }, { cap: "Неправильные формы", head: ["Обычная", "Сравнительная", "Пример"], rows: [
      ["bueno / bien", "mejor", "Este café es mejor que el otro."],
      ["malo / mal", "peor", "Hoy el tráfico está peor que ayer."],
      ["grande (о возрасте)", "mayor", "Mi hermano es mayor que yo."],
      ["pequeño (о возрасте)", "menor", "Mi hija es la menor."]
    ] }],
    examples: [["Guadalajara es más tranquila que la Ciudad de México.", "Гвадалахара спокойнее Мехико."], ["Este departamento es tan grande como el otro, pero más caro.", "Эта квартира такая же большая, как та, но дороже."], ["Es la mejor taquería del barrio.", "Это лучшая такерия района."], ["¡Está carísimo!", "Это ужасно дорого!"]],
    tips: ["«Чем» перед числом — <b>de</b>, а не que: <i>Cuesta más de mil pesos.</i>", "-ísimo меняет орфографию: <i>rico → riquísimo, largo → larguísimo, feliz → felicísimo</i>.", "«Как можно скорее» — <i>lo más pronto posible</i>."],
    quiz: [
      { q: "El metro es ___ rápido ___ el camión.", o: ["más … que", "más … como", "tan … que"], a: 0, e: "Больше, чем — más … que." },
      { q: "Mi español no es ___ bueno como el tuyo.", o: ["tan", "tanto", "más"], a: 0, e: "С прилагательным — tan … como." },
      { q: "Este restaurante es ___ que el otro. (лучше)", o: ["más bueno", "mejor", "más mejor"], a: 1, e: "bueno → mejor." },
      { q: "Cuesta más ___ quinientos pesos.", o: ["que", "de", "como"], a: 1, e: "Перед числом — más de." },
      { q: "«Очень-очень вкусно»:", o: ["riquísimo", "ricoísimo", "muy riquísimo"], a: 0, e: "rico → riquísimo (c → qu)." }
    ]
  },
  {
    id: "relatives", level: "B1", title: "«Который»: que, quien, donde, lo que", es: "Pronombres relativos",
    intro: "<p>Чтобы соединить две фразы, как русское «который», чаще всего используют <b>que</b> — для людей и предметов: <i>El departamento que vi ayer…</i></p><p>После предлога о людях говорят <b>quien/quienes</b> или <b>el que / la que</b>: <i>la persona con quien hablé</i>. О месте — <b>donde</b>. Если речь не о конкретном слове, а о целой мысли — <b>lo que</b> («то, что»).</p>",
    tables: [{ cap: "Кто что заменяет", head: ["Слово", "Когда", "Пример"], rows: [
      ["que", "почти всегда: люди и вещи", "El vecino que vive arriba es muy amable."],
      ["quien / quienes", "о людях после предлога", "Es la chica con quien trabajo."],
      ["el que / la que…", "после предлога; «тот, кто»", "El que llegue primero, gana."],
      ["donde", "место", "Es el café donde nos conocimos."],
      ["lo que", "то, что (мысль, ситуация)", "No entiendo lo que dices."],
      ["cuyo / cuya", "чей (книжное)", "Es el señor cuyo carro está mal estacionado."]
    ] }],
    examples: [["La señora que me rentó el departamento es muy amable.", "Сеньора, которая сдала мне квартиру, очень любезная."], ["Es el banco donde abrí mi cuenta.", "Это банк, где я открыл счёт."], ["Lo que más me gusta de aquí es la comida.", "Больше всего мне здесь нравится еда."], ["Ese es el amigo con quien vine.", "Вот друг, с которым я приехал."]],
    tips: ["Que нельзя опускать, как в английском: <i>el libro que leí</i>, а не «el libro leí».", "«Всё, что» — <i>todo lo que</i>: <i>Es todo lo que tengo.</i>"],
    quiz: [
      { q: "El carro ___ compré es usado.", o: ["que", "quien", "lo que"], a: 0, e: "Предмет без предлога — que." },
      { q: "Es la persona con ___ hablé ayer.", o: ["que", "quien", "donde"], a: 1, e: "Человек после предлога — quien." },
      { q: "No entiendo ___ quieres decir.", o: ["que", "lo que", "el que"], a: 1, e: "«То, что» — lo que." },
      { q: "Este es el mercado ___ compro la fruta.", o: ["donde", "que", "quien"], a: 0, e: "Место — donde." },
      { q: "«Это всё, что у меня есть»:", o: ["Es todo que tengo.", "Es todo lo que tengo.", "Es todo quien tengo."], a: 1, e: "todo lo que." }
    ]
  },
  {
    id: "se", level: "B1", title: "Безличное se и «se me olvidó»", es: "El «se» impersonal",
    intro: "<p>Частица <b>se</b> помогает говорить без конкретного исполнителя, как русские «говорят», «сдаётся», «нужно»: <i>Se habla español. Se rentan departamentos.</i> Глагол согласуется с предметом: <i>se renta</i> один, <i>se rentan</i> много.</p><p>Особая конструкция <b>se + me/te/le + глагол</b> показывает, что что-то случилось «само», без умысла: <i>Se me olvidó. Se me cayó el celular. Se nos acabó el gas.</i> Так в Латинской Америке говорят постоянно.</p>",
    tables: [{ cap: "Безличное se", head: ["Пример", "Перевод"], rows: [
      ["Se renta departamento.", "Сдаётся квартира."],
      ["Se venden tortillas.", "Продаются тортильи."],
      ["¿Cómo se dice…?", "Как говорят…? Как сказать…?"],
      ["Aquí no se puede fumar.", "Здесь нельзя курить."],
      ["Se necesita experiencia.", "Требуется опыт."]
    ] }, { cap: "«Случайное» se", head: ["Пример", "Перевод"], rows: [
      ["Se me olvidaron las llaves.", "Я забыл ключи (так вышло)."],
      ["Se me cayó el vaso.", "У меня упал стакан."],
      ["Se me rompió la pantalla.", "У меня разбился экран."],
      ["Se nos acabó el agua.", "У нас кончилась вода."],
      ["Se le descompuso el carro.", "У него сломалась машина."]
    ] }],
    examples: [["Se rentan cuartos para estudiantes.", "Сдаются комнаты студентам."], ["¿Dónde se compran los boletos?", "Где покупают билеты?"], ["Perdón, se me hizo tarde.", "Простите, я задержался."], ["Se me perdió la cartera en el metro.", "Я потерял кошелёк в метро."]],
    tips: ["Глагол согласуется с вещью, а не с человеком: <i>se me olvidó la llave</i>, но <i>se me olvidaron las llaves</i>.", "Объявления на улице: <i>Se renta, Se vende, Se solicita personal</i> — «Требуются сотрудники»."],
    quiz: [
      { q: "___ departamentos amueblados.", o: ["Se renta", "Se rentan", "Rentan se"], a: 1, e: "Много квартир — se rentan." },
      { q: "«Я забыл паспорт» (случайно):", o: ["Se me olvidó el pasaporte.", "Me se olvidó el pasaporte.", "Se olvidé el pasaporte."], a: 0, e: "se + me + глагол в 3-м лице." },
      { q: "Se me ___ las llaves.", o: ["cayó", "cayeron", "caí"], a: 1, e: "Llaves — мн. ч.: cayeron." },
      { q: "¿Cómo ___ «квартира» en español?", o: ["se dice", "dice se", "se dicen"], a: 0, e: "¿Cómo se dice…?" },
      { q: "«Требуются официанты» на вывеске:", o: ["Se solicitan meseros.", "Solicitan se meseros.", "Se solicita meseros."], a: 0, e: "Мн. ч. — se solicitan." }
    ]
  },
  {
    id: "pluperfect", level: "B1", title: "Предпрошедшее: había hecho", es: "Pretérito pluscuamperfecto", drill: "plusc",
    intro: "<p>Когда в рассказе о прошлом нужно сказать, что одно действие произошло <b>ещё раньше</b> другого, используют <b>había + причастие</b>: <i>Cuando llegué, el camión ya se había ido</i> — «Когда я пришёл, автобус уже ушёл».</p><p>Часто идёт со словами <i>ya</i> (уже), <i>nunca</i> (никогда раньше), <i>todavía no</i> (ещё не).</p>",
    tables: [{ cap: "Haber в imperfecto + причастие", head: ["Лицо", "Форма", "Пример"], rows: [
      ["yo", "había", "había comido"], ["tú", "habías", "habías visto"], ["él / usted", "había", "había llegado"], ["nosotros", "habíamos", "habíamos pagado"], ["ellos / ustedes", "habían", "habían salido"]
    ] }],
    examples: [["Nunca había vivido en otro país.", "Я никогда раньше не жил в другой стране."], ["Cuando llegamos, la tienda ya había cerrado.", "Когда мы пришли, магазин уже закрылся."], ["No sabía que ya habías pagado.", "Я не знал, что ты уже заплатил."], ["Me dijo que había perdido el pasaporte.", "Он сказал, что потерял паспорт."]],
    tips: ["Причастия те же, что в perfecto: <i>hecho, dicho, visto, puesto, vuelto, escrito, abierto, roto</i>.", "В пересказе чужих слов «он сказал, что сделал» — тоже había: <i>Dijo que había llamado.</i>"],
    quiz: [
      { q: "Cuando llegué, la película ya ___ (empezar).", o: ["empezó", "había empezado", "ha empezado"], a: 1, e: "Действие раньше другого прошлого — había + причастие." },
      { q: "Nosotros nunca ___ (probar) el mole.", o: ["habíamos probado", "habíamos probamos", "hemos probando"], a: 0, e: "habíamos + probado." },
      { q: "Причастие от «volver»:", o: ["volvido", "vuelto", "volvió"], a: 1, e: "volver → vuelto." },
      { q: "Me dijo que ya ___ (hacer) la reservación.", o: ["había hecho", "había hacido", "hizo hecho"], a: 0, e: "hacer → hecho." }
    ]
  },
  {
    id: "subjpast", level: "B1", title: "Субхунтив прошедшего: si tuviera…", es: "Imperfecto de subjuntivo", drill: "subjImp",
    intro: "<p>Эта форма нужна для «если бы» и для желаний/просьб в прошлом: <i>Si tuviera tiempo, viajaría más. Me pidió que lo llamara.</i></p><p>Образуется очень просто: берём форму <b>ellos</b> из претерита, убираем <b>-ron</b> и добавляем <b>-ra, -ras, -ra, -ramos, -ran</b>. <i>hablaron → hablara, tuvieron → tuviera, fueron → fuera</i>. В форме nosotros появляется ударение: <i>habláramos, tuviéramos</i>.</p>",
    tables: [{ cap: "Образование", head: ["Инфинитив", "ellos (pretérito)", "Субхунтив прошедшего"], rows: [
      ["hablar", "hablaron", "hablara, hablaras, hablara, habláramos, hablaran"],
      ["comer", "comieron", "comiera, comieras, comiera, comiéramos, comieran"],
      ["tener", "tuvieron", "tuviera, tuvieras, tuviera, tuviéramos, tuvieran"],
      ["ser / ir", "fueron", "fuera, fueras, fuera, fuéramos, fueran"],
      ["poder", "pudieron", "pudiera, pudieras, pudiera, pudiéramos, pudieran"],
      ["decir", "dijeron", "dijera, dijeras, dijera, dijéramos, dijeran"]
    ] }, { cap: "Когда нужен", head: ["Ситуация", "Пример"], rows: [
      ["si + нереальное условие", "Si tuviera carro, iría a la playa."],
      ["просьба/желание в прошлом", "Me pidió que llegara temprano."],
      ["como si — как будто", "Habla como si fuera mexicano."],
      ["вежливая просьба", "Quisiera un café, por favor."],
      ["ojalá — несбыточное", "Ojalá estuvieras aquí."]
    ] }],
    examples: [["Si hablara mejor español, buscaría otro trabajo.", "Если бы я лучше говорил по-испански, я бы искал другую работу."], ["El doctor me dijo que tomara mucha agua.", "Врач сказал мне пить много воды."], ["Quisiera hacer una cita.", "Я хотел бы записаться."], ["Ojalá pudiera ver a mi familia más seguido.", "Хотел бы я видеть семью почаще."]],
    tips: ["Есть вторая форма на -se (<i>hablase, tuviese</i>), в Латинской Америке её почти не используют.", "Quisiera — самая вежливая форма «я хочу»: в магазине и учреждениях звучит отлично."],
    quiz: [
      { q: "Si ___ (tener) dinero, compraría una casa.", o: ["tengo", "tuviera", "tendría"], a: 1, e: "Нереальное условие: si + субхунтив прошедшего." },
      { q: "Me pidió que ___ (llamar) mañana.", o: ["llamo", "llamara", "llamaré"], a: 1, e: "Просьба в прошлом → llamara." },
      { q: "Субхунтив прошедшего от «ser», nosotros:", o: ["fuéramos", "seríamos", "éramos"], a: 0, e: "fueron → fuera → fuéramos." },
      { q: "Habla como si ___ (ser) el jefe.", o: ["es", "fuera", "sea"], a: 1, e: "como si + субхунтив прошедшего." },
      { q: "Вежливое «я хотел бы»:", o: ["Quiero", "Quisiera", "Quería que"], a: 1, e: "Quisiera — самая вежливая форма." }
    ]
  },
  {
    id: "conditionals", level: "B1", title: "Условные предложения: si…", es: "Oraciones condicionales",
    intro: "<p>Три главных типа «если».</p><p><b>Реальное</b> условие: <i>si</i> + настоящее, дальше настоящее, будущее или повеление. <i>Si llueve, me quedo en casa.</i></p><p><b>Нереальное сейчас</b> («если бы»): <i>si</i> + субхунтив прошедшего, дальше condicional. <i>Si tuviera tiempo, te ayudaría.</i></p><p><b>Нереальное в прошлом</b> («если бы тогда»): <i>si hubiera</i> + причастие, дальше <i>habría</i> + причастие. <i>Si hubiera sabido, te habría llamado.</i></p>",
    tables: [{ cap: "Схемы", head: ["Тип", "Если…", "…то", "Пример"], rows: [
      ["реальное", "si + presente", "presente / futuro / imperativo", "Si quieres, te llevo."],
      ["нереальное сейчас", "si + imperfecto de subjuntivo", "condicional", "Si viviera cerca, iría a pie."],
      ["нереальное в прошлом", "si + hubiera + participio", "habría + participio", "Si hubiera llegado antes, no habría perdido el vuelo."]
    ] }],
    examples: [["Si necesitas algo, me avisas.", "Если что-то понадобится, скажи мне."], ["Si tienes tiempo, llámame.", "Если будет время, позвони."], ["Si fuera tú, rentaría más cerca del trabajo.", "На твоём месте я бы снял жильё поближе к работе."], ["Si hubiera sabido el precio, no lo habría comprado.", "Если бы я знал цену, я бы это не купил."]],
    tips: ["После si никогда не ставят будущее время или condicional: <i>si tengo</i>, а не «si tendré»; <i>si tuviera</i>, а не «si tendría».", "«На твоём месте» — <i>si yo fuera tú</i> или просто <i>yo que tú…</i>"],
    quiz: [
      { q: "Si ___ (llover), no salimos.", o: ["llueve", "lloverá", "llovería"], a: 0, e: "Реальное условие: si + presente." },
      { q: "Si tuviera más tiempo, ___ (estudiar) más.", o: ["estudio", "estudiaría", "estudiara"], a: 1, e: "Нереальное: вторая часть в condicional." },
      { q: "Si ___ (saber), te habría ayudado.", o: ["sabía", "hubiera sabido", "habría sabido"], a: 1, e: "Нереальное прошлое: si + hubiera + причастие." },
      { q: "«На твоём месте я бы…»:", o: ["Si fuera tú…", "Si sería tú…", "Si eres tú…"], a: 0, e: "si + fuera." },
      { q: "Si ___ (necesitar) ayuda, llámame.", o: ["necesitarás", "necesitas", "necesitarías"], a: 1, e: "После si не ставят будущее." }
    ]
  }
]);
